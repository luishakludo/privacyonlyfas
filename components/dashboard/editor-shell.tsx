"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SquaresFour,
  UsersFour,
  CreditCard,
  GearSix,
  Fire,
  X,
  CircleNotch,
  Check,
  DeviceMobile,
  PencilSimple,
  Eye,
} from "@phosphor-icons/react"
import { PrivacyPage } from "@/components/landing/privacy-page"
import { mediasTotal, planTitle, type ModelConfig } from "@/lib/supabase/use-models"

const NAV = [
  { icon: SquaresFour, label: "Visão geral", href: "/cliente/adm" },
  { icon: UsersFour, label: "Modelos", href: "/cliente/adm/modelos" },
  { icon: CreditCard, label: "Pagamentos", href: "/cliente/adm/pagamentos" },
  { icon: GearSix, label: "Configurações", href: "/cliente/adm/configuracoes" },
]

// Rail lateral reduzido — só ícones, usado no modo de edição em tela cheia.
function IconRail() {
  const pathname = usePathname()
  return (
    <aside className="skeu-rail hidden w-16 shrink-0 flex-col items-center py-4 sm:flex">
      <Link
        href="/cliente/adm"
        aria-label="Visão geral"
        className="skeu-chip flex h-10 w-10 items-center justify-center"
      >
        <Fire className="h-5 w-5" weight="fill" />
      </Link>

      <nav className="mt-6 flex flex-col items-center gap-2">
        {NAV.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.label}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                active ? "skeu-nav-active" : "skeu-nav-idle"
              }`}
            >
              <item.icon className="h-[18px] w-[18px]" weight={active ? "fill" : "regular"} />
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

export function EditorShell({
  title,
  description,
  status,
  onClose,
  preview,
  children,
}: {
  title: string
  description: string
  status: "idle" | "saving" | "saved"
  onClose: () => void
  preview?: React.ReactNode
  children: React.ReactNode
}) {
  // No mobile só cabe uma coisa por vez: alterna entre o formulário e a prévia ao vivo.
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor")

  return (
    <div className="skeu-app skeu-scope fixed inset-0 z-50 flex text-[#0b0b0b]">
      <IconRail />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Cabeçalho */}
        <header className="skeu-topbar flex items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="min-w-0">
            <h2 className="skeu-emboss truncate text-base font-extrabold tracking-tight">{title}</h2>
            <p className="truncate text-xs text-[#0b0b0b]/55">{description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {/* Alternador Editar / Prévia — só no mobile, quando existe prévia */}
            {preview && (
              <div className="skeu-inset flex items-center gap-1 p-1 lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobileView("editor")}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                    mobileView === "editor" ? "skeu-nav-active" : "text-[#0b0b0b]/55"
                  }`}
                >
                  <PencilSimple className="h-3.5 w-3.5" weight="bold" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setMobileView("preview")}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                    mobileView === "preview" ? "skeu-nav-active" : "text-[#0b0b0b]/55"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" weight="bold" />
                  Prévia
                </button>
              </div>
            )}
            <span className="hidden items-center gap-1.5 text-xs font-medium text-[#0b0b0b]/55 sm:flex">
              {status === "saving" ? (
                <>
                  <CircleNotch className="h-3.5 w-3.5 animate-spin" />
                  Salvando...
                </>
              ) : status === "saved" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-600" weight="bold" />
                  Salvo
                </>
              ) : (
                "Salvamento automático"
              )}
            </span>
            <button
              onClick={onClose}
              aria-label="Fechar editor"
              className="skeu-btn flex h-9 w-9 items-center justify-center rounded-xl p-0"
            >
              <X className="h-5 w-5" weight="bold" />
            </button>
          </div>
        </header>

        {/* Corpo: editor à esquerda, preview à direita (no mobile, um por vez) */}
        <div className="flex flex-1 overflow-hidden">
          <section
            className={`no-scrollbar flex-1 overflow-y-auto p-4 md:p-6 ${
              mobileView === "preview" ? "hidden lg:block" : "block"
            }`}
          >
            <div className="mx-auto max-w-2xl">{children}</div>
          </section>

          {preview && (
            <aside
              className={`w-full shrink-0 items-start justify-center overflow-y-auto border-l border-[#0b0b0b]/10 bg-[#efe6d6] p-4 lg:w-[440px] lg:items-center lg:p-8 xl:w-[480px] ${
                mobileView === "preview" ? "flex" : "hidden lg:flex"
              }`}
            >
              {preview}
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}

// Monta os dados da página pública a partir da config em edição (preview ao vivo).
export function buildPreviewData(opts: {
  name: string
  handle: string
  avatar: string
  config: ModelConfig
  modelId?: string
}) {
  const c = opts.config
  const social = (s: { url: string; disabled: boolean }) => (s.disabled ? undefined : s.url || "#")
  return {
    username: opts.name || "SeuNome",
    handle: opts.handle || "@seunome",
    avatar: opts.avatar || "",
    coverImage: c.coverUrl,
    bio: c.bio,
    isVerified: c.verified,
    stats: c.stats,
    socialLinks: {
      instagram: social(c.socials.instagram),
      twitter: social(c.socials.twitter),
      tiktok: social(c.socials.tiktok),
    },
    subscriptions: c.plans.map((p) => ({ id: p.id, name: planTitle(p), price: p.price, badge: p.badge })),
    principalId: c.plansSettings.principalId ?? undefined,
    promoEnabled: c.plansSettings.promoEnabled,
    postsCount: c.postsCount,
    mediasCount: mediasTotal(c),
    posts: c.posts.length > 0 ? c.posts.map((p) => ({ id: p.id, type: "image" as const, url: p.url, blur: p.blur, imagesCount: p.imagesCount, videosCount: p.videosCount, likes: p.likes })) : undefined,
    gridSize: c.gridSize,
    medias: c.medias,
    modelId: opts.modelId,
    orderBumps: c.orderBumps,
    checkout: c.checkout,
  }
}

// Moldura de celular com a página pública renderizada ao vivo dentro.
export function PhonePreview({ data, caption }: { data: ReturnType<typeof buildPreviewData>; caption?: string }) {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div
        className="relative flex w-full max-w-[380px] shrink-0 flex-col overflow-hidden rounded-[2.8rem] border-[10px] border-[#1a1a1a] bg-[#f9f6f2] shadow-2xl sm:border-[12px]"
        style={{ 
          transform: "translateZ(0)",
          height: "min(680px, calc(100vh - 180px))",
        }}
      >
        {/* Área de conteúdo com scroll interno */}
        <div 
          className="no-scrollbar flex-1 overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <PrivacyPage data={data} />
        </div>
      </div>
      <p className="flex items-center gap-1.5 text-xs font-medium text-[#0b0b0b]/45">
        <DeviceMobile className="h-3.5 w-3.5" weight="duotone" />
        {caption ?? "Pré-visualização ao vivo"}
      </p>
    </div>
  )
}
