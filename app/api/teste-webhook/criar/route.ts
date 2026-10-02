import { nanoid } from "nanoid"
import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

// Cria um pagamento de teste direto no banco (sem chamar API externa)
export async function POST() {
  try {
    const supabase = getServerSupabase()
    
    const transactionId = nanoid(32) // Simula o Id da Raiz Pay
    const externalId = nanoid(16)
    const amount = 10 // R$ 10,00 de teste

    const { data, error } = await supabase
      .from("payments")
      .insert({
        model_id: null,
        email: "teste@webhook.local",
        amount,
        status: "pendente",
        plan_name: "Teste Webhook",
        bumps: [],
        transaction_id: transactionId,
        external_id: externalId,
        qr_code: null,
      })
      .select()
      .single()

    if (error) {
      console.log("[teste-webhook] Erro ao criar pagamento:", error)
      return NextResponse.json({ error: "Falha ao criar pagamento de teste." }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: data.id,
        transaction_id: data.transaction_id,
        external_id: data.external_id,
        amount: data.amount,
        status: data.status,
        created_at: data.created_at,
        paid_at: data.paid_at,
      },
    })
  } catch (error) {
    console.log("[teste-webhook] Erro:", error)
    return NextResponse.json({ error: "Erro ao criar pagamento." }, { status: 500 })
  }
}
