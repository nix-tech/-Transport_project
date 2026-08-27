// ============================================================
// app.js — Classic Redesign (A&B Bus Tours Style) + Supabase
// ============================================================

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const state = {
    trips: [],
    selectedTrip: null,
    bookedSeats: [],
    selectedSeat: null,
    currentView: 'home',
    currentUser: null,
};

const $ = (id) => document.getElementById(id);

// ============================================================
// UTILITY
// ============================================================
function generateBookingCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const part = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `BIS-${part(4)}-${part(4)}`;
}

function showView(viewId) {
    const views = ['view-home', 'view-results', 'view-seatmap', 'view-form', 'view-confirmation', 'view-charter'];
    views.forEach(v => {
        if ($(v)) $(v).classList.add('hidden');
    });
    if ($(viewId)) {
        $(viewId).classList.remove('hidden');
        $('app-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    state.currentView = viewId;
}

function goHome() { showView('view-home'); }
function goToResults() { showView('view-results'); }

// ============================================================
// AUTH
// ============================================================
db.auth.onAuthStateChange((event, session) => {
    const user = session?.user ?? null;
    state.currentUser = user;
    updateNavbarAuthUI(user);

    if (event === 'SIGNED_IN') {
        closeAuthModal();
        if (user?.email && $('input-email')) {
            $('input-email').value = user.email;
        }
    }
    if (event === 'SIGNED_OUT') {
        state.currentUser = null;
    }
});

function updateNavbarAuthUI(user) {
    const guestEl = $('nav-guest');
    const userEl  = $('nav-user');
    if (user) {
        guestEl.classList.add('hidden');
        userEl.classList.remove('hidden');
        $('user-display-name').textContent = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    } else {
        guestEl.classList.remove('hidden');
        userEl.classList.add('hidden');
    }
}

function openAuthModal() {
    $('auth-backdrop').classList.add('open');
    clearAuthMessage();
}

function closeAuthModal() {
    $('auth-backdrop').classList.remove('open');
    clearAuthMessage();
}

function switchAuthTab(tab) {
    const signinForm = $('form-signin');
    const signupForm = $('form-signup');
    const tabSignin  = $('tab-signin');
    const tabSignup  = $('tab-signup');
    clearAuthMessage();

    if (tab === 'signin') {
        signinForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        tabSignin.classList.add('active');
        tabSignup.classList.remove('active');
        $('auth-modal-title').textContent = 'Login';
    } else {
        signinForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        tabSignin.classList.remove('active');
        tabSignup.classList.add('active');
        $('auth-modal-title').textContent = 'Register';
    }
}

function showAuthMessage(text, type = 'error') {
    const el = $('auth-message');
    el.textContent = text;
    el.className = `auth-message ${type}`;
}

function clearAuthMessage() {
    const el = $('auth-message');
    el.textContent = '';
    el.className = 'auth-message';
}

async function signInWithGoogle() {
    clearAuthMessage();
    const btn = $('btn-google-signin');
    btn.disabled = true;
    
    // Fallback if AUTH_REDIRECT_URL is not defined in config
    const redirectUrl = typeof AUTH_REDIRECT_URL !== 'undefined' ? AUTH_REDIRECT_URL : window.location.origin + window.location.pathname;

    const { error } = await db.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl }
    });

    if (error) {
        showAuthMessage('Google Auth Error: ' + error.message, 'error');
        btn.disabled = false;
    }
}

async function handleEmailSignIn(e) {
    e.preventDefault();
    clearAuthMessage();
    const email    = $('signin-email').value.trim();
    const password = $('signin-password').value;
    const btn      = $('btn-signin-submit');

    btn.disabled = true;
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) showAuthMessage(error.message, 'error');
    btn.disabled = false;
}

async function handleEmailSignUp(e) {
    e.preventDefault();
    clearAuthMessage();
    const name     = $('signup-name').value.trim();
    const email    = $('signup-email').value.trim();
    const password = $('signup-password').value;
    const btn      = $('btn-signup-submit');

    btn.disabled = true;
    const { error } = await db.auth.signUp({
        email, password, options: { data: { full_name: name } }
    });
    if (error) showAuthMessage(error.message, 'error');
    else showAuthMessage('Account created! Please verify email if required.', 'success');
    btn.disabled = false;
}

async function handleSignOut() {
    await db.auth.signOut();
    state.currentUser = null;
    goHome();
}

function requireAuth(actionLabel = '') {
    if (state.currentUser) return true;
    openAuthModal();
    if (actionLabel) {
        showAuthMessage(`Please login to ${actionLabel}.`, 'error');
    }
    return false;
}

// ============================================================
// SEARCH FORM LOGIC
// ============================================================

$('search-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const origin = $('input-origin').value.trim();
    const dest = $('input-destination').value.trim();
    const date = $('input-date').value;

    if (!origin || !dest) {
        alert("Please enter Origin and Destination.");
        return;
    }

    const btn = $('btn-search');
    btn.disabled = true;
    btn.textContent = "SEARCHING...";

    try {
        let query = db.from('trips').select('*')
            .ilike('origin', `%${origin}%`)
            .ilike('destination', `%${dest}%`)
            .order('departure_at', { ascending: true });

        if (date) {
            const start = new Date(date);
            const end = new Date(date);
            end.setDate(end.getDate() + 1);
            query = query.gte('departure_at', start.toISOString()).lt('departure_at', end.toISOString());
        }

        const { data, error } = await query;
        if (error) throw error;

        state.trips = data || [];
        renderTrips();
        showView('view-results');
    } catch (err) {
        console.error(err);
        alert("Search error.");
    } finally {
        btn.disabled = false;
        btn.textContent = "BOOK NOW !";
    }
});

function renderTrips() {
    const list = $('trips-list');
    if (state.trips.length === 0) {
        list.innerHTML = `<p>No trips found.</p>`;
        return;
    }

    list.innerHTML = state.trips.map(trip => {
        const d = new Date(trip.departure_at);
        
        // Asire pri a ant 6000 HTG ak 15000 HTG selon distans/depatman an kòm fallback
        let finalPrice = trip.price;
        if (finalPrice < 6000) {
            const prices = {
                "Artibonite": 6000, "Centre": 7000, "Sud-Est": 8000, "Nippes": 8500,
                "Sud": 10000, "Nord-Ouest": 12000, "Nord": 14000, "Nord-Est": 15000, "Grand'Anse": 15000, "Ouest": 6000 
            };
            finalPrice = prices[trip.destination] || 6000;
        }

        return `
        <div class="trip-card">
            <h3>${trip.origin} ➔ ${trip.destination}</h3>
            <p style="color: #00aeef; font-size: 24px; margin: 10px 0;">${finalPrice} HTG</p>
            <p>${d.toLocaleDateString()} ${d.toLocaleTimeString()}</p>
            <p style="color: #666; font-size: 12px; margin-bottom: 15px;">${trip.bus_company}</p>
            <button class="btn-book-now" onclick="selectTrip('${trip.id}')">SELECT SEAT</button>
        </div>`;
    }).join('');
}

// ============================================================
// SEATMAP LOGIC
// ============================================================
async function selectTrip(tripId) {
    const trip = state.trips.find(t => t.id === tripId);
    if (!trip) return;

    state.selectedTrip = trip;
    state.selectedSeat = null;

    const { data, error } = await db.from('bookings').select('seat_number').eq('trip_id', tripId).eq('status', 'confirmed');
    state.bookedSeats = error ? [] : (data || []).map(b => b.seat_number);

    $('seatmap-route').textContent = `${trip.origin} ➔ ${trip.destination}`;
    $('seatmap-details').textContent = `${trip.bus_company} | ${trip.price} HTG`;
    $('form-seat').textContent = '-';
    $('form-price').textContent = '-';
    $('btn-proceed-booking').disabled = true;

    renderSeatGrid(trip.total_seats);
    showView('view-seatmap');
}

function renderSeatGrid(totalSeats) {
    const grid = $('seat-grid');
    grid.innerHTML = '';
    
    for (let s = 1; s <= totalSeats; s++) {
        const isOccupied = state.bookedSeats.includes(s);
        const isSelected = state.selectedSeat === s;
        
        const btn = document.createElement('button');
        btn.textContent = s;
        btn.className = `seat ${isOccupied ? 'occupied' : ''} ${isSelected ? 'selected' : ''}`;
        
        if (isOccupied) {
            btn.disabled = true;
        } else {
            btn.addEventListener('click', () => {
                if (!requireAuth('select a seat')) return;
                state.selectedSeat = s;
                renderSeatGrid(totalSeats);
                $('form-seat').textContent = s;
                $('form-price').textContent = `${state.selectedTrip.price} HTG`;
                $('btn-proceed-booking').disabled = false;
            });
        }
        grid.appendChild(btn);
    }
}

// ============================================================
// BOOKING LOGIC
// ============================================================
function showBookingForm() {
    if (!requireAuth('proceed with booking')) return;
    if (state.currentUser) {
        const meta = state.currentUser.user_metadata || {};
        if (meta.full_name && $('input-name')) $('input-name').value = meta.full_name;
        if (state.currentUser.email && $('input-email')) $('input-email').value = state.currentUser.email;
    }
    showView('view-form');
}

$('booking-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!requireAuth('confirm booking')) return;

    const name = $('input-name').value.trim();
    const email = $('input-email').value.trim();
    const phone = $('input-phone').value.trim();
    const btn = $('btn-book');

    btn.disabled = true;
    btn.textContent = "PROCESSING...";

    const bookingCode = generateBookingCode();
    
    try {
        const insertData = {
            trip_id: state.selectedTrip.id,
            seat_number: state.selectedSeat,
            passenger_name: name,
            passenger_email: email,
            passenger_phone: phone,
            booking_code: bookingCode,
            status: 'confirmed'
        };

        if (state.currentUser) {
            insertData.user_id = state.currentUser.id;
        }

        const { error } = await db.from('bookings').insert([insertData]);
        if (error) throw error;

        $('ticket-code').textContent = bookingCode;
        showView('view-confirmation');
    } catch (err) {
        console.error(err);
        if (err.code === '23505') {
            alert('Seat already booked!');
            showView('view-seatmap');
        } else {
            alert('Booking Error.');
        }
    } finally {
        btn.disabled = false;
        btn.textContent = "CONFIRM BOOKING";
    }
});

// ============================================================
// CHARTER LOGIC
// ============================================================
function showCharterForm(type) {
    if (!requireAuth('request a custom trip')) return;
    
    // Pre-fill user data if available
    if (state.currentUser) {
        const meta = state.currentUser.user_metadata || {};
        if (meta.full_name && $('charter-name')) $('charter-name').value = meta.full_name;
        if (state.currentUser.email && $('charter-email')) $('charter-email').value = state.currentUser.email;
    }
    
    showView('view-charter');
}

$('charter-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!requireAuth('submit your request')) return;

    const btn = $('btn-charter-submit');
    btn.disabled = true;
    btn.textContent = "SUBMITTING...";

    try {
        const insertData = {
            user_id: state.currentUser.id,
            name: $('charter-name').value.trim(),
            email: $('charter-email').value.trim(),
            phone: $('charter-phone').value.trim(),
            address: $('charter-address').value.trim(),
            purpose: $('charter-purpose').value,
            event_date: $('charter-date').value,
            notes: $('charter-notes').value.trim()
        };

        const { error } = await db.from('charter_requests').insert([insertData]);
        if (error) throw error;

        alert('Your custom trip request has been submitted successfully! We will contact you soon.');
        $('charter-form').reset();
        goHome();
    } catch (err) {
        console.error(err);
        alert('There was an error submitting your request. Please try again.');
    } finally {
        btn.disabled = false;
        btn.textContent = "SUBMIT REQUEST";
    }
});

// ============================================================
// UI BINDINGS
// ============================================================
$('auth-backdrop').addEventListener('click', (e) => {
    if (e.target === $('auth-backdrop')) closeAuthModal();
});
$('auth-modal-close').addEventListener('click', closeAuthModal);
$('btn-google-signin').addEventListener('click', signInWithGoogle);

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await db.auth.getSession();
    if (session?.user) {
        state.currentUser = session.user;
        updateNavbarAuthUI(session.user);
    }
});
