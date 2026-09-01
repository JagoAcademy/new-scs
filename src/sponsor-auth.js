import { supabaseClient } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // UI Elements
    const registerContainer = document.getElementById('registerContainer');
    const loginContainer = document.getElementById('loginContainer');
    const toLoginBtn = document.getElementById('toLoginBtn');
    const toRegisterBtn = document.getElementById('toRegisterBtn');
    const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');

    // Toggle Logic
    toLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        registerContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
    });

    toRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.classList.add('hidden');
        registerContainer.classList.remove('hidden');
    });

    forgotPasswordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        alert("Fitur Lupa Password sedang dalam tahap pengembangan. Silakan hubungi admin F1 Swimming.");
    });

    // ==========================================
    // 1. LOGIKA REGISTRASI SPONSOR
    // ==========================================
    const regForm = document.getElementById('sponsorRegisterForm');
    const btnRegister = document.getElementById('btnRegister');
    const errorMsgReg = document.getElementById('errorMsgReg');

    regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const corpName = document.getElementById('corpName').value.trim();
        const email = document.getElementById('email').value.trim();
        const username = document.getElementById('username').value.trim(); // Sudah di-filter tanpa spasi via HTML
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        errorMsgReg.classList.add('hidden');

        if (password !== confirmPassword) return showRegError("Password dan Konfirmasi Password tidak cocok!");
        if (password.length < 6) return showRegError("Password minimal 6 karakter.");

        const originalBtnText = btnRegister.innerHTML;
        btnRegister.innerHTML = "⏳ Memproses Pendaftaran...";
        btnRegister.disabled = true;
        btnRegister.classList.add('opacity-50', 'cursor-not-allowed');

        try {
            // A. Cek ketersediaan Username dulu
            const { data: existingUser } = await supabaseClient.from('master_sponsors').select('id').eq('username', username).single();
            if (existingUser) throw new Error("Username sudah digunakan. Silakan pilih username lain.");

            // B. Daftar ke Supabase Auth
            const { data: authData, error: authErr } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: { data: { role: 'sponsor', company_name: corpName } }
            });

            if (authErr) throw authErr;

            // C. Suntik Data ke Tabel master_sponsors dengan GRATIS 1 TOKEN
            if (authData.user) {
                const { error: dbErr } = await supabaseClient.from('master_sponsors').insert([
                    {
                        auth_uid: authData.user.id, 
                        sponsor_name: corpName,
                        username: username,
                        email: email, // Disimpan untuk referensi login nanti
                        sponsor_type: 'placement',
                        tokens: 1, // 🎁 FREE TOKEN
                        logo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(corpName)}&background=0f172a&color=3b82f6`
                    }
                ]);

                if (dbErr) throw dbErr;
            }

            btnRegister.innerHTML = "✅ Berhasil! Mengalihkan ke Dashboard...";
            btnRegister.classList.replace('bg-blue-600', 'bg-emerald-500');
            
            setTimeout(() => { window.location.href = '/sponsor.html'; }, 1500);

        } catch (error) {
            showRegError(error.message || "Terjadi kesalahan saat mendaftar.");
            btnRegister.innerHTML = originalBtnText;
            btnRegister.disabled = false;
            btnRegister.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    });

    // ==========================================
    // 2. LOGIKA LOGIN SPONSOR (Bisa Email / Username)
    // ==========================================
    const loginForm = document.getElementById('sponsorLoginForm');
    const btnLogin = document.getElementById('btnLogin');
    const errorMsgLogin = document.getElementById('errorMsgLogin');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const identifier = document.getElementById('loginIdentifier').value.trim();
        const password = document.getElementById('loginPassword').value;

        errorMsgLogin.classList.add('hidden');
        
        const originalBtnText = btnLogin.innerHTML;
        btnLogin.innerHTML = "⏳ Sedang Memeriksa...";
        btnLogin.disabled = true;
        btnLogin.classList.add('opacity-50', 'cursor-not-allowed');

        try {
            let targetEmail = identifier;

            // Jika tidak ada '@', berarti user mencoba login pakai Username
            if (!identifier.includes('@')) {
                const { data: sponsorData, error: findErr } = await supabaseClient
                    .from('master_sponsors')
                    .select('email')
                    .eq('username', identifier)
                    .single();

                if (findErr || !sponsorData || !sponsorData.email) {
                    throw new Error("Username tidak ditemukan di sistem kami.");
                }
                targetEmail = sponsorData.email; // Timpa identifier dengan email aslinya
            }

            // Eksekusi Login Supabase menggunakan Email
            const { data: loginData, error: loginErr } = await supabaseClient.auth.signInWithPassword({
                email: targetEmail,
                password: password
            });

            if (loginErr) throw loginErr;

            btnLogin.innerHTML = "✅ Login Berhasil!";
            btnLogin.classList.replace('bg-blue-600', 'bg-emerald-500');
            
            setTimeout(() => { window.location.href = '/sponsor.html'; }, 1000);

        } catch (error) {
            showLoginError(error.message || "Gagal login. Periksa kembali kredensial Anda.");
            btnLogin.innerHTML = originalBtnText;
            btnLogin.disabled = false;
            btnLogin.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    });

    // Error Handlers
    function showRegError(msg) {
        errorMsgReg.innerText = msg;
        errorMsgReg.classList.remove('hidden');
    }
    
    function showLoginError(msg) {
        errorMsgLogin.innerText = msg;
        errorMsgLogin.classList.remove('hidden');
    }
});
