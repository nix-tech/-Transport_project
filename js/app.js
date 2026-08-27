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
// EMAILJS — Notifications Admin
// ============================================================
// Créez un compte GRATUIT sur https://emailjs.com puis :
//  1. Créez un service email (Gmail)
//  2. Créez un template avec les variables ci-dessous
//  3. Copiez vos IDs ici
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';   // ex: 'service_abc123'
const EMAILJS_TEMPLATE_BOOKING  = 'YOUR_BOOKING_TEMPLATE_ID'; // ex: 'template_abc123'
const EMAILJS_TEMPLATE_CHARTER  = 'YOUR_CHARTER_TEMPLATE_ID'; // ex: 'template_xyz456'
const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';   // ex: 'aBcDeFgHiJkLmN'
const ADMIN_EMAIL_DEST    = 'nixnithersaintval@gmail.com';

// Initialise EmailJS avec votre clé publique
if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

/**
 * Envoie une notification email à l'administrateur.
 * @param {string} templateId - ID du template EmailJS
 * @param {Object} params     - Variables du template
 */
async function sendAdminEmail(templateId, params) {
    if (typeof emailjs === 'undefined') return;
    if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
        console.warn('[EmailJS] Clés non configurées. Configurez EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_* et EMAILJS_PUBLIC_KEY dans app.js');
        return;
    }
    try {
        await emailjs.send(EMAILJS_SERVICE_ID, templateId, {
            to_email: ADMIN_EMAIL_DEST,
            ...params
        });
        console.log('[EmailJS] Email envoyé avec succès.');
    } catch (err) {
        console.warn('[EmailJS] Erreur envoi email:', err);
    }
}

// ============================================================
// CAROUSEL LOGIC
// ============================================================
const heroImages = [
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=1920', // Bus 1
    'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=1920', // Bus 2
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1920'  // Road
];
let currentSlide = 0;

function updateCarousel() {
    const heroImg = $('hero-img');
    if (heroImg) {
        heroImg.style.backgroundImage = `url('${heroImages[currentSlide]}')`;
    }
    for (let i = 0; i < heroImages.length; i++) {
        const dot = $(`dot-${i}`);
        if (dot) {
            if (i === currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        }
    }
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % heroImages.length;
    updateCarousel();
}

function prevSlide() {
    currentSlide = (currentSlide - 1 + heroImages.length) % heroImages.length;
    updateCarousel();
}

function goToSlide(index) {
    currentSlide = index;
    updateCarousel();
}

// Auto-advance
setInterval(() => {
    if (state.currentView === 'view-home') {
        nextSlide();
    }
}, 5000);

// ============================================================
// UTILITY
// ============================================================
function generateBookingCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const part = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `BIS-${part(4)}-${part(4)}`;
}

function showView(viewId) {
    const views = ['view-home', 'view-results', 'view-seatmap', 'view-form', 'view-confirmation', 'view-charter', 'view-admin'];
    views.forEach(v => {
        if ($(v)) $(v).classList.add('hidden');
    });
    if ($(viewId)) {
        $(viewId).classList.remove('hidden');
        $('app-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    state.currentView = viewId;

    // Charger les données admin quand on ouvre la vue admin
    if (viewId === 'view-admin' && typeof loadAdminData === 'function') {
        loadAdminData();
    }
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
    const guestEl    = $('nav-guest');
    const userEl     = $('nav-user');
    const adminBtn   = $('btn-admin-nav');
    if (user) {
        guestEl.classList.add('hidden');
        userEl.classList.remove('hidden');
        $('user-display-name').textContent = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
        // Afficher le bouton ADMIN uniquement pour l'email administrateur
        if (adminBtn) {
            adminBtn.classList.toggle('hidden', user.email !== 'nixnithersaintval@gmail.com');
        }
    } else {
        guestEl.classList.remove('hidden');
        userEl.classList.add('hidden');
        if (adminBtn) adminBtn.classList.add('hidden');
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
            let start;
            if (date.includes('/')) {
                const parts = date.split('/');
                start = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`);
            } else {
                start = new Date(date);
            }

            if (!isNaN(start.getTime())) {
                const end = new Date(start);
                end.setDate(end.getDate() + 1);
                query = query.gte('departure_at', start.toISOString()).lt('departure_at', end.toISOString());
            } else {
                console.warn("Invalid date format:", date);
            }
        }

        const { data, error } = await query;
        if (error) throw error;

        state.trips = data || [];
        renderTrips();
        showView('view-results');
    } catch (err) {
        console.error("Search failed:", err);
        alert("Search error: " + (err.message || "Invalid input"));
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
        
        // ── Afficher la popup de paiement au lieu de la confirmation directe ──
        const trip = state.selectedTrip;
        const dDate = trip?.departure_at
            ? new Date(trip.departure_at).toLocaleString('fr-FR')
            : '—';
            
        $('payment-details').innerHTML = `
            <strong>Trajet:</strong> ${trip?.origin || '?'} → ${trip?.destination || '?'}<br>
            <strong>Siège:</strong> ${state.selectedSeat}<br>
            <strong>Montant à payer:</strong> ${trip?.price || '0'} HTG
        `;
        $('payment-backdrop').classList.remove('hidden');

        // ── Notification email admin ──
        sendAdminEmail(EMAILJS_TEMPLATE_BOOKING, {
            client_name:    name,
            client_email:   email,
            client_phone:   phone,
            trip_route:     `${trip?.origin || '?'} → ${trip?.destination || '?'}`,
            trip_date:      dDate,
            seat_number:    String(state.selectedSeat),
            booking_code:   bookingCode,
            price:          `${trip?.price || '—'} HTG`,
            bus_company:    trip?.bus_company || '—',
        });
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

        // ── Notification email admin ──
        sendAdminEmail(EMAILJS_TEMPLATE_CHARTER, {
            client_name:    insertData.name,
            client_email:   insertData.email,
            client_phone:   insertData.phone,
            client_address: insertData.address,
            event_purpose:  insertData.purpose,
            event_date:     insertData.event_date,
            notes:          insertData.notes || 'Aucune note',
        });

        alert('Votre demande a été soumise avec succès ! Nous vous contacterons bientôt.');
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

// Payment Modal Logic
$('payment-backdrop').addEventListener('click', (e) => {
    if (e.target === $('payment-backdrop')) $('payment-backdrop').classList.add('hidden');
});
$('payment-modal-close').addEventListener('click', () => {
    $('payment-backdrop').classList.add('hidden');
});
$('payment-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = $('btn-pay-now');
    btn.disabled = true;
    btn.textContent = 'PROCESSING...';
    
    // Simulate payment processing
    setTimeout(() => {
        $('payment-backdrop').classList.add('hidden');
        btn.disabled = false;
        btn.textContent = 'PAY NOW';
        $('payment-form').reset();
        
        alert('Paiement réussi ! Votre réservation est confirmée.');
        showView('view-confirmation');
    }, 1500);
});

document.addEventListener('DOMContentLoaded', async () => {
    // Empêcher de choisir une date passée
    const dateInput = $('input-date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }

    const { data: { session } } = await db.auth.getSession();
    if (session?.user) {
        state.currentUser = session.user;
        updateNavbarAuthUI(session.user);
    }
});

// ============================================================
// ADMIN DASHBOARD LOGIC (Intégré)
// ============================================================
const ADMIN_EMAIL_ADDR = 'nixnithersaintval@gmail.com';

let adminBookings = [];
let adminCharters = [];
let adminRealtimeReady = false;

async function loadAdminData() {
    await Promise.all([loadAdminBookings(), loadAdminCharters()]);
    updateAdminStats();
    if (!adminRealtimeReady) {
        subscribeAdminRealtime();
        adminRealtimeReady = true;
    }
}

async function loadAdminBookings() {
    const { data, error } = await db
        .from('bookings')
        .select('*, trips(origin, destination, departure_at, price)')
        .order('booked_at', { ascending: false });

    if (error) { console.error('[Admin] Bookings:', error); return; }
    adminBookings = data || [];
    renderAdminBookings(adminBookings);
}

async function loadAdminCharters() {
    const { data, error } = await db
        .from('charter_requests')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) { console.error('[Admin] Charters:', error); return; }
    adminCharters = data || [];
    renderAdminCharters(adminCharters);
}

function updateAdminStats() {
    const pending  = adminCharters.filter(c => c.status === 'pending').length;
    const approved = adminCharters.filter(c => c.status === 'approved').length;

    const el = id => document.getElementById(id);
    if (el('a-stat-bookings')) el('a-stat-bookings').textContent = adminBookings.length;
    if (el('a-stat-charters')) el('a-stat-charters').textContent = adminCharters.length;
    if (el('a-stat-approved')) el('a-stat-approved').textContent = approved;
    if (el('a-stat-pending'))  el('a-stat-pending').textContent  = pending;
}

function renderAdminBookings(list) {
    const tbody = document.getElementById('a-bookings-body');
    if (!tbody) return;

    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="adm-empty">Aucune réservation trouvée.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(b => {
        const trip    = b.trips || {};
        const origin  = aEsc(trip.origin || '?');
        const dest    = aEsc(trip.destination || '?');
        const booked  = b.booked_at
            ? new Date(b.booked_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—';

        return `<tr>
            <td>
                <div class="adm-name">${aEsc(b.passenger_name)}</div>
                <div class="adm-email">${aEsc(b.passenger_email)}</div>
                <div class="adm-phone">${aEsc(b.passenger_phone)}</div>
            </td>
            <td><span class="adm-route">${origin} ➔ ${dest}</span></td>
            <td style="font-weight:700;font-size:15px;">${b.seat_number || '—'}</td>
            <td><span class="adm-code">${aEsc(b.booking_code)}</span></td>
            <td style="font-size:12px;color:#888;">${booked}</td>
            <td>
                <span class="adm-badge ${b.status || 'confirmed'}">
                    ${b.status === 'confirmed' ? '✓ Confirmé' : '✗ Annulé'}
                </span>
            </td>
        </tr>`;
    }).join('');
}

function renderAdminCharters(list) {
    const tbody = document.getElementById('a-charters-body');
    if (!tbody) return;

    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="adm-empty">Aucune demande charter.</td></tr>`;
        return;
    }

    const labels = {
        pending:  '⏳ En attente',
        approved: '✅ Approuvé',
        rejected: '❌ Rejeté'
    };

    tbody.innerHTML = list.map(c => {
        const evtDate   = c.event_date
            ? new Date(c.event_date + 'T00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—';
        const isPending = c.status === 'pending';
        const notes     = c.notes
            ? (c.notes.length > 60 ? c.notes.substring(0, 60) + '…' : c.notes)
            : '—';

        return `<tr>
            <td>
                <div class="adm-name">${aEsc(c.name)}</div>
                <div class="adm-email">${aEsc(c.email)}</div>
            </td>
            <td><div class="adm-phone">${aEsc(c.phone)}</div></td>
            <td style="font-weight:600;">${aEsc(c.purpose)}</td>
            <td style="font-size:12px;">${evtDate}</td>
            <td style="font-size:12px;color:#666;">${aEsc(notes)}</td>
            <td><span class="adm-badge ${c.status}">${labels[c.status] || c.status}</span></td>
            <td>
                <div class="adm-acts">
                    <button class="adm-btn-ok"
                        onclick="setCharterStatus('${c.id}','approved')"
                        ${!isPending ? 'disabled' : ''}>✓ OK</button>
                    <button class="adm-btn-no"
                        onclick="setCharterStatus('${c.id}','rejected')"
                        ${!isPending ? 'disabled' : ''}>✗ Non</button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

async function setCharterStatus(id, status) {
    const { error } = await db
        .from('charter_requests')
        .update({ status })
        .eq('id', id);

    if (error) {
        alert('Erreur lors de la mise à jour.');
        console.error(error);
        return;
    }

    const idx = adminCharters.findIndex(c => c.id === id);
    if (idx !== -1) adminCharters[idx].status = status;

    renderAdminCharters(applyCharterFilter());
    updateAdminStats();
}

function switchAdminTab(tab) {
    const isBookings = tab === 'bookings';
    document.getElementById('adm-panel-bookings').classList.toggle('hidden', !isBookings);
    document.getElementById('adm-panel-charters').classList.toggle('hidden', isBookings);
    document.getElementById('atab-book').classList.toggle('active', isBookings);
    document.getElementById('atab-charter').classList.toggle('active', !isBookings);
}

function filterAdminBookings() {
    const q = (document.getElementById('a-search-bookings')?.value || '').toLowerCase();
    const filtered = adminBookings.filter(b =>
        (b.passenger_name?.toLowerCase().includes(q)) ||
        (b.passenger_email?.toLowerCase().includes(q)) ||
        (b.booking_code?.toLowerCase().includes(q)) ||
        (b.trips?.origin?.toLowerCase().includes(q)) ||
        (b.trips?.destination?.toLowerCase().includes(q))
    );
    renderAdminBookings(filtered);
}

function applyCharterFilter() {
    const q = (document.getElementById('a-search-charters')?.value || '').toLowerCase();
    return adminCharters.filter(c =>
        (c.name?.toLowerCase().includes(q)) ||
        (c.email?.toLowerCase().includes(q)) ||
        (c.purpose?.toLowerCase().includes(q)) ||
        (c.phone?.toLowerCase().includes(q))
    );
}

function filterAdminCharters() {
    renderAdminCharters(applyCharterFilter());
}

function subscribeAdminRealtime() {
    db.channel('adm-rt-bookings')
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'bookings' },
            async () => { await loadAdminBookings(); updateAdminStats(); })
        .subscribe();

    db.channel('adm-rt-charters')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'charter_requests' },
            async () => { await loadAdminCharters(); updateAdminStats(); })
        .subscribe();
}

function aEsc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

