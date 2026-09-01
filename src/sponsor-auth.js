import { supabaseClient } from './supabase.js'; //[span_1](start_span)[span_1](end_span)

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('sponsorRegisterForm');
    const btnRegister = document.getElementById('btnRegister');
    const errorMsg = document.getElementById('errorMsg');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const corpName = document.getElementById('corpName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Reset Error
        errorMsg.classList.add('hidden');

        // Validasi Password
        if (password !== confirmPassword) {
            showError("Password dan Konfirmasi Password tidak cocok!");
            return;
        }

        if (password.length < 6) {
            showError("Password minimal 6 karakter.");
            return;
        }

        // Loading State
        const originalBtnText = btnRegister.innerHTML;
        btnRegister.innerHTML = "⏳ Memproses Pendaftaran...";
        btnRegister.disabled = true;
        btnRegister.classList.add('opacity-50', 'cursor-not-allowed');

        try {
            // 1. Mendaftarkan Akun ke Auth Supabase[span_2](start_span)[span_2](end_span)
            const { data: authData, error: authErr } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        role: 'sponsor',
                        company_name: corpName
                    }
                }
            });

            if (authErr) throw authErr;

            // 2. Suntik Data ke Tabel master_sponsors dengan GRATIS 1 TOKEN
            if (authData.user) {
                const { error: dbErr } = await supabaseClient.from('master_sponsors').insert([
                    {
                        auth_uid: authData.user.id, // Menyambungkan ke auth.users(id)
                        sponsor_name: corpName,
                        sponsor_type: 'placement', // Nilai default dari struktur awal
                        tokens: 1,                 // Memberikan 1 free token injeksi
                        logo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(corpName)}&background=0f172a&color=3b82f6`
                    }
                ]);

                if (dbErr) throw dbErr;
            }

            // 3. Sukses! Redirect ke Portal Sponsor
            btnRegister.innerHTML = "✅ Berhasil! Mengalihkan ke Dashboard...";
            btnRegister.classList.remove('bg-blue-600', 'hover:bg-blue-500');
            btnRegister.classList.add('bg-emerald-500');
            
            setTimeout(() => {
                window.location.href = '/sponsor.html';
            }, 1500);

        } catch (error) {
            showError(error.message || "Terjadi kesalahan saat mendaftar.");
            btnRegister.innerHTML = originalBtnText;
            btnRegister.disabled = false;
            btnRegister.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    });

    function showError(msg) {
        errorMsg.innerText = msg;
        errorMsg.classList.remove('hidden');
    }
});
