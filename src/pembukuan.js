// Memanggil Supabase Jago Renang (dari config.js)
import { sb as supaJR } from './config.js';

// Memanggil Supabase SCS/F1 (dari supabase.js)
import { supabaseClient as supaSCS } from './supabase.js';

let jrTransactions = [];
let f1Transactions = [];

const formatRp = (angka) => {
    return new Intl.NumberFormat('id-ID', { 
        style: 'decimal', // Menggunakan decimal agar rapi di kolom jurnal (tanpa simbol Rp berulang)
        minimumFractionDigits: 0 
    }).format(angka || 0);
};

const formatRpDashboard = (angka) => {
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
    let jrMasuk = 0, jrKeluar = 0;
    let f1Masuk = 0, f1Keluar = 0;

    // --- Render Tabel JR (Sistem Jurnal) ---
    const tBodyJR = document.getElementById('tabel-kas-jr');
    tBodyJR.innerHTML = '';
    
    jrTransactions.forEach(t => {
        const nominal = Number(t.jumlah);
        const isMasuk = t.jenis === 'masuk';
        
        if(isMasuk) jrMasuk += nominal; else jrKeluar += nominal;
        
        // Logika Akuntansi: 
        // Jika Masuk -> Debet Kas, Kredit Pendapatan
        // Jika Keluar -> Debet Biaya, Kredit Kas
        const akunDebet = isMasuk ? 'Kas' : `Biaya - ${t.keterangan}`;
        const akunKredit = isMasuk ? `Pendapatan - ${t.keterangan}` : 'Kas';

        tBodyJR.innerHTML += `
            <tr class="border-b border-slate-200 hover:bg-slate-50 text-sm">
                <td class="p-3 text-slate-500 align-top font-mono text-xs">${t.tanggal || '-'}</td>
                <td class="p-3 font-medium text-slate-800 leading-relaxed">
                    <div class="font-bold text-slate-700">${akunDebet}</div>
                    <div class="ml-6 text-slate-500 italic">${akunKredit}</div>
                </td>
                <td class="p-3 text-right text-slate-700 align-top leading-relaxed">
                    <div class="font-bold">${formatRp(nominal)}</div>
                    <div>-</div>
                </td>
                <td class="p-3 text-right text-slate-700 align-top leading-relaxed">
                    <div>-</div>
                    <div class="font-bold">${formatRp(nominal)}</div>
                </td>
            </tr>
        `;
    });
    if(jrTransactions.length === 0) tBodyJR.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400 italic">Data kosong atau gagal ditarik dari DB.</td></tr>`;

    // --- Render Tabel F1 (Sistem Jurnal) ---
    const tBodyF1 = document.getElementById('tabel-kas-f1');
    tBodyF1.innerHTML = '';
    
    f1Transactions.forEach(t => {
        const nominal = Number(t.jumlah);
        const isMasuk = t.jenis === 'masuk';
        
        if(isMasuk) f1Masuk += nominal; else f1Keluar += nominal;
        
        const akunDebet = isMasuk ? 'Kas' : `Biaya - ${t.keterangan}`;
        const akunKredit = isMasuk ? `Pendapatan - ${t.keterangan}` : 'Kas';

        tBodyF1.innerHTML += `
            <tr class="border-b border-slate-200 hover:bg-slate-50 text-sm">
                <td class="p-3 text-slate-500 align-top font-mono text-xs">${t.tanggal || '-'}</td>
                <td class="p-3 font-medium text-slate-800 leading-relaxed">
                    <div class="font-bold text-slate-700">${akunDebet}</div>
                    <div class="ml-6 text-slate-500 italic">${akunKredit}</div>
                </td>
                <td class="p-3 text-right text-slate-700 align-top leading-relaxed">
                    <div class="font-bold">${formatRp(nominal)}</div>
                    <div>-</div>
                </td>
                <td class="p-3 text-right text-slate-700 align-top leading-relaxed">
                    <div>-</div>
                    <div class="font-bold">${formatRp(nominal)}</div>
                </td>
            </tr>
        `;
    });
    if(f1Transactions.length === 0) tBodyF1.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400 italic">SCS belum profit / tabel belum dibuat.</td></tr>`;

    // --- Update Summary Dashboard PT TPI ---
    const jrLaba = jrMasuk - jrKeluar;
    const f1Laba = f1Masuk - f1Keluar;
    const totalTPI = jrLaba + f1Laba;

    document.getElementById('ui-masuk-jr').innerText = formatRpDashboard(jrMasuk);
    document.getElementById('ui-keluar-jr').innerText = formatRpDashboard(jrKeluar);
    document.getElementById('ui-laba-jr').innerText = formatRpDashboard(jrLaba);

    document.getElementById('ui-masuk-f1').innerText = formatRpDashboard(f1Masuk);
    document.getElementById('ui-keluar-f1').innerText = formatRpDashboard(f1Keluar);
    document.getElementById('ui-laba-f1').innerText = formatRpDashboard(f1Laba);

    document.getElementById('ui-laba-tpi').innerText = formatRpDashboard(totalTPI);
}

// -------------------------------------------------------------------
// SISTEM TARIK & INPUT DATA (Tetap Sama Seperti Sebelumnya)
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
    const jenis = document.getElementById('jr-jenis').value;
    const keterangan = document.getElementById('jr-ket').value;
    const jumlah = parseFloat(document.getElementById('jr-nominal').value);

    const { data, error } = await supaJR.from('akunting').insert([{ tanggal, jenis, keterangan, jumlah }]);
    
    if (error) alert("Gagal: " + error.message);
    else { this.reset(); await fetchSemuaData(); }
    
    btnSubmit.innerText = "Posting ke Buku Besar";
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

    btnSubmit.innerText = "Posting ke Buku Besar";
    btnSubmit.disabled = false;
});

document.addEventListener('DOMContentLoaded', fetchSemuaData);
