import { sb as supaJR } from './config.js';
import { supabaseClient as supaSCS } from './supabase.js';

let jrTransactions = [];
let f1Transactions = [];

// Data Pegawai (Untuk Slip Gaji)
let dbFeeCoach = [];
let dbFeeMarketing = [];

const formatRp = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);
};
const formatDate = (dateString) => {
    if(!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

// --- LOGIKA TAB & PAGE TRANSITION ---
window.switchTab = function(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('bg-slate-900', 'text-white', 'bg-blue-100', 'bg-red-100');
        b.classList.add('text-slate-600', 'bg-transparent');
    });
    
    document.getElementById(tabId).classList.remove('hidden');
    document.getElementById(tabId).classList.add('block');
    
    const activeBtn = document.getElementById('btn-' + tabId.replace('tab-', ''));
    if(tabId === 'tab-tpi') activeBtn.classList.add('bg-slate-900', 'text-white');
    if(tabId === 'tab-jr') activeBtn.classList.add('bg-blue-600', 'text-white');
    if(tabId === 'tab-f1') activeBtn.classList.add('bg-red-600', 'text-white');
};

window.closeReport = function() {
    document.getElementById('page-report').classList.add('hidden');
    document.getElementById('page-dashboard').classList.remove('hidden');
    document.getElementById('page-dashboard').classList.add('block');
};

// --- FUNGSI RENDER DASHBOARD (Sama spt sebelumnya) ---
function renderUI() {
    let jrMasuk = 0, jrKeluar = 0, jrPajak = 0;
    let f1Masuk = 0, f1Keluar = 0, f1Pajak = 0;

    const tBodyJR = document.getElementById('tabel-kas-jr'); tBodyJR.innerHTML = '';
    jrTransactions.forEach(t => {
        const nominal = Number(t.jumlah) || 0;
        const jenisStr = String(t.jenis || '').toLowerCase().trim();
        const isMasuk = jenisStr.includes('masuk') || jenisStr.includes('pendapatan') || jenisStr === 'spp';
        let pajak = 0;

        if(isMasuk) { jrMasuk += nominal; pajak = nominal * 0.005; jrPajak += pajak; } 
        else { jrKeluar += nominal; }

        tBodyJR.innerHTML += `
            <tr class="border-b border-slate-200 hover:bg-slate-50 text-sm">
                <td class="p-3 text-slate-500 font-mono text-xs">${t.tanggal || '-'}</td>
                <td class="p-3 font-medium text-slate-800">${t.keterangan || '-'}</td>
                <td class="p-3"><span class="px-2 py-1 rounded text-[10px] font-bold uppercase ${isMasuk ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">${t.jenis || '-'}</span></td>
                <td class="p-3 text-right font-bold ${isMasuk ? 'text-emerald-600' : 'text-red-600'}">${formatRp(nominal)}</td>
                <td class="p-3 text-right font-bold text-orange-500">${isMasuk ? formatRp(pajak) : '-'}</td>
            </tr>`;
    });

    const tBodyF1 = document.getElementById('tabel-kas-f1'); tBodyF1.innerHTML = '';
    f1Transactions.forEach(t => {
        const nominal = Number(t.jumlah) || 0;
        const jenisStr = String(t.jenis || '').toLowerCase().trim();
        const isMasuk = jenisStr.includes('masuk') || jenisStr.includes('pendapatan');
        let pajak = 0;

        if(isMasuk) { f1Masuk += nominal; pajak = nominal * 0.005; f1Pajak += pajak; } 
        else { f1Keluar += nominal; }

        tBodyF1.innerHTML += `
            <tr class="border-b border-slate-200 hover:bg-slate-50 text-sm">
                <td class="p-3 text-slate-500 font-mono text-xs">${t.tanggal || '-'}</td>
                <td class="p-3 font-medium text-slate-800">${t.keterangan || '-'}</td>
                <td class="p-3"><span class="px-2 py-1 rounded text-[10px] font-bold uppercase ${isMasuk ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">${t.jenis || '-'}</span></td>
                <td class="p-3 text-right font-bold ${isMasuk ? 'text-emerald-600' : 'text-red-600'}">${formatRp(nominal)}</td>
                <td class="p-3 text-right font-bold text-orange-500">${isMasuk ? formatRp(pajak) : '-'}</td>
            </tr>`;
    });

    const jrLaba = jrMasuk - jrKeluar - jrPajak;
    const f1Laba = f1Masuk - f1Keluar - f1Pajak;
    const totalTPI = jrLaba + f1Laba;

    document.getElementById('ui-masuk-jr').innerText = formatRp(jrMasuk);
    document.getElementById('ui-keluar-jr').innerText = formatRp(jrKeluar);
    document.getElementById('ui-pajak-jr').innerText = formatRp(jrPajak);
    document.getElementById('ui-laba-jr').innerText = formatRp(jrLaba);

    document.getElementById('ui-masuk-f1').innerText = formatRp(f1Masuk);
    document.getElementById('ui-keluar-f1').innerText = formatRp(f1Keluar);
    document.getElementById('ui-pajak-f1').innerText = formatRp(f1Pajak);
    document.getElementById('ui-laba-f1').innerText = formatRp(f1Laba);
    
    document.getElementById('ui-laba-tpi').innerText = formatRp(totalTPI);

    // Populate Dropdown Pegawai
    const listCoach = dbFeeCoach.map(c => c.nama_coach);
    const listAdmin = dbFeeMarketing.map(m => m.admin_id);
    const uniquePegawai = [...new Set([...listCoach, ...listAdmin])].filter(Boolean).sort();
    
    const selectCoach = document.getElementById('tutup-coach');
    selectCoach.innerHTML = '<option value="semua">-- Semua Pegawai --</option>';
    uniquePegawai.forEach(p => {
        selectCoach.innerHTML += `<option value="${p}">${p}</option>`;
    });
}

// --- FETCH DATA (DITAMBAH TABEL PEGAWAI) ---
async function fetchSemuaData() {
    try {
        const { data: dataJR } = await supaJR.from('akunting').select('*').order('tanggal', { ascending: false });
        if (dataJR) jrTransactions = dataJR;
        
        // Fetch Fee Data
        const { data: dataFc } = await supaJR.from('fee_coach').select('*').order('tanggal', { ascending: false });
        if (dataFc) dbFeeCoach = dataFc;
        
        const { data: dataFm } = await supaJR.from('fee_marketing').select('*').order('tanggal_cair', { ascending: false });
        if (dataFm) dbFeeMarketing = dataFm;

    } catch (error) { console.error("Error JR:", error); }

    try {
        const { data: dataF1 } = await supaSCS.from('akunting_f1').select('*').order('tanggal', { ascending: false });
        if (dataF1) f1Transactions = dataF1;
    } catch (error) { console.warn("F1 Belum Aktif."); }

    renderUI();
}

// --- LOGIKA ARUS TUTUP BUKU & SLIP GAJI ---
document.getElementById('form-tutup-buku')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const startDate = document.getElementById('tutup-start').value;
    const endDate = document.getElementById('tutup-end').value;
    const coachSelected = document.getElementById('tutup-coach').value;

    // Filter Logic helper
    const isWithinDate = (dateStr) => {
        if (!dateStr) return true;
        if (!startDate && !endDate) return true;
        const d = new Date(dateStr);
        const s = startDate ? new Date(startDate) : new Date('1900-01-01');
        const e = endDate ? new Date(endDate) : new Date('2100-01-01');
        return d >= s && d <= e;
    };

    // 1. Filter Cashflow JR (Hanya jika "semua" pegawai)
    let totalMasuk = 0; let totalKeluar = 0;
    if (coachSelected === 'semua') {
        document.getElementById('rep-cashflow-section').style.display = 'block';
        const filteredAkunting = jrTransactions.filter(t => isWithinDate(t.tanggal));
        
        filteredAkunting.forEach(t => {
            const nominal = Number(t.jumlah) || 0;
            const jenisStr = String(t.jenis || '').toLowerCase().trim();
            if (jenisStr.includes('masuk') || jenisStr.includes('pendapatan') || jenisStr === 'spp') {
                totalMasuk += nominal;
            } else {
                totalKeluar += nominal;
            }
        });
        document.getElementById('rep-cf-masuk').innerText = formatRp(totalMasuk);
        document.getElementById('rep-cf-keluar').innerText = formatRp(totalKeluar);
        document.getElementById('rep-cf-laba').innerText = formatRp(totalMasuk - totalKeluar);
    } else {
        // Jika slip gaji personal, sembunyikan cashflow kantor
        document.getElementById('rep-cashflow-section').style.display = 'none';
    }

    // 2. Filter & Render Fee Coach
    const filteredFc = dbFeeCoach.filter(t => {
        const matchDate = isWithinDate(t.tanggal);
        const matchCoach = coachSelected === 'semua' || t.nama_coach === coachSelected;
        return matchDate && matchCoach;
    });

    const tbodyFc = document.getElementById('rep-body-coach');
    tbodyFc.innerHTML = '';
    let sumFeeCoach = 0;
    
    filteredFc.forEach(t => {
        const fee = Number(t.total_fee) || 0;
        sumFeeCoach += fee;
        tbodyFc.innerHTML += `
            <tr class="hover:bg-slate-50">
                <td class="p-3 border-b border-slate-200 text-slate-500 font-mono text-xs">${formatDate(t.tanggal)}</td>
                <td class="p-3 border-b border-slate-200 font-bold text-slate-800">${t.nama_coach || '-'}</td>
                <td class="p-3 border-b border-slate-200">${t.nama_murid || '-'} <span class="text-xs text-slate-400 block">${t.jenis_sesi || ''}</span></td>
                <td class="p-3 border-b border-slate-200 text-center font-bold text-blue-600">${t.total_sesi || 0}</td>
                <td class="p-3 border-b border-slate-200 text-right font-bold text-slate-800">${formatRp(fee)}</td>
            </tr>`;
    });
    if (filteredFc.length === 0) tbodyFc.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400 italic">Tidak ada data mengajar di periode ini.</td></tr>`;

    // 3. Filter & Render Fee Marketing
    const filteredFm = dbFeeMarketing.filter(t => {
        const matchDate = isWithinDate(t.tanggal_cair);
        const matchAdmin = coachSelected === 'semua' || t.admin_id === coachSelected;
        return matchDate && matchAdmin;
    });

    const tbodyFm = document.getElementById('rep-body-marketing');
    tbodyFm.innerHTML = '';
    let sumFeeMarketing = 0;

    filteredFm.forEach(t => {
        const fee = Number(t.fee) || 0;
        sumFeeMarketing += fee;
        tbodyFm.innerHTML += `
            <tr class="hover:bg-slate-50">
                <td class="p-3 border-b border-slate-200 text-slate-500 font-mono text-xs">${formatDate(t.tanggal_cair)}</td>
                <td class="p-3 border-b border-slate-200 font-bold text-slate-800">${t.admin_id || '-'}</td>
                <td class="p-3 border-b border-slate-200 text-slate-600">${t.no_invoice || '-'}</td>
                <td class="p-3 border-b border-slate-200 text-right font-bold text-emerald-600">${formatRp(fee)}</td>
            </tr>`;
    });
    if (filteredFm.length === 0) tbodyFm.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400 italic">Tidak ada komisi cair di periode ini.</td></tr>`;

    // 4. Set Teks Header & Total THP
    let periodeText = (startDate && endDate) ? `${formatDate(startDate)} s/d ${formatDate(endDate)}` : 'Semua Waktu (Tanpa Filter)';
    if(startDate && !endDate) periodeText = `Sejak ${formatDate(startDate)}`;
    if(!startDate && endDate) periodeText = `Sampai ${formatDate(endDate)}`;
    
    document.getElementById('rep-periode').innerText = `Periode: ${periodeText}`;
    document.getElementById('rep-pegawai').innerText = coachSelected === 'semua' ? 'Rekap Seluruh Pegawai' : `Atas Nama: ${coachSelected}`;
    document.getElementById('rep-ttd-nama').innerText = coachSelected === 'semua' ? 'Pegawai' : coachSelected;
    
    // Total Take Home Pay = Fee Coach + Fee Marketing
    document.getElementById('rep-thp').innerText = formatRp(sumFeeCoach + sumFeeMarketing);

    // TRANSISI HALAMAN
    document.getElementById('page-dashboard').classList.remove('block');
    document.getElementById('page-dashboard').classList.add('hidden');
    document.getElementById('page-report').classList.remove('hidden');
    document.getElementById('page-report').classList.add('block');
});

// Jalankan fetch saat halaman dimuat
document.addEventListener('DOMContentLoaded', fetchSemuaData);
