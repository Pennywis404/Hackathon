"use client";

import { DocCubes, type DocPhase } from "@/components/doc-cubes";
import type { Progress } from "@/components/review-provider";

/**
 * Revue en cours : l'amas de cubes tourne pendant tout le traitement, un cube sort par acte similaire
 * dès qu'ils sont trouvés, et l'amas implose à la dernière étape. Le libellé de l'étape courante sert de statut.
 */
export function ProgressSteps({ progress, fileName }: { progress: Progress; fileName?: string }) {
  const docs = (progress.docs ?? []).map((name) => ({ id: name, name }));
  const phase: DocPhase = progress.step === "fichier" ? "imploding" : docs.length > 0 ? "found" : "searching";
  return (
    <div className="mx-auto w-full max-w-[760px] px-5 pb-44 pt-20">
      <p className="eyebrow">Reviewing{fileName ? ` · ${fileName}` : ""}</p>
      <div className="mt-8">
        <DocCubes phase={phase} docs={docs} size={140} status={`${progress.label}…`} />
      </div>
    </div>
  );
}
