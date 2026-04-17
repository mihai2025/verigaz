-- =====================================================
-- 0022 — SMS templates cu {ADRESA} + formulări concrete per echipament
-- =====================================================
--
-- Scop: pentru un proprietar cu mai multe adrese, SMS-ul trebuie să specifice
-- EXACT adresa și tipul de echipament ca să fie clar ce se verifică unde.
--
-- Placeholdere disponibile:
--   {FIRMA} {TELEFON} {DATA} {ADRESA} {ECHIPAMENT} {ACTIUNE} {LINK} {REF}
--
-- Target: sub 160 caractere după substituire normală (adresă medie 35-45 chars).

update public.sms_templates_admin
  set template = '{FIRMA}: {ACTIUNE} {ECHIPAMENT} la {ADRESA} expira {DATA}. Programare: {LINK} sau tel {TELEFON}',
      description = 'Scadenta verificare 2 ani. Include adresa exacta pentru clienti cu mai multe locatii.',
      updated_at = now()
  where reminder_type = 'verificare_24m';

update public.sms_templates_admin
  set template = '{FIRMA}: {ACTIUNE} {ECHIPAMENT} la {ADRESA} expira {DATA}. Obligatoriu ANRE. Programare: {LINK}',
      description = 'Scadenta revizie 10 ani. Include adresa exacta.',
      updated_at = now()
  where reminder_type = 'revizie_120m';

update public.sms_templates_admin
  set template = '{FIRMA}: service detector gaz la {ADRESA} scadent {DATA}. Programare: {LINK} sau {TELEFON}',
      description = 'Service anual detector gaz. Include adresa.',
      updated_at = now()
  where reminder_type = 'service_detector_12m';

update public.sms_templates_admin
  set template = '{FIRMA}: {ACTIUNE} centrala termica la {ADRESA} expira {DATA}. Programare: {LINK} sau {TELEFON}',
      description = 'Scadenta VTP centrala termica (ISCIR). Include adresa.',
      updated_at = now()
  where reminder_type = 'iscir_centrala';
