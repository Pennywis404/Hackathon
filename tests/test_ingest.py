"""Découpage, extraction PDF et ingestion dans Chroma (hors-ligne)."""
import pytest

import ingest
from conftest import make_pdf


# --- split_text ------------------------------------------------------------------
def test_split_short_text_is_one_chunk():
    assert ingest.split_text("Un seul paragraphe.", size=1000, overlap=100) == ["Un seul paragraphe."]


def test_split_groups_paragraphs_up_to_size():
    text = "\n\n".join(f"Paragraphe {i}." for i in range(10))  # ~14 car. chacun
    chunks = ingest.split_text(text, size=40, overlap=0)
    assert len(chunks) > 1
    assert all(len(c) <= 40 for c in chunks)
    # Rien n'est perdu.
    assert all(f"Paragraphe {i}." in "\n".join(chunks) for i in range(10))


def test_split_long_paragraph_by_sentences():
    text = "Phrase une. Phrase deux. Phrase trois. Phrase quatre."
    chunks = ingest.split_text(text, size=25, overlap=0)
    assert len(chunks) >= 2
    assert "Phrase une." in chunks[0]


def test_split_overlap_repeats_tail_of_previous_chunk():
    text = "AAAAAAAAAA\n\nBBBBBBBBBB\n\nCCCCCCCCCC"
    chunks = ingest.split_text(text, size=12, overlap=4)
    assert chunks[0] == "AAAAAAAAAA"
    assert chunks[1].startswith("AAAA ")  # fin du chunk précédent recopiée


def test_split_empty_text():
    assert ingest.split_text("   \n\n  ", size=100, overlap=10) == []


# --- extract_pages -----------------------------------------------------------------
def test_extract_pages_skips_empty_pages(tmp_path):
    pdf = make_pdf(tmp_path / "x.pdf", ["Page un.", "", "Page trois."])
    pages = ingest.extract_pages(pdf)
    assert [n for n, _ in pages] == [1, 3]
    assert "Page un." in pages[0][1]


def test_extract_pages_scan_returns_nothing(tmp_path):
    pdf = make_pdf(tmp_path / "scan.pdf", ["", ""])
    assert ingest.extract_pages(pdf) == []


# --- ingest ---------------------------------------------------------------------------
def test_ingest_metadata_contract(docs_dir):
    ingest.ingest(docs_dir)
    col = ingest.get_collection()
    rows = col.get(include=["metadatas"])
    assert col.count() > 0
    for m in rows["metadatas"]:
        assert {"source", "page", "categorie", "dossier", "source_type", "date", "auteur", "titre"} <= set(m)
        assert m["source_type"] == "document" and m["dossier"] == "general"
    cats = {m["categorie"] for m in rows["metadatas"]}
    assert cats == {"guides_internes", "modeles_pv", "general"}
    # La catégorie vient du premier sous-dossier ; la racine donne "general".
    by_source = {m["source"]: m["categorie"] for m in rows["metadatas"]}
    assert by_source["guides_internes/guide.pdf"] == "guides_internes"
    assert by_source["racine.pdf"] == "general"


def test_ingest_stores_raw_chunk_not_prefixed(docs_dir):
    ingest.ingest(docs_dir)
    docs = ingest.get_collection().get(include=["documents"])["documents"]
    assert not any(d.startswith("guide (p.") for d in docs)


def test_ingest_skips_scanned_pdf(docs_dir, capsys):
    ingest.ingest(docs_dir)
    sources = {m["source"] for m in ingest.get_collection().get(include=["metadatas"])["metadatas"]}
    assert "guides_internes/scan.pdf" not in sources
    assert "scan.pdf : aucun texte extractible" in capsys.readouterr().out


def test_ingest_is_idempotent(docs_dir):
    ingest.ingest(docs_dir)
    n1 = ingest.get_collection().count()
    ingest.ingest(docs_dir)
    assert ingest.get_collection().count() == n1


def test_ingest_reset_wipes_collection(docs_dir, tmp_path):
    ingest.ingest(docs_dir)
    other = tmp_path / "docs2"
    make_pdf(other / "seul.pdf", ["Nouveau corpus."])
    ingest.ingest(other, reset=True)
    sources = {m["source"] for m in ingest.get_collection().get(include=["metadatas"])["metadatas"]}
    assert sources == {"seul.pdf"}


def test_ingest_no_pdf_exits(tmp_path):
    (tmp_path / "vide").mkdir()
    with pytest.raises(SystemExit):
        ingest.ingest(tmp_path / "vide")
