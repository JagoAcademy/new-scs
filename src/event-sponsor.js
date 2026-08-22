import { supabaseClient } from './supabase.js';

let currentEventId = null;
let masterSponsors = [];
let eventSponsorsDeal = []; 
let sponsorSubmissions = []; 

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentEventId = urlParams.get('id');

    if (!currentEventId) {
        alert("ID Event tidak ditemukan!");
        window.location.replace('/dashboard.html');
        return;
    }

    const btnBack = document.getElementById('btnBackDashboard');
    if (btnBack) btnBack.href = `/event-dashboard.html?id=${currentEventId}`;

    try {
        // ==========================================
        // SATPAM LAPISAN 1: CEK OTORISASI USER
        // ==========================================
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            alert("Akses ditolak! Silakan login terlebih dahulu.");
            window.location.replace('/auth.html');
            return;
        }
        
        const currentUserId = session.user.id;
        const currentUserEmail = session.user.email;

        const { data: eventData, error } = await supabaseClient
            .from('events')
            .select('owner_id')
            .eq('id', currentEventId)
            .single();

        if (error || !eventData) throw new Error("Gagal memuat dari database.");

        let isAuthorized = false;
        
        if (eventData.owner_id === currentUserId) {
            isAuthorized = true;
        } else if (currentUserEmail === 'radityaraja@gmail.com') {
            isAuthorized = true;
        } else {
            const { data: collabData } = await supabaseClient
                .from('event_collaborators')
                .select('id')
                .eq('event_id', currentEventId)
                .eq('user_id', currentUserId)
                .single();
                
            if (collabData) isAuthorized = true;
        }

        if (!isAuthorized) {
            alert("🛑 WOY! Kamu bukan Owner atau Panitia di event ini. Dilarang ngintip!");
            window.location.replace('/dashboard.html');
            return;
        }
        // ==========================================

        document.querySelectorAll('.btn-close-modal').forEach(btn => btn.onclick = (e) => e.target.closest('.fixed').classList.add('hidden'));

        await fetchSponsorData();

    } catch (err) {
        alert("Terjadi kesalahan: " + err.message);
    }
});

async function fetchSponsorData() {
    try {
        // 1. Tarik semua katalog sponsor
        const { data: masters } = await supabaseClient.from('master_sponsors').select('*').order('id', {ascending: true});
        masterSponsors = masters || [];

        // 2. Tarik daftar pengajuan yang lagi nunggu review
        const { data: subs } = await supabaseClient.from('sponsor_submissions').select('*').eq('event_id', currentEventId);
        sponsorSubmissions = subs || [];

        // 3. Tarik data yang udah DEAL (di-approve admin ke event_sponsors)
        const { data: deals } = await supabaseClient.from('event_sponsors').select('sponsor_ids').eq('event_id', currentEventId).single();
        eventSponsorsDeal = deals ? (deals.sponsor_ids || []) : [];

        renderTable();
    } catch(err) {
        document.getElementById('sponsorTableBody').innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500 font-bold">Gagal memuat data sponsor: ${err.message}</td></tr>`;
    }
}

function renderTable() {
    const tbody = document.getElementById('sponsorTableBody');
    tbody.innerHTML = '';

    if(masterSponsors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-slate-500 font-medium">Bank Sponsor sedang kosong. Belum ada brand yang terafiliasi.</td></tr>';
        return;
    }

    masterSponsors.forEach((sp, idx) => {
        // Cek status deal / review
        const isDeal = eventSponsorsDeal.includes(sp.id);
        const isSubmitted = sponsorSubmissions.find(s => s.sponsor_id === sp.id);

        let actionHtml = '';
        if (isDeal) {
            actionHtml = `
                <div class="flex justify-center">
                    <span class="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-200 shadow-sm flex items-center gap-1.5 w-max">
                        <span class="text-sm">🤝</span> DEAL AKTIF
                    </span>
                </div>`;
        } else if (isSubmitted) {
            actionHtml = `
                <div class="flex justify-center">
                    <span class="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-200 shadow-sm flex items-center gap-1.5 w-max opacity-80">
                        <span class="animate-spin text-sm">⏳</span> MENUNGGU
                    </span>
                </div>`;
        } else {
            actionHtml = `
                <button onclick="ajukanSponsor(${sp.id})" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-md w-full md:w-auto transform hover:-translate-y-0.5">
                    Ajukan Proposal
                </button>`;
        }

        const safeSyarat = encodeURIComponent(sp.syarat || 'Tidak ada syarat dan kewajiban khusus. Hubungi admin SCS.');
        const safeName = encodeURIComponent(sp.sponsor_name);

        const tr = `
            <tr class="hover:bg-blue-50/30 transition-colors border-b border-slate-100 group">
                <td class="p-4 text-center font-black text-slate-300 text-sm">${idx + 1}</td>
                <td class="p-4">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 bg-white rounded-xl border border-slate-200 p-2 flex items-center justify-center shrink-0 shadow-sm group-hover:border-blue-300 transition-colors">
                            <img src="${sp.logo_url || '/images/logo.png'}" class="max-w-full max-h-full object-contain">
                        </div>
                        <div>
                            <h4 class="font-black text-slate-800 text-sm">${sp.sponsor_name}</h4>
                            <a href="${sp.link_url || '#'}" target="_blank" class="text-[10px] text-blue-500 hover:text-blue-700 font-mono font-bold uppercase tracking-wider mt-0.5 block">🔗 Kunjungi Web</a>
                        </div>
                    </div>
                </td>
                <td class="p-4 text-center">
                    <span class="inline-block bg-slate-100 text-slate-600 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                        ${sp.jenis_bantuan || 'Produk Support'}
                    </span>
                </td>
                <td class="p-4 text-center">
                    <button onclick="lihatSyarat('${safeName}', '${safeSyarat}')" class="text-blue-600 hover:text-blue-800 text-xs font-bold underline decoration-blue-300 underline-offset-4 flex items-center justify-center gap-1 mx-auto">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Baca Kewajiban
                    </button>
                </td>
                <td class="p-4 text-center align-middle">
                    ${actionHtml}
                </td>
            </tr>
        `;
        tbody.innerHTML += tr;
    });
}

// Buka Modal Syarat
window.lihatSyarat = function(name, syarat) {
    document.getElementById('modalSyaratTitle').innerText = decodeURIComponent(name);
    document.getElementById('modalSyaratContent').innerText = decodeURIComponent(syarat);
    document.getElementById('modalSyarat').classList.remove('hidden');
}

// Eksekusi Tombol Ajukan Proposal
window.ajukanSponsor = async function(sponsorId) {
    if(!confirm("Yakin ingin mengajukan proposal kerja sama ke brand sponsor ini?")) return;
    
    try {
        const { error } = await supabaseClient.from('sponsor_submissions').insert([{
            event_id: currentEventId,
            sponsor_id: sponsorId
        }]);
        if(error) throw error;
        
        alert("✅ Pengajuan proposal berhasil dikirim! Tim pusat SCS akan menjembatani negosiasi Anda.");
        fetchSponsorData(); // Refresh tabel
    } catch(err) {
        alert("Gagal mengajukan proposal: " + err.message);
    }
}
