import { PagamentosView } from "@/components/dashboard/pagamentos-view"

export const metadata = {
  title: "Pagamentos — Cliente/ADM",
  description: "Acompanhe os PIX pendentes e aprovados.",
}

export default function PagamentosPage() {
  return <PagamentosView />
}
