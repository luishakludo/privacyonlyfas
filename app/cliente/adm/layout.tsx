import type React from "react"
import { AdminGate } from "@/components/dashboard/admin-gate"

// Protege TODAS as rotas do painel (/cliente/adm, /modelos, /pagamentos, /configuracoes).
export default function AdmLayout({ children }: { children: React.ReactNode }) {
  return <AdminGate>{children}</AdminGate>
}
