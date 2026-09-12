import { supabaseClient } from './supabase.js';

let targetF1Id = null;
let currentAthleteName = "";
let currentUserId = null; 

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUserId = session.user.id;
        const navBtn = document.getElementById('navAuthBtn');
        if (navBtn) {
            navBtn.innerText = "Dashboard";
            navBtn.href = "/dashboard.html";
            navBtn.className = "text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 hover:bg-emerald-100 transition-colors";
        }
    }

    const urlParams = new URLSearchParams(window.location.search);
    let f1IdParams = urlParams.get('id');

    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const profileData = document.getElementById('profileData');

    if (!f1IdParams) {
        loadingState.classList.add('hidden');
        errorState.classList.remove('hidden');
        return;
    }

    f1IdParams = f1IdParams.trim().toUpperCase();
    targetF1Id = f1IdParams;

    try {
        const { data: atlet, error } = await supabaseClient
            .from('athletes')
            .select(`
                *,
                clubs (
                    club_name,
                    owner_id
                )
            `)
            .eq('f1_id', f1IdParams)
            .single();

        if (error || !atlet) throw new Error("Data tidak ditemukan");
        
        currentAthleteName = atlet.full_name;
        renderProfile(atlet);

        loadingState.classList.add('hidden');
        profileData.classList.remove('hidden');

        fetchMedals();
        fetchBestTimes();

    } catch (err) {
        console.error("Gagal load profil:", err);
        loadingState.classList.add('hidden');
        errorState.classList.remove('hidden');
    }

    const tabPencapaian = document.getElementById('tabPencapaian');
    const tabBestTime = document.getElementById('tabBestTime');
    const contentPencapaian = document.getElementById('contentPencapaian');
    const contentBestTime = document.getElementById('contentBestTime');

    tabPencapaian.addEventListener('click', () => {
        tabPencapaian.className = "flex-1 py-2.5 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm transition-colors";
        tabBestTime.className = "flex-1 py-2.5 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm transition-colors";
        contentPencapaian.classList.remove('hidden');
        contentBestTime.classList.add('hidden');
    });

    tabBestTime.addEventListener('click', () => {
        tabBestTime.className = "flex-1 py-2.5 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm transition-colors";
        tabPencapaian.className = "flex-1 py-2.5 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm transition-colors";
        contentBestTime.classList.remove('hidden');
        contentPencapaian.classList.add('hidden');
    });
});

function renderProfile(atlet) {
    document.getElementById('atletName').innerText = atlet.full_name;
    
    // 🚀 FIX: Trik Growth Hack! Kalau klubnya NULL, tampilkan tulisan ini biar orang tua protes ke pelatih.
    document.getElementById('atletKlub').innerHTML = atlet.clubs?.club_name 
        ? `${atlet.clubs.club_name}` 
        : '<span class="text-red-300">❌ Independen (Unattached)</span>';

    const f1IdEl = document.getElementById('atletF1Id');
    f1IdEl.innerText = atlet.f1_id;
    const f1IdContainer = f1IdEl.parentElement;
    const iconSpan = f1IdEl.previousElementSibling;

    if (atlet.is_verified) {
        if(iconSpan) iconSpan.outerHTML = `<span class="bg-gradient-to-r from-amber-300 to-yellow-500 text-yellow-900 text-[11px] font-black px-1.5 py-0.5 rounded shadow-sm">ID</span>`;
        f1IdContainer.className = "inline-flex items-center gap-1.5 md:gap-2 bg-amber-900/20 border border-amber-400/50 px-2 py-1 md:px-3 md:py-1.5 rounded-lg backdrop-blur-sm mb-3 md:mb-4 cursor-pointer hover:bg-amber-900/40 transition-colors shadow-[0_0_10px_rgba(251,191,36,0.1)]";
        f1IdEl.className = "font-mono text-sm md:text-lg font-black text-amber-400 tracking-wider";
    } else {
        if(iconSpan) iconSpan.outerHTML = `<span class="bg-blue-500 text-white text-[11px] font-black px-1.5 py-0.5 rounded shadow-sm">ID</span>`;
        f1IdContainer.className = "inline-flex items-center gap-1.5 md:gap-2 bg-blue-900/30 border border-blue-400/30 px-2 py-1 md:px-3 md:py-1.5 rounded-lg backdrop-blur-sm mb-3 md:mb-4 cursor-pointer hover:bg-blue-900/50 transition-colors";
        f1IdEl.className = "font-mono text-sm md:text-lg font-black text-blue-200 tracking-wider";
    }

    const fotoEl = document.getElementById('atletFoto');
    let useDefaultLogo = false;
    const isOwner = atlet.clubs && (atlet.clubs.owner_id === currentUserId);

    if (!atlet.foto_url) useDefaultLogo = true;
    else if (atlet.hide_foto && !isOwner) useDefaultLogo = true;

    if (useDefaultLogo) {
        fotoEl.src = '/images/f1logo.png';
        fotoEl.className = "w-24 h-24 md:w-36 md:h-36 rounded-2xl object-contain p-3 md:p-4 border-2 md:border-4 border-white/10 shadow-xl bg-white";
    } else {
        fotoEl.src = atlet.foto_url;
        fotoEl.className = "w-24 h-24 md:w-36 md:h-36 rounded-2xl object-cover border-2 md:border-4 border-white/10 shadow-xl bg-slate-800";
    }

    if (atlet.dob) {
        const dob = new Date(atlet.dob);
        const diff_ms = Date.now() - dob.getTime();
        const age_dt = new Date(diff_ms); 
        const umur = Math.abs(age_dt.getUTCFullYear() - 1970);
        document.getElementById('atletUsia').innerText = `${umur} Thn`;
    }

    const genderIconEl = document.getElementById('atletGenderIcon');
    if (atlet.gender === 'Putra') {
        genderIconEl.innerHTML = '👦';
        genderIconEl.className = 'absolute -bottom-2 -right-2 md:-bottom-3 md:-right-3 w-8 h-8 md:w-10 md:h-10 bg-sky-400 rounded-full border-[3px] md:border-4 border-slate-900 flex items-center justify-center shadow-lg text-sm md:text-lg';
    } else {
        genderIconEl.innerHTML = '👧';
        genderIconEl.className = 'absolute -bottom-2 -right-2 md:-bottom-3 md:-right-3 w-8 h-8 md:w-10 md:h-10 bg-pink-400 rounded-full border-[3px] md:border-4 border-slate-900 flex items-center justify-center shadow-lg text-sm md:text-lg';
    }

    const badgeEl = document.getElementById('badgeVerifikasi');
    if (atlet.is_verified) {
        badgeEl.innerHTML = `
            <div class="flex items-center gap-1 bg-gradient-to-r from-amber-200 to-yellow-400 px-2 py-0.5 md:px-3 md:py-1 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.3)] border border-amber-300">
                <span class="text-xs md:text-sm">👑</span>
                <span class="text-[8px] md:text-[10px] font-black text-amber-900 uppercase tracking-widest">Verified</span>
            </div>
        `;
    } else {
        badgeEl.innerHTML = `
            <div class="flex items-center gap-1 bg-blue-900/40 px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-blue-400/30 backdrop-blur-md">
                <span class="text-xs md:text-sm">⏳</span>
                <span class="text-[8px] md:text-[10px] font-bold text-blue-100 uppercase tracking-widest">Pending</span>
            </div>
        `;
    }
}

// 🚀 FIX: TARIK MEDALI OFFICIAL & UNOFFICIAL
async function fetchMedals() {
    const listEl = document.getElementById('medaliList');
    try {
        // 1. Tarik dari event_leaderboard (Resmi)
        const { data: offData, error: offErr } = await supabaseClient
            .from('event_leaderboard')
            .select(`*, events (event_name)`)
            .ilike('nama_peserta', `%${currentAthleteName}%`)
            .lte('peringkat', 3);

        // 2. Tarik dari manual_results (Unofficial) yang isi kolom medalinya Emas/Perak/Perunggu
        const { data: manData, error: manErr } = await supabaseClient
            .from('manual_results')
            .select('*')
            .eq('f1_id', targetF1Id)
            .not('medali', 'is', null)
            .neq('medali', 'Peserta');

        const allMedals = [];

        if (offData) {
            offData.forEach(m => {
                allMedals.push({
                    event_name: m.events?.event_name || 'Kejuaraan SCS',
                    nomor_lomba: m.nomor_lomba,
                    catatan_waktu: m.catatan_waktu,
                    peringkat: m.peringkat,
                    is_official: true,
                    date: m.published_at || new Date().toISOString()
                });
            });
        }

        if (manData) {
            manData.forEach(m => {
                let rank = 3;
                if (m.medali === 'Emas') rank = 1;
                if (m.medali === 'Perak') rank = 2;

                allMedals.push({
                    event_name: m.event_name,
                    nomor_lomba: m.nomor_lomba,
                    catatan_waktu: m.waktu_string,
                    peringkat: rank,
                    is_official: false,
                    date: m.event_date || new Date().toISOString()
                });
            });
        }

        allMedals.sort((a, b) => new Date(b.date) - new Date(a.date));

        document.getElementById('totalMedali').innerText = `${allMedals.length} Medali`;

        if (allMedals.length === 0) {
            listEl.innerHTML = `
                <div class="text-center py-10">
                    <span class="text-5xl block mb-3 grayscale opacity-30">🎖️</span>
                    <p class="text-sm font-bold text-slate-500">Belum ada medali yang dikoleksi.</p>
                </div>
            `;
            return;
        }

        let html = '';
        allMedals.forEach(medali => {
            let icon = '🥉'; let warna = 'text-orange-700 bg-orange-50 border-orange-200';
            if (medali.peringkat === 1) { icon = '🥇'; warna = 'text-amber-600 bg-amber-50 border-amber-200'; }
            if (medali.peringkat === 2) { icon = '🥈'; warna = 'text-slate-500 bg-slate-50 border-slate-200'; }

            const badgeLomba = medali.is_official 
                ? `<span class="text-[9px] bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-black tracking-widest uppercase shadow-sm">Official</span>`
                : `<span class="text-[9px] bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded font-black tracking-widest uppercase shadow-sm">Unofficial</span>`;

            html += `
                <div class="p-4 md:p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div class="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-2xl md:text-3xl shrink-0 rounded-full border ${warna} shadow-sm">
                        ${icon}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-0.5">
                            <h4 class="font-black text-slate-800 text-xs md:text-sm uppercase truncate">${medali.nomor_lomba}</h4>
                            ${badgeLomba}
                        </div>
                        <p class="text-[10px] md:text-xs text-slate-500 font-bold mb-1 truncate">🏆 ${medali.event_name}</p>
                        <div class="flex items-center gap-2">
                            <span class="text-[9px] md:text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-black tracking-wider shrink-0">⏱️ ${medali.catatan_waktu}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        listEl.innerHTML = html;

    } catch (err) {
        console.error("Gagal load medali:", err);
        listEl.innerHTML = `<p class="text-center py-6 text-sm text-red-500 font-bold">Gagal memuat rekap medali.</p>`;
    }
}

// 🚀 FIX: TARIK BEST TIME OFFICIAL & UNOFFICIAL
async function fetchBestTimes() {
    const listEl = document.getElementById('bestTimeList');
    try {
        const { data: officialData, error: offErr } = await supabaseClient
            .from('race_results')
            .select(`*, events (event_name)`)
            .eq('athlete_f1_id', targetF1Id)
            .neq('waktu_string', 'DQ')
            .neq('waktu_string', 'DNS')
            .neq('waktu_string', 'NT');

        const { data: manualData, error: manErr } = await supabaseClient
            .from('manual_results')
            .select('*')
            .eq('f1_id', targetF1Id);

        const allTimes = [];
        
        if (officialData) {
            officialData.forEach(r => {
                allTimes.push({
                    nomor_lomba: r.nomor_lomba,
                    event_name: r.events?.event_name || 'Event Resmi SCS',
                    waktu_string: r.waktu_string,
                    time_seconds: parseFloat(r.time_seconds),
                    is_official: true
                });
            });
        }

        if (manualData) {
            manualData.forEach(r => {
                allTimes.push({
                    nomor_lomba: r.nomor_lomba,
                    event_name: r.event_name,
                    waktu_string: r.waktu_string,
                    time_seconds: parseFloat(r.time_seconds),
                    is_official: false
                });
            });
        }

        if (allTimes.length === 0) {
            listEl.innerHTML = `
                <div class="text-center py-10">
                    <span class="text-5xl block mb-3 grayscale opacity-30">⏱️</span>
                    <p class="text-sm font-bold text-slate-500">Belum ada catatan waktu.</p>
                </div>
            `;
            return;
        }

        allTimes.sort((a, b) => a.time_seconds - b.time_seconds);

        const bestTimesMap = new Map();
        allTimes.forEach(race => {
            const key = race.nomor_lomba;
            if (!bestTimesMap.has(key)) {
                bestTimesMap.set(key, race); 
            }
        });

        let html = '';
        bestTimesMap.forEach((best, nomor_lomba) => {
            const badge = best.is_official 
                ? `<span class="bg-blue-100 text-blue-700 border border-blue-200 text-[8px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase">Official</span>`
                : `<span class="bg-slate-100 text-slate-500 border border-slate-200 text-[8px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase">Unofficial</span>`;
                
            html += `
                <div class="p-4 md:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group gap-2">
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2">
                            <h4 class="font-black text-slate-800 text-xs md:text-sm uppercase truncate">${nomor_lomba}</h4>
                            ${badge}
                        </div>
                        <p class="text-[9px] md:text-[10px] text-slate-500 font-bold mt-1 truncate">Di: <span class="text-slate-700">${best.event_name}</span></p>
                    </div>
                    <div class="text-right shrink-0">
                        <span class="block text-base md:text-lg font-black text-blue-600 font-mono tracking-wider drop-shadow-sm group-hover:scale-105 transition-transform origin-right">
                            ${best.waktu_string}
                        </span>
                    </div>
                </div>
            `;
        });
        listEl.innerHTML = html;

    } catch (err) {
        console.error("Gagal load best time:", err);
        listEl.innerHTML = `<p class="text-center py-6 text-sm text-red-500 font-bold">Gagal memuat catatan waktu.</p>`;
    }
}
