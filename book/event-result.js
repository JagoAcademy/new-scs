import { supabaseClient } from '../src/supabase.js';

let currentEventId = null;
let currentEventInfo = null;
let allHeats = [];
let activeRegFilter = null; // null jika gagal baca registrasi, object Sets jika berhasil

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function parseTimeToMs(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return Infinity;
    const clean = timeStr.trim().toUpperCase().replace(/,/g, '.');
    if (clean === 'NT' || clean === 'DQ' || clean === 'DNS' || clean === 'DNF') return Infinity;
    if (!/^\d{1,2}(:\d{2})?\.\d{1,3}$/.test(clean)) return Infinity;

    let minutes = 0;
    let secondsPart = clean;

    if (clean.includes(':')) {
        const parts = clean.split(':');
        minutes = parseInt(parts[0], 10);
        secondsPart = parts[1];
    }

    const secParts = secondsPart.split('.');
    const seconds = parseInt(secParts[0], 10);
    const msStr = secParts[1].padEnd(3, '0').slice(0, 3);
    const ms = parseInt(msStr, 10);

    const totalMs = (minutes * 60 * 1000) + (seconds * 1000) + ms;
    return totalMs > 0 ? totalMs : Infinity;
}

function isSwimmerStillActive(atlet) {
    if (!atlet || !atlet.nama) return false;
    if (!activeRegFilter) return true;

    if (atlet.id_pendaftaran && activeRegFilter.ids.has(String(atlet.id_pendaftaran))) {
        return true;
    }
    if (atlet.f1_id && activeRegFilter.f1Ids.has(String(atlet.f1_id).trim().toLowerCase())) {
        return true;
    }
    const cleanName = String(atlet.nama).trim().toLowerCase();
    return activeRegFilter.names.has(cleanName);
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentEventId = urlParams.get('id');

    if (!currentEventId) {
        alert("ID Kejuaraan tidak ditemukan di URL!");
        return;
    }

    await loadAllHeats();
});

async function loadAllHeats() {
    try {
        const [evRes, heatsRes, regRes] = await Promise.all([
            supabaseClient
                .from('events')
                .select('event_name, event_date, start_date, kota, provinsi')
                .eq('id', currentEventId)
                .single(),
            supabaseClient
                .from('event_heats')
                .select('*')
                .eq('event_id', currentEventId)
                .order('event_number', { ascending: true })
                .order('heat_number', { ascending: true }),
            supabaseClient
                .from('event_registrations')
                .select('id, f1_id, nama_peserta, klub_asal, status_pembayaran')
                .eq('event_id', currentEventId)
        ]);

        if (evRes.data) {
            currentEventInfo = evRes.data;
        }

        if (heatsRes.error) throw heatsRes.error;
        allHeats = heatsRes.data || [];

        // Bangun filter peserta aktif agar peserta yang sudah dihapus tidak ikut tampil
        if (!regRes.error && Array.isArray(regRes.data)) {
            const validRegs = regRes.data.filter(
                r => String(r.status_pembayaran || '').toLowerCase() === 'lunas'
            );
            const clubById = new Map();
            const clubByName = new Map();

            validRegs.forEach(r => {
                if (r.id) clubById.set(String(r.id), r.klub_asal || '');
                if (r.nama_peserta) {
                    clubByName.set(String(r.nama_peserta).trim().toLowerCase(), r.klub_asal || '');
                }
            });

            activeRegFilter = {
                ids: new Set(validRegs.map(r => String(r.id))),
                f1Ids: new Set(
                    validRegs
                        .filter(r => r.f1_id)
                        .map(r => String(r.f1_id).trim().toLowerCase())
                ),
                names: new Set(
                    validRegs
                        .filter(r => r.nama_peserta)
                        .map(r => String(r.nama_peserta).trim().toLowerCase())
                ),
                clubById,
                clubByName
            };
        }

        populateDropdown();
    } catch (err) {
        console.error("Gagal menarik data:", err);
        alert("Terjadi kesalahan saat memuat data: " + err.message);
    }
}

function populateDropdown() {
    const selectEvent = document.getElementById('selectEvent');
    selectEvent.innerHTML = '<option value="">-- Pilih Lomba Untuk Dicetak --</option>';

    const uniqueEvents = [...new Map(allHeats.map(item => [item.event_number, item])).values()];

    uniqueEvents.forEach(ev => {
        const label = `Event #${ev.event_number}: ${ev.nomor_lomba} - ${ev.gender} - ${ev.kelompok_umur}`;
        selectEvent.innerHTML += `<option value="${ev.event_number}">${escapeHtml(label)}</option>`;
    });

    selectEvent.addEventListener('change', (e) => {
        const evNum = e.target.value;
        if (evNum) {
            document.getElementById('emptyState').style.display = 'none';
            generateLeaderboard(evNum);
        } else {
            document.getElementById('emptyState').style.display = 'block';
            document.getElementById('resultTableContainer').innerHTML = '';
        }
    });
}

function generateLeaderboard(eventNumber) {
    const targetHeats = allHeats.filter(h => String(h.event_number) === String(eventNumber));
    if (targetHeats.length === 0) return;

    const headerInfo = targetHeats[0];

    let semuaAtlet = [];
    targetHeats.forEach(heat => {
        const lanes = Array.isArray(heat.lanes_data) ? heat.lanes_data : [];
        lanes.forEach(atlet => {
            if (!isSwimmerStillActive(atlet)) return;

            // Sinkronkan nama klub terbaru jika sempat di-rename di Data Peserta
            let latestKlub = atlet.klub || 'Individu';
            if (activeRegFilter) {
                if (atlet.id_pendaftaran && activeRegFilter.clubById.has(String(atlet.id_pendaftaran))) {
                    latestKlub = activeRegFilter.clubById.get(String(atlet.id_pendaftaran)) || latestKlub;
                } else {
                    const nmKey = String(atlet.nama).trim().toLowerCase();
                    if (activeRegFilter.clubByName.has(nmKey)) {
                        latestKlub = activeRegFilter.clubByName.get(nmKey) || latestKlub;
                    }
                }
            }

            semuaAtlet.push({
                ...atlet,
                klub: latestKlub,
                asal_heat: heat.heat_number
            });
        });
    });

    semuaAtlet.sort((a, b) => {
        const rawA = String(a.waktu_tempuh || 'NT').trim().toUpperCase();
        const rawB = String(b.waktu_tempuh || 'NT').trim().toUpperCase();

        const msA = parseTimeToMs(rawA);
        const msB = parseTimeToMs(rawB);

        const isInvalidA = msA === Infinity;
        const isInvalidB = msB === Infinity;

        if (isInvalidA && !isInvalidB) return 1;
        if (!isInvalidA && isInvalidB) return -1;

        if (isInvalidA && isInvalidB) {
            if (rawA === 'DQ' && rawB !== 'DQ') return 1;
            if (rawA !== 'DQ' && rawB === 'DQ') return -1;
            return String(a.nama).localeCompare(String(b.nama), 'id');
        }

        return msA - msB;
    });

    renderTable(semuaAtlet, headerInfo);
}

function renderTable(leaderboard, headerInfo) {
    const container = document.getElementById('resultTableContainer');

    let tbodyHtml = '';
    if (leaderboard.length === 0) {
        tbodyHtml = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 24px; color: #64748b; font-weight: bold;">
                    Tidak ada peserta aktif pada nomor lomba ini.
                </td>
            </tr>
        `;
    } else {
        leaderboard.forEach((atlet, index) => {
            const rank = index + 1;
            let rankDisplay = rank;
            let styleRank = "";
            const msVal = parseTimeToMs(String(atlet.waktu_tempuh || ''));

            if (msVal === Infinity) {
                rankDisplay = "-";
                styleRank = "color: #94a3b8;";
            } else if (rank === 1) {
                styleRank = "font-weight: 900; background-color: #fef3c7;";
            } else if (rank === 2) {
                styleRank = "font-weight: 900; background-color: #f1f5f9;";
            } else if (rank === 3) {
                styleRank = "font-weight: 900; background-color: #ffedd5;";
            }

            tbodyHtml += `
                <tr>
                    <td style="text-align: center; width: 50px; ${styleRank}">${rankDisplay}</td>
                    <td style="font-weight: bold; text-transform: uppercase;">${escapeHtml(atlet.nama)}</td>
                    <td style="text-transform: uppercase; font-size: 0.85em;">${escapeHtml(atlet.klub)}</td>
                    <td style="text-align: center;">Seri/Heat ${atlet.asal_heat} / L${atlet.lane}</td>
                    <td style="text-align: center; font-family: monospace; font-weight: bold;">
                        ${escapeHtml(atlet.waktu_tempuh || 'NT')}
                    </td>
                </tr>
            `;
        });
    }

    const evTitle = currentEventInfo?.event_name || '';

    const html = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 16px;">
            <span style="font-size: 0.75rem; font-weight: 900; text-transform: uppercase; color: #334155;">${escapeHtml(evTitle)}</span>
            <span style="font-family: monospace; font-size: 0.75rem; font-weight: 900; color: #475569;">f1swimming.com</span>
        </div>

        <div style="text-align: center; margin-bottom: 20px; text-transform: uppercase;">
            <h2 style="font-size: 1.5rem; font-weight: 900; margin: 0;">OFFICIAL RESULT</h2>
            <h3 style="font-size: 1.1rem; font-weight: bold; margin: 5px 0;">EVENT #${headerInfo.event_number}: ${escapeHtml(headerInfo.nomor_lomba)} - ${escapeHtml(headerInfo.gender)}</h3>
            <p style="font-size: 0.9rem; color: #475569;">Kelompok Umur: ${escapeHtml(headerInfo.kelompok_umur)}</p>
        </div>
        
        <table class="screen-table">
            <thead>
                <tr>
                    <th style="text-align: center;">Rank</th>
                    <th>Nama Perenang</th>
                    <th>Klub</th>
                    <th style="text-align: center;">Seri/Heat / Lane</th>
                    <th style="text-align: center;">Catatan Waktu</th>
                </tr>
            </thead>
            <tbody>
                ${tbodyHtml}
            </tbody>
        </table>
        
        <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 0.85rem;">
            <div>
                <p><strong>Dicetak pada:</strong> ${new Date().toLocaleString('id-ID')}</p>
            </div>
            <div style="text-align: center; width: 220px;">
                <p style="font-weight: bold;">Referee / Hakim Utama</p>
                <br><br><br>
                <p style="border-top: 1px solid black; padding-top: 5px;">( ........................................ )</p>
            </div>
        </div>
    `;

    container.innerHTML = html;
}
