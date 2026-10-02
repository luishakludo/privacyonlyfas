"use client"

import { useEffect, useRef, useState } from "react"
import { CircleNotch, UploadSimple, Trash, Plus, Check, ImageSquare, Lightning, Clock, Star, Gift, Link as LinkIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EditorShell, PhonePreview, buildPreviewData } from "./editor-shell"
import {
  uploadModelImage,
  type Model,
  type ModelConfig,
  type Plan,
  type OrderBump,
  emptyBump,
} from "@/lib/supabase/use-models"

// ---------- Upload de imagem reutilizável ----------
function ImageUpload({
  modelId,
  url,
  onChange,
  aspect = "aspect-video",
  label,
}: {
  modelId: string
  url: string
  onChange: (url: string) => void
  aspect?: string
  label?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const publicUrl = await uploadModelImage(modelId, file)
      onChange(publicUrl)
    } catch (err) {
      console.log("[v0] erro no upload:", err)
      alert("Falha no upload. Verifique se o bucket 'model-media' existe no Supabase.")
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {label && <Label>{label}</Label>}
      <div
        className={`group relative ${aspect} w-full cursor-pointer overflow-hidden rounded-xl border border-dashed border-[#0b0b0b]/20 bg-[#fff8eb]`}
        onClick={() => inputRef.current?.click()}
      >
        {url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
            {/* Overlay com botões no hover - só desktop */}
            <div className="absolute inset-0 hidden items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 md:flex">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  inputRef.current?.click()
                }}
                className="bg-white text-[#0b0b0b] hover:bg-white/90"
              >
                <UploadSimple className="h-3.5 w-3.5" weight="bold" />
                Trocar
              </Button>
            </div>
            {/* Botão de remover no canto - só desktop */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange("")
              }}
              className="absolute right-2 top-2 hidden rounded-lg bg-red-500 p-1.5 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100 md:block"
            >
              <Trash className="h-4 w-4" weight="bold" />
            </button>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[#0b0b0b]/40">
            <ImageSquare className="h-6 w-6" weight="duotone" />
            <span className="text-xs">Clique para enviar</span>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
            <CircleNotch className="h-5 w-5 animate-spin" />
          </div>
        )}
      </div>
      {/* Botões visíveis apenas no mobile quando tem imagem */}
      {url && (
        <div className="flex gap-2 md:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="bg-transparent"
          >
            <UploadSimple className="h-3.5 w-3.5" weight="bold" />
            Trocar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash className="h-3.5 w-3.5" weight="bold" />
            Remover
          </Button>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
    </div>
  )
}

export function CheckoutConfigDialog({
  model,
  onClose,
  updateModel,
}: {
  model: Model | null
  onClose: () => void
  updateModel: (id: string, patch: Partial<Model>) => Promise<void>
}) {
  const [cfg, setCfg] = useState<ModelConfig | null>(null)
  const [loadedId, setLoadedId] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle")
  const [confirmClose, setConfirmClose] = useState(false)
  const skipAutoSave = useRef(true)

  // Sincroniza o formulário ao abrir uma nova modelo.
  if (model && model.id !== loadedId) {
    setCfg(model.config)
    setLoadedId(model.id)
    setStatus("idle")
    skipAutoSave.current = true
  }
  if (!model && loadedId) setLoadedId(null)

  // Salvamento automático com debounce
  useEffect(() => {
    if (!model || !cfg) return
    if (skipAutoSave.current) {
      skipAutoSave.current = false
      return
    }
    setStatus("saving")
    const t = setTimeout(async () => {
      try {
        await updateModel(model.id, { config: cfg })
        setStatus("saved")
      } catch (e) {
        if (e instanceof Error && e.message === "CONFIG_COLUMN_MISSING") {
          setStatus("saved")
        } else {
          console.log("[v0] erro no auto-save:", e)
          setStatus("idle")
        }
      }
    }, 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg])

  if (!model) return null
  if (!cfg) {
    return (
      <EditorShell title="Carregando..." description="" status="idle" onClose={onClose}>
        <div className="flex items-center justify-center py-20 text-[#0b0b0b]/50">
          <CircleNotch className="mr-2 h-4 w-4 animate-spin" /> Carregando...
        </div>
      </EditorShell>
    )
  }

  const patch = (p: Partial<ModelConfig>) => setCfg((c) => (c ? { ...c, ...p } : c))
  const patchCheckout = (p: Partial<ModelConfig["checkout"]>) =>
    setCfg((c) => (c ? { ...c, checkout: { ...c.checkout, ...p } } : c))

  // Atualiza as configurações de exibição dos planos (principal e seção de promoções).
  const patchPlansSettings = (p: Partial<ModelConfig["plansSettings"]>) =>
    setCfg((c) => (c ? { ...c, plansSettings: { ...c.plansSettings, ...p } } : c))

  // Remove um plano; se ele era o principal, promove o primeiro plano restante.
  const removePlan = (id: string) =>
    setCfg((c) => {
      if (!c) return c
      const plans = c.plans.filter((p) => p.id !== id)
      const principalId =
        c.plansSettings.principalId === id ? (plans[0]?.id ?? null) : c.plansSettings.principalId
      return { ...c, plans, plansSettings: { ...c.plansSettings, principalId } }
    })

  const promoEnabled = cfg.plansSettings.promoEnabled !== false

  const requestClose = () => setConfirmClose(true)

  const previewData = buildPreviewData({
    name: model.name,
    handle: model.handle,
    avatar: model.avatar_url ?? "",
    config: cfg,
    modelId: model.id,
  })

  return (
    <EditorShell
      title={`Checkout de ${model.name}`}
      description="Clique em um plano no celular ao lado para testar o checkout ao vivo. Tudo é salvo automaticamente."
      status={status}
      onClose={requestClose}
      preview={<PhonePreview data={previewData} caption="Clique num plano para ver o checkout" />}
    >
        <Tabs defaultValue="comportamento" className="flex flex-col">
          <TabsList className="flex h-auto w-auto flex-wrap justify-start gap-1 bg-transparent p-0">
            {[
              ["comportamento", "Comportamento"],
              ["planos", "Planos"],
              ["bumps", "Order Bumps"],
              ["textos", "Textos"],
              ["pos", "Pós-pagamento"],
            ].map(([v, l]) => (
              <TabsTrigger
                key={v}
                value={v}
                className="skeu-tab h-auto flex-none rounded-full px-3 py-1.5 text-xs font-semibold"
              >
                {l}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="pt-4">
            {/* COMPORTAMENTO */}
            <TabsContent value="comportamento" className="mt-0 flex flex-col gap-4">
              <p className="text-xs text-[#0b0b0b]/60">
                Escolha como o checkout se comporta quando a pessoa clica em um plano. Você pode mudar isso a
                qualquer momento.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    value: "completo" as const,
                    title: "Completo",
                    desc: "Mostra os order bumps (mimos) antes de gerar o PIX. Ideal para aumentar o ticket médio.",
                  },
                  {
                    value: "direto" as const,
                    title: "PIX direto",
                    desc: "Vai direto para o pagamento, sem mostrar mimos. Fluxo mais rápido e simples.",
                  },
                ].map((opt) => {
                  const active = (cfg.checkout.mode ?? "completo") === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => patchCheckout({ mode: opt.value })}
                      className={`flex flex-col gap-1.5 p-4 text-left ${
                        active ? "skeu-inset-orange" : "skeu-inset"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#0b0b0b]">{opt.title}</span>
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full ${
                            active ? "skeu-chip" : "border border-[#0b0b0b]/30"
                          }`}
                        >
                          {active && <Check className="h-2.5 w-2.5 text-[#fff8eb]" weight="bold" />}
                        </span>
                      </div>
                      <span className="text-xs leading-relaxed text-[#0b0b0b]/60">{opt.desc}</span>
                    </button>
                  )
                })}
              </div>

              <div className="skeu-inset-orange px-3 py-2.5 text-xs leading-relaxed text-[#0b0b0b]/70">
                Dica: use <strong>PIX direto</strong> para campanhas de impulso e <strong>Completo</strong> quando
                quiser oferecer os mimos cadastrados na aba <strong>Order Bumps</strong>.
              </div>
            </TabsContent>

            {/* PLANOS */}
            <TabsContent value="planos" className="mt-0 flex flex-col gap-4">
              <p className="text-xs text-[#0b0b0b]/60">
                Configure os planos de assinatura. O título do botão é editável e o preço usa formato de centavos
                (2489 = R$ 24,89). Defina qual é o <strong>principal</strong> (destaque no topo).
              </p>

              {/* Mostrar promoções */}
              <div className="skeu-inset flex items-center justify-between gap-3 p-4">
                <div className="flex flex-col gap-0.5">
                  <Label className="text-xs font-semibold">Seção de promoções</Label>
                  <span className="text-[11px] leading-relaxed text-[#0b0b0b]/55">
                    {promoEnabled
                      ? 'Mostra o título "Promoções" com os demais planos abaixo do principal.'
                      : "Esconde o título — os demais planos ficam soltos abaixo do principal."}
                  </span>
                </div>
                <Switch checked={promoEnabled} onCheckedChange={(v) => patchPlansSettings({ promoEnabled: v })} />
              </div>

              {cfg.plans.map((plan) => {
                const isPrincipal = (cfg.plansSettings.principalId ?? cfg.plans[0]?.id) === plan.id
                return (
                  <div
                    key={plan.id}
                    className={`flex flex-col gap-3 p-4 ${isPrincipal ? "skeu-inset-orange" : "skeu-inset"}`}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => patchPlansSettings({ principalId: plan.id })}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#0b0b0b]"
                      >
                        <Star
                          className={`h-4 w-4 ${isPrincipal ? "text-[#e8590c]" : "text-[#0b0b0b]/30"}`}
                          weight={isPrincipal ? "fill" : "regular"}
                        />
                        {isPrincipal ? "Plano principal" : "Tornar principal"}
                      </button>
                      {cfg.plans.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePlan(plan.id)}
                          className="h-7 w-7 text-red-600 hover:bg-red-50"
                        >
                          <Trash className="h-3.5 w-3.5" weight="bold" />
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Título do botão</Label>
                      <Input
                        key={`label-${plan.id}`}
                        defaultValue={plan.label ?? ""}
                        placeholder={plan.months === 1 ? "1 mês" : `${plan.months} meses`}
                        onChange={(e) => updatePlan(cfg, setCfg, plan.id, { label: e.target.value })}
                      />
                      <span className="text-[11px] text-[#0b0b0b]/45">
                        Deixe em branco para usar o padrão ({plan.months === 1 ? "1 mês" : `${plan.months} meses`}).
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Tag verde (opcional)</Label>
                      <Input
                        key={`badge-${plan.id}`}
                        defaultValue={plan.badge ?? ""}
                        placeholder="Ex: Economize 20%"
                        onChange={(e) => updatePlan(cfg, setCfg, plan.id, { badge: e.target.value })}
                      />
                      <span className="text-[11px] text-[#0b0b0b]/45">
                        Aparece como uma etiqueta verde no canto superior do botão. Deixe em branco para esconder.
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Meses</Label>
                        <NumberInput
                          key={`months-${plan.id}`}
                          value={plan.months}
                          emptyValue={1}
                          onChange={(n) => updatePlan(cfg, setCfg, plan.id, { months: n || 1 })}
                        />
                      </div>
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <Label className="text-xs">Preço</Label>
                        <CurrencyInput
                          key={`price-${plan.id}`}
                          value={plan.price}
                          onChange={(v) => updatePlan(cfg, setCfg, plan.id, { price: v })}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  patch({
                    plans: [...cfg.plans, { id: `p${Date.now()}`, months: 1, price: "R$ 0,00", label: "" }],
                  })
                }
                className="bg-transparent"
              >
                <Plus className="h-4 w-4" weight="bold" />
                Adicionar plano
              </Button>
            </TabsContent>

            {/* ORDER BUMPS */}
            <TabsContent value="bumps" className="mt-0 flex flex-col gap-4">
              <p className="text-xs text-[#0b0b0b]/60">
                Os order bumps (mimos) aparecem no checkout. Quando marcados, somam ao valor do PIX.
              </p>

              {cfg.orderBumps.length === 0 && (
                <p className="skeu-inset px-3 py-4 text-center text-xs text-[#0b0b0b]/45">
                  Nenhum order bump ainda. Adicione para aumentar seu ticket médio.
                </p>
              )}

              {cfg.orderBumps.map((bump, i) => (
                <div key={bump.id} className="skeu-inset flex flex-col gap-3 p-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Order Bump {i + 1}</Label>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-[#0b0b0b]/60">
                        Ativo
                        <Switch
                          checked={bump.active}
                          onCheckedChange={(v) => updateBump(cfg, setCfg, bump.id, { active: v })}
                        />
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => patch({ orderBumps: cfg.orderBumps.filter((b) => b.id !== bump.id) })}
                        className="h-7 w-7 text-red-600 hover:bg-red-50"
                      >
                        <Trash className="h-4 w-4" weight="bold" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-24 shrink-0">
                      <ImageUpload
                        modelId={model.id}
                        url={bump.imageUrl}
                        onChange={(u) => updateBump(cfg, setCfg, bump.id, { imageUrl: u })}
                        aspect="aspect-square"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-2">
                      <Input
                        value={bump.title}
                        onChange={(e) => updateBump(cfg, setCfg, bump.id, { title: e.target.value })}
                        placeholder="Título (ex: Pack extra)"
                      />
                      <Input
                        value={bump.description}
                        onChange={(e) => updateBump(cfg, setCfg, bump.id, { description: e.target.value })}
                        placeholder="Descrição curta"
                      />
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Preço</Label>
                        <CurrencyInput
                          key={`bump-price-${bump.id}`}
                          value={bump.price}
                          onChange={(v) => updateBump(cfg, setCfg, bump.id, { price: v })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() => patch({ orderBumps: [...cfg.orderBumps, emptyBump()] })}
                className="bg-transparent"
              >
                <Plus className="h-4 w-4" weight="bold" />
                Adicionar order bump
              </Button>
            </TabsContent>

            {/* TEXTOS */}
            <TabsContent value="textos" className="mt-0 flex flex-col gap-4">
              <p className="text-xs text-[#0b0b0b]/60">
                Personalize os textos que aparecem no checkout.
              </p>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Título do checkout</Label>
                <Input
                  value={cfg.checkout.title}
                  onChange={(e) => patchCheckout({ title: e.target.value })}
                  placeholder="Ex: Falta pouco!"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Subtítulo</Label>
                <Input
                  value={cfg.checkout.subtitle}
                  onChange={(e) => patchCheckout({ subtitle: e.target.value })}
                  placeholder="Texto acima do campo de e-mail"
                />
              </div>
            </TabsContent>

            {/* PÓS-PAGAMENTO */}
            <TabsContent value="pos" className="mt-0 flex flex-col gap-4">
              <p className="text-xs text-[#0b0b0b]/60">
                Configure o que acontece após o pagamento ser confirmado.
              </p>

              {/* Fila de pós-pagamento (upsell) */}
              <div className="skeu-inset flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#f56708]" weight="fill" />
                    <Label className="font-semibold">Tempo de fila (upsell)</Label>
                  </div>
                  <Switch
                    checked={cfg.checkout.queueEnabled ?? false}
                    onCheckedChange={(v) => patchCheckout({ queueEnabled: v })}
                  />
                </div>
                <p className="text-xs text-[#0b0b0b]/60">
                  {(cfg.checkout.queueEnabled ?? false)
                    ? "Após pagar, o cliente verá que está numa fila. Defina o tempo estimado de espera."
                    : "Desativado: ao confirmar o pagamento, o cliente vê apenas uma mensagem de agradecimento avisando que o conteúdo está a caminho."}
                </p>
                {(cfg.checkout.queueEnabled ?? false) && (
                  <div className="flex items-center gap-2 pt-1">
                    <NumberInput
                      value={cfg.checkout.queueHours ?? 3}
                      onChange={(n) => patchCheckout({ queueHours: n })}
                      className="w-20"
                      emptyValue={3}
                    />
                    <span className="text-sm text-[#0b0b0b]/60">horas</span>
                  </div>
                )}
              </div>

              {/* Upsell de entrega prioritária (só faz sentido com a fila ligada) */}
              {(cfg.checkout.queueEnabled ?? false) && (
                <div className="skeu-inset-orange flex flex-col gap-3 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lightning className="h-4 w-4 text-[#f56708]" weight="fill" />
                      <Label className="font-semibold">Entrega prioritária (upsell)</Label>
                    </div>
                    <Switch
                      checked={cfg.checkout.priorityEnabled ?? false}
                      onCheckedChange={(v) => patchCheckout({ priorityEnabled: v })}
                    />
                  </div>
                  <p className="text-xs text-[#0b0b0b]/60">
                    Ofereça ao cliente a opção de pagar um valor extra para receber instantaneamente.
                  </p>
                  {(cfg.checkout.priorityEnabled ?? false) && (
                    <div className="flex flex-col gap-3 pt-2">
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Preço da entrega prioritária</Label>
                        <CurrencyInput
                          value={cfg.checkout.priorityPrice ?? "R$ 9,90"}
                          onChange={(v) => patchCheckout({ priorityPrice: v })}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Texto do botão</Label>
                        <Input
                          value={cfg.checkout.priorityText ?? "Receber agora"}
                          onChange={(e) => patchCheckout({ priorityText: e.target.value })}
                          placeholder="Ex: Receber agora"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Entregável: popup com link após pagamento */}
              <div className={`flex flex-col gap-3 p-4 ${(cfg.checkout.deliverableEnabled ?? false) ? "skeu-inset-orange" : "skeu-inset"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-[#f56708]" weight="fill" />
                    <Label className="font-semibold">Entregável</Label>
                  </div>
                  <Switch
                    checked={cfg.checkout.deliverableEnabled ?? false}
                    onCheckedChange={(v) => patchCheckout({ deliverableEnabled: v })}
                  />
                </div>
                <p className="text-xs text-[#0b0b0b]/60">
                  {(cfg.checkout.queueEnabled ?? false)
                    ? "Mostra um popup com link para o produto após o cliente pagar a taxa de entrega prioritária."
                    : "Mostra um popup com link para o produto logo após o pagamento ser confirmado."}
                </p>
                {(cfg.checkout.deliverableEnabled ?? false) && (
                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Título do popup</Label>
                      <Input
                        value={cfg.checkout.deliverableTitle ?? "Seu acesso está liberado!"}
                        onChange={(e) => patchCheckout({ deliverableTitle: e.target.value })}
                        placeholder="Ex: Seu acesso está liberado!"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Descrição</Label>
                      <Input
                        value={cfg.checkout.deliverableDescription ?? ""}
                        onChange={(e) => patchCheckout({ deliverableDescription: e.target.value })}
                        placeholder="Ex: Clique no botão abaixo para acessar seu conteúdo exclusivo."
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Texto do botão</Label>
                      <Input
                        value={cfg.checkout.deliverableButtonText ?? "Acessar conteúdo"}
                        onChange={(e) => patchCheckout({ deliverableButtonText: e.target.value })}
                        placeholder="Ex: Acessar conteúdo"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Link do botão</Label>
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-[#0b0b0b]/40" weight="bold" />
                        <Input
                          value={cfg.checkout.deliverableButtonUrl ?? ""}
                          onChange={(e) => patchCheckout({ deliverableButtonUrl: e.target.value })}
                          placeholder="https://..."
                          className="flex-1"
                        />
                      </div>
                      <span className="text-[11px] text-[#0b0b0b]/45">
                        Cole aqui o link para onde o cliente será direcionado ao clicar no botão.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Popup de confirmação ao fechar */}
        {confirmClose && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-6">
            <div className="skeu-panel w-full max-w-sm p-5">
              <h3 className="skeu-emboss text-base font-bold text-[#0b0b0b]">Tudo foi salvo automaticamente</h3>
              <p className="mt-1.5 text-sm text-[#0b0b0b]/60">
                Suas alterações já estão salvas. Deseja continuar editando ou fechar?
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setConfirmClose(false)} className="skeu-btn px-4 py-2 text-sm font-semibold">
                  Continuar editando
                </button>
                <button
                  onClick={() => {
                    setConfirmClose(false)
                    onClose()
                  }}
                  className="skeu-btn-primary px-4 py-2 text-sm font-semibold"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
    </EditorShell>
  )
}

function NumberInput({
  value,
  onChange,
  className,
  emptyValue = 0,
}: {
  value: number
  onChange: (n: number) => void
  className?: string
  emptyValue?: number
}) {
  const [text, setText] = useState(String(value))
  return (
    <Input
      type="text"
      inputMode="numeric"
      className={className}
      value={text}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d]/g, "")
        setText(raw)
        onChange(raw === "" ? emptyValue : Number(raw))
      }}
    />
  )
}

function CurrencyInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const format = (digits: string) => {
    const cents = Number.parseInt(digits || "0", 10)
    return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  const [text, setText] = useState(format((value || "").replace(/\D/g, "")))
  return (
    <div className="flex h-9 w-full items-center rounded-md border border-input bg-transparent pl-3 pr-4 shadow-sm focus-within:ring-1 focus-within:ring-ring">
      <span className="mr-1.5 select-none text-sm font-medium text-[#0b0b0b]/45">R$</span>
      <input
        inputMode="numeric"
        className="h-full w-full bg-transparent px-2.5 text-sm font-medium text-[#0b0b0b] outline-none"
        value={text}
        onChange={(e) => {
          const formatted = format(e.target.value.replace(/\D/g, ""))
          setText(formatted)
          onChange(`R$ ${formatted}`)
        }}
      />
    </div>
  )
}

function updatePlan(
  cfg: ModelConfig,
  setCfg: React.Dispatch<React.SetStateAction<ModelConfig | null>>,
  id: string,
  p: Partial<Plan>,
) {
  setCfg((c) => (c ? { ...c, plans: c.plans.map((pl) => (pl.id === id ? { ...pl, ...p } : pl)) } : c))
}

function updateBump(
  cfg: ModelConfig,
  setCfg: React.Dispatch<React.SetStateAction<ModelConfig | null>>,
  id: string,
  p: Partial<OrderBump>,
) {
  setCfg((c) => (c ? { ...c, orderBumps: c.orderBumps.map((b) => (b.id === id ? { ...b, ...p } : b)) } : c))
}
