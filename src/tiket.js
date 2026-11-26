import { supabaseClient } from './supabase.js';

let currentEventId = null;
let eventRecord = null;
let activeParticipants = [];
let ticketTypes = [];
let selectedTicketType = { id: 'gelang_default', nama: 'Tiket Gelang', harga: 0 };

function formatRupiah(angka) {
    return 'Rp ' + Number(angka || 0).toLocaleString('id-ID');
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function compressImageFile(file, maxWidth = 1000, quality = 0.75) {
    return new Promise((resolve) => {
        if (!file || !file.type.startsWith('image/')) {
            resolve(file);
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width;
                let h = img.height;
                if (w > maxWidth) {
                    h = Math.round((h * maxWidth) / w);
                    w = maxWidth;
                }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            resolve(file);
                            return;
                        }
                        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = () => resolve(file);
            img.src = e.target.result;
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
}

async function resolveEventId() {
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

document.addEventListener('DOMContentLoaded', async () => {
    currentEventId = await resolveEventId();
    if (!currentEventId) {
        alert("Link pemesanan tiket tidak valid. ID Event tidak ditemukan.");
        return;
    }

    setupTabsAndStepper();
    await loadEventAndParticipants();
});

function setupTabsAndStepper() {
    const tabBeli = document.getElementById('tabBeliTiket');
    const tabCek = document.getElementById('tabCekTiket');
    const panelBeli = document.getElementById('panelBeliTiket');
    const panelCek = document.getElementById('panelCekTiket');

    tabBeli.onclick = () => {
        tabBeli.className = "flex-1 py-2.5 text-xs font-black rounded-lg bg-white text-slate-900 shadow-sm transition";
        tabCek.className = "flex-1 py-2.5 text-xs font-black rounded-lg text-slate-600 hover:text-slate-900 transition";
        panelBeli.classList.remove('hidden');
        panelCek.classList.add('hidden');
    };

    tabCek.onclick = () => {
        tabCek.className = "flex-1 py-2.5 text-xs font-black rounded-lg bg-white text-slate-900 shadow-sm transition";
        tabBeli.className = "flex-1 py-2.5 text-xs font-black rounded-lg text-slate-600 hover:text-slate-900 transition";
        panelCek.classList.remove('hidden');
        panelBeli.classList.add('hidden');
    };

    const qtyInput = document.getElementById('inputQty');
    document.getElementById('btnMinusQty').onclick = () => {
        const cur = Math.max(1, parseInt(qtyInput.value || '1', 10) - 1);
        qtyInput.value = cur;
        updateTotalDisplay();
    };
    document.getElementById('btnPlusQty').onclick = () => {
        const cur = Math.min(100, parseInt(qtyInput.value || '1', 10) + 1);
        qtyInput.value = cur;
        updateTotalDisplay();
    };
    qtyInput.addEventListener('input', updateTotalDisplay);

    document.getElementById('btnBeliLagi').onclick = () => {
        document.getElementById('ticketReceiptCard').classList.add('hidden');
        document.getElementById('formBeliTiket').classList.remove('hidden');
        document.getElementById('inputBuktiBayar').value = '';
        qtyInput.value = 1;
        updateTotalDisplay();
    };

    document.getElementById('btnCariKode').onclick = cekStatusTiket;
}

function renderTicketTypes() {
    const container = document.getElementById('ticketTypeContainer');
    if (!container) return;

    container.innerHTML = ticketTypes.map((t, idx) => {
        const isSelected = selectedTicketType && selectedTicketType.id === t.id;
        const borderCls = isSelected
            ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-400/50'
            : 'border-slate-200 bg-slate-50 hover:border-slate-300';

        return `
            <button type="button" data-type-idx="${idx}" class="btn-select-ticket-type text-left p-3.5 rounded-xl border transition flex items-center justify-between gap-2 cursor-pointer ${borderCls}">
                <div class="min-w-0">
                    <span class="text-xs font-black text-slate-800 block truncate">${escapeHtml(t.nama)}</span>
                    <span class="text-[11px] font-bold text-amber-700">${Number(t.harga) > 0 ? formatRupiah(t.harga) : 'Gratis / Rp 0'}</span>
                </div>
                <span class="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${isSelected ? 'bg-amber-500 text-white' : 'bg-white border border-slate-300 text-transparent'}">✓</span>
            </button>
        `;
    }).join('');

    container.querySelectorAll('.btn-select-ticket-type').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = Number(btn.getAttribute('data-type-idx'));
            if (ticketTypes[idx]) {
                selectedTicketType = ticketTypes[idx];
                renderTicketTypes();
                updateTotalDisplay();
            }
        });
    });
}

function updateTotalDisplay() {
    const qty = Math.max(1, parseInt(document.getElementById('inputQty').value || '1', 10));
    const hargaSatuan = Number(selectedTicketType?.harga || 0);
    const namaTipe = selectedTicketType?.nama || 'Tiket Gelang';
    const total = qty * hargaSatuan;

    document.getElementById('displaySelectedTypeLabel').innerText = namaTipe;
    document.getElementById('displayHargaHtm').innerText = hargaSatuan > 0 ? formatRupiah(hargaSatuan) : 'Rp 0';
    document.getElementById('summaryTypeNote').innerText = `${namaTipe} (${qty} x ${formatRupiah(hargaSatuan)})`;
    document.getElementById('displayTotalBayar').innerText = formatRupiah(total);

    const buktiInput = document.getElementById('inputBuktiBayar');
    const star = document.getElementById('reqBuktiStar');
    if (total <= 0) {
        buktiInput.required = false;
        if (star) star.classList.add('hidden');
    } else {
        buktiInput.required = true;
        if (star) star.classList.remove('hidden');
    }
}

async function loadEventAndParticipants() {
    try {
        const { data, error } = await supabaseClient.rpc('get_public_ticket_event_info', {
            p_event_id: String(currentEventId)
        });

        if (error) throw error;
        if (!data || !data.event) {
            alert("Data event tidak ditemukan.");
            return;
        }

        eventRecord = data.event;
        activeParticipants = Array.isArray(data.participants) ? data.participants : [];

        const config = eventRecord.config || {};
        const isTiketAktif = config.aktif_tiket_htm !== false;

        if (Array.isArray(config.ticket_types) && config.ticket_types.length > 0) {
            ticketTypes = config.ticket_types.map((item, i) => ({
                id: item.id || `type_${i}`,
                nama: (item.nama || 'Tiket Gelang').trim(),
                harga: Number(item.harga || 0)
            }));
        } else {
            ticketTypes = [{
                id: 'gelang_default',
                nama: 'Tiket Gelang',
                harga: Number(config.harga_tiket_htm || 0)
            }];
        }
        selectedTicketType = ticketTypes[0];

        document.getElementById('headerEventName').innerText = eventRecord.event_name || 'EVENT RENANG';

        const rawDate = eventRecord.start_date || eventRecord.event_date || '';
        const lokasi = [config.nama_kolam, eventRecord.kota, eventRecord.provinsi].filter(Boolean).join(' • ');
        document.getElementById('eventDateLoc').innerText = [rawDate, lokasi].filter(Boolean).join(' | ') || 'Official Swimming Event';

        const rekText = config.rekening_tiket_htm
            || [config.nama_bank, config.no_rekening, config.atas_nama ? `a.n. ${config.atas_nama}` : ''].filter(Boolean).join(' • ')
            || 'Transfer sesuai instruksi panitia perlombaan';
        document.getElementById('textRekeningTujuan').innerText = rekText;

        if (!isTiketAktif) {
            document.getElementById('closedBanner').classList.remove('hidden');
            document.getElementById('formBeliTiket').classList.add('hidden');
            return;
        }

        populateKlubDropdown();
        renderTicketTypes();
        updateTotalDisplay();
    } catch (err) {
        console.error(err);
        alert("Gagal memuat data tiket: " + err.message);
    }
}

function populateKlubDropdown() {
    const selectKlub = document.getElementById('selectKlub');
    const clubMap = new Map();

    activeParticipants.forEach(p => {
        const rawClub = (p.klub_asal || 'Individu').trim();
        const key = rawClub.toUpperCase();
        if (!clubMap.has(key)) {
            clubMap.set(key, rawClub);
        }
    });

    const sortedClubs = Array.from(clubMap.values()).sort((a, b) => a.localeCompare(b, 'id'));

    // Tampilkan nama klub/sekolah saja TANPA jumlah peserta
    let html = '<option value="">-- Pilih Klub / Sekolah Asal --</option>';
    sortedClubs.forEach(clubName => {
        html += `<option value="${escapeHtml(clubName)}">${escapeHtml(clubName)}</option>`;
    });
    html += '<option value="Umum / Non-Kontingen">Umum / Penonton Non-Kontingen</option>';

    selectKlub.innerHTML = html;

    selectKlub.addEventListener('change', () => {
        populateAtletByKlub(selectKlub.value);
    });
}

function populateAtletByKlub(selectedClub) {
    const selectAtlet = document.getElementById('selectAtlet');
    const wrapper = document.getElementById('wrapperPilihAtlet');

    if (!selectedClub || selectedClub === 'Umum / Non-Kontingen') {
        selectAtlet.innerHTML = '<option value="">-- Umum / Tanpa Atlet Terkait --</option>';
        wrapper.classList.add('opacity-60');
        return;
    }

    wrapper.classList.remove('opacity-60');
    const key = selectedClub.trim().toUpperCase();
    const filtered = activeParticipants.filter(p => (p.klub_asal || '').trim().toUpperCase() === key);

    let html = `<option value="">-- Kolektif Klub ${escapeHtml(selectedClub)} (Semua Atlet) --</option>`;
    filtered.forEach(p => {
        html += `<option value="${escapeHtml(p.id)}" data-nama="${escapeHtml(p.nama_peserta)}">${escapeHtml(p.nama_peserta)} (${escapeHtml(p.kelompok_umur)})</option>`;
    });
    selectAtlet.innerHTML = html;
}

document.getElementById('formBeliTiket').addEventListener('submit', async (e) => {
    e.preventDefault();

    const klubAsal = document.getElementById('selectKlub').value;
    if (!klubAsal) return alert("Pilih asal klub / sekolah terlebih dahulu!");

    const selectAtlet = document.getElementById('selectAtlet');
    const regId = selectAtlet.value || null;
    const selectedOpt = selectAtlet.options[selectAtlet.selectedIndex];
    const namaAtlet = regId && selectedOpt ? (selectedOpt.getAttribute('data-nama') || selectedOpt.textContent) : null;

    const namaPembeli = document.getElementById('inputNamaPembeli').value.trim();
    const noWa = document.getElementById('inputNoWa').value.trim();
    const qty = Math.max(1, parseInt(document.getElementById('inputQty').value || '1', 10));
    const hargaSatuan = Number(selectedTicketType?.harga || 0);
    const tipeTiket = selectedTicketType?.nama || 'Tiket Gelang';
    const totalHarga = qty * hargaSatuan;
    const buktiFile = document.getElementById('inputBuktiBayar').files[0];

    if (totalHarga > 0 && !buktiFile) {
        return alert("Silakan upload foto bukti transfer terlebih dahulu.");
    }

    const btn = document.getElementById('btnSubmitTiket');
    const origText = btn.innerText;
    btn.innerText = "⏳ Mengirim Pemesanan...";
    btn.disabled = true;

    try {
        let buktiUrl = null;
        if (buktiFile) {
            const compressed = await compressImageFile(buktiFile, 1000, 0.75);
            const fileName = `tiket_${currentEventId}_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
            const { error: upErr } = await supabaseClient.storage
                .from('bukti-transaksi')
                .upload(fileName, compressed);

            if (upErr) throw upErr;
            const { data: pubData } = supabaseClient.storage
                .from('bukti-transaksi')
                .getPublicUrl(fileName);
            buktiUrl = pubData.publicUrl;
        }

        // Gunakan kode referensi pemesanan (ORD), selalu Pending untuk pengecekan manual panitia
        const kodeOrder = `ORD-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 89)}`;

        const { error: insErr } = await supabaseClient
            .from('event_tickets')
            .insert([{
                event_id: eventRecord.id,
                kode_tiket: kodeOrder,
                registration_id: regId,
                nama_atlet: namaAtlet,
                klub_asal: klubAsal,
                tipe_tiket: tipeTiket,
                nama_pembeli: namaPembeli,
                no_wa: noWa,
                jumlah_tiket: qty,
                harga_satuan: hargaSatuan,
                total_harga: totalHarga,
                bukti_url: buktiUrl,
                status_pembayaran: 'Pending'
            }]);

        if (insErr) throw insErr;

        document.getElementById('resKodeTiket').innerText = kodeOrder;
        document.getElementById('resNamaPembeli').innerText = namaPembeli;
        document.getElementById('resKlub').innerText = klubAsal;
        document.getElementById('resTipeTiket').innerText = tipeTiket;
        document.getElementById('resAtlet').innerText = namaAtlet || 'Kolektif Kontingen';
        document.getElementById('resQtyTotal').innerText = `${qty} Tiket (${formatRupiah(totalHarga)})`;
        document.getElementById('resStatus').innerText = 'MENUNGGU VERIFIKASI MANUAL';

        document.getElementById('formBeliTiket').classList.add('hidden');
        document.getElementById('ticketReceiptCard').classList.remove('hidden');
    } catch (err) {
        alert("Gagal mengirim pemesanan: " + err.message);
    } finally {
        btn.innerText = origText;
        btn.disabled = false;
    }
});

async function cekStatusTiket() {
    const kode = document.getElementById('inputCariKode').value.trim();
    const box = document.getElementById('hasilCekTiket');
    if (!kode) return alert("Masukkan kode referensi pemesanan terlebih dahulu.");

    box.innerHTML = `<p class="text-xs text-slate-400 font-bold text-center py-4">Mengecek status pemesanan...</p>`;
    try {
        const { data, error } = await supabaseClient.rpc('get_public_ticket_receipt', {
            p_kode_tiket: kode
        });
        if (error) throw error;
        if (!data) {
            box.innerHTML = `<p class="text-xs text-red-600 font-bold text-center py-4">Kode pemesanan "${escapeHtml(kode)}" tidak ditemukan.</p>`;
            return;
        }

        const stRaw = String(data.status_pembayaran || 'Pending').toLowerCase();
        const isLunas = stRaw === 'lunas';
        const isDitolak = stRaw === 'ditolak';

        const statusLabel = isLunas
            ? 'TERVERIFIKASI (SIAP AMBIL GELANG)'
            : (isDitolak ? 'DITOLAK PANITIA' : 'MENUNGGU VERIFIKASI MANUAL');
        const statusCls = isLunas
            ? 'bg-emerald-100 text-emerald-800'
            : (isDitolak ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800');

        box.innerHTML = `
            <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs mt-2">
                <div class="flex justify-between items-center border-b border-slate-200 pb-2 gap-2">
                    <span class="font-mono font-black text-sm text-slate-900">${escapeHtml(data.kode_tiket)}</span>
                    <span class="px-2.5 py-0.5 rounded font-black text-[10px] uppercase ${statusCls}">
                        ${statusLabel}
                    </span>
                </div>
                <p><strong>Pemesan:</strong> ${escapeHtml(data.nama_pembeli)}</p>
                <p><strong>Klub / Sekolah:</strong> ${escapeHtml(data.klub_asal)}</p>
                <p><strong>Atlet Terkait:</strong> ${escapeHtml(data.nama_atlet || 'Kolektif Klub')}</p>
                <p><strong>Tipe Tiket:</strong> ${escapeHtml(data.tipe_tiket || 'Tiket Gelang')}</p>
                <p><strong>Jumlah:</strong> ${data.jumlah_tiket} Tiket (${formatRupiah(data.total_harga)})</p>
                ${isLunas
                    ? '<p class="text-[11px] font-bold text-emerald-700 pt-1">✅ Pembayaran sudah diverifikasi. Silakan tunjukkan kode ini di meja registrasi untuk mengambil tiket gelang.</p>'
                    : '<p class="text-[11px] text-slate-500 pt-1">⏳ Pembayaran sedang dicek manual oleh panitia. Tiket gelang akan diberikan setelah diverifikasi.</p>'
                }
            </div>
        `;
    } catch (err) {
        box.innerHTML = `<p class="text-xs text-red-600 font-bold text-center py-4">Gagal mengecek status: ${escapeHtml(err.message)}</p>`;
    }
}
