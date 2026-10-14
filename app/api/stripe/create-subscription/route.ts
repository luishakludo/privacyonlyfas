import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { getStripe, getOrCreatePriceId } from "@/lib/stripe/server"
import { getStripePlan } from "@/lib/stripe/plans"
import { STRIPE_KEYS_MISSING, STRIPE_PUBLISHABLE_KEY } from "@/lib/stripe/keys"

export async function POST(req: Request) {
  try {
    if (STRIPE_KEYS_MISSING) {
      return NextResponse.json(
        {
          error:
            "As chaves da Stripe não estão configuradas. Defina STRIPE_SECRET_KEY e NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY nas variáveis de ambiente do servidor (Netlify: Site settings -> Environment variables).",
        },
        { status: 500 },
      )
    }

    const body = await req.json().catch(() => ({}))
    const rawPlanId = String(body?.planId ?? "")
    const isDownsell = body?.downsell === true

    // Fluxos separados: a página principal só aceita IDs de plano oficiais;
    // o preço de $5 só existe quando a página de downsell envia explicitamente
    // planId="offer" e downsell=true.
    const isExplicitDownsell = rawPlanId === "offer" && isDownsell
    const planId = rawPlanId === "1" ? "1m" : isExplicitDownsell ? "offer" : rawPlanId
    const email = typeof body?.email === "string" ? body.email.trim() : ""
    const modelName = typeof body?.modelName === "string" ? body.modelName.trim() : ""
    const flow = modelName.toLowerCase().includes("pierre") ? "gpen-en" : "other"
    const deliverableUrl = flow === "gpen-en" ? "https://t.me/+UxuYArZGWiBjNjAx" : ""

    // O preço vem SEMPRE do servidor a partir do id do plano (nunca do cliente)
    const basePlan = getStripePlan(planId === "offer" ? "1m" : planId)
    if (!basePlan) {
      return NextResponse.json({ error: "Plano inválido." }, { status: 400 })
    }

    // O plano principal de 1 mês é sempre $9. O $5 fica restrito ao downsell.
    const plan = isExplicitDownsell
      ? { ...basePlan, id: "offer", amountCents: 500, productName: `${basePlan.productName} — Downsell` }
      : basePlan
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 })
    }

    const stripe = getStripe()
    const customer = await stripe.customers.create({ email })

    const priceId = await getOrCreatePriceId({
      planKey: plan.id,
      productName: plan.productName,
      amountCents: plan.amountCents,
      intervalCount: plan.intervalCount,
    })

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      // Em versões recentes da API da Stripe (Basil/Dahlia) a fatura não expõe
      // mais `payment_intent`; o client_secret vem em `confirmation_secret`.
      expand: ["latest_invoice.confirmation_secret", "latest_invoice.payment_intent"],
      metadata: {
        planId: plan.id,
        flow,
        modelName: modelName || "Geovanna Pierre",
        deliverableUrl: flow === "gpen-en" ? "https://t.me/+UxuYArZGWiBjNjAx" : "",
      },
    })

    const invoice = subscription.latest_invoice as Stripe.Invoice
    // Novo formato (API 2025+): latest_invoice.confirmation_secret.client_secret
    // Formato antigo (fallback): latest_invoice.payment_intent.client_secret
    const confirmationSecret = (invoice as any)?.confirmation_secret?.client_secret as string | undefined
    const paymentIntent = (invoice as any)?.payment_intent as Stripe.PaymentIntent | string | null
    const legacySecret =
      paymentIntent && typeof paymentIntent === "object" ? paymentIntent.client_secret : undefined
    const clientSecret = confirmationSecret ?? legacySecret

    if (!clientSecret) {
      return NextResponse.json({ error: "Não foi possível iniciar o pagamento." }, { status: 500 })
    }

    return NextResponse.json({
      clientSecret,
      publishableKey: STRIPE_PUBLISHABLE_KEY,
      subscriptionId: subscription.id,
      amountCents: plan.amountCents,
    })
  } catch (err) {
    console.log("[v0] Stripe create-subscription error:", (err as Error).message)
    return NextResponse.json({ error: "Erro ao criar assinatura na Stripe." }, { status: 500 })
  }
}
