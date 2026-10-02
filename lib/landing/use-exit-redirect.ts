"use client"

import { useEffect, useRef } from "react"

/**
 * Redireciona para uma oferta somente quando o visitante demonstra intenção real de sair.
 * O hook não usa temporizador: a oferta só aparece ao voltar no navegador ou quando
 * o cursor sai pelo topo da janela no desktop.
 */
export function useExitRedirect(target?: string | null, enabled = true) {
  const fired = useRef(false)

  useEffect(() => {
    if (!enabled || !target || typeof window === "undefined") return

    let armed = false
    const armTimer = window.setTimeout(() => {
      armed = true
    }, 1200)

    try {
      window.history.pushState({ exitTrap: true }, "", window.location.href)
    } catch {
      // O navegador pode bloquear alterações no histórico.
    }

    const go = () => {
      if (fired.current || !armed) return
      fired.current = true
      window.location.assign(target)
    }

    const onPopState = () => {
      // Recoloca a entrada atual antes de navegar para evitar que o histórico
      // descarte a página antes do redirecionamento ser processado.
      try {
        window.history.pushState({ exitTrap: true }, "", window.location.href)
      } catch {
        // O navegador pode bloquear alterações no histórico.
      }
      go()
    }
    const onMouseOut = (event: MouseEvent) => {
      if (event.clientY <= 0 && !event.relatedTarget) go()
    }

    window.addEventListener("popstate", onPopState)
    document.addEventListener("mouseout", onMouseOut)

    return () => {
      window.clearTimeout(armTimer)
      window.removeEventListener("popstate", onPopState)
      document.removeEventListener("mouseout", onMouseOut)
    }
  }, [target, enabled])
}
