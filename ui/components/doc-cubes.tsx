"use client";

import type { CSSProperties } from "react";
import { CubeField } from "@/components/cube-field";
import styles from "./doc-cubes.module.css";

export type DocThread = { label: string; href: string };
export type FoundDoc = { id: string; name: string; href?: string; threads?: DocThread[] };
/** searching : l'amas tourne · found : un cube sort par document · imploding : l'amas se referme · done : affichage */
export type DocPhase = "searching" | "found" | "imploding" | "done";

const POP_GAP_S = 0.45; // délai entre deux documents qui sortent

/** Recherche de documents en cubes bleus : un cube sort par document trouvé, l'amas implose, puis le résultat s'affiche. */
export function DocCubes({ phase, docs }: { phase: DocPhase; docs: FoundDoc[] }) {
  if (phase === "done") {
    const [main, ...others] = docs;
    if (!main) return <p className={styles.status}>No document found.</p>;
    return (
      <div className={styles.card}>
        <div className={styles.title}>
          <CubeField size={22} single />
          {main.href ? <a href={main.href} target="_blank" rel="noreferrer">{main.name}</a> : main.name}
        </div>
        {main.threads && main.threads.length > 0 && (
          <div className={styles.threads}>
            {main.threads.map((t) => <a key={t.label} href={t.href} target="_blank" rel="noreferrer" className={styles.thread}>{t.label}</a>)}
          </div>
        )}
        {others.length > 0 && <p className={styles.others}>Also found: {others.map((d) => d.name).join(" · ")}</p>}
      </div>
    );
  }

  const shown = phase === "searching" ? [] : docs;
  return (
    <div className={`${styles.row} ${phase === "imploding" ? styles.leaving : ""}`}>
      <CubeField size={84} imploding={phase === "imploding"} />
      <div>
        <p className={styles.status}>
          {phase === "searching" ? "Reading files…" : `${docs.length} document${docs.length > 1 ? "s" : ""} found`}
        </p>
        <div className={styles.chips}>
          {shown.map((d, i) => (
            <span key={d.id} className={styles.chip} style={{ animationDelay: `${i * POP_GAP_S}s` } as CSSProperties}>
              <CubeField size={22} single />
              {d.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Durée de la phase « found » pour `n` documents (le dernier cube a fini de sortir). */
export const foundDurationMs = (n: number) => Math.round((n * POP_GAP_S + 0.9) * 1000);
