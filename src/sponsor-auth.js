import { supabaseClient } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. CEK SESSION: Lempar ke dashboard sponsor kalau udah login
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        window.location.replace('/sponsor.html');
        return;
    }

    const containerLogin = document.getElementById('loginContainer');
    const containerRegister = document.getElementById('registerContainer');
    const formLogin = document.getElementById('sponsorLoginForm');
    const formRegister = document.getElementById('sponsorRegisterForm');
    const btnLogin = document.getElementById('btnLogin');
    const btnRegister = document.getElementById('btnRegister');

    // ==========================================
    // FUNGSI PENERJEMAH ERROR SUPABASE
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
    // SWITCHER ANIMASI (LOGIN <-> REGISTER)
    // ==========================================
    document.getElementById('btnSwitchToLogin').addEventListener('click', () => {
        containerRegister.classList.add('hidden');
        containerLogin.classList.remove('hidden');
    });

    document.getElementById('btnSwitchToRegister').addEventListener('click', () => {
        containerLogin.classList.add('hidden');
        containerRegister.classList.remove('hidden');
    });

    // ==========================================
    // LOGIKA LOGIN EMAIL
    // ==========================================
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault(); // 🔥 Mencegah halaman reload

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorMsg = document.getElementById('loginErrorMsg');

        btnLogin.innerHTML = `<span class="animate-spin inline-block text-xl">↻</span> Memproses...`;
        btnLogin.disabled = true;
        errorMsg.classList.add('hidden');

        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;
            
            // Redirect langsung ke dashboard sponsor setelah berhasil login
            window.location.replace('/sponsor.html');

        } catch (err) {
            console.error("Login Error:", err);
            errorMsg.innerText = "❌ " + translateAuthError(err);
            errorMsg.classList.remove('hidden');
            btnLogin.innerHTML = `Masuk ke Dashboard ➔`;
            btnLogin.disabled = false;
        }
    });

    // ==========================================
    // LOGIKA REGISTER EMAIL
    // ==========================================
    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault(); // 🔥 Mencegah halaman reload

        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value; 
        const alertMsg = document.getElementById('regAlertMsg');

        if (password !== confirmPassword) {
            alertMsg.innerText = "❌ Kata sandi tidak cocok. Silakan periksa kembali!";
            alertMsg.className = "bg-red-900/30 text-red-400 text-xs font-bold p-3 rounded-lg border border-red-500/50 text-center block";
            alertMsg.classList.remove('hidden');
            return;
        }

        btnRegister.innerHTML = `<span class="animate-spin inline-block text-xl">↻</span> Memproses...`;
        btnRegister.disabled = true;
        alertMsg.classList.add('hidden');

        try {
            // Murni Auth signup
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: { role: 'sponsor' } // Role tagging untuk referensi masa depan
                }
            });

            if (error) throw error;

            if (data?.user && data.user.identities && data.user.identities.length === 0) {
                throw new Error("Email ini sudah terdaftar. Silakan kembali ke menu Masuk.");
            }

            alertMsg.innerHTML = "✅ <strong>Pendaftaran Berhasil!</strong><br>Jika diperlukan, silakan periksa <strong>Kotak Masuk / Spam</strong> email Anda. Atau Anda dapat langsung masuk.";
            alertMsg.className = "bg-emerald-900/30 text-emerald-400 text-xs font-bold p-3 rounded-lg border border-emerald-500/50 text-center leading-relaxed block";
            
            document.getElementById('regEmail').value = '';
            document.getElementById('regPassword').value = '';
            document.getElementById('regConfirmPassword').value = '';

            // Pindah ke tampilan login setelah sukses
            setTimeout(() => {
                document.getElementById('btnSwitchToLogin').click();
            }, 2500);

        } catch (err) {
            console.error("Register Error:", err);
            alertMsg.innerText = "❌ " + translateAuthError(err);
            alertMsg.className = "bg-red-900/30 text-red-400 text-xs font-bold p-3 rounded-lg border border-red-500/50 text-center block";
            alertMsg.classList.remove('hidden');
        } finally {
            btnRegister.innerHTML = `Daftar & Klaim Free Token 🚀`;
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
                alertMsg.className = "bg-red-900/30 text-red-400 text-xs font-bold p-3 rounded-xl border border-red-500/50 text-center block mb-4";
                alertMsg.classList.remove('hidden');
                return;
            }

            btnKirimReset.innerHTML = `<span class="animate-spin inline-block">↻</span> Mengirim...`;
            btnKirimReset.disabled = true;
            alertMsg.classList.add('hidden');

            try {
                // Diarahkan ke dashboard sponsor setelah klik email reset password
                const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/sponsor.html', 
                });

                if (error) throw error;

                alertMsg.innerHTML = "✅ <strong>Tautan Terkirim!</strong><br>Silakan periksa kotak masuk atau folder spam email Anda.";
                alertMsg.className = "bg-emerald-900/30 text-emerald-400 text-xs font-bold p-3 rounded-xl border border-emerald-500/50 text-center block mb-4";
                document.getElementById('inputResetEmail').value = ''; 

            } catch (err) {
                console.error("Reset Password Error:", err);
                alertMsg.innerText = "❌ " + translateAuthError(err);
                alertMsg.className = "bg-red-900/30 text-red-400 text-xs font-bold p-3 rounded-xl border border-red-500/50 text-center block mb-4";
                alertMsg.classList.remove('hidden');
            } finally {
                btnKirimReset.innerHTML = "Kirim Tautan";
                btnKirimReset.disabled = false;
            }
        });
    }
});
