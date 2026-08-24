// Memanggil Supabase Jago Renang (dari config.js)
import { sb as supaJR } from './config.js';

// Memanggil Supabase SCS/F1 (dari supabase.js)
import { supabaseClient as supaSCS } from './supabase.js';

// State Management
let jrTransactions = [];
let f1Transactions = [];

// Fungsi Format Rupiah
const formatRp = (angka) => {
    return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR', 
        minimumFractionDigits: 0 
    }).format(angka || 0);
};

// Logika Ganti Tab
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

// Fungsi Render UI (Tabel & Kalkulasi)
function renderUI() {
    let jrMasuk = 0, jrKeluar = 0;
    let f1Masuk = 0, f1Keluar = 0;

    // --- Render Tabel JR ---
    const tBodyJR = document.getElementById('tabel-kas-jr');
    tBodyJR.innerHTML = '';
    jrTransactions.forEach(t => {
        const isMasuk = t.jenis === 'masuk';
        if(isMasuk) jrMasuk += t.nominal; else jrKeluar += t.nominal;
        
        tBodyJR.innerHTML += `
            <tr class="border-b border-slate-100 hover:bg-slate-50">
                <td class="p-3 text-slate-500">${t.tgl}</td>
                <td class="p-3 font-medium text-slate-800">${t.ket}</td>
                <td class="p-3"><span class="px-2 py-1 rounded text-[10px] font-bold uppercase ${isMasuk ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">${t.jenis}</span></td>
                <td class="p-3 text-right font-bold ${isMasuk ? 'text-emerald-600' : 'text-red-600'}">${formatRp(t.nominal)}</td>
            </tr>
        `;
    });
    if(jrTransactions.length === 0) tBodyJR.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400 italic">Data kosong atau gagal ditarik dari DB.</td></tr>`;

    // --- Render Tabel F1 ---
    const tBodyF1 = document.getElementById('tabel-kas-f1');
    tBodyF1.innerHTML = '';
    f1Transactions.forEach(t => {
        const isMasuk = t.jenis === 'masuk';
        if(isMasuk) f1Masuk += t.nominal; else f1Keluar += t.nominal;
        
        tBodyF1.innerHTML += `
            <tr class="border-b border-slate-100 hover:bg-slate-50">
                <td class="p-3 text-slate-500">${t.tgl}</td>
                <td class="p-3 font-medium text-slate-800">${t.ket}</td>
                <td class="p-3"><span class="px-2 py-1 rounded text-[10px] font-bold uppercase ${isMasuk ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}">${t.jenis}</span></td>
                <td class="p-3 text-right font-bold ${isMasuk ? 'text-emerald-600' : 'text-orange-600'}">${formatRp(t.nominal)}</td>
            </tr>
        `;
    });
    if(f1Transactions.length === 0) tBodyF1.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400 italic">Data kosong atau gagal ditarik dari DB.</td></tr>`;

    // --- Update Summary Dashboard PT TPI ---
    const jrLaba = jrMasuk - jrKeluar;
    const f1Laba = f1Masuk - f1Keluar;
    const totalTPI = jrLaba + f1Laba;

    document.getElementById('ui-masuk-jr').innerText = formatRp(jrMasuk);
    document.getElementById('ui-keluar-jr').innerText = formatRp(jrKeluar);
    document.getElementById('ui-laba-jr').innerText = formatRp(jrLaba);

    document.getElementById('ui-masuk-f1').innerText = formatRp(f1Masuk);
    document.getElementById('ui-keluar-f1').innerText = formatRp(f1Keluar);
    document.getElementById('ui-laba-f1').innerText = formatRp(f1Laba);

    document.getElementById('ui-laba-tpi').innerText = formatRp(totalTPI);
}

// -------------------------------------------------------------------
// SISTEM TARIK DATA DARI 2 DATABASE SUPABASE (NO DUMMY DATA)
// -------------------------------------------------------------------
async function fetchSemuaData() {
    console.log("Memulai fetching dari Multi-Node Supabase...");

    // 1. Tarik Data Jago Renang (Menggunakan config.js)
    // NOTE: Ganti 'transaksi_jr' dengan nama tabel asli di DB Jago Renang Anda
    try {
        const { data: dataJR, error: errJR } = await supaJR.from('transaksi_jr').select('*').order('tgl', { ascending: false });
        if (errJR) throw errJR;
        if (dataJR) jrTransactions = dataJR;
        console.log("Data JR Berhasil ditarik:", dataJR);
    } catch (error) {
        console.error("Gagal menarik data Jago Renang:", error.message);
    }

    // 2. Tarik Data F1 Swimming (Menggunakan supabase.js)
    // NOTE: Ganti 'transaksi_f1' dengan nama tabel asli di DB SCS Anda
    try {
        const { data: dataF1, error: errF1 } = await supaSCS.from('transaksi_f1').select('*').order('tgl', { ascending: false });
        if (errF1) throw errF1;
        if (dataF1) f1Transactions = dataF1;
        console.log("Data F1 Berhasil ditarik:", dataF1);
    } catch (error) {
        console.error("Gagal menarik data F1 Swimming:", error.message);
    }

    // Render ulang setelah mencoba menarik data
    renderUI();
}

// -------------------------------------------------------------------
// SISTEM INPUT DATA KE SUPABASE
// -------------------------------------------------------------------
document.getElementById('form-jr-kas')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-jr');
    btnSubmit.innerText = "Menyimpan ke DB...";
    btnSubmit.disabled = true;

    const tgl = document.getElementById('jr-tgl').value;
    const jenis = document.getElementById('jr-jenis').value;
    const ket = document.getElementById('jr-ket').value;
    const nominal = parseFloat(document.getElementById('jr-nominal').value);

    // Insert ke tabel DB Jago Renang
    const { data, error } = await supaJR.from('transaksi_jr').insert([{ tgl, jenis, ket, nominal }]);
    
    if (error) {
        alert("Gagal simpan ke DB Jago Renang: " + error.message);
    } else {
        alert("Berhasil simpan ke Buku Besar Jago Renang!");
        this.reset();
        await fetchSemuaData(); // Tarik ulang dari DB biar update
    }
    
    btnSubmit.innerText = "Simpan ke DB Jago Renang";
    btnSubmit.disabled = false;
});

document.getElementById('form-f1-kas')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-f1');
    btnSubmit.innerText = "Menyimpan ke DB...";
    btnSubmit.disabled = true;

    const tgl = document.getElementById('f1-tgl').value;
    const jenis = document.getElementById('f1-jenis').value;
    const ket = document.getElementById('f1-ket').value;
    const nominal = parseFloat(document.getElementById('f1-nominal').value);

    // Insert ke tabel DB SCS
    const { data, error } = await supaSCS.from('transaksi_f1').insert([{ tgl, jenis, ket, nominal }]);
    
    if (error) {
        alert("Gagal simpan ke DB F1/SCS: " + error.message);
    } else {
        alert("Berhasil simpan ke Buku Besar F1!");
        this.reset();
        await fetchSemuaData(); // Tarik ulang dari DB biar update
    }

    btnSubmit.innerText = "Simpan ke DB SCS (F1)";
    btnSubmit.disabled = false;
});

// Jalankan fetch saat halaman dimuat
document.addEventListener('DOMContentLoaded', fetchSemuaData);
