# Supabase seeds — verigaz

Seed-urile se aplică **după** ce migrațiile `supabase/migrations/` au rulat cu succes pe proiectul Supabase țintă.

## 0001_geo_seed.sql

- 42 județe + 13856 localități (inclusiv 6 sectoare București).
- Date de populație/tier/tip din snapshot ghidulfunerar (sursă originală: Recensământ 2021).
- ID-urile județelor sunt **preservate** din ghidulfunerar pentru compatibilitate cu `lib/geo/orase.ts` (care hardcodează `judetId`).
- Regenerare: `node scripts/export-geo-seed.mjs` (folosește serviciul REST ghidulfunerar prin service_role key din script).

### Aplicare

```bash
# după ce proiectul Supabase verigaz e creat și migrațiile au rulat:
psql "$SUPABASE_DB_URL" -f supabase/seeds/0001_geo_seed.sql
```

Alternativ din Supabase Studio → SQL Editor → paste conținutul fișierului → Run.

Seed-ul e idempotent (`on conflict do update`) — se poate re-rula fără duplicări.
