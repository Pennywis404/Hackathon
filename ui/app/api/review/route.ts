import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextResponse } from "next/server";

// Le moteur Python vit à la racine du repo (ui/ est un sous-dossier).
const ROOT = process.env.REVIEW_ROOT ?? path.resolve(process.cwd(), "..");
const PYTHON = process.env.REVIEW_PYTHON ?? path.join(ROOT, ".venv", "bin", "python");
const TIMEOUT_MS = 180_000;

export const maxDuration = 180;

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Aucun fichier." }, { status: 400 });
  if (!/\.(pdf|docx)$/i.test(file.name)) return NextResponse.json({ error: "PDF ou .docx uniquement." }, { status: 400 });
  const exigence = form.get("exigence") === "max" ? "max" : "standard";
  const dossier = String(form.get("dossier") ?? "helianthe").replace(/[^a-z0-9_-]/gi, "") || "helianthe";
  const version = Number(form.get("version") ?? 0) || 0;

  const dir = await mkdtemp(path.join(tmpdir(), "julaw-"));
  const pv = path.join(dir, path.basename(file.name));
  await writeFile(pv, Buffer.from(await file.arrayBuffer()));

  try {
    const { stdout, stderr, code } = await run(PYTHON, [
      path.join(ROOT, "scripts", "review.py"), pv, "--exigence", exigence, "--dossier", dossier, "--version", String(version),
    ]);
    if (code !== 0) {
      return NextResponse.json({ error: "Le moteur a échoué.", detail: stderr.split("\n").filter(Boolean).slice(-6).join("\n") }, { status: 500 });
    }
    return NextResponse.json(JSON.parse(stdout));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function run(cmd: string, args: string[]) {
  return new Promise<{ stdout: string; stderr: string; code: number }>((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: ROOT, env: process.env });
    let stdout = "", stderr = "";
    const timer = setTimeout(() => { child.kill(); reject(new Error(`Délai dépassé (${TIMEOUT_MS / 1000}s).`)); }, TIMEOUT_MS);
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", (e) => { clearTimeout(timer); reject(e); });
    child.on("close", (code) => { clearTimeout(timer); resolve({ stdout, stderr, code: code ?? 1 }); });
  });
}
