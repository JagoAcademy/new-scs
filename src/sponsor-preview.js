import { supabaseClient } from './supabase.js';

let reusedLogoUrl = null;
let allSponsors = [];
let corporateRowCount = 0; 

// --- DAFTAR "DEWA" YANG BOLEH MASUK ---
const AUTHORIZED_ADMINS = ['FAJAR', 'INDRA', 'AY'];

document.addEventListener('DOMContentLoaded', async () => {
    // --- VIP GATEKEEPER ---
    const currentSession = sessionStorage.getItem('pitching_name');

    // Jika belum login atau yang login BUKAN Fajar, Indra, AY
    if (!currentSession || !AUTHORIZED_ADMINS.includes(currentSession.toUpperCase())) {
        const isInvestorAdmin = confirm("Masuk investor atau admin? \n(Klik OK untuk Y, Cancel untuk N)");
        
        if (!isInvestorAdmin) {
            return window.location.replace('/openinvest.html');
        }
        
        const namaInput = prompt("Silakan tulis nama Anda:");
        
        if (!namaInput || namaInput.trim() === '') {
            return window.location.replace('/openinvest.html');
        }
        
        const upperName = namaInput.trim().toUpperCase();

        if (AUTHORIZED_ADMINS.includes(upperName)) {
            // Berhasil Validasi sebagai Dewa
            sessionStorage.setItem('pitching_name', upperName);
            sessionStorage.setItem('pitching_role', 'Super Admin');
            alert(`Selamat datang Super Admin ${upperName}! Akses Katalog Sponsor Terbuka.`);
        } else {
            // Selain Dewa, langsung tendang keluar!
            alert("Akses Ditolak! Hubungi Vanessa 89691219977 untuk mendapat key akses halaman ini.");
            return window.location.replace('/openinvest.html');
        }
    }
    // ----------------------------------------
    
    // Jika lolos gatekeeper, jalankan fungsi utama
    loadGallery();
    setupModalListeners();
    setupFilters();
    setupCorporateFlow();
});

async function loadGallery() {
    const grid = document.getElementById('sponsorGrid');
    const loading = document.getElementById('loadingState');

    try {
        const { data, error } = await supabaseClient.from('master_sponsors').select('*').order('id', { ascending: false });
        if (error) throw error;

        allSponsors = data || [];
        loading.classList.add('hidden');
        grid.classList.remove('hidden');

        renderCards(allSponsors);
    } catch (err) {
        loading.innerHTML = `<span class="text-4xl block mb-4">❌</span><p class="text-red-500 font-bold">Error: ${err.message}</p>`;
    }
}

function renderCards(data) {
    const grid = document.getElementById('sponsorGrid');
    if (!data || data.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-10 bg-[#1e293b] rounded-xl border border-slate-700"><p class="text-slate-500 font-bold">Katalog kosong.</p></div>`;
        return;
    }

    let htmlContent = '';
    data.forEach(sponsor => {
        let badge = '';
        // LOGIKA 4 KASTA ADMIN
        if (sponsor.sponsor_type === 'scs_partner') {
            badge = `<span class="bg-emerald-900/40 text-emerald-400 text-[9px] px-2 py-1 rounded border border-emerald-500/30 uppercase font-black tracking-wider flex items-center gap-1 w-max"><span>🟢</span> OFFICIAL</span>`;
        } else if (sponsor.sponsor_type === 'corporate') {
            badge = `<span class="bg-blue-900/40 text-blue-400 text-[9px] px-2 py-1 rounded border border-blue-500/30 uppercase font-black tracking-wider flex items-center gap-1 w-max"><span>🏢</span> CORPORATE</span>`;
        } else if (sponsor.sponsor_type === 'high_potential') {
            badge = `<span class="bg-amber-900/40 text-amber-400 text-[9px] px-2 py-1 rounded border border-amber-500/30 uppercase font-black tracking-wider flex items-center gap-1 w-max"><span>💎</span> HIGH POTENTIAL</span>`;
        } else {
            badge = `<span class="bg-slate-700/50 text-slate-300 text-[9px] px-2 py-1 rounded border border-slate-600 uppercase font-black tracking-wider flex items-center gap-1 w-max"><span>⚪</span> REGULAR</span>`;
        }

        const sponsorDataString = encodeURIComponent(JSON.stringify(sponsor));

        htmlContent += `
            <div onclick="openEditModal('${sponsorDataString}')" class="bg-[#1e293b] rounded-2xl p-4 border border-slate-700 shadow-lg hover:border-amber-500 transition-all cursor-pointer flex flex-col justify-between h-full group">
                <div>
                    <div class="h-20 md:h-24 w-full bg-white rounded-xl mb-4 flex items-center justify-center p-3 border border-slate-600 group-hover:scale-[1.02] transition-transform">
                        <img src="${sponsor.logo_url || '/images/logo.png'}" class="max-h-full max-w-full object-contain">
                    </div>
                    <h3 class="font-black text-white text-sm truncate leading-tight">${sponsor.sponsor_name}</h3>
                    <p class="text-[10px] text-slate-400 mt-1 mb-3 truncate">${sponsor.kategori || 'General'}</p>
                </div>
                <div class="border-t border-slate-700/50 pt-3 flex flex-col gap-2">
                    ${badge}
                    ${(sponsor.sponsor_type === 'corporate' && sponsor.link_url) ? `<p class="text-[9px] text-blue-400 truncate bg-blue-900/20 p-1 rounded border border-blue-800/50">🔗 ${sponsor.link_url}</p>` : ''}
                </div>
            </div>
        `;
    });
    grid.innerHTML = htmlContent;
}

function setupFilters() {
    const btns = document.querySelectorAll('.filter-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            btns.forEach(b => {
                b.classList.remove('bg-amber-500', 'text-slate-900');
                b.classList.add('bg-slate-800', 'text-slate-400');
            });
            e.target.classList.remove('bg-slate-800', 'text-slate-400');
            e.target.classList.add('bg-amber-500', 'text-slate-900');

            const filter = e.target.getAttribute('data-filter');
            if (filter === 'all') renderCards(allSponsors);
            else renderCards(allSponsors.filter(s => s.sponsor_type === filter));
        });
    });
}

window.openEditModal = function(encodedData) {
    const sponsor = JSON.parse(decodeURIComponent(encodedData));
    document.getElementById('editSponsorId').value = sponsor.id;
    document.getElementById('editSponsorName').value = sponsor.sponsor_name || '';
    document.getElementById('editSponsorUrl').value = sponsor.link_url || '';
    document.getElementById('editSponsorType').value = sponsor.sponsor_type || 'unofficial';
    document.getElementById('editSponsorKategori').value = sponsor.kategori || '';
    document.getElementById('editSponsorBenefit').value = sponsor.jenis_bantuan || '';
    document.getElementById('editSponsorSyarat').value = sponsor.syarat || '';
    
    // TARIK DATA DYNAMIC TARGETING
    document.getElementById('editTargetGender').value = sponsor.target_gender || 'ALL';
    document.getElementById('editTargetUmur').value = sponsor.target_umur || 'ALL';
    
    reusedLogoUrl = sponsor.logo_url || null;
    document.getElementById('editUploadLogo').value = '';
    
    const previewLogo = document.getElementById('editPreviewLogo');
    if (reusedLogoUrl) {
        previewLogo.src = reusedLogoUrl;
        previewLogo.classList.remove('hidden');
    } else {
        previewLogo.classList.add('hidden');
    }

    document.getElementById('modalTitleText').innerHTML = '<span>✏️</span> DETAIL SPONSOR';
    document.getElementById('btnDeleteSponsor').classList.remove('hidden');
    document.getElementById('editStatusMsg').classList.add('hidden');
    document.getElementById('modalEditSponsor').classList.remove('hidden');
}

function setupModalListeners() {
    document.getElementById('btnAddNewSponsor').addEventListener('click', () => {
        document.getElementById('editSponsorId').value = '';
        ['editSponsorName', 'editSponsorUrl', 'editSponsorKategori', 'editSponsorBenefit', 'editSponsorSyarat', 'editUploadLogo'].forEach(id => document.getElementById(id).value = '');
        document.getElementById('editSponsorType').value = 'unofficial'; // Default Regular
        
        // RESET TARGETING
        document.getElementById('editTargetGender').value = 'ALL';
        document.getElementById('editTargetUmur').value = 'ALL';

        reusedLogoUrl = null;
        document.getElementById('editPreviewLogo').classList.add('hidden');
        document.getElementById('modalTitleText').innerHTML = '<span>➕</span> TAMBAH SPONSOR';
        document.getElementById('btnDeleteSponsor').classList.add('hidden');
        document.getElementById('editStatusMsg').classList.add('hidden');
        document.getElementById('modalEditSponsor').classList.remove('hidden');
    });

    document.getElementById('btnCloseModal').addEventListener('click', () => document.getElementById('modalEditSponsor').classList.add('hidden'));

    document.getElementById('editUploadLogo').addEventListener('change', function(e) {
        if (e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('editPreviewLogo').src = event.target.result;
                document.getElementById('editPreviewLogo').classList.remove('hidden');
                reusedLogoUrl = null;
            }
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    document.getElementById('btnSaveSponsor').addEventListener('click', async () => {
        const id = document.getElementById('editSponsorId').value;
        const name = document.getElementById('editSponsorName').value.trim();
        if (!name) return alert("Nama Sponsor wajib diisi!");

        const btn = document.getElementById('btnSaveSponsor');
        btn.innerText = "⏳ MENYIMPAN..."; btn.disabled = true;

        try {
            let finalLogoUrl = reusedLogoUrl || '';
            const fileLogo = document.getElementById('editUploadLogo').files[0];
            
            if (fileLogo) {
                const ext = fileLogo.name.split('.').pop();
                const fileName = `brand_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
                const { error: upErr } = await supabaseClient.storage.from('sponsor-ads').upload(fileName, fileLogo);
                if (upErr) throw upErr;
                const { data: urlData } = supabaseClient.storage.from('sponsor-ads').getPublicUrl(fileName);
                finalLogoUrl = urlData.publicUrl;
            }

            // PAYLOAD BARU PLUS TARGETING
            const payloadData = { 
                sponsor_name: name, 
                link_url: document.getElementById('editSponsorUrl').value.trim(), 
                sponsor_type: document.getElementById('editSponsorType').value,
                kategori: document.getElementById('editSponsorKategori').value.trim(),
                jenis_bantuan: document.getElementById('editSponsorBenefit').value.trim(),
                syarat: document.getElementById('editSponsorSyarat').value.trim(),
                target_gender: document.getElementById('editTargetGender').value,
                target_umur: document.getElementById('editTargetUmur').value,
                logo_url: finalLogoUrl
            };

            if (id) {
                await supabaseClient.from('master_sponsors').update(payloadData).eq('id', id);
            } else {
                await supabaseClient.from('master_sponsors').insert([payloadData]);
            }

            document.getElementById('modalEditSponsor').classList.add('hidden');
            loadGallery();
        } catch (err) { alert(err.message); } finally { btn.innerText = "💾 SIMPAN SPONSOR"; btn.disabled = false; }
    });

    document.getElementById('btnDeleteSponsor').addEventListener('click', async () => {
        const id = document.getElementById('editSponsorId').value;
        if(!confirm("Yakin hapus permanen?")) return;
        try {
            await supabaseClient.from('master_sponsors').delete().eq('id', id);
            document.getElementById('modalEditSponsor').classList.add('hidden');
            loadGallery();
        } catch (err) { alert(err.message); }
    });
}

function setupCorporateFlow() {
    const btnOpen = document.getElementById('btnOpenCorporateModal');
    const btnClose = document.getElementById('btnCloseCorporate');
    const btnAddRow = document.getElementById('btnAddCorporateRow');
    const btnSave = document.getElementById('btnSaveCorporate');
    const modal = document.getElementById('modalCorporate');
    const listContainer = document.getElementById('corporateBrandList');

    btnOpen.addEventListener('click', () => {
        listContainer.innerHTML = '';
        corporateRowCount = 0;
        appendCorporateRow(); 
        modal.classList.remove('hidden');
    });

    btnClose.addEventListener('click', () => modal.classList.add('hidden'));
    btnAddRow.addEventListener('click', appendCorporateRow);

    btnSave.addEventListener('click', async () => {
        const rows = document.querySelectorAll('.corp-row-item');
        let payloadArray = [];
        let uploadPromises = [];

        let hasData = false;
        rows.forEach(row => {
            if (row.querySelector('.corp-name').value.trim() !== '') hasData = true;
        });

        if (!hasData) return alert("Isi minimal 1 nama brand Corporate!");

        btnSave.innerHTML = `<span class="animate-pulse">⏳ SEDANG MENYUNTIK DATA...</span>`;
        btnSave.disabled = true;

        try {
            rows.forEach((row, index) => {
                const name = row.querySelector('.corp-name').value.trim();
                if (!name) return; 

                const url = row.querySelector('.corp-url').value.trim();
                const category = row.querySelector('.corp-category').value.trim() || 'Corporate Deal';
                const fileInput = row.querySelector('.corp-file').files[0];

                let uploadTask = (async () => {
                    let finalLogo = '';
                    if (fileInput) {
                        const ext = fileInput.name.split('.').pop();
                        const fileName = `corp_${Date.now()}_${index}.${ext}`;
                        const { error } = await supabaseClient.storage.from('sponsor-ads').upload(fileName, fileInput);
                        if (!error) {
                            const { data } = supabaseClient.storage.from('sponsor-ads').getPublicUrl(fileName);
                            finalLogo = data.publicUrl;
                        }
                    }

                    payloadArray.push({
                        sponsor_name: name,
                        link_url: url,
                        sponsor_type: 'corporate', 
                        kategori: category,
                        jenis_bantuan: 'Corporate Special Deal',
                        syarat: 'Exclusive Corporate Campaign',
                        target_gender: 'ALL', // Set default saat injeksi masal
                        target_umur: 'ALL'    // Set default saat injeksi masal
                    });

                    payloadArray[payloadArray.length - 1].logo_url = finalLogo;
                })();

                uploadPromises.push(uploadTask);
            });

            await Promise.all(uploadPromises);

            const { error: dbErr } = await supabaseClient.from('master_sponsors').insert(payloadArray);
            if (dbErr) throw dbErr;

            alert(`🚀 BOOM! ${payloadArray.length} Brand berhasil disuntik sebagai entitas independen!`);
            modal.classList.add('hidden');
            document.querySelector('[data-filter="corporate"]').click(); 
            loadGallery();

        } catch (err) {
            alert("Gagal Injeksi: " + err.message);
        } finally {
            btnSave.innerHTML = `<span>🚀</span> SUNTIK KE DATABASE`;
            btnSave.disabled = false;
        }
    });
}

function appendCorporateRow() {
    corporateRowCount++;
    const container = document.getElementById('corporateBrandList');
    
    const rowHTML = `
        <div class="corp-row-item bg-[#1e293b] p-5 rounded-xl border border-slate-700 relative group transition-colors hover:border-blue-500/50">
            <button onclick="this.parentElement.remove()" class="absolute -top-3 -right-3 bg-slate-700 hover:bg-red-600 text-white w-8 h-8 rounded-full font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">&times;</button>
            
            <div class="flex flex-col md:flex-row gap-5 items-start">
                <div class="shrink-0 w-full md:w-32">
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Logo Brand</label>
                    <div class="w-full aspect-square bg-white rounded-lg border-2 border-dashed border-slate-400 flex flex-col items-center justify-center relative overflow-hidden cursor-pointer hover:border-blue-500" onclick="document.getElementById('corpFile${corporateRowCount}').click()">
                        <img id="corpPreview${corporateRowCount}" src="" class="w-full h-full object-contain absolute inset-0 z-10 hidden bg-white p-2">
                        <span class="text-2xl text-slate-300 z-0">+</span>
                    </div>
                    <input type="file" id="corpFile${corporateRowCount}" class="corp-file hidden" accept="image/*" onchange="
                        if(this.files[0]){
                            const reader = new FileReader();
                            reader.onload = e => {
                                const img = document.getElementById('corpPreview${corporateRowCount}');
                                img.src = e.target.result;
                                img.classList.remove('hidden');
                            };
                            reader.readAsDataURL(this.files[0]);
                        }
                    ">
                </div>
                
                <div class="flex-1 w-full space-y-4">
                    <div>
                        <label class="block text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1.5">Nama Brand</label>
                        <input type="text" class="corp-name w-full bg-[#0f172a] border border-slate-600 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none" placeholder="Cth: JD Sports / iBox">
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">URL Target Promo</label>
                            <input type="text" class="corp-url w-full bg-[#0f172a] border border-slate-600 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none" placeholder="https://...">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Kategori / Divisi</label>
                            <input type="text" class="corp-category w-full bg-[#0f172a] border border-slate-600 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none" placeholder="Cth: Retail Fashion">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', rowHTML);
}
