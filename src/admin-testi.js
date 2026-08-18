import { supabaseClient } from './supabase.js';

let allClubs = [];

// Variabel untuk Pagination PRO Club
let currentPage = 1;
const itemsPerPage = 10;
let searchQuery = '';
let filteredClubs = [];

// Variabel untuk Testimoni
let currentTab = 'live'; 

document.addEventListener('DOMContentLoaded', async () => {
    await loadClubsData();

    // Event Listeners PRO Club
    const searchInput = document.getElementById('searchClubPro');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            currentPage = 1; // Reset ke halaman 1 tiap kali nyari
            renderProClubManager();
        });
    }

    const btnPrev = document.getElementById('btnPrevPro');
    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderProClubManager();
            }
        });
    }

    const btnNext = document.getElementById('btnNextPro');
    if (btnNext) {
        btnNext.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredClubs.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderProClubManager();
            }
        });
    }

    // Event Listeners Testimoni
    const tabLive = document.getElementById('tabLive');
    if (tabLive) tabLive.addEventListener('click', () => switchTab('live'));
    
    const tabAll = document.getElementById('tabAll');
    if (tabAll) tabAll.addEventListener('click', () => switchTab('all'));
});

// Tarik data klub sekalian bawa status "is_pro"
async function loadClubsData() {
    try {
        const { data, error } = await supabaseClient
            .from('clubs')
            .select('id, club_name, is_pro, testimony')
            .order('club_name', { ascending: true }); // Urut abjad
            
        if (error) throw error;
        
        allClubs = data || [];
        renderProClubManager(); // Render tabel PRO
        renderTestiTabContent(); // Render tabel Testi Lama
        
    } catch (err) {
        console.error("Gagal memuat data:", err);
        // TAMPILKAN ERROR ASLI KE LAYAR BIAR KETAHUAN PENYAKITNYA
        const errMsg = err.message || JSON.stringify(err);
        const listContainer = document.getElementById('proClubList');
        if (listContainer) {
            listContainer.innerHTML = `<tr><td colspan="3" class="text-center py-8 text-sm text-red-600 font-black uppercase">ERROR LOG: ${errMsg}</td></tr>`;
        }
    }
}

// ==========================================
// LOGIKA 1: MANAJEMEN PRO CLUB (GANTENG)
// ==========================================
function renderProClubManager() {
    const listContainer = document.getElementById('proClubList');
    const infoContainer = document.getElementById('proPaginationInfo');
    const btnPrev = document.getElementById('btnPrevPro');
    const btnNext = document.getElementById('btnNextPro');

    if (!listContainer) return; // safety check

    // 1. Filter by Search Query
    filteredClubs = allClubs.filter(c => 
        c.club_name && c.club_name.toLowerCase().includes(searchQuery)
    );

    // Hitung Pagination
    const totalItems = filteredClubs.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    
    // Cegah page kelebihan
    if(currentPage > totalPages) currentPage = totalPages || 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const clubsToShow = filteredClubs.slice(startIndex, endIndex);

    // 2. Render HTML Tabel
    if (clubsToShow.length === 0) {
        listContainer.innerHTML = `<tr><td colspan="3" class="text-center py-10 text-sm text-slate-400 font-bold italic">Tidak ada klub yang cocok dengan pencarian.</td></tr>`;
    } else {
        listContainer.innerHTML = clubsToShow.map(c => {
            // Tampilan Status & Tombol
            const isPro = c.is_pro === true;
            const statusBadge = isPro 
                ? `<span class="bg-yellow-100 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 w-max shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>PRO TIER</span>`
                : `<span class="bg-slate-100 text-slate-500 border border-slate-200 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase w-max">REGULER</span>`;
            
            const actionBtn = isPro
                ? `<button onclick="window.toggleProStatus('${c.id}', true)" class="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold rounded-xl transition-colors shadow-sm whitespace-nowrap">Cabut PRO ❌</button>`
                : `<button onclick="window.toggleProStatus('${c.id}', false)" class="px-4 py-2 bg-slate-900 hover:bg-yellow-500 hover:border-yellow-600 hover:shadow-[0_0_15px_rgba(234,179,8,0.4)] hover:text-white text-white border border-slate-800 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 ml-auto whitespace-nowrap">Jadikan PRO 👑</button>`;

            return `
            <tr class="hover:bg-blue-50/50 transition-colors group">
                <td class="py-4 px-5 border-b border-slate-50">
                    <p class="font-extrabold text-slate-800 text-sm">${c.club_name}</p>
                    <p class="text-[9px] text-slate-400 font-mono mt-0.5">ID: ${c.id}</p>
                </td>
                <td class="py-4 px-5 border-b border-slate-50">${statusBadge}</td>
                <td class="py-4 px-5 border-b border-slate-50 text-right">${actionBtn}</td>
            </tr>
            `;
        }).join('');
    }

    // 3. Update Pagination Info & Buttons
    if (infoContainer && btnPrev && btnNext) {
        let startDisplay = totalItems === 0 ? 0 : startIndex + 1;
        let endDisplay = Math.min(endIndex, totalItems);
        infoContainer.innerText = `Menampilkan ${startDisplay}-${endDisplay} dari ${totalItems} Klub`;

        btnPrev.disabled = currentPage === 1;
        btnNext.disabled = currentPage === totalPages || totalItems === 0;
    }
}

// Fungsi tembak status PRO ke Supabase
window.toggleProStatus = async function(clubId, currentStatus) {
    const newStatus = !currentStatus; // Kalo true jadi false, kalo false jadi true
    try {
        const { error } = await supabaseClient
            .from('clubs')
            .update({ is_pro: newStatus })
            .eq('id', clubId);

        if (error) throw error;

        // Update state lokal biar nggak usah fetch ulang
        const cIndex = allClubs.findIndex(c => String(c.id) === String(clubId));
        if(cIndex > -1) {
            allClubs[cIndex].is_pro = newStatus;
        }
        
        renderProClubManager(); // Rerender tabel otomatis
    } catch (err) {
        alert("Gagal merubah status PRO: Cek koneksi / database.");
        console.error(err);
    }
}


// ==========================================
// LOGIKA 2: DASHBOARD TESTIMONI LAMA
// ==========================================
function getFlatTestimonials() {
    let flatList = [];
    allClubs.forEach(c => {
        if (c.testimony && Array.isArray(c.testimony)) {
            c.testimony.forEach((t, idx) => {
                flatList.push({ clubId: c.id, clubName: c.club_name, originalIndex: idx, ...t });
            });
        }
    });
    return flatList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function switchTab(tabName) {
    currentTab = tabName;
    const tabLive = document.getElementById('tabLive');
    const tabAll = document.getElementById('tabAll');

    if(!tabLive || !tabAll) return; // safety check

    const inactiveClass = "px-5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent";
    tabLive.className = inactiveClass;
    tabAll.className = inactiveClass;

    if (tabName === 'live') {
        tabLive.className = "px-5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 bg-green-100 text-green-700 border border-green-200 shadow-sm";
    } else if (tabName === 'all') {
        tabAll.className = "px-5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 bg-blue-100 text-blue-700 border border-blue-200 shadow-sm";
    }

    renderTestiTabContent();
}

function renderTestiTabContent() {
    const container = document.getElementById('testiListContainer');
    if(!container) return; // safety check

    const flatList = getFlatTestimonials();
    let displayList = currentTab === 'live' ? flatList.filter(t => t.isPublished === true) : flatList;

    if (displayList.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-10 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                <span class="text-4xl mb-3 text-slate-300">📭</span>
                <p class="text-sm text-slate-500 font-bold">Tidak ada data testimoni di kategori ini.</p>
            </div>`;
        return;
    }

    container.innerHTML = displayList.map(t => `
        <div class="p-5 md:p-6 ${t.isPublished ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-200'} border rounded-2xl relative transition-all group">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
                <div class="flex flex-col">
                    <span class="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider w-max ${t.isPublished ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}">
                        ${t.isPublished ? '🟢 Sedang Tayang di LP' : '🟡 Disimpan di Bank'}
                    </span>
                    <span class="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-wide flex items-center gap-1">
                        🏢 Klub: <span class="text-slate-800">${t.clubName}</span>
                    </span>
                </div>
                <div class="flex gap-2 w-full md:w-auto">
                    <button onclick="window.togglePublish('${t.clubId}', ${t.originalIndex})" class="flex-1 md:flex-none text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm ${t.isPublished ? 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200' : 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-700'}">
                        ${t.isPublished ? 'Tarik Turun ❌' : 'Tayangkan 🚀'}
                    </button>
                    <button onclick="window.deleteTesti('${t.clubId}', ${t.originalIndex})" class="text-xs font-bold px-3 py-2 rounded-xl bg-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors">🗑️</button>
                </div>
            </div>
            <div class="pl-2 border-l-4 ${t.isPublished ? 'border-blue-400' : 'border-slate-300'} mb-3">
                <p class="text-sm text-slate-700 italic leading-relaxed">"${t.text}"</p>
            </div>
            <p class="text-xs font-bold text-slate-900">${t.name} <span class="text-slate-400 font-normal">| ${t.role}</span></p>
        </div>
    `).join('');
}

window.togglePublish = async function(clubId, originalIndex) {
    const cIndex = allClubs.findIndex(c => String(c.id) === String(clubId));
    let currentTestimonies = allClubs[cIndex].testimony;
    currentTestimonies[originalIndex].isPublished = !currentTestimonies[originalIndex].isPublished;

    try {
        await supabaseClient.from('clubs').update({ testimony: currentTestimonies }).eq('id', clubId);
        allClubs[cIndex].testimony = currentTestimonies;
        renderTestiTabContent(); 
    } catch (err) {
        alert("Gagal memproses tayangan! Cek koneksi Anda.");
        currentTestimonies[originalIndex].isPublished = !currentTestimonies[originalIndex].isPublished;
    }
}

window.deleteTesti = async function(clubId, originalIndex) {
    if(!confirm("Hapus permanen testimoni ini dari database?")) return;
    const cIndex = allClubs.findIndex(c => String(c.id) === String(clubId));
    let currentTestimonies = allClubs[cIndex].testimony;
    currentTestimonies.splice(originalIndex, 1);

    try {
        await supabaseClient.from('clubs').update({ testimony: currentTestimonies }).eq('id', clubId);
        allClubs[cIndex].testimony = currentTestimonies;
        renderTestiTabContent(); 
    } catch (err) {
        alert("Gagal menghapus data!");
    }
}
