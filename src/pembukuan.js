// State Management (Ambil dari LocalStorage jika ada, jika kosong buat array baru)
let transactions = JSON.parse(localStorage.getItem('scs_transactions')) || [];
let employees = JSON.parse(localStorage.getItem('scs_employees')) || [];

// Fungsi Format Rupiah
const formatRp = (angka) => {
    return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR', 
        minimumFractionDigits: 0 
    }).format(angka);
};

// Logika Ganti Tab
window.switchTab = function(tabId) {
    // Sembunyikan semua konten
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
        tab.classList.remove('block');
    });
    // Reset gaya semua tombol
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-blue-900', 'text-white');
        btn.classList.add('text-slate-600');
    });

    // Tampilkan tab aktif
    document.getElementById(tabId).classList.remove('hidden');
    document.getElementById(tabId).classList.add('block');
    
    // Warnai tombol aktif
    const activeBtn = document.getElementById('btn-' + tabId.replace('tab-', ''));
    activeBtn.classList.remove('text-slate-600');
    activeBtn.classList.add('bg-blue-900', 'text-white');
};

// Render UI (Perbarui Tabel dan Angka)
function renderUI() {
    let totalMasuk = 0;
    let totalKeluar = 0;

    // 1. Render Tabel Transaksi
    const tBodyTrans = document.getElementById('tabel-transaksi');
    tBodyTrans.innerHTML = '';
    
    transactions.forEach((t, index) => {
        if (t.jenis === 'masuk') totalMasuk += t.nominal;
        if (t.jenis === 'keluar') totalKeluar += t.nominal;

        const isMasuk = t.jenis === 'masuk';
        const badgeClass = isMasuk ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';
        const nominalClass = isMasuk ? 'text-emerald-600' : 'text-red-600';
        
        tBodyTrans.innerHTML += `
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td class="p-3 whitespace-nowrap text-slate-500">${t.tgl}</td>
                <td class="p-3 font-medium text-slate-800">${t.ket}</td>
                <td class="p-3">
                    <span class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${badgeClass}">
                        ${t.jenis}
                    </span>
                </td>
                <td class="p-3 text-right font-bold ${nominalClass}">${formatRp(t.nominal)}</td>
                <td class="p-3 text-center">
                    <button onclick="hapusTransaksi(${index})" class="text-red-400 hover:text-red-600 font-bold text-xs p-1">Hapus</button>
                </td>
            </tr>
        `;
    });

    // 2. Render Dashboard Laba Rugi
    const labaBersih = totalMasuk - totalKeluar;
    document.getElementById('ui-pemasukan').innerText = formatRp(totalMasuk);
    document.getElementById('ui-pengeluaran').innerText = formatRp(totalKeluar);
    
    const uiLaba = document.getElementById('ui-laba');
    uiLaba.innerText = formatRp(labaBersih);
    uiLaba.className = labaBersih >= 0 ? 'text-2xl font-black text-blue-950' : 'text-2xl font-black text-red-600';

    // 3. Render Tabel Karyawan
    const tBodyKar = document.getElementById('tabel-karyawan');
    tBodyKar.innerHTML = '';

    employees.forEach((emp, index) => {
        tBodyKar.innerHTML += `
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td class="p-3 font-bold text-blue-950">${emp.nama}</td>
                <td class="p-3 text-slate-500">${emp.posisi}</td>
                <td class="p-3 text-right font-medium text-slate-700">${formatRp(emp.gaji)}</td>
                <td class="p-3 text-center">
                    <button onclick="bayarGaji(${index})" class="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors mr-2">Bayar Gaji</button>
                    <button onclick="hapusKaryawan(${index})" class="text-red-400 hover:text-red-600 font-bold text-xs p-1">Hapus</button>
                </td>
            </tr>
        `;
    });

    // Simpan otomatis ke Local Storage tiap kali UI dirender
    localStorage.setItem('scs_transactions', JSON.stringify(transactions));
    localStorage.setItem('scs_employees', JSON.stringify(employees));
}

// Handler Submit Transaksi Baru
document.getElementById('form-transaksi')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const tgl = document.getElementById('input-tgl').value;
    const jenis = document.getElementById('input-jenis').value;
    const ket = document.getElementById('input-ket').value;
    const nominal = parseFloat(document.getElementById('input-nominal').value);

    transactions.push({ tgl, jenis, ket, nominal });
    this.reset();
    renderUI();
});

// Handler Submit Karyawan Baru
document.getElementById('form-karyawan')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const nama = document.getElementById('input-nama-kar').value;
    const posisi = document.getElementById('input-posisi-kar').value;
    const gaji = parseFloat(document.getElementById('input-gaji-kar').value);

    employees.push({ nama, posisi, gaji });
    this.reset();
    renderUI();
});

// Fungsi Tombol Bayar Gaji (Jembatan antara data Karyawan & Arus Kas)
window.bayarGaji = function(index) {
    const emp = employees[index];
    const tglHariIni = new Date().toISOString().split('T')[0];
    
    // Konfirmasi mencegah salah pencet
    if(confirm(`Bayar gaji ${emp.nama} sebesar ${formatRp(emp.gaji)}? Data ini akan masuk ke pengeluaran otomatis.`)) {
        transactions.push({
            tgl: tglHariIni,
            jenis: 'keluar',
            ket: `Gaji: ${emp.nama} (${emp.posisi})`,
            nominal: emp.gaji
        });
        renderUI();
        alert('Gaji berhasil dibayarkan dan tercatat di Arus Kas!');
    }
};

// Fungsi Hapus Data
window.hapusTransaksi = function(index) {
    if(confirm('Yakin ingin menghapus transaksi ini?')) {
        transactions.splice(index, 1);
        renderUI();
    }
};

window.hapusKaryawan = function(index) {
    if(confirm('Yakin ingin menghapus data karyawan ini?')) {
        employees.splice(index, 1);
        renderUI();
    }
};

// Render awal saat halaman dimuat
document.addEventListener('DOMContentLoaded', renderUI);
