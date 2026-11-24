import { supabaseClient } from './supabase.js';

let rawMedals = [];
let kontingenList = [];
let individuList = [];
let activeTab = 'kontingen';
let resolvedEventId = null;

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

function sortMedalStandings(a, b) {
    if (b.emas !== a.emas) return b.emas - a.emas;
    if (b.perak !== a.perak) return b.perak - a.perak;
    if (b.perunggu !== a.perunggu) return b.perunggu - a.perunggu;
    return a.label.localeCompare(b.label, 'id');
}

async function resolveEventIdFromContext() {
    const urlParams = new URLSearchParams(window.location.search);
    const paramId = urlParams.get('id');
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
                <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 text-center mb-6">
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

function buildAggregations(medals) {
    // 1. Agregasi per Klub / Sekolah / Kontingen
    const kontingenMap = new Map();
    medals.forEach(m => {
        const info = normalizeKontingenLabel(m.klub_asal);
        if (!kontingenMap.has(info.key)) {
            kontingenMap.set(info.key, {
                key: info.key,
                label: info.label,
                isIndividuGroup: info.isIndividuGroup,
                emas: 0,
                perak: 0,
                perunggu: 0,
                total: 0,
                items: []
            });
        }
        const entry = kontingenMap.get(info.key);
        if (m.peringkat === 1) entry.emas++;
        else if (m.peringkat === 2) entry.perak++;
        else if (m.peringkat === 3) entry.perunggu++;
        entry.total++;
        entry.items.push(m);
    });

    kontingenList = Array.from(kontingenMap.values()).sort(sortMedalStandings);

    // 2. Agregasi per Individu / Atlet
    const individuMap = new Map();
    medals.forEach(m => {
        const nama = String(m.nama_peserta || 'Tanpa Nama').trim();
        const klubInfo = normalizeKontingenLabel(m.klub_asal);
        const indKey = `${nama.toLowerCase()}__${klubInfo.key}`;

        if (!individuMap.has(indKey)) {
            individuMap.set(indKey, {
                key: indKey,
                label: nama,
                klubLabel: klubInfo.label,
                emas: 0,
                perak: 0,
                perunggu: 0,
                total: 0,
                items: []
            });
        }
        const entry = individuMap.get(indKey);
        if (m.peringkat === 1) entry.emas++;
        else if (m.peringkat === 2) entry.perak++;
        else if (m.peringkat === 3) entry.perunggu++;
        entry.total++;
        entry.items.push(m);
    });

    individuList = Array.from(individuMap.values()).sort(sortMedalStandings);

    // Update Summary Stats
    const totalGold = medals.filter(m => m.peringkat === 1).length;
    const totalSilver = medals.filter(m => m.peringkat === 2).length;
    const totalBronze = medals.filter(m => m.peringkat === 3).length;

    document.getElementById('statTotalGold').innerText = totalGold;
    document.getElementById('statTotalSilver').innerText = totalSilver;
    document.getElementById('statTotalBronze').innerText = totalBronze;
    document.getElementById('statTotalAll').innerText = medals.length;

    document.getElementById('countKontingen').innerText = kontingenList.length;
    document.getElementById('countIndividu').innerText = individuList.length;
}

function getMedalIcon(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
}

function renderAllViews() {
    const query = (document.getElementById('searchMedalInput')?.value || '').trim().toLowerCase();

    // Render Panel 1: Kontingen
    const tbodyKontingen = document.getElementById('tbodyKontingen');
    const filteredKontingen = kontingenList.filter(k => {
        if (!query) return true;
        if (k.label.toLowerCase().includes(query)) return true;
        return k.items.some(it =>
            String(it.nama_peserta || '').toLowerCase().includes(query) ||
            String(it.nomor_lomba || '').toLowerCase().includes(query)
        );
    });

    if (filteredKontingen.length === 0) {
        tbodyKontingen.innerHTML = `<tr><td colspan="6" class="py-8 px-4 text-center text-slate-400 font-bold">Belum ada perolehan medali yang sesuai filter.</td></tr>`;
    } else {
        let html = '';
        filteredKontingen.forEach((k, idx) => {
            const rank = idx + 1;
            const rankDisplay = rank === 1 ? '👑 1' : (rank === 2 ? '🥈 2' : (rank === 3 ? '🥉 3' : rank));
            const rowHighlight = rank === 1 ? 'bg-amber-50/60' : '';
            const detailId = `detail_kontingen_${idx}`;

            const detailRows = k.items
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

            html += `
                <tr class="hover:bg-slate-50 transition cursor-pointer ${rowHighlight}" onclick="document.getElementById('${detailId}').classList.toggle('hidden')">
                    <td class="py-3.5 px-3 text-center font-black ${rank <= 3 ? 'text-amber-600' : 'text-slate-500'}">${rankDisplay}</td>
                    <td class="py-3.5 px-3">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="font-black text-slate-900 uppercase">${escapeHtml(k.label)}</span>
                            ${k.isIndividuGroup ? '<span class="text-[9px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded uppercase">Individu</span>' : ''}
                            <span class="text-[10px] text-blue-600 font-bold underline">Rincian ▾</span>
                        </div>
                    </td>
                    <td class="py-3.5 px-2 text-center font-black text-amber-600">${k.emas}</td>
                    <td class="py-3.5 px-2 text-center font-black text-slate-600">${k.perak}</td>
                    <td class="py-3.5 px-2 text-center font-black text-orange-700">${k.perunggu}</td>
                    <td class="py-3.5 px-3 text-center font-black text-blue-950 bg-slate-50">${k.total}</td>
                </tr>
                <tr id="${detailId}" class="hidden bg-slate-50/90">
                    <td colspan="6" class="p-3">
                        <div class="space-y-1.5">${detailRows}</div>
                    </td>
                </tr>
            `;
        });
        tbodyKontingen.innerHTML = html;
    }

    // Render Panel 2: Individu
    const tbodyIndividu = document.getElementById('tbodyIndividu');
    const filteredIndividu = individuList.filter(ind => {
        if (!query) return true;
        return ind.label.toLowerCase().includes(query) ||
            ind.klubLabel.toLowerCase().includes(query) ||
            ind.items.some(it => String(it.nomor_lomba || '').toLowerCase().includes(query));
    });

    if (filteredIndividu.length === 0) {
        tbodyIndividu.innerHTML = `<tr><td colspan="6" class="py-8 px-4 text-center text-slate-400 font-bold">Belum ada perolehan medali individu yang sesuai filter.</td></tr>`;
    } else {
        let html = '';
        filteredIndividu.forEach((ind, idx) => {
            const rank = idx + 1;
            const rankDisplay = rank === 1 ? '👑 1' : (rank === 2 ? '🥈 2' : (rank === 3 ? '🥉 3' : rank));
            const badgesNomor = ind.items
                .sort((a, b) => a.peringkat - b.peringkat)
                .map(it => `<span class="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md mr-1 mt-1">${getMedalIcon(it.peringkat)} ${escapeHtml(it.nomor_lomba)} (${escapeHtml(it.catatan_waktu || '-')})</span>`)
                .join('');

            html += `
                <tr class="hover:bg-slate-50 transition ${rank === 1 ? 'bg-amber-50/60' : ''}">
                    <td class="py-3.5 px-3 text-center font-black ${rank <= 3 ? 'text-amber-600' : 'text-slate-500'}">${rankDisplay}</td>
                    <td class="py-3.5 px-3">
                        <p class="font-black text-slate-900 uppercase">${escapeHtml(ind.label)}</p>
                        <p class="text-[11px] font-bold text-slate-500">🏠 ${escapeHtml(ind.klubLabel)}</p>
                        <div class="mt-1">${badgesNomor}</div>
                    </td>
                    <td class="py-3.5 px-2 text-center font-black text-amber-600">${ind.emas}</td>
                    <td class="py-3.5 px-2 text-center font-black text-slate-600">${ind.perak}</td>
                    <td class="py-3.5 px-2 text-center font-black text-orange-700">${ind.perunggu}</td>
                    <td class="py-3.5 px-3 text-center font-black text-blue-950 bg-slate-50">${ind.total}</td>
                </tr>
            `;
        });
        tbodyIndividu.innerHTML = html;
    }

    // Render Panel 3: Audit Rincian Semua Nomor
    const panelRincian = document.getElementById('panelRincian');
    const filteredRincian = rawMedals.filter(m => {
        if (!query) return true;
        return String(m.nama_peserta || '').toLowerCase().includes(query) ||
            String(m.klub_asal || '').toLowerCase().includes(query) ||
            String(m.nomor_lomba || '').toLowerCase().includes(query);
    });

    if (filteredRincian.length === 0) {
        panelRincian.innerHTML = `<div class="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-400 font-bold text-sm">Belum ada data medali resmi yang dipublish.</div>`;
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

        const { data: ev } = await supabaseClient
            .from('events')
            .select('event_name, event_date, end_date, kota, provinsi')
            .eq('id', resolvedEventId)
            .single();

        if (ev) {
            document.getElementById('eventName').innerText = ev.event_name;
            const lokasi = [ev.kota, ev.provinsi].filter(Boolean).join(', ');
            const tgl = ev.event_date ? (ev.end_date && ev.end_date !== ev.event_date ? `${ev.event_date} s/d ${ev.end_date}` : ev.event_date) : '';
            document.getElementById('eventMeta').innerText = [lokasi, tgl].filter(Boolean).join(' • ') || 'Klasemen Medali Resmi';
            await fetchAndRenderSponsors(resolvedEventId);
        }

        const { data: leaderboardRows, error } = await supabaseClient
            .from('event_leaderboard')
            .select('*')
            .eq('event_id', resolvedEventId)
            .in('peringkat', [1, 2, 3])
            .order('nomor_lomba', { ascending: true })
            .order('peringkat', { ascending: true });

        if (error) throw error;

        rawMedals = leaderboardRows || [];
        buildAggregations(rawMedals);

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

    document.getElementById('btnShareMedal')?.addEventListener('click', async () => {
        const shareUrl = window.location.href;
        const title = `Klasemen Medali - ${document.getElementById('eventName')?.innerText || 'SCS'}`;
        if (navigator.share) {
            try {
                await navigator.share({ title, text: `Cek perolehan medali resmi klub/sekolah & individu di sini:`, url: shareUrl });
                return;
            } catch (_) {}
        }
        await navigator.clipboard.writeText(shareUrl);
        alert('✅ Link Klasemen Medali berhasil disalin!');
    });

    loadMedalData();
});
