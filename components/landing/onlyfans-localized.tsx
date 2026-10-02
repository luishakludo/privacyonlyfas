"use client"

import { useEffect, useState } from "react"
import { OnlyFansPage } from "./onlyfans-page"
import {
  detectLocale,
  getOnlyFansContent,
  EN_DEFAULT,
  type EnEditable,
  type Locale,
} from "@/lib/i18n/onlyfans-content"

/**
 * Renderiza a página /en adaptando o idioma ao dispositivo do visitante.
 * Começa em inglês (padrão) no servidor/primeira renderização para evitar
 * divergência de hidratação e, ao montar no cliente, troca para espanhol
 * ou português (Portugal) conforme o idioma detectado.
 *
 * `source` vem do servidor (override do banco ou hard code), então o conteúdo
 * já é o correto no primeiro render — sem "piscar" o padrão.
 */
export function OnlyFansLocalized({
  source = EN_DEFAULT,
  exitRedirectUrl,
}: {
  source?: EnEditable
  /** Ao tentar sair da página, redireciona para esta URL (funil de desconto). */
  exitRedirectUrl?: string
}) {
  const [locale, setLocale] = useState<Locale>("en")

  useEffect(() => {
    const detected = detectLocale()
    if (detected !== "en") setLocale(detected)
    // Atualiza o atributo lang do documento para acessibilidade/SEO.
    document.documentElement.lang = detected === "pt" ? "pt-PT" : detected
  }, [])

  return <OnlyFansPage data={getOnlyFansContent(locale, source)} exitRedirectUrl={exitRedirectUrl} />
}
