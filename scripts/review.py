"""Revue live d'un PV pour l'UI : prepare → respond → données UI, JSON sur stdout.

    .venv/bin/python scripts/review.py mon_pv.pdf --exigence standard --dossier helianthe [--version 4]

Tout l'affichage du pipeline part sur stderr ; stdout ne contient que le JSON (lu par /api/review).
"""
import argparse
import contextlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import pipeline  # noqa: E402
import respond  # noqa: E402
from scripts.ui_data import build  # noqa: E402


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("pv", type=Path)
    ap.add_argument("--exigence", default="standard", choices=["standard", "max"])
    ap.add_argument("--dossier", default="helianthe")
    ap.add_argument("--dossier-label", default="Hélianthe Technologies")
    ap.add_argument("--version", type=int, default=0)
    a = ap.parse_args()

    with contextlib.redirect_stdout(sys.stderr):
        ctx = pipeline.prepare(a.pv, a.exigence, None, out=Path("/dev/null"), dossier=a.dossier)
        ctx["reponse"] = respond.respond(ctx)
        import chromadb
        import config
        col = chromadb.PersistentClient(path=config.DB_PATH).get_collection(config.COLLECTION)
        sources = {m["source"] for m in col.get(where={"dossier": "general"}, include=["metadatas"])["metadatas"]}
        corpus = {"actes": sum(s.lower().endswith(".pdf") for s in sources),
                  "templates": sum(s.lower().endswith(".docx") for s in sources), "chunks": col.count()}
        data = build(ctx, a.version, a.dossier_label, corpus)
    json.dump(data, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
