import { type NextRequest, NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

// Busca um pagamento pelo ID (para ver se atualizou após o webhook)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID obrigatorio." }, { status: 400 })
    }

    const supabase = getServerSupabase()
    
    const { data, error } = await supabase
      .from("payments")
      .select("id, transaction_id, external_id, amount, status, created_at, paid_at")
      .eq("id", id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Pagamento nao encontrado." }, { status: 404 })
    }

    return NextResponse.json({ payment: data })
  } catch (error) {
    console.log("[teste-webhook/buscar] Erro:", error)
    return NextResponse.json({ error: "Erro ao buscar pagamento." }, { status: 500 })
  }
}
