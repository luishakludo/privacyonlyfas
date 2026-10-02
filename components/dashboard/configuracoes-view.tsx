"use client"

import { useEffect, useState } from "react"
import {
  Eye,
  EyeSlash,
  Key,
  CircleNotch,
  Check,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
} from "@phosphor-icons/react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AdminShell } from "./admin-shell"
import { useSettings, type GatewayType, type GatewaySettings } from "@/lib/supabase/use-models"

export function ConfiguracoesView() {
  const { settings, isLoading, error, saveSettings } = useSettings()
  
  const [activeGateway, setActiveGateway] = useState<GatewayType>("hyzepay")
  const [hyzePublicKey, setHyzePublicKey] = useState("")
  const [hyzeSecretKey, setHyzeSecretKey] = useState("")
  const [nexusSecretKey, setNexusSecretKey] = useState("")
  
  const [showHyzeSecret, setShowHyzeSecret] = useState(false)
  const [showNexusSecret, setShowNexusSecret] = useState(false)
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (settings && !hydrated) {
      setActiveGateway(settings.activeGateway)
      setHyzePublicKey(settings.hyzepay.publicKey)
      setHyzeSecretKey(settings.hyzepay.secretKey)
      setNexusSecretKey(settings.nexuspag.secretKey)
      setHydrated(true)
    }
  }, [settings, hydrated])

  async function handleSave() {
    setStatus("saving")
    try {
      const next: GatewaySettings = {
        activeGateway,
        hyzepay: {
          publicKey: hyzePublicKey.trim(),
          secretKey: hyzeSecretKey.trim(),
        },
        nexuspag: {
          secretKey: nexusSecretKey.trim(),
        },
      }
      await saveSettings(next)
      setStatus("saved")
      setTimeout(() => setStatus("idle"), 2500)
    } catch (e) {
      console.log("[v0] erro ao salvar settings:", e)
      setStatus("error")
    }
  }

  return (
    <AdminShell>
      <main className="skeu-scope flex-1 p-4 md:p-8">
        <div className="mb-6">
          <h1 className="skeu-emboss text-2xl font-extrabold tracking-tight text-balance">Integrações</h1>
          <p className="text-sm text-[#0b0b0b]/55">Configure a gateway de pagamento para gerar os PIX do checkout.</p>
        </div>

        {error && (
          <div className="mb-4 max-w-2xl rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
            Não foi possível carregar as configurações. Rode o script{" "}
            <code className="font-mono">scripts/setup.sql</code> no Supabase.
          </div>
        )}

        {/* Seletor de Gateway */}
        <div className="skeu-panel max-w-2xl p-5 md:p-6 mb-4">
          <div className="mb-4">
            <h2 className="skeu-emboss font-bold mb-1">Gateway Ativa</h2>
            <p className="text-xs text-[#0b0b0b]/55">
              Selecione qual gateway será usada para processar os pagamentos PIX.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setActiveGateway("hyzepay")}
              className={`flex-1 rounded-xl border-2 p-4 text-left transition-all ${
                activeGateway === "hyzepay"
                  ? "border-[#f56708] bg-[#f56708]/5"
                  : "border-[#0b0b0b]/10 hover:border-[#0b0b0b]/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {activeGateway === "hyzepay" ? (
                  <ToggleRight className="h-5 w-5 text-[#f56708]" weight="fill" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-[#0b0b0b]/30" weight="fill" />
                )}
                <span className="font-bold">HyzePay</span>
              </div>
              <p className="text-xs text-[#0b0b0b]/55">
                Usa Public Key + Secret Key para autenticação Basic.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveGateway("nexuspag")}
              className={`flex-1 rounded-xl border-2 p-4 text-left transition-all ${
                activeGateway === "nexuspag"
                  ? "border-[#f56708] bg-[#f56708]/5"
                  : "border-[#0b0b0b]/10 hover:border-[#0b0b0b]/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {activeGateway === "nexuspag" ? (
                  <ToggleRight className="h-5 w-5 text-[#f56708]" weight="fill" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-[#0b0b0b]/30" weight="fill" />
                )}
                <span className="font-bold">NexusPag</span>
              </div>
              <p className="text-xs text-[#0b0b0b]/55">
                Usa apenas Secret Key (x-api-key) para autenticação.
              </p>
            </button>
          </div>
        </div>

        {/* HyzePay Config */}
        <div className={`skeu-panel max-w-2xl p-5 md:p-6 mb-4 transition-opacity ${activeGateway !== "hyzepay" ? "opacity-50" : ""}`}>
          <div className="mb-5 flex items-center gap-3">
            <div className="skeu-chip flex h-11 w-11 items-center justify-center">
              <Key className="h-5 w-5" weight="fill" />
            </div>
            <div>
              <h2 className="skeu-emboss font-bold">HyzePay</h2>
              <p className="text-xs text-[#0b0b0b]/55">
                Autenticação com <strong>Public Key</strong> + <strong>Secret Key</strong>.
              </p>
            </div>
            {activeGateway === "hyzepay" && (
              <span className="ml-auto text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                Ativa
              </span>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="hyze-public-key">Public Key</Label>
              <Input
                id="hyze-public-key"
                value={hyzePublicKey}
                onChange={(e) => setHyzePublicKey(e.target.value)}
                placeholder="hyzepay_live_xxxxxxxxxxxx"
                disabled={isLoading}
                autoComplete="off"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="hyze-secret-key">Secret Key</Label>
              <div className="relative">
                <Input
                  id="hyze-secret-key"
                  type={showHyzeSecret ? "text" : "password"}
                  value={hyzeSecretKey}
                  onChange={(e) => setHyzeSecretKey(e.target.value)}
                  placeholder="sk_live_xxxxxxxxxxxx"
                  disabled={isLoading}
                  autoComplete="off"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowHyzeSecret((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#0b0b0b]/45 hover:text-[#0b0b0b]"
                  aria-label={showHyzeSecret ? "Ocultar chave secreta" : "Mostrar chave secreta"}
                >
                  {showHyzeSecret ? <EyeSlash className="h-4 w-4" weight="bold" /> : <Eye className="h-4 w-4" weight="bold" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* NexusPag Config */}
        <div className={`skeu-panel max-w-2xl p-5 md:p-6 mb-4 transition-opacity ${activeGateway !== "nexuspag" ? "opacity-50" : ""}`}>
          <div className="mb-5 flex items-center gap-3">
            <div className="skeu-chip flex h-11 w-11 items-center justify-center">
              <Key className="h-5 w-5" weight="fill" />
            </div>
            <div>
              <h2 className="skeu-emboss font-bold">NexusPag</h2>
              <p className="text-xs text-[#0b0b0b]/55">
                Autenticação apenas com <strong>Secret Key</strong> (x-api-key).
              </p>
            </div>
            {activeGateway === "nexuspag" && (
              <span className="ml-auto text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                Ativa
              </span>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nexus-secret-key">Secret Key (API Key)</Label>
              <div className="relative">
                <Input
                  id="nexus-secret-key"
                  type={showNexusSecret ? "text" : "password"}
                  value={nexusSecretKey}
                  onChange={(e) => setNexusSecretKey(e.target.value)}
                  placeholder="nxp_live_xxxxxxxxxxxx"
                  disabled={isLoading}
                  autoComplete="off"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNexusSecret((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#0b0b0b]/45 hover:text-[#0b0b0b]"
                  aria-label={showNexusSecret ? "Ocultar chave secreta" : "Mostrar chave secreta"}
                >
                  {showNexusSecret ? <EyeSlash className="h-4 w-4" weight="bold" /> : <Eye className="h-4 w-4" weight="bold" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Aviso de segurança e botão salvar */}
        <div className="max-w-2xl">
          <div className="skeu-inset-orange flex items-start gap-2 px-3 py-2.5 text-xs text-[#0b0b0b]/70 mb-4">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#f56708]" weight="fill" />
            <span>
              As <strong>Secret Keys</strong> só são usadas no servidor (rota de geração do PIX) e nunca são expostas na
              página pública.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isLoading || status === "saving"}
              className="skeu-btn-primary px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {status === "saving" ? <CircleNotch className="h-4 w-4 animate-spin" /> : null}
              Salvar configurações
            </button>
            {status === "saved" && (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
                <Check className="h-4 w-4" weight="bold" />
                Salvo
              </span>
            )}
            {status === "error" && (
              <span className="text-sm font-medium text-red-600">Erro ao salvar. Rode o script SQL.</span>
            )}
          </div>
        </div>
      </main>
    </AdminShell>
  )
}
