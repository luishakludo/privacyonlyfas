"use client"

import Link from "next/link"
import {
  TrendUp,
  Clock,
  CurrencyDollar,
  UsersThree,
  Plus,
  ArrowRight,
} from "@phosphor-icons/react"
import { AdminShell } from "./admin-shell"
import { useModels, useDashboardStats } from "@/lib/supabase/use-models"

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })

export function KaneDashboard() {
  const { models, isLoading } = useModels()
  const { stats: dashStats, isLoading: statsLoading } = useDashboardStats()

  // Usa os stats reais dos pagamentos pagos
  const totalRevenue = dashStats?.totalRevenue ?? 0
  const totalPixPending = dashStats?.totalPixPending ?? 0
  const activeModels = dashStats?.activeModels ?? 0
  const conversion = dashStats?.conversion ?? 0

  const loading = isLoading || statsLoading

  const stats = [
    { label: "Receita total", value: brl(totalRevenue), icon: CurrencyDollar },
    { label: "Pix pendente", value: brl(totalPixPending), icon: Clock },
    { label: "Modelos ativos", value: String(activeModels), icon: UsersThree },
    { label: "Conversão", value: `${conversion.toFixed(1).replace(".", ",")}%`, icon: TrendUp },
  ]

  return (
    <AdminShell>
      <main className="flex-1 p-4 md:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="skeu-emboss text-2xl font-extrabold tracking-tight text-balance">Visão geral</h1>
            <p className="text-sm text-[#0b0b0b]/55">Acompanhe o desempenho de todas as suas páginas.</p>
          </div>
          <Link href="/cliente/adm/modelos" className="skeu-btn-primary px-4 py-2.5 text-sm font-semibold">
            <Plus className="h-4 w-4" weight="bold" />
            Nova modelo
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="skeu-panel skeu-panel-hover p-5">
              <div className="flex items-center justify-between">
                <div className="skeu-chip flex h-10 w-10 items-center justify-center">
                  <stat.icon className="h-5 w-5 text-white" weight="fill" />
                </div>
              </div>
              <p className="skeu-emboss mt-4 text-2xl font-extrabold tracking-tight">{loading ? "…" : stat.value}</p>
              <p className="text-xs text-[#0b0b0b]/55">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Resumo dos modelos */}
        <div className="skeu-panel mt-6 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#0b0b0b]/6 p-5">
            <div>
              <h2 className="skeu-emboss font-bold">Suas modelos</h2>
              <p className="text-xs text-[#0b0b0b]/55">
                {loading ? "Carregando..." : `${models.length} cadastrada(s)`}
              </p>
            </div>
            <Link href="/cliente/adm/modelos" className="skeu-btn px-3 py-2 text-sm font-semibold">
              Gerenciar
              <ArrowRight className="h-3.5 w-3.5" weight="bold" />
            </Link>
          </div>

          {!loading && models.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
              <div className="skeu-chip flex h-14 w-14 items-center justify-center rounded-2xl">
                <UsersThree className="h-6 w-6 text-white" weight="fill" />
              </div>
              <div>
                <p className="font-bold">Nenhuma modelo ainda</p>
                <p className="text-sm text-[#0b0b0b]/55">Crie sua primeira modelo para começar a acompanhar os dados.</p>
              </div>
              <Link href="/cliente/adm/modelos" className="skeu-btn-primary mt-1 px-4 py-2.5 text-sm font-semibold">
                <Plus className="h-4 w-4" weight="bold" />
                Criar modelo
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#0b0b0b]/6">
              {models.map((m) => (
                <Link
                  key={m.id}
                  href="/cliente/adm/modelos"
                  className="flex items-center justify-between p-5 transition-colors hover:bg-[#f56708]/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="skeu-chip flex h-10 w-10 items-center justify-center overflow-hidden rounded-full font-semibold">
                      {m.avatar_url ? (
                        <img
                          src={m.avatar_url || "/placeholder.svg"}
                          alt={m.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        m.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{m.name}</p>
                      <p className="text-xs text-[#0b0b0b]/45">{m.handle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-bold">{brl(m.pixPendingAmount)}</p>
                      <p className="text-[11px] text-[#0b0b0b]/45">pix pendente</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#c14e07]">{brl(m.revenue)}</p>
                      <p className="text-[11px] text-[#0b0b0b]/45">receita</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </AdminShell>
  )
}
