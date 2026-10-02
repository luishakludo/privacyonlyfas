"use client"

import { useState } from "react"
import { CheckCircle2, Copy, Heart, Instagram, MessageCircle, Play, ShoppingBag, Video, X } from "lucide-react"

const products = [
  { id: "p1", title: "Morning tease", duration: "06:18", price: 19.9, color: "store-lilac", copy: "Um começo delicado e cheio de charme." },
  { id: "p2", title: "Pink after dark", duration: "11:42", price: 29.9, color: "store-pink", copy: "Luzes baixas e uma noite só nossa." },
  { id: "p3", title: "Playful mood", duration: "08:05", price: 24.9, color: "store-peach", copy: "Leve, divertida e impossível de ignorar." },
  { id: "p4", title: "Close to you", duration: "14:26", price: 39.9, color: "store-rose", copy: "Uma experiência suave para assistir juntinho." },
]
const videoTypes = ["Teaser fofo", "Mensagem especial", "Dancinha", "Surpresa ousada"]
const durations = ["Até 2 min", "3 a 5 min", "6 a 10 min", "Mais de 10 min"]

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

type Pix = { code?: string; image?: string; amount?: number }

export function Storefront() {
  const [tab, setTab] = useState<"home" | "custom">("home")
  const [product, setProduct] = useState<(typeof products)[number] | null>(null)
  const [pix, setPix] = useState<Pix | null>(null)
  const [customType, setCustomType] = useState(videoTypes[0])
  const [duration, setDuration] = useState(durations[1])
  const [deadline, setDeadline] = useState("Em até 3 dias")
  const [story, setStory] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const customPrice = duration === "Até 2 min" ? 34.9 : duration === "3 a 5 min" ? 49.9 : duration === "6 a 10 min" ? 74.9 : 109.9

  async function createPix(amount: number, description: string, title: string) {
    setLoading(true); setError("")
    try {
      const response = await fetch("/api/pix/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount, description, modelName: "Geovanna Fox", planName: "Loja de conteúdos", bumps: [{ title, price: amount }], forceGateway: "nexuspag" }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Não foi possível gerar o PIX.")
      setPix({ code: data.pixCopiaECola, image: data.qrCode?.startsWith("data:image") ? data.qrCode : undefined, amount: data.amount })
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível gerar o PIX.") } finally { setLoading(false) }
  }

  function submitCustom() {
    if (!email || !story.trim()) { setError("Preencha seu e-mail e conte a ideia do vídeo."); return }
    void createPix(customPrice, `Vídeo personalizado: ${customType} | ${duration} | ${deadline}`, `Vídeo personalizado — ${customType}`)
  }

  return (
    <main className="store-shell min-h-screen overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-store-border bg-store-blush/95 px-4 py-3 backdrop-blur-md">
        <nav className="mx-auto flex max-w-2xl items-center justify-center gap-2" aria-label="Navegação principal">
          <button onClick={() => setTab("home")} className={`rounded-full px-5 py-2 text-xs font-semibold ${tab === "home" ? "bg-store-ink text-primary-foreground" : "text-store-muted"}`}>Início</button>
          <button onClick={() => setTab("custom")} className={`rounded-full px-5 py-2 text-xs font-semibold ${tab === "custom" ? "bg-store-pink text-primary-foreground" : "text-store-muted"}`}>Vídeo personalizado</button>
        </nav>
      </header>

      <div className="mx-auto w-full max-w-2xl px-4 pb-16">
        {tab === "home" ? <>
          <section className="overflow-hidden rounded-2xl border border-store-border bg-primary-foreground shadow-sm">
            <div className="relative h-32 overflow-hidden bg-store-lilac sm:h-40"><img src="/store/geovanna-fox-banner.png" alt="Banner do perfil de Geovanna Fox" className="size-full object-cover" /></div>
            <div className="px-4 pb-5 sm:px-6">
              <div className="flex items-end justify-between gap-3">
                <img src="/store/geovanna-fox-avatar.jpg" alt="Geovanna Fox" className="-mt-10 size-20 rounded-full border-4 border-primary-foreground object-cover shadow-sm sm:size-24" />
                <div className="flex items-center gap-2 pb-2"><button type="button" aria-label="Instagram" className="flex size-9 items-center justify-center rounded-full border border-store-border text-store-ink"><Instagram className="size-4" /></button><button type="button" aria-label="Favoritar perfil" className="flex size-9 items-center justify-center rounded-full border border-store-border text-store-ink"><Heart className="size-4" /></button></div>
              </div>
              <div className="mt-3"><h1 className="flex items-center gap-1.5 text-xl font-bold tracking-tight text-store-ink">Geovanna Fox <CheckCircle2 className="size-4 fill-store-pink text-primary-foreground" /></h1><p className="mt-0.5 text-sm text-store-muted">@geovannafox</p><p className="mt-3 max-w-md text-sm leading-5 text-store-ink">Vídeos exclusivos, feitos para você.</p></div>
              <div className="mt-4 flex items-center gap-5 border-t border-store-border pt-4 text-xs text-store-muted"><span><strong className="text-store-ink">{products.length}</strong> vídeos</span><span><strong className="text-store-ink">1.2k</strong> fãs</span><span><strong className="text-store-ink">24h</strong> resposta</span></div>
              <div className="mt-4 grid grid-cols-2 gap-3"><button type="button" className="flex items-center justify-center gap-2 rounded-xl bg-store-pink px-3 py-3 text-sm font-bold text-primary-foreground"><ShoppingBag className="size-4" />Mimo</button><button type="button" className="flex items-center justify-center gap-2 rounded-xl border border-store-border px-3 py-3 text-sm font-bold text-store-ink"><MessageCircle className="size-4" />Chat</button></div>
            </div>
          </section>

          <section className="py-6"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold text-store-ink">Vídeos</h2><span className="text-xs text-store-muted">Toque para assistir</span></div>
            <div className="grid gap-5">
              {products.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl bg-primary-foreground shadow-sm ring-1 ring-store-border">
                <button onClick={() => { setProduct(item); setPix(null); setError("") }} className="block w-full text-left">
                  <div className={`relative aspect-video overflow-hidden ${item.color}`}><div className="absolute inset-0 bg-store-ink/5" /><span className="absolute bottom-3 left-3 rounded-md bg-store-ink/75 px-2 py-1 text-[11px] font-semibold text-primary-foreground">{item.duration}</span><span className="absolute inset-0 m-auto flex size-12 items-center justify-center rounded-full bg-primary-foreground/90 text-store-pink shadow-sm"><Play className="size-5 fill-current" /></span></div>
                  <div className="flex items-center justify-between gap-3 px-4 py-3"><div><h3 className="text-sm font-bold text-store-ink">{item.title}</h3><p className="mt-0.5 text-xs text-store-muted">{item.copy}</p></div><span className="shrink-0 text-sm font-bold text-store-pink">{money(item.price)}</span></div>
                </button>
              </article>)}
            </div>
          </section>
        </> : <CustomVideoForm customType={customType} setCustomType={setCustomType} duration={duration} setDuration={setDuration} deadline={deadline} setDeadline={setDeadline} story={story} setStory={setStory} email={email} setEmail={setEmail} customPrice={customPrice} loading={loading} error={error} onSubmit={submitCustom} />}
      </div>

      {product && <ProductModal product={product} pix={pix} error={error} loading={loading} onClose={() => setProduct(null)} onBuy={() => void createPix(product.price, `Conteúdo digital: ${product.title}`, product.title)} />}
    </main>
  )
}

function ProductModal({ product, pix, error, loading, onClose, onBuy }: { product: (typeof products)[number]; pix: Pix | null; error: string; loading: boolean; onClose: () => void; onBuy: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-store-ink/35 p-3 backdrop-blur-sm sm:items-center"><div className="w-full max-w-md rounded-2xl bg-primary-foreground p-4 shadow-2xl"><div className={`relative aspect-video overflow-hidden rounded-xl ${product.color}`}><button onClick={onClose} className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-primary-foreground/90 text-store-ink" aria-label="Fechar"><X className="size-4" /></button><span className="absolute inset-0 m-auto flex size-12 items-center justify-center rounded-full bg-primary-foreground/90 text-store-pink"><Play className="size-5 fill-current" /></span></div><div className="flex items-center justify-between gap-3 py-4"><div><h2 className="text-base font-bold text-store-ink">{product.title}</h2><p className="mt-1 text-xs text-store-muted">Vídeo exclusivo · {product.duration}</p></div><span className="text-base font-bold text-store-pink">{money(product.price)}</span></div>{pix ? <PixResult pix={pix} /> : <><button disabled={loading} onClick={onBuy} className="w-full rounded-xl bg-store-pink px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">{loading ? "Gerando PIX..." : "Comprar com PIX"}</button>{error && <p className="mt-3 text-xs font-semibold text-destructive">{error}</p>}</>}</div></div>
}

function CustomVideoForm({ customType, setCustomType, duration, setDuration, deadline, setDeadline, story, setStory, email, setEmail, customPrice, loading, error, onSubmit }: any) {
  return <section className="mx-auto max-w-xl py-8"><div className="mb-7"><div className="mb-3 flex size-10 items-center justify-center rounded-full bg-store-lilac text-store-pink"><Video className="size-5" /></div><h1 className="text-2xl font-bold text-store-ink">Vídeo personalizado</h1><p className="mt-1 text-sm leading-relaxed text-store-muted">Você escolhe os detalhes. Eu gravo para você.</p></div><div className="flex flex-col gap-5 rounded-2xl bg-primary-foreground p-5 shadow-sm ring-1 ring-store-border"><OptionGroup label="Tipo" options={videoTypes} value={customType} onChange={setCustomType} /><OptionGroup label="Duração" options={durations} value={duration} onChange={setDuration} /><OptionGroup label="Prazo" options={["Em até 3 dias", "Em até 7 dias", "Sem pressa"]} value={deadline} onChange={setDeadline} /><label className="flex flex-col gap-2 text-sm font-semibold text-store-ink">Sua ideia<textarea value={story} onChange={(event) => setStory(event.target.value)} placeholder="Conte o que você imaginou..." className="min-h-24 resize-none rounded-xl border border-store-border bg-store-blush px-3 py-3 text-sm font-normal outline-none placeholder:text-store-muted focus:border-store-pink" /></label><label className="flex flex-col gap-2 text-sm font-semibold text-store-ink">Seu e-mail<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="voce@email.com" className="rounded-xl border border-store-border bg-store-blush px-3 py-3 text-sm font-normal outline-none placeholder:text-store-muted focus:border-store-pink" /></label><div className="flex items-center justify-between border-t border-store-border pt-4"><span className="text-lg font-bold text-store-pink">{money(customPrice)}</span><button disabled={loading} onClick={onSubmit} className="rounded-xl bg-store-pink px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">{loading ? "Gerando PIX..." : "Continuar"}</button></div>{error && <p className="text-xs font-semibold text-destructive">{error}</p>}</div></section>
}

function OptionGroup({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return <fieldset><legend className="mb-2 text-sm font-semibold text-store-ink">{label}</legend><div className="flex flex-wrap gap-2">{options.map((option) => <button type="button" key={option} onClick={() => onChange(option)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${value === option ? "bg-store-pink text-primary-foreground" : "bg-store-blush text-store-muted ring-1 ring-store-border"}`}>{option}</button>)}</div></fieldset>
}

function PixResult({ pix }: { pix: Pix }) {
  const [copied, setCopied] = useState(false)
  async function copyCode() { if (!pix.code) return; await navigator.clipboard.writeText(pix.code); setCopied(true); setTimeout(() => setCopied(false), 1600) }
  return <div className="rounded-xl bg-store-blush p-4 text-center"><p className="text-sm font-bold text-store-ink">PIX gerado · {money(pix.amount || 0)}</p>{pix.image && <img src={pix.image} alt="QR Code do PIX" className="mx-auto my-3 size-36 rounded-lg" />}<button onClick={copyCode} className="flex w-full items-center justify-center gap-2 rounded-lg bg-store-ink px-4 py-3 text-xs font-bold text-primary-foreground"><Copy className="size-3.5" />{copied ? "Código copiado" : "Copiar código PIX"}</button><p className="mt-2 text-[11px] text-store-muted">O acesso é liberado após a confirmação.</p></div>
}

