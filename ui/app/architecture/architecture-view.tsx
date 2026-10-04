"use client";

import { useState } from "react";
import s from "./architecture.module.css";

type Tone = "ing" | "ana" | "out";
type Node = { n: string; title: string; text: string; tone: Tone; chips?: { label: string; key?: boolean }[] };

/* ---------------- Vue d'ensemble ---------------- */
const FEED: Node[] = [
  { n: "01", title: "Firm documents", text: "PVs, decisions, deeds and guides exported from iManage.", tone: "ing" },
  { n: "02", title: "Ingestion", text: "PDFs are read and split along their legal structure.", tone: "ing" },
  { n: "03", title: "Knowledge base", text: "Semantic search, with source, page and section.", tone: "ing" },
];
const ANALYZE: Node[] = [
  { n: "04", title: "AGM minutes", text: "The document to improve, uploaded as a PDF.", tone: "ana" },
  { n: "05", title: "Analysis agent", text: "It reads the PV and looks up best practices, section by section.", tone: "ana" },
  { n: "06", title: "Report and score", text: "Sourced recommendations and a compliance score.", tone: "out" },
  { n: "07", title: "Back into the base", text: "The improved PV enriches the next analyses.", tone: "out" },
];

/* ---------------- Vue technique ---------------- */
const PHASE1: Node[] = [
  { n: "SOURCE", title: "iManage", text: "Text PDF export (~180 acts).", tone: "ing",
    chips: [{ label: "PDF" }, { label: "category = folder" }] },
  { n: "01", title: "Extraction", text: "Blocks, tables, removal of page footers and tables of contents.", tone: "ing",
    chips: [{ label: "PyMuPDF", key: true }, { label: "find_tables" }] },
  { n: "02", title: "Structural chunking", text: "One decision or article = one unit. Tables in Markdown. Annexes kept apart.", tone: "ing",
    chips: [{ label: "min 300" }, { label: "max 1500" }, { label: "parent ≤ 6000" }, { label: "overlap 100" }] },
  { n: "03", title: "Embeddings", text: "Each chunk is prefixed with company, act, date and section.", tone: "ing",
    chips: [{ label: "mistral-embed", key: true }, { label: "1024 dim" }, { label: "batches of 32" }] },
  { n: "04", title: "Storage", text: "Small chunks are searched; the whole unit is handed to the LLM.", tone: "ing",
    chips: [{ label: "ChromaDB · cosine", key: true }, { label: "SQLite parents", key: true }] },
];
const PHASE2: Node[] = [
  { n: "INPUT", title: "AGM minutes", text: "Text PDF to improve.", tone: "ana", chips: [{ label: "PyMuPDF", key: true }] },
  { n: "05", title: "Decomposition", text: "Sections: quorum, officers, resolutions, votes, signatures.", tone: "ana",
    chips: [{ label: "mistral-large-latest", key: true }, { label: "JSON" }] },
  { n: "06", title: "Retrieval", text: "Several queries per section, merged by unit, distance threshold.", tone: "ana",
    chips: [{ label: "top-5 / query" }, { label: "top-6 / section" }, { label: "dist ≤ 0.75" }] },
  { n: "07", title: "Recommendations", text: "Only from the retrieved passages, with sources cited.", tone: "ana",
    chips: [{ label: "mistral-large-latest", key: true }] },
];
const OUTPUTS: Node[] = [
  { n: "08", title: "Scoring", text: "The PV is compared with the retrieved best practices.", tone: "out" },
  { n: "09", title: "Summary", text: "Strengths, priorities, points not covered.", tone: "out" },
  { n: "OUTPUT", title: ".md report", text: "Statuses, recommendations, file · page · section.", tone: "out" },
  { n: "10", title: "Back into the base", text: "Improved PV and score, re-ingested after validation.", tone: "out" },
];
const CHOICES: [string, React.ReactNode][] = [
  ["Extraction", <><code>PyMuPDF</code>: blocks, tables, page positions</>],
  ["Chunking", "Legal structure rather than fixed size"],
  ["Embeddings", <><code>mistral-embed</code> (API); BGE-M3 and Qwen3 to benchmark</>],
  ["Index", <><code>ChromaDB</code> cosine, filterable metadata</>],
  ["Parents", <><code>SQLite</code>: the whole unit goes to the LLM</>],
  ["LLM", <><code>mistral-large-latest</code>, JSON output and tools</>],
  ["Agent", "Mistral function calling, single search tool"],
];
const METADATA = ["source", "categorie", "doc_type", "societe", "acte", "date_acte", "section", "section_num", "chunk_type", "annexe", "page", "parent_id"];
const ROUTER = ["decision_president", "decision_associes", "pv_ag", "traite", "document_structure", "generic"];
const MODULES: [string, string][] = [
  ["ingest · chunking · parents", "Phase 1"],
  ["analyze · agent", "Phase 2"],
  ["retrieval", "Search and tool"],
  ["llm · config", "Mistral calls, settings"],
];

function Flow({ nodes }: { nodes: Node[] }) {
  return (
    <div className={s.flow}>
      {nodes.map((node) => (
        <div key={node.n + node.title} className={`${s.node} ${s[node.tone]}`}>
          <div className={s.n}>{node.n}</div>
          <h3>{node.title}</h3>
          <p>{node.text}</p>
          {node.chips && (
            <div className={s.chips}>
              {node.chips.map((c) => (
                <span key={c.label} className={c.key ? `${s.chip} ${s.chipK}` : s.chip}>{c.label}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Loop({ children }: { children: React.ReactNode }) {
  return <div className={s.loop}><i />{children}<i /></div>;
}

export function ArchitectureView() {
  const [view, setView] = useState<"v1" | "v2">("v1");
  const [dark, setDark] = useState(false);

  return (
    <div className={s.root} data-theme={dark ? "dark" : "light"}>
      <div className={s.wrap}>
        <section className={s.hero}>
          <div>
            <div className={s.eyebrow}>mistral × law · architecture</div>
            <h1 className={s.title}>From the AGM minutes<br />to best practices.</h1>
            <p className={s.sub}>
              An agent reads your PV, queries the firm&apos;s document base, explains how to improve it and scores it.
              The resulting document enriches the base.
            </p>
          </div>
          <button type="button" className={s.btn} onClick={() => setDark((d) => !d)} aria-label="Toggle theme">
            {dark ? "Light theme" : "Dark theme"}
          </button>
        </section>

        <div className={s.tabs} role="tablist">
          <button type="button" role="tab" aria-selected={view === "v1"} className={`${s.btn} ${view === "v1" ? s.btnOn : ""}`} onClick={() => setView("v1")}>Overview</button>
          <button type="button" role="tab" aria-selected={view === "v2"} className={`${s.btn} ${view === "v2" ? s.btnOn : ""}`} onClick={() => setView("v2")}>Technical view</button>
        </div>

        {view === "v1" ? (
          <section key="v1" className={s.view}>
            <div className={`${s.lane} ${s.big}`}>
              <div className={s.laneH}><span className={s.sq} style={{ background: "var(--ing)" }} />Feeding the base</div>
              <div className={s.pixels}><b className={s.a} /><b /><b className={s.b} /><b /><b className={s.a} /><b /></div>
              <Flow nodes={FEED} />
            </div>

            <div className={s.bridge}><span>the base is queried <b>on every analysis</b></span></div>

            <div className={`${s.lane} ${s.big}`}>
              <div className={s.laneH}><span className={s.sq} style={{ background: "var(--ana)" }} />Analysing a PV</div>
              <Flow nodes={ANALYZE} />
              <Loop>once validated, the resulting document joins the knowledge base</Loop>
            </div>

            <div className={s.legend}>
              <span><i className={s.sq} style={{ background: "var(--ing)" }} />Ingestion</span>
              <span><i className={s.sq} style={{ background: "var(--ana)" }} />Analysis</span>
              <span><i className={s.sq} style={{ background: "var(--out)" }} />Deliverables</span>
            </div>
          </section>
        ) : (
          <section key="v2" className={s.view}>
            <div className={s.lane}>
              <div className={s.laneH}><span className={s.sq} style={{ background: "var(--ing)" }} />Phase 1 — Ingestion (ingest.py)</div>
              <Flow nodes={PHASE1} />
              <Loop>resumable: file fingerprint, errors isolated per document</Loop>
            </div>

            <div className={s.bridge}><span>tool <b>search_best_practices(query, categorie)</b> · function calling</span></div>

            <div className={s.lane}>
              <div className={s.laneH}><span className={s.sq} style={{ background: "var(--ana)" }} />Phase 2 — Analysis (analyze.py · agent.py)</div>
              <Flow nodes={PHASE2} />
              <Loop>repeated for each section of the PV · or agent loop (25 turns max)</Loop>
              <div style={{ marginTop: 14 }}><Flow nodes={OUTPUTS} /></div>
            </div>

            <div className={s.cols}>
              <div className={s.card}>
                <h4>Technical choices</h4>
                <table className={s.table}>
                  <thead><tr><th>Component</th><th>Choice</th></tr></thead>
                  <tbody>{CHOICES.map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}</tbody>
                </table>
              </div>
              <div className={s.card}>
                <h4>Metadata per chunk</h4>
                <div className={s.chips} style={{ marginTop: 0 }}>
                  {METADATA.map((m) => <span key={m} className={s.chip}>{m}</span>)}
                </div>
                <h4 style={{ marginTop: 22 }}>Document type router</h4>
                <div className={s.chips} style={{ marginTop: 0 }}>
                  {ROUTER.map((m) => <span key={m} className={s.chip}>{m}</span>)}
                </div>
              </div>
              <div className={s.card}>
                <h4>Modules</h4>
                <table className={s.table}>
                  <tbody>{MODULES.map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        <footer className={s.footer}>Mistral × LAW · architecture diagram · the style is inspired by the corti.ai identity, without reusing its logo.</footer>
      </div>
    </div>
  );
}
