import { supabaseClient } from './supabase.js';

let currentEventId = null;
let currentEventName = '';
let currentEventTier = 'FREEMIUM'; // Simpan kasta event
let masterSponsors = [];
let sponsorSubmissions = []; 
let eventSponsorsDeal = []; 

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentEventId = urlParams.get('id');

    if (!currentEventId) return window.location.replace('/dashboard.html');
    
    const btnBack = document.getElementById('btnBackDashboard');
    if (btnBack) btnBack.href = `/event-dashboard.html?id=${currentEventId}`;

    document.querySelectorAll('.btn-close-modal').forEach(btn => btn.onclick = (e) => e.target.closest('.fixed').classList.add('hidden'));

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return window.location.replace('/auth.html');
        
        // Tarik event_tier sekalian
        const { data: eventData, error } = await supabaseClient.from('events').select('owner_id, event_name, event_tier').eq('id', currentEventId).single();
        if (error || !eventData) throw new Error("Event tidak ditemukan.");

        currentEventName = eventData.event_name;
        currentEventTier = eventData.event_tier || 'FREEMIUM';
        
        const isAuthorized = eventData.owner_id === session.user.id || session.user.email === 'radityaraja@gmail.com';
        if (!isAuthorized) {
            alert("Akses Ditolak.");
            return window.location.replace('/dashboard.html');
        }

        renderEventBadge(currentEventTier);
        await fetchSponsorData();
    } catch (err) { alert(err.message); }
});

// Render Badge Status Event di Pojok Kanan Atas
function renderEventBadge(tier) {
    const container = document.getElementById('eventStatusBadgeContainer');
    if(!container) return;
    
    let badgeHtml = '';
    if(tier === 'PRO') {
        badgeHtml = `<span class="bg-gradient-to-r from-amber-400 to-amber-600 text-slate-900 text-xs font-black px-4 py-2 rounded-xl shadow-md uppercase tracking-widest flex items-center gap-1.5 border border-amber-300"><span>🌟</span> PRO EVENT</span>`;
    } else if (tier === 'FREEMIUM') {
        badgeHtml = `<span class="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-black px-4 py-2 rounded-xl shadow-sm uppercase tracking-widest flex items-center gap-1.5"><span>💎</span> FREEMIUM</span>`;
    } else {
        badgeHtml = `<span class="bg-slate-100 text-slate-500 border border-slate-300 text-xs font-black px-4 py-2 rounded-xl shadow-sm uppercase tracking-widest flex items-center gap-1.5"><span>⚪</span> FREE</span>`;
    }
    container.innerHTML = badgeHtml;
}

async function fetchSponsorData() {
    try {
        const { data: masters } = await supabaseClient.from('master_sponsors').select('*').order('id', {ascending: true});
        masterSponsors = masters || [];

        const { data: subs } = await supabaseClient.from('sponsor_submissions').select('*').eq('event_id', currentEventId);
        sponsorSubmissions = subs || [];

        const { data: deals } = await supabaseClient.from('event_sponsors').select('sponsor_ids').eq('event_id', currentEventId).single();
        eventSponsorsDeal = deals ? (deals.sponsor_ids || []) : [];

        populateFilters();
        renderCards('all'); // Render semua by default
    } catch(err) { console.error("Gagal memuat:", err); }
}

// Injeksi Kategori Otomatis ke Dropdown
function populateFilters() {
    const selectKategori = document.getElementById('filterKategori');
    if(!selectKategori) return;
    
    let uniqueKategori = new Set();
    masterSponsors.forEach(sp => {
        if(sp.sponsor_type !== 'scs_partner') { 
            uniqueKategori.add(sp.kategori || 'General');
        }
    });
    
    selectKategori.innerHTML = '<option value="all">Semua Kategori</option>';
    Array.from(uniqueKategori).sort().forEach(cat => {
        selectKategori.innerHTML += `<option value="${cat}">${cat}</option>`;
    });

    selectKategori.addEventListener('change', (e) => {
        renderCards(e.target.value);
    });
}

function renderCards(filterCat = 'all') {
    const gridOfficial = document.getElementById('gridOfficial');
    const gridUnofficial = document.getElementById('gridUnofficial');
    const emptyState = document.getElementById('emptyState');
    
    gridOfficial.innerHTML = '';
    gridUnofficial.innerHTML = '';
    
    let countUnofficial = 0;

    masterSponsors.forEach(sp => {
        const isDeal = eventSponsorsDeal.includes(sp.id);
        const subData = sponsorSubmissions.find(s => s.sponsor_id === sp.id);

        let statusUI = '';
        if (isDeal && !subData) {
            statusUI = `<button class="w-full bg-emerald-50 text-emerald-600 font-black py-2 rounded-xl text-[10px] tracking-widest border border-emerald-200 cursor-default">🟢 OFFICIAL PARTNER</button>`;
        } else if (!subData) {
            // Tombol Ajukan (Cegatan Kasta PRO dieksekusi di function handleAjukanSponsor)
            statusUI = `<button onclick="handleAjukanSponsor(${sp.id}, '${encodeURIComponent(sp.sponsor_name)}', '${sp.logo_url}')" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs transition shadow-sm border border-blue-700 cursor-pointer">AJUKAN SPONSOR</button>`;
        } else if (subData.status === 'Menunggu Review') {
            statusUI = `<button class="w-full bg-amber-50 text-amber-600 font-black py-2 rounded-xl text-[10px] tracking-widest border border-amber-200 animate-pulse cursor-default">🟡 PROPOSAL SUBMITTED</button>`;
        } else if (subData.status === 'Disetujui') {
            statusUI = `<button class="w-full bg-blue-50 text-blue-600 font-black py-2 rounded-xl text-[10px] tracking-widest border border-blue-200 cursor-default">🔵 APPROVED</button>`;
        } else {
            statusUI = `<button class="w-full bg-red-50 text-red-600 font-black py-2 rounded-xl text-[10px] tracking-widest border border-red-200 cursor-default">🔴 REJECTED</button>`;
        }

        const spKategori = sp.kategori || 'General';
        
        // Logika Filter (Hanya berlaku untuk Unofficial Sponsor)
        if(sp.sponsor_type !== 'scs_partner') {
            if (filterCat !== 'all' && spKategori !== filterCat) return; 
            countUnofficial++;
        }

        const tagStatus = sp.sponsor_type === 'scs_partner' ? '🟢 OFFICIAL' : '⚪ PROSPECTIVE';
        const safeSyarat = encodeURIComponent(sp.syarat || 'Silakan ajukan proposal untuk mengetahui detail.');

        // COMPACT CARD LAYOUT UX (Daging Semua)
        const cardHtml = `
            <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
                <div>
                    <div class="flex justify-between items-start mb-3">
                        <div class="w-14 h-10 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-100 p-1">
                            <img src="${sp.logo_url || '/images/logo.png'}" class="max-w-full max-h-full object-contain">
                        </div>
                        <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded shrink-0">${tagStatus}</span>
                    </div>
                    <h3 class="font-black text-slate-800 text-sm leading-tight mb-1 truncate">${sp.sponsor_name}</h3>
                    <p class="text-[10px] font-bold text-slate-500 mb-3">${spKategori}</p>
                    
                    <div class="bg-slate-50 rounded-xl p-2.5 mb-4 border border-slate-100">
                        <p class="text-[9px] text-slate-500 font-medium mb-1">Benefit potensial:</p>
                        <p class="text-[10px] font-bold text-emerald-600 truncate">🎁 ${sp.jenis_bantuan || 'Product Support'}</p>
                    </div>
                </div>
                <div class="space-y-2">
                    ${statusUI}
                </div>
            </div>
        `;

        if (sp.sponsor_type === 'scs_partner') gridOfficial.innerHTML += cardHtml;
        else gridUnofficial.innerHTML += cardHtml;
    });

    // Tampilkan Empty State jika hasil filter kosong
    if (emptyState) {
        if (countUnofficial === 0 && masterSponsors.filter(s => s.sponsor_type !== 'scs_partner').length > 0) {
            emptyState.classList.remove('hidden');
            gridUnofficial.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            gridUnofficial.classList.remove('hidden');
        }
    }
}

// LOGIKA CEGATAN KASTA EVENT
window.handleAjukanSponsor = function(spId, nameEncoded, logoUrl) {
    if(currentEventTier !== 'PRO') {
        alert(`🔒 Fitur "Approach Sponsor" terkunci.\n\nStatus Event Anda saat ini adalah [${currentEventTier}]. Silakan kembali ke Dashboard dan lakukan UPGRADE TO PRO untuk membuka akses eksklusif mencari sponsor!`);
        return;
    }
    
    // Kalau udah PRO, baru buka modal pengajuannya
    bukaModalPengajuan(spId, nameEncoded, logoUrl);
}

window.bukaModalPengajuan = function(id, nameEncoded, logoUrl) {
    document.getElementById('propSponsorId').value = id;
    document.getElementById('propSponsorName').innerText = decodeURIComponent(nameEncoded);
    document.getElementById('propLogo').src = logoUrl || '/images/logo.png';
    document.getElementById('propEventName').innerText = `Event: ${currentEventName}`;
    
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.getElementById('propNote').value = '';

    document.getElementById('modalPengajuan').classList.remove('hidden');
}

document.getElementById('btnSubmitProposal').addEventListener('click', async () => {
    const spId = document.getElementById('propSponsorId').value;
    const note = document.getElementById('propNote').value;
    
    const supportReq = Array.from(document.querySelectorAll('input[name="supportType"]:checked')).map(cb => cb.value).join(', ');
    const benefitsOff = Array.from(document.querySelectorAll('input[name="benefitOffered"]:checked')).map(cb => cb.value).join(', ');

    if (!supportReq || !benefitsOff) return alert("Pilih minimal 1 bentuk dukungan dan 1 benefit yang ditawarkan!");

    const btn = document.getElementById('btnSubmitProposal');
    btn.innerText = "MENGIRIM..."; btn.disabled = true;

    try {
        const { error } = await supabaseClient.from('sponsor_submissions').insert([{ 
            event_id: currentEventId, 
            sponsor_id: spId,
            support_type_req: supportReq,
            benefits_offered: benefitsOff,
            proposal_note: note
        }]);
        if(error) throw error;

        alert("✅ Proposal berhasil dikirim ke Antrian SCS Pusat!");
        document.getElementById('modalPengajuan').classList.add('hidden');
        fetchSponsorData(); 
    } catch(err) { 
        alert("Gagal: " + err.message); 
    } finally {
        btn.innerText = "KIRIM PROPOSAL 🚀"; btn.disabled = false;
    }
});
