import { Composer } from "@/components/composer";
import { Thread } from "@/components/thread";
import { TopBar } from "@/components/top-bar";
import { getVersion } from "@/lib/review";

export default async function Page({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  const { v } = await searchParams;
  const ctx = getVersion(v);
  return (
    <div className="flex min-h-svh flex-col">
      <TopBar dossier={ctx.dossier} title={`PV AGE 15.03.2023 — V${ctx.version} · ${ctx.type_operation}`} />
      <main className="flex-1">
        <Thread key={ctx.version} ctx={ctx} />
      </main>
      <Composer />
    </div>
  );
}
