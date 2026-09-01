// SIMULASI STATE LOGIN SPONSOR (Bisa diisi fetching data users Supabase)
let currentSponsor = {
    id: 101,
    name: "Azarine Cosmetic",
    category: "beauty_skincare", // 🔥 PENTING: Untuk filter bentrok kategori
    tier: "main",                // "placement" atau "main"
    tokens: 5,
    logo_url: "https://ui-avatars.com/api/?name=AZ&background=fff&color=000",
    default_url: "https://azarinecosmetic.com/promo"
};

// Simulasi Data Event dari Database
let eventsDB = [
    { id: 1, name: "Kejurprov Jatim 2026", date: "15 Oct 2026", active_sponsors: [] },
    { id: 2, name: "Wali Kota Cup Surabaya", date: "22 Nov 2026", active_sponsors: [
        { id: 99, category: "beauty_skincare", tier: "main" } // Simulasi event ini sudah diamankan brand skincare lain
    ]},
    { id: 3, name: "Sidoarjo Fun Swimming", date: "05 Dec 2026", active_sponsors: [] },
];

let selectedEventId = null;

document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    renderEvents();

    document.getElementById('btnSaveUrl').addEventListener('click', () => {
        currentSponsor.default_url = document.getElementById('defaultUrlInput').value;
        alert("Default URL berhasil disimpan!");
    });
});

function updateUI() {
    document.getElementById('brandNameUI').innerText = currentSponsor.name;
    document.getElementById('brandCategoryUI').innerText = currentSponsor.tier === 'main' ? `Main Sponsor - ${currentSponsor.category}` : `Placement - ${currentSponsor.category}`;
    document.getElementById('brandLogoUI').src = currentSponsor.logo_url;
    document.getElementById('tokenCountUI').innerText = currentSponsor.tokens;
    document.getElementById('defaultUrlInput').value = currentSponsor.default_url;
}

function renderEvents() {
    const grid = document.getElementById('eventGrid');
    grid.innerHTML = '';

    eventsDB.forEach(ev => {
        const isAlreadyInjected = ev.active_sponsors.find(s => s.id === currentSponsor.id);

        let actionBtn = '';
        if (isAlreadyInjected) {
            actionBtn = `<button disabled class="px-4 py-2 bg-emerald-900/30 border border-emerald-500/50 text-emerald-400 font-bold rounded-lg text-xs cursor-not-allowed">✅ Sudah Live</button>`;
        } else {
            actionBtn = `<button onclick="openInjectModal(${ev.id}, '${ev.name}')" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow">Suntik Event</button>`;
        }

        grid.innerHTML += `
            <div class="bg-slate-800/40 border border-slate-700 p-5 rounded-2xl flex justify-between items-center hover:border-slate-500 transition-colors">
                <div>
                    <h3 class="font-black text-white text-lg">${ev.name}</h3>
                    <p class="text-xs text-slate-400 mt-1">🗓️ ${ev.date}</p>
                </div>
                <div>${actionBtn}</div>
            </div>
        `;
    });
}

window.openInjectModal = function(id, name) {
    if (currentSponsor.tokens <= 0) {
        alert("Token Anda habis! Silakan hubungi admin untuk Top-Up.");
        return;
    }
    
    selectedEventId = id;
    document.getElementById('modalEventName').innerText = name;
    document.getElementById('modalUrlInput').value = currentSponsor.default_url;
    
    // Tampilkan Modal
    document.getElementById('injectModal').classList.remove('hidden');
    document.getElementById('injectModal').classList.add('flex');
}

window.closeModal = function() {
    document.getElementById('injectModal').classList.add('hidden');
    document.getElementById('injectModal').classList.remove('flex');
    selectedEventId = null;
}

document.getElementById('btnConfirmInject').addEventListener('click', () => {
    const ev = eventsDB.find(e => e.id === selectedEventId);
    
    // ==========================================
    // 👑 LOGIKA CATEGORY EXCLUSIVITY GATEKEEPER
    // ==========================================
    if (currentSponsor.tier === 'main') {
        // Cek apakah di event ini ada main sponsor lain dari kategori yang sama
        const conflict = ev.active_sponsors.find(s => s.category === currentSponsor.category && s.tier === 'main');
        
        if (conflict) {
            alert(`EXCLUSIVITY REJECTED 🛑\n\nKategori "${currentSponsor.category}" sudah diamankan oleh Main Sponsor lain di event ini. Garansi Category Exclusivity berlaku. Silakan pilih event lain.`);
            closeModal();
            return;
        }
    }

    // ==========================================
    // ✅ EKSEKUSI INJEKSI (Pengurangan Token)
    // ==========================================
    
    // 1. Kurangi Token
    currentSponsor.tokens -= 1;
    
    // 2. Update Array (Kalau real, eksekusi Supabase Update 'event_sponsors' di sini)
    ev.active_sponsors.push({
        id: currentSponsor.id,
        category: currentSponsor.category,
        tier: currentSponsor.tier,
        injected_url: document.getElementById('modalUrlInput').value
    });

    // 3. Refresh UI
    updateUI();
    renderEvents();
    closeModal();
    
    alert("🎉 SUNTIKAN BERHASIL! Logo brand Anda langsung live di sistem SCS Event ini.");
});
