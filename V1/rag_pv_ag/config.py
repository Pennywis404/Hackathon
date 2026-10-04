"""Configuration centrale du RAG Â« PV d'AG Â»."""
import os
from pathlib import Path

BASE_DIR = Path(__file__).parent

# --- Mistral -----------------------------------------------------------------
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
EMBED_MODEL = os.getenv("EMBED_MODEL", "mistral-embed")
CHAT_MODEL = os.getenv("CHAT_MODEL", "mistral-large-latest")

# Mode hors-ligne pour tester le pipeline sans clÃ© API (embeddings factices).
FAKE_EMBEDDINGS = os.getenv("FAKE_EMBEDDINGS", "0") == "1"

# --- Base vectorielle ----------------------------------------------------------
DB_PATH = os.getenv("RAG_DB_PATH", str(BASE_DIR / "chroma_db"))
COLLECTION = "best_practices_pv"

# --- DÃ©coupage structurel des documents (voir chunking.py) -----------------------
UNIT_MIN_CHARS = int(os.getenv("UNIT_MIN_CHARS", "300"))      # sous-articles plus courts : regroupÃ©s
UNIT_MAX_CHARS = int(os.getenv("UNIT_MAX_CHARS", "1500"))     # unitÃ©s plus longues : redÃ©coupÃ©es
PARENT_MAX_CHARS = int(os.getenv("PARENT_MAX_CHARS", "6000")) # taille max de l'unitÃ© rendue Ã  l'agent
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "100"))        # uniquement entre morceaux d'une mÃªme unitÃ©

# --- Recherche -----------------------------------------------------------------
TOP_K_PER_QUERY = int(os.getenv("TOP_K_PER_QUERY", "5"))
TOP_K_PER_SECTION = int(os.getenv("TOP_K_PER_SECTION", "6"))
# Distance cosinus maximale (0 = identique, 2 = opposÃ©). Au-delÃ , passage ignorÃ©.
MAX_DISTANCE = float(os.getenv("MAX_DISTANCE", "0.75"))