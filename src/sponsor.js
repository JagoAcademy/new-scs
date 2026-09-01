import { supabaseClient } from './supabase.js';

let currentSponsor = null;
let currentUserId = null;
let ownedBrands = [];

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
    // 3. FETCH DATA & INITIALIZATION
    // ==========================================
    await fetchSponsorData();

    // ==========================================
    // 4. LOGIKA PENGATURAN PROFIL & AKUN
    // ==========================================
    const btnEditProfilSponsor = document.getElementById('btnEditProfilSponsor');
    const btnEditProfilMobile = document.getElementById('btnEditProfilMobile');
    const modalEditProfile = document.getElementById('modalEditProfile');
    const closeModalProfileBtn = document.getElementById('closeModalProfileBtn');

    function openProfileModal() {
        if (!currentSponsor) return;
        
        document.getElementById('editCorpName').value = currentSponsor.company_name || '';
        document.getElementById('editPicName').value = currentSponsor.pic_name || '';
        document.getElementById('editContactWa').value = currentSponsor.contact_wa || '';
        
        supabaseClient.auth.getUser().then(({data}) => {
            if(data.user) document.getElementById('editAuthEmail').value = data.user.email;
        });

        document.getElementById('statusProfilMsg').classList.add('hidden');
        document.getElementById('statusAkunMsg').classList.add('hidden');
        
        if(!mobileMenuOverlay.classList.contains('hidden')) toggleMobileMenu();

        modalEditProfile.classList.remove('hidden');
        setTimeout(() => modalEditProfile.firstElementChild.classList.remove('scale-95'), 10);
    }

    if (btnEditProfilSponsor) btnEditProfilSponsor.addEventListener('click', openProfileModal);
    if (btnEditProfilMobile) btnEditProfilMobile.addEventListener('click', openProfileModal);

    if (closeModalProfileBtn) {
        closeModalProfileBtn.addEventListener('click', () => {
            modalEditProfile.firstElementChild.classList.add('scale-95');
            setTimeout(() => modalEditProfile.classList.add('hidden'), 200);
        });
    }

    // Tab Switcher Profil Modal
    const tabProfilSponsorBtn = document.getElementById('tabProfilSponsorBtn');
    const tabAkunSponsorBtn = document.getElementById('tabAkunSponsorBtn');
    const formProfilSponsor = document.getElementById('formProfilSponsor');
    const formAkunSponsor = document.getElementById('formAkunSponsor');

    tabProfilSponsorBtn.addEventListener('click', () => {
        tabProfilSponsorBtn.className = "flex-1 py-3 text-sm font-bold text-blue-400 border-b-2 border-blue-500 bg-slate-800";
        tabAkunSponsorBtn.className = "flex-1 py-3 text-sm font-bold text-slate-500 border-b-2 border-transparent hover:text-slate-300 transition-colors";
        formProfilSponsor.classList.remove('hidden');
        formAkunSponsor.classList.add('hidden');
    });

    tabAkunSponsorBtn.addEventListener('click', () => {
        tabAkunSponsorBtn.className = "flex-1 py-3 text-sm font-bold text-blue-400 border-b-2 border-blue-500 bg-slate-800";
        tabProfilSponsorBtn.className = "flex-1 py-3 text-sm font-bold text-slate-500 border-b-2 border-transparent hover:text-slate-300 transition-colors";
        formAkunSponsor.classList.remove('hidden');
        formProfilSponsor.classList.add('hidden');
    });

    // Simpan Profil Induk (Dengan Upload Logo Storage)
    document.getElementById('btnSaveProfileInfo').addEventListener('click', async () => {
        const btnSave = document.getElementById('btnSaveProfileInfo');
        const cName = document.getElementById('editCorpName').value.trim();
        const cPic = document.getElementById('editPicName').value.trim();
        const cWa = document.getElementById('editContactWa').value.trim();
        const fileLogo = document.getElementById('inputEditLogo').files[0];
        const statusMsg = document.getElementById('statusProfilMsg');

        if (!cName) {
            statusMsg.innerText = "Nama Perusahaan wajib diisi!";
            statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-red-900/30 text-red-400 block mt-4 border border-red-500/30";
            return;
        }

        btnSave.innerText = "Menyimpan...";
        btnSave.disabled = true;

        try {
            let newLogoUrl = currentSponsor.logo_url;

            // Logika upload storage sama dengan club[span_3](start_span)[span_3](end_span)
            if (fileLogo) {
                const fileExt = fileLogo.name.split('.').pop();
                const fileName = `corp_${currentSponsor.id}_${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabaseClient.storage.from('logo-klub').upload(fileName, fileLogo);
                if (uploadError) throw uploadError;
                
                const { data: urlData } = supabaseClient.storage.from('logo-klub').getPublicUrl(fileName);
                newLogoUrl = urlData.publicUrl;
            }

            const { error: updateError } = await supabaseClient
                .from('sponsors_user')
                .update({
                    company_name: cName,
                    pic_name: cPic,
                    contact_wa: cWa,
                    logo_url: newLogoUrl
                })
                .eq('id', currentSponsor.id);

            if (updateError) throw updateError;

            statusMsg.innerText = "✅ Profil korporasi berhasil diperbarui!";
            statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-emerald-900/30 text-emerald-400 block mt-4 border border-emerald-500/30";
            
            setTimeout(() => {
                fetchSponsorData(); 
                closeModalProfileBtn.click();
                btnSave.innerText = "Simpan Profil Induk";
                btnSave.disabled = false;
            }, 1500);

        } catch (err) {
            statusMsg.innerText = "Gagal menyimpan: " + err.message;
            statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-red-900/30 text-red-400 block mt-4 border border-red-500/30";
            btnSave.innerText = "Simpan Profil Induk";
            btnSave.disabled = false;
        }
    });

    // Simpan Keamanan Akun
    document.getElementById('btnSaveAuthInfo').addEventListener('click', async () => {
        const btnAuth = document.getElementById('btnSaveAuthInfo');
        const newEmail = document.getElementById('editAuthEmail').value.trim();
        const newPass = document.getElementById('editAuthPassword').value.trim();
        const statusMsg = document.getElementById('statusAkunMsg');

        if (!newEmail && !newPass) return;

        btnAuth.innerText = "Memproses...";
        btnAuth.disabled = true;

        try {
            let updates = {};
            if (newEmail) updates.email = newEmail;
            if (newPass) updates.password = newPass;

            const { error } = await supabaseClient.auth.updateUser(updates);
            if (error) throw error;

            statusMsg.innerHTML = "✅ <strong>Berhasil!</strong><br><span class='font-normal text-[10px] text-slate-400'>Cek inbox email lama dan baru Anda untuk konfirmasi (jika ubah email).</span>";
            statusMsg.className = "text-sm text-center rounded-lg p-3 bg-emerald-900/30 text-emerald-400 block mt-4 border border-emerald-500/30";
            document.getElementById('editAuthPassword').value = '';

            setTimeout(() => {
                btnAuth.innerText = "Terapkan Perubahan Akun";
                btnAuth.disabled = false;
            }, 3000);

        } catch (err) {
            statusMsg.innerText = "Gagal mengubah: " + err.message;
            statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-red-900/30 text-red-400 block mt-4 border border-red-500/30";
            btnAuth.innerText = "Terapkan Perubahan Akun";
            btnAuth.disabled = false;
        }
    });

    // ==========================================
    // 5. LOGIKA MANAJEMEN BRAND ANAK (master_sponsors)
    // ==========================================
    const modalAddBrand = document.getElementById('modalAddBrand');
    const closeModalBrandBtn = document.getElementById('closeModalBrandBtn');
    
    document.getElementById('btnOpenAddBrand').addEventListener('click', () => {
        document.getElementById('inputBrandName').value = '';
        document.getElementById('inputBrandUrl').value = '';
        document.getElementById('inputBrandLogo').value = '';
        document.getElementById('brandStatusMsg').classList.add('hidden');
        
        modalAddBrand.classList.remove('hidden');
    });

    closeModalBrandBtn.addEventListener('click', () => {
        modalAddBrand.classList.add('hidden');
    });

    document.getElementById('btnSaveBrand').addEventListener('click', async () => {
        const btnSave = document.getElementById('btnSaveBrand');
        const bName = document.getElementById('inputBrandName').value.trim();
        const bCat = document.getElementById('inputBrandCategory').value;
        const bUrl = document.getElementById('inputBrandUrl').value.trim();
        const fileLogo = document.getElementById('inputBrandLogo').files[0];
        const statusMsg = document.getElementById('brandStatusMsg');

        if (!bName || !bUrl || !fileLogo) {
            statusMsg.innerText = "Nama, Logo, dan URL Redirect wajib diisi!";
            statusMsg.className = "text-xs font-bold text-center rounded-lg p-3 bg-red-900/30 text-red-400 block border border-red-500/30";
            return;
        }

        btnSave.innerText = "Menyimpan Brand...";
        btnSave.disabled = true;

        try {
            // Upload logo brand ke storage
            const fileExt = fileLogo.name.split('.').pop();
            const fileName = `brand_${currentUserId}_${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabaseClient.storage.from('logo-klub').upload(fileName, fileLogo);
            if (uploadError) throw uploadError;
            
            const { data: urlData } = supabaseClient.storage.from('logo-klub').getPublicUrl(fileName);
            const brandLogoUrl = urlData.publicUrl;

            // Suntik ke master_sponsors dengan relasi owner_id
            const { error: insertErr } = await supabaseClient.from('master_sponsors').insert([{
                owner_id: currentUserId,
                sponsor_name: bName,
                link_url: bUrl,
                logo_url: brandLogoUrl,
                kategori: bCat,
                sponsor_type: 'placement' // Default
            }]);

            if (insertErr) throw insertErr;

            statusMsg.innerHTML = "✅ <strong>Brand Berhasil Ditambahkan!</strong>";
            statusMsg.className = "text-xs font-bold text-center rounded-lg p-3 bg-emerald-900/30 text-emerald-400 block border border-emerald-500/30";
            
            setTimeout(() => {
                closeModalBrandBtn.click();
                btnSave.innerText = "Simpan Brand 🚀";
                btnSave.disabled = false;
                fetchBrands(); // Refresh daftar brand di sidebar
            }, 1500);

        } catch (err) {
            statusMsg.innerText = "Gagal menyimpan brand: " + err.message;
            statusMsg.className = "text-xs font-bold text-center rounded-lg p-3 bg-red-900/30 text-red-400 block border border-red-500/30";
            btnSave.innerText = "Simpan Brand 🚀";
            btnSave.disabled = false;
        }
    });
});

async function fetchSponsorData() {
    try {
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError || !session) return window.location.replace('/sponsor-auth.html');

        currentUserId = session.user.id; 

        // Fetch Induk Korporasi
        const { data: sponsorData, error: sponsorError } = await supabaseClient
            .from('sponsors_user')
            .select('*')
            .eq('owner_id', currentUserId)
            .single();

        if (sponsorError || !sponsorData) {
            // Logika Onboarding Induk... (bisa dicopy dari versi sebelumnya jika terhapus, untuk MVP kita skip karena sedang testing dashboard utama)
            return;
        }

        currentSponsor = sponsorData; 
        updateUI();
        await fetchBrands();
        await fetchEvents();

    } catch (error) { console.error(error); }
}

function updateUI() {
    document.getElementById('brandNameUI').innerText = currentSponsor.company_name;
    if (currentSponsor.logo_url) {
        document.getElementById('brandLogoUI').src = currentSponsor.logo_url;
        document.getElementById('editLogoPreview').src = currentSponsor.logo_url;
        document.getElementById('mobileLogoUI').src = currentSponsor.logo_url;
    }
    document.getElementById('mobileBrandNameUI').innerText = currentSponsor.company_name;
    document.getElementById('tokenCountUI').innerText = currentSponsor.tokens;
}

async function fetchBrands() {
    const listSidebar = document.getElementById('brandListSidebar');
    listSidebar.innerHTML = '<p class="text-xs text-slate-500 italic text-center py-4">Memuat data brand...</p>';

    try {
        const { data: brands, error } = await supabaseClient
            .from('master_sponsors')
            .select('*')
            .eq('owner_id', currentUserId)
            .order('id', { ascending: false });

        if (error) throw error;
        ownedBrands = brands;
        
        listSidebar.innerHTML = '';

        if(brands.length === 0) {
            listSidebar.innerHTML = `<p class="text-[10px] text-slate-500 text-center py-2 bg-slate-900/50 rounded-lg border border-slate-700 border-dashed">Belum ada brand yang terdaftar.</p>`;
            return;
        }

        brands.forEach(b => {
            listSidebar.innerHTML += `
                <div class="flex items-center gap-3 bg-slate-900 p-2 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors">
                    <img src="${b.logo_url}" class="w-8 h-8 rounded-lg bg-white object-contain p-0.5">
                    <div class="flex-1 min-w-0">
                        <p class="text-xs font-bold text-white truncate">${b.sponsor_name}</p>
                        <a href="${b.link_url}" target="_blank" class="text-[9px] font-mono text-blue-400 hover:underline truncate block">${b.link_url}</a>
                    </div>
                </div>
            `;
        });

    } catch (err) {
        listSidebar.innerHTML = `<p class="text-xs text-red-500">Gagal memuat brand.</p>`;
    }
}

async function fetchEvents() {
    const grid = document.getElementById('eventGrid');
    try {
        const { data: events, error } = await supabaseClient
            .from('events')
            .select('id, event_name, event_date, kota')
            .order('id', { ascending: false });

        if (error) throw error;
        grid.innerHTML = '';

        events.forEach(ev => {
            grid.innerHTML += `
                <div class="bg-slate-800/40 border border-slate-700 p-5 rounded-2xl flex flex-col justify-between hover:border-slate-500 transition-colors">
                    <div class="mb-4">
                        <span class="inline-block px-2 py-0.5 bg-slate-700 text-slate-300 text-[9px] font-bold uppercase rounded mb-2">${ev.kota || 'Nasional'}</span>
                        <h3 class="font-black text-white text-lg leading-tight mb-1">${ev.event_name}</h3>
                        <p class="text-xs text-slate-400 font-mono">📅 ${ev.event_date}</p>
                    </div>
                    <button class="w-full py-2.5 bg-slate-700 hover:bg-blue-600 text-white font-bold rounded-lg text-xs transition-colors shadow border border-slate-600 hover:border-blue-500">Suntik Logo 🚀</button>
                </div>
            `;
        });
    } catch (err) {
        grid.innerHTML = `<div class="col-span-full p-8 text-center text-red-500">Gagal memuat event.</div>`;
    }
}
