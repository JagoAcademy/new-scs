import { supabaseClient } from './supabase.js';

let currentSponsor = null;
let currentUserId = null;
let ownedBrands = [];
let unclaimedBrandsCatalog = [];

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

    // Simpan Profil Induk (Upload Logo Storage 'logo-klub')
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

    const contactAdminTopup = () => {
        const text = `Halo tim F1 Swimming, saya dari ${currentSponsor?.company_name}. Saya ingin Top-Up token Injeksi Event.`;
        window.open(`https://wa.me/6289691219977?text=${encodeURIComponent(text)}`, '_blank');
    };

    document.getElementById('btnTopupDesk').addEventListener('click', contactAdminTopup);
    document.getElementById('btnTopupMobile').addEventListener('click', contactAdminTopup);

    // ==========================================
    // 5. LOGIKA MANAJEMEN BRAND ANAK (Pilih dari master_sponsors)
    // ==========================================
    const modalAddBrand = document.getElementById('modalAddBrand');
    const closeModalBrandBtn = document.getElementById('closeModalBrandBtn');
    const selectBank = document.getElementById('selectBankSponsor');
    const previewLogoKatalog = document.getElementById('previewKatalogLogo');
    const placeholderLogo = document.getElementById('previewPlaceholder');
    
    document.getElementById('btnOpenAddBrand').addEventListener('click', () => {
        document.getElementById('inputBrandUrl').value = '';
        document.getElementById('brandStatusMsg').classList.add('hidden');
        previewLogoKatalog.src = '';
        previewLogoKatalog.classList.add('hidden');
        placeholderLogo.classList.remove('hidden');
        
        loadUnclaimedBrands();
        modalAddBrand.classList.remove('hidden');
    });

    closeModalBrandBtn.addEventListener('click', () => {
        modalAddBrand.classList.add('hidden');
    });

    // Event saat dropdown brand berubah, tampilkan logo
    selectBank.addEventListener('change', (e) => {
        const id = e.target.value;
        if (!id) {
            previewLogoKatalog.src = '';
            previewLogoKatalog.classList.add('hidden');
            placeholderLogo.classList.remove('hidden');
            return;
        }
        const brand = unclaimedBrandsCatalog.find(b => b.id == id);
        if (brand && brand.logo_url) {
            previewLogoKatalog.src = brand.logo_url;
            previewLogoKatalog.classList.remove('hidden');
            placeholderLogo.classList.add('hidden');
        } else {
            previewLogoKatalog.src = '';
            previewLogoKatalog.classList.add('hidden');
            placeholderLogo.classList.remove('hidden');
        }
    });

    document.getElementById('btnSaveBrand').addEventListener('click', async () => {
        const btnSave = document.getElementById('btnSaveBrand');
        const selectedId = document.getElementById('selectBankSponsor').value;
        const bUrl = document.getElementById('inputBrandUrl').value.trim();
        const statusMsg = document.getElementById('brandStatusMsg');

        if (!selectedId || !bUrl) {
            statusMsg.innerText = "Pilih Brand dan isi URL Promo Anda!";
            statusMsg.className = "text-xs font-bold text-center rounded-lg p-3 bg-red-900/30 text-red-400 block border border-red-500/30";
            return;
        }

        btnSave.innerText = "Mengklaim Brand...";
        btnSave.disabled = true;

        try {
            // UPDATE: Pasang owner_id ke brand yang dipilih
            const { error: updateErr } = await supabaseClient
                .from('master_sponsors')
                .update({ 
                    owner_id: currentUserId,
                    link_url: bUrl 
                })
                .eq('id', selectedId);

            if (updateErr) throw updateErr;

            statusMsg.innerHTML = "✅ <strong>Brand Berhasil Diklaim!</strong>";
            statusMsg.className = "text-xs font-bold text-center rounded-lg p-3 bg-emerald-900/30 text-emerald-400 block border border-emerald-500/30";
            
            setTimeout(() => {
                closeModalBrandBtn.click();
                btnSave.innerText = "Klaim Brand 🚀";
                btnSave.disabled = false;
                fetchBrands(); // Refresh daftar brand milik korporasi
            }, 1500);

        } catch (err) {
            statusMsg.innerText = "Gagal mengklaim brand: " + err.message;
            statusMsg.className = "text-xs font-bold text-center rounded-lg p-3 bg-red-900/30 text-red-400 block border border-red-500/30";
            btnSave.innerText = "Klaim Brand 🚀";
            btnSave.disabled = false;
        }
    });
});

// ==========================================
// FUNGSI UTAMA FETCH & RENDER
// ==========================================
async function fetchSponsorData() {
    try {
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError || !session) return window.location.replace('/sponsor-auth.html');

        currentUserId = session.user.id; 
        const userEmail = session.user.email;

        // Fetch Profil Korporasi
        const { data: sponsorData, error: sponsorError } = await supabaseClient
            .from('sponsors_user')
            .select('*')
            .eq('owner_id', currentUserId)
            .single();

        if (sponsorError || !sponsorData) {
            const modalOnboard = document.getElementById('modalOnboarding');
            modalOnboard.classList.remove('hidden'); 
            
            if(userEmail) document.getElementById('onbEmail').value = userEmail;
            
            const btnSaveOnboard = document.getElementById('btnSaveOnboarding');
            btnSaveOnboard.onclick = async () => {
                const bCompany = document.getElementById('onbCompanyName').value.trim();
                const bPic = document.getElementById('onbPicName').value.trim();
                const bEmail = document.getElementById('onbEmail').value.trim();
                const bWa = document.getElementById('onbWa').value.trim();
                const bCat = document.getElementById('onbCategory').value;
                const onboardMsg = document.getElementById('onboardMsg');

                if (!bCompany || !bPic || !bEmail || !bWa || !bCat) {
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
                            owner_id: currentUserId,
                            company_name: bCompany,
                            pic_name: bPic,
                            company_email: bEmail,
                            contact_wa: bWa,
                            industry_category: bCat,
                            logo_url: defaultLogo,
                            tokens: 1 // FREE TOKEN!
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

        currentSponsor = sponsorData; 
        updateUI();
        await fetchBrands();
        await fetchEvents();

    } catch (error) { console.error("Error init:", error); }
}

function updateUI() {
    document.getElementById('brandNameUI').innerText = currentSponsor.company_name;
    document.getElementById('mobileBrandNameUI').innerText = currentSponsor.company_name;
    
    // Fallback UI Category
    const txtCat = currentSponsor.industry_category || 'General';
    document.getElementById('brandCategoryUI').innerText = txtCat;
    document.getElementById('mobileBrandCategoryUI').innerText = txtCat;

    if (currentSponsor.logo_url) {
        document.getElementById('brandLogoUI').src = currentSponsor.logo_url;
        document.getElementById('editLogoPreview').src = currentSponsor.logo_url;
        document.getElementById('mobileLogoUI').src = currentSponsor.logo_url;
    }
    
    document.getElementById('tokenCountUI').innerText = currentSponsor.tokens;
}

// Menarik katalog brand yang BISA diklaim (owner_id is null)
async function loadUnclaimedBrands() {
    const select = document.getElementById('selectBankSponsor');
    select.innerHTML = '<option value="">Memuat katalog pusat...</option>';
    
    try {
        const { data, error } = await supabaseClient
            .from('master_sponsors')
            .select('id, sponsor_name, kategori, logo_url')
            .is('owner_id', null)
            .order('sponsor_name', { ascending: true });

        if (error) throw error;
        unclaimedBrandsCatalog = data;
        
        select.innerHTML = '<option value="">-- Pilih Brand Anda --</option>';
        data.forEach(b => {
            select.innerHTML += `<option value="${b.id}">${b.sponsor_name} (${b.kategori || 'General'})</option>`;
        });
    } catch(err) {
        select.innerHTML = '<option value="">Gagal memuat katalog</option>';
    }
}

// Menarik brand anak yang SUDAH diklaim oleh korporasi ini
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
            listSidebar.innerHTML = `<p class="text-[10px] text-slate-500 text-center py-2 bg-slate-900/50 rounded-lg border border-slate-700 border-dashed">Belum ada brand yang diklaim.</p>`;
            return;
        }

        brands.forEach(b => {
            listSidebar.innerHTML += `
                <div class="flex items-center gap-3 bg-slate-900 p-2.5 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors shadow-sm relative group">
                    <img src="${b.logo_url}" class="w-10 h-10 rounded-lg bg-white object-contain p-1 border border-slate-600">
                    <div class="flex-1 min-w-0">
                        <p class="text-xs font-black text-white truncate">${b.sponsor_name}</p>
                        <a href="${b.link_url}" target="_blank" class="text-[9px] font-mono text-blue-400 hover:underline truncate block w-[90%]">${b.link_url}</a>
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
                    <button class="w-full py-2.5 bg-slate-700 hover:bg-blue-600 text-white font-bold rounded-lg text-xs transition-colors shadow border border-slate-600 hover:border-blue-500">Pilih Event ➔</button>
                </div>
            `;
        });
    } catch (err) {
        grid.innerHTML = `<div class="col-span-full p-8 text-center text-red-500">Gagal memuat event.</div>`;
    }
}
