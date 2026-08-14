import { supabaseClient } from './supabase.js';

let allClubs = [];
let currentTab = 'live'; 

document.addEventListener('DOMContentLoaded', async () => {
    await loadClubs();

    document.getElementById('selectClub').addEventListener('change', () => {
        switchTab('club');
    });

    document.getElementById('btnSaveTesti').addEventListener('click', saveTestimony);

    document.getElementById('tabLive').addEventListener('click', () => switchTab('live'));
    document.getElementById('tabAll').addEventListener('click', () => switchTab('all'));
    document.getElementById('tabClub').addEventListener('click', () => switchTab('club'));
});

// Fungsi narik semua klub dari DB
async function loadClubs() {
    const selectClub = document.getElementById('selectClub');
    try {
        const { data, error } = await supabaseClient.from('clubs').select('id, club_name, testimony');
        if (error) throw error;
        
        allClubs = data;
        selectClub.innerHTML = '<option value="">-- Pilih Klub --</option>';
        data.forEach(c => {
            selectClub.innerHTML += `<option value="${c.id}">${c.club_name}</option>`;
        });

        renderTabContent();
    } catch (err) {
        selectClub.innerHTML = '<option value="">Gagal memuat data klub</option>';
        console.error(err);
    }
}

// Flatten array JSONB dari semua klub
function getFlatTestimonials() {
    let flatList = [];
    allClubs.forEach(c => {
        if (c.testimony && Array.isArray(c.testimony)) {
            c.testimony.forEach((t, idx) => {
                flatList.push({
                    clubId: c.id,
                    clubName: c.club_name,
                    originalIndex: idx,
                    ...t
                });
            });
        }
    });
    return flatList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function switchTab(tabName) {
    currentTab = tabName;
    const tabLive = document.getElementById('tabLive');
    const tabAll = document.getElementById('tabAll');
    const tabClub = document.getElementById('tabClub');

    const inactiveClass = "px-5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent";
    tabLive.className = inactiveClass;
    tabAll.className = inactiveClass;
    tabClub.className = inactiveClass;

    if (tabName === 'live') {
        tabLive.className = "px-5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 bg-green-100 text-green-700 border border-green-200 shadow-sm";
    } else if (tabName === 'all') {
        tabAll.className = "px-5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 bg-blue-100 text-blue-700 border border-blue-200 shadow-sm";
    } else if (tabName === 'club') {
        tabClub.className = "px-5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 bg-purple-100 text-purple-700 border border-purple-200 shadow-sm";
    }

    renderTabContent();
}

function renderTabContent() {
    const container = document.getElementById('testiListContainer');
    const flatList = getFlatTestimonials();
    let displayList = [];

    if (currentTab === 'live') {
        displayList = flatList.filter(t => t.isPublished === true);
    } else if (currentTab === 'all') {
        displayList = flatList; 
    } else if (currentTab === 'club') {
        const selectedClubId = document.getElementById('selectClub').value;
        if (!selectedClubId) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-10 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                    <span class="text-4xl mb-3">👆</span>
                    <p class="text-sm text-slate-500 font-bold">Pilih Klub di form atas terlebih dahulu.</p>
                </div>`;
            return;
        }
        displayList = flatList.filter(t => String(t.clubId) === String(selectedClubId));
    }

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

// Fungsi Simpan (Suntik) Testi ke Klub
async function saveTestimony() {
    const clubId = document.getElementById('selectClub').value;
    const text = document.getElementById('inputTesti').value.trim();
    const name = document.getElementById('inputName').value.trim();
    const role = document.getElementById('inputRole').value.trim();
    const statusMsg = document.getElementById('statusMsg');
    const btn = document.getElementById('btnSaveTesti');

    if (!clubId || !text || !name || !role) {
        statusMsg.innerText = "Semua form wajib diisi ya Bos!";
        statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-red-100 text-red-600 block mt-2";
        return;
    }

    const flatList = getFlatTestimonials();
    const isDuplicate = flatList.some(t => t.text.toLowerCase() === text.toLowerCase());
    
    if (isDuplicate) {
        statusMsg.innerText = "Ditolak: Teks testimoni ini udah pernah lu simpan di bank!";
        statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-red-100 text-red-600 block mt-2";
        return;
    }

    btn.innerText = "Menyimpan ke Bank...";
    btn.disabled = true;

    const cIndex = allClubs.findIndex(c => String(c.id) === String(clubId));
    let currentTestimonies = allClubs[cIndex].testimony || [];

    const newTesti = { text, name, role, timestamp: new Date().toISOString(), isPublished: false };
    const updatedTestimonies = [...currentTestimonies, newTesti];

    try {
        const { error } = await supabaseClient
            .from('clubs')
            .update({ testimony: updatedTestimonies })
            .eq('id', clubId);

        if (error) throw error;

        allClubs[cIndex].testimony = updatedTestimonies;

        statusMsg.innerHTML = "✅ <strong>Berhasil masuk Bank!</strong><br><span class='font-normal text-xs'>Klik tab 'Sesuai Dropdown Klub' lalu pilih 'Tayangkan' untuk upload.</span>";
        statusMsg.className = "text-sm text-center rounded-lg p-3 bg-green-100 text-green-700 block mt-3";
        
        document.getElementById('inputTesti').value = '';
        document.getElementById('inputName').value = '';
        document.getElementById('inputRole').value = '';
        
        switchTab('club');

    } catch (err) {
        statusMsg.innerText = "Gagal: " + err.message;
        statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-red-100 text-red-600 block mt-3";
    } finally {
        btn.innerHTML = "Simpan ke Bank Testi 💾";
        btn.disabled = false;
        setTimeout(() => statusMsg.classList.add('hidden'), 5000);
    }
}

// Global action: Tayangkan / Tarik Turun
window.togglePublish = async function(clubId, originalIndex) {
    const cIndex = allClubs.findIndex(c => String(c.id) === String(clubId));
    let currentTestimonies = allClubs[cIndex].testimony;

    currentTestimonies[originalIndex].isPublished = !currentTestimonies[originalIndex].isPublished;

    try {
        await supabaseClient.from('clubs').update({ testimony: currentTestimonies }).eq('id', clubId);
        allClubs[cIndex].testimony = currentTestimonies;
        renderTabContent(); 
    } catch (err) {
        alert("Gagal memproses tayangan! Cek koneksi Anda.");
        currentTestimonies[originalIndex].isPublished = !currentTestimonies[originalIndex].isPublished;
    }
}

// Global action: Hapus Data Permanen
window.deleteTesti = async function(clubId, originalIndex) {
    if(!confirm("Hapus permanen testimoni ini dari database?")) return;
    
    const cIndex = allClubs.findIndex(c => String(c.id) === String(clubId));
    let currentTestimonies = allClubs[cIndex].testimony;

    currentTestimonies.splice(originalIndex, 1);

    try {
        await supabaseClient.from('clubs').update({ testimony: currentTestimonies }).eq('id', clubId);
        allClubs[cIndex].testimony = currentTestimonies;
        renderTabContent(); 
    } catch (err) {
        alert("Gagal menghapus data!");
    }
}
