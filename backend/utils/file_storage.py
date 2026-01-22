"""
File Storage Utilities
Handles local filesystem storage with S3-compatible interface for future migration
"""
import os
import shutil
from pathlib import Path
from typing import BinaryIO, Optional
from uuid import uuid4
from backend.config import settings


class FileStorage:
    """
    File storage handler with local filesystem implementation.
    Designed to be easily swapped with S3 storage in production.
    """

    def __init__(self, base_dir: str = None):
        self.base_dir = base_dir or settings.UPLOAD_DIR
        self._ensure_base_dir()

    def _ensure_base_dir(self):
        """Ensure the base upload directory exists"""
        Path(self.base_dir).mkdir(parents=True, exist_ok=True)

    def _get_user_dir(self, user_id: int) -> Path:
        """Get user-specific directory for file isolation"""
        user_dir = Path(self.base_dir) / str(user_id)
        user_dir.mkdir(parents=True, exist_ok=True)
        return user_dir

    def save_file(
        self,
        file_data: BinaryIO,
        user_id: int,
        original_filename: str,
        module: str = "general"
    ) -> str:
        """
        Save a file to storage and return the storage path.

        Args:
            file_data: Binary file data stream
            user_id: User ID for file isolation
            original_filename: Original filename from upload
            module: Module name (heirlooms, properties, etc.)

        Returns:
            Relative storage path (e.g., "123/heirlooms/abc-def-ghi.jpg")
        """
        user_dir = self._get_user_dir(user_id)
        module_dir = user_dir / module
        module_dir.mkdir(exist_ok=True)

        # Generate unique filename while preserving extension
        file_ext = Path(original_filename).suffix.lower()
        unique_filename = f"{uuid4()}{file_ext}"
        file_path = module_dir / unique_filename

        # Save file
        with open(file_path, 'wb') as f:
            shutil.copyfileobj(file_data, f)

        # Return relative path for database storage
        return str(Path(str(user_id)) / module / unique_filename)

    def get_file_path(self, storage_path: str) -> Path:
        """
        Get absolute filesystem path from storage path.

        Args:
            storage_path: Relative storage path from database

        Returns:
            Absolute Path to file
        """
        return Path(self.base_dir) / storage_path

    def delete_file(self, storage_path: str) -> bool:
        """
        Delete a file from storage.

        Args:
            storage_path: Relative storage path from database

        Returns:
            True if deleted, False if file didn't exist
        """
        file_path = self.get_file_path(storage_path)
        if file_path.exists():
            file_path.unlink()
            return True
        return False

    def file_exists(self, storage_path: str) -> bool:
        """Check if a file exists in storage"""
        return self.get_file_path(storage_path).exists()

    def get_file_size(self, storage_path: str) -> Optional[int]:
        """Get file size in bytes, or None if file doesn't exist"""
        file_path = self.get_file_path(storage_path)
        if file_path.exists():
            return file_path.stat().st_size
        return None


# Global storage instance
storage = FileStorage()


# S3 Storage Implementation (Future)
# class S3Storage(FileStorage):
#     """
#     S3-compatible storage implementation for production.
#     Uses boto3 to interact with S3 or S3-compatible services.
#     """
#     def __init__(self, bucket_name: str, aws_access_key: str, aws_secret_key: str):
#         import boto3
#         self.bucket_name = bucket_name
#         self.s3_client = boto3.client(
#             's3',
#             aws_access_key_id=aws_access_key,
#             aws_secret_access_key=aws_secret_key
#         )
#
#     def save_file(self, file_data, user_id, original_filename, module="general"):
#         file_ext = Path(original_filename).suffix.lower()
#         unique_filename = f"{uuid4()}{file_ext}"
#         s3_key = f"{user_id}/{module}/{unique_filename}"
#
#         self.s3_client.upload_fileobj(file_data, self.bucket_name, s3_key)
#         return s3_key
#
#     def delete_file(self, storage_path):
#         self.s3_client.delete_object(Bucket=self.bucket_name, Key=storage_path)
#         return True
