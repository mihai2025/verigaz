// scripts/list-orphan-addresses.js
// Listează adresele din baza veche care nu au NICIO verificare + NICIO revizie.
const { Client } = require("pg")

const OLD_DB_URL = "postgres://postgres.khxxibauxdxsdkeorhvl:R48DO90kvkwOkEe0@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=no-verify"

;(async () => {
  const c = new Client({ connectionString: OLD_DB_URL, ssl: { rejectUnauthorized: false } })
  await c.connect()

  const { rows } = await c.query(`
    select
      a.id as adresa_id,
      a.strada, a.numar, a.bloc, a.scara, a.apartament, a.localitate,
      p.nume, p.prenume, p.telefon, p.email,
      a.created_at
    from adrese a
    left join proprietari p on p.id = a.proprietar_id
    where not exists (select 1 from verificari v where v.adresa_id = a.id)
      and not exists (select 1 from revizii r where r.adresa_id = a.id)
    order by a.created_at desc nulls last
  `)

  console.log(`=== ${rows.length} adrese fără verificare/revizie ===\n`)
  for (const r of rows) {
    const nume = [r.prenume, r.nume].filter(Boolean).join(" ") || "(fără nume)"
    const tel = r.telefon ? ` · ${r.telefon}` : ""
    const addr = [r.strada, r.numar, r.bloc && `bl.${r.bloc}`, r.scara && `sc.${r.scara}`, r.apartament && `ap.${r.apartament}`]
      .filter(Boolean).join(" ")
    const loc = r.localitate ? ` · ${r.localitate}` : ""
    const when = r.created_at ? ` [${new Date(r.created_at).toLocaleDateString("ro-RO")}]` : ""
    console.log(`${nume}${tel}`)
    console.log(`   ${addr}${loc}${when}`)
  }

  await c.end()
})().catch((e) => { console.error(e.message); process.exit(1) })
