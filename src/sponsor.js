import { supabaseClient } from './supabase.js';

let currentSponsor = null;
let currentUserId = null;
let ownedBrands = [];
let allEvents = [];
let reusedLogoUrl = null;

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. MOBILE MENU TOGGLE
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

    // 2. LOGOUT LOGIC
    const logoutAction = async () => {
        await supabaseClient.auth.signOut();
        window.location.replace('/sponsor-auth.html'); 
    };
    
    document.getElementById('logoutBtnDesk').addEventListener('click', logoutAction);
    document.getElementById('logoutBtnMob').addEventListener('click', logoutAction);

    // 3. FETCH DATA & INITIALIZATION
    await fetchSponsorData();

    // 4. API EMSIFA & PENCARIAN
    const searchEvent = document.getElementById('searchEvent');
    const elProvinsi = document.getElementById('filterProvinsi');
    const elKota = document.getElementById('filterKota');

    async function loadProvinsi() {
        try {
            const response = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
            const provinces = await response.json();
            provinces.forEach(prov => {
                elProvinsi.innerHTML += `<option value="${prov.name}" data-id="${prov.id}">${prov.name}</option>`;
            });
        } catch (error) { console.error("Gagal load API Emsifa"); }
    }
    
    loadProvinsi();

    searchEvent.addEventListener('input', renderEvents); 

    elProvinsi.addEventListener('change', async function() {
        const selectedOption = this.options[this.selectedIndex];
        const provId = selectedOption.getAttribute('data-id');
        
        if (!provId) {
            elKota.innerHTML = '<option value="">Semua Kota/Kab</option>';
            elKota.disabled = true;
            renderEvents(); 
            return;
        }

        elKota.innerHTML = '<option value="">Memuat Kota...</option>';
        elKota.disabled = true;

        try {
            const response = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provId}.json`);
            const cities = await response.json();
            
            elKota.innerHTML = '<option value="">Semua Kota/Kab</option>';
            cities.forEach(city => {
                elKota.innerHTML += `<option value="${city.name}">${city.name}</option>`;
            });
            elKota.disabled = false;
            renderEvents(); 
        } catch (error) {
            console.error("Gagal load API Kota");
        }
    });

    elKota.addEventListener('change', renderEvents);

    // 5. PENGATURAN PROFIL
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
    }

    if (btnEditProfilSponsor) btnEditProfilSponsor.addEventListener('click', openProfileModal);
    if (btnEditProfilMobile) btnEditProfilMobile.addEventListener('click', openProfileModal);
    if (closeModalProfileBtn) closeModalProfileBtn.addEventListener('click', () => modalEditProfile.classList.add('hidden'));

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

    document.getElementById('btnSaveProfileInfo').addEventListener('click', async () => {
        const btnSave = document.getElementById('btnSaveProfileInfo');
        const cName = document.getElementById('editCorpName').value.trim();
        const cPic = document.getElementById('editPicName').value.trim();
        const cWa = document.getElementById('editContactWa').value.trim();
        const fileLogo = document.getElementById('inputEditLogo').files[0];
        const statusMsg = document.getElementById('statusProfilMsg');

        if (!cName) return alert("Nama Perusahaan wajib diisi!");

        btnSave.innerText = "Menyimpan..."; btnSave.disabled = true;

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
                .update({ company_name: cName, pic_name: cPic, contact_wa: cWa, logo_url: newLogoUrl })
                .eq('id', currentSponsor.id);

            if (updateError) throw updateError;
            
            statusMsg.innerText = "✅ Profil diperbarui!";
            statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-emerald-900/30 text-emerald-400 block mt-4 border border-emerald-500/30";
            
            setTimeout(() => { fetchSponsorData(); closeModalProfileBtn.click(); btnSave.innerText = "Simpan Profil Induk"; btnSave.disabled = false; }, 1500);
        } catch (err) { alert(err.message); btnSave.innerText = "Simpan Profil Induk"; btnSave.disabled = false; }
    });

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

            setTimeout(() => { btnAuth.innerText = "Terapkan Perubahan Akun"; btnAuth.disabled = false; }, 3000);
        } catch (err) {
            statusMsg.innerText = "Gagal mengubah: " + err.message;
            statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-red-900/30 text-red-400 block mt-4 border border-red-500/30";
            btnAuth.innerText = "Terapkan Perubahan Akun"; btnAuth.disabled = false;
        }
    });

    // 6. MANAJEMEN BRAND KOMPREHENSIF
    const modalAddBrand = document.getElementById('modalAddBrand');
    const closeModalBrandBtn = document.getElementById('closeModalBrandBtn');
    
    document.getElementById('btnOpenAddBrand').addEventListener('click', () => {
        document.getElementById('modalBrandTitle').innerHTML = '<span>➕</span> TAMBAH BRAND / PRODUK';
        document.getElementById('editBrandId').value = '';
        
        ['inputBrandName', 'inputBrandUrl', 'inputBrandCategory', 'inputBrandLogo'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.value = '';
        });
        
        document.getElementById('inputBrandType').value = 'corporate';
        document.getElementById('inputTargetGender').value = 'ALL';
        document.getElementById('inputTargetUmur').value = 'ALL';
        
        document.getElementById('previewKatalogLogo').src = '';
        document.getElementById('previewKatalogLogo').classList.add('hidden');
        document.getElementById('previewPlaceholder').classList.remove('hidden');
        document.getElementById('brandStatusMsg').classList.add('hidden');
        
        reusedLogoUrl = null;
        modalAddBrand.classList.remove('hidden');
    });

    closeModalBrandBtn.addEventListener('click', () => modalAddBrand.classList.add('hidden'));

    document.getElementById('inputBrandLogo').addEventListener('change', function(e) {
        if (e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('previewKatalogLogo').src = event.target.result;
                document.getElementById('previewKatalogLogo').classList.remove('hidden');
                document.getElementById('previewPlaceholder').classList.add('hidden');
                reusedLogoUrl = null;
            }
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    document.getElementById('btnSaveBrand').addEventListener('click', async () => {
        const btnSave = document.getElementById('btnSaveBrand');
        const bId = document.getElementById('editBrandId').value;
        const bName = document.getElementById('inputBrandName').value.trim();
        const statusMsg = document.getElementById('brandStatusMsg');

        if (!bName) {
            statusMsg.innerText = "Nama Brand wajib diisi!";
            statusMsg.className = "text-xs font-bold text-center rounded-lg p-3 bg-red-900/30 text-red-400 block border border-red-500/30";
            return;
        }

        btnSave.innerText = "⏳ MENYIMPAN...";
        btnSave.disabled = true;

        try {
            let finalLogoUrl = reusedLogoUrl || '';
            const fileLogo = document.getElementById('inputBrandLogo').files[0];
            
            if (fileLogo) {
                const ext = fileLogo.name.split('.').pop();
                const fileName = `brand_${currentUserId}_${Date.now()}.${ext}`;
                const { error: upErr } = await supabaseClient.storage.from('sponsor-ads').upload(fileName, fileLogo);
                if (upErr) throw upErr;
                const { data: urlData } = supabaseClient.storage.from('sponsor-ads').getPublicUrl(fileName);
                finalLogoUrl = urlData.publicUrl;
            }

            if (!bId && !finalLogoUrl) {
                finalLogoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(bName)}&background=0f172a&color=3b82f6`;
            }

            const payloadData = { 
                sponsor_name: bName, 
                link_url: document.getElementById('inputBrandUrl').value.trim(), 
                sponsor_type: document.getElementById('inputBrandType').value,
                kategori: document.getElementById('inputBrandCategory').value.trim(),
                target_gender: document.getElementById('inputTargetGender').value,
                target_umur: document.getElementById('inputTargetUmur').value,
                logo_url: finalLogoUrl
            };

            if (bId) {
                await supabaseClient.from('master_sponsors').update(payloadData).eq('id', bId);
            } else {
                payloadData.owner_id = currentUserId;
                await supabaseClient.from('master_sponsors').insert([payloadData]);
            }

            statusMsg.innerHTML = "✅ <strong>Berhasil Disimpan!</strong>";
            statusMsg.className = "text-xs font-bold text-center rounded-lg p-3 bg-emerald-900/30 text-emerald-400 block border border-emerald-500/30";
            
            setTimeout(() => {
                closeModalBrandBtn.click();
                btnSave.innerText = "💾 SIMPAN & AKTIFKAN BRAND";
                btnSave.disabled = false;
                fetchBrands(); 
            }, 1500);

        } catch (err) {
            statusMsg.innerText = "Gagal: " + err.message;
            statusMsg.className = "text-xs font-bold text-center rounded-lg p-3 bg-red-900/30 text-red-400 block border border-red-500/30";
            btnSave.innerText = "💾 SIMPAN & AKTIFKAN BRAND";
            btnSave.disabled = false;
        }
    });

});

window.openEditBrandModal = function(encodedData) {
    const brand = JSON.parse(decodeURIComponent(encodedData));
    
    document.getElementById('modalBrandTitle').innerHTML = '<span>✏️</span> DETAIL BRAND / PRODUK';
    document.getElementById('editBrandId').value = brand.id;
    document.getElementById('inputBrandName').value = brand.sponsor_name || '';
    document.getElementById('inputBrandUrl').value = brand.link_url || '';
    document.getElementById('inputBrandType').value = brand.sponsor_type || 'corporate';
    document.getElementById('inputBrandCategory').value = brand.kategori || '';
    document.getElementById('inputTargetGender').value = brand.target_gender || 'ALL';
    document.getElementById('inputTargetUmur').value = brand.target_umur || 'ALL';
    
    document.getElementById('inputBrandLogo').value = '';
    
    reusedLogoUrl = brand.logo_url || null;
    const previewLogo = document.getElementById('previewKatalogLogo');
    const placeholder = document.getElementById('previewPlaceholder');

    if (reusedLogoUrl) {
        previewLogo.src = reusedLogoUrl;
        previewLogo.classList.remove('hidden');
        placeholder.classList.add('hidden');
    } else {
        previewLogo.classList.add('hidden');
        placeholder.classList.remove('hidden');
    }

    document.getElementById('brandStatusMsg').classList.add('hidden');
    document.getElementById('modalAddBrand').classList.remove('hidden');
};

async function fetchSponsorData() {
    try {
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError || !session) return window.location.replace('/sponsor-auth.html');

        currentUserId = session.user.id; 
        const userEmail = session.user.email;

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
                const onboardMsg = document.getElementById('onboardMsg');

                if (!bCompany || !bPic || !bEmail || !bWa) {
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
                            industry_category: 'Corporate', 
                            logo_url: defaultLogo,
                            tokens: 0 
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
                    btnSaveOnboard.innerText = "Simpan & Masuk Dashboard 🚀";
                    btnSaveOnboard.disabled = false;
                }
            };
            return; 
        }

        currentSponsor = sponsorData; 
        updateUI();
        await fetchBrands();
        await fetchAllEvents(); 
        
        // 🚀 PANGGIL FUNGSI ANALYTICS DI SINI
        await fetchAnalytics();

    } catch (error) { console.error("Error init:", error); }
}

function updateUI() {
    document.getElementById('welcomeName').innerText = currentSponsor.company_name;
    document.getElementById('brandNameUI').innerText = currentSponsor.company_name;
    document.getElementById('mobileBrandNameUI').innerText = currentSponsor.company_name;

    if (currentSponsor.logo_url) {
        document.getElementById('brandLogoUI').src = currentSponsor.logo_url;
        document.getElementById('editLogoPreview').src = currentSponsor.logo_url;
        document.getElementById('mobileLogoUI').src = currentSponsor.logo_url;
    }
}

async function fetchBrands() {
    const grid = document.getElementById('brandGrid');
    grid.innerHTML = '<p class="text-sm text-slate-500 italic col-span-full text-center">Memuat daftar brand...</p>';

    try {
        const { data: brands, error } = await supabaseClient
            .from('master_sponsors')
            .select('*')
            .eq('owner_id', currentUserId)
            .order('id', { ascending: false });

        if (error) throw error;
        ownedBrands = brands;
        grid.innerHTML = '';

        if(brands.length === 0) {
            grid.innerHTML = `<p class="text-sm text-slate-500 text-center col-span-full py-6 bg-slate-900/50 rounded-2xl border border-slate-700 border-dashed">Belum ada brand yang terdaftar. Klik 'Tambah Brand' untuk memulai.</p>`;
            return;
        }

        brands.forEach(b => {
            const encoded = encodeURIComponent(JSON.stringify(b));
            grid.innerHTML += `
                <div class="bg-slate-900 p-5 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-colors shadow-sm relative group flex items-center gap-4">
                    <img src="${b.logo_url}" class="w-14 h-14 rounded-xl bg-white object-contain p-1.5 border border-slate-600">
                    <div class="flex-1 min-w-0">
                        <h3 class="text-sm font-black text-white truncate">${b.sponsor_name}</h3>
                        <p class="text-[10px] text-blue-400 font-bold mb-1">${b.kategori || 'General'}</p>
                        <a href="${b.link_url}" target="_blank" class="text-[10px] font-mono text-blue-400 hover:underline truncate block w-[95%]">${b.link_url || '-'}</a>
                    </div>
                    <button onclick="window.openEditBrandModal('${encoded}')" class="absolute top-4 right-4 text-slate-400 hover:text-blue-400 bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg transition-colors border border-slate-600" title="Edit Brand">
                        ✏️
                    </button>
                </div>
            `;
        });

    } catch (err) {
        grid.innerHTML = `<p class="text-sm text-red-500 col-span-full">Gagal memuat brand.</p>`;
    }
}

// 🚀 FUNGSI TARIK DATA ANALYTICS (BARU)
async function fetchAnalytics() {
    try {
        // Ambil data analytics khusus untuk brand yang dimiliki oleh sponsor ini
        const { data, error } = await supabaseClient
            .from('sponsor_analytics')
            .select(`
                impressions_count,
                clicks_count,
                event_id,
                master_sponsors!inner(owner_id)
            `)
            .eq('master_sponsors.owner_id', currentUserId);

        if (error) throw error;

        let totalImpressions = 0;
        let totalClicks = 0;
        let uniqueEventIds = new Set();

        if (data && data.length > 0) {
            data.forEach(row => {
                totalImpressions += (row.impressions_count || 0);
                totalClicks += (row.clicks_count || 0);
                uniqueEventIds.add(row.event_id);
            });
        }

        // Kalkulasi CTR
        let ctr = 0;
        if (totalImpressions > 0) {
            ctr = (totalClicks / totalImpressions) * 100;
        }

        // Render ke UI
        document.getElementById('statImpressions').innerText = totalImpressions.toLocaleString();
        document.getElementById('statClicks').innerText = totalClicks.toLocaleString();
        document.getElementById('statCTR').innerText = ctr.toFixed(2) + '%';
        document.getElementById('statEvents').innerText = uniqueEventIds.size.toLocaleString();

    } catch (err) {
        console.error("Gagal menarik data analytics:", err);
    }
}

async function fetchAllEvents() {
    try {
        const { data: events, error } = await supabaseClient
            .from('events')
            .select('id, event_name, event_date, kota, provinsi')
            .order('id', { ascending: false });

        if (error) throw error;
        allEvents = events;
        renderEvents(); 
    } catch (err) {
        document.getElementById('eventGrid').innerHTML = `<div class="col-span-full p-8 text-center text-red-500">Gagal memuat katalog event.</div>`;
    }
}

function renderEvents() {
    const grid = document.getElementById('eventGrid');
    const searchQuery = document.getElementById('searchEvent').value.toLowerCase();
    const provFilter = document.getElementById('filterProvinsi').value;
    const kotaFilter = document.getElementById('filterKota').value;

    let filtered = allEvents;

    if (searchQuery) {
        filtered = filtered.filter(e => 
            e.event_name.toLowerCase().includes(searchQuery) || 
            (e.kota && e.kota.toLowerCase().includes(searchQuery))
        );
    }
    if (provFilter) filtered = filtered.filter(e => e.provinsi === provFilter);
    if (kotaFilter) filtered = filtered.filter(e => e.kota === kotaFilter);

    grid.innerHTML = '';

    if(filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full p-8 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-700 border-dashed">Belum ada event tersedia di pencarian ini.</div>`;
        return;
    }

    filtered.forEach(ev => {
        const waText = encodeURIComponent(`Halo Tim F1 Swimming, saya dari ${currentSponsor.company_name}.\n\nKami tertarik untuk mengajukan penempatan Brand kami di event *${ev.event_name}* (${ev.kota || 'Nasional'}).\nMohon info lebih lanjut terkait rate card dan prosedur injeksi.`);
        const waUrl = `https://wa.me/6289691219977?text=${waText}`;

        grid.innerHTML += `
            <div class="bg-slate-900 border border-slate-700 p-6 rounded-3xl flex flex-col justify-between hover:border-blue-500/50 transition-colors group relative overflow-hidden shadow-lg">
                <div class="absolute top-0 right-0 bg-blue-900/40 text-blue-400 text-[9px] font-black px-3 py-1.5 rounded-bl-xl tracking-widest uppercase border-b border-l border-blue-500/30">
                    Target Event
                </div>
                <div class="mb-5 relative z-10 mt-2">
                    <span class="inline-block px-2 py-1 bg-slate-800 text-slate-300 text-[9px] font-bold uppercase rounded-md mb-3 border border-slate-700">📍 ${ev.kota || 'Nasional'} - ${ev.provinsi || 'Nasional'}</span>
                    <h3 class="font-black text-white text-lg leading-snug mb-1 group-hover:text-blue-300 transition-colors">${ev.event_name}</h3>
                    <p class="text-xs text-slate-400 font-mono">📅 ${ev.event_date}</p>
                </div>
                <a href="${waUrl}" target="_blank" class="w-full text-center py-3 bg-slate-800 hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition-colors shadow border border-slate-600 hover:border-blue-500 flex items-center justify-center gap-2 relative z-10">
                    Ajukan Penempatan 💬
                </a>
            </div>
        `;
    });
}
