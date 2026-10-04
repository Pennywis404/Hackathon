"""Normalisation de format, en amont du découpage : chaque fichier devient des Documents
{texte, meta}. Le nettoyage de contenu et le préfixe de citation se font après, par chunk.

Formats : .pdf (couche texte ou OCR, un document par page), .eml (mail), .txt / .md
(transcript de réunion ou note). Métadonnées communes, toutes scalaires (contrainte Chroma) :
    source, page, categorie, dossier, source_type (document|mail|reunion|note), date, auteur, titre
"""
import re
from email import policy
from email.parser import BytesParser
from email.utils import parsedate_to_datetime
from pathlib import Path

from ocr import extract_pages

REUNION_RE = re.compile(r"reunion|réunion|call|meeting|transcript|visio", re.I)
DATE_RE = re.compile(r"(20\d{2})[-_](\d{2})[-_](\d{2})")
EXTENSIONS = {".pdf", ".eml", ".txt", ".md"}


def _meta(rel: Path, dossier: str, **extra) -> dict:
    base = {
        "source": str(rel),
        "page": 0,
        "categorie": rel.parts[0] if len(rel.parts) > 1 else "general",
        "dossier": dossier,
        "source_type": "document",
        "date": "",
        "auteur": "",
        "titre": rel.stem,
    }
    base.update({k: v for k, v in extra.items() if v is not None})
    return base


def _date_from_name(name: str) -> str:
    m = DATE_RE.search(name)
    return f"{m.group(1)}-{m.group(2)}-{m.group(3)}" if m else ""


def load_pdf(path: Path, rel: Path, dossier: str) -> list[dict]:
    return [{"text": t, "meta": _meta(rel, dossier, page=n)} for n, t in extract_pages(path)]


def load_eml(path: Path, rel: Path, dossier: str) -> list[dict]:
    msg = BytesParser(policy=policy.default).parsebytes(path.read_bytes())
    body = msg.get_body(preferencelist=("plain", "html"))
    text = body.get_content() if body else ""
    if body and body.get_content_type() == "text/html":
        text = re.sub(r"<[^>]+>", " ", text)
    date = ""
    if msg["date"]:
        try:
            date = parsedate_to_datetime(msg["date"]).date().isoformat()
        except (TypeError, ValueError):
            date = ""
    text = f"Objet : {msg['subject'] or ''}\n\n{text.strip()}"
    return [{"text": text, "meta": _meta(rel, dossier, page=1, source_type="mail", date=date,
                                         auteur=str(msg["from"] or ""), titre=str(msg["subject"] or rel.stem))}]


def load_text(path: Path, rel: Path, dossier: str) -> list[dict]:
    text = path.read_text(encoding="utf-8", errors="replace").strip()
    kind = "reunion" if REUNION_RE.search(str(rel)) else "note"
    return [{"text": text, "meta": _meta(rel, dossier, page=1, source_type=kind, date=_date_from_name(str(rel)))}]


LOADERS = {".pdf": load_pdf, ".eml": load_eml, ".txt": load_text, ".md": load_text}


def load(path: Path, root: Path, dossier: str = "general") -> list[dict]:
    """Un fichier → liste de Documents (vide si rien d'extractible)."""
    loader = LOADERS.get(path.suffix.lower())
    if loader is None:
        return []
    return [d for d in loader(path, path.relative_to(root), dossier) if d["text"].strip()]


def iter_files(root: Path) -> list[Path]:
    return sorted(p for p in root.rglob("*") if p.is_file() and p.suffix.lower() in EXTENSIONS)


# --- après le découpage : nettoyage et préfixe de citation --------------------------------
def clean_chunk(text: str) -> str:
    """Retire les lignes citées des mails (« > ») et les tics d'oral ; "" si rien ne reste."""
    lines = [ln for ln in text.splitlines() if not ln.lstrip().startswith(">")]
    text = "\n".join(lines)
    text = re.sub(r"\b(euh+|hum+|hein)\b[,.]?\s*", "", text, flags=re.I)
    text = re.sub(r"[ \t]+", " ", text).strip()
    return text


def label(meta: dict) -> str:
    """Préfixe embarqué avec le chunk : c'est ce que la réponse finale pourra citer."""
    kind, date, auteur, titre = meta["source_type"], meta["date"], meta["auteur"], meta["titre"]
    if kind == "mail":
        return f"Mail de {auteur}, {date} — {titre}".replace(", —", " —")
    if kind == "reunion":
        return f"Réunion {date} — {titre}".replace("Réunion  —", "Réunion —")
    if kind == "note":
        return f"Note {date} — {titre}".replace("Note  —", "Note —")
    return f"{titre} (p.{meta['page']})"
