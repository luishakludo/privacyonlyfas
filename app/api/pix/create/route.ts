import { nanoid } from "nanoid"
import { type NextRequest, NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

type BumpInput = { title: string; price: number }
type GatewayType = "hyzepay" | "nexuspag"

// Chave AtenasPay no hardcode (usada por todas as modelos por padrão).
// A API da AtenasPay segue o mesmo formato da NexusPag (header x-api-key).
const ATENASPAY_API_KEY = "atenaspay_live_e51723ce4d671220f44bbbb86ed5b5f2915499a03667a55a146240e72e04b5fa"
const ATENASPAY_BASE_URL = "https://atenaspay.com.br"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // Trata amount que pode vir como número (24.88) ou string ("24,88" / "24.88")
    let amount: number
    if (typeof body.amount === "string") {
      // Remove tudo exceto dígitos e converte de centavos para reais
      // "R$ 24,88" -> "2488" -> 24.88
      // "24.88" -> "2488" -> 24.88  
      // "24,88" -> "2488" -> 24.88
      const digits = body.amount.replace(/\D/g, "")
      amount = digits ? Number.parseInt(digits, 10) / 100 : 0
    } else {
      amount = Number(body.amount) || 0
    }
    let email: string = (body.email || "").trim()
    const modelId: string | null = body.modelId || null
    // Permite forçar a gateway pela página (ex.: /nescau sempre na AtenasPay).
    const forceGateway: GatewayType | null =
      body.forceGateway === "nexuspag" || body.forceGateway === "hyzepay" ? body.forceGateway : null
    const planName: string | null = body.planName || null
    const modelName: string | null = typeof body.modelName === "string" ? body.modelName.trim() : null
    const requestedDescription: string | null =
      typeof body.description === "string" ? body.description.trim() : null
    const bumps: BumpInput[] = Array.isArray(body.bumps) ? body.bumps : []
    const description = requestedDescription || [
      `1 mês${modelName ? ` (${modelName})` : ""}`,
      ...bumps.map((bump) => bump.title.trim()).filter(Boolean),
    ].join(" + ")

    // 1) Validações básicas
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valor inválido." }, { status: 400 })
    }
    // No modo "PIX direto" o e-mail não é coletado. Geramos um e-mail interno
    // só para registrar a transação; se vier um e-mail válido, usamos ele.
    if (!email) {
      email = `pix-${nanoid(10)}@pix-direto.local`
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 })
    }

    let supabase: ReturnType<typeof getServerSupabase> | null = null
    try {
      supabase = getServerSupabase()
    } catch {
      supabase = null
    }

    // 2) Lê as configurações de gateway da tabela settings (opcional).
    // Se o Supabase falhar ou não existir, seguimos com o padrão AtenasPay
    // (chave no hardcode). Nunca bloqueia a geração do PIX por causa disso.
    let map: Record<string, string> = {}
    if (supabase) {
      try {
        const { data: settingsRows } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", ["hyzepay_public_key", "hyzepay_secret_key", "nexuspag_secret_key", "active_gateway"])
        map = Object.fromEntries((settingsRows ?? []).map((r: any) => [r.key, r.value])) as Record<string, string>
      } catch {
        map = {}
      }
    }
    // Padrão: AtenasPay (nexuspag) para todas as modelos.
    // Se a página forçar uma gateway, ela tem prioridade sobre o banco.
    const activeGateway: GatewayType = forceGateway || (map.active_gateway as GatewayType) || "nexuspag"

    // 3) Processa de acordo com a gateway ativa
    const externalId = nanoid(16)
    const amountInCents = Math.round(amount * 100)

    let transactionId: string
    let qrCode: string | undefined
    let pixCopiaECola: string | undefined

    if (activeGateway === "nexuspag") {
      // ============ ATENASPAY ============
      // Usa a chave configurada no painel; se não houver, cai na key do hardcode.
      const nexusSecretKey = (map.nexuspag_secret_key || "").trim() || ATENASPAY_API_KEY

      const payload = {
        amount: amount, // Valor em reais com ponto decimal (ex: 24.88)
        description,
        external_id: externalId,
        expiration: 1800,
      }

      console.log("[v0] AtenasPay payload:", JSON.stringify(payload))

      const response = await fetch(`${ATENASPAY_BASE_URL}/api/pix/create`, {
        method: "POST",
        headers: {
          "x-api-key": nexusSecretKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const apiResponse = await response.json().catch(() => ({}))
      console.log("[v0] AtenasPay response:", response.status, JSON.stringify(apiResponse))

      if (!response.ok) {
        return NextResponse.json(
          { error: apiResponse.error || "Erro ao criar transação PIX (AtenasPay)." },
          { status: response.status },
        )
      }

      const nexusTransaction = apiResponse.transaction || apiResponse
      if (!nexusTransaction.id && !nexusTransaction.txid) {
        return NextResponse.json({ error: "Resposta incompleta da API AtenasPay." }, { status: 500 })
      }

      transactionId = nexusTransaction.id || nexusTransaction.txid
      qrCode = nexusTransaction.qr_code_base64
      pixCopiaECola = nexusTransaction.pix_copia_cola

    } else {
      // ============ HYZEPAY ============
      const publicKey = (map.hyzepay_public_key || "").trim()
      const secretKey = (map.hyzepay_secret_key || "").trim()

      if (!publicKey || !secretKey) {
        return NextResponse.json(
          { error: "Chaves da HyzePay não configuradas. Acesse Integrações no painel." },
          { status: 400 },
        )
      }

      // Autenticação Basic = base64("public:secret")
      const credentials = Buffer.from(`${publicKey}:${secretKey}`).toString("base64")

      const payload = {
        amount: amountInCents,
        payment_method: "pix",
        customer: {
          name: email.split("@")[0] || "Cliente PIX",
          email,
          document: { type: "cpf", number: "12345678909" },
          phone: "11999999999",
        },
        items: [{ title: planName || "Assinatura", quantity: 1, unit_price: amountInCents }],
        external_id: externalId,
        metadata: { order_id: externalId, timestamp: new Date().toISOString() },
        ip: req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "127.0.0.1",
      }

      const response = await fetch("https://api.hyzepay.com/v1/payment-transaction/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify(payload),
      })

      const apiResponse = await response.json().catch(() => ({}))

      if (!response.ok) {
        return NextResponse.json(
          { error: apiResponse.error_messages?.[0] || "Erro ao criar transação PIX (HyzePay)." },
          { status: response.status },
        )
      }

      const hyzePayResponse = apiResponse.data || apiResponse
      if (!hyzePayResponse.id) {
        return NextResponse.json({ error: "Resposta incompleta da API HyzePay." }, { status: 500 })
      }

      transactionId = hyzePayResponse.id
      const pixData = hyzePayResponse.pix || {}
      qrCode = pixData.qr_code as string | undefined
    }

    // 4) Registra o pagamento no Supabase (status pendente; webhook marca como pago depois).
    // Opcional: se o Supabase estiver indisponível, não bloqueia a geração do PIX.
    if (supabase) {
      try {
        await supabase.from("payments").insert({
          model_id: modelId,
          email,
          amount,
          status: "pendente",
          gateway: activeGateway,
          plan_name: planName,
          bumps,
          transaction_id: transactionId,
          external_id: externalId,
          qr_code: qrCode ?? null,
        })
      } catch (e) {
        console.log("[v0] falha ao registrar pagamento (ignorado):", e)
      }
    }

    return NextResponse.json(
      {
        success: true,
        transactionId,
        qrCode,
        pixCopiaECola,
        amount,
        externalId,
        gateway: activeGateway,
        status: "pending",
      },
      { status: 201 },
    )
  } catch (error) {
    console.log("[v0] erro no /api/pix/create:", error)
    return NextResponse.json({ error: "Erro ao processar pagamento." }, { status: 500 })
  }
}
