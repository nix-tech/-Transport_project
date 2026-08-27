// ============================================================
// SUPABASE CONFIG — Remplace avec tes vraies valeurs
// ============================================================
// 1. Va sur https://supabase.com/dashboard
// 2. Choisis ton projet
// 3. Settings → API → copie "Project URL" & "anon public" key
// 4. Authentication → Providers → Google → Active + Client ID/Secret
// 5. Ajoute l'URL de redirection dans Google Cloud Console:
//    https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback

const SUPABASE_URL = 'https://twokogkvkgdndxyifxnq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_WwroKDNcqLzzYRI8c13NjQ_dxZiBTqe';

// Redirect URL après Google OAuth (adapte pour production)
const AUTH_REDIRECT_URL = window.location.origin + window.location.pathname;
