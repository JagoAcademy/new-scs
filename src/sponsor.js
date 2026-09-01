import { supabaseClient } from './supabase.js';

let currentSponsor = null;
let selectedEventId = null;

document.addEventListener('DOMContentLoaded', async () => {
    
    // ==========================================
    // 1. MOBILE MENU TOGGLE
    // ==========================================
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenuPanel = document.getElementById('mobileMenuPanel');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const closeMobileMenu = document.getElementById('closeMobileMenu');

    function toggleMobileMenu() {
        if (mobileMenuPanel.classList.contains('translate-x-full')) {
            mobileMenuPanel.classList.remove('translate-x-full');
            mobileMenuOverlay.classList.remove('hidden');
        } else {
            mobileMenuPanel.classList.add('translate-x-full');
            mobileMenuOverlay.classList.add('hidden');
        }
    }
    
    if(mobileMenuToggle) mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    if(closeMobileMenu) closeMobileMenu.addEventListener('click', toggleMobileMenu);
    if(mobileMenuOverlay) mobileMenuOverlay.addEventListener('click', toggleMobileMenu);

    // ==========================================
    // 2. LOGOUT LOGIC
    // ==========================================
    const logoutAction = async () => {
        await supabaseClient.auth.signOut();
        window.location.replace('/sponsor-auth.html'); 
    };
    
    document.getElementById('logoutBtnDesk').addEventListener('click', logoutAction);
    document.getElementById('logoutBtnMob').addEventListener('click', logoutAction);

    // ==========================================
    // 3. FETCH DATA SPONSOR & ONBOARDING
    // ==========================================
    await fetchSponsorData();

    // ==========================================
    // 4. ACTION BUTTONS
    // ==========================================
    document.getElementById('btnSaveUrl').addEventListener('click', async () => {
        const newUrl = document.getElementById('defaultUrlInput').value.trim();
        const msg = document.getElementById('urlStatusMsg');
        
        if(!newUrl) return;

        try {
            const { error } = await supabaseClient.from('sponsors_user').update({ default_url: newUrl }).eq('id', currentSponsor.id);
            if(error) throw error;

            currentSponsor.default_url = newUrl;
            msg.innerText = "Tersimpan!";
            msg.classList.remove('hidden');
            setTimeout(() => msg.classList.add('hidden'), 2000);
        } catch (err) {
            alert("Gagal menyimpan URL: " + err.message);
        }
    });

    const contactAdminTopup = () => {
        const text = `Halo tim F1 Swimming, saya dari ${currentSponsor.company_name}. Saya ingin Top-Up token Injeksi Event.`;
        window.open(`https://wa.me/6289691219977?text=${encodeURIComponent(text)}`, '_blank');
    };

    document.getElementById('btnTopupDesk').addEventListener('click', contactAdminTopup);
    document.getElementById('btnTopupMobile').addEventListener('click', contactAdminTopup);

    document.getElementById('btnConfirmInject').addEventListener('click', processInject);
});

async function fetchSponsorData() {
    try {
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError || !session) {
            window.location.replace('/sponsor-auth.html');
            return;
        }

        const userId = session.user.id; 
        const userEmail = session.user.email; // Fallback jika onbEmail kosong

        // Cek tabel sponsors_user
        const { data: sponsorData, error: sponsorError } = await supabaseClient
            .from('sponsors_user')
            .select('*')
            .eq('owner_id', userId)
            .single();

        // JIKA KOSONG -> PAKSA ONBOARDING
        if (sponsorError || !sponsorData) {
            const modalOnboard = document.getElementById('modalOnboarding');
            modalOnboard.classList.remove('hidden'); 
            
            // Pre-fill email jika ada
            if(userEmail) document.getElementById('onbEmail').value = userEmail;
            
            const btnSaveOnboard = document.getElementById('btnSaveOnboarding');
            
            btnSaveOnboard.onclick = async () => {
                const bCompany = document.getElementById('onbCompanyName').value.trim();
                const bPic = document.getElementById('onbPicName').value.trim();
                const bEmail = document.getElementById('onbEmail').value.trim();
                const bWa = document.getElementById('onbWa').value.trim();
                const bCat = document.getElementById('onbCategory').value;
                const bUrl = document.getElementById('onbUrl').value.trim();
                
                const onboardMsg = document.getElementById('onboardMsg');

                if (!bCompany || !bPic || !bEmail || !bWa || !bCat || !bUrl) {
                    onboardMsg.innerText = "Semua kolom wajib diisi!";
                    onboardMsg.className = "text-xs font-bold text-center rounded-lg p-3 bg-red-900/30 text-red-400 block border border-red-500/50";
                    return;
                }

                btnSaveOnboard.innerText = "Membangun Profil...";
                btnSaveOnboard.disabled = true;

                try {
                    const defaultLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(bCompany)}&background=1e293b&color=3b82f6`;

                    const { error: insertErr } = await supabaseClient
                        .from('sponsors_user')
                        .insert([{
                            owner_id: userId,
                            company_name: bCompany,
                            pic_name: bPic,
                            company_email: bEmail,
                            contact_wa: bWa,
                            industry_category: bCat,
                            default_url: bUrl,
                            logo_url: defaultLogo,
                            tokens: 1 // FREE TOKEN
                        }]);

                    if (insertErr) throw insertErr;

                    onboardMsg.innerText = "✅ Profil berhasil dibuat! Menyiapkan Dashboard...";
                    onboardMsg.className = "text-xs font-bold text-center rounded-lg p-3 bg-emerald-900/30 text-emerald-400 block border border-emerald-500/50";
                    
                    setTimeout(() => {
                        modalOnboard.classList.add('hidden');
                        fetchSponsorData(); 
                    }, 1500);

                } catch (err) {
                    onboardMsg.innerText = "Gagal: " + err.message;
                    onboardMsg.className = "text-xs font-bold text-center rounded-lg p-3 bg-red-900/30 text-red-400 block border border-red-500/50";
                    btnSaveOnboard.innerText = "Simpan & Mulai Eksplorasi 🚀";
                    btnSaveOnboard.disabled = false;
                }
            };
            return; 
        }

        // JIKA SUDAH ADA DATA -> UPDATE UI
        currentSponsor = sponsorData; 
        updateUI();
        await fetchEvents();

    } catch (error) {
        console.error("Gagal menarik data sponsor:", error);
    }
}

function updateUI() {
    // Desktop UI
    document.getElementById('brandNameUI').innerText = currentSponsor.company_name;
    document.getElementById('brandCategoryUI').innerText = currentSponsor.industry_category;
    document.getElementById('tokenCountUI').innerText = currentSponsor.tokens;
    document.getElementById('defaultUrlInput').value = currentSponsor.default_url || '';
    if (currentSponsor.logo_url) document.getElementById('brandLogoUI').src = currentSponsor.logo_url;

    // Mobile UI
    document.getElementById('mobileBrandNameUI').innerText = currentSponsor.company_name;
    document.getElementById('mobileBrandCategoryUI').innerText = currentSponsor.industry_category;
    if (currentSponsor.logo_url) document.getElementById('mobileLogoUI').src = currentSponsor.logo_url;
}

async function fetchEvents() {
    const grid = document.getElementById('eventGrid');
    
    try {
        const { data: events, error } = await supabaseClient
            .from('events')
            .select('id, event_name, event_date, kota, provinsi')
            .order('id', { ascending: false });

        if (error) throw error;
        grid.innerHTML = '';

        if(events.length === 0) {
            grid.innerHTML = `<div class="col-span-full p-8 text-center text-slate-500">Belum ada event tersedia.</div>`;
            return;
        }

        events.forEach(ev => {
            grid.innerHTML += `
                <div class="bg-slate-800/40 border border-slate-700 p-5 rounded-2xl flex flex-col justify-between hover:border-slate-500 transition-colors">
                    <div class="mb-4">
                        <span class="inline-block px-2 py-0.5 bg-slate-700 text-slate-300 text-[9px] font-bold uppercase rounded mb-2">${ev.kota || 'Nasional'}</span>
                        <h3 class="font-black text-white text-lg leading-tight mb-1">${ev.event_name}</h3>
                        <p class="text-xs text-slate-400 font-mono">📅 ${ev.event_date}</p>
                    </div>
                    <button onclick="window.openInjectModal(${ev.id}, '${ev.event_name}')" class="w-full py-2.5 bg-slate-700 hover:bg-blue-600 text-white font-bold rounded-lg text-xs transition-colors shadow border border-slate-600 hover:border-blue-500">Suntik Logo 🚀</button>
                </div>
            `;
        });

    } catch (err) {
        grid.innerHTML = `<div class="col-span-full p-8 text-center text-red-500">Gagal memuat event.</div>`;
    }
}

// Global function untuk dipanggil dari HTML inline onClick
window.openInjectModal = function(id, name) {
    if (currentSponsor.tokens <= 0) {
        alert("Token Anda habis! Silakan Top-Up Token terlebih dahulu.");
        return;
    }
    
    selectedEventId = id;
    document.getElementById('modalEventName').innerText = name;
    document.getElementById('modalUrlInput').value = currentSponsor.default_url || '';
    
    document.getElementById('injectStatusMsg').classList.add('hidden');
    document.getElementById('injectModal').classList.remove('hidden');
    document.getElementById('injectModal').classList.add('flex');
}

window.closeModalInject = function() {
    document.getElementById('injectModal').classList.add('hidden');
    document.getElementById('injectModal').classList.remove('flex');
    selectedEventId = null;
}

async function processInject() {
    const statusMsg = document.getElementById('injectStatusMsg');
    const injectUrl = document.getElementById('modalUrlInput').value;
    const btnConfirm = document.getElementById('btnConfirmInject');

    btnConfirm.innerText = "Menyuntikkan...";
    btnConfirm.disabled = true;

    try {
        const newTokenCount = currentSponsor.tokens - 1;
        const { error: updateErr } = await supabaseClient
            .from('sponsors_user')
            .update({ tokens: newTokenCount })
            .eq('id', currentSponsor.id);

        if (updateErr) throw updateErr;

        statusMsg.innerHTML = "✅ <strong>Suntikan Berhasil!</strong> Logo Anda siap tayang.";
        statusMsg.className = "text-xs font-bold text-center rounded-lg p-3 mb-4 bg-emerald-900/30 text-emerald-400 block border border-emerald-500/50";
        
        currentSponsor.tokens = newTokenCount;
        updateUI();

        setTimeout(() => {
            closeModalInject();
            btnConfirm.innerText = "Suntik Sekarang 🚀";
            btnConfirm.disabled = false;
        }, 1500);

    } catch (err) {
        statusMsg.innerText = "Gagal: " + err.message;
        statusMsg.className = "text-xs font-bold text-center rounded-lg p-3 mb-4 bg-red-900/30 text-red-400 block border border-red-500/50";
        btnConfirm.innerText = "Coba Lagi";
        btnConfirm.disabled = false;
    }
}
