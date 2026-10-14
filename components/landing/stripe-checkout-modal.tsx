"use client"

import { useMemo, useState } from "react"
import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js"
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import type { StripeLabels } from "@/lib/i18n/onlyfans-content"

// Textos padrão (inglês) usados quando nenhuma tradução é fornecida.
const DEFAULT_LABELS: StripeLabels = {
  subscribeTo: "Subscribe to",
  emailLabel: "Email",
  emailPlaceholder: "you@email.com",
  emailHelp: "We'll send your access details to this email.",
  enterEmail: "Please enter your email.",
  continue: "Continue to payment",
  loading: "Loading...",
  processing: "Processing...",
  pay: "Pay",
  securedBy: "Secured by Stripe",
  checkDetails: "Please check your payment details.",
  paymentFailed: "Payment failed. Please try again.",
  networkError: "Network error. Please try again.",
  somethingWrong: "Something went wrong. Please try again.",
  successTitle: "You're in!",
  successBodyPre: "Your subscription is active. Check ",
  successBodyPost: " for your access details.",
  done: "Done",
  close: "Close",
}

type Colors = {
  background: string
  text: string
  subtext: string
  accent: string
  cardBg: string
}

type Plan = {
  id: string
  name: string
  price: string
  period?: string
}

type Deliverable = {
  enabled?: boolean
  title?: string
  description?: string
  buttonText?: string
  buttonUrl?: string
}

type Props = {
  plan: Plan
  modelName: string
  colors: Colors
  labels?: StripeLabels
  deliverable?: Deliverable
  downsell?: boolean
  onClose: () => void
}

const IconClose = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

const IconCheck = ({ className = "w-6 h-6" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

const IconGift = ({ className = "w-8 h-8" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 12v10H4V12M2 7h20v5H2V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
  </svg>
)

const IconLock = ({ className = "w-4 h-4" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

/** Formulário de pagamento em si (dentro do <Elements>) */
function PaymentForm({
  colors,
  plan,
  labels,
  clientSecret,
  onSuccess,
}: {
  colors: Colors
  plan: Plan
  labels: StripeLabels
  clientSecret: string
  onSuccess: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setSubmitting(true)
    setError(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message || labels.checkDetails)
      setSubmitting(false)
      return
    }

      const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: typeof window !== "undefined" ? window.location.href : "",
      },
      redirect: "if_required",
    })

    if (confirmError) {
      setError(confirmError.message || labels.paymentFailed)
      setSubmitting(false)
      return
    }

    // Só libera a entrega quando a Stripe confirmar status succeeded.
    const paymentIntentResult = await stripe.retrievePaymentIntent(clientSecret)
    if (paymentIntentResult.error || paymentIntentResult.paymentIntent?.status !== "succeeded") {
      setError(labels.paymentFailed)
      setSubmitting(false)
      return
    }

    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement options={{ layout: "tabs" }} />

      {error && (
        <p className="text-[13px] font-medium" style={{ color: "#e11d48" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="mt-1 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
        style={{ backgroundColor: colors.accent }}
      >
        {submitting ? labels.processing : `${labels.pay} ${plan.price}`}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-[12px]" style={{ color: colors.subtext }}>
        <IconLock className="h-3.5 w-3.5" />
        {labels.securedBy}
      </p>
    </form>
  )
}

export function StripeCheckoutModal({ plan, modelName, colors, labels: labelsProp, deliverable, downsell = false, onClose }: Props) {
  const labels = labelsProp ?? DEFAULT_LABELS
  const showDeliverable = deliverable?.enabled ?? false
  const browserLanguage = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "en"
  const localizedDeliverable = browserLanguage.startsWith("pt")
    ? { title: "Pagamento aprovado!", description: "Seu acesso foi liberado.", button: "Acessar conteúdo" }
    : browserLanguage.startsWith("es")
      ? { title: "¡Pago aprobado!", description: "Tu acceso ha sido liberado.", button: "Acceder al contenido" }
      : { title: "Payment approved!", description: "Your access has been unlocked.", button: "Access content" }
  const deliverableTitle = deliverable?.title?.trim() || localizedDeliverable.title
  const deliverableDescription = deliverable?.description?.trim() || localizedDeliverable.description
  const deliverableButtonText = deliverable?.buttonText?.trim() || localizedDeliverable.button
  const deliverableButtonUrl = deliverable?.buttonUrl?.trim() || ""
  const [step, setStep] = useState<"email" | "pay" | "success">("email")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [publishableKey, setPublishableKey] = useState<string | null>(null)

  const stripePromise = useMemo<Promise<StripeJs | null> | null>(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey],
  )

  const startPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError(labels.enterEmail)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, email: email.trim(), modelName, downsell }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || labels.somethingWrong)
        setLoading(false)
        return
      }
      setClientSecret(data.clientSecret)
      setPublishableKey(data.publishableKey)
      setStep("pay")
    } catch {
      setError(labels.networkError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label={labels.close}
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />

      <div
        className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl"
        style={{ backgroundColor: colors.cardBg }}
      >
        {/* Cabeçalho */}
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: `${colors.subtext}1f` }}
        >
          <div>
            <h3 className="text-[16px] font-bold" style={{ color: colors.text }}>
              {labels.subscribeTo} {modelName}
            </h3>
            <p className="text-[13px]" style={{ color: colors.subtext }}>
              {plan.name} • {plan.price} {plan.period || ""}
            </p>
          </div>
          <button
            type="button"
            aria-label={labels.close}
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ color: colors.subtext, backgroundColor: `${colors.subtext}14` }}
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-5">
          {step === "email" && (
            <form onSubmit={startPayment} noValidate className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: colors.text }}>
                  {labels.emailLabel}
                </label>
                <input
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={labels.emailPlaceholder}
                  className="w-full rounded-xl border px-4 py-3 text-[15px] outline-none focus:ring-2"
                  style={{
                    borderColor: `${colors.subtext}40`,
                    color: colors.text,
                    backgroundColor: colors.background,
                  }}
                />
                <p className="mt-1.5 text-[12px]" style={{ color: colors.subtext }}>
                  {labels.emailHelp}
                </p>
              </div>

              {error && (
                <p className="text-[13px] font-medium" style={{ color: "#e11d48" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-full px-6 py-3.5 text-[15px] font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
                style={{ backgroundColor: colors.accent }}
              >
                {loading ? labels.loading : labels.continue}
              </button>
            </form>
          )}

          {step === "pay" && clientSecret && stripePromise && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: { colorPrimary: colors.accent },
                },
              }}
            >
              <PaymentForm
                colors={colors}
                plan={plan}
                labels={labels}
                clientSecret={clientSecret}
                onSuccess={() => setStep("success")}
              />
            </Elements>
          )}

          {step === "success" && showDeliverable && (
            <div className="flex flex-col items-center py-6 text-center">
              <span
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: `${colors.accent}15`, color: colors.accent }}
              >
                <IconGift className="h-8 w-8" />
              </span>
              <h3 className="mt-4 text-[19px] font-bold" style={{ color: colors.text }}>
                {deliverableTitle}
              </h3>
              {deliverableDescription && (
                <p className="mt-2 text-[14px] leading-relaxed" style={{ color: colors.subtext }}>
                  {deliverableDescription}
                </p>
              )}
              {deliverableButtonUrl ? (
                <a
                  href={deliverableButtonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 w-full rounded-full px-6 py-3.5 text-center text-[15px] font-bold text-white transition-transform active:scale-[0.98]"
                  style={{ backgroundColor: colors.accent }}
                >
                  {deliverableButtonText}
                </a>
              ) : (
                <p className="mt-4 text-[14px] leading-relaxed" style={{ color: colors.subtext }}>
                  {deliverableButtonText}
                </p>
              )}
              <button
                onClick={onClose}
                className="mt-3 w-full rounded-full border py-3 text-[14px] font-medium"
                style={{ borderColor: `${colors.subtext}30`, color: colors.text }}
              >
                {labels.close}
              </button>
            </div>
          )}

          {step === "success" && !showDeliverable && (
            <div className="flex flex-col items-center py-6 text-center">
              <span
                className="flex h-16 w-16 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: "#22c55e" }}
              >
                <IconCheck className="h-8 w-8" />
              </span>
              <h3 className="mt-4 text-[19px] font-bold" style={{ color: colors.text }}>
                {labels.successTitle}
              </h3>
              <p className="mt-1 text-[14px]" style={{ color: colors.subtext }}>
                {labels.successBodyPre}
                <span className="font-semibold">{email}</span>
                {labels.successBodyPost}
              </p>
              <button
                onClick={onClose}
                className="mt-5 w-full rounded-full px-6 py-3.5 text-[15px] font-bold text-white transition-transform active:scale-[0.98]"
                style={{ backgroundColor: colors.accent }}
              >
                {labels.done}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
