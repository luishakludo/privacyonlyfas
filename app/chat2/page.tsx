import { headers } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

const BRAZIL_COUNTRY_CODE = "BR"
const BRAZIL_TELEGRAM_URL = "https://t.me/beatrizalbinabot"
const INTERNATIONAL_PAGE = "/gp-en2"

function getCountry(requestHeaders: Headers) {
  // Use the country resolved by the edge/proxy, never the browser language.
  // The first value is Vercel's trusted geo header; the others support common proxies.
  const countryHeaders = [
    "x-vercel-ip-country",
    "cf-ipcountry",
    "x-country-code",
    "x-country",
  ]

  for (const headerName of countryHeaders) {
    const value = requestHeaders.get(headerName)?.trim().toUpperCase()
    if (value && /^[A-Z]{2}$/.test(value)) return value
  }

  // Fail closed: an unknown country must never be sent to the Brazilian funnel.
  return null
}

export default async function Chat2RedirectPage() {
  const requestHeaders = await headers()
  const country = getCountry(requestHeaders)

  if (country === BRAZIL_COUNTRY_CODE) {
    redirect(BRAZIL_TELEGRAM_URL)
  }

  redirect(INTERNATIONAL_PAGE)
}
