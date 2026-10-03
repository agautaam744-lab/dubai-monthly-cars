-- Dubai Monthly Cars
-- Payment idempotency protection

create unique index if not exists payments_provider_payment_id_uidx
on public.payments (provider_payment_id)
where provider_payment_id is not null;
