/**
 * ============================================================
 *  CHAVES DA STRIPE (VIA VARIÁVEIS DE AMBIENTE)
 * ============================================================
 *
 *  As chaves NÃO ficam no código. Você define elas no painel do
 *  servidor onde o site roda.
 *
 *  Na NETLIFY:
 *    Site settings -> Environment variables -> Add a variable
 *
 *    STRIPE_SECRET_KEY               = sk_live_...   (SECRETA, só servidor)
 *    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_... (pública, navegador)
 *
 *  Para testar localmente, crie um arquivo .env.local na raiz com as
 *  mesmas duas linhas.
 *
 *  IMPORTANTE: a secret key (sk_...) nunca deve ser commitada no código.
 */

export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? ""

export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""

/** true quando alguma das chaves ainda não foi definida no ambiente */
export const STRIPE_KEYS_MISSING = !STRIPE_SECRET_KEY || !STRIPE_PUBLISHABLE_KEY
