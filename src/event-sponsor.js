import { supabaseClient } from './supabase.js';

let currentEventId = null;
let currentEventName = '';
let currentEventTier = 'FREEMIUM'; 
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
        
        const { data: eventData, error } = await supabaseClient.from('events').select('owner_id, event_name, event_tier').eq('id', currentEventId).single();
        if (error || !eventData) throw new Error("Event tidak ditemukan.");

        currentEventName = eventData.event_name;
        currentEventTier = eventData.event_tier || 'FREEMIUM';
        
        const allowedAdmins = ['radityaraja@gmail.com', 'fajar@f1swimming.com'];
        const isAuthorized = eventData.owner_id === session.user.id || allowedAdmins.includes(session.user.email);
        
        if (!isAuthorized) {
            alert("Akses Ditolak.");
            return window.location.replace('/dashboard.html');
        }

        renderEventBadge(currentEventTier);
        await fetchSponsorData();
    } catch (err) { alert(err.message); }
});

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
        renderCards('all'); 
    } catch(err) { console.error("Gagal memuat:", err); }
}

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
            statusUI = `<button class="w-full bg-emerald-50 text-emerald-600 font-black py-2.5 rounded-xl text-[10px] tracking-widest border border-emerald-200 cursor-default">🟢 OFFICIAL PARTNER</button>`;
        } else if (!subData) {
            statusUI = `
                <button onclick="handleAjukanSponsor(${sp.id}, '${encodeURIComponent(sp.sponsor_name)}', '${sp.logo_url}')" 
                        class="w-full bg-blue-600 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs transition-all duration-300 shadow-sm hover:shadow-md border border-blue-700 hover:border-slate-800 cursor-pointer group flex justify-center items-center gap-1.5 overflow-hidden">
                    <span>PITCHING SEKARANG</span> 
                    <span class="opacity-0 group-hover:opacity-100 transform -translate-x-4 group-hover:translate-x-0 transition-all duration-300 text-xs">🚀</span>
                </button>`;
        } else if (subData.status === 'Menunggu Review') {
            statusUI = `<button class="w-full bg-amber-50 text-amber-600 font-black py-2.5 rounded-xl text-[10px] tracking-widest border border-amber-200 animate-pulse cursor-default">🟡 PROPOSAL SUBMITTED</button>`;
        } else if (subData.status === 'Disetujui') {
            statusUI = `<button class="w-full bg-blue-50 text-blue-600 font-black py-2.5 rounded-xl text-[10px] tracking-widest border border-blue-200 cursor-default">🔵 APPROVED</button>`;
        } else {
            statusUI = `<button class="w-full bg-red-50 text-red-600 font-black py-2.5 rounded-xl text-[10px] tracking-widest border border-red-200 cursor-default">🔴 REJECTED</button>`;
        }

        const spKategori = sp.kategori || 'General';
        
        if(sp.sponsor_type !== 'scs_partner') {
            if (filterCat !== 'all' && spKategori !== filterCat) return; 
            countUnofficial++;
        }

        // LOGIKA BADGE PERBAIKAN: Pisahin 4 kasta dengan presisi!
        let badgeTopRight = '';
        if (sp.sponsor_type === 'scs_partner') {
            badgeTopRight = `<span class="text-[8px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-100 border border-emerald-200 px-2 py-1 rounded shrink-0">🟢 OFFICIAL</span>`;
        } else if (sp.sponsor_type === 'corporate') {
            badgeTopRight = `<span class="text-[8px] font-black text-blue-700 uppercase tracking-widest bg-blue-100 border border-blue-200 px-2 py-1 rounded shrink-0 shadow-sm flex items-center gap-1">🏢 CORPORATE</span>`;
        } else if (sp.sponsor_type === 'high_potential') {
            badgeTopRight = `<span class="text-[8px] font-black text-amber-900 uppercase tracking-widest bg-gradient-to-r from-amber-200 to-yellow-400 border border-amber-300 px-3 py-1 rounded-full shrink-0 shadow-sm flex items-center gap-1">💎 HIGH POTENTIAL</span>`;
        } else {
            // Ini untuk status 'unofficial' (katalog dummy biasa)
            badgeTopRight = `<span class="text-[8px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 border border-slate-200 px-2 py-1 rounded shrink-0">⚪ PROSPECTIVE</span>`;
        }

        const cardHtml = `
            <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between h-full group">
                <div>
                    <div class="flex justify-between items-start mb-3">
                        <div class="w-14 h-10 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-100 p-1 group-hover:scale-105 transition-transform">
                            <img src="${sp.logo_url || '/images/logo.png'}" class="max-w-full max-h-full object-contain">
                        </div>
                        ${badgeTopRight}
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

window.handleAjukanSponsor = function(spId, nameEncoded, logoUrl) {
    if(currentEventTier !== 'PRO') {
        alert(`🔒 Fitur "Approach Sponsor" terkunci.\n\nStatus Event Anda saat ini adalah [${currentEventTier}]. Silakan kembali ke Dashboard dan lakukan UPGRADE TO PRO untuk membuka akses eksklusif mencari sponsor!`);
        return;
    }
    
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
