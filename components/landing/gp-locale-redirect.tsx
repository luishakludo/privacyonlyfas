"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function GpLocaleRedirect() {
  const router = useRouter()

  useEffect(() => {
    const language = navigator.language.toLowerCase()
    const isBrazilianPortuguese = language === "pt-br" || language.startsWith("pt-br-")

    if (!isBrazilianPortuguese) {
      router.replace("/gp-en")
    }
  }, [router])

  return null
}
