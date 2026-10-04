"""Cas similaires : les n précédents du cabinet les plus proches d'un brouillon.

Classement, dans l'ordre : même type d'opération (obligatoire si possible) → même nature
(AGE / AGO / décision) → même forme sociale → meilleure couverture de la grille (`brut`) →
date la plus récente. Chaque cas rend ses raisons, affichées dans l'UI.

    python similar.py "legora-files-2026-10-04/PV AG - 01 V1 Augmentation de capital en numéraire.docx" -n 3
"""
import argparse
import json
from datetime import date
from pathlib import Path

import analyze
import qualify
import scoring
import sources
from corpus_index import INDEX_PATH

WEIGHTS = {"type": 100, "nature": 30, "forme": 25, "brut": 0.5, "recence": 4}  # recence : points par année, max 5 ans


def load_index(path: Path = INDEX_PATH, only_ingested: bool = True) -> list[dict]:
    """Index des précédents ; par défaut restreint aux sources présentes dans la base (parents réutilisables)."""
    if not path.exists():
        return []
    entries = json.loads(path.read_text(encoding="utf-8"))
    if only_ingested:
        try:
            from corpus_index import ingested_sources
            keep = ingested_sources()
            entries = [e for e in entries if e["source"] in keep]
        except Exception:  # noqa: BLE001  (base absente : on garde tout)
            pass
    return entries


def _years_ago(iso: str) -> float:
    try:
        d = date.fromisoformat(iso)
    except ValueError:
        return 10.0
    return max(0.0, (date.today() - d).days / 365.25)


def rank(draft: dict, index: list[dict], n: int = 3) -> list[dict]:
    """draft : {type_operation, forme, nature}. Retourne les n meilleurs avec `points` et `raisons`."""
    scored = []
    for e in index:
        pts, raisons = 0.0, []
        if e["type_operation"] == draft["type_operation"]:
            pts += WEIGHTS["type"]; raisons.append("même type d'opération")
        if draft.get("nature") and e.get("nature") == draft["nature"]:
            pts += WEIGHTS["nature"]; raisons.append(f"même nature ({e['nature']})")
        if draft.get("forme") and e.get("forme") == draft["forme"]:
            pts += WEIGHTS["forme"]; raisons.append(f"même forme sociale ({e['forme']})")
        pts += WEIGHTS["brut"] * e.get("brut", 0)
        raisons.append(f"couverture de la grille {e.get('brut', 0)}/100")
        rec = max(0.0, 5 - _years_ago(e.get("date", ""))) * WEIGHTS["recence"]
        pts += rec
        if e.get("date"):
            raisons.append(f"acte du {e['date']}")
        scored.append({**e, "points": round(pts, 1), "raisons": raisons})
    scored.sort(key=lambda x: (-x["points"], x["source"]))
    return scored[:n]


def similar_cases(pv_path: Path, n: int = 3, pv_text: str | None = None, type_operation: str | None = None) -> dict:
    text = pv_text or sources.strip_training_banner(analyze.read_document(pv_path))
    qual = qualify.qualify(text, pv_path.name)
    if type_operation is None:
        type_operation = scoring.detect_type(text, scoring.load_grille())["type_operation"]
    draft = {"type_operation": type_operation, **qual}
    return {"brouillon": draft, "cas": rank(draft, load_index(), n)}


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pv", type=Path)
    ap.add_argument("-n", type=int, default=3)
    a = ap.parse_args()
    res = similar_cases(a.pv, a.n)
    print("Brouillon :", json.dumps(res["brouillon"], ensure_ascii=False))
    for i, c in enumerate(res["cas"], 1):
        print(f"\n{i}. {c['source']}  ({c['points']} pts)\n   {c['societe']} · {c['forme'] or '?'} · {c['nature'] or '?'} · {c['date'] or '?'} · brut {c['brut']}\n   " + " ; ".join(c["raisons"]))
