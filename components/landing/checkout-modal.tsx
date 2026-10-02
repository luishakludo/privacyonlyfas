"use client"

import { useEffect, useRef, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { priceToNumber, type OrderBump } from "@/lib/supabase/use-models"

type CheckoutColors = {
  background: string
  text: string
  subtext: string
  accent: string
  cardBg: string
}

type CheckoutConfig = {
  title: string
  subtitle: string
  mode?: "completo" | "direto"
  queueEnabled: boolean
  queueHours: number
  queueReason?: string
  priorityEnabled: boolean
  priorityPrice: string
  priorityText: string
  // Upsell de chamada de vídeo exibido logo após clicar em "Gerar PIX".
  callUpsellEnabled?: boolean
  callUpsellPrice?: string
  callUpsellTitle?: string
  callUpsellDescription?: string
  deliverableEnabled?: boolean
  deliverableTitle?: string
  deliverableDescription?: string
  deliverableButtonText?: string
  deliverableButtonUrl?: string
}

type SelectedPlan = { id: string; name: string; price: string }

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

function IconClose({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconCopy({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

export function CheckoutModal({
  plan,
  modelId,
  modelName,
  orderBumps,
  callUpsellImage,
  title,
  subtitle,
  checkoutConfig,
  colors,
  forceGateway,
  startWithCallUpsell = false,
  onClose,
}: {
  plan: SelectedPlan
  modelId?: string
  modelName?: string
  orderBumps: OrderBump[]
  callUpsellImage?: string
  title: string
  subtitle: string
  checkoutConfig?: CheckoutConfig
  colors: CheckoutColors
  // Força uma gateway específica (ex.: /nescau sempre na AtenasPay = "nexuspag").
  forceGateway?: "nexuspag" | "hyzepay"
  startWithCallUpsell?: boolean
  onClose: () => void
}) {
  const [selectedBumps, setSelectedBumps] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [pix, setPix] = useState<{ qrCode: string; qrCodeBase64?: string; pixCopiaECola?: string; amount: number; transactionId?: string; externalId?: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [priorityLoading, setPriorityLoading] = useState(false)
  const [priorityPix, setPriorityPix] = useState<{ qrCode: string; qrCodeBase64?: string; pixCopiaECola?: string; amount: number; transactionId?: string; externalId?: string } | null>(null)

  // Preview mode: adiciona ?preview=deliverable na URL para testar o popup do entregável
  const isPreviewMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("preview") === "deliverable"
  const [paymentConfirmed, setPaymentConfirmed] = useState(isPreviewMode)
  const [priorityPaid, setPriorityPaid] = useState(false)
  // Tela de oferta da chamada de vídeo (aparece após clicar em "Gerar PIX")
  const [showCallUpsell, setShowCallUpsell] = useState(startWithCallUpsell && (checkoutConfig?.callUpsellEnabled ?? true))

  // No modo "PIX direto" não mostramos os order bumps (mimos).
  const directMode = checkoutConfig?.mode === "direto"
  const activeBumps = directMode ? [] : orderBumps.filter((b) => b.active && b.title.trim())
  const planValue = priceToNumber(plan.price)
  const bumpsValue = activeBumps
    .filter((b) => selectedBumps[b.id])
    .reduce((s, b) => s + priceToNumber(b.price), 0)
  const total = planValue + bumpsValue

  // Config de pos-pagamento
  const queueEnabled = checkoutConfig?.queueEnabled ?? false
  const queueHours = checkoutConfig?.queueHours ?? 3
  const queueReason = checkoutConfig?.queueReason ?? ""
  // Entrega prioritária só existe quando a fila está ligada.
  const priorityEnabled = queueEnabled && (checkoutConfig?.priorityEnabled ?? false)
  const priorityPrice = checkoutConfig?.priorityPrice ?? "R$ 9,90"
  const priorityText = checkoutConfig?.priorityText ?? "Receber agora"

  // Upsell da chamada de vídeo (10 min)
  const callUpsellEnabled = checkoutConfig?.callUpsellEnabled ?? true
  const callUpsellPrice = checkoutConfig?.callUpsellPrice ?? "R$ 15,90"
  const callUpsellTitle = checkoutConfig?.callUpsellTitle ?? "Quer uma chamada de vídeo comigo?"
  const callUpsellDescription =
    checkoutConfig?.callUpsellDescription ??
    "Uma chamadinha de 10 minutos só nós dois pra gente gozar bem gostoso, por só mais R$ 15 e alguns centavos. Vaga limitada!"

  // Entregável
  const deliverableEnabled = checkoutConfig?.deliverableEnabled ?? false
  const deliverableTitle = checkoutConfig?.deliverableTitle ?? "Seu acesso está liberado!"
  const deliverableDescription = checkoutConfig?.deliverableDescription ?? ""
  const deliverableButtonText = checkoutConfig?.deliverableButtonText ?? "Acessar conteúdo"
  const deliverableButtonUrl = checkoutConfig?.deliverableButtonUrl ?? ""

  // Determina se deve mostrar o entregável:
  // - Se o upsell de prioridade está DESATIVADO: mostra após o primeiro pagamento
  // - Se o upsell de prioridade está ATIVADO: mostra apenas após pagar o upsell
  const shouldShowDeliverable = deliverableEnabled && (
    (!priorityEnabled && paymentConfirmed) || (priorityEnabled && priorityPaid)
  )

  async function handleGenerate(opts?: { addCall?: boolean }) {
    setErrorMsg("")
    // A oferta da chamada já foi decidida — fecha a tela de upsell.
    setShowCallUpsell(false)
    setLoading(true)
    try {
      const addCall = opts?.addCall ?? false
      const callValue = addCall ? priceToNumber(callUpsellPrice) : 0
      const chosen = [
        ...activeBumps
          .filter((b) => selectedBumps[b.id])
          .map((b) => ({ title: b.title, price: priceToNumber(b.price) })),
        ...(addCall ? [{ title: "Chamada de vídeo (10 min)", price: callValue }] : []),
      ]
      const finalTotal = total + callValue
      const sourceName = modelName?.trim() || "Modelo não identificada"
      const selectedItems = chosen.map((item) => item.title).filter(Boolean)
      const pixDescription = [`1 mês (${sourceName})`, ...selectedItems].join(" + ")

      console.log("[v0] Checkout PIX:", { sourceName, selectedItems, pixDescription, finalTotal })
      const res = await fetch("/api/pix/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalTotal,
          modelId,
          planName: addCall ? `${plan.name} + Chamada de vídeo` : plan.name,
          description: pixDescription,
          modelName: sourceName,
          bumps: chosen,
          forceGateway,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Erro ao gerar o PIX.")
      setPix({
        qrCode: json.pixCopiaECola || json.qrCode,
        qrCodeBase64: json.qrCode?.startsWith("data:image") ? json.qrCode : undefined,
        pixCopiaECola: json.pixCopiaECola,
        amount: json.amount,
        transactionId: json.transactionId,
        externalId: json.externalId,
      })
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Erro ao gerar o PIX.")
    } finally {
      setLoading(false)
    }
  }

  // No modo "PIX direto", gera o PIX automaticamente ao abrir.
  const autoStarted = useRef(false)
  useEffect(() => {
    if (directMode && !showCallUpsell && !autoStarted.current) {
      autoStarted.current = true
      void handleGenerate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directMode])

  async function handleCopy() {
    const codeToCopy = pix?.pixCopiaECola || pix?.qrCode
    if (!codeToCopy) return
    try {
      await navigator.clipboard.writeText(codeToCopy)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = codeToCopy
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Detecção automática de pagamento: enquanto o PIX estiver na tela e ainda
  // não confirmado, consulta o status a cada 4s. Quando o webhook da HyzePay
  // marcar como "pago", a tela de pós-pagamento aparece sozinha.
  useEffect(() => {
    if (!pix || paymentConfirmed) return
    const id = pix.transactionId
    const ext = pix.externalId
    if (!id && !ext) return

    let cancelled = false
    const check = async () => {
      try {
        const params = id ? `transactionId=${encodeURIComponent(id)}` : `externalId=${encodeURIComponent(ext as string)}`
        const res = await fetch(`/api/pix/status?${params}`)
        const json = await res.json()
        if (!cancelled && json.paid) setPaymentConfirmed(true)
      } catch {
        // silencioso: tenta de novo no próximo ciclo
      }
    }

    void check()
    const interval = setInterval(check, 4000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [pix, paymentConfirmed])

  async function handlePriority() {
    setPriorityLoading(true)
    try {
      const res = await fetch("/api/pix/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: priceToNumber(priorityPrice),
          modelId,
          planName: `Entrega prioritária - ${plan.name}`,
          description: `Entrega prioritária (${modelName?.trim() || "Modelo não identificada"})`,
          modelName: modelName?.trim() || "Modelo não identificada",
          bumps: [],
          forceGateway,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Erro ao gerar o PIX.")
      setPriorityPix({
        qrCode: json.pixCopiaECola || json.qrCode,
        qrCodeBase64: json.qrCode?.startsWith("data:image") ? json.qrCode : undefined,
        pixCopiaECola: json.pixCopiaECola,
        amount: json.amount,
        transactionId: json.transactionId,
        externalId: json.externalId,
      })
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao gerar PIX de prioridade")
    } finally {
      setPriorityLoading(false)
    }
  }

  // Detecção de pagamento da taxa de prioridade
  useEffect(() => {
    if (!priorityPix || priorityPaid) return
    const id = priorityPix.transactionId
    const ext = priorityPix.externalId
    if (!id && !ext) return

    let cancelled = false
    const check = async () => {
      try {
        const params = id ? `transactionId=${encodeURIComponent(id)}` : `externalId=${encodeURIComponent(ext as string)}`
        const res = await fetch(`/api/pix/status?${params}`)
        const json = await res.json()
        if (!cancelled && json.paid) setPriorityPaid(true)
      } catch {
        // silencioso
      }
    }

    void check()
    const interval = setInterval(check, 4000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [priorityPix, priorityPaid])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Fechar" />
      <div
        className="relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl sm:rounded-3xl"
        style={{ backgroundColor: colors.cardBg }}
      >
        {/* Header */}
        <div
          className="sticky top-0 flex items-center justify-between px-5 py-4"
          style={{ backgroundColor: colors.cardBg }}
        >
          <h2 className="text-lg font-bold" style={{ color: colors.text }}>
            {paymentConfirmed ? "Pagamento confirmado!" : pix ? "Pague com PIX" : title}
          </h2>
          <button 
            onClick={onClose} 
            aria-label="Fechar" 
            className="rounded-full p-1.5 transition-colors hover:bg-black/5"
            style={{ color: colors.subtext }}
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-5">
          {paymentConfirmed ? (
            /* Tela de pós-pagamento */
            <div className="flex flex-col items-center gap-5 py-4">
              {/* Popup do Entregável */}
              {shouldShowDeliverable ? (
                <>
                  {/* Ícone de presente/entrega */}
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${colors.accent}15` }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" style={{ color: colors.accent }}>
                      <path
                        d="M20 12v10H4V12M2 7h20v5H2V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <div className="text-center">
                    <h3 className="text-xl font-bold" style={{ color: colors.text }}>
                      {deliverableTitle}
                    </h3>
                    {deliverableDescription && (
                      <p className="mt-2 text-[14px] leading-relaxed" style={{ color: colors.subtext }}>
                        {deliverableDescription}
                      </p>
                    )}
                  </div>

                  {deliverableButtonUrl.trim() ? (
                    <a
                      href={deliverableButtonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full rounded-full py-4 text-center text-[15px] font-semibold transition-all active:scale-[0.98]"
                      style={{ backgroundColor: colors.accent, color: "#ffffff" }}
                    >
                      {deliverableButtonText}
                    </a>
                  ) : (
                    <p className="text-center text-[14px] leading-relaxed" style={{ color: colors.subtext }}>
                      {deliverableButtonText || "Seu conteúdo foi liberado com sucesso."}
                    </p>
                  )}

                  <button
                    onClick={onClose}
                    className="w-full rounded-full border py-3 text-[14px] font-medium transition-colors hover:bg-black/5"
                    style={{ borderColor: `${colors.subtext}30`, color: colors.text }}
                  >
                    Fechar
                  </button>
                </>
              ) : priorityPix && !priorityPaid ? (
                /* QR Code do PIX de entrega prioritária */
                <>
                  <div className="text-center">
                    <h3 className="text-xl font-bold" style={{ color: colors.text }}>
                      Pague para receber agora
                    </h3>
                    <p className="mt-2 text-[14px] leading-relaxed" style={{ color: colors.subtext }}>
                      Escaneie o QR Code abaixo para liberar seu acesso instantaneamente.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-4">
                    {priorityPix.qrCodeBase64 ? (
                      <img src={priorityPix.qrCodeBase64} alt="QR Code PIX" width={180} height={180} />
                    ) : (
                      <QRCodeSVG value={priorityPix.qrCode} size={180} level="H" marginSize={2} />
                    )}
                  </div>
                  <p className="text-2xl font-bold" style={{ color: colors.text }}>
                    {brl(priorityPix.amount)}
                  </p>

                  <div className="w-full">
                    <p
                      className="mb-2 max-h-20 overflow-y-auto break-all rounded-xl border px-3 py-2 text-xs"
                      style={{ borderColor: `${colors.subtext}33`, color: colors.subtext, backgroundColor: colors.background }}
                    >
                      {priorityPix.pixCopiaECola || priorityPix.qrCode}
                    </p>
                    <button
                      onClick={async () => {
                        const codeToCopy = priorityPix.pixCopiaECola || priorityPix.qrCode
                        try {
                          await navigator.clipboard.writeText(codeToCopy)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        } catch {
                          const ta = document.createElement("textarea")
                          ta.value = codeToCopy
                          document.body.appendChild(ta)
                          ta.select()
                          document.execCommand("copy")
                          document.body.removeChild(ta)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        }
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[15px] font-semibold transition-transform active:scale-[0.98]"
                      style={{ backgroundColor: colors.accent, color: "#ffffff" }}
                    >
                      <IconCopy />
                      {copied ? "Copiado!" : "Copiar código PIX"}
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-[13px]" style={{ color: colors.subtext }}>
                    <span
                      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                      aria-hidden="true"
                    />
                    Aguardando pagamento...
                  </div>
                </>
              ) : (
                /* Tela padrão de pós-pagamento */
                <>
                  {/* Ícone de sucesso */}
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${colors.accent}15` }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" style={{ color: colors.accent }}>
                      <path
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <div className="text-center">
                    <h3 className="text-xl font-bold" style={{ color: colors.text }}>
                      {queueEnabled ? "Pagamento aprovado!" : "Obrigada pela compra!"}
                    </h3>
                    <p className="mt-2 text-[14px] leading-relaxed" style={{ color: colors.subtext }}>
                      {queueEnabled
                        ? "Seu pedido está na fila de entrega."
                        : "Seu conteúdo já está a caminho. O acesso será liberado em instantes."}
                    </p>
                  </div>

                  {/* Info da fila (só quando o upsell de fila está ligado) */}
                  {queueEnabled && !priorityPaid && (
                    <div
                      className="flex w-full items-center gap-4 rounded-2xl p-4"
                      style={{ backgroundColor: colors.background }}
                    >
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${colors.subtext}10` }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" style={{ color: colors.subtext }}>
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px]" style={{ color: colors.subtext }}>
                          Tempo estimado de espera
                        </p>
                        <p className="text-lg font-bold" style={{ color: colors.text }}>
                          {queueHours} {queueHours === 1 ? "hora" : "horas"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Motivo da fila (ex.: alto volume de compras no momento) */}
                  {queueEnabled && queueReason.trim() && !priorityPaid && (
                    <p className="text-center text-[13px] leading-relaxed" style={{ color: colors.subtext }}>
                      {queueReason}
                    </p>
                  )}

                  {/* Upsell de entrega prioritária */}
                  {priorityEnabled && !priorityPix && !priorityPaid && (
                    <div
                      className="flex w-full flex-col gap-4 rounded-2xl border-2 p-4"
                      style={{ borderColor: colors.accent, backgroundColor: `${colors.accent}05` }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: colors.accent }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
                            <path
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold" style={{ color: colors.text }}>
                            Quer receber agora?
                          </p>
                          <p className="mt-1 text-[13px] leading-relaxed" style={{ color: colors.subtext }}>
                            Pague <strong style={{ color: colors.accent }}>{priorityPrice}</strong> e receba seu acesso instantaneamente, sem esperar na fila!
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handlePriority}
                        disabled={priorityLoading}
                        className="w-full rounded-full py-3.5 text-[15px] font-semibold transition-all active:scale-[0.98] disabled:opacity-60"
                        style={{ backgroundColor: colors.accent, color: "#ffffff" }}
                      >
                        {priorityLoading ? "Gerando PIX..." : `${priorityText} por ${priorityPrice}`}
                      </button>
                    </div>
                  )}

                  {/* Assinatura personalizada da modelo quando não há fila */}
                  {!queueEnabled && modelName?.trim() && !deliverableEnabled && (
                    <p className="text-center text-[13px] italic" style={{ color: colors.subtext }}>
                      Com carinho, <strong style={{ color: colors.text }}>{modelName.trim()}</strong>
                    </p>
                  )}

                  <button
                    onClick={onClose}
                    className="w-full rounded-full border py-3 text-[14px] font-medium transition-colors hover:bg-black/5"
                    style={{ borderColor: `${colors.subtext}30`, color: colors.text }}
                  >
                    Fechar
                  </button>
                </>
              )}
            </div>
          ) : showCallUpsell && !pix ? (
            /* Oferta da chamada de vídeo (upsell após clicar em Gerar PIX) */
            <div className="flex flex-col gap-4 py-1">
              {/* Foto com degradê que funde no fundo do bloco */}
              <div className="relative mx-auto w-full max-w-[190px]">
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
                  <img
                    src={callUpsellImage || "/call-upsell-photo.jpg"}
                    alt="Foto da modelo"
                    className="h-full w-full object-cover object-top"
                  />
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
                    style={{
                      background: `linear-gradient(to top, ${colors.cardBg} 6%, transparent 100%)`,
                    }}
                  />
                </div>
              </div>

              <div className="-mt-3 flex flex-col items-center gap-2.5 text-center">
                <h3 className="text-xl font-bold text-balance" style={{ color: colors.text }}>
                  {callUpsellTitle}
                </h3>
                <p className="text-[14px] leading-relaxed text-pretty" style={{ color: colors.subtext }}>
                  {callUpsellDescription}
                </p>
              </div>

              {/* Preço em destaque */}
              <div
                className="flex items-center justify-between rounded-2xl border px-4 py-3.5"
                style={{ borderColor: `${colors.accent}30`, backgroundColor: `${colors.accent}08` }}
              >
                <span className="text-[14px] font-medium" style={{ color: colors.text }}>
                  Chamada de vídeo (10 min)
                </span>
                <span className="text-[16px] font-bold" style={{ color: colors.accent }}>
                  {callUpsellPrice}
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => handleGenerate({ addCall: true })}
                  disabled={loading}
                  className="w-full rounded-full py-4 text-[15px] font-semibold transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{ backgroundColor: colors.accent, color: "#ffffff" }}
                >
                  {loading ? "Gerando PIX..." : "Sim, quero"}
                </button>
                <button
                  onClick={() => handleGenerate({ addCall: false })}
                  disabled={loading}
                  className="w-full rounded-full border py-3.5 text-[14px] font-medium transition-colors hover:bg-black/5 disabled:opacity-60"
                  style={{ borderColor: `${colors.subtext}30`, color: colors.subtext }}
                >
                  Vou perder
                </button>
              </div>
            </div>
          ) : directMode && !pix ? (
            <div className="flex flex-col items-center gap-5 py-8">
              {errorMsg ? (
                <>
                  <p className="text-center text-sm font-medium text-red-600">{errorMsg}</p>
                  <button
                    onClick={() => handleGenerate()}
                    disabled={loading}
                    className="w-full rounded-full py-3.5 text-[15px] font-semibold transition-all active:scale-[0.98] disabled:opacity-60"
                    style={{ backgroundColor: colors.accent, color: "#ffffff" }}
                  >
                    {loading ? "Gerando PIX..." : "Tentar novamente"}
                  </button>
                </>
              ) : (
                <>
                  <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-current border-t-transparent" style={{ color: colors.accent }} aria-hidden="true" />
                  <p className="text-center text-[15px] font-medium" style={{ color: colors.text }}>Gerando seu PIX...</p>
                  <p className="text-center text-[13px]" style={{ color: colors.subtext }}>{plan.name} • {brl(total)}</p>
                </>
              )}
            </div>
          ) : !pix ? (
            <>
              {/* Plano selecionado */}
              <div
                className="flex items-center justify-between rounded-2xl border px-4 py-3.5"
                style={{ borderColor: `${colors.subtext}15`, backgroundColor: colors.background }}
              >
                <span className="text-[15px] font-medium" style={{ color: colors.text }}>
                  {plan.name}
                </span>
                <span className="text-[15px] font-bold" style={{ color: colors.accent }}>
                  {plan.price}
                </span>
              </div>

              <p className="text-[14px] leading-relaxed" style={{ color: colors.subtext }}>
                {subtitle}
              </p>

              {/* Order bumps / mimos */}
              {activeBumps.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <p className="text-[13px] font-medium" style={{ color: colors.subtext }}>
                    Adicione extras ao seu pedido
                  </p>
                  {activeBumps.map((bump) => {
                    const checked = !!selectedBumps[bump.id]
                    return (
                      <button
                        key={bump.id}
                        type="button"
                        onClick={() => setSelectedBumps((s) => ({ ...s, [bump.id]: !s[bump.id] }))}
                        className="flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all"
                        style={{
                          borderColor: checked ? colors.accent : `${colors.subtext}15`,
                          backgroundColor: checked ? `${colors.accent}08` : colors.background,
                        }}
                      >
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-colors"
                          style={{
                            backgroundColor: checked ? colors.accent : `${colors.subtext}12`,
                          }}
                        >
                          {checked && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" className="h-3 w-3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                        {bump.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={bump.imageUrl || "/placeholder.svg"} alt="" className="h-11 w-11 rounded-xl object-cover" />
                        ) : null}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-medium" style={{ color: colors.text }}>
                            {bump.title}
                          </span>
                          {bump.description && (
                            <span className="block truncate text-[12px]" style={{ color: colors.subtext }}>
                              {bump.description}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-[14px] font-bold" style={{ color: colors.accent }}>
                          +{bump.price}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {errorMsg && <p className="text-sm font-medium text-red-600">{errorMsg}</p>}

              {/* Aviso de compra sigilosa e entrega anônima */}
              <div
                className="flex items-start gap-3 rounded-2xl px-4 py-3"
                style={{ backgroundColor: `${colors.subtext}08` }}
              >
                <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-4 w-4 shrink-0" style={{ color: colors.subtext }}>
                  <path
                    d="M12 1C8.676 1 6 3.676 6 7v2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V11a2 2 0 00-2-2h-1V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4zm0 10a2 2 0 110 4 2 2 0 010-4z"
                    fill="currentColor"
                  />
                </svg>
                <p className="text-[13px] leading-relaxed" style={{ color: colors.subtext }}>
                  Seus dados permanecem anônimos. O acesso é entregue de forma privada e, na fatura, aparece apenas <strong style={{ color: colors.text }}>&quot;Compra Online&quot;</strong>.
                </p>
              </div>

              {/* Total + botão */}
              <div className="flex flex-col gap-4 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[14px]" style={{ color: colors.subtext }}>
                    Total
                  </span>
                  <span className="text-xl font-bold" style={{ color: colors.text }}>
                    {brl(total)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    // Se o upsell de chamada está ligado, mostra a oferta antes de gerar.
                    if (callUpsellEnabled) {
                      setErrorMsg("")
                      setShowCallUpsell(true)
                      return
                    }
                    void handleGenerate()
                  }}
                  disabled={loading}
                  className="w-full rounded-full py-4 text-[15px] font-semibold transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{ backgroundColor: colors.accent, color: "#ffffff" }}
                >
                  {loading ? "Gerando PIX..." : "Gerar PIX"}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* QR Code */}
              <div className="flex flex-col items-center gap-4">
                <p className="text-center text-sm" style={{ color: colors.subtext }}>
                  Escaneie o QR Code ou copie o código abaixo no app do seu banco.
                </p>
                <div className="rounded-2xl bg-white p-4">
                  {pix.qrCodeBase64 ? (
                    <img src={pix.qrCodeBase64} alt="QR Code PIX" width={200} height={200} />
                  ) : (
                    <QRCodeSVG value={pix.qrCode} size={200} level="H" marginSize={2} />
                  )}
                </div>
                <p className="text-2xl font-bold" style={{ color: colors.text }}>
                  {brl(pix.amount)}
                </p>

                <div className="w-full">
                  <p
                    className="mb-2 max-h-24 overflow-y-auto break-all rounded-xl border px-3 py-2 text-xs"
                  style={{ borderColor: `${colors.subtext}33`, color: colors.subtext, backgroundColor: colors.background }}
                >
                  {pix.pixCopiaECola || pix.qrCode}
                </p>
                  <button
                    onClick={handleCopy}
                    className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[16px] font-semibold transition-transform active:scale-[0.98]"
                    style={{ backgroundColor: colors.accent, color: "#ffffff" }}
                  >
                    <IconCopy />
                    {copied ? "Copiado!" : "Copiar código PIX"}
                  </button>
                </div>

                <p className="text-center text-xs" style={{ color: colors.subtext }}>
                  Assim que o pagamento for confirmado, o acesso é liberado automaticamente.
                </p>

                {/* Indicador: aguardando confirmação automática via webhook */}
                <div className="mt-1 flex items-center justify-center gap-2 text-[13px]" style={{ color: colors.subtext }}>
                  <span
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden="true"
                  />
                  Aguardando pagamento...
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
