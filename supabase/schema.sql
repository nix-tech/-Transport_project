-- ============================================================
-- SISTÈM REZÈVASYON BIYÈ BIS - Supabase SQL Schema (100% relançable)
-- BisRezèv | CP Transport Express
-- ============================================================

-- (1) Tables: on supprime si elles existent
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.trips CASCADE;
DROP TABLE IF EXISTS public.charter_requests CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;

-- ============================================================
-- TABLE: trips
-- ============================================================
CREATE TABLE public.trips (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin        TEXT NOT NULL,
    destination   TEXT NOT NULL,
    departure_at  TIMESTAMPTZ NOT NULL,
    arrival_at    TIMESTAMPTZ NOT NULL,
    price         NUMERIC(10, 2) NOT NULL,
    bus_company   TEXT NOT NULL DEFAULT 'TransHaiti',
    total_seats   INTEGER NOT NULL DEFAULT 30,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: bookings
-- ============================================================
CREATE TABLE public.bookings (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id          UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    seat_number      INTEGER NOT NULL CHECK (seat_number BETWEEN 1 AND 60),
    passenger_name   TEXT NOT NULL,
    passenger_email  TEXT NOT NULL,
    passenger_phone  TEXT NOT NULL,
    booking_code     TEXT NOT NULL UNIQUE,
    status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    booked_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (trip_id, seat_number)
);

-- ============================================================
-- INDEX (100% relançable)
-- ============================================================
DROP INDEX IF EXISTS public.idx_trips_origin_dest;
DROP INDEX IF EXISTS public.idx_trips_departure;
DROP INDEX IF EXISTS public.idx_bookings_trip;
DROP INDEX IF EXISTS public.idx_bookings_code;
DROP INDEX IF EXISTS public.idx_bookings_user;

CREATE INDEX idx_trips_origin_dest  ON public.trips (origin, destination);
CREATE INDEX idx_trips_departure    ON public.trips (departure_at);
CREATE INDEX idx_bookings_trip      ON public.bookings (trip_id);
CREATE INDEX idx_bookings_code      ON public.bookings (booking_code);
CREATE INDEX idx_bookings_user      ON public.bookings (user_id);

-- ============================================================
-- RLS + Policies (100% relançable)
-- ============================================================
ALTER TABLE public.trips    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- trips policies
DROP POLICY IF EXISTS "trips_select_public" ON public.trips;
CREATE POLICY "trips_select_public"
    ON public.trips FOR SELECT
    USING (true);

-- bookings policies
DROP POLICY IF EXISTS "bookings_select_seat_check" ON public.bookings;
DROP POLICY IF EXISTS "bookings_insert_auth"       ON public.bookings;
DROP POLICY IF EXISTS "bookings_update_own"       ON public.bookings;
DROP POLICY IF EXISTS "bookings_delete_own"       ON public.bookings;

CREATE POLICY "bookings_select_seat_check"
    ON public.bookings FOR SELECT
    USING (true);

CREATE POLICY "bookings_insert_auth"
    ON public.bookings FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND (user_id = auth.uid() OR user_id IS NULL)
    );

CREATE POLICY "bookings_update_own"
    ON public.bookings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admin peut mettre à jour n'importe quelle réservation (pour validation)
DROP POLICY IF EXISTS "bookings_update_admin" ON public.bookings;
CREATE POLICY "bookings_update_admin"
    ON public.bookings FOR UPDATE
    USING (auth.email() = 'nixnithersaintval@gmail.com')
    WITH CHECK (auth.email() = 'nixnithersaintval@gmail.com');

CREATE POLICY "bookings_delete_own"
    ON public.bookings FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- DONE TÈS (Dummy data) - relançable sans doublons
-- ============================================================
INSERT INTO public.trips (origin, destination, departure_at, arrival_at, price, bus_company, total_seats)
SELECT
  v.origin, v.destination, v.departure_at, v.arrival_at, v.price, v.bus_company, v.total_seats
FROM (
  VALUES
  -- ── Depuis OUEST ──
  ('Ouest', 'Nord',          NOW() + INTERVAL '2 hours',         NOW() + INTERVAL '7 hours',          14000.00, 'A&B Express',         30),
  ('Ouest', 'Sud',           NOW() + INTERVAL '3 hours',         NOW() + INTERVAL '6 hours',          10000.00, 'Sud Confort',         30),
  ('Ouest', 'Artibonite',    NOW() + INTERVAL '4 hours',         NOW() + INTERVAL '7 hours',          6000.00,  'A&B Transport',       30),
  ('Ouest', 'Sud-Est',       NOW() + INTERVAL '6 hours',         NOW() + INTERVAL '9 hours',          8000.00,  'Sud Express',         30),
  ('Ouest', 'Grand''Anse',   NOW() + INTERVAL '10 hours',        NOW() + INTERVAL '16 hours',         15000.00, 'Grand Anse Bus',      30),
  ('Ouest', 'Centre',        NOW() + INTERVAL '1 day',           NOW() + INTERVAL '1 day 5 hours',    7000.00,  'Centre Trans',        30),
  ('Ouest', 'Nord-Est',      NOW() + INTERVAL '8 hours',         NOW() + INTERVAL '14 hours',         16000.00, 'A&B Premium',         30),
  ('Ouest', 'Nord-Ouest',    NOW() + INTERVAL '9 hours',         NOW() + INTERVAL '15 hours',         13000.00, 'Nord-Ouest Express',  30),
  ('Ouest', 'Nippes',        NOW() + INTERVAL '5 hours',         NOW() + INTERVAL '9 hours',          9000.00,  'Nippes Trans',        30),

  -- ── Depuis NORD ──
  ('Nord',  'Ouest',         NOW() + INTERVAL '5 hours',         NOW() + INTERVAL '10 hours',         14000.00, 'A&B Express',         30),
  ('Nord',  'Nord-Est',      NOW() + INTERVAL '1 day 2 hours',   NOW() + INTERVAL '1 day 5 hours',    6000.00,  'A&B Premium',         30),
  ('Nord',  'Nord-Ouest',    NOW() + INTERVAL '7 hours',         NOW() + INTERVAL '11 hours',         7000.00,  'Nord-Ouest Express',  30),
  ('Nord',  'Artibonite',    NOW() + INTERVAL '6 hours',         NOW() + INTERVAL '9 hours',          5000.00,  'A&B Transport',       30),
  ('Nord',  'Centre',        NOW() + INTERVAL '1 day',           NOW() + INTERVAL '1 day 4 hours',    8000.00,  'Centre Trans',        30),
  ('Nord',  'Sud',           NOW() + INTERVAL '1 day 3 hours',   NOW() + INTERVAL '1 day 10 hours',   18000.00, 'Sud Confort',         30),

  -- ── Depuis SUD ──
  ('Sud',   'Ouest',         NOW() + INTERVAL '8 hours',         NOW() + INTERVAL '11 hours',         10000.00, 'Sud Confort',         30),
  ('Sud',   'Nord',          NOW() + INTERVAL '1 day',           NOW() + INTERVAL '1 day 8 hours',    18000.00, 'A&B Express',         30),
  ('Sud',   'Nippes',        NOW() + INTERVAL '4 hours',         NOW() + INTERVAL '6 hours',          4000.00,  'Nippes Trans',        30),
  ('Sud',   'Grand''Anse',   NOW() + INTERVAL '6 hours',         NOW() + INTERVAL '10 hours',         7000.00,  'Grand Anse Bus',      30),
  ('Sud',   'Sud-Est',       NOW() + INTERVAL '3 hours',         NOW() + INTERVAL '5 hours',          5000.00,  'Sud Express',         30),

  -- ── Depuis ARTIBONITE ──
  ('Artibonite', 'Ouest',    NOW() + INTERVAL '4 hours',         NOW() + INTERVAL '7 hours',          6000.00,  'A&B Transport',       30),
  ('Artibonite', 'Nord',     NOW() + INTERVAL '12 hours',        NOW() + INTERVAL '15 hours',         5000.00,  'A&B Transport',       30),
  ('Artibonite', 'Centre',   NOW() + INTERVAL '5 hours',         NOW() + INTERVAL '8 hours',          4000.00,  'Centre Trans',        30),
  ('Artibonite', 'Nord-Ouest', NOW() + INTERVAL '7 hours',       NOW() + INTERVAL '11 hours',         6000.00,  'Nord-Ouest Express',  30),
  ('Artibonite', 'Sud',      NOW() + INTERVAL '1 day',           NOW() + INTERVAL '1 day 6 hours',    12000.00, 'Sud Confort',         30),

  -- ── Depuis CENTRE ──
  ('Centre', 'Ouest',        NOW() + INTERVAL '1 day',           NOW() + INTERVAL '1 day 5 hours',    7000.00,  'Centre Trans',        30),
  ('Centre', 'Artibonite',   NOW() + INTERVAL '5 hours',         NOW() + INTERVAL '8 hours',          4000.00,  'Centre Trans',        30),
  ('Centre', 'Nord',         NOW() + INTERVAL '8 hours',         NOW() + INTERVAL '12 hours',         8000.00,  'A&B Express',         30),
  ('Centre', 'Sud',          NOW() + INTERVAL '1 day 2 hours',   NOW() + INTERVAL '1 day 8 hours',    11000.00, 'Sud Confort',         30),

  -- ── Depuis GRAND'ANSE ──
  ('Grand''Anse', 'Ouest',   NOW() + INTERVAL '10 hours',        NOW() + INTERVAL '16 hours',         15000.00, 'Grand Anse Bus',      30),
  ('Grand''Anse', 'Sud',     NOW() + INTERVAL '6 hours',         NOW() + INTERVAL '10 hours',         7000.00,  'Grand Anse Bus',      30),
  ('Grand''Anse', 'Nippes',  NOW() + INTERVAL '4 hours',         NOW() + INTERVAL '7 hours',          5000.00,  'Nippes Trans',        30),

  -- ── Depuis NIPPES ──
  ('Nippes', 'Ouest',        NOW() + INTERVAL '5 hours',         NOW() + INTERVAL '9 hours',          9000.00,  'Nippes Trans',        30),
  ('Nippes', 'Sud',          NOW() + INTERVAL '4 hours',         NOW() + INTERVAL '6 hours',          4000.00,  'Nippes Trans',        30),
  ('Nippes', 'Grand''Anse',  NOW() + INTERVAL '4 hours',         NOW() + INTERVAL '7 hours',          5000.00,  'Grand Anse Bus',      30),

  -- ── Depuis NORD-EST ──
  ('Nord-Est', 'Nord',       NOW() + INTERVAL '3 hours',         NOW() + INTERVAL '6 hours',          6000.00,  'A&B Premium',         30),
  ('Nord-Est', 'Ouest',      NOW() + INTERVAL '8 hours',         NOW() + INTERVAL '14 hours',         16000.00, 'A&B Premium',         30),
  ('Nord-Est', 'Centre',     NOW() + INTERVAL '6 hours',         NOW() + INTERVAL '10 hours',         9000.00,  'Centre Trans',        30),

  -- ── Depuis NORD-OUEST ──
  ('Nord-Ouest', 'Nord',     NOW() + INTERVAL '7 hours',         NOW() + INTERVAL '11 hours',         7000.00,  'Nord-Ouest Express',  30),
  ('Nord-Ouest', 'Ouest',    NOW() + INTERVAL '9 hours',         NOW() + INTERVAL '15 hours',         13000.00, 'Nord-Ouest Express',  30),
  ('Nord-Ouest', 'Artibonite', NOW() + INTERVAL '6 hours',       NOW() + INTERVAL '10 hours',         6000.00,  'A&B Transport',       30),

  -- ── Depuis SUD-EST ──
  ('Sud-Est', 'Ouest',       NOW() + INTERVAL '6 hours',         NOW() + INTERVAL '9 hours',          8000.00,  'Sud Express',         30),
  ('Sud-Est', 'Sud',         NOW() + INTERVAL '3 hours',         NOW() + INTERVAL '5 hours',          5000.00,  'Sud Express',         30),
  ('Sud-Est', 'Nord',        NOW() + INTERVAL '1 day',           NOW() + INTERVAL '1 day 7 hours',    17000.00, 'A&B Express',         30)
) AS v(origin, destination, departure_at, arrival_at, price, bus_company, total_seats)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.trips t
  WHERE t.origin = v.origin
    AND t.destination = v.destination
    AND t.departure_at = v.departure_at
);

-- ============================================================
-- TABLE: charter_requests (Demann bis prive)
-- ============================================================
CREATE TABLE public.charter_requests (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    phone       TEXT NOT NULL,
    address     TEXT NOT NULL,
    purpose     TEXT NOT NULL,
    event_date  DATE NOT NULL,
    notes       TEXT,
    status      TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.charter_requests ENABLE ROW LEVEL SECURITY;

-- charter_requests policies
DROP POLICY IF EXISTS "charter_insert_auth"  ON public.charter_requests;
DROP POLICY IF EXISTS "charter_select_own"  ON public.charter_requests;
DROP POLICY IF EXISTS "charter_update_admin" ON public.charter_requests;

-- Pèmèt itilizatè otantifye fè demann
CREATE POLICY "charter_insert_auth"
    ON public.charter_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Utilisateur normal voit ses propres demandes; Admin voit tout via email
CREATE POLICY "charter_select_own"
    ON public.charter_requests FOR SELECT
    USING (
        auth.uid() = user_id
        OR auth.email() = 'nixnithersaintval@gmail.com'
    );

-- Admin peut mettre à jour le statut des demandes charter
CREATE POLICY "charter_update_admin"
    ON public.charter_requests FOR UPDATE
    USING (auth.email() = 'nixnithersaintval@gmail.com')
    WITH CHECK (auth.email() = 'nixnithersaintval@gmail.com');

-- ============================================================
-- TABLE: reviews (Témoignages et notes)
-- ============================================================
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- reviews policies
DROP POLICY IF EXISTS "reviews_select_public" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_public" ON public.reviews;

-- Tout le monde peut lire les reviews
CREATE POLICY "reviews_select_public"
    ON public.reviews FOR SELECT
    USING (true);

-- Tout le monde peut ajouter une review
CREATE POLICY "reviews_insert_public"
    ON public.reviews FOR INSERT
    WITH CHECK (true);

-- ============================================================
-- Verifye done yo
-- ============================================================
SELECT 'Trips created:' AS info, COUNT(*) AS count FROM public.trips
UNION ALL
SELECT 'Bookings created:', COUNT(*) FROM public.bookings
UNION ALL
SELECT 'Charter requests created:', COUNT(*) FROM public.charter_requests
UNION ALL
SELECT 'Reviews created:', COUNT(*) FROM public.reviews;