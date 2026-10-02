"use client"

import { useState } from "react"
import {
  CreditCard,
  Clock,
  CheckCircle,
  CurrencyDollar,
  ArrowsClockwise,
} from "@phosphor-icons/react"
import { AdminShell } from "./admin-shell"
import { usePayments, type Payment } from "@/lib/supabase/use-models"

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })

type Filter = "todos" | "pendente" | "pago"

export function PagamentosView() {
  const { payments, isLoading, error, mutate } = usePayments()
  const [filter, setFilter] = useState<Filter>("todos")

  const paid = payments.filter((p) => p.status === "pago")
  const pending = payments.filter((p) => p.status === "pendente")
  const totalPaid = paid.reduce((s, p) => s + Number(p.amount || 0), 0)
  const totalPending = pending.reduce((s, p) => s + Number(p.amount || 0), 0)

  const stats = [
    { label: "Recebido (pago)", value: brl(totalPaid), icon: CurrencyDollar },
    { label: "Pendente", value: brl(totalPending), icon: Clock },
    { label: "Pagamentos pagos", value: String(paid.length), icon: CheckCircle },
    { label: "Total de PIX", value: String(payments.length), icon: CreditCard },
  ]

  const filtered = filter === "todos" ? payments : payments.filter((p) => p.status === filter)

  return (
    <AdminShell>
      <main className="flex-1 p-4 md:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="skeu-emboss text-2xl font-extrabold tracking-tight text-balance">Pagamentos</h1>
            <p className="text-sm text-[#0b0b0b]/55">PIX gerados no checkout — pendentes e aprovados.</p>
          </div>
          <button onClick={() => mutate()} className="skeu-btn px-3 py-2 text-sm font-semibold">
            <ArrowsClockwise className="h-4 w-4" weight="bold" />
            Atualizar
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="skeu-panel skeu-panel-hover p-5">
            <div className="skeu-chip flex h-10 w-10 items-center justify-center">
              <stat.icon className="h-5 w-5 text-white" weight="fill" />
              </div>
              <p className="skeu-emboss mt-4 text-2xl font-extrabold tracking-tight">{isLoading ? "…" : stat.value}</p>
              <p className="text-xs text-[#0b0b0b]/55">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="mt-6 flex gap-2">
          {(["todos", "pendente", "pago"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${
                filter === f ? "skeu-pill-active" : "skeu-pill"
              }`}
            >
              {f === "todos" ? "Todos" : f === "pendente" ? "Pendentes" : "Pagos"}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div className="skeu-panel mt-4 overflow-hidden">
          {error ? (
            <div className="px-5 py-14 text-center text-sm text-[#0b0b0b]/60">
              Não foi possível carregar os pagamentos. Rode o script{" "}
              <code className="font-mono">scripts/001_settings_and_payments.sql</code> no Supabase.
            </div>
          ) : isLoading ? (
            <div className="px-5 py-14 text-center text-sm text-[#0b0b0b]/60">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
              <div className="skeu-chip flex h-14 w-14 items-center justify-center rounded-2xl">
                <CreditCard className="h-6 w-6 text-white" weight="fill" />
              </div>
              <div>
                <p className="font-bold">Nenhum pagamento {filter !== "todos" ? `(${filter})` : "ainda"}</p>
                <p className="text-sm text-[#0b0b0b]/55">Os PIX gerados no checkout aparecem aqui.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#0b0b0b]/6">
              {filtered.map((p) => (
                <PaymentRow key={p.id} payment={p} />
              ))}
            </div>
          )}
        </div>
      </main>
    </AdminShell>
  )
}

function PaymentRow({ payment: p }: { payment: Payment }) {
  const isPaid = p.status === "pago"
  return (
    <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            isPaid
              ? "bg-green-100 text-green-600 border border-green-200"
              : "bg-amber-100 text-amber-600 border border-amber-200"
          }`}
        >
          {isPaid ? <CheckCircle className="h-5 w-5" weight="fill" /> : <Clock className="h-5 w-5" weight="fill" />}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold">{p.email || "Sem e-mail"}</p>
          <p className="truncate text-xs text-[#0b0b0b]/50">
            {p.model_name ? `${p.model_name} · ` : ""}
            {p.plan_name || "Assinatura"}
            {p.bumps.length > 0 ? ` · +${p.bumps.length} mimo(s)` : ""}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-[3.25rem] sm:pl-0">
        <span className="text-xs text-[#0b0b0b]/45">{fmtDate(p.created_at)}</span>
        <span className="font-bold text-[#c14e07]">{brl(Number(p.amount || 0))}</span>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
            isPaid
              ? "bg-green-100 text-green-600 border border-green-200"
              : "bg-amber-100 text-amber-600 border border-amber-200"
          }`}
        >
          {isPaid ? "Pago" : "Pendente"}
        </span>
      </div>
    </div>
  )
}
