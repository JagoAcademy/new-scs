import { supabaseClient } from './supabase.js';

let currentEventId = null;
let allHeats = [];
let currentEventHeats = [];
let appMode = 'timer'; // 'timer' (Inputer) | 'referee' (Sign & Publish)
let deletedAthletesFilteredCount = 0;
let lastStartlistTimestamp = null;
let isExplicitlyUnlocked = false;

function normalizeText(val) {
    return String(val || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function formatDateTimeID(isoStr) {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return String(isoStr);
    return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session }, error: authError } = await supabaseClient.auth.getSession();
    if (authError || !session) {
        alert("⚠️ Akses Ditolak! Anda belum login.");
        window.location.replace('/auth.html');
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    currentEventId = urlParams.get('id');
    if (!currentEventId) return alert("ID Event tidak ditemukan!");

    const btnBack = document.getElementById('btnBackDashboard');
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            window.location.href = `/event-dashboard.html?id=${currentEventId}`;
        });
    }

    const btnOpenBookLock = document.getElementById('btnOpenBookLock');
    if (btnOpenBookLock) {
        btnOpenBookLock.href = `/book/book.html?id=${currentEventId}`;
    }

    const btnSyncStartlist = document.getElementById('btnSyncStartlist');
    if (btnSyncStartlist) {
        btnSyncStartlist.addEventListener('click', async () => {
            const prevSelected = document.getElementById('selectEvent')?.value || '';
            btnSyncStartlist.disabled = true;
            btnSyncStartlist.innerText = '⏳ Syncing...';
            await loadDataHeats(true, prevSelected);
            btnSyncStartlist.disabled = false;
            btnSyncStartlist.innerText = '🔄 Sync Start List';
        });
    }

    setupModeToggle();
    await loadDataHeats(true);
});

// ==========================================
// LOGIKA SWITCHER MODE: TIMER vs REFEREE
// ==========================================
function setupModeToggle() {
    const btnTimer = document.getElementById('btnModeTimer');
    const btnReferee = document.getElementById('btnModeReferee');
    const indicator = document.getElementById('panelModeIndicator');
    
    if (!btnTimer || !btnReferee) return;

    btnTimer.addEventListener('click', () => {
        appMode = 'timer';
        btnTimer.className = "flex-1 sm:flex-none px-4 py-1.5 text-[10px] md:text-xs font-black tracking-widest uppercase rounded bg-red-500 text-white shadow transition-all flex justify-center items-center gap-1 cursor-pointer";
        btnTimer.innerHTML = `<span class="w-2 h-2 rounded-full bg-white animate-pulse"></span> TIMER`;
        
        btnReferee.className = "flex-1 sm:flex-none px-4 py-1.5 text-[10px] md:text-xs font-black tracking-widest uppercase rounded text-slate-400 hover:text-white transition-all flex justify-center items-center gap-1 cursor-pointer";
        
        indicator.className = "absolute top-0 right-0 bg-red-100 text-red-600 text-[9px] font-black px-3 py-1 rounded-bl-lg uppercase tracking-widest border-b border-l border-red-200";
        indicator.innerText = "Mode Input (Draft)";

        const val = document.getElementById('selectEvent').value;
        if (val) renderAllHeats(val);
    });

    btnReferee.addEventListener('click', async () => {
        appMode = 'referee';
        btnReferee.className = "flex-1 sm:flex-none px-4 py-1.5 text-[10px] md:text-xs font-black tracking-widest uppercase rounded bg-emerald-500 text-white shadow transition-all flex justify-center items-center gap-1 cursor-pointer";
        
        btnTimer.className = "flex-1 sm:flex-none px-4 py-1.5 text-[10px] md:text-xs font-black tracking-widest uppercase rounded text-slate-400 hover:text-white transition-all flex justify-center items-center gap-1 cursor-pointer";
        btnTimer.innerHTML = `⏱️ TIMER`;

        indicator.className = "absolute top-0 right-0 bg-emerald-100 text-emerald-700 text-[9px] font-black px-3 py-1 rounded-bl-lg uppercase tracking-widest border-b border-l border-emerald-200";
        indicator.innerText = "Mode Wasit (Sign & Publish)";
        
        btnReferee.innerText = "⏳ SYNCING...";
        await loadDataHeats(false);
        btnReferee.innerHTML = `🧑‍⚖️ REFEREE`;
        
        const val = document.getElementById('selectEvent').value;
        if (val) renderAllHeats(val);
    });
}

// ==========================================
// DEDUPLIKASI & VALIDASI START LIST TERBARU
// ==========================================
function deduplicateLatestHeats(heatsRaw) {
    // Jika ada duplikat (event_number + heat_number), ambil row paling baru (id / created_at terbesar)
    const map = new Map();
    heatsRaw.forEach(row => {
        const key = `${row.event_number}__${row.heat_number}`;
        const existing = map.get(key);
        if (!existing) {
            map.set(key, row);
            return;
        }
        const existingTime = existing.updated_at || existing.created_at || '';
        const rowTime = row.updated_at || row.created_at || '';
        if (rowTime > existingTime || (rowTime === existingTime && Number(row.id) > Number(existing.id))) {
            map.set(key, row);
        }
    });

    return Array.from(map.values()).sort((a, b) => {
        if (Number(a.event_number) !== Number(b.event_number)) {
            return Number(a.event_number) - Number(b.event_number);
        }
        return Number(a.heat_number) - Number(b.heat_number);
    });
}

function sanitizeHeatsAgainstActiveRegistrations(heats, activeRegs) {
    deletedAthletesFilteredCount = 0;

    // Jika tabel event_registrations kosong, jangan hapus agar tidak memblokir data lama
    if (!Array.isArray(activeRegs) || activeRegs.length === 0) {
        return heats;
    }

    const activeF1Ids = new Set();
    const activeNameClub = new Set();
    const activeNames = new Set();

    activeRegs.forEach(r => {
        const f1 = normalizeText(r.f1_id);
        const nm = normalizeText(r.nama_peserta);
        const kl = normalizeText(r.klub_asal);
        if (f1) activeF1Ids.add(f1);
        if (nm) {
            activeNames.add(nm);
            activeNameClub.add(`${nm}__${kl}`);
        }
    });

    return heats.map(heat => {
        const lanes = Array.isArray(heat.lanes_data) ? heat.lanes_data : [];
        const cleanedLanes = lanes.map(atlet => {
            if (!atlet || !atlet.nama) return atlet;

            const f1 = normalizeText(atlet.f1_id);
            const nm = normalizeText(atlet.nama);
            const kl = normalizeText(atlet.klub);

            const existsByF1 = f1 ? activeF1Ids.has(f1) : false;
            const existsByNameClub = activeNameClub.has(`${nm}__${kl}`);
            const existsByName = activeNames.has(nm);

            if (existsByF1 || existsByNameClub || existsByName) {
                return atlet;
            }

            // Atlet sudah dihapus lewat menu Delete di Data Peserta!
            deletedAthletesFilteredCount++;
            return {
                lane: atlet.lane,
                nama: '',
                klub: '',
                f1_id: null,
                waktu_tempuh: '',
                _removedFromPeserta: true,
                _removedName: atlet.nama
            };
        });

        return {
            ...heat,
            lanes_data: cleanedLanes
        };
    });
}

function updateStartlistBanner() {
    const banner = document.getElementById('startlistStatusBanner');
    const icon = document.getElementById('startlistStatusIcon');
    const title = document.getElementById('startlistStatusTitle');
    const desc = document.getElementById('startlistStatusDesc');
    if (!banner || !icon || !title || !desc) return;

    if (allHeats.length === 0) {
        banner.className = 'bg-amber-50 p-4 rounded-2xl shadow-sm border-2 border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3';
        icon.innerText = '🔒';
        title.className = 'text-xs md:text-sm font-black text-amber-900';
        title.innerText = 'Start List Belum Dikunci dari Buku Acara';
        desc.className = 'text-xs text-amber-800 mt-0.5 leading-relaxed';
        desc.innerText = 'Buka menu Buku Acara lalu klik tombol "Kunci Start List" terlebih dahulu agar susunan seri/heat dan lintasan muncul di sini.';
        return;
    }

    if (deletedAthletesFilteredCount > 0) {
        banner.className = 'bg-amber-50 p-4 rounded-2xl shadow-sm border-2 border-amber-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3';
        icon.innerText = '⚠️';
        title.className = 'text-xs md:text-sm font-black text-amber-950';
        title.innerText = `Start List Terkunci • ${deletedAthletesFilteredCount} Atlet Terhapus Otomatis Disaring`;
        desc.className = 'text-xs text-amber-900 mt-0.5 leading-relaxed';
        desc.innerText = `Ditemukan ${deletedAthletesFilteredCount} lintasan berisi atlet trial/peserta yang sudah dihapus di Data Peserta (otomatis dikosongkan). Klik "Buku Acara" → "Kunci Start List" jika ingin merapatkan ulang nomor seri/lintasan.`;
        return;
    }

    if (isExplicitlyUnlocked) {
        banner.className = 'bg-amber-50 p-4 rounded-2xl shadow-sm border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3';
        icon.innerText = '🔓';
        title.className = 'text-xs md:text-sm font-black text-amber-900';
        title.innerText = 'Perhatian: Status Start List di Buku Acara Belum Terkunci';
        desc.className = 'text-xs text-amber-800 mt-0.5 leading-relaxed';
        desc.innerText = 'Pastikan panitia sudah menekan "Kunci Start List" di Buku Acara sebelum Timer & Referee mulai menginput waktu.';
        return;
    }

    banner.className = 'bg-emerald-50/80 p-4 rounded-2xl shadow-sm border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3';
    icon.innerText = '🔒';
    title.className = 'text-xs md:text-sm font-black text-emerald-950';
    title.innerText = `Start List Terkunci & Sinkron (${allHeats.length} Seri/Heat)`;
    desc.className = 'text-xs text-emerald-800 mt-0.5 leading-relaxed';
    desc.innerText = `Sinkron dengan Data Peserta aktif • Pembaruan Start List terakhir: ${formatDateTimeID(lastStartlistTimestamp)}`;
}

async function loadDataHeats(isFirstLoad = true, preserveSelection = '') {
    try {
        const [evRes, heatsRes, regsRes] = await Promise.all([
            supabaseClient
                .from('events')
                .select('*')
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
                .select('id, f1_id, nama_peserta, klub_asal, nomor_lomba, status_pembayaran')
                .eq('event_id', currentEventId)
        ]);

        if (heatsRes.error) throw heatsRes.error;

        if (evRes.data) {
            const titleEl = document.getElementById('headerEventTitle');
            if (titleEl) titleEl.innerText = evRes.data.event_name || `Event #${currentEventId}`;
            const cfg = evRes.data.config || {};
            isExplicitlyUnlocked = (cfg.startlist_locked === false || cfg.is_startlist_locked === false);
        }

        const dedupedHeats = deduplicateLatestHeats(heatsRes.data || []);
        const activeRegs = regsRes.error ? [] : (regsRes.data || []);

        allHeats = sanitizeHeatsAgainstActiveRegistrations(dedupedHeats, activeRegs);

        // Cari timestamp terbaru dari event_heats
        lastStartlistTimestamp = null;
        allHeats.forEach(h => {
            const ts = h.updated_at || h.created_at;
            if (ts && (!lastStartlistTimestamp || ts > lastStartlistTimestamp)) {
                lastStartlistTimestamp = ts;
            }
        });

        updateStartlistBanner();

        if (isFirstLoad) {
            populateEventDropdown(preserveSelection);
        }
    } catch (err) {
        console.error(err);
        alert("Gagal memuat data Start List: " + err.message);
    }
}

function populateEventDropdown(preserveSelection = '') {
    const selectEvent = document.getElementById('selectEvent');
    if (!selectEvent) return;

    if (allHeats.length === 0) {
        selectEvent.innerHTML = '<option value="">-- Belum Ada Start List (Kunci Start List di Buku Acara Dulu) --</option>';
        const container = document.getElementById('allHeatsContainer');
        if (container) container.classList.add('hidden');
        return;
    }

    selectEvent.innerHTML = '<option value="">-- Pilih Nomor Lomba --</option>';

    const uniqueEvents = [...new Map(allHeats.map(item => [item.event_number, item])).values()];
    uniqueEvents.forEach(ev => {
        const label = `Event #${ev.event_number}: ${ev.nomor_lomba} - ${ev.gender} - ${ev.kelompok_umur}`;
        selectEvent.innerHTML += `<option value="${ev.event_number}">${label}</option>`;
    });

    if (!selectEvent.dataset.bound) {
        selectEvent.dataset.bound = '1';
        selectEvent.addEventListener('change', (e) => {
            renderAllHeats(e.target.value);
        });

        document.getElementById('btnShowAll')?.addEventListener('click', () => {
            selectEvent.value = "";
            renderAllHeats('ALL');
        });
    }

    if (preserveSelection) {
        selectEvent.value = preserveSelection;
        renderAllHeats(preserveSelection);
    }
}

function renderAllHeats(eventNumber) {
    const container = document.getElementById('allHeatsContainer');
    if (!eventNumber) {
        container.classList.add('hidden');
        return;
    }

    currentEventHeats = eventNumber === 'ALL' ? allHeats : allHeats.filter(h => h.event_number == eventNumber);
    container.innerHTML = '';

    currentEventHeats.forEach((heat, heatIndex) => {
        let lanesHtml = '';

        heat.lanes_data.forEach((atlet, laneIndex) => {
            if (!atlet || !atlet.nama) {
                const emptyNote = atlet?._removedFromPeserta
                    ? `--- Kosong (Atlet "${atlet._removedName}" dihapus di Data Peserta) ---`
                    : `--- Kosong ---`;
                lanesHtml += `
                <div class="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200 opacity-60">
                    <div class="w-8 h-8 rounded bg-slate-200 text-slate-500 font-bold flex items-center justify-center shrink-0">${atlet?.lane || laneIndex + 1}</div>
                    <div class="flex-1"><p class="text-xs md:text-sm font-bold text-slate-400 italic">${emptyNote}</p></div>
                </div>`;
                return;
            }

            let mm = '', ss = '', ms = '';
            
            if (atlet.waktu_tempuh) {
                if (atlet.waktu_tempuh === 'DQ') {
                    mm = 'DQ';
                } else if (atlet.waktu_tempuh !== 'NT') {
                    const parts = atlet.waktu_tempuh.split(/[:.]/);
                    if (parts.length === 3) { mm = parts[0]; ss = parts[1]; ms = parts[2]; }
                }
            }

            const inputBg = appMode === 'timer' ? 'bg-slate-100 focus:ring-red-500' : 'bg-emerald-50 focus:ring-emerald-500 border-emerald-200';

            lanesHtml += `
            <div class="flex flex-col md:flex-row md:items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm transition-colors">
                <div class="flex items-center gap-3 flex-1">
                    <div class="w-8 h-8 rounded bg-slate-800 text-white font-bold flex items-center justify-center shrink-0">${atlet.lane}</div>
                    <div>
                        <p class="text-sm font-black text-slate-900 leading-tight uppercase">${atlet.nama}</p>
                        <p class="text-[10px] font-bold text-slate-500 uppercase">${atlet.klub || 'Individu'}</p>
                    </div>
                </div>
                
                <div class="flex items-center gap-1 shrink-0 mt-2 md:mt-0">
                    <input type="text" inputmode="numeric" maxlength="2" id="min_${heatIndex}_${laneIndex}" value="${mm}" placeholder="00" class="w-12 text-center py-2 ${inputBg} border border-slate-300 rounded font-mono text-sm font-bold outline-none input-waktu transition-colors">
                    <span class="font-black text-slate-400">:</span>
                    <input type="text" inputmode="numeric" maxlength="2" id="sec_${heatIndex}_${laneIndex}" value="${ss}" placeholder="00" class="w-12 text-center py-2 ${inputBg} border border-slate-300 rounded font-mono text-sm font-bold outline-none input-waktu transition-colors">
                    <span class="font-black text-slate-400">.</span>
                    <input type="text" inputmode="numeric" maxlength="2" id="ms_${heatIndex}_${laneIndex}" value="${ms}" placeholder="00" class="w-12 text-center py-2 ${inputBg} border border-slate-300 rounded font-mono text-sm font-bold outline-none input-waktu transition-colors">
                    
                    <button type="button" onclick="setDQ(${heatIndex}, ${laneIndex})" class="ml-2 px-2 py-2 bg-red-100 text-red-600 rounded text-xs font-bold hover:bg-red-200 transition-colors cursor-pointer">DQ</button>
                </div>
            </div>`;
        });

        const btnText = appMode === 'timer' ? `💾 SIMPAN DRAFT (Timer Inputer)` : `🧑‍⚖️ SIGN REFEREE & PUBLISH`;
        const btnColor = appMode === 'timer' ? `bg-slate-800 hover:bg-slate-900` : `bg-emerald-600 hover:bg-emerald-700`;

        container.innerHTML += `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div class="flex justify-between items-end mb-4 border-b border-slate-200 pb-4">
                <div>
                    <h2 class="text-lg font-black text-slate-900 uppercase">Event #${heat.event_number}: ${heat.nomor_lomba} - ${heat.kelompok_umur} - ${heat.gender}</h2>
                    <p class="text-sm font-bold text-red-600 mt-1">SERI/HEAT ${heat.heat_number} (Dari ${heat.total_heats})</p>
                </div>
            </div>
            <div class="space-y-3 mb-4">
                ${lanesHtml}
            </div>
            <button type="button" id="btnSubmit_${heatIndex}" onclick="submitHeatData(${heatIndex}, '${heat.id}')" class="w-full ${btnColor} text-white font-black text-sm py-3.5 rounded-xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 tracking-widest cursor-pointer">
                ${btnText}
            </button>
        </div>`;
    });

    container.classList.remove('hidden');
    setupAutoFocus();
}

function setupAutoFocus() {
    document.querySelectorAll('.input-waktu').forEach(input => {
        input.addEventListener('input', function() {
            if (this.value.length >= 2 && this.value.toUpperCase() !== 'DQ') {
                let next = this.nextElementSibling;
                while (next && next.tagName !== 'INPUT') next = next.nextElementSibling;
                if (next) next.focus();
            }
        });
    });
}

window.setDQ = function(heatIndex, laneIndex) {
    document.getElementById(`min_${heatIndex}_${laneIndex}`).value = 'DQ';
    document.getElementById(`sec_${heatIndex}_${laneIndex}`).value = '';
    document.getElementById(`ms_${heatIndex}_${laneIndex}`).value = '';
};

window.submitHeatData = async function(heatIndex, heatDatabaseId) {
    const btn = document.getElementById(`btnSubmit_${heatIndex}`);
    const originalText = btn.innerHTML;
    let refereeName = '';
    
    // OTORISASI REFEREE (Tanda Tangan Digital Wasit)
    if (appMode === 'referee') {
        const refInput = prompt("🛡️ SIGN REFEREE (OTORISASI WASIT):\nMasukkan NAMA LENGKAP Anda sebagai penanggung jawab pengesahan waktu seri ini:", "");
        if (!refInput || refInput.trim() === '') {
            return alert("❌ Pengesahan dibatalkan. Nama Referee wajib diisi untuk mengesahkan hasil!");
        }
        refereeName = refInput.trim();
    }

    btn.innerText = "⏳ Memproses...";
    btn.disabled = true;

    const targetHeat = currentEventHeats[heatIndex];
    const updatedLanes = targetHeat.lanes_data.map((atlet, laneIndex) => {
        if (!atlet || !atlet.nama) {
            return {
                lane: atlet?.lane || laneIndex + 1,
                nama: '',
                klub: '',
                f1_id: null,
                waktu_tempuh: ''
            };
        }

        const minEl = document.getElementById(`min_${heatIndex}_${laneIndex}`);
        const secEl = document.getElementById(`sec_${heatIndex}_${laneIndex}`);
        const msEl = document.getElementById(`ms_${heatIndex}_${laneIndex}`);

        const rawMin = minEl ? minEl.value.trim().toUpperCase() : '';
        const rawSec = secEl ? secEl.value.trim() : '';
        const rawMs = msEl ? msEl.value.trim() : '';

        const isAllEmpty = (rawMin === '' && rawSec === '' && rawMs === '');
        let waktuTempuh = 'NT';

        if (rawMin === 'DQ') {
            waktuTempuh = 'DQ';
        } else if (rawMin === 'NT' || isAllEmpty) {
            waktuTempuh = 'NT';
        } else {
            const min = rawMin === '' ? '00' : rawMin.padStart(2, '0');
            const sec = rawSec === '' ? '00' : rawSec.padStart(2, '0');
            const ms = rawMs === '' ? '00' : rawMs.padStart(2, '0');
            waktuTempuh = `${min}:${sec}.${ms}`;
        }

        return {
            ...atlet,
            waktu_tempuh: waktuTempuh
        };
    });

    try {
        // 1. SIMPAN KE event_heats (Draft Timer / Update Referee)
        const { data, error } = await supabaseClient
            .from('event_heats')
            .update({ lanes_data: updatedLanes })
            .eq('id', heatDatabaseId)
            .select();

        if (error) throw error;
        if (!data || data.length === 0) throw new Error("Gagal menyimpan! Anda tidak memiliki Hak Akses (RLS).");

        targetHeat.lanes_data = updatedLanes;
        
        // 2. HANYA MODE REFEREE YANG BISA SIGN & PUSH KE LIVE RESULT (race_results)
        if (appMode === 'referee') {
            const dataKeRaceResults = [];

            updatedLanes.forEach(atlet => {
                if (!atlet || !atlet.nama) return;

                const waktuString = atlet.waktu_tempuh;
                let timeSeconds = null;

                if (waktuString === 'DQ' || waktuString === 'DNS') {
                    timeSeconds = 9999.99;
                } else if (waktuString && waktuString !== 'NT') {
                    const parts = waktuString.split(/[:.]/);
                    if (parts.length === 3) {
                        const menit = parseInt(parts[0]) || 0;
                        const detik = parseInt(parts[1]) || 0;
                        const ms = parseInt(parts[2]) || 0;
                        timeSeconds = (menit * 60) + detik + (ms / 100);
                    }
                }

                if (timeSeconds !== null) {
                    dataKeRaceResults.push({
                        event_id: currentEventId,
                        athlete_f1_id: atlet.f1_id || null,
                        nama_peserta: atlet.nama,
                        klub_asal: atlet.klub,
                        nomor_lomba: targetHeat.nomor_lomba,
                        kelompok_umur: targetHeat.kelompok_umur,
                        gender: targetHeat.gender,
                        heat_number: targetHeat.heat_number,
                        waktu_string: waktuString,
                        time_seconds: timeSeconds
                    });
                }
            });

            // Hapus data seri lama (jika ada revisi/atlet terhapus dari wasit)
            await supabaseClient.from('race_results')
                .delete()
                .eq('event_id', currentEventId)
                .eq('nomor_lomba', targetHeat.nomor_lomba)
                .eq('kelompok_umur', targetHeat.kelompok_umur)
                .eq('gender', targetHeat.gender)
                .eq('heat_number', targetHeat.heat_number);

            if (dataKeRaceResults.length > 0) {
                const { error: errorInsert } = await supabaseClient.from('race_results').insert(dataKeRaceResults);
                if (errorInsert) throw errorInsert;
            }

            btn.classList.replace('bg-emerald-600', 'bg-blue-600');
            btn.innerText = `✅ SIGNED BY ${refereeName.toUpperCase()} & PUBLISHED!`;
            
        } else {
            btn.classList.replace('bg-slate-800', 'bg-red-600');
            btn.innerText = "💾 DRAFT TIMER TERSIMPAN";
        }

        setTimeout(() => {
            if (appMode === 'referee') btn.classList.replace('bg-blue-600', 'bg-emerald-600');
            if (appMode === 'timer') btn.classList.replace('bg-red-600', 'bg-slate-800');
            btn.innerHTML = originalText;
        }, 2200);
        
    } catch (err) {
        console.error(err);
        alert(err.message || "Gagal menyimpan waktu!");
    } finally {
        btn.disabled = false;
    }
};
