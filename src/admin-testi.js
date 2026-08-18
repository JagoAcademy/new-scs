import { supabaseClient } from './supabase.js';

let allClubs = [];
let pendingProUpdates = {}; // KERANJANG BELANJA BUAT NYIMPEN KLIK SEMENTARA

let currentTab = 'live'; 
let currentPage = 1;
const itemsPerPage = 10;
let searchQuery = '';
let filteredClubs = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadClubsData();

    const searchInput = document.getElementById('searchClubPro');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            currentPage = 1;
            renderProClubManager();
        });
    }

    const btnPrev = document.getElementById('btnPrevPro');
    if (btnPrev) btnPrev.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderProClubManager(); } });

    const btnNext = document.getElementById('btnNextPro');
    if (btnNext) btnNext.addEventListener('click', () => { 
        if (currentPage < Math.ceil(filteredClubs.length / itemsPerPage)) { currentPage++; renderProClubManager(); } 
    });

    const tabLive = document.getElementById('tabLive');
    if (tabLive) tabLive.addEventListener('click', () => switchTab('live'));
    
    const tabAll = document.getElementById('tabAll');
    if (tabAll) tabAll.addEventListener('click', () => switchTab('all'));
});

async function loadClubsData() {
    try {
        const { data, error } = await supabaseClient
            .from('clubs')
            .select('id, club_name, is_pro, testimony')
            .order('club_name', { ascending: true }); 
            
        if (error) throw error;
        allClubs = data || [];
        renderProClubManager(); 
        renderTestiTabContent(); 
        
    } catch (err) {
        const errMsg = err.message || JSON.stringify(err);
        const listContainer = document.getElementById('proClubList');
        if (listContainer) listContainer.innerHTML = `<tr><td colspan="3" class="text-center py-8 text-sm text-red-600 font-black uppercase">ERROR LOAD: ${errMsg}</td></tr>`;
    }
}

function renderProClubManager() {
    const listContainer = document.getElementById('proClubList');
    const infoContainer = document.getElementById('proPaginationInfo');
    const btnPrev = document.getElementById('btnPrevPro');
    const btnNext = document.getElementById('btnNextPro');
    if (!listContainer) return;

    filteredClubs = allClubs.filter(c => c.club_name && c.club_name.toLowerCase().includes(searchQuery));
    const totalItems = filteredClubs.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    if(currentPage > totalPages) currentPage = totalPages || 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const clubsToShow = filteredClubs.slice(startIndex, startIndex + itemsPerPage);

    if (clubsToShow.length === 0) {
        listContainer.innerHTML = `<tr><td colspan="3" class="text-center py-10 text-sm text-slate-400 font-bold italic">Tidak ada klub.</td></tr>`;
    } else {
        listContainer.innerHTML = clubsToShow.map(c => {
            const isPro = c.is_pro === true || String(c.is_pro) === 'true';
            
            // Cek apakah ada di keranjang update (biar tampilannya berubah kuning)
            const isPending = pendingProUpdates.hasOwnProperty(c.id);
            const pendingStyle = isPending ? 'bg-yellow-50 border-yellow-200' : 'hover:bg-blue-50/50 border-slate-50';

            const statusBadge = isPro ? `<span class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">PRO TIER</span>` : `<span class="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase">REGULER</span>`;
            
            const actionBtn = isPro
                ? `<button onclick="window.toggleProStatusLocally('${c.id}', true)" class="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-xl whitespace-nowrap">Cabut PRO ❌</button>`
                : `<button onclick="window.toggleProStatusLocally('${c.id}', false)" class="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl whitespace-nowrap">Jadikan PRO 👑</button>`;

            return `<tr class="transition-colors group border-b ${pendingStyle}">
                <td class="py-4 px-5">
                    <p class="font-extrabold text-sm ${isPending ? 'text-yellow-700' : 'text-slate-800'}">${c.club_name} ${isPending ? '<span class="text-[10px] ml-1 text-yellow-500 animate-pulse">(Tertunda)</span>' : ''}</p>
                </td>
                <td class="py-4 px-5">${statusBadge}</td>
                <td class="py-4 px-5 text-right">${actionBtn}</td>
            </tr>`;
        }).join('');
    }

    if (infoContainer && btnPrev && btnNext) {
        infoContainer.innerText = `Menampilkan ${totalItems === 0 ? 0 : startIndex + 1}-${Math.min(startIndex + itemsPerPage, totalItems)} dari ${totalItems} Klub`;
        btnPrev.disabled = currentPage === 1;
        btnNext.disabled = currentPage === totalPages || totalItems === 0;
    }
}

// KLIK LOKAL AJA (MASUKIN KERANJANG)
window.toggleProStatusLocally = function(clubId, currentStatus) {
    const idAngka = parseInt(clubId);
    const newStatus = !currentStatus; 

    // Masukin ke keranjang
    pendingProUpdates[idAngka] = newStatus;

    // Update state lokal
    const cIndex = allClubs.findIndex(c => String(c.id) === String(clubId));
    if(cIndex > -1) {
        allClubs[cIndex].is_pro = newStatus;
    }

    // Munculin tombol tiup
    document.getElementById('btnSavePro').classList.remove('hidden');
    
    renderProClubManager(); // Rerender tabel biar kelihatan
}

// EKSEKUSI NYATA KE SUPABASE
window.saveProToSupabase = async function() {
    const btn = document.getElementById('btnSavePro');
    btn.innerText = "Meniup... 💨";
    btn.disabled = true;

    try {
        const updates = Object.entries(pendingProUpdates);
        
        // Looping tembak ke Supabase satu-satu
        for (const [id, status] of updates) {
            const { error } = await supabaseClient
                .from('clubs')
                .update({ is_pro: status })
                .eq('id', parseInt(id));

            if (error) throw error;
        }

        // Kalau sukses semua
        alert("✅ BOOM! Sukses ditiup ke Supabase. Silakan cek Landing Page!");
        
        // Bersihin keranjang
        pendingProUpdates = {}; 
        btn.classList.add('hidden');
        btn.innerText = "Tiup ke Supabase 🚀";
        btn.disabled = false;

        renderProClubManager(); //ilangin status tertunda

    } catch(err) {
        alert("❌ Gagal meniup: " + err.message);
        btn.innerText = "Tiup ke Supabase 🚀";
        btn.disabled = false;
    }
}

// ==========================================
// TESTIMONI LAMA
// ==========================================
function getFlatTestimonials() {
    let flatList = [];
    allClubs.forEach(c => {
        if (c.testimony && Array.isArray(c.testimony)) {
            c.testimony.forEach((t, idx) => { flatList.push({ clubId: c.id, clubName: c.club_name, originalIndex: idx, ...t }); });
        }
    });
    return flatList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function switchTab(tabName) {
    currentTab = tabName;
    const tabLive = document.getElementById('tabLive');
    const tabAll = document.getElementById('tabAll');
    if(!tabLive || !tabAll) return;

    tabLive.className = tabAll.className = "px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-50 text-slate-600";
    if (tabName === 'live') tabLive.className = "px-5 py-2.5 rounded-xl text-sm font-bold bg-green-100 text-green-700";
    else tabAll.className = "px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-100 text-blue-700";

    renderTestiTabContent();
}

function renderTestiTabContent() {
    const container = document.getElementById('testiListContainer');
    if(!container) return;
    const flatList = getFlatTestimonials();
    let displayList = currentTab === 'live' ? flatList.filter(t => t.isPublished === true) : flatList;

    if (displayList.length === 0) {
        container.innerHTML = `<div class="py-10 text-center"><span class="text-4xl">📭</span><p class="text-sm text-slate-500 font-bold mt-2">Tidak ada data.</p></div>`;
        return;
    }

    container.innerHTML = displayList.map(t => `
        <div class="p-5 border rounded-2xl mb-4 ${t.isPublished ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}">
            <div class="flex justify-between items-center mb-4">
                <span class="text-[10px] font-black px-3 py-1 rounded-full ${t.isPublished ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}">
                    ${t.isPublished ? '🟢 Tayang' : '🟡 Disimpan'} - ${t.clubName}
                </span>
                <div>
                    <button onclick="window.togglePublish('${t.clubId}', ${t.originalIndex})" class="text-xs font-bold px-4 py-2 rounded-xl ${t.isPublished ? 'bg-red-100 text-red-600' : 'bg-blue-600 text-white'}">${t.isPublished ? 'Tarik ❌' : 'Tayang 🚀'}</button>
                </div>
            </div>
            <p class="text-sm italic">"${t.text}"</p>
            <p class="text-xs font-bold mt-2">${t.name} | ${t.role}</p>
        </div>
    `).join('');
}

window.togglePublish = async function(clubId, originalIndex) {
    const idAngka = parseInt(clubId);
    const cIndex = allClubs.findIndex(c => String(c.id) === String(clubId));
    let currentTestimonies = allClubs[cIndex].testimony;
    currentTestimonies[originalIndex].isPublished = !currentTestimonies[originalIndex].isPublished;

    try {
        await supabaseClient.from('clubs').update({ testimony: currentTestimonies }).eq('id', idAngka);
        allClubs[cIndex].testimony = currentTestimonies;
        renderTestiTabContent(); 
    } catch (err) {
        alert("Gagal memproses tayangan!");
        currentTestimonies[originalIndex].isPublished = !currentTestimonies[originalIndex].isPublished;
    }
}
