import { sb as supaJR } from './config.js';
import { supabaseClient as supaSCS } from './supabase.js';

let jrTransactions = [];
let f1Transactions = [];
let dbFeeCoach = [];
let dbFeeMarketing = [];

// --- HELPER FORMATTING ---
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

// --- FUNGSI RENDER DASHBOARD ---
function renderUI() {
    let jrMasuk = 0, jrKeluar = 0, jrPajak = 0;
    let f1Masuk = 0, f1Keluar = 0, f1Pajak = 0;

    // Render Tabel JR
    const tBodyJR = document.getElementById('tabel-kas-jr'); 
    tBodyJR.innerHTML = '';
    jrTransactions.forEach(t => {
        const nominal = Number(t.jumlah) || 0;
        const jenisStr = String(t.jenis || '').toLowerCase().trim();
        const isMasuk = jenisStr.includes('masuk') || jenisStr.includes('pendapatan') || jenisStr === 'spp';
        let pajak = 0;
        if(isMasuk) { jrMasuk += nominal; pajak = nominal * 0.005; jrPajak += pajak; } else { jrKeluar += nominal; }

        tBodyJR.innerHTML += `
            <tr class="border-b border-slate-200 hover:bg-slate-50 text-sm">
                <td class="p-3 text-slate-500 font-mono text-xs">${t.tanggal || '-'}</td>
                <td class="p-3 font-medium text-slate-800">${t.keterangan || '-'}</td>
                <td class="p-3"><span class="px-2 py-1 rounded text-[10px] font-bold uppercase ${isMasuk ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">${t.jenis || '-'}</span></td>
                <td class="p-3 text-right font-bold ${isMasuk ? 'text-emerald-600' : 'text-red-600'}">${formatRp(nominal)}</td>
                <td class="p-3 text-right font-bold text-orange-500">${isMasuk ? formatRp(pajak) : '-'}</td>
            </tr>`;
    });

    // Render Tabel F1
    const tBodyF1 = document.getElementById('tabel-kas-f1'); 
    tBodyF1.innerHTML = '';
    f1Transactions.forEach(t => {
        const nominal = Number(t.jumlah) || 0;
        const jenisStr = String(t.jenis || '').toLowerCase().trim();
        const isMasuk = jenisStr.includes('masuk') || jenisStr.includes('pendapatan');
        let pajak = 0;
        if(isMasuk) { f1Masuk += nominal; pajak = nominal * 0.005; f1Pajak += pajak; } else { f1Keluar += nominal; }

        tBodyF1.innerHTML += `
            <tr class="border-b border-slate-200 hover:bg-slate-50 text-sm">
                <td class="p-3 text-slate-500 font-mono text-xs">${t.tanggal || '-'}</td>
                <td class="p-3 font-medium text-slate-800">${t.keterangan || '-'}</td>
                <td class="p-3"><span class="px-2 py-1 rounded text-[10px] font-bold uppercase ${isMasuk ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">${t.jenis || '-'}</span></td>
                <td class="p-3 text-right font-bold ${isMasuk ? 'text-emerald-600' : 'text-red-600'}">${formatRp(nominal)}</td>
                <td class="p-3 text-right font-bold text-orange-500">${isMasuk ? formatRp(pajak) : '-'}</td>
            </tr>`;
    });

    // Kalkulasi Dashboard
    document.getElementById('ui-masuk-jr').innerText = formatRp(jrMasuk);
    document.getElementById('ui-keluar-jr').innerText = formatRp(jrKeluar);
    document.getElementById('ui-pajak-jr').innerText = formatRp(jrPajak);
    document.getElementById('ui-laba-jr').innerText = formatRp(jrMasuk - jrKeluar - jrPajak);

    document.getElementById('ui-masuk-f1').innerText = formatRp(f1Masuk);
    document.getElementById('ui-keluar-f1').innerText = formatRp(f1Keluar);
    document.getElementById('ui-pajak-f1').innerText = formatRp(f1Pajak);
    document.getElementById('ui-laba-f1').innerText = formatRp(f1Masuk - f1Keluar - f1Pajak);
    
    document.getElementById('ui-laba-tpi').innerText = formatRp((jrMasuk - jrKeluar - jrPajak) + (f1Masuk - f1Keluar - f1Pajak));

    // Populate Dropdown Pegawai Unik
    const listCoach = dbFeeCoach.map(c => c.nama_coach);
    const listAdmin = dbFeeMarketing.map(m => m.admin_id);
    const uniquePegawai = [...new Set([...listCoach, ...listAdmin])].filter(Boolean).sort();
    
    const selectCoach = document.getElementById('tutup-coach');
    selectCoach.innerHTML = '<option value="semua">-- Semua Pegawai --</option>';
    uniquePegawai.forEach(p => { selectCoach.innerHTML += `<option value="${p}">${p}</option>`; });
}

// --- FETCH SEMUA DATA DARI DB ---
async function fetchSemuaData() {
    try {
        const { data: dataJR } = await supaJR.from('akunting').select('*').order('tanggal', { ascending: false });
        if (dataJR) jrTransactions = dataJR;
        
        const { data: dataFc } = await supaJR.from('fee_coach').select('*').order('tanggal', { ascending: false });
        if (dataFc) dbFeeCoach = dataFc;
        
        const { data: dataFm } = await supaJR.from('fee_marketing').select('*').order('tanggal_cair', { ascending: false });
        if (dataFm) dbFeeMarketing = dataFm;
    } catch (error) { console.error("Error Fetch JR:", error); }

    try {
        const { data: dataF1 } = await supaSCS.from('akunting_f1').select('*').order('tanggal', { ascending: false });
        if (dataF1) f1Transactions = dataF1;
    } catch (error) { console.warn("F1 Belum Aktif."); }

    renderUI();
}

// --- LOGIKA FORM: ARUS TUTUP BUKU (LAPORAN & SLIP GAJI) ---
document.getElementById('form-tutup-buku')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const cfStart = document.getElementById('tutup-cf-start').value;
    const cfEnd = document.getElementById('tutup-cf-end').value;
    const coachStart = document.getElementById('tutup-coach-start').value;
    const coachEnd = document.getElementById('tutup-coach-end').value;
    const coachSelected = document.getElementById('tutup-coach').value;

    const checkDate = (dateStr, startStr, endStr) => {
        if (!dateStr) return true;
        if (!startStr && !endStr) return true;
        const d = new Date(dateStr);
        const s = startStr ? new Date(startStr) : new Date('1900-01-01');
        const e = endStr ? new Date(endStr) : new Date('2100-01-01');
        return d >= s && d <= e;
    };

    // 1. Filter Cashflow JR
    let totalMasuk = 0; let totalKeluar = 0;
    if (coachSelected === 'semua') {
        document.getElementById('rep-cashflow-section').style.display = 'block';
        const filteredAkunting = jrTransactions.filter(t => checkDate(t.tanggal, cfStart, cfEnd));
        
        filteredAkunting.forEach(t => {
            const nominal = Number(t.jumlah) || 0;
            const jenisStr = String(t.jenis || '').toLowerCase().trim();
            if (jenisStr.includes('masuk') || jenisStr.includes('pendapatan') || jenisStr === 'spp') totalMasuk += nominal;
            else totalKeluar += nominal;
        });
        document.getElementById('rep-cf-masuk').innerText = formatRp(totalMasuk);
        document.getElementById('rep-cf-keluar').innerText = formatRp(totalKeluar);
        document.getElementById('rep-cf-laba').innerText = formatRp(totalMasuk - totalKeluar);
    } else {
        document.getElementById('rep-cashflow-section').style.display = 'none';
    }

    // 2. Filter Fee Coach
    const filteredFc = dbFeeCoach.filter(t => {
        const matchDate = checkDate(t.tanggal, coachStart, coachEnd);
        const matchCoach = coachSelected === 'semua' || t.nama_coach === coachSelected;
        return matchDate && matchCoach;
    });

    const tbodyFc = document.getElementById('rep-body-coach'); tbodyFc.innerHTML = '';
    let sumFeeCoach = 0;
    filteredFc.forEach(t => {
        const fee = Number(t.total_fee) || 0; sumFeeCoach += fee;
        tbodyFc.innerHTML += `
            <tr class="hover:bg-slate-50">
                <td class="p-3 border-b border-slate-200 text-slate-500 font-mono text-xs">${formatDate(t.tanggal)}</td>
                <td class="p-3 border-b border-slate-200 font-bold text-slate-800">${t.nama_coach || '-'}</td>
                <td class="p-3 border-b border-slate-200">${t.nama_murid || '-'} <span class="text-xs text-slate-400 block">${t.jenis_sesi || ''}</span></td>
                <td class="p-3 border-b border-slate-200 text-center font-bold text-blue-600">${t.total_sesi || 0}</td>
                <td class="p-3 border-b border-slate-200 text-right font-bold text-slate-800">${formatRp(fee)}</td>
            </tr>`;
    });
    if (filteredFc.length === 0) tbodyFc.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400 italic">Tidak ada data.</td></tr>`;

    // 3. Filter Fee Marketing
    const filteredFm = dbFeeMarketing.filter(t => {
        const matchDate = checkDate(t.tanggal_cair, coachStart, coachEnd);
        const matchAdmin = coachSelected === 'semua' || t.admin_id === coachSelected;
        return matchDate && matchAdmin;
    });

    const tbodyFm = document.getElementById('rep-body-marketing'); tbodyFm.innerHTML = '';
    let sumFeeMarketing = 0;
    filteredFm.forEach(t => {
        const fee = Number(t.fee) || 0; sumFeeMarketing += fee;
        tbodyFm.innerHTML += `
            <tr class="hover:bg-slate-50">
                <td class="p-3 border-b border-slate-200 text-slate-500 font-mono text-xs">${formatDate(t.tanggal_cair)}</td>
                <td class="p-3 border-b border-slate-200 font-bold text-slate-800">${t.admin_id || '-'}</td>
                <td class="p-3 border-b border-slate-200 text-slate-600">${t.no_invoice || '-'}</td>
                <td class="p-3 border-b border-slate-200 text-right font-bold text-emerald-600">${formatRp(fee)}</td>
            </tr>`;
    });
    if (filteredFm.length === 0) tbodyFm.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400 italic">Tidak ada komisi.</td></tr>`;

    // 4. Set Header Kop Laporan
    const getText = (s, e) => {
        if(s && e) return `${formatDate(s)} s/d ${formatDate(e)}`;
        if(s && !e) return `Sejak ${formatDate(s)}`;
        if(!s && e) return `Sampai ${formatDate(e)}`;
        return 'Semua Waktu';
    };
    
    document.getElementById('rep-periode-cf').innerText = `Arus Kas: ${getText(cfStart, cfEnd)}`;
    document.getElementById('rep-periode-coach').innerText = `Gaji/Fee: ${getText(coachStart, coachEnd)}`;
    document.getElementById('rep-pegawai').innerText = coachSelected === 'semua' ? 'REKAP SELURUH PEGAWAI' : coachSelected;
    document.getElementById('rep-ttd-nama').innerText = coachSelected === 'semua' ? 'Pegawai' : coachSelected;
    
    document.getElementById('rep-thp').innerText = formatRp(sumFeeCoach + sumFeeMarketing);

    document.getElementById('page-dashboard').classList.remove('block');
    document.getElementById('page-dashboard').classList.add('hidden');
    document.getElementById('page-report').classList.remove('hidden');
    document.getElementById('page-report').classList.add('block');
});

// --- LOGIKA FORM: SIMPAN TRANSAKSI BARU (JR & F1) ---
document.getElementById('form-jr-kas')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-jr');
    btnSubmit.innerText = "Menyimpan...";
    btnSubmit.disabled = true;

    const tanggal = document.getElementById('jr-tgl').value;
    const jenis = document.getElementById('jr-jenis').value; 
    const keterangan = document.getElementById('jr-ket').value;
    const jumlah = parseFloat(document.getElementById('jr-nominal').value);

    const { data, error } = await supaJR.from('akunting').insert([{ tanggal, jenis, keterangan, jumlah }]);
    
    if (error) alert("Gagal Simpan JR: " + error.message);
    else { this.reset(); await fetchSemuaData(); }
    
    btnSubmit.innerText = "Simpan Transaksi";
    btnSubmit.disabled = false;
});

document.getElementById('form-f1-kas')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-f1');
    btnSubmit.innerText = "Menyimpan...";
    btnSubmit.disabled = true;

    const tanggal = document.getElementById('f1-tgl').value;
    const jenis = document.getElementById('f1-jenis').value;
    const keterangan = document.getElementById('f1-ket').value;
    const jumlah = parseFloat(document.getElementById('f1-nominal').value);

    const { data, error } = await supaSCS.from('akunting_f1').insert([{ tanggal, jenis, keterangan, jumlah }]);
    
    if (error) alert("Gagal Simpan F1: " + error.message);
    else { this.reset(); await fetchSemuaData(); }

    btnSubmit.innerText = "Simpan Transaksi";
    btnSubmit.disabled = false;
});

// INIT JALANKAN PROGRAM
document.addEventListener('DOMContentLoaded', fetchSemuaData);
