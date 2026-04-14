import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js"

const DIACRITICS: Record<string, string> = {
  ă: "a", â: "a", î: "i", ș: "s", ş: "s", ț: "t", ţ: "t",
  Ă: "a", Â: "a", Î: "i", Ș: "s", Ş: "s", Ț: "t", Ţ: "t",
}

function slugifyRO(text: string): string {
  return text.toLowerCase()
    .replace(/[ăâîșşțţĂÂÎȘŞȚŢ]/g, (ch) => DIACRITICS[ch] ?? ch)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function getPublicSupabase() {
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

function safeRedirectDest(param: string | null, fallback: string): string {
  if (!param) return fallback
  if (!param.startsWith("/") || param.startsWith("//")) return fallback
  return param
}

function setGeoCookie(res: NextResponse, lat: string, lng: string, city: string | null) {
  res.cookies.set(
    "geo",
    encodeURIComponent(JSON.stringify({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      city: city ? decodeURIComponent(city) : null,
      source: "ip",
      ts: Date.now(),
    })),
    { httpOnly: false, maxAge: 3600, path: "/", sameSite: "lax" }
  )
}

// Familii de rute SEO cu structură {prefix}/{judet}/{localitate}.
// Extinde aici când adaugi categorii noi.
const CITY_ROUTE_PREFIXES = [
  "servicii-gaze",
  "verificari-centrala",
  "revizii-centrala",
] as const
type RoutePrefix = typeof CITY_ROUTE_PREFIXES[number]

async function findCityRedirect(
  supabase: any,
  citySlug: string,
  prefix: RoutePrefix,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("localitati")
    .select("nume, judete(nume)")
    .order("nr_firme", { ascending: false })
    .limit(10000)

  if (error || !data?.length) return null

  const match = data.find((l: any) => slugifyRO(l.nume) === citySlug)
  if (!match) return null

  const judetNume = Array.isArray(match.judete)
    ? match.judete[0]?.nume
    : match.judete?.nume

  if (!judetNume) return null

  return `/${prefix}/${slugifyRO(judetNume)}/${citySlug}`
}

function matchCityRoute(
  pathname: string,
): { prefix: RoutePrefix; citySlug: string; kind: "dash" | "slash" } | null {
  for (const prefix of CITY_ROUTE_PREFIXES) {
    const dash = pathname.match(new RegExp(`^/${prefix}-([a-z0-9-]+)$`))
    if (dash) return { prefix, citySlug: dash[1], kind: "dash" }
    const slash = pathname.match(new RegExp(`^/${prefix}/([a-z0-9-]+)$`))
    if (slash) return { prefix, citySlug: slash[1], kind: "slash" }
  }
  return null
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Redirect flat city URLs → /{prefix}/{judet}/{localitate}
  // Acoperă: servicii-gaze, verificari-centrala, revizii-centrala
  const route = matchCityRoute(pathname)
  if (route) {
    try {
      const supabase = getPublicSupabase()

      if (route.kind === "slash") {
        const { data: allCounties } = await supabase.from("judete").select("nume")
        const isCounty = (allCounties ?? []).some((c: any) => slugifyRO(c.nume) === route.citySlug)
        if (!isCounty) {
          const redirectUrl = await findCityRedirect(supabase, route.citySlug, route.prefix)
          if (redirectUrl) {
            const url = req.nextUrl.clone()
            url.pathname = redirectUrl
            url.search = ""
            return NextResponse.redirect(url, 301)
          }
        }
      } else {
        const redirectUrl = await findCityRedirect(supabase, route.citySlug, route.prefix)
        if (redirectUrl) {
          const url = req.nextUrl.clone()
          url.pathname = redirectUrl
          url.search = ""
          return NextResponse.redirect(url, 301)
        }
      }
    } catch (e) {
      console.error("[middleware] city redirect error:", e)
    }
  }

  // Query params → SEO paths
  if (pathname === "/servicii") {
    const catParam = req.nextUrl.searchParams.get("cat")
    if (catParam && catParam !== "all") {
      const judetParam = req.nextUrl.searchParams.get("judet")
      const localiteParam = req.nextUrl.searchParams.get("localitate")
      let newPath = `/servicii/${encodeURIComponent(catParam)}`

      if (judetParam && judetParam !== "ro") {
        const supabase = getPublicSupabase()
        const { data: county } = await supabase
          .from("judete")
          .select("id, nume")
          .eq("id", Number(judetParam))
          .maybeSingle()

        if (county) {
          newPath += `/${slugifyRO(county.nume)}`

          if (localiteParam && localiteParam !== "all") {
            const { data: loc } = await supabase
              .from("localitati")
              .select("id, nume, judet_id")
              .eq("id", Number(localiteParam))
              .maybeSingle()

            if (loc) newPath += `/${slugifyRO(loc.nume)}--${slugifyRO(county.nume)}`
          }
        }
      }

      const url = req.nextUrl.clone()
      url.pathname = newPath
      url.search = ""
      return NextResponse.redirect(url, 301)
    }
  }

  const lat = req.headers.get("x-vercel-ip-latitude")
  const lng = req.headers.get("x-vercel-ip-longitude")
  const city = req.headers.get("x-vercel-ip-city")

  const isProtected = pathname.startsWith("/dashboard")
  const isLoginPage = pathname.startsWith("/login")

  if (!isProtected && !isLoginPage) {
    const res = NextResponse.next()
    if (lat && lng) setGeoCookie(res, lat, lng, city)
    return res
  }

  const requestHeaders = new Headers(req.headers)
  const cookieStore = req.cookies.getAll()

  let response = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            const existing = cookieStore.findIndex((c) => c.name === name)
            if (existing >= 0) cookieStore[existing] = { name, value }
            else cookieStore.push({ name, value })
          })
          requestHeaders.set(
            "cookie",
            cookieStore.map((c) => `${c.name}=${c.value}`).join("; ")
          )
          response = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (lat && lng) setGeoCookie(response, lat, lng, city)

  if (req.nextUrl.searchParams.has("_rsc")) return response

  if (isProtected && !user) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.search = ""
    url.searchParams.set("redirect", pathname)

    const redirectRes = NextResponse.redirect(url)
    response.cookies.getAll().forEach((c) => {
      redirectRes.cookies.set(c.name, c.value, c)
    })
    return redirectRes
  }

  if (isLoginPage && user) {
    const dest = safeRedirectDest(req.nextUrl.searchParams.get("redirect"), "/dashboard")
    const url = req.nextUrl.clone()
    url.pathname = dest
    url.search = ""

    const redirectRes = NextResponse.redirect(url)
    response.cookies.getAll().forEach((c) => {
      redirectRes.cookies.set(c.name, c.value, c)
    })
    return redirectRes
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|imagini|favicon\\.ico|.*\\..*).*)"],
}
