import { supabaseClient } from './supabase.js';

let reusedLogoUrl = null;
let allSponsors = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (sessionStorage.getItem('aztec_key') !== 'buka_sesame') return window.location.replace('/dashboard.html');
    loadGallery();
    setupModalListeners();
    setupFilters();
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
        grid.innerHTML = `<div class="col-span-full text-center py-10"><p class="text-slate-500 font-bold">Katalog kosong.</p></div>`;
        return;
    }

    let htmlContent = '';
    data.forEach(sponsor => {
        const isOfficial = sponsor.sponsor_type === 'scs_partner';
        const badge = isOfficial 
            ? `<span class="bg-emerald-900/40 text-emerald-400 text-[9px] px-2 py-1 rounded border border-emerald-500/30 uppercase font-black tracking-wider flex items-center gap-1 w-max"><span>🟢</span> OFFICIAL</span>`
            : `<span class="bg-slate-800 text-slate-400 text-[9px] px-2 py-1 rounded border border-slate-600 uppercase font-black tracking-wider flex items-center gap-1 w-max"><span>⚪</span> PROSPECTIVE</span>`;

        const sponsorDataString = encodeURIComponent(JSON.stringify(sponsor));

        htmlContent += `
            <div onclick="openEditModal('${sponsorDataString}')" class="bg-slate-800/50 rounded-2xl p-4 border border-slate-700 shadow-lg hover:border-amber-500 transition-all cursor-pointer">
                <div class="h-24 w-full bg-white rounded-xl mb-4 flex items-center justify-center p-3 border border-slate-600">
                    <img src="${sponsor.logo_url || '/images/logo.png'}" class="max-h-full max-w-full object-contain">
                </div>
                <h3 class="font-black text-white text-sm truncate">${sponsor.sponsor_name}</h3>
                <p class="text-[10px] text-slate-400 mt-1 mb-3">${sponsor.kategori || 'General'}</p>
                <div class="border-t border-slate-700/50 pt-3">
                    ${badge}
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
    
    reusedLogoUrl = sponsor.logo_url || null;
    document.getElementById('editUploadLogo').value = '';
    
    const previewLogo = document.getElementById('editPreviewLogo');
    if (reusedLogoUrl) {
        previewLogo.src = reusedLogoUrl;
        previewLogo.classList.remove('hidden');
    } else {
        previewLogo.classList.add('hidden');
    }

    document.getElementById('modalTitleText').innerHTML = '<span>✏️</span> Detail Sponsor';
    document.getElementById('btnDeleteSponsor').classList.remove('hidden');
    document.getElementById('editStatusMsg').classList.add('hidden');
    document.getElementById('modalEditSponsor').classList.remove('hidden');
}

function setupModalListeners() {
    document.getElementById('btnAddNewSponsor').addEventListener('click', () => {
        document.getElementById('editSponsorId').value = '';
        ['editSponsorName', 'editSponsorUrl', 'editSponsorKategori', 'editSponsorBenefit', 'editSponsorSyarat', 'editUploadLogo'].forEach(id => document.getElementById(id).value = '');
        document.getElementById('editSponsorType').value = 'unofficial';
        reusedLogoUrl = null;
        document.getElementById('editPreviewLogo').classList.add('hidden');
        document.getElementById('modalTitleText').innerHTML = '<span>➕</span> Tambah Sponsor';
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
                const fileName = `brand_${Date.now()}.${ext}`;
                const { error: upErr } = await supabaseClient.storage.from('sponsor-ads').upload(fileName, fileLogo);
                if (upErr) throw upErr;
                const { data: urlData } = supabaseClient.storage.from('sponsor-ads').getPublicUrl(fileName);
                finalLogoUrl = urlData.publicUrl;
            }

            const payloadData = { 
                sponsor_name: name, 
                link_url: document.getElementById('editSponsorUrl').value.trim(), 
                sponsor_type: document.getElementById('editSponsorType').value,
                kategori: document.getElementById('editSponsorKategori').value.trim(),
                jenis_bantuan: document.getElementById('editSponsorBenefit').value.trim(),
                syarat: document.getElementById('editSponsorSyarat').value.trim(),
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
