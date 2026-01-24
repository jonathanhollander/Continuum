"""
File Storage Utilities
Handles local filesystem storage with S3-compatible interface for future migration
"""
import os
import shutil
import logging
from pathlib import Path
from typing import BinaryIO, Optional, Tuple
from uuid import uuid4
import boto3
from botocore.exceptions import ClientError, BotoCoreError

from backend.config import settings

logger = logging.getLogger(__name__)


class LocalStorage:
    """
    Local filesystem storage implementation.
    """

    def __init__(self, base_dir: str = None):
        self.base_dir = base_dir or settings.UPLOAD_DIR
        self._ensure_base_dir()

    def _ensure_base_dir(self):
        """Ensure the base upload directory exists"""
        Path(self.base_dir).mkdir(parents=True, exist_ok=True)

    def _get_target_dir(self, user_id: int, module: str, category: str = "uncategorized") -> Path:
        """Get target directory: uploads/{user_id}/{category}/{module}"""
        # Note: category comes before module per user request
        target_dir = Path(self.base_dir) / str(user_id) / category / module
        target_dir.mkdir(parents=True, exist_ok=True)
        return target_dir

    def save_file(
        self,
        file_data: BinaryIO,
        user_id: int,
        original_filename: str,
        module: str = "general",
        category: str = "uncategorized"
    ) -> str:
        """Save file to local disk"""
        target_dir = self._get_target_dir(user_id, module, category)

        # Generate unique filename
        file_ext = Path(original_filename).suffix.lower()
        unique_filename = f"{uuid4()}{file_ext}"
        file_path = target_dir / unique_filename

        # Save file
        # Ensure we are at the start of the stream
        if file_data.seekable():
            file_data.seek(0)
            
        with open(file_path, 'wb') as f:
            shutil.copyfileobj(file_data, f)

        # Return relative path for database: {user_id}/{category}/{module}/{filename}
        return str(Path(str(user_id)) / category / module / unique_filename)

    def delete_file(self, storage_path: str) -> bool:
        """Delete file from local disk"""
        file_path = Path(self.base_dir) / storage_path
        if file_path.exists():
            file_path.unlink()
            return True
        return False

    def get_file_path(self, storage_path: str) -> Path:
        """Get absolute path"""
        return Path(self.base_dir) / storage_path
        
    def file_exists(self, storage_path: str) -> bool:
        return self.get_file_path(storage_path).exists()


class S3Storage:
    """
    S3/MinIO storage implementation.
    """
    def __init__(self):
        self.bucket_name = settings.AWS_BUCKET_NAME
        self.client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            endpoint_url=settings.AWS_ENDPOINT_URL,
            region_name=settings.AWS_REGION_NAME
        )

    def save_file(
        self,
        file_data: BinaryIO,
        user_id: int,
        original_filename: str,
        module: str = "general",
        category: str = "uncategorized"
    ) -> str:
        """Save file to S3/MinIO"""
        file_ext = Path(original_filename).suffix.lower()
        unique_filename = f"{uuid4()}{file_ext}"
        
        # S3 Key: {user_id}/{category}/{module}/{filename}
        s3_key = f"{user_id}/{category}/{module}/{unique_filename}"

        if file_data.seekable():
            file_data.seek(0)

        self.client.upload_fileobj(file_data, self.bucket_name, s3_key)
        return s3_key

    def delete_file(self, storage_path: str) -> bool:
        """Delete file from S3"""
        try:
            self.client.delete_object(Bucket=self.bucket_name, Key=storage_path)
            return True
        except ClientError:
            return False

    def generate_presigned_url(self, storage_path: str, expiration=3600) -> str:
        """Generate temporary download URL"""
        try:
            return self.client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': storage_path},
                ExpiresIn=expiration
            )
        except ClientError:
            return ""


class HybridStorage:
    """
    Hybrid storage manager that handles S3 with Local fallback.
    """
    def __init__(self):
        self.local = LocalStorage()
        self.s3 = None
        
        if settings.S3_ENABLED:
            try:
                self.s3 = S3Storage()
            except Exception as e:
                logger.error(f"Failed to initialize S3 storage: {e}")

    def save_file(
        self,
        file_data: BinaryIO,
        user_id: int,
        original_filename: str,
        module: str = "general",
        category: str = "uncategorized"
    ) -> Tuple[str, str]:
        """
        Save file, attempting S3 first then Local.
        
        Returns:
            Tuple[str, str]: (storage_path, provider)
            provider is "s3" or "local"
        """
        # Try S3 first
        if self.s3:
            try:
                storage_path = self.s3.save_file(
                    file_data, user_id, original_filename, module, category
                )
                return storage_path, "s3"
            except (ClientError, BotoCoreError, Exception) as e:
                logger.warning(f"S3 upload failed, falling back to local: {e}")
                # Reset stream position for fallback
                if file_data.seekable():
                    file_data.seek(0)

        # Fallback to Local
        storage_path = self.local.save_file(
            file_data, user_id, original_filename, module, category
        )
        return storage_path, "local"

    def delete_file(self, storage_path: str, provider: str = "local") -> bool:
        """Delete file based on provider"""
        if provider == "s3" and self.s3:
            try:
                return self.s3.delete_file(storage_path)
            except Exception as e:
                logger.error(f"Failed to delete S3 file: {e}")
                return False
        
        return self.local.delete_file(storage_path)

    def get_file_path(self, storage_path: str) -> Path:
        """Get local file path (only valid for local provider)"""
        return self.local.get_file_path(storage_path)
        
    def get_presigned_url(self, storage_path: str) -> str:
        """Get S3 presigned URL"""
        if self.s3:
            return self.s3.generate_presigned_url(storage_path)
        return ""


# Global storage instance
storage = HybridStorage()
