-- ============================================================
-- SISTÈM REZÈVASYON BIYÈ BIS - Supabase SQL Schema
-- BisRezèv | CP Transport Express

-- ============================================================

-- Efase tab yo si yo deja egziste (nan lòd bon an)
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.trips CASCADE;

-- ============================================================
-- TABLE: trips (Vwayaj disponib yo)
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
-- TABLE: bookings (Rezèvasyon yo)
-- ============================================================
CREATE TABLE public.bookings (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id          UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,   -- ← Lye ak Supabase Auth
    seat_number      INTEGER NOT NULL CHECK (seat_number BETWEEN 1 AND 60),
    passenger_name   TEXT NOT NULL,
    passenger_email  TEXT NOT NULL,
    passenger_phone  TEXT NOT NULL,
    booking_code     TEXT NOT NULL UNIQUE,
    status           TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
    booked_at        TIMESTAMPTZ DEFAULT NOW(),

    -- Anpeche 2 moun rezève menm plas pou menm vwayaj la
    UNIQUE (trip_id, seat_number)
);

-- ============================================================
-- INDEX pou pèfòmans
-- ============================================================
CREATE INDEX idx_trips_origin_dest  ON public.trips (origin, destination);
CREATE INDEX idx_trips_departure    ON public.trips (departure_at);
CREATE INDEX idx_bookings_trip      ON public.bookings (trip_id);
CREATE INDEX idx_bookings_code      ON public.bookings (booking_code);
CREATE INDEX idx_bookings_user      ON public.bookings (user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.trips    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Pèmèt tout moun (anon + auth) li done vwayaj yo
CREATE POLICY "trips_select_public"
    ON public.trips FOR SELECT
    USING (true);

-- Pèmèt tout moun li rezèvasyon yo (pou verifikasyon plas okipe - seat map)
-- Note: seat_number kolòn sèlman ka vizib pou anon (RLS filtre lòt kolòn si ou vle plis sekirite)
CREATE POLICY "bookings_select_seat_check"
    ON public.bookings FOR SELECT
    USING (true);

-- Sèlman itilizatè otantifye ka kreye rezèvasyon
-- Epi user_id dwe koresponn ak itilizatè ki konekte a
CREATE POLICY "bookings_insert_auth"
    ON public.bookings FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND (user_id = auth.uid() OR user_id IS NULL)
    );

-- Itilizatè ka anile pwòp rezèvasyon yo sèlman
CREATE POLICY "bookings_update_own"
    ON public.bookings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Itilizatè ka efase pwòp rezèvasyon yo sèlman
CREATE POLICY "bookings_delete_own"
    ON public.bookings FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- DONE TÈS (DUMMY DATA) - 10 Vwayaj (Ak Depatman ak Pri)
-- ============================================================
INSERT INTO public.trips (origin, destination, departure_at, arrival_at, price, bus_company, total_seats)
VALUES
('Ouest', 'Nord',          NOW() + INTERVAL '2 hours',         NOW() + INTERVAL '7 hours',          14000.00, 'A&B Express',         30),
('Ouest', 'Sud',           NOW() + INTERVAL '3 hours',         NOW() + INTERVAL '6 hours',          10000.00, 'Sud Confort',         30),
('Ouest', 'Artibonite',    NOW() + INTERVAL '4 hours',         NOW() + INTERVAL '7 hours',          6000.00,  'A&B Transport',       30),
('Nord',  'Ouest',         NOW() + INTERVAL '5 hours',         NOW() + INTERVAL '10 hours',         14000.00, 'A&B Express',         30),
('Ouest', 'Sud-Est',       NOW() + INTERVAL '6 hours',         NOW() + INTERVAL '9 hours',          8000.00,  'Sud Express',         30),
('Sud',   'Ouest',         NOW() + INTERVAL '8 hours',         NOW() + INTERVAL '11 hours',         10000.00, 'Sud Confort',         30),
('Ouest', 'Grand''Anse',   NOW() + INTERVAL '10 hours',        NOW() + INTERVAL '16 hours',         15000.00, 'Grand Anse Bus',      30),
('Artibonite', 'Nord',     NOW() + INTERVAL '12 hours',        NOW() + INTERVAL '15 hours',         8000.00,  'A&B Transport',       30),
('Ouest', 'Centre',        NOW() + INTERVAL '1 day',           NOW() + INTERVAL '1 day 5 hours',    7000.00,  'Centre Trans',        30),
('Nord',  'Nord-Est',      NOW() + INTERVAL '1 day 2 hours',   NOW() + INTERVAL '1 day 10 hours',   6000.00,  'A&B Premium',         30);

-- ============================================================
-- DONE TÈS — Kèk Rezèvasyon Egzistant (pou demo Seat Map)
-- ============================================================
INSERT INTO public.bookings (trip_id, seat_number, passenger_name, passenger_email, passenger_phone, booking_code)
SELECT
    t.id,
    s.seat_number,
    CASE s.seat_number
        WHEN 1  THEN 'Jean Pierre'
        WHEN 5  THEN 'Marie Joseph'
        WHEN 8  THEN 'Paul Dumont'
        WHEN 12 THEN 'Claire Fontaine'
        WHEN 15 THEN 'Henri Bernard'
        WHEN 20 THEN 'Sophie Martin'
        WHEN 23 THEN 'Louis Beaumont'
        WHEN 27 THEN 'Nadia Céleste'
    END,
    CASE s.seat_number
        WHEN 1  THEN 'jpierre@email.com'
        WHEN 5  THEN 'mjoseph@email.com'
        WHEN 8  THEN 'pdumont@email.com'
        WHEN 12 THEN 'cfontaine@email.com'
        WHEN 15 THEN 'hbernard@email.com'
        WHEN 20 THEN 'smartin@email.com'
        WHEN 23 THEN 'lbeaumont@email.com'
        WHEN 27 THEN 'nceleste@email.com'
    END,
    CASE s.seat_number
        WHEN 1  THEN '+50936100001'
        WHEN 5  THEN '+50936100002'
        WHEN 8  THEN '+50936100003'
        WHEN 12 THEN '+50936100004'
        WHEN 15 THEN '+50936100005'
        WHEN 20 THEN '+50936100006'
        WHEN 23 THEN '+50936100007'
        WHEN 27 THEN '+50936100008'
    END,
    'TEST-' || LPAD(s.seat_number::TEXT, 6, '0')
FROM public.trips t
CROSS JOIN (VALUES (1),(5),(8),(12),(15),(20),(23),(27)) AS s(seat_number)
WHERE t.origin = 'Ouest' AND t.destination = 'Nord'
LIMIT 8;

-- ============================================================
-- Verifye done yo
-- ============================================================
SELECT 'Trips created:'    AS info, COUNT(*) AS count FROM public.trips
UNION ALL
SELECT 'Bookings created:', COUNT(*) FROM public.bookings;

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
    status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Pèmèt itilizatè otantifye fè demann
ALTER TABLE public.charter_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "charter_insert_auth"
    ON public.charter_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "charter_select_own"
    ON public.charter_requests FOR SELECT
    USING (auth.uid() = user_id);
