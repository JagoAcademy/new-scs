import { supabaseClient } from './supabase.js';

function getSafeRedirectUrl() {
    const params = new URLSearchParams(window.location.search);
    const rawRedirect = params.get('redirect') || sessionStorage.getItem('scs_auth_redirect');
    if (!rawRedirect) return null;
    try {
        const parsed = new URL(rawRedirect);
        const host = parsed.hostname.toLowerCase();
        if (host === 'f1swimming.com' || host.endsWith('.f1swimming.com') || host === 'localhost') {
            return parsed.toString();
        }
    } catch (e) {}
    return null;
}

function redirectAfterAuth(sessionObj) {
    const targetUrl = getSafeRedirectUrl();
    if (targetUrl && sessionObj?.access_token && sessionObj?.refresh_token) {
        sessionStorage.removeItem('scs_auth_redirect');
        const base = targetUrl.split('#')[0];
        const hash = `access_token=${encodeURIComponent(sessionObj.access_token)}&refresh_token=${encodeURIComponent(sessionObj.refresh_token)}`;
        window.location.replace(`${base}#${hash}`);
        return;
    }
    redirectAfterAuth(data?.session);
}

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. CEK SESSION: Lempar ke dashboard kalau udah login
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        redirectAfterAuth(session);
        return;
    }

    const containerLogin = document.getElementById('formLoginContainer');
    const containerRegister = document.getElementById('formRegisterContainer');
    const formLogin = document.getElementById('formLogin');
    const formRegister = document.getElementById('formRegister');
    const btnLogin = document.getElementById('btnLogin');
    const btnRegister = document.getElementById('btnRegister');
    const btnGoogleLogin = document.getElementById('btnGoogleLogin');

    // ==========================================
    // FUNGSI PENERJEMAH ERROR SUPABASE (ANTI LEBAY)
    // ==========================================
    function translateAuthError(err) {
        console.error("🔴 RAW ERROR DARI SUPABASE:", err); 
        
        let msg = "";
        if (typeof err === 'string') {
            msg = err;
        } else if (err instanceof Error) {
            msg = err.message; 
        } else if (err && typeof err === 'object') {
            msg = err.message || err.error_description || err.msg || err.error;
            if (!msg) {
                try { msg = JSON.stringify(err); } catch(e) { msg = ""; }
            }
        }

        if (!msg || msg === '{}' || msg === '[object Object]') {
            return "Pendaftaran ditolak oleh server. Pastikan email valid dan kata sandi minimal 6 karakter.";
        }

        const lowerMsg = String(msg).toLowerCase();
        
        if (lowerMsg.includes("already registered") || lowerMsg.includes("user already exists") || lowerMsg.includes("sudah terdaftar")) return "Email ini sudah terdaftar. Silakan kembali ke menu Masuk.";
        if (lowerMsg.includes("password should be")) return "Kata sandi terlalu lemah (minimal 6 karakter).";
        if (lowerMsg.includes("invalid login credentials")) return "Email atau kata sandi salah!";
        if (lowerMsg.includes("email not confirmed")) return "Email belum diverifikasi. Cek Kotak Masuk atau folder Spam Anda.";
        if (lowerMsg.includes("rate limit") || lowerMsg.includes("60 seconds") || lowerMsg.includes("too many")) return "Terlalu banyak percobaan. Tunggu 60 detik.";
        if (lowerMsg.includes("fetch") || lowerMsg.includes("network")) return "Koneksi terputus. Pastikan internet Anda stabil.";
        if (lowerMsg.includes("signups not allowed")) return "Pendaftaran ditutup sementara oleh sistem.";
        
        return msg; 
    }

    // ==========================================
    // AUTO-BUKA MODE REGISTER JIKA DIPANGGIL DARI HALAMAN LOMBA
    const initMode = new URLSearchParams(window.location.search).get('mode');
    if (initMode === 'register' && containerLogin && containerRegister) {
        containerLogin.classList.add('hidden', '-translate-x-full', 'opacity-0');
        containerLogin.classList.remove('translate-x-0', 'opacity-100');
        containerRegister.classList.remove('hidden', 'translate-x-full', 'opacity-0');
        containerRegister.classList.add('flex', 'translate-x-0', 'opacity-100');
    }

    // SWITCHER ANIMASI (LOGIN <-> REGISTER)
    // ==========================================
    document.getElementById('btnSwitchToRegister').addEventListener('click', () => {
        containerLogin.classList.remove('translate-x-0', 'opacity-100');
        containerLogin.classList.add('-translate-x-full', 'opacity-0');
        setTimeout(() => {
            containerLogin.classList.add('hidden');
            containerRegister.classList.remove('hidden');
            containerRegister.classList.add('flex');
            setTimeout(() => {
                containerRegister.classList.remove('translate-x-full', 'opacity-0');
                containerRegister.classList.add('translate-x-0', 'opacity-100');
            }, 50);
        }, 300);
    });

    document.getElementById('btnSwitchToLogin').addEventListener('click', () => {
        containerRegister.classList.remove('translate-x-0', 'opacity-100');
        containerRegister.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            containerRegister.classList.add('hidden');
            containerRegister.classList.remove('flex');
            containerLogin.classList.remove('hidden');
            setTimeout(() => {
                containerLogin.classList.remove('-translate-x-full', 'opacity-0');
                containerLogin.classList.add('translate-x-0', 'opacity-100');
            }, 50);
        }, 300);
    });

    // ==========================================
    // LOGIKA LOGIN GOOGLE (TOMBOL STATIS ANTI-CACHE)
    // ==========================================
    if (btnGoogleLogin) {
        btnGoogleLogin.addEventListener('click', async () => {
            const originalHtml = btnGoogleLogin.innerHTML;
            btnGoogleLogin.innerHTML = '<span class="animate-spin text-base">↻</span> Menghubungkan ke Google...';
            btnGoogleLogin.disabled = true;

            try {
                const pendingRedirect = new URLSearchParams(window.location.search).get('redirect');
                if (pendingRedirect) {
                    sessionStorage.setItem('scs_auth_redirect', pendingRedirect);
                }

                const { error } = await supabaseClient.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: window.location.origin + '/auth.html',
                        queryParams: {
                            prompt: 'select_account'
                        }
                    }
                });

                if (error) throw error;
            } catch (err) {
                alert("Gagal login Google: " + translateAuthError(err));
                btnGoogleLogin.innerHTML = originalHtml;
                btnGoogleLogin.disabled = false;
            }
        });
    }

    // ==========================================
    // LOGIKA LOGIN EMAIL
    // ==========================================
    formLogin.addEventListener('submit', async () => {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorMsg = document.getElementById('loginErrorMsg');

        btnLogin.innerHTML = `<span class="animate-spin text-xl">↻</span> Memproses...`;
        btnLogin.disabled = true;
        errorMsg.classList.add('hidden');

        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;
            
            redirectAfterAuth(data?.session);

        } catch (err) {
            console.error("Login Error:", err);
            errorMsg.innerText = "❌ " + translateAuthError(err);
            errorMsg.classList.remove('hidden');
            btnLogin.innerHTML = `Masuk 🚀`;
            btnLogin.disabled = false;
        }
    });

    // ==========================================
    // LOGIKA REGISTER EMAIL (TANPA VERIFIKASI - LANGSUNG REDIRECT)
    // ==========================================
    formRegister.addEventListener('submit', async () => {
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value; 
        const alertMsg = document.getElementById('regAlertMsg');

        if (password !== confirmPassword) {
            alertMsg.innerText = "❌ Kata sandi tidak cocok. Silakan periksa kembali!";
            alertMsg.className = "bg-red-50 text-red-600 text-xs font-bold p-3 rounded-lg border border-red-100 text-center block";
            alertMsg.classList.remove('hidden');
            return;
        }

        btnRegister.innerHTML = `<span class="animate-spin text-xl">↻</span> Memproses...`;
        btnRegister.disabled = true;
        alertMsg.classList.add('hidden');

        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
            });

            if (error) throw error;

            if (data?.user && data.user.identities && data.user.identities.length === 0) {
                throw new Error("Email ini sudah terdaftar. Silakan kembali ke menu Masuk.");
            }

            // KARENA AUTH EMAIL OFF, LANGSUNG LEMPAR KE DASHBOARD 🚀
            redirectAfterAuth(data?.session);

        } catch (err) {
            console.error("Register Error:", err);
            alertMsg.innerText = "❌ " + translateAuthError(err);
            alertMsg.className = "bg-red-50 text-red-600 text-xs font-bold p-3 rounded-lg border border-red-100 text-center block";
            alertMsg.classList.remove('hidden');
            
            btnRegister.innerHTML = `Daftarkan Via Email`;
            btnRegister.disabled = false;
        }
    });

    // ==========================================
    // LOGIKA LUPA PASSWORD (MODAL)
    // ==========================================
    const btnLupaSandi = document.getElementById('btnLupaSandi');
    const modalResetPassword = document.getElementById('modalResetPassword');
    const btnTutupReset = document.getElementById('btnTutupReset');
    const btnKirimReset = document.getElementById('btnKirimReset');

    if (btnLupaSandi) {
        btnLupaSandi.addEventListener('click', (e) => {
            e.preventDefault();
            modalResetPassword.classList.remove('hidden');
        });
    }

    if (btnTutupReset) {
        btnTutupReset.addEventListener('click', () => {
            modalResetPassword.classList.add('hidden');
            document.getElementById('resetAlertMsg').classList.add('hidden');
        });
    }

    if (btnKirimReset) {
        btnKirimReset.addEventListener('click', async () => {
            const email = document.getElementById('inputResetEmail').value.trim();
            const alertMsg = document.getElementById('resetAlertMsg');

            if (!email) {
                alertMsg.innerText = "❌ Masukkan email akun Anda terlebih dahulu!";
                alertMsg.className = "bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl border border-red-100 text-center block mb-4";
                alertMsg.classList.remove('hidden');
                return;
            }

            btnKirimReset.innerHTML = `<span class="animate-spin inline-block">↻</span> Mengirim...`;
            btnKirimReset.disabled = true;
            alertMsg.classList.add('hidden');

            try {
                // Membaca asal domain otomatis (contoh: https://f1swimming.com/dashboard.html)
                const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/dashboard.html', 
                });

                if (error) throw error;

                alertMsg.innerHTML = "✅ <strong>Tautan Terkirim!</strong><br>Silakan periksa kotak masuk atau folder spam email Anda.";
                alertMsg.className = "bg-emerald-50 text-emerald-700 text-xs font-bold p-3 rounded-xl border border-emerald-200 text-center block mb-4";
                document.getElementById('inputResetEmail').value = ''; 

            } catch (err) {
                console.error("Reset Password Error:", err);
                alertMsg.innerText = "❌ " + translateAuthError(err);
                alertMsg.className = "bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl border border-red-100 text-center block mb-4";
                alertMsg.classList.remove('hidden');
            } finally {
                btnKirimReset.innerHTML = "Kirim Tautan";
                btnKirimReset.disabled = false;
            }
        });
    }
});
