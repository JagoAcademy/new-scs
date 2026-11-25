import { supabaseClient } from './supabase.js';

// ==========================================
// HELPER: CARI ATAU TERBITKAN F1 ID OTOMATIS (ATLET TAMU)
// ==========================================
async function generateOrFindF1Id(supabase, { nama, dob, gender, aktaUrl = null }) {
    const cleanName = (nama || '').trim();
    const cleanDob = (dob || '').trim();

    if (cleanName && cleanDob) {
        const { data: existingList } = await supabase
            .from('athletes')
            .select('f1_id')
            .ilike('full_name', cleanName)
            .eq('dob', cleanDob)
            .limit(1);

        if (existingList && existingList.length > 0 && existingList[0].f1_id) {
            return existingList[0].f1_id;
        }
    }

    let yy = '00';
    let mm = '00';
    if (cleanDob) {
        const parts = cleanDob.split('-');
        if (parts.length >= 2) {
            yy = parts[0].slice(-2);
            mm = parts[1].padStart(2, '0');
        }
    }
    const random3 = Math.floor(Math.random() * 900) + 100;
    const newF1Id = `F1-${yy}${mm}${random3}`;

    try {
        await supabase.from('athletes').insert([{
            f1_id: newF1Id,
            full_name: cleanName,
            dob: cleanDob || null,
            gender: gender || null,
            akta_url: aktaUrl || null
        }]);
    } catch (e) {
        console.warn('[SCS-F1] Insert ke master athletes dilewati:', e?.message || e);
    }

    return newF1Id;
}


let currentEventId = null;
let currentEvent = null;
let allRegistrations = [];
let isEventMaker = false;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cek User Session
    const { data: sessionData } = await supabaseClient.auth.getSession();
    if (!sessionData.session) {
        alert("Akses ditolak. Anda harus login sebagai Panitia.");
        window.location.href = '/auth.html'; 
        return;
    }

    // 2. Deteksi Event ID dari URL
    const urlParams = new URLSearchParams(window.location.search);
    currentEventId = urlParams.get('id');

    if (!currentEventId) {
        alert("ID Event tidak ditemukan di URL! Kembali ke Dashboard.");
        window.location.href = '/dashboard.html';
        return;
    }

    // Ubah link tombol Back
    document.getElementById('btnBack').href = `/event-dashboard.html?id=${currentEventId}`;

    try {
        const { data: eventData, error: eventErr } = await supabaseClient
            .from('events')
            .select('*')
            .eq('id', currentEventId)
            .single();

        if (eventErr || !eventData) throw new Error("Event tidak ditemukan.");
        currentEvent = eventData;
        const currentUserId = sessionData.session.user.id;
        if (String(eventData.owner_id) === String(currentUserId)) {
            isEventMaker = true;
        } else if (eventData.club_id) {
            const { data: clubOwner } = await supabaseClient
                .from('clubs')
                .select('owner_id')
                .eq('id', eventData.club_id)
                .maybeSingle();
            if (clubOwner && String(clubOwner.owner_id) === String(currentUserId)) {
                isEventMaker = true;
            }
        }
        
        document.getElementById('adminEventName').innerText = eventData.event_name;
        fetchData();

    } catch (err) {
        alert(err.message);
        document.getElementById('loadingState').innerText = "Gagal memuat data.";
    }

    document.getElementById('inputSearch').addEventListener('input', renderTable);
    document.getElementById('filterStatus').addEventListener('change', renderTable);
    document.getElementById('btnCloseModal').addEventListener('click', () => {
        document.getElementById('imageModal').classList.add('hidden');
    });

    const selectOldKlub = document.getElementById('selectOldKlub');
    if (selectOldKlub) {
        selectOldKlub.addEventListener('change', () => {
            const inputNew = document.getElementById('inputNewKlub');
            if (inputNew) inputNew.value = selectOldKlub.value;
        });
    }
});

async function fetchData() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('tableDataBody').innerHTML = '';

    const { data, error } = await supabaseClient
        .from('event_registrations')
        .select('*')
        .eq('event_id', currentEventId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        alert("Gagal menarik data peserta.");
        return;
    }

    allRegistrations = data || [];
    document.getElementById('loadingState').classList.add('hidden');
    
    updateStats();
    renderTable();
}

function updateStats() {
    const total = allRegistrations.length;
    const menunggu = allRegistrations.filter(r => r.status_pembayaran === 'Menunggu Konfirmasi').length;
    const lunas = allRegistrations.filter(r => r.status_pembayaran === 'Lunas').length;
    
    const pendapatan = allRegistrations
        .filter(r => r.status_pembayaran === 'Lunas')
        .reduce((sum, r) => sum + Number(r.total_biaya), 0);

    document.getElementById('statTotal').innerText = total;
    document.getElementById('statMenunggu').innerText = menunggu;
    document.getElementById('statLunas').innerText = lunas;
    document.getElementById('statPendapatan').innerText = `Rp ${pendapatan.toLocaleString('id-ID')}`;
}

function renderTable() {
    const tbody = document.getElementById('tableDataBody');
    tbody.innerHTML = '';
    
    const searchQuery = document.getElementById('inputSearch').value.toLowerCase();
    const filterStatus = document.getElementById('filterStatus').value;

    let filteredData = allRegistrations.filter(item => {
        const matchSearch = item.nama_peserta.toLowerCase().includes(searchQuery) || item.klub_asal.toLowerCase().includes(searchQuery);
        const matchStatus = filterStatus === 'ALL' || item.status_pembayaran === filterStatus;
        return matchSearch && matchStatus;
    });

    if(filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center p-8 text-slate-400 font-bold">Tidak ada data ditemukan.</td></tr>`;
        return;
    }

    filteredData.forEach((item) => {
        const dateObj = new Date(item.created_at);
        const dateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        
        let statusBadge = '';
        if(item.status_pembayaran === 'Lunas') statusBadge = `<span class="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Lunas</span>`;
        else if(item.status_pembayaran === 'Menunggu Konfirmasi') statusBadge = `<span class="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Menunggu Konfirmasi</span>`;
        else statusBadge = `<span class="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Keranjang</span>`;

        let aktaBtn = '';
        if (item.akta_url) {
            aktaBtn = `<button onclick="window.viewImage('${item.akta_url}', 'Akta: ${item.nama_peserta}')" class="text-blue-500 hover:text-blue-700 bg-blue-50 px-2 py-1.5 rounded text-xs font-bold transition-colors shadow-sm flex items-center gap-1 justify-center w-full border border-blue-200">📄 Cek Akta</button>`;
        } else if (item.f1_id) {
            aktaBtn = `<span class="text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1.5 rounded text-[9px] font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-1 justify-center" title="Data privasi aman di sistem pusat SCS">✅ Terverifikasi</span>`;
        } else {
            aktaBtn = `<span class="text-slate-300 text-xs">-</span>`;
        }

        // ========================================================
        // RADAR KOLEKTIF: Cek jumlah orang yang pakai struk url ini
        // ========================================================
        let badgeKolektif = '';
        let urlStruk = item.bukti_transfer_url || '';
        
        if (urlStruk && item.status_pembayaran === 'Menunggu Konfirmasi') {
            const listKolektif = allRegistrations.filter(r => r.bukti_transfer_url === urlStruk && r.status_pembayaran === 'Menunggu Konfirmasi');
            if (listKolektif.length > 1) {
                badgeKolektif = `<div class="text-[9px] font-black text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded mt-1 w-full text-center tracking-widest shadow-sm" title="Dibayar menggunakan 1 struk yang sama">📦 ${listKolektif.length} KOLEKTIF</div>`;
            }
        }

        const strukBtn = item.bukti_transfer_url ? `<button onclick="window.viewImage('${item.bukti_transfer_url}', 'Struk: ${item.nama_peserta}')" class="text-emerald-600 hover:text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1.5 rounded text-xs font-bold transition-colors shadow-sm mt-1 flex items-center gap-1 justify-center w-full">💳 Cek Struk</button>${badgeKolektif}` : `<span class="text-slate-300 text-xs">-</span>`;

        let waLink = "#";
        let waButtonClass = "opacity-50 cursor-not-allowed grayscale";
        if (item.whatsapp_tamu) {
            let waClean = item.whatsapp_tamu.replace(/\D/g, '');
            if(waClean.startsWith('0')) waClean = '62' + waClean.substring(1);
            const waPesan = `Halo PIC ${item.klub_asal}, kami dari Panitia ${currentEvent.event_name}. Menginfokan terkait pendaftaran atlet a.n *${item.nama_peserta}*...`;
            waLink = `https://wa.me/${waClean}?text=${encodeURIComponent(waPesan)}`;
            waButtonClass = "hover:scale-105 hover:shadow-md";
        }

        let nomorLombaHtml = '';
        if (Array.isArray(item.nomor_lomba)) {
            item.nomor_lomba.forEach(nomor => {
                let namaGaya = nomor.gaya || nomor; 
                let waktuSeed = nomor.seed_time ? nomor.seed_time : 'NT';
                let warnaTeks = nomor.seed_time ? 'text-indigo-600 font-black' : 'text-slate-400 font-bold';
                
                nomorLombaHtml += `
                <div class="flex justify-between items-center px-2 py-1 bg-slate-50 rounded border border-slate-200 mb-1 shadow-sm w-full">
                    <span class="text-[9px] font-bold text-slate-600">${namaGaya}</span>
                    <span class="text-[9px] font-mono ${warnaTeks} bg-white px-1.5 py-0.5 rounded border border-slate-100 ml-2">${waktuSeed}</span>
                </div>`;
            });
        }

        const encodedKlub = encodeURIComponent(item.klub_asal || '');

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50/80 transition-colors group";
        tr.innerHTML = `
            <td class="p-4 align-top">
                <p class="font-extrabold text-slate-700 text-xs">#${item.id.split('-')[0].toUpperCase()}</p>
                <p class="text-[10px] text-slate-400 mt-1">${dateStr} • ${timeStr}</p>
            </td>
            <td class="p-4 align-top">
                <p class="font-bold text-slate-800">${item.nama_peserta}</p>
                <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span class="bg-indigo-50 text-indigo-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-widest">${item.f1_id ? item.f1_id : 'TAMU'}</span>
                    <span class="text-[10px] text-slate-500 font-medium">${item.klub_asal}</span>
                    <button type="button" onclick="window.openModalRenameKlub(decodeURIComponent('${encodedKlub}'))" class="text-[10px] text-amber-600 hover:text-amber-800 hover:bg-amber-50 px-1 py-0.5 rounded transition-colors cursor-pointer" title="Rename Nama Klub Ini">🏷️</button>
                </div>
            </td>
            <td class="p-4 align-top">
                <p class="text-xs font-bold text-slate-700 mb-1.5">${item.kelompok_umur} • ${item.gender}</p>
                <div class="flex flex-col gap-1 max-w-[200px]">
                    ${nomorLombaHtml}
                </div>
            </td>
            <td class="p-4 align-top text-center flex flex-col items-center gap-1">
                ${aktaBtn}
                ${strukBtn}
            </td>
            <td class="p-4 align-top">
                <div class="mb-1.5">${statusBadge}</div>
                <p class="text-xs font-black text-slate-700">Rp ${Number(item.total_biaya).toLocaleString('id-ID')}</p>
            </td>
            <td class="p-4 align-top text-right">
                <div class="flex items-center justify-end gap-2">
                    <a href="${waLink}" target="_blank" class="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center transition-all ${waButtonClass}" title="Chat WA">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </a>
                    <button onclick="window.openModalSeedTime('${item.id}')" class="bg-white hover:bg-blue-50 border border-slate-200 text-slate-400 hover:text-blue-600 px-2.5 py-1.5 rounded-lg text-xs transition-colors shadow-sm" title="Edit Seed Time">✏️</button>
                    
                    ${item.status_pembayaran !== 'Lunas' ? `<button onclick="window.verifikasiLunas('${item.id}', '${urlStruk}')" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg> Lunas</button>` : ''}
                    ${isEventMaker ? `<button onclick="window.hapusPeserta('${item.id}')" class="bg-red-50 hover:bg-red-600 border border-red-200 text-red-600 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer" title="Hapus Peserta (Khusus Event Maker)">🗑️</button>` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ==========================================
// FUNGSI GLOBAL (Dipanggil dari HTML onclick)
// ==========================================
window.viewImage = function(url, title) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalImage').src = url;
    document.getElementById('btnDownloadImage').href = url;
    document.getElementById('imageModal').classList.remove('hidden');
}

// ==========================================
// RENAME NAMA KLUB MASSAL & SYNC STARTLIST / MEDAL
// ==========================================
window.openModalRenameKlub = function(prefillClub = '') {
    if (!allRegistrations || allRegistrations.length === 0) {
        alert("Belum ada data peserta di event ini.");
        return;
    }

    const clubMap = new Map();
    allRegistrations.forEach(r => {
        const raw = String(r.klub_asal || '').trim();
        if (!raw) return;
        const key = raw.toLowerCase();
        if (!clubMap.has(key)) {
            clubMap.set(key, { label: raw, count: 0 });
        }
        clubMap.get(key).count += 1;
    });

    if (clubMap.size === 0) {
        alert("Tidak ditemukan nama klub pada data peserta.");
        return;
    }

    const sortedClubs = Array.from(clubMap.values()).sort((a, b) => a.label.localeCompare(b.label, 'id'));
    const selectEl = document.getElementById('selectOldKlub');
    const inputNewEl = document.getElementById('inputNewKlub');

    selectEl.innerHTML = '';
    sortedClubs.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.label;
        opt.textContent = `${c.label} (${c.count} Peserta)`;
        selectEl.appendChild(opt);
    });

    if (prefillClub) {
        const matched = sortedClubs.find(c => c.label.toLowerCase() === String(prefillClub).trim().toLowerCase());
        if (matched) {
            selectEl.value = matched.label;
        }
    }

    inputNewEl.value = selectEl.value || '';
    document.getElementById('modalRenameKlub').classList.remove('hidden');
    setTimeout(() => {
        inputNewEl.focus();
        inputNewEl.select();
    }, 50);
};

window.closeModalRenameKlub = function() {
    document.getElementById('modalRenameKlub').classList.add('hidden');
};

document.getElementById('btnSaveRenameKlub')?.addEventListener('click', async () => {
    const oldKlub = (document.getElementById('selectOldKlub')?.value || '').trim();
    const newKlub = (document.getElementById('inputNewKlub')?.value || '').trim();

    if (!oldKlub) {
        alert("Pilih klub yang ingin diubah terlebih dahulu.");
        return;
    }
    if (!newKlub) {
        alert("Nama klub baru tidak boleh kosong.");
        return;
    }
    if (oldKlub === newKlub) {
        alert("Nama klub baru masih sama persis dengan nama lama.");
        return;
    }

    const oldLower = oldKlub.toLowerCase();
    const targetRegs = allRegistrations.filter(r => String(r.klub_asal || '').trim().toLowerCase() === oldLower);

    if (targetRegs.length === 0) {
        alert("Data pendaftaran untuk klub tersebut tidak ditemukan.");
        return;
    }

    if (!confirm(`Ubah nama klub "${oldKlub}" menjadi "${newKlub}" untuk ${targetRegs.length} peserta di event ini?`)) {
        return;
    }

    const btn = document.getElementById('btnSaveRenameKlub');
    const origText = btn.innerText;
    btn.innerText = 'Menyimpan... ⏳';
    btn.disabled = true;

    try {
        // 1. Update event_registrations
        const targetRegIds = targetRegs.map(r => r.id);
        const { error: regErr } = await supabaseClient
            .from('event_registrations')
            .update({ klub_asal: newKlub })
            .in('id', targetRegIds)
            .eq('event_id', currentEventId);

        if (regErr) throw regErr;

        // 2. Sinkronkan ke event_heats (Start List / Buku Acara)
        let updatedHeatsCount = 0;
        const { data: heatsData, error: heatsErr } = await supabaseClient
            .from('event_heats')
            .select('id, lanes_data')
            .eq('event_id', currentEventId);

        if (!heatsErr && Array.isArray(heatsData)) {
            for (const heat of heatsData) {
                if (!Array.isArray(heat.lanes_data)) continue;
                let changed = false;
                const updatedLanes = heat.lanes_data.map(lane => {
                    if (lane && lane.klub && String(lane.klub).trim().toLowerCase() === oldLower) {
                        changed = true;
                        return { ...lane, klub: newKlub };
                    }
                    return lane;
                });

                if (changed) {
                    const { error: upHeatErr } = await supabaseClient
                        .from('event_heats')
                        .update({ lanes_data: updatedLanes })
                        .eq('id', heat.id);
                    if (!upHeatErr) updatedHeatsCount++;
                }
            }
        }

        // 3. Sinkronkan ke event_leaderboard (Klasemen Medali) jika sudah ada data
        const { data: lbRows } = await supabaseClient
            .from('event_leaderboard')
            .select('id, klub_asal')
            .eq('event_id', currentEventId);

        if (Array.isArray(lbRows) && lbRows.length > 0) {
            const matchingLbIds = lbRows
                .filter(row => String(row.klub_asal || '').trim().toLowerCase() === oldLower)
                .map(row => row.id);

            if (matchingLbIds.length > 0) {
                await supabaseClient
                    .from('event_leaderboard')
                    .update({ klub_asal: newKlub })
                    .in('id', matchingLbIds);
            }
        }

        // 4. Sinkronkan ke race_results jika sudah ada catatan waktu
        try {
            const { data: resRows } = await supabaseClient
                .from('race_results')
                .select('id, klub_asal')
                .eq('event_id', currentEventId);

            if (Array.isArray(resRows) && resRows.length > 0) {
                const matchingResIds = resRows
                    .filter(row => String(row.klub_asal || '').trim().toLowerCase() === oldLower)
                    .map(row => row.id);

                if (matchingResIds.length > 0) {
                    await supabaseClient
                        .from('race_results')
                        .update({ klub_asal: newKlub })
                        .in('id', matchingResIds);
                }
            }
        } catch (_) {}

        window.closeModalRenameKlub();
        await fetchData();
        alert(`✅ Nama klub berhasil diubah!\n\n"${oldKlub}" ➔ "${newKlub}"\n• ${targetRegs.length} data peserta diperbarui\n• ${updatedHeatsCount} seri/heat Start List disinkronkan`);
    } catch (err) {
        console.error(err);
        alert("Gagal mengubah nama klub: " + err.message);
    } finally {
        btn.innerText = origText;
        btn.disabled = false;
    }
});

// ==========================================
// FUNGSI ACC LUNAS DENGAN FITUR MULTI-UPDATE KOLEKTIF
// ==========================================
window.verifikasiLunas = async function(id, strukUrl) {
    let targetIds = [id];
    let isKolektif = false;
    
    if (strukUrl && strukUrl !== 'null' && strukUrl.trim() !== '') {
        const kolektifList = allRegistrations.filter(r => r.bukti_transfer_url === strukUrl && r.status_pembayaran === 'Menunggu Konfirmasi');
        if (kolektifList.length > 1) {
            isKolektif = true;
            if(!confirm(`📦 PEMBAYARAN KOLEKTIF TERDETEKSI!\n\nStruk transfer ini digunakan untuk membayar ${kolektifList.length} peserta sekaligus.\n\nKlik OK untuk mengubah status SEMUA peserta tersebut menjadi LUNAS. Cukup satu klik aja bos!`)) {
                return;
            }
            targetIds = kolektifList.map(r => r.id);
        }
    }

    if (!isKolektif) {
        if(!confirm("Yakin ingin mengubah status pendaftaran ini menjadi LUNAS?")) return;
    }

    try {
        const { error } = await supabaseClient.from('event_registrations').update({ status_pembayaran: 'Lunas' }).in('id', targetIds);
        if (error) throw error;

        // Auto-terbitkan F1 ID untuk peserta tamu yang baru dilunaskan
        const targetRows = allRegistrations.filter(r => targetIds.includes(r.id) && !r.f1_id && r.gender !== 'Regu/Tim');
        for (const row of targetRows) {
            const assignedF1 = await generateOrFindF1Id(supabaseClient, {
                nama: row.nama_peserta,
                dob: row.tanggal_lahir,
                gender: row.gender,
                aktaUrl: row.akta_url
            });
            if (assignedF1) {
                await supabaseClient.from('event_registrations').update({ f1_id: assignedF1 }).eq('id', row.id);
            }
        }
        
        if(isKolektif) {
            alert(`✅ BOOM! ${targetIds.length} Peserta kolektif berhasil dilunaskan sekaligus! Mantaaap!`);
        } else {
            alert("✅ Status berhasil diubah menjadi Lunas!");
        }
        
        fetchData(); 
    } catch (err) { 
        alert("Gagal update status: " + err.message); 
    }
}

window.bukaModalBukuAcara = function() {
    document.getElementById('modalBukuAcara').classList.remove('hidden');
    document.getElementById('modalBukuAcara').classList.add('flex');
}

window.tutupModalBukuAcara = function() {
    document.getElementById('modalBukuAcara').classList.add('hidden');
    document.getElementById('modalBukuAcara').classList.remove('flex');
}

window.generateBukuAcara = function() {
    const lintasan = document.getElementById('inputLintasan').value;
    window.location.href = `/book/book.html?id=${currentEventId}&lanes=${lintasan}`;
}

// ==========================================
// LOGIKA EDIT SEED TIME MULTIPLE GAYA (JSONB)
// ==========================================
window.openModalSeedTime = function(regId) {
    const reg = allRegistrations.find(r => r.id === regId);
    if (!reg) return;

    document.getElementById('editRegId').value = regId;
    document.getElementById('seedTimeAthleteName').innerText = `${reg.nama_peserta} - ${reg.klub_asal}`;
    
    const container = document.getElementById('seedTimeListContainer');
    container.innerHTML = ''; 

    if (Array.isArray(reg.nomor_lomba)) {
        reg.nomor_lomba.forEach((nomor, index) => {
            let namaGaya = nomor.gaya || nomor;
            let currentST = nomor.seed_time || '';
            
            container.innerHTML += `
                <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div class="flex items-center justify-between mb-1.5">
                        <label class="block text-xs font-bold text-slate-700 uppercase">${namaGaya}</label>
                        <span class="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">MM:DD.MS</span>
                    </div>
                    <input 
                        type="text" 
                        id="seed_time_${index}" 
                        value="${currentST}" 
                        oninput="this.value = this.value.replace(/,/g, '.')"
                        placeholder="00:35.50 (Menit:Detik.Milidetik) — Kosong = NT" 
                        class="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-bold font-mono text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-inner"
                    >
                    <p class="text-[10px] text-slate-500 mt-1.5">
                        Gunakan <strong>titik dua (:)</strong> setelah menit dan <strong>titik (.)</strong> sebelum milidetik. Contoh: <code class="font-mono font-bold text-slate-700">01:12.45</code>
                    </p>
                </div>
            `;
        });
    }
    
    document.getElementById('modalSeedTime').classList.remove('hidden');
}

document.getElementById('btnSaveSeedTime').addEventListener('click', async () => {
    const regId = document.getElementById('editRegId').value;
    const reg = allRegistrations.find(r => r.id === regId);
    if (!reg) return;

    const btn = document.getElementById('btnSaveSeedTime');
    btn.innerText = 'Menyimpan...';
    btn.disabled = true;

    let updatedNomorLomba = [...reg.nomor_lomba];

    updatedNomorLomba.forEach((nomor, index) => {
        const inputEl = document.getElementById(`seed_time_${index}`);
        if (inputEl) {
            let inputVal = inputEl.value.trim().replace(/,/g, '.');
            
            if (typeof nomor === 'string') {
                nomor = { gaya: nomor };
                updatedNomorLomba[index] = nomor;
            }

            if (inputVal === '') delete nomor.seed_time; 
            else nomor.seed_time = inputVal; 
        }
    });

    try {
        const { error } = await supabaseClient
            .from('event_registrations')
            .update({ nomor_lomba: updatedNomorLomba })
            .eq('id', regId);

        if (error) throw error;
        
        document.getElementById('modalSeedTime').classList.add('hidden');
        fetchData(); 

    } catch (err) {
        alert("Gagal menyimpan waktu: " + err.message);
    } finally {
        btn.innerText = 'Simpan Waktu';
        btn.disabled = false;
    }
});

// ==========================================
// HELPER: KONVERSI WAKTU (MM:SS.ms) KE MILIDETIK
// ==========================================
function parseTimeToMs(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return Infinity;
    const clean = timeStr.trim().replace(/,/g, '.');
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

// ==========================================
// LOGIKA AUTO-SYNC F1 (TARIK PERSONAL BEST DARI HISTORI LOMBA)
// ==========================================
document.getElementById('btnSyncF1').addEventListener('click', async () => {
    const f1Registrations = allRegistrations.filter(
        r => r.f1_id && r.f1_id !== 'ESTAFET-VVIP' && Array.isArray(r.nomor_lomba) && r.nomor_lomba.length > 0
    );

    if (f1Registrations.length === 0) {
        alert("Tidak ada peserta dengan F1 ID yang terdaftar di event ini.");
        return;
    }

    const btn = document.getElementById('btnSyncF1');
    btn.innerHTML = '⏳ Menyinkronkan...';
    btn.disabled = true;

    try {
        const targetEventsSet = new Set();
        f1Registrations.forEach(reg => {
            reg.nomor_lomba.forEach(n => {
                const gayaName = (typeof n === 'object' ? n.gaya : n) || '';
                if (gayaName) targetEventsSet.add(gayaName.trim());
            });
        });

        const { data: historyData, error: histErr } = await supabaseClient
            .from('event_leaderboard')
            .select('nama_peserta, nomor_lomba, catatan_waktu')
            .neq('event_id', currentEventId);

        if (histErr) throw histErr;

        const pbMap = {};
        (historyData || []).forEach(row => {
            if (!row.nama_peserta || !row.nomor_lomba || !row.catatan_waktu) return;
            const ms = parseTimeToMs(row.catatan_waktu);
            if (ms === Infinity) return;

            const key = `${row.nama_peserta.trim().toLowerCase()}|${row.nomor_lomba.trim().toLowerCase()}`;
            if (!pbMap[key] || ms < pbMap[key].ms) {
                pbMap[key] = {
                    timeStr: row.catatan_waktu.trim().replace(/,/g, '.'),
                    ms: ms
                };
            }
        });

        let updatedAthletesCount = 0;
        let updatedEventsCount = 0;

        for (const reg of f1Registrations) {
            let hasChange = false;
            const athleteKeyPrefix = reg.nama_peserta.trim().toLowerCase();

            const newNomorLomba = reg.nomor_lomba.map(nomor => {
                const namaGaya = (typeof nomor === 'object' ? nomor.gaya : nomor) || '';
                const existingST = typeof nomor === 'object' ? (nomor.seed_time || '') : '';
                const lookupKey = `${athleteKeyPrefix}|${namaGaya.trim().toLowerCase()}`;
                const pbRecord = pbMap[lookupKey];

                if (pbRecord) {
                    const currentMs = parseTimeToMs(existingST);
                    if (!existingST || pbRecord.ms < currentMs) {
                        hasChange = true;
                        updatedEventsCount++;
                        return { gaya: namaGaya, seed_time: pbRecord.timeStr };
                    }
                }

                return typeof nomor === 'object' ? nomor : { gaya: namaGaya };
            });

            if (hasChange) {
                const { error: upErr } = await supabaseClient
                    .from('event_registrations')
                    .update({ nomor_lomba: newNomorLomba })
                    .eq('id', reg.id);

                if (!upErr) updatedAthletesCount++;
            }
        }

        if (updatedAthletesCount > 0) {
            alert(`✅ Sync F1 Selesai!\n\nBerhasil menarik catatan waktu terbaik untuk ${updatedAthletesCount} atlet (${updatedEventsCount} nomor lomba). Nomor tanpa histori tetap berstatus NT.`);
        } else {
            alert("ℹ️ Sync F1 Selesai!\n\nBelum ditemukan histori catatan waktu baru untuk nomor lomba yang diikuti peserta F1 saat ini (status tetap NT / sesuai input sebelumnya).");
        }

    } catch (err) {
        console.error(err);
        alert("Gagal melakukan sinkronisasi F1: " + err.message);
    } finally {
        btn.innerHTML = '🔄 Auto-Sync F1';
        btn.disabled = false;
        fetchData();
    }
});


// ==========================================
// FUNGSI HAPUS PESERTA (KHUSUS EVENT MAKER)
// ==========================================
window.hapusPeserta = async function(id) {
    if (!isEventMaker) {
        alert("🛑 Akses ditolak! Hanya pembuat event (Event Maker) yang dapat menghapus peserta.");
        return;
    }

    const target = allRegistrations.find(r => String(r.id) === String(id));
    const nama = target ? `${target.nama_peserta} (${target.klub_asal})` : 'peserta ini';

    if (!confirm(`⚠️ HAPUS PESERTA?\n\nYakin ingin menghapus permanen data pendaftaran a.n. ${nama}?\nData yang dihapus tidak dapat dikembalikan.`)) {
        return;
    }

    try {
        const { data: deletedRows, error } = await supabaseClient
            .from('event_registrations')
            .delete()
            .eq('id', id)
            .eq('event_id', currentEventId)
            .select('id');

        if (error) throw error;
        if (!deletedRows || deletedRows.length === 0) {
            throw new Error("Data tidak terhapus. Pastikan policy DELETE di Supabase untuk tabel event_registrations sudah aktif.");
        }

        alert(`🗑️ Data peserta ${nama} berhasil dihapus.`);
        fetchData();
    } catch (err) {
        alert("Gagal menghapus peserta: " + err.message);
    }
};

// ==========================================
// TERBITKAN F1 ID MASSAL UNTUK PESERTA TAMU
// ==========================================
const btnGenerateGuestF1 = document.getElementById('btnGenerateGuestF1');
if (btnGenerateGuestF1) {
    btnGenerateGuestF1.addEventListener('click', async () => {
        const guestRows = allRegistrations.filter(r => !r.f1_id && r.gender !== 'Regu/Tim');
        if (guestRows.length === 0) {
            alert("✅ Semua peserta individu di event ini sudah memiliki F1 ID!");
            return;
        }

        if (!confirm(`Ditemukan ${guestRows.length} peserta tamu tanpa F1 ID.\n\nTerbitkan F1 ID otomatis untuk semua peserta tersebut sekarang?`)) {
            return;
        }

        const origHtml = btnGenerateGuestF1.innerHTML;
        btnGenerateGuestF1.innerHTML = '⏳ Memproses...';
        btnGenerateGuestF1.disabled = true;

        try {
            let successCount = 0;
            for (const row of guestRows) {
                const assignedF1 = await generateOrFindF1Id(supabaseClient, {
                    nama: row.nama_peserta,
                    dob: row.tanggal_lahir,
                    gender: row.gender,
                    aktaUrl: row.akta_url
                });
                if (assignedF1) {
                    const { error: upErr } = await supabaseClient
                        .from('event_registrations')
                        .update({ f1_id: assignedF1 })
                        .eq('id', row.id);
                    if (!upErr) successCount++;
                }
            }

            alert(`✅ Selesai! ${successCount} dari ${guestRows.length} atlet klub tamu berhasil mendapatkan F1 ID.`);
            fetchData();
        } catch (err) {
            alert("Gagal menerbitkan F1 ID tamu: " + err.message);
        } finally {
            btnGenerateGuestF1.innerHTML = origHtml;
            btnGenerateGuestF1.disabled = false;
        }
    });
}
