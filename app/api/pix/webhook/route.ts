import { type NextRequest, NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

// Webhook unificado: suporta tanto HyzePay/RaizPay quanto NexusPag.
// Configure a URL https://SEU_DOMINIO/api/pix/webhook no painel de cada gateway.
//
// ============ HYZEPAY/RAIZPAY ============
// Formato esperado do payload:
// {
//   "Id": "a24207e615224923bf4a68265d519fc6",
//   "ExternalId": "27615041",
//   "Status": "PAID",
//   "PaidAt": "2025-11-05T21:19:42",
//   "Amount": 100,
//   ...
// }
// Status: PENDING, PAID, REFUNDED, REFUSED, CHARGEBACK, PRECHARGEBACK, EXPIRED, ERROR
//
// ============ NEXUSPAG ============
// Formato esperado do payload:
// {
//   "event": "pix.paid",
//   "data": {
//     "transaction_id": "82594c06-28a7-479e-a4b0-d29aca8d38e0",
//     "external_id": "pedido-123",
//     "status": "paid",
//     "paid_at": "2026-01-15T11:30:00.000Z",
//     "amount": 1000,
//     ...
//   }
// }
// Events: pix.paid, pix.expired

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    
    // Detecta qual gateway enviou o webhook
    // NexusPag pode enviar: { event: "pix.paid", data: {...} } OU diretamente { id, txid, status, ... }
    const isNexusPagEvent = body.event && typeof body.event === "string" && body.event.startsWith("pix.")
    const isNexusPagDirect = body.txid && body.id && !body.Id // Formato direto do NexusPag (tem txid, não tem PascalCase)
    const isNexusPag = isNexusPagEvent || isNexusPagDirect
    
    let transactionId: string | undefined
    let externalId: string | undefined
    let status: string
    let paidAt: string | undefined

    if (isNexusPagEvent) {
      // ============ NEXUSPAG (formato evento) ============
      const data = body.data || {}
      const event = body.event as string

      transactionId = data.transaction_id || data.id
      externalId = data.external_id
      paidAt = data.paid_at

      // Mapeia evento para status
      const eventStatusMap: Record<string, string> = {
        "pix.paid": "pago",
        "pix.expired": "expirado",
        "pix.refunded": "estornado",
        "pix.pending": "pendente",
      }
      status = eventStatusMap[event] || data.status?.toLowerCase() || "pendente"

    } else if (isNexusPagDirect) {
      // ============ NEXUSPAG (formato direto) ============
      // Payload: { id, txid, external_id, status, amount, paid_at, ... }
      transactionId = body.id || body.txid
      externalId = body.external_id
      paidAt = body.paid_at

      const rawStatus = (body.status || "").toLowerCase()
      const statusMap: Record<string, string> = {
        paid: "pago",
        pending: "pendente",
        expired: "expirado",
        refunded: "estornado",
        cancelled: "cancelado",
      }
      status = statusMap[rawStatus] || rawStatus || "pendente"

    } else {
      // ============ HYZEPAY/RAIZPAY ============
      const data = body.data || body

      // A Raiz Pay manda os campos em PascalCase (Id, Status, ExternalId).
      // Aceitamos também lowercase para compatibilidade.
      transactionId = data.Id || data.id || data.transaction_id
      externalId = data.ExternalId || data.external_id
      const rawStatus: string = (data.Status || data.status || "").toUpperCase()
      paidAt = data.PaidAt || data.paidAt || data.paid_at

      // Mapeia status da Raiz Pay para o nosso formato interno
      const statusMap: Record<string, string> = {
        PENDING: "pendente",
        PAID: "pago",
        REFUNDED: "estornado",
        REFUSED: "recusado",
        CHARGEBACK: "chargeback",
        PRECHARGEBACK: "pre-chargeback",
        EXPIRED: "expirado",
        ERROR: "erro",
        // Fallbacks para outros formatos
        APPROVED: "pago",
        COMPLETED: "pago",
        PROCESSING: "processando",
      }
      status = statusMap[rawStatus] || rawStatus.toLowerCase() || "pendente"
    }

    const isPaid = status === "pago"

    if (!transactionId && !externalId) {
      console.log("[webhook] Payload recebido sem identificador:", JSON.stringify(body))
      return NextResponse.json({ error: "Identificador da transação ausente." }, { status: 400 })
    }

    const supabase = getServerSupabase()
    const patch: Record<string, unknown> = { status }
    
    // Se foi pago, registra a data do pagamento
    if (isPaid) {
      // Usa a data que veio da gateway ou a data atual
      if (paidAt && paidAt !== "0001-01-01T00:00:00") {
        patch.paid_at = new Date(paidAt).toISOString()
      } else {
        patch.paid_at = new Date().toISOString()
      }
    }

    // Busca pelo transaction_id ou pelo external_id
    let query = supabase.from("payments").update(patch)
    query = transactionId 
      ? query.eq("transaction_id", transactionId) 
      : query.eq("external_id", externalId as string)
    
    const { error, count } = await query.select()
    
    if (error) {
      console.log("[webhook] Erro ao atualizar pagamento:", error)
      return NextResponse.json({ error: "Falha ao atualizar pagamento." }, { status: 500 })
    }

    const gateway = isNexusPag ? "nexuspag" : "hyzepay"
    console.log(`[webhook] Pagamento atualizado: gateway=${gateway}, status=${status}, id=${transactionId || externalId}`)

    return NextResponse.json({ success: true, status, gateway })
  } catch (error) {
    console.log("[webhook] Erro no webhook PIX:", error)
    return NextResponse.json({ error: "Erro no webhook." }, { status: 500 })
  }
}
