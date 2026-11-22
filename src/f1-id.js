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
    const fullCaptureArea = document.getElementById('fullProfileCapture');
    const actionButtonsArea = document.getElementById('actionButtonsArea');

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
            .select(`*, clubs (club_name, owner_id)`)
            .eq('f1_id', f1IdParams)
            .single();

        if (error || !atlet) throw new Error("Data tidak ditemukan");
        
        currentAthleteName = atlet.full_name;
        renderProfile(atlet);

        loadingState.classList.add('hidden');
        
        // SHOW PROFILE DAN TOMBOL
        fullCaptureArea.classList.remove('hidden');
        fullCaptureArea.classList.add('block');
        actionButtonsArea.classList.remove('hidden');
        actionButtonsArea.classList.add('grid');

        fetchMedals();
        fetchBestTimes();
        fetchAthleteCertificates();

    } catch (err) {
        console.error("Gagal load profil:", err);
        loadingState.classList.add('hidden');
        errorState.classList.remove('hidden');
    }

    const tabPencapaian = document.getElementById('tabPencapaian');
    const tabBestTime = document.getElementById('tabBestTime');
    const tabSertifikat = document.getElementById('tabSertifikat');
    const contentPencapaian = document.getElementById('contentPencapaian');
    const contentBestTime = document.getElementById('contentBestTime');
    const contentSertifikat = document.getElementById('contentSertifikat');

    function activateF1Tab(activeName) {
        const activeCls = "flex-1 py-2.5 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm transition-colors";
        const inactiveCls = "flex-1 py-2.5 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm transition-colors";
        if (tabPencapaian) tabPencapaian.className = activeName === 'pencapaian' ? activeCls : inactiveCls;
        if (tabBestTime) tabBestTime.className = activeName === 'besttime' ? activeCls : inactiveCls;
        if (tabSertifikat) tabSertifikat.className = activeName === 'sertifikat' ? activeCls : inactiveCls;

        if (contentPencapaian) contentPencapaian.classList.toggle('hidden', activeName !== 'pencapaian');
        if (contentBestTime) contentBestTime.classList.toggle('hidden', activeName !== 'besttime');
        if (contentSertifikat) contentSertifikat.classList.toggle('hidden', activeName !== 'sertifikat');
    }

    tabPencapaian.addEventListener('click', () => activateF1Tab('pencapaian'));
    tabBestTime.addEventListener('click', () => activateF1Tab('besttime'));
    if (tabSertifikat) tabSertifikat.addEventListener('click', () => activateF1Tab('sertifikat'));

    // 🚀 FIX: FUNGSI DOWNLOAD CARD JADI FULL PAGE (DIJEPRET SEMUA + ANTI GEPENG)
    const btnDownload = document.getElementById('btnDownloadCard');
    if (btnDownload) {
        btnDownload.addEventListener('click', async () => {
            const captureArea = document.getElementById('fullProfileCapture'); 
            if (!captureArea) return;
            
            try {
                // Biar warnanya nyatu sama background pas dijepret
                captureArea.classList.replace('bg-transparent', 'bg-slate-50');

                // 🚀 TRIK ANTI GEPENG: Kunci resolusi elemen pakai pixel asli sebelum difoto
                // Biar html2canvas gak kebingungan sama class flex/max-w bawaan tailwind
                const targetWidth = captureArea.offsetWidth;
                const targetHeight = captureArea.offsetHeight;
                
                const originalWidth = captureArea.style.width;
                const originalMaxWidth = captureArea.style.maxWidth;
                
                captureArea.style.width = targetWidth + 'px';
                captureArea.style.maxWidth = 'none';

                btnDownload.innerHTML = `<span class="animate-spin text-sm">🔄</span> <span class="text-sm">Memproses...</span>`;
                
                const canvas = await html2canvas(captureArea, {
                    scale: 2, // Biar HD tapi ga pecah
                    useCORS: true,
                    backgroundColor: '#f8fafc',
                    width: targetWidth,     // Paksa ukurannya
                    height: targetHeight,   // Paksa tingginya
                    windowWidth: document.documentElement.offsetWidth
                });
                
                // Balikin styling element ke kondisi normal setelah selesai difoto
                captureArea.style.width = originalWidth;
                captureArea.style.maxWidth = originalMaxWidth;

                const link = document.createElement('a');
                link.download = `F1-ID_${targetF1Id}.png`;
                link.href = canvas.toDataURL('image/png', 1.0);
                link.click();
            } catch (err) {
                alert('Gagal mendownload ID Card. Silakan coba lagi.');
                console.error(err);
            } finally {
                captureArea.classList.replace('bg-slate-50', 'bg-transparent');
                btnDownload.innerHTML = `
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    <span class="text-sm">Unduh Profil</span>
                `;
            }
        });
    }

    // FUNGSI SHARE PROFILE PAKAI NATIVE SHARE
    const btnShare = document.getElementById('btnShareProfile');
    if (btnShare) {
        btnShare.addEventListener('click', async () => {
            const shareData = {
                title: `F1 ID - ${currentAthleteName}`,
                text: `Cek profil, sertifikat, dan catatan rekor F1 ID renang ${currentAthleteName}!`,
                url: window.location.href
            };
            
            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                } else {
                    await navigator.clipboard.writeText(window.location.href);
                    alert('Link F1 ID berhasil disalin ke clipboard! Silakan paste (tempel) untuk membagikannya.');
                }
            } catch (err) {
                console.log('User cancelled share or error:', err);
            }
        });
    }
});

function renderProfile(atlet) {
    document.getElementById('atletName').innerText = atlet.full_name;
    
    // Unattached Club Text
    document.getElementById('atletKlub').innerHTML = atlet.clubs?.club_name 
        ? `${atlet.clubs.club_name}` 
        : '<span class="text-red-400">❌ Unattached Club</span>';

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

async function fetchMedals() {
    const listEl = document.getElementById('medaliList');
    try {
        const { data: offData, error: offErr } = await supabaseClient
            .from('event_leaderboard')
            .select(`*, events (event_name)`)
            .ilike('nama_peserta', `%${currentAthleteName}%`)
            .lte('peringkat', 3);

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


// ============================================================================
// KOLEKSI E-SERTIFIKAT MELEKAT DI HALAMAN F1 ID
// ============================================================================
let earnedF1Certificates = [];

function computeF1DeterministicCode(seedStr) {
    let hash = 2166136261;
    for (let i = 0; i < seedStr.length; i++) {
        hash ^= seedStr.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    const num = (hash >>> 0) % 9000 + 1000;
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const c1 = chars[(hash >>> 4) % chars.length];
    const c2 = chars[(hash >>> 12) % chars.length];
    return `${num}-${c1}${c2}`;
}

function renderF1CustomFieldValue(eventId, certType, field, seedContext, seqIndex = 1) {
    const tpl = (field.template || '').trim();
    const yearStr = String(new Date().getFullYear());
    const seqStr = String(seqIndex).padStart(3, '0');
    const randStr = computeF1DeterministicCode(`${eventId}|${certType}|${seedContext}|${field.id}`);

    if (field.mode === 'static_text') return tpl || field.label || '';
    const baseTpl = tpl || (field.mode === 'auto_number' ? 'NO. {SEQ}/SCS/{YEAR}' : 'NO. {RAND}/SCS/{YEAR}');
    return baseTpl
        .replace(/\{RAND\}/gi, randStr)
        .replace(/\{ACAK\}/gi, randStr)
        .replace(/\{SEQ\}/gi, seqStr)
        .replace(/\{YEAR\}/gi, yearStr);
}

function parseF1TimeToMs(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return Infinity;
    const clean = timeStr.trim().replace(/,/g, '.');
    if (!/^\d{1,2}(:\d{2})?\.\d{1,3}$/.test(clean)) return Infinity;
    let minutes = 0;
    let secPart = clean;
    if (clean.includes(':')) {
        const p = clean.split(':');
        minutes = parseInt(p[0], 10);
        secPart = p[1];
    }
    const sp = secPart.split('.');
    const seconds = parseInt(sp[0], 10);
    const ms = parseInt(sp[1].padEnd(3, '0').slice(0, 3), 10);
    const total = (minutes * 60000) + (seconds * 1000) + ms;
    return total > 0 ? total : Infinity;
}

function toF1TitleCase(str) {
    return (str || '').toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

async function fetchAthleteCertificates() {
    const listEl = document.getElementById('sertifikatList');
    const totalEl = document.getElementById('totalSertifikat');
    if (!listEl) return;

    try {
        // 1. Cari semua event yang pernah diikuti atlet ini (via f1_id atau nama)
        const { data: regsById } = await supabaseClient
            .from('event_registrations')
            .select('event_id, nama_peserta, klub_asal, f1_id, created_at, events (event_name, start_date)')
            .eq('f1_id', targetF1Id);

        const { data: regsByName } = await supabaseClient
            .from('event_registrations')
            .select('event_id, nama_peserta, klub_asal, f1_id, created_at, events (event_name, start_date)')
            .ilike('nama_peserta', currentAthleteName.trim());

        const allRegs = [...(regsById || []), ...(regsByName || [])];
        const uniqueEventMap = new Map();
        allRegs.forEach(r => {
            if (r.event_id && !uniqueEventMap.has(r.event_id)) {
                uniqueEventMap.set(r.event_id, r);
            }
        });

        const eventIds = Array.from(uniqueEventMap.keys());
        if (eventIds.length === 0) {
            if (totalEl) totalEl.innerText = '0 Sertifikat';
            listEl.innerHTML = `
                <div class="text-center py-10">
                    <span class="text-5xl block mb-3 grayscale opacity-30">📜</span>
                    <p class="text-sm font-bold text-slate-500">Belum ada e-sertifikat resmi yang diterbitkan.</p>
                </div>
            `;
            return;
        }

        // 2. Tarik semua template sertifikat dari event-event tersebut
        const { data: allCertTemplates } = await supabaseClient
            .from('event_certificates')
            .select('*')
            .in('event_id', eventIds);

        if (!allCertTemplates || allCertTemplates.length === 0) {
            if (totalEl) totalEl.innerText = '0 Sertifikat';
            listEl.innerHTML = `
                <div class="text-center py-10">
                    <span class="text-5xl block mb-3 grayscale opacity-30">📜</span>
                    <p class="text-sm font-bold text-slate-500">Panitia event belum menerbitkan e-sertifikat.</p>
                </div>
            `;
            return;
        }

        const certByEventAndType = {};
        allCertTemplates.forEach(c => {
            certByEventAndType[`${c.event_id}|${c.tipe}`] = c;
        });

        const collected = [];
        const cleanTargetNameUpper = currentAthleteName.trim().toUpperCase();

        // A. Sertifikat Peserta
        uniqueEventMap.forEach((reg, evId) => {
            const tpl = certByEventAndType[`${evId}|peserta`];
            if (tpl) {
                collected.push({
                    certRow: tpl,
                    tipe: 'peserta',
                    badgeText: 'PESERTA',
                    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
                    eventName: reg.events?.event_name || 'Kejuaraan SCS',
                    title: 'Sertifikat Partisipasi Lomba',
                    subtitle: reg.klub_asal || 'Atlet Resmi SCS',
                    nama: currentAthleteName,
                    predikat: '',
                    nomor: '',
                    ku: '',
                    seedKey: `peserta|${cleanTargetNameUpper}`
                });
            }
        });

        // B. Sertifikat Pemenang (Juara 1, 2, 3)
        const { data: winRows } = await supabaseClient
            .from('event_leaderboard')
            .select('*, events (event_name)')
            .in('event_id', eventIds)
            .ilike('nama_peserta', currentAthleteName.trim())
            .lte('peringkat', 3);

        (winRows || []).forEach((w, idx) => {
            const tpl = certByEventAndType[`${w.event_id}|juara`];
            if (tpl) {
                collected.push({
                    certRow: tpl,
                    tipe: 'juara',
                    badgeText: `JUARA ${w.peringkat}`,
                    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
                    eventName: w.events?.event_name || uniqueEventMap.get(w.event_id)?.events?.event_name || 'Kejuaraan SCS',
                    title: `Juara ${w.peringkat} — ${w.nomor_lomba}`,
                    subtitle: `${w.kelompok_umur} ${w.gender} • ${w.catatan_waktu || ''}`.trim(),
                    nama: w.nama_peserta,
                    predikat: `JUARA ${w.peringkat}`,
                    nomor: w.nomor_lomba,
                    ku: `${w.kelompok_umur} ${w.gender} • ${w.catatan_waktu || ''}`.trim(),
                    seedKey: `juara|${w.id || idx}|${w.nama_peserta}`
                });
            }
        });

        // C. Sertifikat Juara Seri/Heat
        const seriEventIds = eventIds.filter(evId => Boolean(certByEventAndType[`${evId}|juara_seri`]));
        if (seriEventIds.length > 0) {
            const { data: heatRows } = await supabaseClient
                .from('event_heats')
                .select('*')
                .in('event_id', seriEventIds);

            (heatRows || []).forEach(h => {
                if (!Array.isArray(h.lanes_data)) return;
                const validSwimmers = h.lanes_data
                    .filter(s => s && s.nama && parseF1TimeToMs(s.waktu_tempuh) < Infinity)
                    .sort((a, b) => parseF1TimeToMs(a.waktu_tempuh) - parseF1TimeToMs(b.waktu_tempuh));

                if (validSwimmers.length > 0) {
                    const top = validSwimmers[0];
                    const isMatch = (top.f1_id && top.f1_id === targetF1Id) ||
                                    (top.nama && top.nama.trim().toUpperCase() === cleanTargetNameUpper);
                    if (isMatch) {
                        const tpl = certByEventAndType[`${h.event_id}|juara_seri`];
                        collected.push({
                            certRow: tpl,
                            tipe: 'juara_seri',
                            badgeText: `JUARA SERI ${h.heat_number}`,
                            badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                            eventName: uniqueEventMap.get(h.event_id)?.events?.event_name || 'Kejuaraan SCS',
                            title: `Juara 1 Seri/Heat ${h.heat_number} — ${h.nomor_lomba}`,
                            subtitle: `${h.kelompok_umur} ${h.gender} • ${top.waktu_tempuh}`,
                            nama: top.nama,
                            predikat: `JUARA 1 SERI/HEAT ${h.heat_number}`,
                            nomor: h.nomor_lomba,
                            ku: `${h.kelompok_umur} ${h.gender} • ${top.waktu_tempuh}`,
                            seedKey: `seri|${h.event_number}|${h.heat_number}|${top.nama}`
                        });
                    }
                }
            });
        }

        // D. Sertifikat MVS
        eventIds.forEach(evId => {
            const tpl = certByEventAndType[`${evId}|mvs`];
            if (!tpl) return;
            const mvsList = Array.isArray(tpl.config_json?.mvsAthletes) ? tpl.config_json.mvsAthletes : [];
            mvsList.forEach((m, idx) => {
                const targetMvs = (m.nama || '').trim().toUpperCase();
                if (targetMvs === cleanTargetNameUpper || targetMvs === targetF1Id) {
                    collected.push({
                        certRow: tpl,
                        tipe: 'mvs',
                        badgeText: '👑 MVS',
                        badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
                        eventName: uniqueEventMap.get(evId)?.events?.event_name || 'Kejuaraan SCS',
                        title: `Most Valuable Swimmer (MVS)`,
                        subtitle: `${m.kategori || 'Best Swimmer'} • ${m.poin || ''}`.trim(),
                        nama: currentAthleteName,
                        predikat: 'MOST VALUABLE SWIMMER (MVS)',
                        nomor: m.kategori || 'Best Swimmer',
                        ku: m.poin || '',
                        seedKey: `mvs|${idx}|${m.nama}`
                    });
                }
            });
        });

        earnedF1Certificates = collected;
        if (totalEl) totalEl.innerText = `${collected.length} Sertifikat`;

        if (collected.length === 0) {
            listEl.innerHTML = `
                <div class="text-center py-10">
                    <span class="text-5xl block mb-3 grayscale opacity-30">📜</span>
                    <p class="text-sm font-bold text-slate-500">Belum ada sertifikat tersedia untuk atlet ini.</p>
                </div>
            `;
            return;
        }

        listEl.innerHTML = collected.map((item, idx) => {
            const customFields = Array.isArray(item.certRow.config_json?.customFields) ? item.certRow.config_json.customFields : [];
            const firstCf = customFields[0];
            const certNumTxt = firstCf
                ? renderF1CustomFieldValue(item.certRow.event_id, item.tipe, firstCf, item.seedKey, idx + 1)
                : '';

            return `
                <div class="p-4 md:p-5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2 mb-1 flex-wrap">
                            <span class="text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${item.badgeClass}">${item.badgeText}</span>
                            ${certNumTxt ? `<span class="text-[9px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">🔖 ${certNumTxt}</span>` : ''}
                        </div>
                        <h4 class="font-black text-slate-800 text-xs md:text-sm truncate">${item.title}</h4>
                        <p class="text-[10px] md:text-xs text-slate-500 font-bold truncate mt-0.5">🏆 ${item.eventName}</p>
                        <p class="text-[10px] text-slate-400 font-medium truncate">${item.subtitle}</p>
                    </div>
                    <button type="button" data-f1-cert-idx="${idx}" class="btn-f1-dl-cert shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-3.5 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer">
                        <span>⬇️</span>
                        <span>Unduh</span>
                    </button>
                </div>
            `;
        }).join('');

        listEl.querySelectorAll('.btn-f1-dl-cert').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const button = e.currentTarget;
                const i = Number(button.getAttribute('data-f1-cert-idx'));
                const item = earnedF1Certificates[i];
                if (!item) return;

                const origHtml = button.innerHTML;
                button.innerHTML = '⏳...';
                button.disabled = true;

                try {
                    await downloadF1Certificate(item, i + 1);
                } catch (err) {
                    alert('Gagal mengunduh sertifikat: ' + err.message);
                } finally {
                    button.innerHTML = origHtml;
                    button.disabled = false;
                }
            });
        });

    } catch (err) {
        console.error('Gagal memuat sertifikat F1 ID:', err);
        listEl.innerHTML = `<p class="text-center py-6 text-sm text-red-500 font-bold">Gagal memuat koleksi sertifikat.</p>`;
    }
}

async function downloadF1Certificate(item, seqIndex) {
    const certRow = item.certRow;
    const config = certRow.config_json || {};

    const img = await new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Gagal memuat gambar template sertifikat.'));
        image.src = certRow.template_url + (certRow.template_url.includes('?') ? '&' : '?') + 't=' + Date.now();
    });

    await document.fonts.ready;

    const canvas = document.getElementById('f1CertRenderCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const fontName = config.sharedStyle?.font || config.nama?.font || "'Great Vibes', cursive";
    const fontColor = config.sharedStyle?.color || config.nama?.color || '#1e293b';

    const drawText = (text, fieldCfg) => {
        if (!text || !fieldCfg) return;
        ctx.textAlign = 'center';
        const size = fieldCfg.size || 40;
        ctx.font = fontName.includes('Great Vibes') ? `${size}px ${fontName}` : `bold ${size}px ${fontName}`;
        ctx.fillStyle = fontColor;
        ctx.fillText(text, parseInt(fieldCfg.x, 10), parseInt(fieldCfg.y, 10));
    };

    drawText(toF1TitleCase(item.nama), config.nama);

    if (item.tipe !== 'peserta' && config.extra) {
        drawText(item.predikat, config.extra.juara);
        drawText(item.nomor, config.extra.nomorLomba);
        drawText(item.ku, config.extra.kelompokUmur);
    }

    if (Array.isArray(config.customFields)) {
        config.customFields.forEach(cf => {
            const val = renderF1CustomFieldValue(certRow.event_id, item.tipe, cf, item.seedKey, seqIndex);
            drawText(val, cf);
        });
    }

    await new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (!blob) return reject(new Error('Gagal merender file gambar.'));
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = url;
            link.download = `Sertifikat_${item.tipe.toUpperCase()}_${targetF1Id}_${item.nama.replace(/\s+/g, '_')}.jpg`;
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                resolve();
            }, 300);
        }, 'image/jpeg', 0.92);
    });
}
