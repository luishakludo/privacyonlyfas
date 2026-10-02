import { type NextRequest, NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

// Mesma chave/base usada no /api/pix/create (AtenasPay segue o formato NexusPag).
const ATENASPAY_API_KEY = "atenaspay_live_e51723ce4d671220f44bbbb86ed5b5f2915499a03667a55a146240e72e04b5fa"
const ATENASPAY_BASE_URL = "https://atenaspay.com.br"

// Consulta o status de um pagamento.
// 1) Primeiro tenta o Supabase (atualizado pelo webhook).
// 2) Se ainda não constar como pago, consulta a AtenasPay diretamente por GET
//    (x-api-key). Assim o "pagamento aprovado" aparece mesmo sem o webhook.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const transactionId = searchParams.get("transactionId")
    const externalId = searchParams.get("externalId")

    if (!transactionId && !externalId) {
      return NextResponse.json({ error: "Identificador ausente." }, { status: 400 })
    }

    let status = "pendente"
    let paidAt: string | null = null

    // 1) Supabase (não bloqueia caso esteja indisponível)
    try {
      const supabase = getServerSupabase()
      let query = supabase.from("payments").select("status, paid_at").limit(1)
      query = transactionId
        ? query.eq("transaction_id", transactionId)
        : query.eq("external_id", externalId as string)

      const { data } = await query.maybeSingle()
      status = data?.status ?? "pendente"
      paidAt = data?.paid_at ?? null
    } catch (e) {
      console.log("[v0] status: Supabase indisponível, seguindo com AtenasPay:", e)
    }

    // 2) Fallback: consulta a AtenasPay diretamente (GET) quando ainda não está pago.
    if (status !== "pago" && transactionId) {
      try {
        const res = await fetch(`${ATENASPAY_BASE_URL}/api/pix/${transactionId}`, {
          method: "GET",
          headers: { "x-api-key": ATENASPAY_API_KEY },
          cache: "no-store",
        })

        if (res.ok) {
          const data = await res.json().catch(() => ({}))
          const rawStatus = (data.status || "").toLowerCase()
          if (rawStatus === "paid") {
            status = "pago"
            paidAt = data.paid_at ?? new Date().toISOString()

            // Reflete no Supabase para as próximas consultas (best-effort).
            try {
              const supabase = getServerSupabase()
              await supabase
                .from("payments")
                .update({ status: "pago", paid_at: paidAt })
                .eq("transaction_id", transactionId)
            } catch {
              // ignora
            }
          } else if (rawStatus) {
            const map: Record<string, string> = {
              pending: "pendente",
              expired: "expirado",
              refunded: "estornado",
              cancelled: "cancelado",
            }
            status = map[rawStatus] ?? status
          }
        } else if (res.status === 404) {
          console.log("[v0] status AtenasPay: transação não encontrada", transactionId)
        } else if (res.status === 401) {
          console.log("[v0] status AtenasPay: API key inválida")
        }
      } catch (e) {
        console.log("[v0] status: falha ao consultar AtenasPay:", e)
      }
    }

    return NextResponse.json({ status, paid: status === "pago", paidAt })
  } catch (error) {
    console.log("[v0] erro no /api/pix/status:", error)
    return NextResponse.json({ error: "Erro ao consultar status." }, { status: 500 })
  }
}
