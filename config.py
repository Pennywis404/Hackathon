"""Configuration centrale du RAG « PV d'AG »."""
import os
from pathlib import Path

BASE_DIR = Path(__file__).parent


def _load_dotenv(path: Path) -> None:
    """Charge `.env` (KEY=valeur) sans écraser les variables déjà exportées."""
    if not path.is_file():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.removeprefix("export ").strip()
        os.environ.setdefault(key, value.strip().strip("'\""))


_load_dotenv(BASE_DIR / ".env")

# --- Mistral -----------------------------------------------------------------
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
EMBED_MODEL = os.getenv("EMBED_MODEL", "mistral-embed")
# ministral-14b : accessible sur le palier gratuit ; mistral-large/medium ne le sont pas.
CHAT_MODEL = os.getenv("CHAT_MODEL", "ministral-14b-latest")
OCR_MODEL = os.getenv("OCR_MODEL", "mistral-ocr-latest")

# Mode hors-ligne pour tester le pipeline sans clé API (embeddings factices).
FAKE_EMBEDDINGS = os.getenv("FAKE_EMBEDDINGS", "0") == "1"

# --- Base vectorielle ----------------------------------------------------------
DB_PATH = os.getenv("RAG_DB_PATH", str(BASE_DIR / "chroma_db"))
COLLECTION = "best_practices_pv"

# --- Découpage des documents ---------------------------------------------------
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1000"))       # caractères
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "150"))  # caractères

# --- Recherche -----------------------------------------------------------------
TOP_K_PER_QUERY = int(os.getenv("TOP_K_PER_QUERY", "5"))
TOP_K_PER_SECTION = int(os.getenv("TOP_K_PER_SECTION", "6"))
# Distance cosinus maximale (0 = identique, 2 = opposé). Au-delà, passage ignoré.
MAX_DISTANCE = float(os.getenv("MAX_DISTANCE", "0.75"))
