import { sb as supaJR } from './config.js';
import { supabaseClient as supaSCS } from './supabase.js';

let jrTransactions = [];
let f1Transactions = [];

const formatRp = (angka) => {
    return new Intl.NumberFormat('id-ID', { 
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0 
    }).format(angka || 0);
};

window.switchTab = function(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
        tab.classList.remove('block');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-slate-900', 'text-white', 'bg-blue-100', 'bg-red-100');
        btn.classList.add('text-slate-600', 'bg-transparent');
    });

    document.getElementById(tabId).classList.remove('hidden');
    document.getElementById(tabId).classList.add('block');
    
    const activeBtn = document.getElementById('btn-' + tabId.replace('tab-', ''));
    if(tabId === 'tab-tpi') activeBtn.classList.add('bg-slate-900', 'text-white');
    if(tabId === 'tab-jr') activeBtn.classList.add('bg-blue-600', 'text-white');
    if(tabId === 'tab-f1') activeBtn.classList.add('bg-red-600', 'text-white');
};

function renderUI() {
    let jrMasuk = 0, jrKeluar = 0, jrPajak = 0;
    let f1Masuk = 0, f1Keluar = 0, f1Pajak = 0;

    // --- Render Tabel JR ---
    const tBodyJR = document.getElementById('tabel-kas-jr');
    tBodyJR.innerHTML = '';
    
    jrTransactions.forEach(t => {
        const nominal = Number(t.jumlah) || 0;
        
        // Perbaikan Logika: Mengecek apakah string jenis mengandung kata 'masuk' atau 'pendapatan' (tidak case sensitive)
        const jenisStr = String(t.jenis || '').toLowerCase().trim();
        const isMasuk = jenisStr.includes('masuk') || jenisStr.includes('pendapatan') || jenisStr === 'spp';
        
        let pajak = 0;

        if(isMasuk) {
            jrMasuk += nominal;
            pajak = nominal * 0.005; // Pajak PT Perorangan 0.5%
            jrPajak += pajak;
        } else {
            jrKeluar += nominal;
        }

        tBodyJR.innerHTML += `
            <tr class="border-b border-slate-200 hover:bg-slate-50 text-sm">
                <td class="p-3 text-slate-500 font-mono text-xs">${t.tanggal || '-'}</td>
                <td class="p-3 font-medium text-slate-800">${t.keterangan || '-'}</td>
                <td class="p-3">
                    <span class="px-2 py-1 rounded text-[10px] font-bold uppercase ${isMasuk ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">${t.jenis || '-'}</span>
                </td>
                <td class="p-3 text-right font-bold ${isMasuk ? 'text-emerald-600' : 'text-red-600'}">${formatRp(nominal)}</td>
                <td class="p-3 text-right font-bold text-orange-500">${isMasuk ? formatRp(pajak) : '-'}</td>
            </tr>
        `;
    });
    if(jrTransactions.length === 0) tBodyJR.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400 italic">Data kosong atau gagal ditarik.</td></tr>`;

    // --- Render Tabel F1 ---
    const tBodyF1 = document.getElementById('tabel-kas-f1');
    tBodyF1.innerHTML = '';
    
    f1Transactions.forEach(t => {
        const nominal = Number(t.jumlah) || 0;
        
        const jenisStr = String(t.jenis || '').toLowerCase().trim();
        const isMasuk = jenisStr.includes('masuk') || jenisStr.includes('pendapatan');
        
        let pajak = 0;

        if(isMasuk) {
            f1Masuk += nominal;
            pajak = nominal * 0.005; 
            f1Pajak += pajak;
        } else {
            f1Keluar += nominal;
        }

        tBodyF1.innerHTML += `
            <tr class="border-b border-slate-200 hover:bg-slate-50 text-sm">
                <td class="p-3 text-slate-500 font-mono text-xs">${t.tanggal || '-'}</td>
                <td class="p-3 font-medium text-slate-800">${t.keterangan || '-'}</td>
                <td class="p-3">
                    <span class="px-2 py-1 rounded text-[10px] font-bold uppercase ${isMasuk ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">${t.jenis || '-'}</span>
                </td>
                <td class="p-3 text-right font-bold ${isMasuk ? 'text-emerald-600' : 'text-red-600'}">${formatRp(nominal)}</td>
                <td class="p-3 text-right font-bold text-orange-500">${isMasuk ? formatRp(pajak) : '-'}</td>
            </tr>
        `;
    });
    if(f1Transactions.length === 0) tBodyF1.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400 italic">Data kosong (SCS belum profit).</td></tr>`;

    // --- Update Summary Dashboard PT TPI ---
    // LABA BERSIH = Pemasukan - Pengeluaran - Pajak (0.5%)
    const jrLaba = jrMasuk - jrKeluar - jrPajak;
    const f1Laba = f1Masuk - f1Keluar - f1Pajak;
    const totalTPI = jrLaba + f1Laba;

    // Angka Dashboard JR
    document.getElementById('ui-masuk-jr').innerText = formatRp(jrMasuk);
    document.getElementById('ui-keluar-jr').innerText = formatRp(jrKeluar);
    document.getElementById('ui-pajak-jr').innerText = formatRp(jrPajak);
    document.getElementById('ui-laba-jr').innerText = formatRp(jrLaba);

    // Angka Dashboard F1
    document.getElementById('ui-masuk-f1').innerText = formatRp(f1Masuk);
    document.getElementById('ui-keluar-f1').innerText = formatRp(f1Keluar);
    document.getElementById('ui-pajak-f1').innerText = formatRp(f1Pajak);
    document.getElementById('ui-laba-f1').innerText = formatRp(f1Laba);

    // Angka Dashboard Utama TPI
    document.getElementById('ui-laba-tpi').innerText = formatRp(totalTPI);
}

// -------------------------------------------------------------------
// SISTEM TARIK & INPUT DATA
// -------------------------------------------------------------------
async function fetchSemuaData() {
    try {
        const { data: dataJR, error: errJR } = await supaJR.from('akunting').select('*').order('tanggal', { ascending: false });
        if (errJR) throw errJR;
        if (dataJR) jrTransactions = dataJR;
    } catch (error) { console.error("Gagal menarik data Jago Renang:", error.message); }

    try {
        const { data: dataF1, error: errF1 } = await supaSCS.from('akunting_f1').select('*').order('tanggal', { ascending: false });
        if (errF1) throw errF1;
        if (dataF1) f1Transactions = dataF1;
    } catch (error) { console.warn("F1 Akunting belum aktif."); }

    renderUI();
}

document.getElementById('form-jr-kas')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-jr');
    btnSubmit.innerText = "Menyimpan...";
    btnSubmit.disabled = true;

    const tanggal = document.getElementById('jr-tgl').value;
    const jenis = document.getElementById('jr-jenis').value; // Mengambil string seperti "Pemasukan SPP"
    const keterangan = document.getElementById('jr-ket').value;
    const jumlah = parseFloat(document.getElementById('jr-nominal').value);

    const { data, error } = await supaJR.from('akunting').insert([{ tanggal, jenis, keterangan, jumlah }]);
    
    if (error) alert("Gagal: " + error.message);
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
    
    if (error) alert("Gagal: " + error.message);
    else { this.reset(); await fetchSemuaData(); }

    btnSubmit.innerText = "Simpan Transaksi";
    btnSubmit.disabled = false;
});

document.addEventListener('DOMContentLoaded', fetchSemuaData);
