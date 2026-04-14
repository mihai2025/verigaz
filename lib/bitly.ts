// lib/bitly.ts
// Wrapper peste Bitly API pentru shortening URL-uri în SMS-uri (≤160 chars).
// Token shared cu ghidulfunerar (BITLY_TOKEN).

const BITLY_TOKEN = process.env.BITLY_TOKEN || ""

export async function shortenUrl(longUrl: string): Promise<string> {
  if (!BITLY_TOKEN) throw new Error("BITLY_TOKEN lipsă din env.")
  if (!longUrl) throw new Error("URL gol.")

  const res = await fetch("https://api-ssl.bitly.com/v4/shorten", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${BITLY_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ long_url: longUrl }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Bitly error ${res.status}: ${body}`)
  }
  const json = await res.json()
  return json.link as string // ex: https://bit.ly/xxxxx (~22 chars)
}

/**
 * Safe wrapper: dacă Bitly eșuează sau token-ul lipsește, întoarce URL-ul original.
 * Dispatcher-ul trebuie să tolereze link-uri lungi ca fallback.
 */
export async function shortenUrlSafe(longUrl: string): Promise<string> {
  try {
    return await shortenUrl(longUrl)
  } catch (err) {
    console.warn("[bitly] shorten failed, fallback la URL original:", err)
    return longUrl
  }
}
