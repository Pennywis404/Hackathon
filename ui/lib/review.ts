import { Check, Minus, X, type LucideIcon } from 'lucide-react'
import v1 from '@/data/helianthe/v1.json'
import v2 from '@/data/helianthe/v2.json'
import v3 from '@/data/helianthe/v3.json'

export type ClauseState = 'presente' | 'partielle' | 'absente'
export type SourceType = 'mail' | 'reunion' | 'note'
export type Exigence = 'standard' | 'max'

export interface OralTrace {
  citation: string
  text: string
  source_type: SourceType
  date: string
}

export interface Clause {
  id: string
  libelle: string
  etat: ClauseState
  cle: boolean
  poids: number
  pourquoi: string
  extrait_pv: string
  traces_orales: OralTrace[]
}

export interface Precedent {
  source: string
  page: number
  section_pv: string
  text: string
  distance: number
}

/** Sortie de la brique LLM → réponse (respond.py). Tout est optionnel : l'UI tient sans. */
export interface Reponse {
  resume?: string
  priorites?: string[]
  par_clause?: Record<string, { pourquoi_ici?: string; redaction?: string }>
  questions_suite?: string[]
}

export interface Score {
  brut: number
  malus_cles: number
  final: number
  cles_manquantes: string[]
  exigence: Exigence
}

export interface ReviewContext {
  pv: string
  version: number
  dossier: string
  type_operation: string
  type_libelle: string
  exigence: Exigence
  score: Score
  reponse: Reponse
  clauses: Clause[]
  precedents: Precedent[]
  corpus: { actes: number; templates: number; chunks: number }
}

/** Les versions successives du PV du dossier, telles que produites par pipeline.prepare + respond. */
export const VERSIONS: ReviewContext[] = [v1, v2, v3] as unknown as ReviewContext[]

export function getVersion(v: string | undefined): ReviewContext {
  const n = Number(v)
  return VERSIONS.find((x) => x.version === n) ?? VERSIONS[VERSIONS.length - 1]
}

export const KEY_MALUS = -10

export type Tone = 'critical' | 'caution' | 'success'

export const TONE_CLASSES: Record<Tone, { text: string; soft: string; stroke: string; dot: string }> = {
  critical: { text: 'text-critical-text', soft: 'bg-critical-surface', stroke: 'stroke-critical', dot: 'bg-critical' },
  caution: { text: 'text-caution-text', soft: 'bg-caution-surface', stroke: 'stroke-caution', dot: 'bg-caution' },
  success: { text: 'text-success-text', soft: 'bg-success-surface', stroke: 'stroke-success', dot: 'bg-success' },
}

export const STATE_META: Record<ClauseState, { label: string; icon: LucideIcon; tone: Tone }> = {
  presente: { label: 'Present', icon: Check, tone: 'success' },
  partielle: { label: 'Partial', icon: Minus, tone: 'caution' },
  absente: { label: 'Absent', icon: X, tone: 'critical' },
}

export interface ClauseGroup {
  id: string
  title: string
  hint: string
  tone: Tone
  clauses: Clause[]
}

export function groupClauses(clauses: Clause[], score: Score): ClauseGroup[] {
  const missing = new Set(score.cles_manquantes)
  return [
    { id: 'key-missing', title: 'Key clauses missing', hint: `${KEY_MALUS} each`, tone: 'critical' as const, clauses: clauses.filter((c) => missing.has(c.id)) },
    { id: 'other-gaps', title: 'Partial / non-key gaps', hint: 'No penalty', tone: 'caution' as const, clauses: clauses.filter((c) => !missing.has(c.id) && c.etat !== 'presente') },
    { id: 'present', title: 'Present', hint: 'Covered in the PV', tone: 'success' as const, clauses: clauses.filter((c) => !missing.has(c.id) && c.etat === 'presente') },
  ].filter((g) => g.clauses.length > 0)
}

export function scoreTone(score: number): { tone: Tone; label: string } {
  if (score < 40) return { tone: 'critical', label: 'Low' }
  if (score < 70) return { tone: 'caution', label: 'Fair' }
  return { tone: 'success', label: 'Good' }
}

// Même règle que scoring.py : couverture pondérée, puis -10 par clause clé manquante.
const PARTIAL_VALUE: Record<Exigence, number> = { standard: 0.5, max: 0 }

export function computeScore(clauses: Clause[], exigence: Exigence): Score {
  const total = clauses.reduce((s, c) => s + c.poids, 0)
  const value = (c: Clause) => (c.etat === 'presente' ? 1 : c.etat === 'partielle' ? PARTIAL_VALUE[exigence] : 0)
  const brut = total ? Math.round((100 * clauses.reduce((s, c) => s + c.poids * value(c), 0)) / total) : 0
  const cles_manquantes = clauses
    .filter((c) => c.cle && (c.etat === 'absente' || (exigence === 'max' && c.etat === 'partielle')))
    .map((c) => c.id)
  const malus_cles = KEY_MALUS * cles_manquantes.length
  return { brut, malus_cles, final: Math.max(0, brut + malus_cles), cles_manquantes, exigence }
}
