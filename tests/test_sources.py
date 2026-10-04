"""Normalisation de format (sources.py) : eml, txt, pdf, nettoyage et préfixe de citation."""
from pathlib import Path

import ingest
import pipeline
import sources
from conftest import make_pdf

EML = b"""From: Me Claire Dupont <c.dupont@ex.fr>
To: stagiaire@ex.fr
Date: Mon, 14 Sep 2026 09:12:00 +0200
Subject: Suppression du DPS
Content-Type: text/plain; charset="utf-8"

Il faut la suppression du DPS au profit d'Alpha.

> Le 11 sept., Marc a ecrit :
> Les historiques peuvent-ils souscrire ?
"""


def test_load_eml(tmp_path):
    root = tmp_path / "d"
    f = root / "mails" / "a.eml"
    f.parent.mkdir(parents=True)
    f.write_bytes(EML)
    [doc] = sources.load(f, root, dossier="novatech")
    m = doc["meta"]
    assert m["source_type"] == "mail" and m["dossier"] == "novatech" and m["categorie"] == "mails"
    assert m["date"] == "2026-09-14" and "Dupont" in m["auteur"] and m["titre"] == "Suppression du DPS"
    assert doc["text"].startswith("Objet : Suppression du DPS") and "au profit d'Alpha" in doc["text"]
    assert all(isinstance(v, (str, int, float, bool)) for v in m.values())  # contrainte Chroma


def test_load_transcript_and_note(tmp_path):
    root = tmp_path / "d"
    (root / "reunions").mkdir(parents=True)
    t = root / "reunions" / "2026-09-11_call_alpha.txt"
    t.write_text("Sophie : il nous faut le DPS supprime.", encoding="utf-8")
    n = root / "memo.md"
    n.write_text("Memo interne.", encoding="utf-8")
    [doc] = sources.load(t, root)
    assert doc["meta"]["source_type"] == "reunion" and doc["meta"]["date"] == "2026-09-11"
    [doc] = sources.load(n, root)
    assert doc["meta"]["source_type"] == "note" and doc["meta"]["date"] == "" and doc["meta"]["categorie"] == "general"


def test_load_pdf_one_doc_per_page(tmp_path):
    pdf = make_pdf(tmp_path / "g.pdf", ["Page un.", "", "Page trois."])
    docs = sources.load(pdf, tmp_path)
    assert [d["meta"]["page"] for d in docs] == [1, 3]
    assert all(d["meta"]["source_type"] == "document" for d in docs)


def test_unknown_extension_and_empty_file(tmp_path):
    (tmp_path / "x.docx").write_text("x")
    (tmp_path / "vide.txt").write_text("   ")
    assert sources.load(tmp_path / "x.docx", tmp_path) == []
    assert sources.load(tmp_path / "vide.txt", tmp_path) == []
    assert sources.iter_files(tmp_path) == [tmp_path / "vide.txt"]


def test_clean_chunk_removes_quotes_and_fillers():
    raw = "Il faut, euh, le DPS supprimé.\n> ancien mail cité\nHum, d'accord."
    assert sources.clean_chunk(raw) == "Il faut, le DPS supprimé.\nd'accord."
    assert sources.clean_chunk("> tout cité\n> encore") == ""


def test_label_by_source_type():
    base = {"page": 2, "titre": "guide", "date": "", "auteur": ""}
    assert sources.label({**base, "source_type": "document"}) == "guide (p.2)"
    assert sources.label({**base, "source_type": "mail", "auteur": "Me X", "date": "2026-09-14", "titre": "DPS"}) == "Mail de Me X, 2026-09-14 — DPS"
    assert sources.label({**base, "source_type": "reunion", "date": "2026-09-11", "titre": "call"}) == "Réunion 2026-09-11 — call"


# --- ingestion d'un dossier mixte + contexte oral par clause -------------------------------
def test_ingest_dossier_and_contexte_dossier(tmp_path):
    root = tmp_path / "dossier"
    (root / "mails").mkdir(parents=True)
    (root / "reunions").mkdir()
    (root / "mails" / "a.eml").write_bytes(EML)
    (root / "reunions" / "2026-09-11_call.txt").write_text(
        "Sophie Martin : suppression du droit preferentiel de souscription au profit d'Alpha Capital, beneficiaire denomme.", encoding="utf-8")
    make_pdf(root / "guide.pdf", ["Le quorum doit etre constate."])
    ingest.ingest(root, dossier="novatech")
    col = ingest.get_collection()
    types = {m["source_type"] for m in col.get(include=["metadatas"])["metadatas"]}
    assert types == {"mail", "reunion", "document"}
    # Les lignes citées « > » ne sont pas stockées.
    assert not any(">" in d for d in col.get(include=["documents"])["documents"])

    clauses = [{"id": "suppression_dps", "libelle": "Suppression du droit preferentiel de souscription au profit de beneficiaires denommes"},
               {"id": "quorum", "libelle": "Quorum constate"}]
    oral = pipeline.contexte_dossier(col, clauses, "novatech")
    assert set(oral) == {"suppression_dps", "quorum"}
    assert oral["suppression_dps"], "aucune trace orale trouvée pour le DPS"
    assert {p["source_type"] for p in oral["suppression_dps"]} <= {"mail", "reunion", "note"}  # jamais le guide PDF
    assert oral["suppression_dps"][0]["citation"].startswith(("Réunion 2026-09-11", "Mail de"))
    # Un autre dossier ne voit rien.
    assert all(v == [] for v in pipeline.contexte_dossier(col, clauses, "autre").values())
