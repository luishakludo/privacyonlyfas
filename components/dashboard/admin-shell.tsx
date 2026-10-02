"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SquaresFour,
  UsersFour,
  CreditCard,
  GearSix,
  Fire,
  FileText,
} from "@phosphor-icons/react"

const NAV = [
  { icon: SquaresFour, label: "Visão geral", href: "/cliente/adm" },
  { icon: UsersFour, label: "Modelos", href: "/cliente/adm/modelos" },
  { icon: FileText, label: "Páginas", href: "/cliente/adm/paginas" },
  { icon: CreditCard, label: "Pagamentos", href: "/cliente/adm/pagamentos" },
  { icon: GearSix, label: "Configurações", href: "/cliente/adm/configuracoes" },
]

export function AdminShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="skeu-app flex min-h-screen text-[#0b0b0b]">
      {/* Sidebar */}
      <aside className="skeu-rail sticky top-0 hidden h-screen w-64 flex-col overflow-y-auto p-4 md:flex">
        <Link href="/cliente/adm" className="flex items-center gap-3 px-1 py-3">
          <div className="skeu-chip flex h-10 w-10 items-center justify-center">
            <Fire className="h-5 w-5" weight="fill" />
          </div>
          <div className="leading-tight">
            <p className="skeu-emboss text-base font-extrabold tracking-tight">
              cliente<span className="text-[#f56708]">/adm</span>
            </p>
            <p className="text-[11px] text-[#0b0b0b]/45">Painel de controle</p>
          </div>
        </Link>

        <nav className="mt-6 flex flex-col gap-1.5">
          {NAV.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                  active ? "skeu-nav-active" : "skeu-nav-idle"
                }`}
              >
                <item.icon className="h-[18px] w-[18px]" weight={active ? "fill" : "regular"} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile nav */}
        <nav className="skeu-topbar flex gap-1.5 overflow-x-auto px-4 py-2 md:hidden">
          {NAV.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold ${
                  active ? "skeu-nav-active" : "skeu-nav-idle"
                }`}
              >
                <item.icon className="h-3.5 w-3.5" weight={active ? "fill" : "regular"} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {children}
      </div>
    </div>
  )
}
