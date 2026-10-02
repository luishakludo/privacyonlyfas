"use client"

import type React from "react"
import Link from "next/link"
import { useState } from "react"
import {
  Plus,
  Trash,
  Sliders,
  ChartBar,
  UsersThree,
  Power,
  CircleNotch,
  ArrowSquareOut,
  LinkSimple,
  Check,
  ShoppingCart,
  Receipt,
  CheckCircle,
  CurrencyDollar,
  Clock,
  Eye,
  House,
  Globe,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AdminShell } from "./admin-shell"
import { ModelConfigDialog } from "./model-config-dialog"
import { CheckoutConfigDialog } from "./checkout-config-dialog"
import { useModels, useModelStats, type Model } from "@/lib/supabase/use-models"

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })

export function ModelosView() {
  const { models, isLoading, createModel, deleteModel, updateModel } = useModels()

  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState("")
  const [handle, setHandle] = useState("")
  const [saving, setSaving] = useState(false)

  const [configModel, setConfigModel] = useState<Model | null>(null)
  const [checkoutModel, setCheckoutModel] = useState<Model | null>(null)
  const [statsModel, setStatsModel] = useState<Model | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Model | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function handleDelete(e: React.MouseEvent) {
    // Mantém o diálogo aberto até sabermos o resultado.
    e.preventDefault()
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteModel(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err: any) {
      console.log("[v0] erro ao apagar modelo:", err)
      setDeleteError(err?.message ?? "Não foi possível apagar. Tente novamente.")
    } finally {
      setDeleting(false)
    }
  }

  function siteUrl(m: Model) {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    return `${origin}/${m.slug}`
  }

  async function copyLink(m: Model) {
    try {
      await navigator.clipboard.writeText(siteUrl(m))
      setCopiedId(m.id)
      setTimeout(() => setCopiedId((c) => (c === m.id ? null : c)), 2000)
    } catch (e) {
      console.log("[v0] erro ao copiar link:", e)
    }
  }

  async function handleCreate() {
    if (!name.trim() || !handle.trim()) return
    setSaving(true)
    try {
      await createModel({ name: name.trim(), handle: handle.trim() })
      setName("")
      setHandle("")
      setCreateOpen(false)
    } catch (e) {
      console.log("[v0] erro ao criar modelo:", e)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(m: Model) {
    const next = !m.active
    // O switch também controla a publicação: ligado = página no ar (online), desligado = rascunho.
    await updateModel(m.id, { active: next, status: next ? "online" : "rascunho" })
  }

  return (
    <AdminShell>
      <main className="flex-1 p-4 md:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="skeu-emboss text-2xl font-extrabold tracking-tight text-balance">Modelos</h1>
            <p className="text-sm text-[#0b0b0b]/55">Para editar a Home/Privacy ou o OnlyFans, use a seção Páginas.</p>
          </div>
          <button onClick={() => setCreateOpen(true)} className="skeu-btn-primary px-4 py-2.5 text-sm font-semibold">
            <Plus className="h-4 w-4" weight="bold" />
            Criar modelo
          </button>
        </div>

        {isLoading ? (
          <div className="skeu-panel flex items-center justify-center py-20 text-[#0b0b0b]/50">
            <CircleNotch className="mr-2 h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : models.length === 0 ? (
          <div className="skeu-panel flex flex-col items-center gap-3 px-5 py-16 text-center">
            <div className="skeu-chip-soft flex h-14 w-14 items-center justify-center rounded-2xl">
              <UsersThree className="h-6 w-6" weight="duotone" />
            </div>
            <div>
              <p className="font-bold">Nenhuma modelo cadastrada</p>
              <p className="text-sm text-[#0b0b0b]/55">Crie sua primeira modelo para começar.</p>
            </div>
  <button onClick={() => setCreateOpen(true)} className="skeu-btn-primary mt-1 px-4 py-2.5 text-sm font-semibold">
  <Plus className="h-4 w-4" weight="bold" />
  Criar modelo
  </button>
  <div className="mt-4 grid w-full max-w-xl gap-3 sm:grid-cols-2">
    <Link href="/cliente/adm/paginas" className="skeu-nav-idle flex items-center gap-3 rounded-xl border border-[#f56708]/25 p-3 text-left">
      <House className="h-5 w-5 text-[#f56708]" weight="fill" />
      <span>
        <span className="block text-sm font-bold">Editar Home / Privacy</span>
        <span className="block text-xs text-[#0b0b0b]/50">Perfil, capa, textos, planos e posts</span>
      </span>
    </Link>
    <Link href="/cliente/adm/paginas" className="skeu-nav-idle flex items-center gap-3 rounded-xl border border-[#f56708]/25 p-3 text-left">
      <Globe className="h-5 w-5 text-[#f56708]" weight="fill" />
      <span>
        <span className="block text-sm font-bold">Editar OnlyFans</span>
        <span className="block text-xs text-[#0b0b0b]/50">Abra a aba /en (OnlyFans)</span>
      </span>
    </Link>
  </div>
  </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {models.map((m) => (
              <div
                key={m.id}
                className={`skeu-panel skeu-panel-hover flex flex-col p-5 ${m.active ? "" : "opacity-70"}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="skeu-chip flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-lg font-bold">
                      {m.avatar_url ? (
                        <img
                          src={m.avatar_url || "/placeholder.svg"}
                          alt={m.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        m.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="skeu-emboss font-bold leading-tight">{m.name}</p>
                      <p className="text-xs text-[#0b0b0b]/45">{m.handle}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${
                      m.status === "online" ? "skeu-chip-soft" : "skeu-inset text-[#0b0b0b]/45"
                    }`}
                  >
                    {m.status}
                  </span>
                </div>

                {/* Mini métricas */}
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <div className="skeu-inset p-3">
                    <p className="skeu-emboss text-sm font-extrabold">{brl(m.pixPendingAmount)}</p>
                    <p className="text-[11px] text-[#0b0b0b]/50">pix pendente</p>
                  </div>
                  <div className="skeu-inset p-3">
                    <p className="text-sm font-extrabold text-[#c14e07]">{brl(m.revenue)}</p>
                    <p className="text-[11px] text-[#0b0b0b]/50">receita</p>
                  </div>
                </div>

                {/* Ligar/desligar */}
                <div className="skeu-inset mt-4 flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Power className={`h-4 w-4 ${m.active ? "text-[#f56708]" : "text-[#0b0b0b]/30"}`} weight="bold" />
                    <span className="text-sm font-medium">{m.active ? "Ativa" : "Desligada"}</span>
                  </div>
                  <Switch checked={m.active} onCheckedChange={() => toggleActive(m)} />
                </div>

                {/* Site da modelo */}
                <div className="mt-3 flex items-center gap-2">
                  <a
                    href={siteUrl(m)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="skeu-btn-primary flex-1 px-3 py-2 text-sm font-semibold"
                  >
                    <ArrowSquareOut className="h-4 w-4" weight="bold" />
                    Abrir site
                  </a>
                  <button onClick={() => copyLink(m)} className="skeu-btn flex-1 px-3 py-2 text-sm font-semibold">
                    {copiedId === m.id ? (
                      <>
                        <Check className="h-4 w-4" weight="bold" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <LinkSimple className="h-4 w-4" weight="bold" />
                        Copiar link
                      </>
                    )}
                  </button>
                </div>

                {/* Ações */}
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={() => setStatsModel(m)} className="skeu-btn flex-1 px-3 py-2 text-sm font-semibold">
                    <ChartBar className="h-4 w-4" weight="duotone" />
                    Dados
                  </button>
                  <button onClick={() => setConfigModel(m)} className="skeu-btn flex-1 px-3 py-2 text-sm font-semibold">
                    <Sliders className="h-4 w-4" weight="duotone" />
                    Perfil
                  </button>
                  <button
                    onClick={() => setDeleteTarget(m)}
                    className="skeu-btn h-9 w-9 rounded-xl p-0 !text-red-600 hover:!text-red-700"
                    aria-label={`Apagar ${m.name}`}
                  >
                    <Trash className="h-4 w-4" weight="bold" />
                  </button>
                </div>
                <button
                  onClick={() => setCheckoutModel(m)}
                  className="skeu-btn mt-2 w-full px-3 py-2 text-sm font-semibold !text-[#c14e07]"
                >
                  <ShoppingCart className="h-4 w-4" weight="duotone" />
                  Checkout
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Criar modelo */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="skeu-scope">
          <DialogHeader>
            <DialogTitle>Criar modelo</DialogTitle>
            <DialogDescription>A modelo é criada como rascunho. Você pode publicá-la depois.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Luna Prado" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="handle">@handle</Label>
              <Input
                id="handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="Ex: @lunaprado"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="bg-transparent">
              Cancelar
            </Button>
            <button
              onClick={handleCreate}
              disabled={saving || !name.trim() || !handle.trim()}
              className="skeu-btn-primary px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {saving && <CircleNotch className="h-4 w-4 animate-spin" />}
              Criar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configurar modelo */}
      <ModelConfigDialog model={configModel} onClose={() => setConfigModel(null)} updateModel={updateModel} />

      {/* Configurar checkout */}
      <CheckoutConfigDialog model={checkoutModel} onClose={() => setCheckoutModel(null)} updateModel={updateModel} />

      {/* Ver dados */}
      <StatsDialog model={statsModel} onClose={() => setStatsModel(null)} />

      {/* Apagar */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o && !deleting) {
            setDeleteTarget(null)
            setDeleteError(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os dados, conteúdos e pagamentos vinculados serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-600/90"
            >
              {deleting && <CircleNotch className="mr-2 h-4 w-4 animate-spin" />}
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  )
}

function StatsDialog({ model, onClose }: { model: Model | null; onClose: () => void }) {
  const { stats, isLoading } = useModelStats(model?.id ?? null)

  const secondary = [
    { label: "Pix gerados", value: stats ? String(stats.pixCount) : "0", icon: Receipt },
    { label: "Pix pagos", value: stats ? String(stats.pixPaid) : "0", icon: CheckCircle },
    { label: "Pix pendente", value: brl(stats?.pixPendingAmount ?? 0), icon: Clock },
    { label: "Visitas", value: (stats?.visits ?? 0).toLocaleString("pt-BR"), icon: Eye },
  ]

  return (
    <Dialog open={!!model} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="skeu-scope">
        <DialogHeader>
          <DialogTitle>Dados de {model?.name}</DialogTitle>
          <DialogDescription>Desempenho individual desta modelo.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-[#0b0b0b]/50">
            <CircleNotch className="mr-2 h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-2">
            {/* Destaque: valor pago */}
            <div className="skeu-inset flex items-center gap-4 p-4">
              <div className="skeu-chip flex h-12 w-12 shrink-0 items-center justify-center">
                <CurrencyDollar className="h-6 w-6 text-white" weight="fill" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#0b0b0b]/55">Valor pago</p>
                <p className="skeu-emboss text-2xl font-extrabold text-[#c14e07]">{brl(stats?.pixPaidAmount ?? 0)}</p>
              </div>
            </div>

            {/* Demais métricas */}
            <div className="grid grid-cols-2 gap-3">
              {secondary.map((r) => (
                <div key={r.label} className="skeu-inset flex flex-col gap-1.5 p-4">
                  <div className="flex items-center gap-1.5 text-[#0b0b0b]/45">
                    <r.icon className="h-4 w-4" weight="duotone" />
                    <span className="text-[11px] font-medium">{r.label}</span>
                  </div>
                  <p className="skeu-emboss text-xl font-extrabold">{r.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
