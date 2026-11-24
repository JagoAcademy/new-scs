import { supabaseClient } from './supabase.js';

// Variabel Global untuk Pagination Club
let currentClubPage = 1;
const clubsPerPage = 10;
let filteredClubsAdmin = [];

// Variabel Global untuk Pagination Atlet Tanpa Klub
let currentUnboundPage = 1;
const unboundPerPage = 10;
let filteredUnboundAthletes = [];

// Variabel Global untuk Pagination Events (God Mode)
let currentEventsGodPage = 1;
const eventsGodPerPage = 10;
let filteredEventsGod = [];

// State Modal God Mode Club
let activeGodClub = null;
let activeGodClubAthletes = [];

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', async () => {
    // ==========================================
    // 🪤 1. THE AZTEC SECRET (JEBAKAN BATMAN)
    // ==========================================
    if (sessionStorage.getItem('aztec_key') !== 'buka_sesame') {
        tendangUser();
        return;
    }

    // ==========================================
    // 🛡️ 2. TRUE SERVER-SIDE AUTH VERIFICATION
    // ==========================================
    const { data: { user }, error } = await supabaseClient.auth.getUser();

    if (error || !user) {
        window.location.replace('/auth.html');
        return;
    }

    // Daftar email dewa (Super Admin)
    const allowedAdmins = [
        'radityaraja@gmail.com',
        'fajar@f1swimming.com',
        'jagorenangakademi@gmail.com',
        'indra@f1swimming.com',
        'donybaktiar.me@gmail.com'
    ];

    // Kalau email user tidak ada di dalam daftar dewa, tendang!
    if (!allowedAdmins.includes(user.email)) {
        tendangUserAsing(user.email);
        return;
    }

    document.getElementById('btnAdminLogout').addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.replace('/auth.html');
    });

    loadAdminData();

    // ==========================================
    // 🔍 3. EVENT LISTENER SEARCH & PAGINATION CLUB
    // ==========================================
    const searchClubInput = document.getElementById('searchClub');
    if (searchClubInput) {
        searchClubInput.addEventListener('input', (e) => {
            const keyword = e.target.value.toLowerCase();
            if (!window.allClubsAdmin) return;
            
            filteredClubsAdmin = window.allClubsAdmin.filter(c => 
                (c.club_name && c.club_name.toLowerCase().includes(keyword)) ||
                (c.coach_name && c.coach_name.toLowerCase().includes(keyword)) ||
                (c.kota_asal && c.kota_asal.toLowerCase().includes(keyword)) ||
                (c.provinsi && c.provinsi.toLowerCase().includes(keyword))
            );
            
            currentClubPage = 1;
            renderClubs(filteredClubsAdmin);
        });
    }

    const btnPrev = document.getElementById('btnPrevClub');
    const btnNext = document.getElementById('btnNextClub');
    
    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            if (currentClubPage > 1) {
                currentClubPage--;
                renderClubs(filteredClubsAdmin);
            }
        });
    }
    
    if (btnNext) {
        btnNext.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredClubsAdmin.length / clubsPerPage);
            if (currentClubPage < totalPages) {
                currentClubPage++;
                renderClubs(filteredClubsAdmin);
            }
        });
    }

    // ==========================================
    // 🔗 4. EVENT LISTENER SEARCH & PAGINATION UNBOUND ATHLETES
    // ==========================================
    const searchUnboundInput = document.getElementById('searchUnboundAthlete');
    if (searchUnboundInput) {
        searchUnboundInput.addEventListener('input', (e) => {
            const keyword = e.target.value.toLowerCase();
            if (!window.allUnboundAthletes) return;

            filteredUnboundAthletes = window.allUnboundAthletes.filter(a =>
                (a.full_name && a.full_name.toLowerCase().includes(keyword)) ||
                (a.f1_id && a.f1_id.toLowerCase().includes(keyword))
            );

            currentUnboundPage = 1;
            renderUnboundAthletes(filteredUnboundAthletes);
        });
    }

    const btnPrevUnbound = document.getElementById('btnPrevUnbound');
    const btnNextUnbound = document.getElementById('btnNextUnbound');

    if (btnPrevUnbound) {
        btnPrevUnbound.addEventListener('click', () => {
            if (currentUnboundPage > 1) {
                currentUnboundPage--;
                renderUnboundAthletes(filteredUnboundAthletes);
            }
        });
    }

    if (btnNextUnbound) {
        btnNextUnbound.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredUnboundAthletes.length / unboundPerPage);
            if (currentUnboundPage < totalPages) {
                currentUnboundPage++;
                renderUnboundAthletes(filteredUnboundAthletes);
            }
        });
    }

    // ==========================================
    // 🏆 5. EVENT LISTENER SEARCH & PAGINATION ALL EVENTS (GOD MODE)
    // ==========================================
    const searchEventGodInput = document.getElementById('searchEventGod');
    if (searchEventGodInput) {
        searchEventGodInput.addEventListener('input', (e) => {
            const kw = e.target.value.toLowerCase();
            if (!window.allEventsGod) return;
            filteredEventsGod = window.allEventsGod.filter(ev =>
                (ev.event_name && ev.event_name.toLowerCase().includes(kw)) ||
                (ev.subdomain && ev.subdomain.toLowerCase().includes(kw)) ||
                (ev.kota && ev.kota.toLowerCase().includes(kw))
            );
            currentEventsGodPage = 1;
            renderEventsGod(filteredEventsGod);
        });
    }

    const btnPrevEv = document.getElementById('btnPrevEventsGod');
    const btnNextEv = document.getElementById('btnNextEventsGod');
    if (btnPrevEv) {
        btnPrevEv.addEventListener('click', () => {
            if (currentEventsGodPage > 1) {
                currentEventsGodPage--;
                renderEventsGod(filteredEventsGod);
            }
        });
    }
    if (btnNextEv) {
        btnNextEv.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredEventsGod.length / eventsGodPerPage);
            if (currentEventsGodPage < totalPages) {
                currentEventsGodPage++;
                renderEventsGod(filteredEventsGod);
            }
        });
    }

    // ==========================================
    // ⚡ 6. EVENT LISTENER MODAL GOD MODE CLUB
    // ==========================================
    const btnCloseModal = document.getElementById('btnCloseGodClubModal');
    const modalGodClub = document.getElementById('modalGodClub');
    if (btnCloseModal && modalGodClub) {
        btnCloseModal.addEventListener('click', () => {
            modalGodClub.classList.add('hidden');
            activeGodClub = null;
        });
    }

    const btnOpenDashModal = document.getElementById('btnGodOpenDashboardFromModal');
    if (btnOpenDashModal) {
        btnOpenDashModal.addEventListener('click', () => {
            if (activeGodClub) window.openClubDashboardGodMode(activeGodClub.id);
        });
    }

    const btnToggleTier = document.getElementById('btnGodToggleClubTier');
    if (btnToggleTier) {
        btnToggleTier.addEventListener('click', async () => {
            if (!activeGodClub) return;
            const currentIsPro = activeGodClub.event_tier === 'PRO';
            const nextTier = currentIsPro ? 'BASIC' : 'PRO';
            if (!confirm(`Ubah kasta klub "${activeGodClub.club_name}" menjadi ${nextTier}?`)) return;

            try {
                const { error } = await supabaseClient
                    .from('clubs')
                    .update({ event_tier: nextTier })
                    .eq('id', activeGodClub.id);
                if (error) throw error;

                activeGodClub.event_tier = nextTier;
                updateGodModalTierButton();
                await loadAdminData();
                alert(`✅ Kasta klub berhasil diubah menjadi ${nextTier}!`);
            } catch (err) {
                alert("Gagal ubah tier klub: " + err.message);
            }
        });
    }

    const btnSaveClubInfo = document.getElementById('btnGodSaveClubInfo');
    if (btnSaveClubInfo) {
        btnSaveClubInfo.addEventListener('click', async () => {
            if (!activeGodClub) return;
            const payload = {
                club_name: document.getElementById('godEditClubName').value.trim(),
                short_name: document.getElementById('godEditShortName').value.trim(),
                coach_name: document.getElementById('godEditCoachName').value.trim(),
                contact_wa: document.getElementById('godEditContactWa').value.trim(),
                kota_asal: document.getElementById('godEditKota').value.trim(),
                provinsi: document.getElementById('godEditProvinsi').value.trim()
            };
            if (!payload.club_name) return alert("Nama klub wajib diisi!");

            btnSaveClubInfo.disabled = true;
            btnSaveClubInfo.innerText = "⏳ Menyimpan...";
            try {
                const { error } = await supabaseClient
                    .from('clubs')
                    .update(payload)
                    .eq('id', activeGodClub.id);
                if (error) throw error;

                Object.assign(activeGodClub, payload);
                document.getElementById('godModalClubTitle').innerText = payload.club_name;
                await loadAdminData();
                alert("✅ Profil klub berhasil diperbarui!");
            } catch (err) {
                alert("Gagal menyimpan profil klub: " + err.message);
            } finally {
                btnSaveClubInfo.disabled = false;
                btnSaveClubInfo.innerText = "💾 Simpan Perubahan Klub";
            }
        });
    }

    const inputSearchClubAthlete = document.getElementById('godSearchClubAthlete');
    if (inputSearchClubAthlete) {
        inputSearchClubAthlete.addEventListener('input', (e) => {
            const kw = e.target.value.toLowerCase();
            const filtered = activeGodClubAthletes.filter(a =>
                (a.full_name && a.full_name.toLowerCase().includes(kw)) ||
                (a.f1_id && a.f1_id.toLowerCase().includes(kw))
            );
            renderGodClubAthletes(filtered);
        });
    }
});

function tendangUserAsing(email) {
    document.body.innerHTML = `
        <div style="height:100vh;width:100vw;display:flex;flex-direction:column;align-items:center;justify-content:center;background-color:#0f172a;color:#f87171;font-family:sans-serif;text-align:center;position:fixed;top:0;left:0;z-index:999999;">
            <span style="font-size:6rem;margin-bottom:20px;">🛑</span>
            <h1 style="font-size:2rem;font-weight:900;text-transform:uppercase;margin-bottom:10px;">Akses Ditolak!</h1>
            <p style="color:#94a3b8;">Sistem mendeteksi email Anda (${email}) tidak terotorisasi.</p>
        </div>`;
    setTimeout(() => window.location.replace('/dashboard.html'), 3000);
}

function tendangUser() {
    document.body.innerHTML = `
        <div style="height:100vh;width:100vw;display:flex;flex-direction:column;align-items:center;justify-content:center;background-color:#0f172a;color:#f87171;font-family:sans-serif;text-align:center;position:fixed;top:0;left:0;z-index:999999;">
            <span style="font-size:6rem;margin-bottom:20px;">🗿</span>
            <h1 style="font-size:3rem;font-weight:900;text-transform:uppercase;">Boss Pintunya ga disini 🤣</h1>
        </div>`;
    setTimeout(() => window.location.replace('/dashboard.html'), 2500);
}

async function loadAdminData() {
    try {
        // --- 0. TARIK DATA TRANSAKSI UPGRADE PRO ---
        await loadUpgradeRequests();

        // --- A. TARIK DATA ANTREAN VERIFIKASI AWAL ---
        const { data: queues, error: errQ } = await supabaseClient
            .from('athletes')
            .select('*, clubs(club_name)')
            .eq('is_verified', false)
            .not('foto_url', 'is', null)
            .not('akta_url', 'is', null);
        if (errQ) throw errQ;
        renderQueues(queues);

        // --- B. TARIK DATA EDIT REQUESTS ---
        const { data: edits, error: errEdits } = await supabaseClient
            .from('f1_edit_requests')
            .select('*, athletes (full_name, dob, gender, clubs(club_name))')
            .eq('status', 'PENDING')
            .order('created_at', { ascending: false });
        if (errEdits) throw errEdits;
        renderEditQueues(edits);

        // --- C. TARIK DATA FULL CLUB MANAGER ---
        const { data: clubs, error: errC } = await supabaseClient
            .from('clubs')
            .select('*') 
            .order('id', { ascending: false });
        if (errC) throw errC;

        const clubsWithCount = await Promise.all(clubs.map(async (club) => {
            const { count, error: countErr } = await supabaseClient
                .from('athletes')
                .select('*', { count: 'exact', head: true })
                .eq('club_id', club.id);
            
            return { 
                ...club, 
                athlete_count: countErr ? 0 : (count || 0) 
            };
        }));

        window.allClubsAdmin = clubsWithCount || [];
        filteredClubsAdmin = [...window.allClubsAdmin];
        currentClubPage = 1;
        renderClubs(filteredClubsAdmin);

        // --- D. TARIK DATA ATLET BELUM TERIKAT CLUB ---
        const { data: unbound, error: errUnbound } = await supabaseClient
            .from('athletes')
            .select('*')
            .is('club_id', null)
            .order('full_name', { ascending: true });
        if (errUnbound) throw errUnbound;

        window.allUnboundAthletes = unbound || [];
        filteredUnboundAthletes = [...window.allUnboundAthletes];
        currentUnboundPage = 1;
        renderUnboundAthletes(filteredUnboundAthletes);

        // --- E. TARIK DATA ALL EVENTS (GOD MODE) ---
        const { data: allEvents, error: errEvents } = await supabaseClient
            .from('events')
            .select('*')
            .order('id', { ascending: false });
        if (!errEvents) {
            window.allEventsGod = allEvents || [];
            filteredEventsGod = [...window.allEventsGod];
            renderEventsGod(filteredEventsGod);
        }

    } catch (error) {
        console.error("Gagal memuat admin:", error);
    }
}

// Render Antrian Transaksi Upgrade PRO
async function loadUpgradeRequests() {
    const tbody = document.getElementById('upgradeQueueTableBody');
    try {
        const { data: upgrades, error } = await supabaseClient
            .from('event_transactions')
            .select('*, events(event_name)')
            .eq('status', 'PENDING')
            .order('created_at', { ascending: false });
        
        if (error) throw error;

        document.getElementById('badgeUpgradeQueue').innerText = `${upgrades ? upgrades.length : 0} Pending`;

        if (!upgrades || upgrades.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-slate-500 font-bold">Tidak ada pengajuan bayar PRO baru. Server aman! ☕</td></tr>`;
            return;
        }

        let html = '';
        upgrades.forEach(u => {
            const eventName = u.events?.event_name || 'Event ID: ' + u.event_id;
            const formattedNominal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(u.nominal);
            
            html += `
                <tr class="hover:bg-slate-800 transition-colors">
                    <td class="p-4">
                        <p class="font-extrabold text-white text-base">${eventName}</p>
                        <p class="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Trans ID: #${u.id} • ${u.jenis_transaksi}</p>
                    </td>
                    <td class="p-4">
                        <span class="text-sm font-black text-amber-400 bg-amber-900/30 px-3 py-1.5 rounded-lg border border-amber-700/50 shadow-inner">${formattedNominal}</span>
                    </td>
                    <td class="p-4">
                        <a href="${u.bukti_url}" target="_blank" class="px-4 py-2 bg-blue-900/50 text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition border border-blue-800 inline-flex items-center gap-2">
                            <span>📄</span> Cek Struk
                        </a>
                    </td>
                    <td class="p-4 text-center space-x-2">
                        <button onclick="rejectUpgrade(${u.id})" class="px-4 py-2 bg-slate-700 hover:bg-red-600 text-white font-bold rounded-lg text-xs shadow-lg transition">TOLAK</button>
                        <button onclick="approveUpgrade(${u.id}, ${u.event_id}, '${eventName}')" class="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black rounded-lg text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)] transition transform hover:scale-105">✅ AKTIFKAN PRO</button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    } catch (err) {
        console.error("Gagal load upgrade requests:", err);
        tbody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-red-500 font-bold">Error memuat transaksi: ${err.message}</td></tr>`;
    }
}

// Logic Dewa Setuju Upgrade (HANYA UPDATE event_tier)
window.approveUpgrade = async (trans_id, event_id, event_name) => {
    if (!confirm(`Yakin ingin ACC pembayaran dan mengaktifkan kasta PRO/EMAS untuk event:\n\n👉 ${event_name}\n\nPastikan uang sudah masuk mutasi BCA!`)) return;
    
    try {
        const { error: errTrans } = await supabaseClient
            .from('event_transactions')
            .update({ status: 'APPROVED' })
            .eq('id', trans_id);
        if (errTrans) throw errTrans;

        const { error: errEvent } = await supabaseClient
            .from('events')
            .update({ event_tier: 'PRO' })
            .eq('id', event_id);
        if (errEvent) throw errEvent;

        alert(`✅ BOOM! Transaksi sukses di-ACC.\nEvent "${event_name}" resmi menjadi PRO/EMAS!`);
        loadAdminData();
    } catch (err) {
        alert("Gagal menyetujui: " + err.message);
    }
};

// Logic Dewa Tolak Upgrade
window.rejectUpgrade = async (trans_id) => {
    if (!confirm(`Yakin ingin MENOLAK bukti bayar ini? Transaksi akan dibatalkan.`)) return;
    try {
        const { error } = await supabaseClient
            .from('event_transactions')
            .update({ status: 'REJECTED' })
            .eq('id', trans_id);
        if (error) throw error;
        
        loadAdminData();
    } catch (err) {
        alert("Gagal menolak transaksi: " + err.message);
    }
};

// Render Antrian Awal
function renderQueues(queues) {
    const tbody = document.getElementById('queueTableBody');
    document.getElementById('badgeQueue').innerText = `${queues ? queues.length : 0} Pending`;

    if (!queues || queues.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-slate-500 font-bold">Tidak ada antrian verifikasi awal.</td></tr>`;
        return;
    }

    let html = '';
    queues.forEach(q => {
        const clubDisplay = q.clubs?.club_name 
            ? `<span class="text-slate-300 font-medium">${q.clubs.club_name}</span>`
            : `<span class="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded text-[10px] font-bold">⚠️ Tanpa Klub</span>`;
        html += `
            <tr class="hover:bg-slate-800 transition-colors">
                <td class="p-4">
                    <p class="font-extrabold text-white">${q.full_name}</p>
                    <p class="text-xs font-mono text-emerald-400 mt-0.5">${q.f1_id}</p>
                </td>
                <td class="p-4">${clubDisplay}</td>
                <td class="p-4">
                    <div class="flex gap-2">
                        <a href="${q.foto_url}" target="_blank" class="px-2 py-1 bg-blue-900/50 text-blue-400 rounded text-[10px] font-bold hover:bg-blue-900 transition border border-blue-800">📸 Lihat Foto</a>
                        <a href="${q.akta_url}" target="_blank" class="px-2 py-1 bg-purple-900/50 text-purple-400 rounded text-[10px] font-bold hover:bg-purple-900 transition border border-purple-800">📄 Lihat Akta</a>
                    </div>
                </td>
                <td class="p-4 text-center">
                    <button onclick="approveAthlete('${q.f1_id}')" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-lg transition transform hover:scale-105">✅ APPROVE</button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// Render Edit Requests
function renderEditQueues(edits) {
    const tbody = document.getElementById('editQueueTableBody');
    document.getElementById('badgeEditQueue').innerText = `${edits ? edits.length : 0} Pending`;

    if (!edits || edits.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-500 font-bold">Tidak ada usulan perubahan data. Server aman! ☕</td></tr>`;
        return;
    }

    let html = '';
    edits.forEach(e => {
        const oldData = e.athletes || {}; 
        const clubName = oldData?.clubs?.club_name || 'Tanpa Klub';
        
        html += `
            <tr class="hover:bg-slate-800 transition-colors">
                <td class="p-4">
                    <p class="font-mono font-bold text-amber-400">${e.f1_id}</p>
                    <p class="text-[10px] text-slate-500 mt-1">${clubName}</p>
                </td>
                <td class="p-4 bg-red-950/20 border-r border-slate-700">
                    <p class="text-sm font-bold text-slate-300 line-through">${oldData.full_name || 'N/A'}</p>
                    <p class="text-xs text-slate-500 mt-0.5">${oldData.gender || 'N/A'} • ${oldData.dob || 'N/A'}</p>
                </td>
                <td class="p-4 bg-emerald-950/20">
                    <p class="text-sm font-extrabold text-emerald-400">${e.new_name}</p>
                    <p class="text-xs text-emerald-600 mt-0.5">${e.new_gender} • ${e.new_dob}</p>
                </td>
                <td class="p-4">
                    <a href="${e.new_akta_url}" target="_blank" class="px-3 py-1.5 bg-purple-900/50 text-purple-400 rounded text-[10px] font-bold hover:bg-purple-900 transition border border-purple-800 inline-block">📄 Cek Akta</a>
                </td>
                <td class="p-4 text-center space-x-2">
                    <button onclick="rejectEdit(${e.id})" class="px-3 py-1.5 bg-slate-700 hover:bg-red-600 text-white font-bold rounded-lg text-xs shadow-lg transition">TOLAK</button>
                    <button onclick="approveEdit(${e.id}, '${e.f1_id}', '${e.new_name}', '${e.new_dob}', '${e.new_gender}', '${e.new_foto_url}', '${e.new_akta_url}')" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-lg transition transform hover:scale-105">✅ ACC</button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// Render Atlet Belum Terikat Club
function renderUnboundAthletes(athletesArray) {
    const tbody = document.getElementById('unboundAthleteTableBody');
    const badge = document.getElementById('badgeUnboundQueue');
    const infoCount = document.getElementById('unboundCountInfo');
    const btnPrev = document.getElementById('btnPrevUnbound');
    const btnNext = document.getElementById('btnNextUnbound');
    const pageInfo = document.getElementById('pageInfoUnbound');

    const totalAllUnbound = window.allUnboundAthletes ? window.allUnboundAthletes.length : 0;
    if (badge) badge.innerText = `${totalAllUnbound} Atlet`;

    if (!athletesArray || athletesArray.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-500 font-bold">Semua atlet sudah terikat ke club! 🎉</td></tr>`;
        if (infoCount) infoCount.innerText = "Menampilkan 0 atlet tanpa klub.";
        if (btnPrev) btnPrev.disabled = true;
        if (btnNext) btnNext.disabled = true;
        if (pageInfo) pageInfo.innerText = "Page 1 of 1";
        return;
    }

    const totalPages = Math.ceil(athletesArray.length / unboundPerPage);
    if (currentUnboundPage > totalPages) currentUnboundPage = totalPages;
    if (currentUnboundPage < 1) currentUnboundPage = 1;

    const startIndex = (currentUnboundPage - 1) * unboundPerPage;
    const endIndex = startIndex + unboundPerPage;
    const displayAthletes = athletesArray.slice(startIndex, endIndex);

    // Urutkan daftar klub A-Z untuk dropdown agar mudah dicari
    const sortedClubs = [...(window.allClubsAdmin || [])].sort((a, b) =>
        (a.club_name || '').localeCompare(b.club_name || '')
    );

    const clubOptionsHtml = sortedClubs.map(c => {
        const kotaTag = c.kota_asal ? ` (${c.kota_asal})` : '';
        return `<option value="${c.id}">${c.club_name}${kotaTag}</option>`;
    }).join('');

    let html = '';
    displayAthletes.forEach((a, index) => {
        const actualIndex = startIndex + index + 1;
        const statusBadge = a.is_verified
            ? `<span class="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded text-[10px] font-black uppercase tracking-wider">👑 Verified</span>`
            : `<span class="px-2.5 py-1 bg-slate-700/60 text-slate-400 border border-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">⏳ Pending</span>`;

        html += `
            <tr class="hover:bg-slate-700/40 transition-colors">
                <td class="p-4 text-center text-slate-500 font-bold">${actualIndex}</td>
                <td class="p-4">
                    <a href="/f1-id.html?id=${a.f1_id}" target="_blank" class="font-extrabold text-white hover:text-cyan-400 transition-colors">${a.full_name}</a>
                    <div class="flex items-center gap-2 mt-0.5 text-xs">
                        <span class="font-mono text-cyan-400 font-bold">${a.f1_id}</span>
                        <span class="text-slate-600">•</span>
                        <span class="text-slate-400">${a.gender || '-'} (${a.dob || '-'})</span>
                    </div>
                </td>
                <td class="p-4 text-center">${statusBadge}</td>
                <td class="p-4">
                    <select id="clubSelect_${a.f1_id}" class="bg-slate-900 border border-slate-600 text-xs font-bold rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full min-w-[220px] p-2.5 text-white">
                        <option value="">-- Pilih Club Tujuan --</option>
                        ${clubOptionsHtml}
                    </select>
                </td>
                <td class="p-4 text-center">
                    <button id="btnLink_${a.f1_id}" onclick="linkAthleteToClub('${a.f1_id}')" class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black rounded-lg text-xs shadow-lg transition transform hover:scale-105">
                        🔗 Tautkan
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;

    if (infoCount) {
        const endDisplay = Math.min(endIndex, athletesArray.length);
        infoCount.innerText = `Menampilkan ${startIndex + 1}-${endDisplay} dari total ${athletesArray.length} atlet tanpa klub.`;
    }
    if (pageInfo) pageInfo.innerText = `Page ${currentUnboundPage} of ${totalPages}`;
    if (btnPrev) btnPrev.disabled = currentUnboundPage === 1;
    if (btnNext) btnNext.disabled = currentUnboundPage === totalPages;
}

// Eksekusi Tautkan Atlet ke Club Terdaftar
window.linkAthleteToClub = async (f1Id) => {
    const selectEl = document.getElementById(`clubSelect_${f1Id}`);
    const btnEl = document.getElementById(`btnLink_${f1Id}`);
    if (!selectEl) return;

    const selectedClubId = selectEl.value;
    if (!selectedClubId) {
        alert("Pilih club tujuan terlebih dahulu!");
        selectEl.focus();
        return;
    }

    const targetClub = (window.allClubsAdmin || []).find(c => String(c.id) === String(selectedClubId));
    const targetAthlete = (window.allUnboundAthletes || []).find(a => a.f1_id === f1Id);

    if (!targetClub) {
        alert("Data club tidak ditemukan. Coba muat ulang halaman.");
        return;
    }

    const athleteLabel = targetAthlete ? `${targetAthlete.full_name} (${f1Id})` : f1Id;
    if (!confirm(`Yakin ingin menautkan atlet:\n\n🏊 ${athleteLabel}\n\nKe dalam club:\n🏢 ${targetClub.club_name}?`)) return;

    if (btnEl) {
        btnEl.disabled = true;
        btnEl.innerText = "⏳ Menautkan...";
    }

    try {
        const { error } = await supabaseClient
            .from('athletes')
            .update({
                club_id: targetClub.id,
                owner_id: targetClub.owner_id || null
            })
            .eq('f1_id', f1Id);

        if (error) throw error;

        alert(`✅ Berhasil! ${athleteLabel} kini resmi terdaftar di ${targetClub.club_name}.`);
        loadAdminData();
    } catch (err) {
        alert("Gagal menautkan atlet: " + err.message);
        if (btnEl) {
            btnEl.disabled = false;
            btnEl.innerText = "🔗 Tautkan";
        }
    }
};

function renderClubs(clubsArray) {
    const tbody = document.getElementById('clubTableBody');
    const infoCount = document.getElementById('clubCountInfo');
    const btnPrev = document.getElementById('btnPrevClub');
    const btnNext = document.getElementById('btnNextClub');
    const pageInfo = document.getElementById('pageInfoClub');
    
    if (!clubsArray || clubsArray.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-500 font-bold">Tidak ada klub ditemukan.</td></tr>`;
        if (infoCount) infoCount.innerText = "Menampilkan 0 klub.";
        if (btnPrev) btnPrev.disabled = true;
        if (btnNext) btnNext.disabled = true;
        if (pageInfo) pageInfo.innerText = "Page 1 of 1";
        return;
    }

    const totalPages = Math.ceil(clubsArray.length / clubsPerPage);
    if (currentClubPage > totalPages) currentClubPage = totalPages;
    if (currentClubPage < 1) currentClubPage = 1;

    const startIndex = (currentClubPage - 1) * clubsPerPage;
    const endIndex = startIndex + clubsPerPage;
    const displayClubs = clubsArray.slice(startIndex, endIndex);
    
    let html = '';
    displayClubs.forEach((c, index) => {
        const actualIndex = startIndex + index + 1; 
        const location = c.kota_asal ? `${escapeHtml(c.kota_asal)}, ${escapeHtml(c.provinsi || '')}` : (escapeHtml(c.provinsi) || 'Belum diatur');
        const athleteCount = c.athlete_count || 0; 
        
        const isPro = c.event_tier === 'PRO';
        const badgeAkun = isPro 
            ? `<span class="px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded text-[10px] font-black tracking-widest uppercase">PRO</span>` 
            : `<span class="px-2 py-1 bg-slate-700/50 text-slate-400 border border-slate-600 rounded text-[10px] font-bold tracking-widest uppercase">BASIC</span>`;

        html += `
            <tr class="hover:bg-slate-700/50 transition-colors">
                <td class="p-4 text-center text-slate-500 font-bold">${actualIndex}</td>
                <td class="p-4">
                    <p class="font-extrabold text-white">${escapeHtml(c.club_name)}</p>
                    <p class="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">${escapeHtml(c.short_name) || 'NO-TAG'} • ID #${c.id}</p>
                </td>
                <td class="p-4 text-center font-mono font-bold text-emerald-400">${athleteCount} Atlet</td>
                <td class="p-4 text-slate-400 text-xs">${location}</td>
                <td class="p-4 text-slate-300 font-bold flex items-center gap-2">
                    <span class="text-lg">👤</span> ${escapeHtml(c.coach_name) || 'Belum diisi'}
                </td>
                <td class="p-4 text-center">${badgeAkun}</td>
                <td class="p-4 text-center">
                    <div class="inline-flex items-center gap-1.5">
                        <button onclick="openGodClubModal('${c.id}')" class="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 font-black rounded-lg text-xs transition">
                            ⚡ Kelola
                        </button>
                        <button onclick="openClubDashboardGodMode('${c.id}')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg text-xs shadow transition">
                            👁️ Dashboard
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    if (infoCount) {
        const endDisplay = Math.min(endIndex, clubsArray.length);
        infoCount.innerText = `Menampilkan ${startIndex + 1}-${endDisplay} dari total ${clubsArray.length} klub.`;
    }
    
    if (pageInfo) pageInfo.innerText = `Page ${currentClubPage} of ${totalPages}`;
    if (btnPrev) btnPrev.disabled = currentClubPage === 1;
    if (btnNext) btnNext.disabled = currentClubPage === totalPages;
}

window.approveAthlete = async (f1_id) => {
    if (!confirm(`Yakin ingin ACC aktivasi F1 ID: ${f1_id}?`)) return;
    try {
        const { error } = await supabaseClient.from('athletes').update({ is_verified: true }).eq('f1_id', f1_id);
        if (error) throw error;
        alert("Boom! F1 ID berhasil diaktifkan.");
        loadAdminData(); 
    } catch (err) {
        alert("Gagal ACC: " + err.message);
    }
}

window.approveEdit = async (id, f1_id, new_name, new_dob, new_gender, new_foto_url, new_akta_url) => {
    if (!confirm(`Yakin ACC revisi untuk ${f1_id}? Sistem akan DITIMPA & F1 ID akan di-update otomatis!`)) return;

    try {
        let updated_f1_id = f1_id; 
        const newYearStr = new_dob.split('-')[0];
        
        if (newYearStr && newYearStr.length === 4) {
            const newYearCode = newYearStr.substring(2, 4);
            const uniqueSuffix = f1_id.substring(5);
            updated_f1_id = `F1-${newYearCode}${uniqueSuffix}`;
        }

        const namaSultan = `${new_name} 👑`;

        const { error: errUpdate } = await supabaseClient
            .from('athletes')
            .update({
                f1_id: updated_f1_id,  
                full_name: namaSultan, 
                dob: new_dob,
                gender: new_gender,
                foto_url: new_foto_url,
                akta_url: new_akta_url,
                is_verified: true
            })
            .eq('f1_id', f1_id);

        if (errUpdate) throw errUpdate;

        const { error: errQueue } = await supabaseClient
            .from('f1_edit_requests')
            .update({ status: 'APPROVED' })
            .eq('id', id);

        if (errQueue) throw errQueue;

        alert(`BAM! Data berhasil diubah!\nF1 ID otomatis di-update menjadi: ${updated_f1_id} 👑`);
        loadAdminData(); 
    } catch (err) {
        console.error(err);
        alert("Gagal ACC Edit: " + err.message);
    }
}

window.rejectEdit = async (id) => {
    if (!confirm(`Tolak pengajuan perubahan data ini?`)) return;
    try {
        const { error } = await supabaseClient.from('f1_edit_requests').update({ status: 'REJECTED' }).eq('id', id);
        if (error) throw error;
        loadAdminData();
    } catch (err) {
        alert("Gagal menolak: " + err.message);
    }
}


// ==========================================
// ⚡ GOD MODE FUNCTIONS (CLUB & EVENTS)
// ==========================================
window.openClubDashboardGodMode = (clubId) => {
    const club = (window.allClubsAdmin || []).find(c => String(c.id) === String(clubId));
    if (!club) return alert("Data klub tidak ditemukan.");

    sessionStorage.setItem('scs_god_club_id', String(club.id));
    sessionStorage.setItem('aztec_key', 'buka_sesame');
    window.open(`/dashboard.html?god_club_id=${encodeURIComponent(club.id)}`, '_blank');
};

function updateGodModalTierButton() {
    const btn = document.getElementById('btnGodToggleClubTier');
    if (!btn || !activeGodClub) return;
    const isPro = activeGodClub.event_tier === 'PRO';
    if (isPro) {
        btn.className = "px-4 py-2 bg-slate-700 hover:bg-slate-600 text-amber-300 border border-amber-500/40 font-black rounded-xl text-xs shadow transition";
        btn.innerText = "Status: PRO 👑 (Klik ubah ke BASIC)";
    } else {
        btn.className = "px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow transition";
        btn.innerText = "Status: BASIC (Klik Upgrade PRO ⚡)";
    }
}

window.openGodClubModal = async (clubId) => {
    const club = (window.allClubsAdmin || []).find(c => String(c.id) === String(clubId));
    if (!club) return alert("Data klub tidak ditemukan.");

    activeGodClub = { ...club };
    const modal = document.getElementById('modalGodClub');
    if (!modal) return;

    document.getElementById('godModalClubIdTag').innerText = `ID #${club.id}`;
    document.getElementById('godModalClubTitle').innerText = club.club_name || 'Detail Klub';
    document.getElementById('godEditClubName').value = club.club_name || '';
    document.getElementById('godEditShortName').value = club.short_name || '';
    document.getElementById('godEditCoachName').value = club.coach_name || '';
    document.getElementById('godEditContactWa').value = club.contact_wa || '';
    document.getElementById('godEditKota').value = club.kota_asal || '';
    document.getElementById('godEditProvinsi').value = club.provinsi || '';
    document.getElementById('godSearchClubAthlete').value = '';
    updateGodModalTierButton();

    const listEl = document.getElementById('godClubAthletesList');
    listEl.innerHTML = '<p class="p-4 text-center text-xs text-slate-400">Memuat atlet klub...</p>';
    modal.classList.remove('hidden');

    try {
        const { data: athletes, error } = await supabaseClient
            .from('athletes')
            .select('*')
            .eq('club_id', club.id)
            .order('full_name', { ascending: true });

        if (error) throw error;
        activeGodClubAthletes = athletes || [];
        document.getElementById('godModalAthleteCount').innerText = activeGodClubAthletes.length;
        renderGodClubAthletes(activeGodClubAthletes);
    } catch (err) {
        listEl.innerHTML = `<p class="p-4 text-center text-xs text-red-400">Gagal memuat atlet: ${escapeHtml(err.message)}</p>`;
    }
};

function renderGodClubAthletes(list) {
    const listEl = document.getElementById('godClubAthletesList');
    if (!listEl) return;

    if (!list || list.length === 0) {
        listEl.innerHTML = '<p class="p-4 text-center text-xs text-slate-500">Belum ada atlet terdaftar di klub ini.</p>';
        return;
    }

    listEl.innerHTML = list.map(a => {
        const verBadge = a.is_verified
            ? '<span class="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold">✅ Verified</span>'
            : `<button onclick="godQuickVerifyAthlete('${a.f1_id}')" class="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-[10px] font-black transition">⚡ ACC Verify</button>`;

        return `
            <div class="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-900/80">
                <div>
                    <a href="/f1-id.html?id=${a.f1_id}" target="_blank" class="text-xs font-extrabold text-white hover:text-cyan-400">${escapeHtml(a.full_name)}</a>
                    <p class="text-[11px] font-mono text-slate-400">${a.f1_id} • ${a.gender || '-'} • ${a.dob || '-'}</p>
                </div>
                <div class="flex items-center gap-2">
                    ${verBadge}
                    <button onclick="godUnlinkAthlete('${a.f1_id}')" class="px-2.5 py-1 bg-red-500/20 hover:bg-red-600 text-red-300 hover:text-white rounded text-[10px] font-bold transition">
                        Lepas Klub
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

window.godQuickVerifyAthlete = async (f1Id) => {
    try {
        const { error } = await supabaseClient
            .from('athletes')
            .update({ is_verified: true })
            .eq('f1_id', f1Id);
        if (error) throw error;

        const target = activeGodClubAthletes.find(a => a.f1_id === f1Id);
        if (target) target.is_verified = true;
        renderGodClubAthletes(activeGodClubAthletes);
        loadAdminData();
    } catch (err) {
        alert("Gagal verifikasi atlet: " + err.message);
    }
};

window.godUnlinkAthlete = async (f1Id) => {
    if (!confirm(`Lepaskan atlet ${f1Id} dari klub ini? Atlet akan masuk ke daftar "Atlet Belum Terikat Club".`)) return;
    try {
        const { error } = await supabaseClient
            .from('athletes')
            .update({ club_id: null, owner_id: null })
            .eq('f1_id', f1Id);
        if (error) throw error;

        activeGodClubAthletes = activeGodClubAthletes.filter(a => a.f1_id !== f1Id);
        document.getElementById('godModalAthleteCount').innerText = activeGodClubAthletes.length;
        renderGodClubAthletes(activeGodClubAthletes);
        loadAdminData();
    } catch (err) {
        alert("Gagal melepas atlet: " + err.message);
    }
};

function renderEventsGod(eventsArray) {
    const tbody = document.getElementById('eventsGodTableBody');
    const infoCount = document.getElementById('eventsGodCountInfo');
    const btnPrev = document.getElementById('btnPrevEventsGod');
    const btnNext = document.getElementById('btnNextEventsGod');
    const pageInfo = document.getElementById('pageInfoEventsGod');
    if (!tbody) return;

    if (!eventsArray || eventsArray.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-slate-500 font-bold">Tidak ada event ditemukan.</td></tr>';
        if (infoCount) infoCount.innerText = "Menampilkan 0 event.";
        if (btnPrev) btnPrev.disabled = true;
        if (btnNext) btnNext.disabled = true;
        if (pageInfo) pageInfo.innerText = "Page 1 of 1";
        return;
    }

    const totalPages = Math.ceil(eventsArray.length / eventsGodPerPage);
    if (currentEventsGodPage > totalPages) currentEventsGodPage = totalPages;
    if (currentEventsGodPage < 1) currentEventsGodPage = 1;

    const startIndex = (currentEventsGodPage - 1) * eventsGodPerPage;
    const endIndex = startIndex + eventsGodPerPage;
    const displayEvents = eventsArray.slice(startIndex, endIndex);

    tbody.innerHTML = displayEvents.map((ev, idx) => {
        const no = startIndex + idx + 1;
        const isPro = ev.event_tier === 'PRO';
        const isClosed = Boolean(ev.is_closed);
        const subUrl = ev.subdomain ? `https://${ev.subdomain}.f1swimming.com` : '#';

        const tierBtn = isPro
            ? `<button onclick="godToggleEventTier('${ev.id}', 'BASIC')" class="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded text-[10px] font-black uppercase hover:bg-amber-500 hover:text-slate-950 transition">PRO 👑</button>`
            : `<button onclick="godToggleEventTier('${ev.id}', 'PRO')" class="px-2.5 py-1 bg-slate-700/60 text-slate-300 border border-slate-600 rounded text-[10px] font-bold uppercase hover:bg-amber-500 hover:text-slate-950 transition">BASIC</button>`;

        const statusBtn = isClosed
            ? `<button onclick="godToggleEventClosed('${ev.id}', false)" class="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/40 rounded text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition">⛔ TUTUP</button>`
            : `<button onclick="godToggleEventClosed('${ev.id}', true)" class="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition">🟢 BUKA</button>`;

        return `
            <tr class="hover:bg-slate-700/40 transition-colors">
                <td class="p-4 text-center text-slate-500 font-bold">${no}</td>
                <td class="p-4">
                    <p class="font-extrabold text-white">${escapeHtml(ev.event_name)}</p>
                    <a href="${subUrl}" target="_blank" class="text-[11px] font-mono text-cyan-400 hover:underline">${escapeHtml(ev.subdomain || '-')}.f1swimming.com</a>
                </td>
                <td class="p-4 text-center">${tierBtn}</td>
                <td class="p-4 text-center">${statusBtn}</td>
                <td class="p-4 text-center">
                    <div class="inline-flex items-center gap-1.5">
                        <a href="/event-dashboard.html?id=${ev.id}" target="_blank" class="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-[11px] transition">Panel Event</a>
                        <a href="/event-peserta.html?id=${ev.id}" target="_blank" class="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-lg text-[11px] transition">Peserta</a>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    if (infoCount) {
        const endDisplay = Math.min(endIndex, eventsArray.length);
        infoCount.innerText = `Menampilkan ${startIndex + 1}-${endDisplay} dari total ${eventsArray.length} event.`;
    }
    if (pageInfo) pageInfo.innerText = `Page ${currentEventsGodPage} of ${totalPages}`;
    if (btnPrev) btnPrev.disabled = currentEventsGodPage === 1;
    if (btnNext) btnNext.disabled = currentEventsGodPage === totalPages;
}

window.godToggleEventTier = async (eventId, nextTier) => {
    if (!confirm(`Ubah kasta event ID #${eventId} menjadi ${nextTier}?`)) return;
    try {
        const { error } = await supabaseClient
            .from('events')
            .update({ event_tier: nextTier })
            .eq('id', eventId);
        if (error) throw error;
        loadAdminData();
    } catch (err) {
        alert("Gagal ubah kasta event: " + err.message);
    }
};

window.godToggleEventClosed = async (eventId, nextClosed) => {
    const label = nextClosed ? 'MENUTUP' : 'MEMBUKA KEMBALI';
    if (!confirm(`Yakin ingin ${label} pendaftaran event ID #${eventId}?`)) return;
    try {
        const { error } = await supabaseClient
            .from('events')
            .update({ is_closed: nextClosed })
            .eq('id', eventId);
        if (error) throw error;
        loadAdminData();
    } catch (err) {
        alert("Gagal ubah status pendaftaran event: " + err.message);
    }
};
