"use client"

import { useEffect, useRef, useState } from "react"
import {
  CircleNotch,
  Check,
  ArrowCounterClockwise,
  Plus,
  Trash,
  Image as ImageIcon,
  House,
  Globe,
} from "@phosphor-icons/react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AdminShell } from "./admin-shell"
import { useHomeContent, useEnContent, uploadLandingImage } from "@/lib/landing/use-landing"
import type { HomeContent } from "@/lib/landing/home-content"
import type { EnEditable, Locale, LocaleContent } from "@/lib/i18n/onlyfans-content"

// ============================================================
// Primitivos de campo
// ============================================================

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-[#0b0b0b]/45">{hint}</p>}
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
}) {
  return (
    <Field label={label} hint={hint}>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete="off" />
    </Field>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  hint?: string
}) {
  return (
    <Field label={label} hint={hint}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-[#0b0b0b]/15 bg-white/70 px-3 py-2 text-sm outline-none focus:border-[#f56708]"
      />
    </Field>
  )
}

function NumberField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  hint?: string
}) {
  return (
    <Field label={label} hint={hint}>
      <Input
        type="number"
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        autoComplete="off"
      />
    </Field>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-3 rounded-lg border border-[#0b0b0b]/10 px-3 py-2.5 text-left"
    >
      <span className="text-sm font-semibold">{label}</span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-[#f56708]" : "bg-[#0b0b0b]/20"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`}
        />
      </span>
    </button>
  )
}

function MediaField({ label, value, type, onChange, onTypeChange, onDelete }: { label: string; value: string; type: "image" | "video"; onChange: (v: string) => void; onTypeChange: (v: "image" | "video") => void; onDelete?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  async function handleFile(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadLandingImage(file)
      onChange(url)
      onTypeChange(file.type.startsWith("video/") ? "video" : "image")
    } catch (e) {
      console.log("[v0] erro no upload:", e)
      alert(`Falha no upload da mídia: ${e instanceof Error ? e.message : "verifique o Storage do projeto"}`)
    } finally { setUploading(false) }
  }
  return (
    <Field label={label}>
        <div className="flex items-start gap-3">
          <div className="skeu-chip flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg">
          {value && type === "video" ? <video src={value} muted className="h-full w-full object-cover" /> : value ? <img src={value} alt="Pré-visualização da mídia" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-[#0b0b0b]/40" />}
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="/caminho ou URL" autoComplete="off" />
          <div className="flex flex-wrap items-center gap-2">
            <select value={type} onChange={(e) => onTypeChange(e.target.value as "image" | "video")} className="rounded-md border border-[#0b0b0b]/15 bg-white/70 px-2 py-1.5 text-xs">
              <option value="image">Imagem</option><option value="video">Vídeo</option>
            </select>
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="skeu-btn inline-flex w-fit items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50">
              {uploading ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />} Enviar mídia
            </button>
          </div>
        </div>
        {onDelete && (
          <button type="button" onClick={onDelete} className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50 hover:text-red-700" aria-label={`Apagar ${label}`} title="Apagar mídia">
            <Trash className="h-4 w-4" />
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>
    </Field>
  )
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <MediaField label={label} value={value} type="image" onChange={onChange} onTypeChange={() => undefined} />
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="skeu-panel max-w-3xl p-5 md:p-6 mb-4">
      <h2 className="skeu-emboss mb-4 font-bold">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  )
}

function SaveBar({
  customized,
  status,
  onSave,
  onReset,
}: {
  customized: boolean
  status: SaveStatus
  onSave: () => void
  onReset: () => void
}) {
  return (
    <div className="sticky bottom-0 z-10 max-w-3xl">
      <div className="skeu-panel flex flex-wrap items-center gap-3 p-4">
        <button onClick={onSave} disabled={status === "saving"} className="skeu-btn-primary px-4 py-2.5 text-sm font-semibold disabled:opacity-50">
          {status === "saving" ? <CircleNotch className="h-4 w-4 animate-spin" /> : null}
          Salvar alterações
        </button>
        <button
          onClick={onReset}
          disabled={!customized || status === "saving"}
          className="skeu-btn inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold disabled:opacity-40"
        >
          <ArrowCounterClockwise className="h-4 w-4" />
          Restaurar padrão
        </button>
        {status === "saved" && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
            <Check className="h-4 w-4" weight="bold" /> Salvo
          </span>
        )}
        {status === "error" && <span className="text-sm font-medium text-red-600">Erro ao salvar.</span>}
        <span className="ml-auto text-xs font-semibold">
          {customized ? (
            <span className="rounded-full bg-[#f56708]/10 px-2.5 py-1 text-[#f56708]">Personalizado (banco)</span>
          ) : (
            <span className="rounded-full bg-[#0b0b0b]/5 px-2.5 py-1 text-[#0b0b0b]/50">Padrão (hard code)</span>
          )}
        </span>
      </div>
    </div>
  )
}

type SaveStatus = "idle" | "saving" | "saved" | "error"

// ============================================================
// Editor da HOME (Privacy)
// ============================================================

function HomeEditor() {
  const { content, customized, isLoading, save, reset } = useHomeContent()
  const [draft, setDraft] = useState<HomeContent | null>(null)
  const [status, setStatus] = useState<SaveStatus>("idle")

  useEffect(() => {
    if (!isLoading && !draft) setDraft(structuredClone(content))
  }, [isLoading, content, draft])

  if (!draft) {
    return <p className="text-sm text-[#0b0b0b]/50">Carregando…</p>
  }

  const set = (patch: Partial<HomeContent>) => setDraft((d) => ({ ...(d as HomeContent), ...patch }))
  const setStats = (patch: Partial<HomeContent["stats"]>) =>
    setDraft((d) => ({ ...(d as HomeContent), stats: { ...(d as HomeContent).stats, ...patch } }))
  const setCheckout = (patch: Partial<HomeContent["checkout"]>) =>
    setDraft((d) => ({ ...(d as HomeContent), checkout: { ...(d as HomeContent).checkout, ...patch } }))

  async function handleSave() {
    setStatus("saving")
    try {
      await save(draft as HomeContent)
      setStatus("saved")
      setTimeout(() => setStatus("idle"), 2500)
    } catch (e) {
      console.log("[v0] erro ao salvar home:", e)
      setStatus("error")
    }
  }

  async function handleReset() {
    if (!confirm("Restaurar o conteúdo padrão desta página? As edições salvas serão apagadas.")) return
    setStatus("saving")
    try {
      await reset()
      setDraft(null)
      setStatus("idle")
    } catch (e) {
      console.log("[v0] erro ao restaurar home:", e)
      setStatus("error")
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <SectionCard title="Perfil">
        <MediaField label="Avatar" value={draft.avatar} type="image" onChange={(v) => set({ avatar: v })} onTypeChange={() => undefined} />
        <MediaField label="Capa" value={draft.coverImage} type="image" onChange={(v) => set({ coverImage: v })} onTypeChange={() => undefined} />
        <TextField label="Nome" value={draft.username} onChange={(v) => set({ username: v })} />
        <TextField label="@handle" value={draft.handle} onChange={(v) => set({ handle: v })} />
        <TextAreaField label="Bio" value={draft.bio} onChange={(v) => set({ bio: v })} />
        <Toggle label="Selo verificado" checked={draft.isVerified} onChange={(v) => set({ isVerified: v })} />
      </SectionCard>

      <SectionCard title="Estatísticas">
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Fotos" value={draft.stats.photos} onChange={(v) => setStats({ photos: v })} />
          <NumberField label="Vídeos" value={draft.stats.videos} onChange={(v) => setStats({ videos: v })} />
          <NumberField label="Bloqueados" value={draft.stats.locked} onChange={(v) => setStats({ locked: v })} />
          <TextField label="Curtidas" value={draft.stats.likes} onChange={(v) => setStats({ likes: v })} />
          <NumberField label="Nº de posts" value={draft.postsCount} onChange={(v) => set({ postsCount: v })} />
          <NumberField label="Nº de mídias" value={draft.mediasCount} onChange={(v) => set({ mediasCount: v })} />
        </div>
      </SectionCard>

      <SectionCard title="Mídias da Home">
        <p className="-mt-2 text-[11px] text-[#0b0b0b]/50">Troque aqui as imagens e vídeos exibidos na Home. Você pode colar uma URL ou enviar um arquivo.</p>
        <MediaField label="Avatar da modelo" value={draft.avatar} type="image" onChange={(v) => set({ avatar: v })} onTypeChange={() => undefined} />
        <MediaField label="Capa da modelo" value={draft.coverImage} type="image" onChange={(v) => set({ coverImage: v })} onTypeChange={() => undefined} />
        <div className="grid gap-4 md:grid-cols-2">
          {draft.medias.map((m, i) => (
            <div key={`gallery-${m.id}`} className="rounded-xl border border-[#0b0b0b]/10 bg-white/35 p-3">
              <MediaField label={`Mídia da galeria ${i + 1}`} value={m.url} type={m.type} onChange={(v) => set({ medias: draft.medias.map((x, j) => (j === i ? { ...x, url: v } : x)) })} onTypeChange={(v) => set({ medias: draft.medias.map((x, j) => (j === i ? { ...x, type: v } : x)) })} onDelete={() => set({ medias: draft.medias.filter((_, j) => j !== i) })} />
            </div>
          ))}
        </div>
        <button type="button" onClick={() => set({ medias: [...draft.medias, { id: `media-${Date.now()}`, url: "", type: "image", blur: true }] })} className="skeu-btn inline-flex w-fit items-center gap-1.5 px-3 py-2 text-xs font-semibold">
          <Plus className="h-4 w-4" /> Adicionar mídia da galeria
        </button>
      </SectionCard>

      <SectionCard title="Redes sociais">
        <p className="text-[11px] text-[#0b0b0b]/45 -mt-2">
          Use <code className="font-mono">disabled</code> para exibir o ícone sem link. Deixe vazio para esconder.
        </p>
        <TextField label="Instagram" value={draft.socialLinks.instagram ?? ""} onChange={(v) => set({ socialLinks: { ...draft.socialLinks, instagram: v } })} />
        <TextField label="Twitter/X" value={draft.socialLinks.twitter ?? ""} onChange={(v) => set({ socialLinks: { ...draft.socialLinks, twitter: v } })} />
        <TextField label="TikTok" value={draft.socialLinks.tiktok ?? ""} onChange={(v) => set({ socialLinks: { ...draft.socialLinks, tiktok: v } })} />
      </SectionCard>

      <SectionCard title="Planos">
        {draft.subscriptions.map((s, i) => (
          <div key={s.id} className="rounded-xl border border-[#0b0b0b]/10 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-[#0b0b0b]/60">Plano {i + 1}</span>
              <button
                type="button"
                onClick={() => set({ subscriptions: draft.subscriptions.filter((_, j) => j !== i) })}
                className="text-red-500 hover:text-red-600"
                aria-label="Remover plano"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Nome" value={s.name} onChange={(v) => set({ subscriptions: draft.subscriptions.map((x, j) => (j === i ? { ...x, name: v } : x)) })} />
              <TextField label="Preço" value={s.price} onChange={(v) => set({ subscriptions: draft.subscriptions.map((x, j) => (j === i ? { ...x, price: v } : x)) })} />
              <TextField label="Selo (badge)" value={s.badge ?? ""} onChange={(v) => set({ subscriptions: draft.subscriptions.map((x, j) => (j === i ? { ...x, badge: v } : x)) })} />
              <TextField label="Desconto" value={s.discount ?? ""} onChange={(v) => set({ subscriptions: draft.subscriptions.map((x, j) => (j === i ? { ...x, discount: v } : x)) })} />
            </div>
            <label className="mt-2 flex items-center gap-2 text-xs font-semibold">
              <input
                type="radio"
                name="home-principal"
                checked={draft.principalId === s.id}
                onChange={() => set({ principalId: s.id })}
              />
              Plano principal (destaque)
            </label>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            set({
              subscriptions: [
                ...draft.subscriptions,
                { id: `p${Date.now()}`, name: "Novo plano", price: "R$ 0,00" },
              ],
            })
          }
          className="skeu-btn inline-flex w-fit items-center gap-1.5 px-3 py-2 text-xs font-semibold"
        >
          <Plus className="h-4 w-4" /> Adicionar plano
        </button>
        <Toggle label="Mostrar título 'Promoções'" checked={draft.promoEnabled !== false} onChange={(v) => set({ promoEnabled: v })} />
      </SectionCard>

      <SectionCard title="Publicações (feed) — edite aqui as postagens">
        <p className="-mt-2 text-xs text-[#0b0b0b]/60">Nesta seção você troca o arquivo da postagem, legenda, curtidas e bloqueio. Não use a seção de mídias da galeria para editar posts.</p>
        <div className="grid gap-4 md:grid-cols-2">
        {draft.posts.map((p, i) => (
          <div key={p.id} className="rounded-xl border border-[#0b0b0b]/10 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-[#0b0b0b]/60">Post {i + 1}</span>
              <button
                type="button"
                onClick={() => set({ posts: draft.posts.filter((_, j) => j !== i) })}
                className="text-red-500 hover:text-red-600"
                aria-label="Remover post"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-3 rounded-lg border border-orange-200 bg-orange-50/70 p-3">
              <p className="mb-2 text-xs font-bold text-orange-800">Trocar a mídia desta postagem</p>
              <MediaField label={`Arquivo do post ${i + 1}`} value={p.url} type={p.type} onChange={(v) => set({ posts: draft.posts.map((x, j) => (j === i ? { ...x, url: v } : x)) })} onTypeChange={(v) => set({ posts: draft.posts.map((x, j) => (j === i ? { ...x, type: v } : x)) })} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <TextField label="Legenda" value={p.caption ?? ""} onChange={(v) => set({ posts: draft.posts.map((x, j) => (j === i ? { ...x, caption: v } : x)) })} />
              <TextField label="Curtidas" value={p.likes ?? ""} onChange={(v) => set({ posts: draft.posts.map((x, j) => (j === i ? { ...x, likes: v } : x)) })} />
              <Toggle label="Borrar (bloqueado)" checked={!!p.blur} onChange={(v) => set({ posts: draft.posts.map((x, j) => (j === i ? { ...x, blur: v } : x)) })} />
            </div>
          </div>
        ))}
        </div>
        <button
          type="button"
          onClick={() =>
            set({
              posts: [...draft.posts, { id: `post-${Date.now()}`, type: "image", url: "", blur: false, caption: "" }],
            })
          }
          className="skeu-btn inline-flex w-fit items-center gap-1.5 px-3 py-2 text-xs font-semibold"
        >
          <Plus className="h-4 w-4" /> Adicionar post
        </button>
      </SectionCard>

      <SectionCard title="Checkout e pós-pagamento">
        <TextField label="Título" value={draft.checkout.title} onChange={(v) => setCheckout({ title: v })} />
        <TextAreaField label="Subtítulo" value={draft.checkout.subtitle} onChange={(v) => setCheckout({ subtitle: v })} />

        <Toggle label="Fila de entrega" checked={!!draft.checkout.queueEnabled} onChange={(v) => setCheckout({ queueEnabled: v })} />
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Horas de fila" value={draft.checkout.queueHours ?? 0} onChange={(v) => setCheckout({ queueHours: v })} />
        </div>
        <TextAreaField label="Motivo da fila" value={draft.checkout.queueReason ?? ""} onChange={(v) => setCheckout({ queueReason: v })} />

        <Toggle label="Upsell entrega prioritária" checked={!!draft.checkout.priorityEnabled} onChange={(v) => setCheckout({ priorityEnabled: v })} />
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Preço prioridade" value={draft.checkout.priorityPrice ?? ""} onChange={(v) => setCheckout({ priorityPrice: v })} />
          <TextField label="Texto prioridade" value={draft.checkout.priorityText ?? ""} onChange={(v) => setCheckout({ priorityText: v })} />
        </div>

        <Toggle label="Upsell chamada de vídeo" checked={!!draft.checkout.callUpsellEnabled} onChange={(v) => setCheckout({ callUpsellEnabled: v })} />
        <TextField label="Preço da chamada" value={draft.checkout.callUpsellPrice ?? ""} onChange={(v) => setCheckout({ callUpsellPrice: v })} />
        <TextField label="Título da chamada" value={draft.checkout.callUpsellTitle ?? ""} onChange={(v) => setCheckout({ callUpsellTitle: v })} />
        <TextAreaField label="Descrição da chamada" value={draft.checkout.callUpsellDescription ?? ""} onChange={(v) => setCheckout({ callUpsellDescription: v })} />

        <Toggle label="Entregável pós-pagamento" checked={!!draft.checkout.deliverableEnabled} onChange={(v) => setCheckout({ deliverableEnabled: v })} />
        <TextField label="Título do entregável" value={draft.checkout.deliverableTitle ?? ""} onChange={(v) => setCheckout({ deliverableTitle: v })} />
        <TextAreaField label="Descrição do entregável" value={draft.checkout.deliverableDescription ?? ""} onChange={(v) => setCheckout({ deliverableDescription: v })} />
        <TextField label="Texto do botão" value={draft.checkout.deliverableButtonText ?? ""} onChange={(v) => setCheckout({ deliverableButtonText: v })} />
        <TextField label="Link do botão" value={draft.checkout.deliverableButtonUrl ?? ""} onChange={(v) => setCheckout({ deliverableButtonUrl: v })} />
      </SectionCard>

      <SaveBar customized={customized} status={status} onSave={handleSave} onReset={handleReset} />
    </div>
  )
}

// ============================================================
// Editor da /en (OnlyFans — 3 idiomas)
// ============================================================

const LOCALE_LABELS: Record<Locale, string> = { en: "Inglês", es: "Espanhol", pt: "Português (PT)" }

function EnEditor() {
  const { content, customized, isLoading, save, reset } = useEnContent()
  const [draft, setDraft] = useState<EnEditable | null>(null)
  const [status, setStatus] = useState<SaveStatus>("idle")
  const [lang, setLang] = useState<Locale>("en")

  useEffect(() => {
    if (!isLoading && !draft) setDraft(structuredClone(content))
  }, [isLoading, content, draft])

  if (!draft) {
    return <p className="text-sm text-[#0b0b0b]/50">Carregando…</p>
  }

  const setBase = (patch: Partial<EnEditable["base"]>) =>
    setDraft((d) => ({ ...(d as EnEditable), base: { ...(d as EnEditable).base, ...patch } }))
  const setBaseStats = (patch: Partial<EnEditable["base"]["stats"]>) =>
    setDraft((d) => ({ ...(d as EnEditable), base: { ...(d as EnEditable).base, stats: { ...(d as EnEditable).base.stats, ...patch } } }))
  const setBaseLocked = (patch: Partial<EnEditable["base"]["lockedStats"]>) =>
    setDraft((d) => ({ ...(d as EnEditable), base: { ...(d as EnEditable).base, lockedStats: { ...(d as EnEditable).base.lockedStats, ...patch } } }))

  const lc = draft.locales[lang]
  const setLocale = (patch: Partial<LocaleContent>) =>
    setDraft((d) => {
      const cur = d as EnEditable
      return { ...cur, locales: { ...cur.locales, [lang]: { ...cur.locales[lang], ...patch } } }
    })
  const setLabels = (patch: Partial<LocaleContent["labels"]>) => setLocale({ labels: { ...lc.labels, ...patch } })
  const setStripe = (patch: Partial<LocaleContent["stripeLabels"]>) =>
    setLocale({ stripeLabels: { ...lc.stripeLabels, ...patch } })

  async function handleSave() {
    setStatus("saving")
    try {
      await save(draft as EnEditable)
      setStatus("saved")
      setTimeout(() => setStatus("idle"), 2500)
    } catch (e) {
      console.log("[v0] erro ao salvar en:", e)
      setStatus("error")
    }
  }

  async function handleReset() {
    if (!confirm("Restaurar o conteúdo padrão desta página? As edições salvas serão apagadas.")) return
    setStatus("saving")
    try {
      await reset()
      setDraft(null)
      setStatus("idle")
    } catch (e) {
      console.log("[v0] erro ao restaurar en:", e)
      setStatus("error")
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <SectionCard title="Perfil (comum a todos os idiomas)">
        <ImageField label="Avatar" value={draft.base.avatar} onChange={(v) => setBase({ avatar: v })} />
        <ImageField label="Capa" value={draft.base.coverImage} onChange={(v) => setBase({ coverImage: v })} />
        <TextField label="Nome" value={draft.base.username} onChange={(v) => setBase({ username: v })} />
        <TextField label="@handle" value={draft.base.handle} onChange={(v) => setBase({ handle: v })} />
        <TextField label="Preço 'normal' (regular)" value={draft.base.regularPrice} onChange={(v) => setBase({ regularPrice: v })} />
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Fotos" value={draft.base.stats.photos} onChange={(v) => setBaseStats({ photos: v })} />
          <NumberField label="Vídeos" value={draft.base.stats.videos} onChange={(v) => setBaseStats({ videos: v })} />
          <NumberField label="Bloqueados" value={draft.base.stats.locked} onChange={(v) => setBaseStats({ locked: v })} />
          <TextField label="Curtidas" value={draft.base.stats.likes} onChange={(v) => setBaseStats({ likes: v })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Bloqueado: posts" value={draft.base.lockedStats.posts} onChange={(v) => setBaseLocked({ posts: v })} />
          <NumberField label="Bloqueado: fotos" value={draft.base.lockedStats.photos} onChange={(v) => setBaseLocked({ photos: v })} />
          <NumberField label="Bloqueado: vídeos" value={draft.base.lockedStats.videos} onChange={(v) => setBaseLocked({ videos: v })} />
          <NumberField label="Bloqueado: áudios" value={draft.base.lockedStats.audio} onChange={(v) => setBaseLocked({ audio: v })} />
        </div>
        <Toggle label="Selo verificado" checked={draft.base.isVerified} onChange={(v) => setBase({ isVerified: v })} />
        <Toggle label="Disponível agora" checked={draft.base.availableNow} onChange={(v) => setBase({ availableNow: v })} />
      </SectionCard>

      <SectionCard title="Imagens das publicações (comum a todos os idiomas)">
        {draft.postImages.map((img, i) => (
          <div key={img.id} className="rounded-xl border border-[#0b0b0b]/10 p-3">
            <span className="mb-2 block text-xs font-bold text-[#0b0b0b]/60">Post {i + 1}</span>
            <div className="flex flex-col gap-3">
              <ImageField
                label="Imagem"
                value={img.url}
                onChange={(v) => setDraft((d) => ({ ...(d as EnEditable), postImages: (d as EnEditable).postImages.map((x, j) => (j === i ? { ...x, url: v } : x)) }))}
              />
              <TextField
                label="Curtidas"
                value={img.likes ?? ""}
                onChange={(v) => setDraft((d) => ({ ...(d as EnEditable), postImages: (d as EnEditable).postImages.map((x, j) => (j === i ? { ...x, likes: v } : x)) }))}
              />
              <Toggle
                label="Borrar (bloqueado)"
                checked={!!img.blur}
                onChange={(v) => setDraft((d) => ({ ...(d as EnEditable), postImages: (d as EnEditable).postImages.map((x, j) => (j === i ? { ...x, blur: v } : x)) }))}
              />
            </div>
          </div>
        ))}
      </SectionCard>

      {/* Seletor de idioma */}
      <div className="skeu-panel max-w-3xl p-2 mb-4">
        <div className="flex gap-2">
          {(["en", "es", "pt"] as Locale[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold ${lang === l ? "skeu-nav-active" : "skeu-nav-idle"}`}
            >
              {LOCALE_LABELS[l]}
            </button>
          ))}
        </div>
      </div>

      <SectionCard title={`Textos — ${LOCALE_LABELS[lang]}`}>
        <TextAreaField label="Bio" value={lc.bio} onChange={(v) => setLocale({ bio: v })} />
        <TextField label="Rótulo da oferta" value={lc.offerLabel} onChange={(v) => setLocale({ offerLabel: v })} />
        <TextField label="Título da oferta" value={lc.offerTitle} onChange={(v) => setLocale({ offerTitle: v })} />
        <TextField label="Subtítulo da oferta" value={lc.offerSubtitle} onChange={(v) => setLocale({ offerSubtitle: v })} />
        <TextAreaField label="Texto do card da oferta" value={lc.offerCardText} onChange={(v) => setLocale({ offerCardText: v })} />
      </SectionCard>

      <SectionCard title={`Planos — ${LOCALE_LABELS[lang]}`}>
        {lc.subscriptions.map((s, i) => (
          <div key={s.id} className="rounded-xl border border-[#0b0b0b]/10 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-[#0b0b0b]/60">Plano {i + 1}</span>
              <button
                type="button"
                onClick={() => setLocale({ subscriptions: lc.subscriptions.filter((_, j) => j !== i) })}
                className="text-red-500 hover:text-red-600"
                aria-label="Remover plano"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Nome" value={s.name} onChange={(v) => setLocale({ subscriptions: lc.subscriptions.map((x, j) => (j === i ? { ...x, name: v } : x)) })} />
              <TextField label="Preço (exibido)" value={s.price} onChange={(v) => setLocale({ subscriptions: lc.subscriptions.map((x, j) => (j === i ? { ...x, price: v } : x)) })} />
              <TextField label="Período" value={s.period ?? ""} onChange={(v) => setLocale({ subscriptions: lc.subscriptions.map((x, j) => (j === i ? { ...x, period: v } : x)) })} />
              <TextField label="Selo (badge)" value={s.badge ?? ""} onChange={(v) => setLocale({ subscriptions: lc.subscriptions.map((x, j) => (j === i ? { ...x, badge: v } : x)) })} />
              <NumberField label="Valor (centavos USD)" value={s.amountCents} onChange={(v) => setLocale({ subscriptions: lc.subscriptions.map((x, j) => (j === i ? { ...x, amountCents: v } : x)) })} />
              <NumberField label="Meses por ciclo" value={s.intervalCount} onChange={(v) => setLocale({ subscriptions: lc.subscriptions.map((x, j) => (j === i ? { ...x, intervalCount: v } : x)) })} />
            </div>
          </div>
        ))}
        <p className="text-[11px] text-[#0b0b0b]/45">
          O plano principal é o marcado com selo "Most popular" (id <code className="font-mono">{draft.base.principalId}</code>).
        </p>
      </SectionCard>

      <SectionCard title={`Legendas dos posts — ${LOCALE_LABELS[lang]}`}>
        {[0, 1, 2].map((i) => (
          <TextField
            key={i}
            label={`Legenda ${i + 1}`}
            value={lc.postCaptions[i] ?? ""}
            onChange={(v) =>
              setLocale({ postCaptions: lc.postCaptions.map((x, j) => (j === i ? v : x)) as [string, string, string] })
            }
          />
        ))}
      </SectionCard>

      <SectionCard title={`Rótulos da interface — ${LOCALE_LABELS[lang]}`}>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Disponível agora" value={lc.labels.availableNow} onChange={(v) => setLabels({ availableNow: v })} />
          <TextField label="Mais info" value={lc.labels.moreInfo} onChange={(v) => setLabels({ moreInfo: v })} />
          <TextField label="Menos info" value={lc.labels.lessInfo} onChange={(v) => setLabels({ lessInfo: v })} />
          <TextField label="Assinar" value={lc.labels.subscribe} onChange={(v) => setLabels({ subscribe: v })} />
          <TextField label="Pacotes" value={lc.labels.packages} onChange={(v) => setLabels({ packages: v })} />
          <TextField label="Preço normal" value={lc.labels.regularPrice} onChange={(v) => setLabels({ regularPrice: v })} />
          <TextField label="Por mês" value={lc.labels.perMonth} onChange={(v) => setLabels({ perMonth: v })} />
          <TextField label="Posts" value={lc.labels.posts} onChange={(v) => setLabels({ posts: v })} />
          <TextField label="Mídia" value={lc.labels.media} onChange={(v) => setLabels({ media: v })} />
          <TextField label="Assine para ver" value={lc.labels.subscribeToSee} onChange={(v) => setLabels({ subscribeToSee: v })} />
        </div>
      </SectionCard>

      <SectionCard title={`Checkout Stripe — ${LOCALE_LABELS[lang]}`}>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Assinar (título)" value={lc.stripeLabels.subscribeTo} onChange={(v) => setStripe({ subscribeTo: v })} />
          <TextField label="E-mail (label)" value={lc.stripeLabels.emailLabel} onChange={(v) => setStripe({ emailLabel: v })} />
          <TextField label="E-mail (placeholder)" value={lc.stripeLabels.emailPlaceholder} onChange={(v) => setStripe({ emailPlaceholder: v })} />
          <TextField label="Ajuda do e-mail" value={lc.stripeLabels.emailHelp} onChange={(v) => setStripe({ emailHelp: v })} />
          <TextField label="Digite o e-mail" value={lc.stripeLabels.enterEmail} onChange={(v) => setStripe({ enterEmail: v })} />
          <TextField label="Continuar" value={lc.stripeLabels.continue} onChange={(v) => setStripe({ continue: v })} />
          <TextField label="Carregando" value={lc.stripeLabels.loading} onChange={(v) => setStripe({ loading: v })} />
          <TextField label="Processando" value={lc.stripeLabels.processing} onChange={(v) => setStripe({ processing: v })} />
          <TextField label="Pagar" value={lc.stripeLabels.pay} onChange={(v) => setStripe({ pay: v })} />
          <TextField label="Protegido por" value={lc.stripeLabels.securedBy} onChange={(v) => setStripe({ securedBy: v })} />
          <TextField label="Verifique os dados" value={lc.stripeLabels.checkDetails} onChange={(v) => setStripe({ checkDetails: v })} />
          <TextField label="Pagamento falhou" value={lc.stripeLabels.paymentFailed} onChange={(v) => setStripe({ paymentFailed: v })} />
          <TextField label="Erro de rede" value={lc.stripeLabels.networkError} onChange={(v) => setStripe({ networkError: v })} />
          <TextField label="Algo deu errado" value={lc.stripeLabels.somethingWrong} onChange={(v) => setStripe({ somethingWrong: v })} />
          <TextField label="Sucesso (título)" value={lc.stripeLabels.successTitle} onChange={(v) => setStripe({ successTitle: v })} />
          <TextField label="Sucesso (antes)" value={lc.stripeLabels.successBodyPre} onChange={(v) => setStripe({ successBodyPre: v })} />
          <TextField label="Sucesso (depois)" value={lc.stripeLabels.successBodyPost} onChange={(v) => setStripe({ successBodyPost: v })} />
          <TextField label="Concluído" value={lc.stripeLabels.done} onChange={(v) => setStripe({ done: v })} />
          <TextField label="Fechar" value={lc.stripeLabels.close} onChange={(v) => setStripe({ close: v })} />
        </div>
      </SectionCard>

      <SaveBar customized={customized} status={status} onSave={handleSave} onReset={handleReset} />
    </div>
  )
}

// ============================================================
// View principal
// ============================================================

export function PaginasView() {
  const [page, setPage] = useState<"home" | "en">("home")

  return (
    <AdminShell>
      <main className="skeu-scope flex-1 p-4 md:p-8">
        <div className="mb-6">
          <h1 className="skeu-emboss text-2xl font-extrabold tracking-tight text-balance">Páginas</h1>
          <p className="text-sm text-[#0b0b0b]/55">
            Escolha uma página abaixo para editar. A Home/Privacy e o OnlyFans (/en) possuem editores separados; as alterações salvas aparecem no site público.
          </p>
        </div>

        <div className="skeu-panel mb-6 flex max-w-3xl gap-2 p-2">
          <button
            type="button"
            onClick={() => setPage("home")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold ${page === "home" ? "skeu-nav-active" : "skeu-nav-idle"}`}
          >
            <House className="h-4 w-4" weight={page === "home" ? "fill" : "regular"} />
            Home (Privacy)
          </button>
          <button
            type="button"
            onClick={() => setPage("en")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold ${page === "en" ? "skeu-nav-active" : "skeu-nav-idle"}`}
          >
            <Globe className="h-4 w-4" weight={page === "en" ? "fill" : "regular"} />
            /en (OnlyFans)
          </button>
        </div>

        {page === "home" ? <HomeEditor /> : <EnEditor />}
      </main>
    </AdminShell>
  )
}
