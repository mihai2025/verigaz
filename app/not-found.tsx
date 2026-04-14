import Link from "next/link"
import { DOMAIN } from "@/lib/config/domain"

export default function NotFound() {
  return (
    <main style={{ padding: "4rem 1.25rem", maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
      <h1 style={{ fontSize: "2.5rem", margin: 0 }}>404</h1>
      <p style={{ fontSize: "1.125rem", color: "#475569", marginTop: "0.75rem" }}>
        {DOMAIN.notFoundSub}
      </p>
      <p style={{ marginTop: "2rem" }}>
        <Link href="/" style={{ color: "#0ea5e9", fontWeight: 600 }}>
          {DOMAIN.notFoundFirmCta} →
        </Link>
      </p>
    </main>
  )
}
