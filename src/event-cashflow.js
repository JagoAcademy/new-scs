import { supabaseClient } from './supabase.js';

let currentEventId = null;
let currentUserId = null;
let isEventMaker = false;
let eventTitle = '';
let allCashflows = [];

function formatRupiah(num) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Number(num) || 0);
}

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', async () => {
    // ==========================================
    // TOGGLE DESKTOP/MOBILE VIEW
    // ==========================================
    const btnToggleView = document.getElementById('btnToggleView');
    const viewportMeta = document.getElementById('viewportMeta');
    const iconDesktop = document.getElementById('iconDesktop');
    const iconMobile = document.getElementById('iconMobile');

    let isDesktopMode = localStorage.getItem('scs_desktop_mode') === 'true';

    function applyViewportMode() {
        if (isDesktopMode) {
            viewportMeta.setAttribute('content', 'width=1280');
            if (iconDesktop) iconDesktop.classList.add('hidden');
            if (iconMobile) iconMobile.classList.remove('hidden');
        } else {
            viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0');
            if (iconDesktop) iconDesktop.classList.remove('hidden');
            if (iconMobile) iconMobile.classList.add('hidden');
        }
    }
    applyViewportMode();

    if (btnToggleView) {
        btnToggleView.addEventListener('click', () => {
            isDesktopMode = !isDesktopMode;
            localStorage.setItem('scs_desktop_mode', isDesktopMode);
            applyViewportMode();
        });
    }

    // ==========================================
    // TOGGLE DARK MODE
    // ==========================================
    const btnToggleDark = document.getElementById('btnToggleDark');
    const iconMoon = document.getElementById('iconMoon');
    const iconSun = document.getElementById('iconSun');

    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        if (iconMoon) iconMoon.classList.add('hidden');
        if (iconSun) iconSun.classList.remove('hidden');
    }

    if (btnToggleDark) {
        btnToggleDark.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            if (iconMoon) iconMoon.classList.toggle('hidden', isDark);
            if (iconSun) iconSun.classList.toggle('hidden', !isDark);
        });
    }

    // ==========================================
    // VALIDASI PARAMETER & AUTH SESSION
    // ==========================================
    const urlParams = new URLSearchParams(window.location.search);
    currentEventId = urlParams.get('id');

    if (!currentEventId) {
        alert("ID Event tidak ditemukan! Mengembalikan ke Dashboard Utama.");
        window.location.replace('/dashboard.html');
        return;
    }

    const btnBack = document.getElementById('btnBackToEvent');
    if (btnBack) btnBack.href = `/event-dashboard.html?id=${currentEventId}`;

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            alert("Akses ditolak! Silakan login terlebih dahulu.");
            window.location.replace('/auth.html');
            return;
        }

        currentUserId = session.user.id;
        const currentUserEmail = session.user.email;

        // Ambil detail event
        const { data: eventData, error: eventErr } = await supabaseClient
            .from('events')
            .select('*')
            .eq('id', currentEventId)
            .single();

        if (eventErr || !eventData) throw new Error("Event tidak ditemukan.");

        // Cek apakah user adalah ID Maker Event (Owner langsung atau Owner Club pembuat event)
        if (eventData.owner_id === currentUserId) {
            isEventMaker = true;
        } else if (eventData.club_id) {
            const { data: clubOwner } = await supabaseClient
                .from('clubs')
                .select('owner_id')
                .eq('id', eventData.club_id)
                .maybeSingle();
            if (clubOwner && clubOwner.owner_id === currentUserId) {
                isEventMaker = true;
            }
        }

        // Cek apakah user adalah Kolaborator Event
        let isCollab = false;
        let collabRole = 'Kolaborator';
        const { data: collabData } = await supabaseClient
            .from('event_collaborators')
            .select('id, role')
            .eq('event_id', currentEventId)
            .eq('user_id', currentUserId)
            .maybeSingle();

        if (collabData) {
            isCollab = true;
            collabRole = collabData.role || 'Kolaborator';
        }

        const isSuperAdmin = currentUserEmail === 'radityaraja@gmail.com';
        const canView = isEventMaker || isCollab || isSuperAdmin;

        if (!canView) {
            alert("🛑 Akses Ditolak! Hanya pembuat event dan kolaborator terdaftar yang dapat melihat cashflow event ini.");
            window.location.replace('/dashboard.html');
            return;
        }

        // Tampilkan Header Event
        eventTitle = eventData.event_name;
        document.getElementById('cfEventName').innerText = eventData.event_name;
        document.getElementById('cfEventSubdomain').innerText = `${eventData.subdomain}.f1swimming.com`;

        // Atur UI berdasarkan Hak Akses (Maker vs Kolaborator)
        const roleBadge = document.getElementById('roleBadge');
        const sectionInput = document.getElementById('sectionInputCashflow');
        const collabNotice = document.getElementById('collabReadOnlyNotice');
        const thAksi = document.getElementById('thAksiCashflow');

        if (isEventMaker) {
            roleBadge.innerText = "👑 Event Maker (Full Akses)";
            roleBadge.className = "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800";
            sectionInput.classList.remove('hidden');
            thAksi.classList.remove('hidden');
            document.getElementById('cfTanggal').value = new Date().toISOString().split('T')[0];
        } else {
            roleBadge.innerText = `👁️ Mode Lihat (${collabRole})`;
            roleBadge.className = "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800";
            sectionInput.classList.add('hidden');
            thAksi.classList.add('hidden');
            collabNotice.classList.remove('hidden');
        }

        // Setup Filter & Search
        document.getElementById('filterTipeCashflow').addEventListener('change', renderCashflowTable);
        document.getElementById('searchCashflow').addEventListener('input', renderCashflowTable);

        // Setup Form Submit (Hanya aktif untuk Event Maker)
        if (isEventMaker) {
            setupCashflowForm();
        }

        // Setup Export Excel
        setupExportExcel();

        // Muat Data
        await loadRegistrationReference();
        await loadCashflows();

    } catch (err) {
        console.error(err);
        alert("Gagal memuat halaman cashflow: " + err.message);
    }
});

async function loadRegistrationReference() {
    try {
        const { data, error } = await supabaseClient
            .from('event_registrations')
            .select('total_biaya')
            .eq('event_id', currentEventId)
            .eq('status_pembayaran', 'Lunas');

        if (!error && data) {
            const totalReg = data.reduce((acc, row) => acc + (Number(row.total_biaya) || 0), 0);
            document.getElementById('statRefRegistrasi').innerText = `Ref. Pendaftaran Lunas: ${formatRupiah(totalReg)}`;
        }
    } catch (e) {
        // Abaikan jika gagal menarik referensi
    }
}

async function loadCashflows() {
    const tbody = document.getElementById('cashflowTableBody');
    try {
        const { data, error } = await supabaseClient
            .from('event_cashflows')
            .select('*')
            .eq('event_id', currentEventId)
            .order('tanggal', { ascending: false })
            .order('id', { ascending: false });

        if (error) throw error;

        allCashflows = data || [];
        updateSummaryCards();
        renderCashflowTable();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-red-500 font-bold">Gagal memuat data cashflow: ${escapeHtml(err.message)}</td></tr>`;
    }
}

function updateSummaryCards() {
    let totalMasuk = 0;
    let totalKeluar = 0;

    allCashflows.forEach(item => {
        const val = Number(item.nominal) || 0;
        if (item.tipe === 'MASUK') totalMasuk += val;
        if (item.tipe === 'KELUAR') totalKeluar += val;
    });

    const saldo = totalMasuk - totalKeluar;

    document.getElementById('statTotalMasuk').innerText = formatRupiah(totalMasuk);
    document.getElementById('statTotalKeluar').innerText = formatRupiah(totalKeluar);
    document.getElementById('statJumlahTransaksi').innerText = `${allCashflows.length} transaksi tercatat`;

    const saldoEl = document.getElementById('statSaldoBersih');
    saldoEl.innerText = formatRupiah(saldo);
    if (saldo < 0) {
        saldoEl.className = "text-2xl font-black text-rose-600 dark:text-rose-400";
    } else {
        saldoEl.className = "text-2xl font-black text-blue-600 dark:text-blue-400";
    }
}

function renderCashflowTable() {
    const tbody = document.getElementById('cashflowTableBody');
    const filterTipe = document.getElementById('filterTipeCashflow').value;
    const keyword = document.getElementById('searchCashflow').value.toLowerCase().trim();

    const filtered = allCashflows.filter(item => {
        const matchTipe = filterTipe === 'ALL' || item.tipe === filterTipe;
        const matchKeyword = !keyword ||
            (item.keterangan && item.keterangan.toLowerCase().includes(keyword)) ||
            (item.kategori && item.kategori.toLowerCase().includes(keyword)) ||
            (item.metode && item.metode.toLowerCase().includes(keyword));
        return matchTipe && matchKeyword;
    });

    if (filtered.length === 0) {
        const colSpan = isEventMaker ? 6 : 5;
        tbody.innerHTML = `<tr><td colspan="${colSpan}" class="p-8 text-center text-slate-400 font-bold">Belum ada catatan arus kas yang sesuai.</td></tr>`;
        return;
    }

    let html = '';
    filtered.forEach(item => {
        const isMasuk = item.tipe === 'MASUK';
        const badgeTipe = isMasuk
            ? `<span class="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mr-1.5">MASUK</span>`
            : `<span class="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 mr-1.5">KELUAR</span>`;

        const nominalClass = isMasuk
            ? 'text-emerald-600 dark:text-emerald-400 font-mono font-black'
            : 'text-rose-600 dark:text-rose-400 font-mono font-black';
        const nominalPrefix = isMasuk ? '+ ' : '- ';

        const buktiHtml = item.bukti_url
            ? `<a href="${escapeHtml(item.bukti_url)}" target="_blank" class="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg text-[11px] font-bold hover:bg-blue-600 hover:text-white transition">📄 Lihat</a>`
            : `<span class="text-xs text-slate-400">-</span>`;

        const aksiHtml = isEventMaker
            ? `<td class="p-4 text-center space-x-1.5">
                    <button onclick="window.editCashflow(${item.id})" class="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-bold hover:bg-amber-500 hover:text-white transition cursor-pointer">✏️</button>
                    <button onclick="window.deleteCashflow(${item.id})" class="px-2.5 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white transition cursor-pointer">🗑️</button>
               </td>`
            : '';

        html += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                <td class="p-4 text-xs font-mono font-bold text-slate-600 dark:text-slate-300">${escapeHtml(item.tanggal)}</td>
                <td class="p-4">
                    <div class="flex items-center">
                        ${badgeTipe}
                        <span class="text-xs font-extrabold text-slate-700 dark:text-slate-200">${escapeHtml(item.kategori)}</span>
                    </div>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 whitespace-normal max-w-md">${escapeHtml(item.keterangan)}</p>
                </td>
                <td class="p-4 text-xs font-bold text-slate-600 dark:text-slate-300">${escapeHtml(item.metode || '-')}</td>
                <td class="p-4 text-center">${buktiHtml}</td>
                <td class="p-4 text-right text-sm ${nominalClass}">${nominalPrefix}${formatRupiah(item.nominal)}</td>
                ${aksiHtml}
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function setupCashflowForm() {
    const form = document.getElementById('formCashflow');
    const btnSubmit = document.getElementById('btnSubmitCashflow');
    const btnCancelEdit = document.getElementById('btnCancelEdit');

    btnCancelEdit.addEventListener('click', resetFormCashflow);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!isEventMaker) {
            alert("Hanya pembuat event yang dapat mengisi atau mengubah data cashflow.");
            return;
        }

        const editId = document.getElementById('editCashflowId').value;
        const tanggal = document.getElementById('cfTanggal').value;
        const tipe = document.getElementById('cfTipe').value;
        const kategori = document.getElementById('cfKategori').value;
        const keterangan = document.getElementById('cfKeterangan').value.trim();
        const nominal = parseFloat(document.getElementById('cfNominal').value);
        const metode = document.getElementById('cfMetode').value;
        const fileInput = document.getElementById('cfBuktiFile').files[0];

        if (!tanggal || !keterangan || isNaN(nominal) || nominal <= 0) {
            alert("Lengkapi tanggal, keterangan, dan nominal yang valid.");
            return;
        }

        if (fileInput && fileInput.size > 2 * 1024 * 1024) {
            alert("Ukuran file bukti maksimal 2MB.");
            return;
        }

        btnSubmit.disabled = true;
        btnSubmit.innerText = "⏳ Menyimpan...";

        try {
            let buktiUrl = null;
            if (editId) {
                const existing = allCashflows.find(c => String(c.id) === String(editId));
                buktiUrl = existing ? existing.bukti_url : null;
            }

            if (fileInput) {
                const fileExt = fileInput.name.split('.').pop();
                const fileName = `cashflow_${currentEventId}_${Date.now()}.${fileExt}`;
                const { error: upErr } = await supabaseClient.storage.from('bukti-transaksi').upload(fileName, fileInput);
                if (upErr) throw upErr;

                const { data: urlData } = supabaseClient.storage.from('bukti-transaksi').getPublicUrl(fileName);
                buktiUrl = urlData.publicUrl;
            }

            const payload = {
                event_id: currentEventId,
                tanggal,
                tipe,
                kategori,
                keterangan,
                nominal,
                metode,
                bukti_url: buktiUrl
            };

            if (editId) {
                const { error: updErr } = await supabaseClient
                    .from('event_cashflows')
                    .update(payload)
                    .eq('id', editId)
                    .eq('event_id', currentEventId);
                if (updErr) throw updErr;
            } else {
                payload.created_by = currentUserId;
                const { error: insErr } = await supabaseClient
                    .from('event_cashflows')
                    .insert([payload]);
                if (insErr) throw insErr;
            }

            resetFormCashflow();
            await loadCashflows();
        } catch (err) {
            alert("Gagal menyimpan transaksi: " + err.message);
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerText = document.getElementById('editCashflowId').value ? "💾 Simpan Perubahan" : "💾 Simpan Transaksi";
        }
    });
}

function resetFormCashflow() {
    document.getElementById('editCashflowId').value = '';
    document.getElementById('cfTanggal').value = new Date().toISOString().split('T')[0];
    document.getElementById('cfTipe').value = 'MASUK';
    document.getElementById('cfKategori').value = 'Pendaftaran Peserta';
    document.getElementById('cfKeterangan').value = '';
    document.getElementById('cfNominal').value = '';
    document.getElementById('cfMetode').value = 'Transfer Bank';
    document.getElementById('cfBuktiFile').value = '';
    document.getElementById('formCashflowTitle').innerHTML = '<span>➕</span> Catat Arus Kas Event';
    document.getElementById('btnSubmitCashflow').innerText = '💾 Simpan Transaksi';
    document.getElementById('btnCancelEdit').classList.add('hidden');
}

window.editCashflow = function(id) {
    if (!isEventMaker) return;
    const item = allCashflows.find(c => String(c.id) === String(id));
    if (!item) return;

    document.getElementById('editCashflowId').value = item.id;
    document.getElementById('cfTanggal').value = item.tanggal;
    document.getElementById('cfTipe').value = item.tipe;
    document.getElementById('cfKategori').value = item.kategori;
    document.getElementById('cfKeterangan').value = item.keterangan;
    document.getElementById('cfNominal').value = item.nominal;
    document.getElementById('cfMetode').value = item.metode || 'Transfer Bank';
    document.getElementById('cfBuktiFile').value = '';

    document.getElementById('formCashflowTitle').innerHTML = '<span>✏️</span> Edit Transaksi Cashflow';
    document.getElementById('btnSubmitCashflow').innerText = '💾 Simpan Perubahan';
    document.getElementById('btnCancelEdit').classList.remove('hidden');
    document.getElementById('sectionInputCashflow').scrollIntoView({ behavior: 'smooth' });
};

window.deleteCashflow = async function(id) {
    if (!isEventMaker) return;
    if (!confirm("Yakin ingin menghapus catatan transaksi ini?")) return;

    try {
        const { error } = await supabaseClient
            .from('event_cashflows')
            .delete()
            .eq('id', id)
            .eq('event_id', currentEventId);

        if (error) throw error;
        await loadCashflows();
    } catch (err) {
        alert("Gagal menghapus transaksi: " + err.message);
    }
};

function setupExportExcel() {
    const btnExport = document.getElementById('btnExportCashflowExcel');
    if (!btnExport) return;

    btnExport.addEventListener('click', () => {
        if (!allCashflows || allCashflows.length === 0) {
            alert("Belum ada data cashflow untuk di-export.");
            return;
        }

        const rows = allCashflows.map((item, idx) => ({
            'No': idx + 1,
            'Tanggal': item.tanggal,
            'Jenis': item.tipe === 'MASUK' ? 'Pemasukan' : 'Pengeluaran',
            'Kategori': item.kategori,
            'Keterangan': item.keterangan,
            'Metode': item.metode || '-',
            'Nominal': Number(item.nominal) || 0,
            'Link Bukti': item.bukti_url || '-'
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Cashflow_Event");
        const safeTitle = (eventTitle || `Event_${currentEventId}`).replace(/[^a-zA-Z0-9_-]/g, '_');
        XLSX.writeFile(wb, `Cashflow_${safeTitle}.xlsx`);
    });
}
