import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className={`flex items-center gap-2 text-[15px] font-semibold tracking-tight ${dark ? "text-white" : ""}`}>
      <span className="flex size-6 items-center justify-center rounded-sm bg-brand font-mono text-[12px] font-medium text-brand-foreground">J</span>
      JuLaw
    </Link>
  );
}

/* Colonne de contenu encadrée par des filets 1px. */
export function Col({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1100px] border-x border-border ${className}`}>{children}</div>;
}

/* Liens de navigation : ancres de la landing (préfixées par "/" pour marcher depuis les autres pages). */
const NAV = [
  { href: "/#product", label: "Product" },
  { href: "/#how", label: "How it works" },
  { href: "/architecture", label: "The architecture" },
  { href: "/#security", label: "Security" },
];

export function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
      <Col className="flex h-14 items-center justify-between px-6">
        <Logo />
        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((l) => (
            <Link key={l.href} href={l.href} className={`eyebrow hover:text-foreground ${active === l.href ? "text-foreground" : ""}`}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="h-9 rounded-lg px-3 font-normal">Log in</Button>
          <Button className="h-9 rounded-lg px-4" nativeButton={false} render={<Link href="/app" />}>
            Open the workspace <ArrowRight className="size-4" />
          </Button>
        </div>
      </Col>
    </header>
  );
}
