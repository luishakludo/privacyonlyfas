"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Lock, CircleNotch, Fire } from "@phosphor-icons/react"
import { supabase } from "@/lib/supabase/client"

const SESSION_KEY = "kane_adm_ok"
// Senha padrão usada caso ainda não exista nenhuma salva no Supabase.
// Na primeira validação ela é gravada na tabela `settings` automaticamente,
// então não é preciso rodar nenhum script SQL. Para trocar depois, basta
// dar UPDATE em settings (key = 'admin_password').
const DEFAULT_ADMIN_PASSWORD = "151515"
const LEGACY_ADMIN_PASSWORD = "16102812"

// Portão de acesso ao painel ADM. Toda rota dentro de /cliente/adm passa por aqui.
// A senha NÃO fica no código — é lida da tabela `settings` (key = 'admin_password').
export function AdminGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false)
  const [ready, setReady] = useState(false)
  const [pwd, setPwd] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "1") {
      setUnlocked(true)
    }
    setReady(true)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pwd.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "admin_password")
        .maybeSingle()

      let real = ((data?.value as string) ?? "").trim()

      // Cria a senha padrão quando não existe configuração salva.
      // Também migra automaticamente a senha padrão anterior para 151515.
      if (!real || real === LEGACY_ADMIN_PASSWORD) {
        real = DEFAULT_ADMIN_PASSWORD
        await supabase
          .from("settings")
          .upsert({ key: "admin_password", value: real }, { onConflict: "key" })
      }

      if (pwd.trim() === real) {
        sessionStorage.setItem(SESSION_KEY, "1")
        setUnlocked(true)
      } else {
        setError("Senha incorreta.")
        setPwd("")
      }
    } catch (e) {
      console.log("[v0] erro ao validar senha do ADM:", e)
      setError("Erro ao validar a senha. Tente novamente.")
    } finally {
      setSubmitting(false)
    }
  }

  // Evita piscar a tela de senha antes de checar a sessão.
  if (!ready) return null

  if (unlocked) return <>{children}</>

  return (
    <div className="skeu-app flex min-h-screen items-center justify-center p-4 text-[#0b0b0b]">
      <form onSubmit={handleSubmit} className="skeu-panel w-full max-w-sm p-6">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="skeu-chip mb-3 flex h-12 w-12 items-center justify-center">
            <Fire className="h-6 w-6 text-white" weight="fill" />
          </div>
          <h1 className="skeu-emboss text-lg font-extrabold tracking-tight">
            cliente<span className="text-[#f56708]">/adm</span>
          </h1>
          <p className="mt-1 text-sm text-[#0b0b0b]/55">Área restrita. Digite a senha para continuar.</p>
        </div>

        <label htmlFor="adm-pwd" className="mb-1.5 block text-sm font-semibold">
          Senha
        </label>
        <div className="skeu-inset flex items-center gap-2 px-3">
          <Lock className="h-4 w-4 shrink-0 text-[#0b0b0b]/40" weight="bold" />
          <input
            id="adm-pwd"
            type="password"
            inputMode="numeric"
            autoFocus
            value={pwd}
            onChange={(e) => {
              setPwd(e.target.value)
              setError(null)
            }}
            placeholder="••••••••"
            className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-[#0b0b0b]/30"
          />
        </div>

        {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !pwd.trim()}
          className="skeu-btn-primary mt-5 flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          {submitting && <CircleNotch className="h-4 w-4 animate-spin" />}
          Entrar
        </button>
      </form>
    </div>
  )
}
