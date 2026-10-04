"""Ingestion des documents de best practices (PDF texte) dans la base vectorielle.

Usage :
    python ingest.py docs/                 # indexe tous les PDF (récursif)
    python ingest.py docs/ --reset         # repart d'une base vide

Organisation conseillée : un sous-dossier par catégorie
    docs/modeles_pv/…, docs/guides_internes/…, docs/juridique/…
Le nom du sous-dossier est stocké comme métadonnée « categorie ».
"""
import argparse
import hashlib
import re
from pathlib import Path

import chromadb
import pymupdf

import config
import llm


def get_collection(reset: bool = False):
    client = chromadb.PersistentClient(path=config.DB_PATH)
    if reset:
        try:
            client.delete_collection(config.COLLECTION)
        except Exception:  # noqa: BLE001
            pass
    return client.get_or_create_collection(
        config.COLLECTION, metadata={"hnsw:space": "cosine"}
    )


def extract_pages(pdf_path: Path) -> list[tuple[int, str]]:
    """Retourne [(numéro_de_page, texte)] ; ignore les pages vides (scans)."""
    pages = []
    with pymupdf.open(pdf_path) as doc:
        for i, page in enumerate(doc, start=1):
            text = page.get_text("text").strip()
            if text:
                pages.append((i, text))
    return pages


def split_text(text: str, size: int, overlap: int) -> list[str]:
    """Découpe par paragraphes, en regroupant jusqu'à `size` caractères."""
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    # Un paragraphe trop long est redécoupé par phrases.
    units: list[str] = []
    for p in paragraphs:
        if len(p) <= size:
            units.append(p)
        else:
            units.extend(s.strip() for s in re.split(r"(?<=[.!?;:])\s+", p) if s.strip())

    chunks, current = [], ""
    for u in units:
        if current and len(current) + len(u) + 1 > size:
            chunks.append(current)
            current = current[-overlap:] + " " + u if overlap else u
        else:
            current = f"{current}\n{u}" if current else u
    if current.strip():
        chunks.append(current)
    return chunks


def ingest(docs_dir: Path, reset: bool = False) -> None:
    pdfs = sorted(docs_dir.rglob("*.pdf"))
    if not pdfs:
        raise SystemExit(f"Aucun PDF trouvé dans {docs_dir}")
    col = get_collection(reset)
    print(f"{len(pdfs)} PDF à traiter → collection « {config.COLLECTION} »")

    total = 0
    for pdf in pdfs:
        rel = pdf.relative_to(docs_dir)
        categorie = rel.parts[0] if len(rel.parts) > 1 else "general"
        pages = extract_pages(pdf)
        if not pages:
            print(f"  - {rel} : aucun texte extractible (scan ?) → ignoré")
            continue

        ids, texts, metas = [], [], []
        for page_no, page_text in pages:
            for j, chunk in enumerate(
                split_text(page_text, config.CHUNK_SIZE, config.CHUNK_OVERLAP)
            ):
                uid = hashlib.sha1(f"{rel}|{page_no}|{j}|{chunk}".encode()).hexdigest()
                ids.append(uid)
                texts.append(chunk)
                metas.append(
                    {"source": str(rel), "page": page_no, "categorie": categorie}
                )

        # On embedde le texte précédé du titre du document : meilleur rappel.
        to_embed = [f"{Path(m['source']).stem} (p.{m['page']})\n{t}" for t, m in zip(texts, metas)]
        embeddings = llm.embed(to_embed)
        col.upsert(ids=ids, documents=texts, metadatas=metas, embeddings=embeddings)
        total += len(ids)
        print(f"  + {rel} : {len(pages)} pages, {len(ids)} passages")

    print(f"Terminé : {total} passages indexés ({col.count()} au total dans la base).")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("docs_dir", type=Path)
    ap.add_argument("--reset", action="store_true", help="vide la base avant ingestion")
    args = ap.parse_args()
    ingest(args.docs_dir, args.reset)
