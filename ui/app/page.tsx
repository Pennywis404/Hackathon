import Image from "next/image";
import Link from "next/link";
import { ArrowRight, FileCheck2, Mail, MessageSquareQuote, Scale, ShieldCheck, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Col, Logo, SiteHeader } from "@/components/site-header";

const FEATURES = [
  {
    icon: Target,
    title: "A score calibrated to the matter",
    text: "Strictness follows the stakes: a large deal is reviewed at maximum exigence, a routine filing at standard. Same grid, different bar.",
  },
  {
    icon: FileCheck2,
    title: "Missing clauses by type of operation",
    text: "Capital increase, statutory amendment, annual approval: each has its expected clauses. A missing key clause costs 10 points, immediately.",
  },
  {
    icon: MessageSquareQuote,
    title: "Justified by what was said",
    text: "Every gap is traced back to the deal's emails and calls. The junior learns why a clause was negotiated, not just how to draft it.",
  },
];

const STEPS = [
  { n: "01", title: "Upload the draft PV", text: "PDF or scan. Text layer or OCR, we read it either way." },
  { n: "02", title: "Thread reviews it", text: "Type of operation, expected clauses, your firm's best practices, and the deal's oral context, retrieved and matched." },
  { n: "03", title: "Feedback that teaches", text: "Score, missing clauses, the quote from the call or the email that explains each one, and a suggested wording." },
];

const INTEGRATIONS = ["iManage", "Allegro", "Gmail", "Outlook", "Meeting transcripts", "Mistral"];

export default function Landing() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <SiteHeader />

      <main>
        {/* Hero noir */}
        <section className="dots-dark bg-ink text-white">
          <div className="relative mx-auto w-full max-w-[1100px] border-x border-white/10 px-6 pb-24 pt-20 md:pt-28">
            <Image src="/thread-mark.svg" alt="" width={498} height={477} priority className="pointer-events-none absolute right-6 top-16 hidden w-[300px] lg:block" />
            <p className="eyebrow text-white/60">For corporate law firms</p>
            <h1 className="mt-5 max-w-[860px] text-[44px] font-semibold leading-[1.08] md:text-[60px]">
              Your junior&apos;s PV, reviewed against <span className="underline decoration-brand decoration-[5px] underline-offset-[10px]">what was actually negotiated</span>.
            </h1>
            <p className="mt-6 max-w-[640px] text-[17px] leading-relaxed text-white/70">
              Thread scores a draft procès-verbal, finds the firm's closest precedents, and rewrites the missing clauses with
              the deal&apos;s emails and calls. Juniors improve faster; partners review less.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button className="h-11 rounded-lg bg-brand px-5 text-[15px] text-brand-foreground hover:bg-brand/85" nativeButton={false} render={<Link href="/app" />}>
                Open the demo workspace <ArrowRight className="size-4" />
              </Button>
              <Button variant="outline" className="h-11 rounded-lg border-white/25 bg-transparent px-5 text-[15px] font-normal text-white shadow-none hover:bg-white/10 hover:text-white" nativeButton={false} render={<a href="#how" />}>
                See how it works
              </Button>
            </div>
            <p className="mt-6 font-mono text-[12px] text-white/50">Demo matter: Hélianthe Technologies · draft scored 2/100 → corrected file 75/100 · 10 sourced changes</p>
          </div>
        </section>

        {/* Capture de l'app, à cheval sur le hero */}
        <section id="product" className="border-b">
          <Col className="px-6 pb-14">
            <div className="-mt-12 overflow-hidden rounded-md border bg-muted p-2">
              <Image
                src="/workspace-thread.png"
                alt="thread workspace: a draft PV reviewed in a chat, with a score, the missing key clauses and the oral traces behind each one."
                width={1600} height={1000} priority className="rounded-sm border"
              />
            </div>
            <p className="mt-4 font-mono text-[12px] text-muted-foreground">
              Real output: 200 acts, 129 drafting histories, the 3 closest precedents, and a corrected .docx where every change is sourced.</p>
          </Col>
        </section>

        {/* Trois bénéfices */}
        <section className="border-b">
          <Col className="px-6 py-20">
            <p className="eyebrow">Why it works</p>
            <div className="mt-8 grid gap-px overflow-hidden rounded-md border bg-border md:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="bg-background p-7">
                  <span className="flex size-9 items-center justify-center rounded-sm bg-muted"><Icon className="size-4" /></span>
                  <h2 className="mt-5 text-[18px] font-semibold">{title}</h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </Col>
        </section>

        {/* How it works */}
        <section id="how" className="border-b bg-muted">
          <Col className="px-6 py-20">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-4 text-[36px] font-semibold leading-[1.1]">Three steps, one grounded answer.</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.n} className="rounded-md border bg-background p-6">
                  <span className="font-mono text-[12px] text-muted-foreground">{s.n}</span>
                  <h3 className="mt-3 text-[17px] font-semibold">{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{s.text}</p>
                </div>
              ))}
            </div>
            <blockquote className="mt-12 max-w-[800px] border-l-2 border-brand pl-5 text-[20px] leading-relaxed">
              &ldquo;Sans suppression explicite du DPS, les associés existants (Antoine Vasseur, Camille Ferrand) pourraient souscrire en priorité, ce qui rendrait impossible l'entrée de Lumen Capital. Léa a mentionné dans son mail du 15 mars (v2) avoir 'isolé la résolution de suppression du DPS', mais elle n'apparaît pas dans le PV final.&rdquo;
              <footer className="mt-3 font-mono text-[12px] text-muted-foreground">Generated by Thread on draft V1 of the demo matter, from the partner's emails. Not a red mark in the margin.</footer>
            </blockquote>
          </Col>
        </section>

        {/* Intégrations + sécurité */}
        <section id="security" className="border-b">
          <Col className="grid gap-12 px-6 py-20 md:grid-cols-2">
            <div>
              <p className="eyebrow">Plugs into the firm&apos;s tools</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {INTEGRATIONS.map((name) => (
                  <span key={name} className="rounded-md border px-3 py-1.5 font-mono text-[13px]">{name}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="eyebrow">Built for confidential matters</p>
              <ul className="mt-5 grid gap-3 text-[15px] leading-relaxed text-muted-foreground">
                <li className="flex gap-3"><Scale className="mt-1 size-4 shrink-0 text-foreground" /> One workspace per matter; emails and calls never cross matters.</li>
                <li className="flex gap-3"><Mail className="mt-1 size-4 shrink-0 text-foreground" /> Every recommendation cites its source: file, page, email, or call timestamp.</li>
                <li className="flex gap-3"><ShieldCheck className="mt-1 size-4 shrink-0 text-foreground" /> Models by Mistral, a European provider; your document base stays yours.</li>
                <li className="flex gap-3"><Target className="mt-1 size-4 shrink-0 text-foreground" /> Legal points are flagged for partner validation, never decided by the model.</li>
              </ul>
            </div>
          </Col>
        </section>

        {/* CTA final noir */}
        <section className="dots-dark bg-ink text-white">
          <div className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-6 border-x border-white/10 px-6 py-16">
            <div>
              <p className="eyebrow text-white/60">Try it on the demo matter</p>
              <h2 className="mt-3 text-[32px] font-semibold leading-[1.1]">Review a draft. Read why.</h2>
            </div>
            <Button className="h-11 rounded-lg bg-brand px-5 text-[15px] text-brand-foreground hover:bg-brand/85" nativeButton={false} render={<Link href="/app" />}>
              Open the workspace <ArrowRight className="size-4" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <Col className="flex flex-wrap items-center justify-between gap-4 px-6 py-8 font-mono text-[12px] text-muted-foreground">
          <Logo />
          <p>Hackathon prototype, October 2026. Not legal advice.</p>
        </Col>
      </footer>
    </div>
  );
}
