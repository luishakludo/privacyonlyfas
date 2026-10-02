import { headers } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

function getCountry(requestHeaders: Headers) {
  return (
    requestHeaders.get("x-vercel-ip-country") ||
    requestHeaders.get("cf-ipcountry") ||
    requestHeaders.get("x-country-code") ||
    requestHeaders.get("x-country") ||
    ""
  ).trim().toUpperCase()
}

export default async function Chat1RedirectPage() {
  const requestHeaders = await headers()
  const country = getCountry(requestHeaders)

  if (country === "BR") {
    redirect("https://t.me/geovannapierrebot")
  }

  redirect("/gp-en")
}
