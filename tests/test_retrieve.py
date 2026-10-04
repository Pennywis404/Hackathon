"""Recherche multi-requêtes : fusion, seuil de distance, filtre catégorie, top-k."""
import analyze
import config


def _sources(passages):
    return [p["meta"]["source"] for p in passages]


def test_best_match_comes_first(indexed):
    res = analyze.retrieve(indexed, ["quorum constate en debut de seance"], None)
    assert res, "aucun passage retrouvé"
    assert res[0]["meta"] == {"source": "guides_internes/guide.pdf", "page": 1, "categorie": "guides_internes"}
    assert "quorum" in res[0]["text"]
    assert set(res[0]) == {"text", "meta", "distance"}


def test_results_sorted_by_distance(indexed, monkeypatch):
    monkeypatch.setattr(config, "MAX_DISTANCE", 2.0)  # tout passe
    res = analyze.retrieve(indexed, ["quorum", "resolution voix"], None)
    dists = [p["distance"] for p in res]
    assert dists == sorted(dists)


def test_multi_query_dedups_by_id_keeping_best_distance(indexed, monkeypatch):
    monkeypatch.setattr(config, "MAX_DISTANCE", 2.0)
    one = analyze.retrieve(indexed, ["quorum debut seance"], None)
    two = analyze.retrieve(indexed, ["quorum debut seance", "feuille de presence signee"], None)
    # Chaque page du corpus tient en un chunk : (source, page) identifie un chunk.
    keys = [(p["meta"]["source"], p["meta"]["page"]) for p in two]
    assert len(keys) == len(set(keys)), "doublon dans les passages fusionnés"
    assert len(two) == len(one) == indexed.count()  # tout le corpus, une fois chacun
    best = next(p for p in two if p["meta"]["page"] == 1 and p["meta"]["source"].endswith("guide.pdf"))
    only = next(p for p in one if p["meta"]["page"] == 1 and p["meta"]["source"].endswith("guide.pdf"))
    assert best["distance"] <= only["distance"]


def test_max_distance_drops_unrelated_passages(indexed, monkeypatch):
    query = ["xylophone zebre kangourou"]
    monkeypatch.setattr(config, "MAX_DISTANCE", 0.75)
    assert analyze.retrieve(indexed, query, None) == []
    monkeypatch.setattr(config, "MAX_DISTANCE", 2.0)
    assert analyze.retrieve(indexed, query, None) != []


def test_categorie_filter(indexed, monkeypatch):
    monkeypatch.setattr(config, "MAX_DISTANCE", 2.0)
    query = ["assemblee designe un president et un secretaire"]
    # Sans filtre, le modèle de PV est le meilleur résultat.
    assert analyze.retrieve(indexed, query, None)[0]["meta"]["source"] == "modeles_pv/modele.pdf"
    # Avec filtre, seule la catégorie demandée est retournée.
    res = analyze.retrieve(indexed, query, "guides_internes")
    assert res and set(_sources(res)) == {"guides_internes/guide.pdf"}


def test_top_k_per_section_caps_results(indexed, monkeypatch):
    monkeypatch.setattr(config, "MAX_DISTANCE", 2.0)
    monkeypatch.setattr(config, "TOP_K_PER_SECTION", 1)
    assert len(analyze.retrieve(indexed, ["quorum", "votes", "president"], None)) == 1
