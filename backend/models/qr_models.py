from typing import Optional
from sqlmodel import Field, SQLModel

class QRAccessPack(SQLModel, table=True):
    """Model for QR Access Packs, providing physical-to-digital bridge."""
    __tablename__ = "qr_access_packs"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    pack_name: str
    status: str = Field(default="inactive") # active, inactive
    token_encrypted: str # The token encoded in the QR
    scanned_count: int = Field(default=0)
    last_scanned: Optional[str] = None

class QRAssetLabel(SQLModel, table=True):
    """Model for individual QR labels attached to assets."""
    __tablename__ = "qr_asset_labels"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    asset_id: str # Link to asset (UUID or numeric)
    label_id: str = Field(unique=True) # The unique ID on the sticker
    status: str = Field(default="linked") # linked, unlinked, lost
