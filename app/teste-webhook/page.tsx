"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type TestPayment = {
  id: string
  transaction_id: string
  external_id: string
  amount: number
  status: string
  created_at: string
  paid_at: string | null
}

type WebhookResponse = {
  success?: boolean
  status?: string
  error?: string
}

export default function TesteWebhookPage() {
  const [payment, setPayment] = useState<TestPayment | null>(null)
  const [webhookResponse, setWebhookResponse] = useState<WebhookResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"idle" | "created" | "paid">("idle")

  // 1. Cria um pagamento de teste direto no banco
  async function criarPagamentoTeste() {
    setLoading(true)
    setWebhookResponse(null)
    
    try {
      const res = await fetch("/api/teste-webhook/criar", { method: "POST" })
      const data = await res.json()
      
      if (data.error) {
        alert("Erro: " + data.error)
        return
      }
      
      setPayment(data.payment)
      setStep("created")
    } catch (err) {
      alert("Erro ao criar pagamento de teste")
    } finally {
      setLoading(false)
    }
  }

  // 2. Simula o webhook da Raiz Pay (manda PAID)
  async function simularWebhookPago() {
    if (!payment) return
    setLoading(true)
    
    try {
      // Monta o payload no formato da Raiz Pay
      const webhookPayload = {
        Id: payment.transaction_id,
        ExternalId: payment.external_id,
        Status: "PAID",
        PaidAt: new Date().toISOString(),
        Amount: payment.amount,
        PaymentMethod: "pix",
      }

      const res = await fetch("/api/pix/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookPayload),
      })
      
      const data = await res.json()
      setWebhookResponse(data)
      
      if (data.success) {
        // Busca o pagamento atualizado
        const updated = await fetch(`/api/teste-webhook/buscar?id=${payment.id}`).then(r => r.json())
        if (updated.payment) {
          setPayment(updated.payment)
          setStep("paid")
        }
      }
    } catch (err) {
      setWebhookResponse({ error: "Erro ao chamar webhook" })
    } finally {
      setLoading(false)
    }
  }

  // 3. Reset para novo teste
  function resetarTeste() {
    setPayment(null)
    setWebhookResponse(null)
    setStep("idle")
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Teste de Webhook - Raiz Pay</h1>
          <p className="text-muted-foreground mt-2">
            Simula o fluxo completo: criar PIX pendente e receber webhook de pagamento
          </p>
        </div>

        {/* Etapa 1: Criar pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold ${step !== "idle" ? "bg-green-500 text-white" : "bg-muted"}`}>
                1
              </span>
              Criar Pagamento de Teste
            </CardTitle>
            <CardDescription>
              Cria um pagamento pendente direto no banco (sem chamar a API externa)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "idle" ? (
              <Button onClick={criarPagamentoTeste} disabled={loading}>
                {loading ? "Criando..." : "Criar Pagamento Pendente (R$ 10,00)"}
              </Button>
            ) : (
              <div className="rounded-lg bg-green-500/10 p-4 text-sm">
                Pagamento criado com sucesso!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mostra dados do pagamento */}
        {payment && (
          <Card>
            <CardHeader>
              <CardTitle>Dados do Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-auto rounded-lg bg-muted p-4 text-xs">
{JSON.stringify({
  id: payment.id,
  transaction_id: payment.transaction_id,
  external_id: payment.external_id,
  amount: payment.amount,
  status: payment.status,
  created_at: payment.created_at,
  paid_at: payment.paid_at,
}, null, 2)}
              </pre>
              <div className="mt-4 flex items-center gap-2">
                <span className="font-medium">Status atual:</span>
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                  payment.status === "pago" 
                    ? "bg-green-500/20 text-green-500" 
                    : "bg-yellow-500/20 text-yellow-500"
                }`}>
                  {payment.status.toUpperCase()}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Etapa 2: Simular webhook */}
        {step === "created" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-sm font-bold">
                  2
                </span>
                Simular Webhook (Raiz Pay)
              </CardTitle>
              <CardDescription>
                Envia um POST para /api/pix/webhook com Status: PAID
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="mb-2 text-sm font-medium">Payload que sera enviado:</p>
                <pre className="overflow-auto text-xs">
{JSON.stringify({
  Id: payment?.transaction_id,
  ExternalId: payment?.external_id,
  Status: "PAID",
  PaidAt: "2025-06-03T...",
  Amount: payment?.amount,
  PaymentMethod: "pix",
}, null, 2)}
                </pre>
              </div>
              <Button onClick={simularWebhookPago} disabled={loading}>
                {loading ? "Enviando..." : "Simular Webhook PAID"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Resposta do webhook */}
        {webhookResponse && (
          <Card>
            <CardHeader>
              <CardTitle>Resposta do Webhook</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className={`overflow-auto rounded-lg p-4 text-xs ${
                webhookResponse.success ? "bg-green-500/10" : "bg-red-500/10"
              }`}>
{JSON.stringify(webhookResponse, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Sucesso final */}
        {step === "paid" && (
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="text-green-500">Teste Concluido!</CardTitle>
              <CardDescription>
                O webhook atualizou o pagamento de PENDENTE para PAGO corretamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={resetarTeste} variant="outline">
                Fazer Novo Teste
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
