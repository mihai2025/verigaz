-- Update SMS tariff: de la 15 bani/segment la 61 bani (0.61 RON) — tariful real smsadvert.
update public.app_settings
  set value = to_jsonb(61),
      updated_at = now()
  where key = 'sms_tariff_cents_per_segment';
