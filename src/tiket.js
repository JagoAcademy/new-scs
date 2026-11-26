import { supabaseClient } from './supabase.js';

let currentEventId = null;
let eventRecord = null;
let activeParticipants = [];
let hargaSatuan = 0;

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
        alert("Link tiket tidak valid. ID Event tidak ditemukan.");
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

function updateTotalDisplay() {
    const qty = Math.max(1, parseInt(document.getElementById('inputQty').value || '1', 10));
    const total = qty * hargaSatuan;
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
        hargaSatuan = Number(config.harga_tiket_htm || 0);
        const isTiketAktif = config.aktif_tiket_htm !== false; // default aktif

        document.getElementById('headerEventName').innerText = eventRecord.event_name || 'EVENT RENANG';
        document.getElementById('displayHargaHtm').innerText = hargaSatuan > 0 ? formatRupiah(hargaSatuan) : 'GRATIS / Rp 0';

        const rawDate = eventRecord.start_date || eventRecord.event_date || '';
        const lokasi = [config.nama_kolam, eventRecord.kota, eventRecord.provinsi].filter(Boolean).join(' • ');
        document.getElementById('eventDateLoc').innerText = [rawDate, lokasi].filter(Boolean).join(' | ') || 'Official Swimming Event';

        // Info Rekening
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
            clubMap.set(key, { name: rawClub, count: 0 });
        }
        clubMap.get(key).count++;
    });

    const sortedClubs = Array.from(clubMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'id'));

    let html = '<option value="">-- Pilih Klub / Sekolah Asal --</option>';
    sortedClubs.forEach(c => {
        html += `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)} (${c.count} Peserta Terdaftar)</option>`;
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
    const totalHarga = qty * hargaSatuan;
    const buktiFile = document.getElementById('inputBuktiBayar').files[0];

    if (totalHarga > 0 && !buktiFile) {
        return alert("Silakan upload foto bukti transfer terlebih dahulu.");
    }

    const btn = document.getElementById('btnSubmitTiket');
    const origText = btn.innerText;
    btn.innerText = "⏳ Memproses E-Ticket...";
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

        const kodeTiket = `HTM-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 89)}`;
        const statusAwal = totalHarga <= 0 ? 'Lunas' : 'Pending';

        const { error: insErr } = await supabaseClient
            .from('event_tickets')
            .insert([{
                event_id: eventRecord.id,
                kode_tiket: kodeTiket,
                registration_id: regId,
                nama_atlet: namaAtlet,
                klub_asal: klubAsal,
                nama_pembeli: namaPembeli,
                no_wa: noWa,
                jumlah_tiket: qty,
                harga_satuan: hargaSatuan,
                total_harga: totalHarga,
                bukti_url: buktiUrl,
                status_pembayaran: statusAwal
            }]);

        if (insErr) throw insErr;

        // Tampilkan Kartu E-Ticket
        document.getElementById('resKodeTiket').innerText = kodeTiket;
        document.getElementById('resNamaPembeli').innerText = namaPembeli;
        document.getElementById('resKlub').innerText = klubAsal;
        document.getElementById('resAtlet').innerText = namaAtlet || 'Kolektif Kontingen';
        document.getElementById('resQtyTotal').innerText = `${qty} Tiket (${formatRupiah(totalHarga)})`;
        document.getElementById('resStatus').innerText = statusAwal.toUpperCase();
        document.getElementById('resStatus').className = statusAwal === 'Lunas'
            ? "text-xs font-black px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 uppercase"
            : "text-xs font-black px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 uppercase";

        document.getElementById('formBeliTiket').classList.add('hidden');
        document.getElementById('ticketReceiptCard').classList.remove('hidden');
    } catch (err) {
        alert("Gagal memesan tiket: " + err.message);
    } finally {
        btn.innerText = origText;
        btn.disabled = false;
    }
});

async function cekStatusTiket() {
    const kode = document.getElementById('inputCariKode').value.trim();
    const box = document.getElementById('hasilCekTiket');
    if (!kode) return alert("Masukkan kode tiket terlebih dahulu.");

    box.innerHTML = `<p class="text-xs text-slate-400 font-bold text-center py-4">Mencari tiket...</p>`;
    try {
        const { data, error } = await supabaseClient.rpc('get_public_ticket_receipt', {
            p_kode_tiket: kode
        });
        if (error) throw error;
        if (!data) {
            box.innerHTML = `<p class="text-xs text-red-600 font-bold text-center py-4">Kode tiket "${escapeHtml(kode)}" tidak ditemukan.</p>`;
            return;
        }

        const isLunas = String(data.status_pembayaran || '').toLowerCase() === 'lunas';
        box.innerHTML = `
            <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs mt-2">
                <div class="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span class="font-mono font-black text-sm text-slate-900">${escapeHtml(data.kode_tiket)}</span>
                    <span class="px-2.5 py-0.5 rounded font-black text-[10px] uppercase ${isLunas ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                        ${escapeHtml(data.status_pembayaran)}
                    </span>
                </div>
                <p><strong>Pemesan:</strong> ${escapeHtml(data.nama_pembeli)}</p>
                <p><strong>Klub / Sekolah:</strong> ${escapeHtml(data.klub_asal)}</p>
                <p><strong>Atlet Terkait:</strong> ${escapeHtml(data.nama_atlet || 'Kolektif Klub')}</p>
                <p><strong>Jumlah:</strong> ${data.jumlah_tiket} Tiket (${formatRupiah(data.total_harga)})</p>
            </div>
        `;
    } catch (err) {
        box.innerHTML = `<p class="text-xs text-red-600 font-bold text-center py-4">Gagal mengecek tiket: ${escapeHtml(err.message)}</p>`;
    }
}
