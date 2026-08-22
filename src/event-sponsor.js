import { supabaseClient } from './supabase.js';

let currentEventId = null;
let currentEventName = '';
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
        
        const { data: eventData, error } = await supabaseClient.from('events').select('owner_id, event_name').eq('id', currentEventId).single();
        if (error || !eventData) throw new Error("Event tidak ditemukan.");

        currentEventName = eventData.event_name;
        
        const isAuthorized = eventData.owner_id === session.user.id || session.user.email === 'radityaraja@gmail.com';
        if (!isAuthorized) {
            alert("Akses Ditolak.");
            return window.location.replace('/dashboard.html');
        }

        await fetchSponsorData();
    } catch (err) { alert(err.message); }
});

async function fetchSponsorData() {
    try {
        const { data: masters } = await supabaseClient.from('master_sponsors').select('*').order('id', {ascending: true});
        masterSponsors = masters || [];

        const { data: subs } = await supabaseClient.from('sponsor_submissions').select('*').eq('event_id', currentEventId);
        sponsorSubmissions = subs || [];

        const { data: deals } = await supabaseClient.from('event_sponsors').select('sponsor_ids').eq('event_id', currentEventId).single();
        eventSponsorsDeal = deals ? (deals.sponsor_ids || []) : [];

        renderCards();
    } catch(err) { console.error("Gagal memuat:", err); }
}

function renderCards() {
    const gridOfficial = document.getElementById('gridOfficial');
    const gridUnofficial = document.getElementById('gridUnofficial');
    
    gridOfficial.innerHTML = '';
    gridUnofficial.innerHTML = '';

    masterSponsors.forEach(sp => {
        const isDeal = eventSponsorsDeal.includes(sp.id);
        const subData = sponsorSubmissions.find(s => s.sponsor_id === sp.id);

        let statusUI = '';
        if (isDeal && !subData) {
            statusUI = `<div class="mt-4 pt-3 border-t border-slate-100 text-center"><span class="inline-block bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest border border-emerald-200 w-full">🟢 OFFICIAL EVENT SPONSOR</span></div>`;
        } else if (!subData) {
            statusUI = `<div class="mt-4 pt-3 border-t border-slate-100"><button onclick="bukaModalPengajuan(${sp.id}, '${encodeURIComponent(sp.sponsor_name)}', '${sp.logo_url}')" class="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-2 rounded-xl text-xs transition border border-blue-200 shadow-sm">AJUKAN SPONSOR</button></div>`;
        } else if (subData.status === 'Menunggu Review') {
            statusUI = `<div class="mt-4 pt-3 border-t border-slate-100 text-center"><span class="inline-block bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest border border-amber-200 w-full animate-pulse">🟡 PROPOSAL SUBMITTED</span></div>`;
        } else if (subData.status === 'Disetujui') {
            statusUI = `<div class="mt-4 pt-3 border-t border-slate-100 text-center"><span class="inline-block bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest border border-emerald-200 w-full">🔵 APPROVED</span></div>`;
        } else {
            statusUI = `<div class="mt-4 pt-3 border-t border-slate-100 text-center"><span class="inline-block bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest border border-red-200 w-full">🔴 REJECTED</span></div>`;
        }

        const tagStatus = sp.sponsor_type === 'scs_partner' ? '🟢 OFFICIAL PARTNER' : '⚪ PROSPECTIVE';
        const safeSyarat = encodeURIComponent(sp.syarat || 'Silakan ajukan proposal untuk mengetahui syarat detail.');

        const cardHtml = `
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
                <div>
                    <div class="flex justify-between items-start mb-3">
                        <div class="w-12 h-12 bg-slate-50 rounded-xl border border-slate-100 p-1 flex items-center justify-center shadow-sm">
                            <img src="${sp.logo_url || '/images/logo.png'}" class="max-w-full max-h-full object-contain">
                        </div>
                        <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">${tagStatus}</span>
                    </div>
                    <h3 class="font-black text-slate-800 text-sm mb-1">${sp.sponsor_name}</h3>
                    <p class="text-[10px] text-slate-500 font-bold mb-3">${sp.kategori || 'General'}</p>
                    
                    <p class="text-[10px] text-slate-600 font-medium mb-1">Benefit potensial:</p>
                    <p class="text-[10px] font-bold text-emerald-600 mb-2">🎁 ${sp.jenis_bantuan || 'Product Support'}</p>
                    
                    <button onclick="lihatSyarat('${safeSyarat}')" class="text-[10px] text-blue-500 hover:underline">Baca Syarat & Ketentuan &raquo;</button>
                </div>
                ${statusUI}
            </div>
        `;

        if (sp.sponsor_type === 'scs_partner') gridOfficial.innerHTML += cardHtml;
        else gridUnofficial.innerHTML += cardHtml;
    });
}

window.lihatSyarat = function(syarat) {
    document.getElementById('modalSyaratContent').innerText = decodeURIComponent(syarat);
    document.getElementById('modalSyarat').classList.remove('hidden');
}

window.bukaModalPengajuan = function(id, nameEncoded, logoUrl) {
    document.getElementById('propSponsorId').value = id;
    document.getElementById('propSponsorName').innerText = decodeURIComponent(nameEncoded);
    document.getElementById('propLogo').src = logoUrl || '/images/logo.png';
    document.getElementById('propEventName').innerText = `Event: ${currentEventName}`;
    
    // Reset Checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.getElementById('propNote').value = '';

    document.getElementById('modalPengajuan').classList.remove('hidden');
}

document.getElementById('btnSubmitProposal').addEventListener('click', async () => {
    const spId = document.getElementById('propSponsorId').value;
    const note = document.getElementById('propNote').value;
    
    // Ambil value checkbox
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
