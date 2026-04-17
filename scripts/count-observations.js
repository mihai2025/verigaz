// Numără observațiile non-null în baza veche
const { Client } = require("pg")
const OLD = "postgres://postgres.khxxibauxdxsdkeorhvl:R48DO90kvkwOkEe0@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=no-verify"
;(async () => {
  const c = new Client({ connectionString: OLD, ssl: { rejectUnauthorized: false } })
  await c.connect()
  for (const t of ["verificari", "revizii", "centrale_termice"]) {
    const { rows } = await c.query(
      `select count(*) filter (where observatii is not null and observatii <> '') as with_obs,
              count(*) as total
       from ${t}`,
    )
    console.log(`${t}: ${rows[0].with_obs}/${rows[0].total} cu observații non-null`)
  }
  // Sample
  console.log("\nSample observații verificari:")
  const { rows: samples } = await c.query(
    `select data_verificare, observatii from verificari where observatii is not null and observatii <> '' limit 5`,
  )
  for (const s of samples) console.log(`  [${isoOrStr(s.data_verificare)}] ${s.observatii.slice(0, 80)}`)
  await c.end()
})().catch((e) => console.error(e.message))

function isoOrStr(d) { return d instanceof Date ? d.toISOString().slice(0,10) : d }
