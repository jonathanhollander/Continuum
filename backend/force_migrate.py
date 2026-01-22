from backend.database import migrate_db
from backend.utils.logger import get_logger

logger = get_logger(__name__)

logger.info("Forcing DB Migration...")
migrate_db()
logger.info("Done.")
