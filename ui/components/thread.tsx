"use client";

import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ClauseSheet } from "@/components/clause-sheet";
import { ReviewCard } from "@/components/review-card";
import { type Clause, type Exigence, type ReviewContext, computeScore } from "@/lib/review";

/** Le LLM renvoie parfois du `**gras**` : on le rend, sans dépendance markdown. */
function renderBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong> : part,
  );
}

export function Thread({ ctx }: { ctx: ReviewContext }) {
  const [exigence, setExigence] = useState<Exigence>(ctx.exigence);
  const [selected, setSelected] = useState<Clause | null>(null);

  // Le score se recalcule côté client quand on change l'exigence (même règle que scoring.py).
  const score = useMemo(() => (exigence === ctx.exigence ? ctx.score : computeScore(ctx.clauses, exigence)), [ctx, exigence]);
  const byId = useMemo(() => new Map(ctx.clauses.map((c) => [c.id, c])), [ctx]);

  const priorites = (ctx.reponse.priorites ?? []).map((id) => byId.get(id)).filter((c): c is Clause => !!c);
  const questions = ctx.reponse.questions_suite ?? [];

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-8 px-5 pb-44 pt-10">
      {/* Message du junior */}
      <div className="flex items-start justify-end gap-3">
        <div className="max-w-[640px] rounded-xl bg-muted px-4 py-3 text-[15px] leading-relaxed">
          <p>Here is version {ctx.version} of the PV for the {ctx.dossier} capital increase. Can you review it against the matter?</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-[13px]">
            <FileText className="size-4 text-muted-foreground" />
            <span className="font-medium">{ctx.pv}</span>
          </div>
        </div>
        <Avatar className="size-8"><AvatarFallback className="bg-foreground text-[12px] text-background">L</AvatarFallback></Avatar>
      </div>

      {/* Réponse : texte du LLM (respond.py), puis la carte calculée */}
      <div className="space-y-5 text-[15px] leading-[1.65]">
        {ctx.reponse.resume ? (
          <p>{renderBold(ctx.reponse.resume)}</p>
        ) : (
          <p className="text-muted-foreground">No written feedback for this version yet (run respond.py).</p>
        )}

        <ReviewCard clauses={ctx.clauses} score={score} exigence={exigence} onExigence={setExigence}
          selected={selected} onSelect={setSelected} precedents={ctx.precedents} corpus={ctx.corpus} />

        {priorites.length > 0 && (
          <div>
            <p className="eyebrow">Fix first</p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-6">
              {priorites.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => setSelected(c)} className="text-left underline-offset-4 hover:underline">{c.libelle}</button>
                  {ctx.reponse.par_clause?.[c.id]?.pourquoi_ici && (
                    <span className="text-muted-foreground"> — {ctx.reponse.par_clause[c.id].pourquoi_ici}</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {questions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {questions.map((q) => (
            <button key={q} type="button" disabled className="rounded-lg border bg-background px-3.5 py-2 text-left text-[14px] text-muted-foreground">{q}</button>
          ))}
        </div>
      )}

      <ClauseSheet clause={selected} reponse={ctx.reponse} onClose={() => setSelected(null)} />
    </div>
  );
}
