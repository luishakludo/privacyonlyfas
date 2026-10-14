"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckoutModal } from "./checkout-modal"
import { StripeCheckoutModal } from "./stripe-checkout-modal"
import { useExitRedirect } from "@/lib/landing/use-exit-redirect"
import { priceToNumber, type OrderBump } from "@/lib/supabase/use-models"
import type { StripeLabels } from "@/lib/i18n/onlyfans-content"

type OfferColors = {
  background: string
  text: string
  subtext: string
  accent: string
  cardBg: string
}

type OfferData = {
  username?: string
  handle?: string
  avatar?: string
  coverImage?: string
  isVerified?: boolean
  colors?: OfferColors
  modelId?: string
  forceGateway?: "nexuspag" | "hyzepay"
  paymentProvider?: "pix" | "stripe"
  stripeLabels?: StripeLabels
  orderBumps?: OrderBump[]
  checkout?: {
    title?: string
    subtitle?: string
    mode?: "completo" | "direto"
    queueEnabled?: boolean
    queueHours?: number
    queueReason?: string
    priorityEnabled?: boolean
    priorityPrice?: string
    priorityText?: string
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
}

const VerifiedBadge = ({ className = "w-5 h-5", color = "#f97316" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill={color} aria-hidden="true" className={className}>
    <path d="M190.6 71.4C203 47.9 227.7 32 256 32s53 15.9 65.4 39.4c3.6 6.8 11.5 10.1 18.8 7.8c25.4-7.8 54.1-1.6 74.1 18.4s26.2 48.7 18.4 74.1c-2.3 7.3 1 15.2 7.8 18.8C464.1 203 480 227.7 480 256s-15.9 53-39.4 65.4c-6.8 3.6-10.1 11.5-7.8 18.8c7.8 25.4 1.6 54.1-18.4 74.1s-48.7 26.2-74.1 18.4c-7.3-2.3-15.2 1-18.8 7.8C309 464.1 284.3 480 256 480s-53-15.9-65.4-39.4c-3.6-6.8-11.5-10.1-18.8-7.8c-25.4 7.8-54.1 1.6-74.1-18.4s-26.2-48.7-18.4-74.1c2.3-7.3-1-15.2-7.8-18.8C47.9 309 32 284.3 32 256s15.9-53 39.4-65.4c6.8-3.6 10.1-11.5 7.8-18.8c-7.8-25.4-1.6-54.1 18.4-74.1s48.7-26.2 74.1-18.4c7.3 2.3 15.2-1 18.8-7.8zM369.3 231.3c6.2-6.2 6.2-16.4 0-22.6s-16.4-6.2-22.6 0L224 297.4l-52.7-52.7c-6.2-6.2-16.4-6.2-22.6 0s-6.2 16.4 0 22.6l64 64c6.2 6.2 16.4 6.2 22.6 0l128-128z" />
  </svg>
)

const IconCheck = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconClock = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7 12 12 15 14" />
  </svg>
)

const IconBolt = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
  </svg>
)

function pct(original: number, discounted: number) {
  if (!original || discounted >= original) return 0
  return Math.round((1 - discounted / original) * 100)
}

/**
 * Tela de desconto do funil (downsell). Visual TOTALMENTE diferente da tela do
 * Privacy: é uma landing focada só na oferta — foto, preço "de/por", contador de
 * urgência e um único botão que abre o PIX. O preço vem por prop (nada hardcode no visual).
 */
export function DiscountOfferPage({
  data,
  price,
  originalPrice = "R$ 19,90",
  planName = "1 mês",
  headline = "Espera! Preparei um desconto especial pra você",
  subheadline = "Só por agora, garanta o acesso completo pagando muito menos.",
  benefits = [
    "Acesso completo a todo o conteúdo",
    "Conteúdo sem censura, atualizado toda semana",
    "Chamadas e conteúdos exclusivos",
    "Cancele quando quiser",
  ],
  ctaText = "QUERO MEU DESCONTO AGORA",
  badgeText = "OFERTA EXCLUSIVA",
  exitRedirectUrl,
}: {
  data: OfferData
  price: string
  originalPrice?: string
  planName?: string
  headline?: string
  subheadline?: string
  benefits?: string[]
  ctaText?: string
  badgeText?: string
  exitRedirectUrl?: string
}) {
  const colors = data.colors || {
    background: "#f9f6f2",
    text: "#1a202c",
    subtext: "#4a5568",
    accent: "#f97316",
    cardBg: "#ffffff",
  }

  const username = data.username || "SeuNome"
  const displayHandle = (data.handle || "@seunome").startsWith("@")
    ? data.handle || "@seunome"
    : `@${data.handle}`
  const avatar = data.avatar || ""
  const coverImage = data.coverImage || ""
  const isVerified = data.isVerified !== false

  const orderBumps = data.orderBumps ?? []
  const checkoutCopy = data.checkout ?? {}

  const [checkoutOpen, setCheckoutOpen] = useState(false)

  // Downsell: só redireciona se ela não estiver no checkout.
  useExitRedirect(exitRedirectUrl, !checkoutOpen)

  const discountPct = useMemo(
    () => pct(priceToNumber(originalPrice), priceToNumber(price)),
    [originalPrice, price],
  )

  // Contador regressivo de urgência (10 min), só visual.
  const [secondsLeft, setSecondsLeft] = useState(10 * 60)
  useEffect(() => {
    const t = window.setInterval(() => {
      setSecondsLeft((s) => (s <= 0 ? 0 : s - 1))
    }, 1000)
    return () => window.clearInterval(t)
  }, [])
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0")
  const ss = String(secondsLeft % 60).padStart(2, "0")

  const plan = { id: "offer", name: planName, price }

  return (
    <div
      className="min-h-screen font-sans flex flex-col items-center justify-center px-4 py-8"
      style={{ backgroundColor: colors.background }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl shadow-xl"
        style={{ backgroundColor: colors.cardBg }}
      >
        {/* Faixa de urgência no topo */}
        <div
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-center"
          style={{ backgroundColor: colors.accent, color: "#ffffff" }}
        >
          <IconClock className="w-4 h-4" />
          <span className="text-[13px] font-bold tracking-wide">
            {badgeText} • EXPIRA EM {mm}:{ss}
          </span>
        </div>

        {/* Foto de capa */}
        <div className="relative w-full aspect-[16/10] overflow-hidden">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverImage || "/placeholder.svg"} alt={username} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full" style={{ backgroundColor: colors.subtext, opacity: 0.15 }} />
          )}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)" }}
          />
          {/* Avatar + nome sobre a capa */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center gap-3">
            <div
              className="h-14 w-14 shrink-0 overflow-hidden rounded-full border-2"
              style={{ borderColor: "#ffffff" }}
            >
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar || "/placeholder.svg"} alt={username} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full" style={{ backgroundColor: colors.accent }} />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[16px] font-bold text-white">{username}</span>
                {isVerified && <VerifiedBadge className="h-4 w-4" color="#ffffff" />}
              </div>
              <span className="block truncate text-[13px] text-white/80">{displayHandle}</span>
            </div>
          </div>
        </div>

        {/* Conteúdo da oferta */}
        <div className="flex flex-col gap-5 px-5 pb-6 pt-5">
          <div className="flex flex-col gap-1.5 text-center">
            <h1 className="text-balance text-[22px] font-extrabold leading-tight" style={{ color: colors.text }}>
              {headline}
            </h1>
            <p className="text-pretty text-[14px] leading-relaxed" style={{ color: colors.subtext }}>
              {subheadline}
            </p>
          </div>

          {/* Bloco de preço de/por */}
          <div
            className="flex flex-col items-center gap-1 rounded-2xl px-4 py-5"
            style={{ backgroundColor: colors.background }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-medium line-through" style={{ color: colors.subtext }}>
                {originalPrice}
              </span>
              {discountPct > 0 && (
                <span
                  className="rounded-full px-2 py-0.5 text-[12px] font-bold text-white"
                  style={{ backgroundColor: colors.accent }}
                >
                  -{discountPct}%
                </span>
              )}
            </div>
            <div className="flex items-end gap-2">
              <span className="text-[40px] font-extrabold leading-none" style={{ color: colors.text }}>
                {price}
              </span>
            </div>
            <span className="text-[13px] font-medium" style={{ color: colors.subtext }}>
              {planName} de acesso completo
            </span>
          </div>

          {/* Benefícios */}
          <ul className="flex flex-col gap-2.5">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-3">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: colors.accent, color: "#ffffff" }}
                >
                  <IconCheck className="h-3.5 w-3.5" />
                </span>
                <span className="text-[14px] leading-snug" style={{ color: colors.text }}>
                  {b}
                </span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            type="button"
            onClick={() => setCheckoutOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-[15px] font-extrabold text-white shadow-lg transition-transform active:scale-[0.98]"
            style={{ backgroundColor: colors.accent }}
          >
            <IconBolt className="h-5 w-5" />
            {ctaText}
          </button>

          <p className="text-center text-[12px]" style={{ color: colors.subtext }}>
            {data.paymentProvider === "stripe"
              ? "Pagamento seguro via Stripe • Acesso liberado na hora"
              : "Pagamento único via PIX • Acesso liberado na hora"}
          </p>
        </div>
      </div>

      {checkoutOpen && data.paymentProvider === "stripe" ? (
        <StripeCheckoutModal
          plan={plan}
          modelName={username}
          downsell

          colors={colors}
          labels={data.stripeLabels}
          deliverable={{
            enabled: checkoutCopy.deliverableEnabled,
            title: checkoutCopy.deliverableTitle,
            description: checkoutCopy.deliverableDescription,
            buttonText: checkoutCopy.deliverableButtonText,
            buttonUrl: checkoutCopy.deliverableButtonUrl,
          }}
          onClose={() => setCheckoutOpen(false)}
        />
      ) : checkoutOpen ? (
        <CheckoutModal
          plan={plan}
          modelId={data.modelId}
          modelName={username}
          orderBumps={orderBumps}
          title={checkoutCopy.title || "Falta pouco!"}
            subtitle="Pagamento anônimo e acesso privado. Nenhum dado pessoal é necessário."
          checkoutConfig={{
            title: checkoutCopy.title || "Falta pouco!",
            subtitle: checkoutCopy.subtitle || "",
            mode: "completo",
            queueEnabled: checkoutCopy.queueEnabled ?? false,
            queueHours: checkoutCopy.queueHours ?? 3,
            queueReason: checkoutCopy.queueReason,
            priorityEnabled: checkoutCopy.priorityEnabled ?? false,
            priorityPrice: checkoutCopy.priorityPrice ?? "R$ 9,90",
            priorityText: checkoutCopy.priorityText ?? "Receber agora",
            callUpsellEnabled: checkoutCopy.callUpsellEnabled,
            callUpsellPrice: checkoutCopy.callUpsellPrice,
            callUpsellTitle: checkoutCopy.callUpsellTitle,
            callUpsellDescription: checkoutCopy.callUpsellDescription,
            deliverableEnabled: checkoutCopy.deliverableEnabled,
            deliverableTitle: checkoutCopy.deliverableTitle,
            deliverableButtonText: checkoutCopy.deliverableButtonText,
            deliverableButtonUrl: checkoutCopy.deliverableButtonUrl,
          }}
          colors={colors}
          forceGateway={data.forceGateway}
          startWithCallUpsell
          onClose={() => setCheckoutOpen(false)}
        />
      ) : null}
    </div>
  )
}
