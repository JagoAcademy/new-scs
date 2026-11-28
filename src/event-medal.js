import { supabaseClient } from './supabase.js';

let rawMedals = [];
let rawRegistrations = [];
let kontingenList = [];
let individuList = [];
let activeTab = 'kontingen';
let idleSortMode = 'participants'; // 'participants' | 'random'
let randomSeedMap = new Map();
let resolvedEventId = null;
let isEventMaker = false;
let simulateAllParticipants = false;
let makerAllRegistrations = [];
let publicLineupRegistrations = [];

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeKontingenLabel(rawClub) {
    const cleaned = String(rawClub || '').trim();
    if (!cleaned || cleaned === '-' || cleaned.toLowerCase() === 'null' || cleaned.toLowerCase() === 'undefined') {
        return {
            key: '__INDIVIDU__',
            label: 'Individu / Non-Klub',
            isIndividuGroup: true
        };
    }
    const lower = cleaned.toLowerCase();
    const isIndividu = lower === 'individu' || lower === 'perorangan' || lower === 'non-klub' || lower === 'non klub';
    return {
        key: isIndividu ? '__INDIVIDU__' : lower,
        label: isIndividu ? 'Individu / Non-Klub' : cleaned,
        isIndividuGroup: isIndividu
    };
}

function getRandomWeight(key) {
    if (!randomSeedMap.has(key)) {
        randomSeedMap.set(key, Math.random());
    }
    return randomSeedMap.get(key);
}

function reshuffleRandomWeights() {
    randomSeedMap.clear();
    kontingenList.forEach(k => randomSeedMap.set(k.key, Math.random()));
    individuList.forEach(ind => randomSeedMap.set(ind.key, Math.random()));
}

function sortStandings(a, b) {
    // Prioritas utama standar Olympic / Asian Games: Emas -> Perak -> Perunggu
    if (b.emas !== a.emas) return b.emas - a.emas;
    if (b.perak !== a.perak) return b.perak - a.perak;
    if (b.perunggu !== a.perunggu) return b.perunggu - a.perunggu;

    // Tie-breaker saat perolehan medali sama (termasuk 0 - 0 - 0 saat idle)
    if (idleSortMode === 'random') {
        return getRandomWeight(a.key) - getRandomWeight(b.key);
    }

    if ((b.athleteCount || 0) !== (a.athleteCount || 0)) {
        return (b.athleteCount || 0) - (a.athleteCount || 0);
    }
    if ((b.entryCount || 0) !== (a.entryCount || 0)) {
        return (b.entryCount || 0) - (a.entryCount || 0);
    }
    return a.label.localeCompare(b.label, 'id');
}

function countNomorLomba(nomorField) {
    if (Array.isArray(nomorField)) return Math.max(1, nomorField.length);
    if (typeof nomorField === 'string' && nomorField.trim()) {
        try {
            const parsed = JSON.parse(nomorField);
            if (Array.isArray(parsed)) return Math.max(1, parsed.length);
        } catch (_) {}
        return 1;
    }
    return 1;
}

async function resolveEventIdFromContext() {
    const urlParams = new URLSearchParams(window.location.search);
    const paramId = urlParams.get('id') || urlParams.get('event_id');
    if (paramId) return paramId;

    const host = window.location.hostname.toLowerCase();
    if (host.endsWith('.f1swimming.com')) {
        const sub = host.replace('.f1swimming.com', '');
        if (sub && sub !== 'www') {
            const { data } = await supabaseClient
                .from('events')
                .select('id')
                .eq('subdomain', sub)
                .single();
            if (data?.id) return data.id;
        }
    }
    return null;
}

async function fetchAndRenderSponsors(eventId) {
    try {
        const { data: linkData } = await supabaseClient
            .from('event_sponsors')
            .select('sponsor_ids')
            .eq('event_id', eventId)
            .single();

        if (!linkData || !linkData.sponsor_ids || linkData.sponsor_ids.length === 0) return;

        const { data: sponsors } = await supabaseClient
            .from('master_sponsors')
            .select('*')
            .in('id', linkData.sponsor_ids);

        if (!sponsors || sponsors.length === 0) return;

        const wrapper = document.getElementById('partnerWrapper');
        if (wrapper) {
            let html = `
                <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 text-center mb-5">
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Official Event Partners</span>
                    <div class="flex items-center justify-center gap-4 flex-wrap w-full">
            `;
            const boxWidth = sponsors.length === 1 ? '150px' : (sponsors.length === 2 ? '115px' : '88px');
            sponsors.forEach(sp => {
                html += `
                    <a href="${escapeHtml(sp.link_url || '#')}" target="_blank" rel="noopener noreferrer" class="bg-white p-2 rounded-xl border border-slate-100 shadow-sm flex items-center justify-center shrink-0 hover:scale-105 transition-transform" style="aspect-ratio: 16/9; width: ${boxWidth}; max-width: 100%;">
                        <img src="${escapeHtml(sp.logo_url)}" alt="${escapeHtml(sp.sponsor_name)}" class="w-full h-full object-contain" loading="lazy">
                    </a>
                `;
            });
            html += `</div></div>`;
            wrapper.innerHTML = html;
        }
    } catch (err) {
        console.error('Gagal memuat sponsor:', err);
    }
}

/**
 * Ambil lineup klub & atlet terdaftar dengan fallback berantai:
 * 1. RPC Publik `get_public_event_contingents` (bypass RLS dengan aman)
 * 2. Tabel `event_registrations` (jika sesi login / policy mengizinkan)
 * 3. Tabel `event_heats` (Start List resmi yang selalu terbuka untuk publik)
 * 4. Tabel `race_results` (jika hasil seri sudah masuk)
 */
async function fetchParticipantLineup(eventId) {
    // 1. Coba RPC publik khusus kontingen
    try {
        const { data: rpcRows, error: rpcErr } = await supabaseClient
            .rpc('get_public_event_contingents', { p_event_id: String(eventId) });

        if (!rpcErr && Array.isArray(rpcRows) && rpcRows.length > 0) {
            const paid = rpcRows.filter(r => String(r.status_pembayaran || '').toLowerCase() === 'lunas');
            return paid.length > 0 ? paid : rpcRows;
        }
    } catch (_) {}

    // 2. Coba baca langsung dari event_registrations
    try {
        const { data: regRows, error: regErr } = await supabaseClient
            .from('event_registrations')
            .select('f1_id, nama_peserta, klub_asal, gender, kelompok_umur, nomor_lomba, status_pembayaran')
            .eq('event_id', eventId);

        if (!regErr && Array.isArray(regRows) && regRows.length > 0) {
            const paid = regRows.filter(r => String(r.status_pembayaran || '').toLowerCase() === 'lunas');
            return paid.length > 0 ? paid : regRows;
        }
    } catch (_) {}

    // 3. Fallback ke Start List (event_heats) yang terbuka untuk publik
    try {
        const { data: heatRows, error: heatErr } = await supabaseClient
            .from('event_heats')
            .select('event_number, nomor_lomba, kelompok_umur, gender, lanes_data')
            .eq('event_id', eventId);

        if (!heatErr && Array.isArray(heatRows) && heatRows.length > 0) {
            const athleteMap = new Map();

            heatRows.forEach(heat => {
                const lanes = Array.isArray(heat.lanes_data) ? heat.lanes_data : [];
                lanes.forEach(sw => {
                    if (!sw || !sw.nama) return;
                    const nama = String(sw.nama).trim();
                    const klub = String(sw.klub || '').trim();
                    const f1 = sw.f1_id ? String(sw.f1_id).trim() : '';
                    const uid = f1
                        ? `f1_${f1.toLowerCase()}`
                        : `nm_${nama.toLowerCase()}__${klub.toLowerCase()}`;

                    if (!athleteMap.has(uid)) {
                        athleteMap.set(uid, {
                            f1_id: f1 || null,
                            nama_peserta: nama,
                            klub_asal: klub,
                            gender: heat.gender || '',
                            kelompok_umur: heat.kelompok_umur || '',
                            nomor_lomba: [],
                            status_pembayaran: 'Lunas',
                            _seenEvents: new Set()
                        });
                    }

                    const entry = athleteMap.get(uid);
                    const evKey = `${heat.event_number || ''}__${heat.nomor_lomba || ''}`;
                    if (!entry._seenEvents.has(evKey)) {
                        entry._seenEvents.add(evKey);
                        entry.nomor_lomba.push(heat.nomor_lomba || 'Nomor Lomba');
                    }
                });
            });

            if (athleteMap.size > 0) {
                return Array.from(athleteMap.values());
            }
        }
    } catch (_) {}

    // 4. Fallback terakhir ke race_results jika sudah ada catatan waktu
    try {
        const { data: resRows, error: resErr } = await supabaseClient
            .from('race_results')
            .select('athlete_f1_id, nama_peserta, klub_asal, gender, kelompok_umur, nomor_lomba')
            .eq('event_id', eventId);

        if (!resErr && Array.isArray(resRows) && resRows.length > 0) {
            const athleteMap = new Map();
            resRows.forEach(r => {
                if (!r || !r.nama_peserta) return;
                const nama = String(r.nama_peserta).trim();
                const klub = String(r.klub_asal || '').trim();
                const f1 = r.athlete_f1_id ? String(r.athlete_f1_id).trim() : '';
                const uid = f1
                    ? `f1_${f1.toLowerCase()}`
                    : `nm_${nama.toLowerCase()}__${klub.toLowerCase()}`;

                if (!athleteMap.has(uid)) {
                    athleteMap.set(uid, {
                        f1_id: f1 || null,
                        nama_peserta: nama,
                        klub_asal: klub,
                        gender: r.gender || '',
                        kelompok_umur: r.kelompok_umur || '',
                        nomor_lomba: [],
                        status_pembayaran: 'Lunas'
                    });
                }
                athleteMap.get(uid).nomor_lomba.push(r.nomor_lomba || 'Nomor Lomba');
            });
            return Array.from(athleteMap.values());
        }
    } catch (_) {}

    return [];
}

function buildAggregations(medals, registrations) {
    const kontingenMap = new Map();
    const individuMap = new Map();
    const uniqueGlobalAthletes = new Set();

    // 1. Seed dari daftar peserta terdaftar agar saat idle langsung muncul lengkap
    registrations.forEach(reg => {
        const klubInfo = normalizeKontingenLabel(reg.klub_asal);
        const nama = String(reg.nama_peserta || 'Tanpa Nama').trim();
        const athleteUid = reg.f1_id
            ? `f1_${String(reg.f1_id).trim().toLowerCase()}`
            : `nm_${nama.toLowerCase()}__${klubInfo.key}`;
        const entries = countNomorLomba(reg.nomor_lomba);

        uniqueGlobalAthletes.add(athleteUid);

        const rawStatus = String(reg.status_pembayaran || 'Lunas').trim();
        const isLunasRow = rawStatus.toLowerCase() === 'lunas';

        if (!kontingenMap.has(klubInfo.key)) {
            kontingenMap.set(klubInfo.key, {
                key: klubInfo.key,
                label: klubInfo.label,
                isIndividuGroup: klubInfo.isIndividuGroup,
                athleteSet: new Set(),
                athleteNames: new Set(),
                athleteStatusMap: new Map(),
                lunasAthleteSet: new Set(),
                antrianAthleteSet: new Set(),
                athleteCount: 0,
                antrianAthleteCount: 0,
                entryCount: 0,
                emas: 0,
                perak: 0,
                perunggu: 0,
                total: 0,
                items: []
            });
        }
        const kEntry = kontingenMap.get(klubInfo.key);
        kEntry.athleteSet.add(athleteUid);
        kEntry.athleteNames.add(nama);
        if (isLunasRow) kEntry.lunasAthleteSet.add(athleteUid);
        else kEntry.antrianAthleteSet.add(athleteUid);
        kEntry.athleteCount = kEntry.athleteSet.size;
        kEntry.antrianAthleteCount = Array.from(kEntry.antrianAthleteSet).filter(id => !kEntry.lunasAthleteSet.has(id)).length;
        kEntry.entryCount += entries;

        const prevAthleteStatus = kEntry.athleteStatusMap.get(nama) || { hasLunas: false, hasAntrian: false, lastRaw: rawStatus };
        if (isLunasRow) prevAthleteStatus.hasLunas = true;
        else {
            prevAthleteStatus.hasAntrian = true;
            prevAthleteStatus.lastRaw = rawStatus || 'Belum Bayar';
        }
        kEntry.athleteStatusMap.set(nama, prevAthleteStatus);

        const indKey = `${nama.toLowerCase()}__${klubInfo.key}`;
        if (!individuMap.has(indKey)) {
            individuMap.set(indKey, {
                key: indKey,
                label: nama,
                klubLabel: klubInfo.label,
                kelompokUmur: reg.kelompok_umur || '',
                gender: reg.gender || '',
                hasLunas: false,
                hasAntrian: false,
                lastStatus: rawStatus,
                athleteCount: 1,
                entryCount: 0,
                emas: 0,
                perak: 0,
                perunggu: 0,
                total: 0,
                items: []
            });
        }
        const iEntry = individuMap.get(indKey);
        if (isLunasRow) iEntry.hasLunas = true;
        else {
            iEntry.hasAntrian = true;
            iEntry.lastStatus = rawStatus || 'Belum Bayar';
        }
        iEntry.entryCount += entries;
    });

    // 2. Gabungkan perolehan medali resmi dari event_leaderboard
    medals.forEach(m => {
        const klubInfo = normalizeKontingenLabel(m.klub_asal);
        const nama = String(m.nama_peserta || 'Tanpa Nama').trim();

        if (!kontingenMap.has(klubInfo.key)) {
            kontingenMap.set(klubInfo.key, {
                key: klubInfo.key,
                label: klubInfo.label,
                isIndividuGroup: klubInfo.isIndividuGroup,
                athleteSet: new Set([`lb_${nama.toLowerCase()}`]),
                athleteNames: new Set([nama]),
                athleteCount: 1,
                entryCount: 1,
                emas: 0,
                perak: 0,
                perunggu: 0,
                total: 0,
                items: []
            });
        }
        const kEntry = kontingenMap.get(klubInfo.key);
        if (m.peringkat === 1) kEntry.emas++;
        else if (m.peringkat === 2) kEntry.perak++;
        else if (m.peringkat === 3) kEntry.perunggu++;
        kEntry.total++;
        kEntry.items.push(m);

        const indKey = `${nama.toLowerCase()}__${klubInfo.key}`;
        if (!individuMap.has(indKey)) {
            individuMap.set(indKey, {
                key: indKey,
                label: nama,
                klubLabel: klubInfo.label,
                kelompokUmur: m.kelompok_umur || '',
                gender: m.gender || '',
                athleteCount: 1,
                entryCount: 1,
                emas: 0,
                perak: 0,
                perunggu: 0,
                total: 0,
                items: []
            });
        }
        const iEntry = individuMap.get(indKey);
        if (m.peringkat === 1) iEntry.emas++;
        else if (m.peringkat === 2) iEntry.perak++;
        else if (m.peringkat === 3) iEntry.perunggu++;
        iEntry.total++;
        iEntry.items.push(m);
    });

    kontingenList = Array.from(kontingenMap.values());
    individuList = Array.from(individuMap.values());

    // Update Summary Stats & Status Banner
    const totalGold = medals.filter(m => m.peringkat === 1).length;
    const totalSilver = medals.filter(m => m.peringkat === 2).length;
    const totalBronze = medals.filter(m => m.peringkat === 3).length;

    document.getElementById('statTotalGold').innerText = totalGold;
    document.getElementById('statTotalSilver').innerText = totalSilver;
    document.getElementById('statTotalBronze').innerText = totalBronze;
    document.getElementById('statTotalKontingen').innerText = kontingenList.length;
    document.getElementById('statTotalAtlet').innerText = Math.max(uniqueGlobalAthletes.size, individuList.length);

    document.getElementById('countKontingen').innerText = kontingenList.length;
    document.getElementById('countIndividu').innerText = individuList.length;

    const idleBanner = document.getElementById('idleNoticeBanner');
    const statusPill = document.getElementById('liveStatusPill');
    if (isEventMaker && simulateAllParticipants) {
        if (idleBanner && medals.length === 0) idleBanner.classList.remove('hidden');
        else if (idleBanner) idleBanner.classList.add('hidden');
        if (statusPill) {
            statusPill.innerText = `🧪 Simulasi Maker • Lunas + Antrian`;
            statusPill.className = 'inline-flex items-center gap-1.5 bg-amber-400/25 text-amber-200 border border-amber-300/40 text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider';
        }
    } else if (medals.length === 0) {
        if (idleBanner) idleBanner.classList.remove('hidden');
        if (statusPill) {
            statusPill.innerText = '⏳ Pre-Race / Idle Lineup';
            statusPill.className = 'inline-flex items-center gap-1.5 bg-blue-500/25 text-blue-100 border border-blue-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider';
        }
    } else {
        if (idleBanner) idleBanner.classList.add('hidden');
        if (statusPill) {
            statusPill.innerText = `🟢 Live Standings • ${medals.length} Medali`;
            statusPill.className = 'inline-flex items-center gap-1.5 bg-emerald-500/25 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider';
        }
    }
}

function getMedalIcon(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
}

function computeOlympicRanks(sortedItems) {
    let currentRank = 0;
    return sortedItems.map((item, idx) => {
        if (item.total === 0) {
            return { ...item, displayRank: '-', isTied: false };
        }
        if (idx === 0) {
            currentRank = 1;
            return { ...item, displayRank: '1', isTied: false };
        }
        const prev = sortedItems[idx - 1];
        const sameMedals = prev.emas === item.emas && prev.perak === item.perak && prev.perunggu === item.perunggu;
        if (sameMedals) {
            return { ...item, displayRank: `=${currentRank}`, isTied: true };
        }
        currentRank = idx + 1;
        return { ...item, displayRank: String(currentRank), isTied: false };
    });
}

function renderAllViews() {
    const query = (document.getElementById('searchMedalInput')?.value || '').trim().toLowerCase();

    const sortLabel = idleSortMode === 'random' ? '🎲 Urut: Posisi Acak' : '👥 Urut: Peserta Terbanyak';
    const btnToolbar = document.getElementById('btnSortToolbar');
    const btnIdleBanner = document.getElementById('btnToggleIdleSort');
    if (btnToolbar) btnToolbar.innerText = sortLabel;
    if (btnIdleBanner) {
        btnIdleBanner.innerText = idleSortMode === 'random' ? '👥 Urut Peserta Terbanyak' : '🎲 Acak Posisi';
    }

    // =========================================================================
    // PANEL 1: KLASEMEN KLUB / SEKOLAH (OLYMPIC / ASIAN GAMES STANDINGS)
    // =========================================================================
    const tbodyKontingen = document.getElementById('tbodyKontingen');
    const sortedKontingen = computeOlympicRanks([...kontingenList].sort(sortStandings));
    const filteredKontingen = sortedKontingen.filter(k => {
        if (!query) return true;
        if (k.label.toLowerCase().includes(query)) return true;
        if (Array.from(k.athleteNames || []).some(nm => nm.toLowerCase().includes(query))) return true;
        return k.items.some(it =>
            String(it.nama_peserta || '').toLowerCase().includes(query) ||
            String(it.nomor_lomba || '').toLowerCase().includes(query)
        );
    });

    if (filteredKontingen.length === 0) {
        tbodyKontingen.innerHTML = `<tr><td colspan="7" class="py-10 px-4 text-center text-slate-400 font-bold">Belum ada data kontingen yang terdaftar pada event ini.</td></tr>`;
    } else {
        let html = '';
        filteredKontingen.forEach((k, idx) => {
            const detailId = `detail_kontingen_${idx}`;
            const hasMedals = k.total > 0;
            const isTop1 = hasMedals && (k.displayRank === '1' || k.displayRank === '=1');

            let rankBadgeHtml = `<span class="font-black text-slate-400">-</span>`;
            if (hasMedals) {
                if (k.displayRank === '1' || k.displayRank === '=1') {
                    rankBadgeHtml = `<span class="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-xs shadow-xs">${k.displayRank}</span>`;
                } else if (k.displayRank === '2' || k.displayRank === '=2') {
                    rankBadgeHtml = `<span class="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-slate-200 text-slate-900 font-black text-xs">${k.displayRank}</span>`;
                } else if (k.displayRank === '3' || k.displayRank === '=3') {
                    rankBadgeHtml = `<span class="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-orange-200 text-orange-950 font-black text-xs">${k.displayRank}</span>`;
                } else {
                    rankBadgeHtml = `<span class="font-black text-slate-700">${k.displayRank}</span>`;
                }
            }

            let detailContentHtml = '';
            if (k.items.length > 0) {
                detailContentHtml = k.items
                    .sort((a, b) => a.peringkat - b.peringkat)
                    .map(it => `
                        <div class="flex flex-wrap items-center justify-between gap-2 py-1.5 px-3 bg-white rounded-lg border border-slate-200/80 text-xs">
                            <div class="flex items-center gap-2">
                                <span class="text-base">${getMedalIcon(it.peringkat)}</span>
                                <span class="font-extrabold text-slate-800 uppercase">${escapeHtml(it.nama_peserta)}</span>
                                <span class="text-slate-500 font-semibold">• ${escapeHtml(it.nomor_lomba)} (${escapeHtml(it.kelompok_umur || '')} ${escapeHtml(it.gender || '')})</span>
                            </div>
                            <span class="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">⏱️ ${escapeHtml(it.catatan_waktu || '-')}</span>
                        </div>
                    `).join('');
            } else {
                const namesList = Array.from(k.athleteNames || []).sort((a, b) => a.localeCompare(b, 'id'));
                detailContentHtml = `
                    <div class="bg-white rounded-lg border border-slate-200/80 p-3 text-xs">
                        <p class="font-bold text-slate-500 mb-1.5">🏊‍♂️ Daftar Atlet Terdaftar (${namesList.length} Atlet • ${k.entryCount} Nomor):</p>
                        <div class="flex flex-wrap gap-1.5">
                            ${namesList.map(nm => {
                                let stTag = '';
                                if (isEventMaker && simulateAllParticipants && k.athleteStatusMap?.has(nm)) {
                                    const stObj = k.athleteStatusMap.get(nm);
                                    if (stObj.hasAntrian && !stObj.hasLunas) {
                                        const isProses = String(stObj.lastRaw || '').toLowerCase().includes('konfirmasi');
                                        stTag = isProses
                                            ? ` <span class="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded text-[9px] font-black">PROSES</span>`
                                            : ` <span class="bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded text-[9px] font-black">ANTRIAN</span>`;
                                    } else if (stObj.hasAntrian && stObj.hasLunas) {
                                        stTag = ` <span class="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded text-[9px] font-black">LUNAS+ANTRIAN</span>`;
                                    } else {
                                        stTag = ` <span class="bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded text-[9px] font-black">LUNAS</span>`;
                                    }
                                }
                                return `<span class="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-md uppercase text-[11px] inline-flex items-center gap-1">${escapeHtml(nm)}${stTag}</span>`;
                            }).join('')}
                        </div>
                    </div>
                `;
            }

            html += `
                <tr class="hover:bg-blue-50/40 transition cursor-pointer ${isTop1 ? 'bg-amber-50/50' : ''}" onclick="document.getElementById('${detailId}').classList.toggle('hidden')">
                    <td class="py-3.5 px-3 text-center">${rankBadgeHtml}</td>
                    <td class="py-3.5 px-3">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="font-black text-slate-900 uppercase">${escapeHtml(k.label)}</span>
                            ${k.isIndividuGroup ? '<span class="text-[9px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded uppercase">Individu</span>' : ''}
                            ${(isEventMaker && simulateAllParticipants && (k.antrianAthleteCount || 0) > 0) ? `<span class="text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded uppercase">+${k.antrianAthleteCount} Antrian</span>` : ''}
                            <span class="text-[10px] text-blue-600 font-bold">▾</span>
                        </div>
                    </td>
                    <td class="py-3.5 px-2 text-center font-bold text-slate-500">${k.athleteCount}</td>
                    <td class="py-3.5 px-2 text-center font-black ${k.emas > 0 ? 'text-amber-600' : 'text-slate-300'}">${k.emas}</td>
                    <td class="py-3.5 px-2 text-center font-black ${k.perak > 0 ? 'text-slate-700' : 'text-slate-300'}">${k.perak}</td>
                    <td class="py-3.5 px-2 text-center font-black ${k.perunggu > 0 ? 'text-orange-700' : 'text-slate-300'}">${k.perunggu}</td>
                    <td class="py-3.5 px-3 text-center font-black ${hasMedals ? 'text-blue-950 bg-slate-100/80' : 'text-slate-400 bg-slate-50'}">${k.total}</td>
                </tr>
                <tr id="${detailId}" class="hidden bg-slate-50">
                    <td colspan="7" class="p-3">
                        <div class="space-y-1.5">${detailContentHtml}</div>
                    </td>
                </tr>
            `;
        });
        tbodyKontingen.innerHTML = html;
    }

    // =========================================================================
    // PANEL 2: KLASEMEN INDIVIDU / ATLET
    // =========================================================================
    const tbodyIndividu = document.getElementById('tbodyIndividu');
    const sortedIndividu = computeOlympicRanks([...individuList].sort(sortStandings));
    const filteredIndividu = sortedIndividu.filter(ind => {
        if (!query) return true;
        return ind.label.toLowerCase().includes(query) ||
            ind.klubLabel.toLowerCase().includes(query) ||
            ind.items.some(it => String(it.nomor_lomba || '').toLowerCase().includes(query));
    });

    if (filteredIndividu.length === 0) {
        tbodyIndividu.innerHTML = `<tr><td colspan="7" class="py-10 px-4 text-center text-slate-400 font-bold">Belum ada data atlet terdaftar yang sesuai filter.</td></tr>`;
    } else {
        let html = '';
        filteredIndividu.forEach(ind => {
            const hasMedals = ind.total > 0;
            const isTop1 = hasMedals && (ind.displayRank === '1' || ind.displayRank === '=1');

            const badgesNomor = ind.items.length > 0
                ? ind.items
                    .sort((a, b) => a.peringkat - b.peringkat)
                    .map(it => `<span class="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 border border-amber-200 text-slate-800 px-2 py-0.5 rounded-md mr-1 mt-1">${getMedalIcon(it.peringkat)} ${escapeHtml(it.nomor_lomba)} (${escapeHtml(it.catatan_waktu || '-')})</span>`)
                    .join('')
                : `<span class="inline-block text-[10px] font-semibold text-slate-400 mt-0.5">${escapeHtml([ind.kelompokUmur, ind.gender].filter(Boolean).join(' • ') || 'Terdaftar')}</span>`;

            html += `
                <tr class="hover:bg-blue-50/40 transition ${isTop1 ? 'bg-amber-50/50' : ''}">
                    <td class="py-3.5 px-3 text-center font-black ${hasMedals ? 'text-amber-600' : 'text-slate-400'}">${ind.displayRank}</td>
                    <td class="py-3.5 px-3">
                        <p class="font-black text-slate-900 uppercase flex items-center gap-1.5 flex-wrap">
                            <span>${escapeHtml(ind.label)}</span>
                            ${(isEventMaker && simulateAllParticipants) ? (
                                ind.hasAntrian && !ind.hasLunas
                                    ? (String(ind.lastStatus || '').toLowerCase().includes('konfirmasi')
                                        ? '<span class="text-[9px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase">Proses</span>'
                                        : '<span class="text-[9px] font-black bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded uppercase">Antrian</span>')
                                    : (ind.hasAntrian && ind.hasLunas
                                        ? '<span class="text-[9px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase">Lunas + Antrian</span>'
                                        : '<span class="text-[9px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase">Lunas</span>')
                            ) : ''}
                        </p>
                        <p class="text-[11px] font-bold text-slate-500">🏠 ${escapeHtml(ind.klubLabel)}</p>
                        <div>${badgesNomor}</div>
                    </td>
                    <td class="py-3.5 px-2 text-center font-bold text-slate-500">${ind.entryCount}</td>
                    <td class="py-3.5 px-2 text-center font-black ${ind.emas > 0 ? 'text-amber-600' : 'text-slate-300'}">${ind.emas}</td>
                    <td class="py-3.5 px-2 text-center font-black ${ind.perak > 0 ? 'text-slate-700' : 'text-slate-300'}">${ind.perak}</td>
                    <td class="py-3.5 px-2 text-center font-black ${ind.perunggu > 0 ? 'text-orange-700' : 'text-slate-300'}">${ind.perunggu}</td>
                    <td class="py-3.5 px-3 text-center font-black ${hasMedals ? 'text-blue-950 bg-slate-100/80' : 'text-slate-400 bg-slate-50'}">${ind.total}</td>
                </tr>
            `;
        });
        tbodyIndividu.innerHTML = html;
    }

    // =========================================================================
    // PANEL 3: AUDIT RINCIAN SEMUA NOMOR
    // =========================================================================
    const panelRincian = document.getElementById('panelRincian');
    const filteredRincian = rawMedals.filter(m => {
        if (!query) return true;
        return String(m.nama_peserta || '').toLowerCase().includes(query) ||
            String(m.klub_asal || '').toLowerCase().includes(query) ||
            String(m.nomor_lomba || '').toLowerCase().includes(query);
    });

    if (filteredRincian.length === 0) {
        panelRincian.innerHTML = `
            <div class="bg-white rounded-2xl p-8 border border-slate-200 text-center">
                <span class="text-4xl block mb-2">⏱️</span>
                <p class="text-slate-700 font-black text-sm">Belum Ada Nomor Lomba yang Selesai / Dipublish Wasit</p>
                <p class="text-xs text-slate-400 mt-1">Rincian medali per nomor lomba akan muncul otomatis di tab ini setelah hasil dipublish.</p>
            </div>`;
    } else {
        const groupedByNomor = filteredRincian.reduce((acc, cur) => {
            const key = `${cur.nomor_lomba} ${cur.gender || ''} ${cur.kelompok_umur || ''}`.trim();
            if (!acc[key]) acc[key] = [];
            acc[key].push(cur);
            return acc;
        }, {});

        let rincianHtml = '';
        for (const [nomorTitle, list] of Object.entries(groupedByNomor)) {
            list.sort((a, b) => a.peringkat - b.peringkat);
            const rows = list.map(item => `
                <div class="p-3.5 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">${getMedalIcon(item.peringkat)}</span>
                        <div>
                            <p class="font-black text-slate-800 text-xs md:text-sm uppercase">${escapeHtml(item.nama_peserta)}</p>
                            <p class="text-[11px] font-bold text-slate-500">🏠 ${escapeHtml(normalizeKontingenLabel(item.klub_asal).label)}</p>
                        </div>
                    </div>
                    <span class="font-mono text-xs font-black bg-sky-100 text-sky-800 px-2.5 py-1 rounded-lg">⏱️ ${escapeHtml(item.catatan_waktu || '-')}</span>
                </div>
            `).join('');

            rincianHtml += `
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div class="bg-slate-900 px-4 py-2.5 text-xs font-black text-amber-400 uppercase tracking-wide">
                        🏊‍♂️ ${escapeHtml(nomorTitle)}
                    </div>
                    <div class="divide-y divide-slate-100">${rows}</div>
                </div>
            `;
        }
        panelRincian.innerHTML = rincianHtml;
    }
}

function switchTab(tabName) {
    activeTab = tabName;
    const tabs = {
        kontingen: { btn: document.getElementById('tabKontingen'), panel: document.getElementById('panelKontingen') },
        individu: { btn: document.getElementById('tabIndividu'), panel: document.getElementById('panelIndividu') },
        rincian: { btn: document.getElementById('tabRincian'), panel: document.getElementById('panelRincian') }
    };

    Object.entries(tabs).forEach(([key, el]) => {
        if (!el.btn || !el.panel) return;
        if (key === tabName) {
            el.btn.className = 'flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black bg-white text-blue-950 shadow-sm transition cursor-pointer';
            el.panel.classList.remove('hidden');
        } else {
            el.btn.className = 'flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer';
            el.panel.classList.add('hidden');
        }
    });
}

function applyMakerSimulationState() {
    if (!isEventMaker) {
        rawRegistrations = publicLineupRegistrations;
        return;
    }

    const lunasList = makerAllRegistrations.filter(r => String(r.status_pembayaran || '').toLowerCase() === 'lunas');
    const antrianList = makerAllRegistrations.filter(r => String(r.status_pembayaran || '').toLowerCase() !== 'lunas');

    const statsEl = document.getElementById('makerSimulasiStats');
    const labelEl = document.getElementById('labelSimulasiPeserta');
    const badgeEl = document.getElementById('makerSimulasiBadge');

    if (statsEl) {
        statsEl.innerHTML = `Data terdaftar: <strong class="text-emerald-700">${lunasList.length} Lunas</strong> • <strong class="text-amber-700">${antrianList.length} Antrian</strong> (Belum Bayar / Proses) • Total Simulasi: <strong class="text-slate-900">${makerAllRegistrations.length} Data</strong>.`;
    }
    if (labelEl) {
        labelEl.innerText = simulateAllParticipants ? 'Semua (Lunas + Antrian)' : 'Lunas Saja';
        labelEl.className = simulateAllParticipants
            ? 'text-[11px] font-black text-amber-800 uppercase tracking-wider'
            : 'text-[11px] font-black text-slate-600 uppercase tracking-wider';
    }
    if (badgeEl) {
        if (simulateAllParticipants) badgeEl.classList.remove('hidden');
        else badgeEl.classList.add('hidden');
    }

    if (simulateAllParticipants) {
        rawRegistrations = makerAllRegistrations;
    } else {
        rawRegistrations = lunasList.length > 0 ? lunasList : publicLineupRegistrations;
    }

    buildAggregations(rawMedals, rawRegistrations);
}

async function loadMedalData() {
    const loadingEl = document.getElementById('loadingIndicator');
    loadingEl.classList.remove('hidden');

    try {
        if (!resolvedEventId) {
            resolvedEventId = await resolveEventIdFromContext();
        }
        if (!resolvedEventId) {
            loadingEl.innerHTML = `<span class="text-red-600 font-bold">❌ ID Event tidak ditemukan di URL.</span>`;
            return;
        }

        const btnToLeaderboard = document.getElementById('btnToLeaderboard');
        if (btnToLeaderboard) {
            btnToLeaderboard.href = `/event-leaderboard.html?id=${resolvedEventId}`;
        }

        const [evRes, lineupRows, lbRes, sessionRes] = await Promise.all([
            supabaseClient
                .from('events')
                .select('*')
                .eq('id', resolvedEventId)
                .single(),
            fetchParticipantLineup(resolvedEventId),
            supabaseClient
                .from('event_leaderboard')
                .select('*')
                .eq('event_id', resolvedEventId)
                .in('peringkat', [1, 2, 3])
                .order('nomor_lomba', { ascending: true })
                .order('peringkat', { ascending: true }),
            supabaseClient.auth.getSession()
        ]);

        const currentUserId = sessionRes?.data?.session?.user?.id || null;
        isEventMaker = false;

        if (evRes.data) {
            const ev = evRes.data;
            document.getElementById('eventName').innerText = ev.event_name;
            const lokasi = [ev.kota, ev.provinsi].filter(Boolean).join(', ');
            const tgl = ev.event_date ? (ev.end_date && ev.end_date !== ev.event_date ? `${ev.event_date} s/d ${ev.end_date}` : ev.event_date) : '';
            document.getElementById('eventMeta').innerText = [lokasi, tgl].filter(Boolean).join(' • ') || 'Klasemen Medali Resmi';
            await fetchAndRenderSponsors(resolvedEventId);

            if (currentUserId) {
                const ownerIds = [ev.user_id, ev.creator_id, ev.owner_id, ev.created_by]
                    .filter(Boolean)
                    .map(v => String(v));
                if (ownerIds.includes(String(currentUserId))) {
                    isEventMaker = true;
                } else {
                    try {
                        const { data: collabRow } = await supabaseClient
                            .from('event_collaborators')
                            .select('id')
                            .eq('event_id', resolvedEventId)
                            .eq('user_id', currentUserId)
                            .maybeSingle();
                        if (collabRow) isEventMaker = true;
                    } catch (_) {}
                }
            }
        }

        publicLineupRegistrations = Array.isArray(lineupRows) ? lineupRows : [];
        makerAllRegistrations = [...publicLineupRegistrations];

        if (isEventMaker) {
            try {
                const { data: allRegs, error: allRegsErr } = await supabaseClient
                    .from('event_registrations')
                    .select('f1_id, nama_peserta, klub_asal, gender, kelompok_umur, nomor_lomba, status_pembayaran')
                    .eq('event_id', resolvedEventId);

                if (!allRegsErr && Array.isArray(allRegs)) {
                    makerAllRegistrations = allRegs;
                }
            } catch (_) {}

            const makerBanner = document.getElementById('makerSimulationBanner');
            if (makerBanner) makerBanner.classList.remove('hidden');
        }

        rawMedals = (!lbRes.error && Array.isArray(lbRes.data)) ? lbRes.data : [];

        applyMakerSimulationState();

        loadingEl.classList.add('hidden');
        switchTab(activeTab);
        renderAllViews();
    } catch (err) {
        console.error(err);
        loadingEl.innerHTML = `<span class="text-red-600 font-bold">❌ Gagal memuat klasemen medali: ${escapeHtml(err.message)}</span>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('tabKontingen')?.addEventListener('click', () => switchTab('kontingen'));
    document.getElementById('tabIndividu')?.addEventListener('click', () => switchTab('individu'));
    document.getElementById('tabRincian')?.addEventListener('click', () => switchTab('rincian'));
    document.getElementById('searchMedalInput')?.addEventListener('input', renderAllViews);
    document.getElementById('btnRefreshMedal')?.addEventListener('click', loadMedalData);

    const toggleSortMode = () => {
        if (idleSortMode === 'participants') {
            idleSortMode = 'random';
            reshuffleRandomWeights();
        } else {
            idleSortMode = 'participants';
        }
        renderAllViews();
    };

    document.getElementById('btnSortToolbar')?.addEventListener('click', toggleSortMode);
    document.getElementById('btnToggleIdleSort')?.addEventListener('click', toggleSortMode);

    document.getElementById('toggleSimulasiSemuaPeserta')?.addEventListener('change', (e) => {
        simulateAllParticipants = Boolean(e.target.checked);
        applyMakerSimulationState();
        renderAllViews();
    });

    document.getElementById('btnShareMedal')?.addEventListener('click', async () => {
        const shareUrl = window.location.href;
        const title = `Medal Standings - ${document.getElementById('eventName')?.innerText || 'SCS'}`;
        if (navigator.share) {
            try {
                await navigator.share({ title, text: `Pantau klasemen perolehan medali klub/sekolah & individu di sini:`, url: shareUrl });
                return;
            } catch (_) {}
        }
        await navigator.clipboard.writeText(shareUrl);
        alert('✅ Link Klasemen Medali berhasil disalin!');
    });

    loadMedalData();
});
