import { nanoid } from "nanoid"
import { type NextRequest, NextResponse } from "next/server"

// Rota de TESTE: gera um PIX direto na AtenasPay usando a chave no hardcode.
// Não depende do Supabase nem das configurações do painel — serve para validar
// rapidamente a integração e a geração do QR Code.
// A API da AtenasPay segue o mesmo formato da NexusPag (header x-api-key).
const ATENASPAY_API_KEY = "atenaspay_live_e51723ce4d671220f44bbbb86ed5b5f2915499a03667a55a146240e72e04b5fa"
const ATENASPAY_BASE_URL = "https://atenaspay.com.br"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    // Aceita amount como número (24.88) ou string ("24,88" / "R$ 24,88").
    let amount: number
    if (typeof body.amount === "string") {
      const digits = body.amount.replace(/\D/g, "")
      amount = digits ? Number.parseInt(digits, 10) / 100 : 0
    } else {
      amount = Number(body.amount) || 0
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valor inválido." }, { status: 400 })
    }

    const externalId = nanoid(16)
    const payload = {
      amount, // reais com ponto decimal (ex: 24.88)
      description: body.description || "Teste PIX AtenasPay",
      external_id: externalId,
      expiration: 1800,
    }

    console.log("[v0] Teste AtenasPay payload:", JSON.stringify(payload))

    const response = await fetch(`${ATENASPAY_BASE_URL}/api/pix/create`, {
      method: "POST",
      headers: {
        "x-api-key": ATENASPAY_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const apiResponse = await response.json().catch(() => ({}))
    console.log("[v0] Teste AtenasPay response:", response.status, JSON.stringify(apiResponse))

    if (!response.ok) {
      return NextResponse.json(
        {
          error: apiResponse.error || "Erro ao criar transação PIX (AtenasPay).",
          status: response.status,
          raw: apiResponse,
        },
        { status: response.status },
      )
    }

    const tx = apiResponse.transaction || apiResponse
    const transactionId = tx.id || tx.txid || null
    const qrCode = tx.qr_code_base64 || tx.qr_code || null
    const pixCopiaECola = tx.pix_copia_cola || tx.pix_copia_e_cola || tx.copy_paste || null

    return NextResponse.json(
      {
        success: true,
        transactionId,
        externalId,
        amount,
        qrCode,
        pixCopiaECola,
        raw: apiResponse,
      },
      { status: 201 },
    )
  } catch (error) {
    console.log("[v0] erro no /api/pix/teste:", error)
    return NextResponse.json({ error: "Erro ao processar teste de PIX." }, { status: 500 })
  }
}
