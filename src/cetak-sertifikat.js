import { supabaseClient } from './supabase.js';

let eventId = null;
let eventData = null;
let certConfigsByType = {};
let activeTab = 'peserta';
let itemsByType = {
    peserta: [],
    juara: [],
    juara_seri: [],
    mvs: []
};

function computeDeterministicCode(seedStr) {
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

function renderCustomFieldValue(field, seedContext, seqIndex = 1) {
    const tpl = (field.template || '').trim();
    const yearStr = String(new Date().getFullYear());
    const seqStr = String(seqIndex).padStart(3, '0');
    const randStr = computeDeterministicCode(`${eventId}|${activeTab}|${seedContext}|${field.id}`);

    if (field.mode === 'static_text') return tpl || field.label || '';
    const baseTpl = tpl || (field.mode === 'auto_number' ? 'NO. {SEQ}/SCS/{YEAR}' : 'NO. {RAND}/SCS/{YEAR}');
    return baseTpl
        .replace(/\{RAND\}/gi, randStr)
        .replace(/\{ACAK\}/gi, randStr)
        .replace(/\{SEQ\}/gi, seqStr)
        .replace(/\{YEAR\}/gi, yearStr);
}

function parseTimeToMs(timeStr) {
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

function toTitleCase(str) {
    return (str || '').toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    eventId = urlParams.get('id');
    const initialTab = urlParams.get('tab');
    if (initialTab && ['peserta', 'juara', 'juara_seri', 'mvs'].includes(initialTab)) {
        activeTab = initialTab;
    }

    const loadingEl = document.getElementById('loadingIndicator');
    if (!eventId) {
        loadingEl.innerHTML = "❌ Link tidak valid. ID Lomba tidak ditemukan.";
        return;
    }

    try {
        const { data: event, error: errEvent } = await supabaseClient
            .from('events')
            .select('event_name')
            .eq('id', eventId)
            .single();

        if (errEvent) throw new Error("Gagal load event: " + errEvent.message);
        if (event) {
            document.getElementById('eventName').innerText = event.event_name;
            eventData = event;
        }

        // 1. Ambil semua template sertifikat yang aktif di event ini
        const { data: certs, error: errCert } = await supabaseClient
            .from('event_certificates')
            .select('*')
            .eq('event_id', eventId);

        if (errCert) throw errCert;
        (certs || []).forEach(c => {
            certConfigsByType[c.tipe] = c;
        });

        // 2. Muat data Peserta
        const { data: peserta } = await supabaseClient
            .from('event_registrations')
            .select('nama_peserta, klub_asal, f1_id, gender')
            .eq('event_id', eventId);

        if (peserta) {
            const seen = new Set();
            peserta.forEach(p => {
                if (!p.nama_peserta || p.gender === 'Regu/Tim') return;
                const key = p.nama_peserta.trim().toUpperCase();
                if (seen.has(key)) return;
                seen.add(key);
                itemsByType.peserta.push({
                    nama: p.nama_peserta.trim(),
                    sub: p.klub_asal || 'Unattached',
                    predikat: '',
                    nomor: '',
                    ku: '',
                    seedKey: `peserta|${key}`
                });
            });
        }

        // 3. Muat data Pemenang (Juara 1, 2, 3)
        const { data: winners } = await supabaseClient
            .from('event_leaderboard')
            .select('*')
            .eq('event_id', eventId)
            .lte('peringkat', 3)
            .order('event_number', { ascending: true })
            .order('peringkat', { ascending: true });

        (winners || []).forEach((w, idx) => {
            itemsByType.juara.push({
                nama: w.nama_peserta,
                sub: `Juara ${w.peringkat} • ${w.nomor_lomba} (${w.kelompok_umur} ${w.gender})`,
                predikat: `JUARA ${w.peringkat}`,
                nomor: w.nomor_lomba,
                ku: `${w.kelompok_umur} ${w.gender} • ${w.catatan_waktu || ''}`.trim(),
                seedKey: `juara|${w.id || idx}|${w.nama_peserta}`
            });
        });

        // 4. Muat data Juara Seri/Heat (Rank 1 tercepat tiap Seri/Heat di event_heats)
        const { data: heats } = await supabaseClient
            .from('event_heats')
            .select('*')
            .eq('event_id', eventId)
            .order('event_number', { ascending: true })
            .order('heat_number', { ascending: true });

        (heats || []).forEach(h => {
            if (!Array.isArray(h.lanes_data)) return;
            const validSwimmers = h.lanes_data
                .filter(s => s && s.nama && parseTimeToMs(s.waktu_tempuh) < Infinity)
                .sort((a, b) => parseTimeToMs(a.waktu_tempuh) - parseTimeToMs(b.waktu_tempuh));

            if (validSwimmers.length > 0) {
                const topSwimmer = validSwimmers[0];
                itemsByType.juara_seri.push({
                    nama: topSwimmer.nama,
                    sub: `Juara 1 Seri/Heat ${h.heat_number} • ${h.nomor_lomba} (${h.kelompok_umur} ${h.gender})`,
                    predikat: `JUARA 1 SERI/HEAT ${h.heat_number}`,
                    nomor: h.nomor_lomba,
                    ku: `${h.kelompok_umur} ${h.gender} • ${topSwimmer.waktu_tempuh}`,
                    seedKey: `seri|${h.event_number}|${h.heat_number}|${topSwimmer.nama}`
                });
            }
        });

        // 5. Muat data MVS (dari config_json.mvsAthletes atau kalkulasi otomatis)
        const mvsCert = certConfigsByType.mvs;
        if (mvsCert && Array.isArray(mvsCert.config_json?.mvsAthletes) && mvsCert.config_json.mvsAthletes.length > 0) {
            mvsCert.config_json.mvsAthletes.forEach((m, idx) => {
                itemsByType.mvs.push({
                    nama: m.nama,
                    sub: `MVS • ${m.kategori || 'Best Swimmer'} (${m.poin || '-'})`,
                    predikat: 'MOST VALUABLE SWIMMER (MVS)',
                    nomor: m.kategori || 'Best Swimmer',
                    ku: m.poin || '',
                    seedKey: `mvs|${idx}|${m.nama}`
                });
            });
        } else if (winners && winners.length > 0) {
            const groupMap = {};
            winners.forEach(row => {
                const groupKey = `${row.kelompok_umur || 'Umum'} ${row.gender || ''}`.trim();
                if (!groupMap[groupKey]) groupMap[groupKey] = {};
                const k = (row.nama_peserta || '').trim().toUpperCase();
                if (!k) return;
                if (!groupMap[groupKey][k]) {
                    groupMap[groupKey][k] = { nama: row.nama_peserta.trim(), klub: row.klub_asal || '', gold: 0, silver: 0, bronze: 0, points: 0 };
                }
                if (Number(row.peringkat) === 1) { groupMap[groupKey][k].gold++; groupMap[groupKey][k].points += 5; }
                else if (Number(row.peringkat) === 2) { groupMap[groupKey][k].silver++; groupMap[groupKey][k].points += 3; }
                else if (Number(row.peringkat) === 3) { groupMap[groupKey][k].bronze++; groupMap[groupKey][k].points += 1; }
            });
            Object.entries(groupMap).forEach(([groupKey, athObj], idx) => {
                const top = Object.values(athObj).sort((a, b) => b.points - a.points || b.gold - a.gold || b.silver - a.silver)[0];
                if (top) {
                    const medTxt = [top.gold ? `${top.gold} Emas` : '', top.silver ? `${top.silver} Perak` : '', top.bronze ? `${top.bronze} Perunggu` : ''].filter(Boolean).join(', ');
                    itemsByType.mvs.push({
                        nama: top.nama,
                        sub: `MVS ${groupKey} • ${medTxt}`,
                        predikat: 'MOST VALUABLE SWIMMER (MVS)',
                        nomor: top.klub ? `${groupKey} • ${top.klub}` : groupKey,
                        ku: `${medTxt} (${top.points} Poin)`,
                        seedKey: `mvs_auto|${idx}|${top.nama}`
                    });
                }
            });
        }

        setupTabs();
        switchTab(activeTab);

    } catch (error) {
        console.error(error);
        loadingEl.innerHTML = `<span class="text-red-600 font-bold">❌ Error Sistem: ${error.message}</span>`;
    }
});

function setupTabs() {
    document.querySelectorAll('.cert-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-cert-tab');
            switchTab(tab);
        });
    });

    document.getElementById('searchInput').addEventListener('input', () => {
        renderCurrentTabList();
    });
}

function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.cert-tab-btn').forEach(btn => {
        const isCurrent = btn.getAttribute('data-cert-tab') === tab;
        btn.className = isCurrent
            ? "cert-tab-btn px-4 py-2 rounded-full font-extrabold text-xs bg-blue-900 text-white shadow shrink-0"
            : "cert-tab-btn px-4 py-2 rounded-full font-extrabold text-xs bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shrink-0";
    });
    renderCurrentTabList();
}

function renderCurrentTabList() {
    const listContainer = document.getElementById('pesertaList');
    const loading = document.getElementById('loadingIndicator');
    const empty = document.getElementById('emptyState');
    const emptyText = document.getElementById('emptyStateText');

    loading.classList.add('hidden');

    const certRow = certConfigsByType[activeTab];
    if (!certRow) {
        listContainer.classList.add('hidden');
        empty.classList.remove('hidden');
        emptyText.innerText = `Panitia belum mengatur template untuk kategori sertifikat ini.`;
        return;
    }

    const keyword = (document.getElementById('searchInput').value || '').toLowerCase();
    const rawList = itemsByType[activeTab] || [];
    const filtered = rawList.filter(item =>
        (item.nama || '').toLowerCase().includes(keyword) ||
        (item.sub || '').toLowerCase().includes(keyword)
    );

    if (filtered.length === 0) {
        listContainer.classList.add('hidden');
        empty.classList.remove('hidden');
        emptyText.innerText = "Data penerima sertifikat tidak ditemukan.";
        return;
    }

    empty.classList.add('hidden');
    listContainer.classList.remove('hidden');

    const customFields = Array.isArray(certRow.config_json?.customFields) ? certRow.config_json.customFields : [];

    listContainer.innerHTML = filtered.map((item, idx) => {
        const origIdx = rawList.indexOf(item);
        const certNumField = customFields[0];
        const certNumPreview = certNumField ? renderCustomFieldValue(certNumField, item.seedKey, origIdx + 1) : '';

        return `
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3 hover:border-blue-300 transition">
            <div>
                <h3 class="font-black text-slate-800 text-sm uppercase">${item.nama}</h3>
                <p class="text-xs text-slate-500 font-bold mt-1">🏊‍♂️ ${item.sub}</p>
                ${certNumPreview ? `<p class="text-[10px] font-mono font-bold text-indigo-600 mt-1">🔖 ${certNumPreview}</p>` : ''}
            </div>
            <button data-dl-idx="${origIdx}" class="btn-dl-cert w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer">
                <span>⬇️</span> Unduh Sertifikat
            </button>
        </div>
        `;
    }).join('');

    listContainer.querySelectorAll('.btn-dl-cert').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const button = e.currentTarget;
            const idx = Number(button.getAttribute('data-dl-idx'));
            const item = rawList[idx];
            if (!item) return;

            const origHtml = button.innerHTML;
            button.innerHTML = '⏳ Merakit...';
            button.disabled = true;

            try {
                await downloadCertItem(certRow, item, idx + 1);
            } finally {
                button.innerHTML = origHtml;
                button.disabled = false;
            }
        });
    });
}

async function downloadCertItem(certRow, item, seqIndex) {
    const config = certRow.config_json || {};
    const img = await new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Gagal memuat gambar template sertifikat."));
        image.src = certRow.template_url + (certRow.template_url.includes('?') ? '&' : '?') + 't=' + Date.now();
    });

    await document.fonts.ready;

    const canvas = document.getElementById('renderCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const fontName = config.sharedStyle?.font || config.nama?.font || "'Great Vibes', cursive";
    const fontColor = config.sharedStyle?.color || config.nama?.color || "#1e293b";

    const drawText = (text, fieldCfg) => {
        if (!text || !fieldCfg) return;
        ctx.textAlign = "center";
        const size = fieldCfg.size || 40;
        ctx.font = fontName.includes('Great Vibes') ? `${size}px ${fontName}` : `bold ${size}px ${fontName}`;
        ctx.fillStyle = fontColor;
        ctx.fillText(text, parseInt(fieldCfg.x, 10), parseInt(fieldCfg.y, 10));
    };

    drawText(toTitleCase(item.nama), config.nama);

    if (activeTab !== 'peserta' && config.extra) {
        drawText(item.predikat, config.extra.juara);
        drawText(item.nomor, config.extra.nomorLomba);
        drawText(item.ku, config.extra.kelompokUmur);
    }

    if (Array.isArray(config.customFields)) {
        config.customFields.forEach(cf => {
            const val = renderCustomFieldValue(cf, item.seedKey, seqIndex);
            drawText(val, cf);
        });
    }

    await new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (!blob) return reject(new Error("Gagal merender gambar sertifikat."));
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = url;
            link.download = `Sertifikat_${activeTab.toUpperCase()}_${item.nama.replace(/\s+/g, '_')}.jpg`;
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
