"use client"

import { useState } from "react"

type TesteResult = {
  success?: boolean
  transactionId?: string | null
  externalId?: string
  amount?: number
  qrCode?: string | null
  pixCopiaECola?: string | null
  error?: string
  raw?: unknown
}

// Normaliza o base64 do QR: aceita já com "data:image..." ou puro.
function toImgSrc(qr: string) {
  if (qr.startsWith("data:image")) return qr
  return `data:image/png;base64,${qr}`
}

export default function TestePixPage() {
  const [amount, setAmount] = useState("24,88")
  const [description, setDescription] = useState("Teste PIX AtenasPay")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TesteResult | null>(null)
  const [copied, setCopied] = useState(false)

  async function gerarPix() {
    setLoading(true)
    setResult(null)
    setCopied(false)
    try {
      const res = await fetch("/api/pix/teste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, description }),
      })
      const data = (await res.json()) as TesteResult
      setResult(data)
    } catch (e) {
      setResult({ error: "Falha na requisição. Verifique a conexão." })
    } finally {
      setLoading(false)
    }
  }

  async function copiar() {
    if (!result?.pixCopiaECola) return
    await navigator.clipboard.writeText(result.pixCopiaECola)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0b0b] p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#161616] p-6 text-white shadow-2xl">
        <header className="mb-6">
          <span className="inline-flex items-center rounded-full bg-[#f56708]/15 px-3 py-1 text-xs font-semibold text-[#f56708]">
            AtenasPay
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-balance">
            Teste de geração de PIX
          </h1>
          <p className="mt-1 text-sm text-white/50 text-pretty">
            Gera um QR Code PIX direto na AtenasPay usando a chave no hardcode do site.
          </p>
        </header>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="amount" className="text-xs font-semibold text-white/70">
              Valor
            </label>
            <input
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="24,88"
              className="rounded-xl border border-white/10 bg-[#0b0b0b] px-3 py-2.5 text-sm outline-none focus:border-[#f56708]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-xs font-semibold text-white/70">
              Descrição
            </label>
            <input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do pagamento"
              className="rounded-xl border border-white/10 bg-[#0b0b0b] px-3 py-2.5 text-sm outline-none focus:border-[#f56708]"
            />
          </div>

          <button
            onClick={gerarPix}
            disabled={loading}
            className="mt-1 rounded-xl bg-[#f56708] px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Gerando PIX..." : "Gerar PIX"}
          </button>
        </div>

        {result?.error && (
          <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
            {result.error}
          </div>
        )}

        {result?.success && (
          <div className="mt-6 flex flex-col items-center gap-4 border-t border-white/10 pt-6">
            {result.qrCode ? (
              <img
                src={toImgSrc(result.qrCode) || "/placeholder.svg"}
                alt="QR Code PIX gerado pela AtenasPay"
                className="h-56 w-56 rounded-xl bg-white p-2"
              />
            ) : (
              <p className="text-sm text-white/50">QR Code não retornado pela API.</p>
            )}

            {result.pixCopiaECola && (
              <div className="w-full">
                <p className="mb-1.5 text-xs font-semibold text-white/70">PIX copia e cola</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={result.pixCopiaECola}
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0b0b0b] px-3 py-2.5 text-xs text-white/70"
                  />
                  <button
                    onClick={copiar}
                    className="shrink-0 rounded-xl border border-white/10 px-3 py-2.5 text-xs font-semibold hover:bg-white/5"
                  >
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>
            )}

            <p className="w-full text-center text-xs text-white/40">
              Transação: {result.transactionId ?? "—"}
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
