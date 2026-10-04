"""Ingestion des documents (PDF, mails .eml, transcripts .txt/.md) dans la base vectorielle.

Usage :
    python ingest.py docs/                                  # bonnes pratiques (récursif)
    python ingest.py dossiers/acme --dossier acme           # contexte d'un dossier client
    python ingest.py docs/ --reset                          # repart d'une base vide

Le premier sous-dossier donne la métadonnée « categorie » ; le format donne « source_type »
(document | mail | reunion | note). Voir sources.py pour la normalisation.
"""
import argparse
import hashlib
import re
from pathlib import Path

import chromadb

import config
import llm
import sources
from ocr import extract_pages  # noqa: F401  (couche texte, sinon Mistral OCR)


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


def ingest(docs_dir: Path, reset: bool = False, dossier: str = "general") -> None:
    files = sources.iter_files(docs_dir)
    if not files:
        raise SystemExit(f"Aucun fichier exploitable ({', '.join(sorted(sources.EXTENSIONS))}) dans {docs_dir}")
    col = get_collection(reset)
    print(f"{len(files)} fichiers à traiter → collection « {config.COLLECTION} », dossier « {dossier} »")

    total = 0
    for path in files:
        rel = path.relative_to(docs_dir)
        docs = sources.load(path, docs_dir, dossier)
        if not docs:
            print(f"  - {rel} : aucun texte extractible (même après OCR) → ignoré")
            continue

        ids, texts, metas, to_embed = [], [], [], []
        for doc in docs:
            meta = doc["meta"]
            for j, raw in enumerate(split_text(doc["text"], config.CHUNK_SIZE, config.CHUNK_OVERLAP)):
                chunk = sources.clean_chunk(raw)  # nettoyage après découpage
                if not chunk:
                    continue
                ids.append(hashlib.sha1(f"{rel}|{meta['page']}|{j}|{chunk}".encode()).hexdigest())
                texts.append(chunk)
                metas.append(meta)
                # Le préfixe de citation est embarqué, pas stocké : meilleur rappel, texte brut conservé.
                to_embed.append(f"{sources.label(meta)}\n{chunk}")

        if not ids:
            continue
        embeddings = llm.embed(to_embed)
        col.upsert(ids=ids, documents=texts, metadatas=metas, embeddings=embeddings)
        total += len(ids)
        print(f"  + {rel} [{docs[0]['meta']['source_type']}] : {len(docs)} partie(s), {len(ids)} passages")

    print(f"Terminé : {total} passages indexés ({col.count()} au total dans la base).")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("docs_dir", type=Path)
    ap.add_argument("--reset", action="store_true", help="vide la base avant ingestion")
    ap.add_argument("--dossier", default="general", help="nom du dossier client (métadonnée « dossier »)")
    args = ap.parse_args()
    ingest(args.docs_dir, args.reset, args.dossier)
