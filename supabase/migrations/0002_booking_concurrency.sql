-- ============================================================
-- Dubai Monthly Cars
-- Booking Concurrency Protection
-- ============================================================

create extension if not exists btree_gist;

-- Active/pending bookings reserve a vehicle/date range.
-- Terminal bookings release the vehicle.
alter table public.bookings
  add column if not exists active_booking_period daterange
  generated always as (
    case
      when status not in (
        'cancelled',
        'completed',
        'terminated'
      )
      then daterange(
        start_date,
        coalesce(end_date, start_date),
        '[]'
      )
      else null
    end
  ) stored;

-- Prevent overlapping active bookings for the same vehicle.
alter table public.bookings
  add constraint bookings_vehicle_active_period_excl
  exclude using gist (
    vehicle_id with =,
    active_booking_period with &&
  );
