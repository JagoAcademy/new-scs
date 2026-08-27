import { supabaseClient } from './supabase.js';

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cek Sesi (Apakah User Login sebagai EO/Klub?)
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        const overlayLogin = document.getElementById('overlayLoginAds');
        
        if (session && session.user) {
            currentUser = session.user;
            // Hilangkan gembok overlay kalau udah login
            if (overlayLogin) overlayLogin.classList.add('hidden');
        } else {
            // Tampilkan gembok kalau belum login
            if (overlayLogin) overlayLogin.classList.remove('hidden');
        }
    } catch (err) {
        console.error("Gagal cek sesi:", err);
    }

    // 2. Batasan Checkbox Penempatan (Max 2)
    const checkboxes = document.querySelectorAll('.ads-placement');
    checkboxes.forEach(chk => {
        chk.addEventListener('change', () => {
            const checkedCount = document.querySelectorAll('.ads-placement:checked').length;
            if (checkedCount > 2) {
                chk.checked = false;
                alert("Maksimal pilih 2 area penempatan untuk paket Free 1 Ads!");
            }
        });
    });

    // 3. Logika Submit Request Ads
    const formAds = document.getElementById('formRequestAds');
    if (formAds) {
        formAds.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!currentUser) return alert("Sesi tidak valid. Silakan muat ulang halaman atau login kembali.");

            const btnSubmit = document.getElementById('btnSubmitAds');
            const fileBanner = document.getElementById('adsBanner').files[0];
            const namaUsaha = document.getElementById('adsNama').value.trim();
            const linkUrl = document.getElementById('adsUrl').value.trim();
            
            const checkedPlacements = Array.from(document.querySelectorAll('.ads-placement:checked')).map(cb => cb.value);

            if (!fileBanner) return alert("Harap upload banner logo usaha Anda.");
            if (checkedPlacements.length === 0) return alert("Pilih minimal 1 penempatan iklan.");

            btnSubmit.innerHTML = 'Mengunggah Banner... ⏳';
            btnSubmit.disabled = true;

            try {
                // A. Upload Gambar ke Bucket 'scs-ads-media'
                const fileExt = fileBanner.name.split('.').pop();
                const fileName = `iklan_${currentUser.id}_${Date.now()}.${fileExt}`;
                
                const { error: uploadError } = await supabaseClient.storage
                    .from('scs-ads-media')
                    .upload(fileName, fileBanner);
                    
                if (uploadError) throw uploadError;

                // B. Dapatkan Public URL Gambar
                const { data: urlData } = supabaseClient.storage
                    .from('scs-ads-media')
                    .getPublicUrl(fileName);
                
                const bannerUrl = urlData.publicUrl;

                btnSubmit.innerHTML = 'Menyimpan Request... ⏳';

                // C. Insert Data ke Tabel scs_ads
                const { error: insertError } = await supabaseClient
                    .from('scs_ads')
                    .insert([{
                        eo_id: currentUser.id,
                        nama_usaha: namaUsaha,
                        link_url: linkUrl || null,
                        banner_url: bannerUrl,
                        penempatan: checkedPlacements,
                        tipe_paket: 'Free 1 Ads',
                        status: 'Pending'
                    }]);

                if (insertError) throw insertError;

                alert("✅ Request iklan berhasil dikirim! Tim SCS akan mereview dan mengaktifkannya dalam 1x24 Jam.");
                formAds.reset();

            } catch (err) {
                alert("Terjadi kesalahan sistem: " + err.message);
                console.error(err);
            } finally {
                btnSubmit.innerHTML = 'Submit Request Iklan';
                btnSubmit.disabled = false;
            }
        });
    }
});
