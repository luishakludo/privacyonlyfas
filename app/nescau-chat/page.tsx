"use client"

import { useEffect } from "react"

export default function NescauChatPage() {
  useEffect(() => {
    const previous = document.title
    document.title = "Não vai embora ainda"
    return () => { document.title = previous }
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#120f10] px-5 py-10 text-[#fff8f5]">
      <section className="w-full max-w-md text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#f4a261]">Espera só um pouquinho</p>
        <h1 className="text-balance text-4xl font-bold leading-tight">Não sai ainda, bb</h1>
        <p className="mt-5 text-pretty text-lg leading-7 text-[#d8c9c4]">Vem falar comigo de um jeito mais direto. Eu preparei um cantinho especial para você.</p>
        <a className="mt-8 flex min-h-14 items-center justify-center rounded-full bg-[#f97316] px-6 text-base font-bold text-white shadow-lg transition hover:bg-[#ea580c]" href="https://t.me/pretinhageovannabot" target="_blank" rel="noreferrer">Vem falar comigo</a>
        <p className="mt-5 text-sm text-[#a99b96]">Seu acesso está a um toque de distância.</p>
      </section>
    </main>
  )
}
