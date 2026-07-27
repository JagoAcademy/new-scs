// Kita panggil nama aslinya, tapi kita "palsukan" panggilannya jadi supabase khusus di file ini aja
import { supabaseClient as supabase } from './supabase.js';


document.addEventListener('DOMContentLoaded', async () => {
    
    // Opsional: Cek Session Login (Bisa diaktifkan nanti kalau sistem Auth sudah jalan penuh)
    /*
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = '/auth.html';
        return;
    }
    */

    // Tombol Keluar
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = '/auth.html';
        });
    }

    // Jalankan fungsi tarik data!
    fetchDashboardData();
});

async function fetchDashboardData() {
    try {
        // Asumsi kita tarik data dummy untuk Klub ID = 1 (Jago Renang Academy)
        const dummyClubId = 1;

        // 1. TARIK DATA KLUB
        const { data: clubData, error: clubError } = await supabase
            .from('clubs')
            .select('*')
            .eq('id', dummyClubId)
            .single();

        if (clubError) throw clubError;
        
        // Tampilkan Nama Klub di Header
        const clubNameEl = document.getElementById('clubNameDisplay');
        if (clubNameEl) clubNameEl.innerText = clubData.club_name;

        // Ubah logo avatar berdasarkan nama klub
        const logoEl = document.getElementById('clubLogoDisplay');
        if (logoEl) {
            const encodedName = encodeURIComponent(clubData.club_name);
            logoEl.src = `https://ui-avatars.com/api/?name=${encodedName}&background=1e3a8a&color=fff&bold=true`;
        }


        // 2. HITUNG & TARIK DATA ATLET
        const { data: athletesData, error: athletesError } = await supabase
            .from('athletes')
            .select('*')
            .eq('club_id', dummyClubId);

        if (athletesError) throw athletesError;

        // Tampilkan Total Atlet di Angka Dashboard
        const totalAtletEl = document.getElementById('valTotalAtlet');
        if (totalAtletEl) totalAtletEl.innerText = athletesData.length;


        // 3. TARIK JUMLAH EVENT (Opsional, buat ngisi angka event)
        const { count: eventCount } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true });
        
        const totalEventEl = document.getElementById('valEventAktif');
        if (totalEventEl) totalEventEl.innerText = eventCount || 0;


        // 4. RENDER TABEL ATLET KE HTML
        renderAthleteTable(athletesData);

    } catch (error) {
        console.error('Gagal menarik data dari Supabase:', error.message);
        document.getElementById('athleteTableBody').innerHTML = `
            <tr><td colspan="5" class="p-8 text-center text-red-500 font-bold">Gagal memuat data. Periksa koneksi Supabase.</td></tr>
        `;
    }
}

// Fungsi untuk menyuntikkan data JSON dari Supabase ke bentuk Tabel HTML
function renderAthleteTable(athletes) {
    const tbody = document.getElementById('athleteTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = ''; // Hapus teks "Mencari data..."

    if (athletes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-gray-500">Belum ada atlet yang terdaftar di klub ini.</td></tr>`;
        return;
    }

    athletes.forEach((atlet, index) => {
        // Tentukan ikon gender
        const genderIcon = atlet.gender === 'Putra' ? '👦 Putra' : '👧 Putri';
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(atlet.full_name)}&background=f3f4f6&color=374151`;

        // Buat Baris Tabel HTML
        const row = `
            <tr class="hover:bg-blue-50/50 transition-colors group border-b border-gray-50">
                <td class="p-4 text-center font-bold text-gray-400">${index + 1}</td>
                <td class="p-4">
                    <div class="flex items-center gap-3">
                        <img src="${avatarUrl}" class="w-10 h-10 rounded-lg object-cover border border-gray-200">
                        <div>
                            <p class="font-extrabold text-gray-800">${atlet.full_name}</p>
                            <p class="text-xs text-gray-500">${genderIcon}</p>
                        </div>
                    </div>
                </td>
                <td class="p-4">
                    <div class="flex flex-col items-start gap-1">
                        <span class="inline-flex items-center gap-1 bg-blue-50 text-scsBlue border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest shadow-sm">
                            <span class="text-blue-500">🌊</span> F1 ID
                        </span>
                        <span class="font-mono font-bold text-gray-700 text-xs">${atlet.f1_id}</span>
                    </div>
                </td>
                <td class="p-4">
                    <p class="font-bold text-gray-700">${atlet.dob}</p>
                </td>
                <td class="p-4 text-center">
                    <div class="flex items-center justify-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <a href="/f1-profile.html" class="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition" title="Lihat Profil">👁️</a>
                    </div>
                </td>
            </tr>
        `;
        
        // Suntik ke dalam Tabel
        tbody.innerHTML += row;
    });
}
// ==========================================
// LOGIC UNTUK 3 TOMBOL AKSI CEPAT KLUB
// ==========================================

// Elemen Tombol & Modal
const btnAddAthlete = document.getElementById('btnAddAthlete');
const btnVerify = document.getElementById('btnVerify');
const btnCreateEvent = document.getElementById('btnCreateEvent');
const modalAddAthlete = document.getElementById('modalAddAthlete');
const closeModalBtn = document.getElementById('closeModalBtn');
const btnSaveAthlete = document.getElementById('btnSaveAthlete');

// ==========================================
// LOGIC UNTUK 3 TOMBOL AKSI CEPAT KLUB
// ==========================================

// Elemen Tombol & Modal
const btnAddAthlete = document.getElementById('btnAddAthlete');
const btnVerify = document.getElementById('btnVerify');
const btnCreateEvent = document.getElementById('btnCreateEvent');

// Elemen Modal Event
const modalCreateEvent = document.getElementById('modalCreateEvent');
const closeModalEventBtn = document.getElementById('closeModalEventBtn');
const btnSaveEvent = document.getElementById('btnSaveEvent');

// 1. TOMBOL BUAT EVENT -> Buka Tutup Modal
if (btnCreateEvent && modalCreateEvent && closeModalEventBtn) {
    btnCreateEvent.addEventListener('click', () => {
        modalCreateEvent.classList.remove('hidden');
        setTimeout(() => modalCreateEvent.firstElementChild.classList.remove('scale-95'), 10);
    });

    closeModalEventBtn.addEventListener('click', () => {
        modalCreateEvent.firstElementChild.classList.add('scale-95');
        setTimeout(() => modalCreateEvent.classList.add('hidden'), 200);
    });
}

// LOGIC SIMPAN EVENT BARU
if (btnSaveEvent) {
    btnSaveEvent.addEventListener('click', async () => {
        const inputEventName = document.getElementById('inputEventName').value.trim();
        let inputSubdomain = document.getElementById('inputSubdomain').value.trim().toLowerCase();
        const inputEventDate = document.getElementById('inputEventDate').value;
        const statusMsg = document.getElementById('eventStatusMsg');

        // Bersihkan subdomain dari karakter aneh (hanya boleh huruf, angka, dan strip)
        inputSubdomain = inputSubdomain.replace(/[^a-z0-9-]/g, '');

        if (!inputEventName || !inputSubdomain || !inputEventDate) {
            statusMsg.innerText = "Semua kolom wajib diisi!";
            statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-red-100 text-red-600 block";
            return;
        }

        btnSaveEvent.innerText = "Memproses...";
        btnSaveEvent.disabled = true;

        try {
            // Asumsi Klub ID 1 (Jago Academy) yang membuat event
            const dummyClubId = 1;

            const { data, error } = await supabase
                .from('events')
                .insert([{
                    event_name: inputEventName,
                    subdomain: inputSubdomain,
                    event_date: inputEventDate,
                    club_id: dummyClubId
                }])
                .select()
                .single();

            if (error) throw error;

            statusMsg.innerText = "Event berhasil dibuat! Mengalihkan ke Dashboard Event...";
            statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-green-100 text-green-600 block";

            // Jika sukses, lempar user ke halaman event-dashboard.html beserta ID event-nya
            setTimeout(() => {
                window.location.href = `/event-dashboard.html?id=${data.id}`;
            }, 1500);

        } catch (err) {
            console.error(err);
            statusMsg.innerText = "Gagal membuat event: " + err.message;
            statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-red-100 text-red-600 block";
            btnSaveEvent.innerText = "Buat Event Sekarang";
            btnSaveEvent.disabled = false;
        }
    });
}


// 3. TOMBOL TAMBAH ATLET -> Buka Tutup Modal
if (btnAddAthlete && modalAddAthlete && closeModalBtn) {
    btnAddAthlete.addEventListener('click', () => {
        modalAddAthlete.classList.remove('hidden');
        // Animasi pop-up pelan-pelan
        setTimeout(() => modalAddAthlete.firstElementChild.classList.remove('scale-95'), 10);
    });

    closeModalBtn.addEventListener('click', () => {
        modalAddAthlete.firstElementChild.classList.add('scale-95');
        setTimeout(() => modalAddAthlete.classList.add('hidden'), 200);
    });
}

// 4. LOGIC SIMPAN ATLET & GENERATE F1 ID
if (btnSaveAthlete) {
    btnSaveAthlete.addEventListener('click', async () => {
        const inputNama = document.getElementById('inputNama').value.trim();
        const inputDOB = document.getElementById('inputDOB').value;
        const inputGender = document.getElementById('inputGender').value;
        const statusMsg = document.getElementById('statusMsg');

        // Validasi input kosong
        if (!inputNama || !inputDOB) {
            statusMsg.innerText = "Nama dan Tanggal Lahir wajib diisi!";
            statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-red-100 text-red-600 block";
            return;
        }

        // Tampilkan loading
        btnSaveAthlete.innerText = "Memproses...";
        btnSaveAthlete.disabled = true;

        try {
            // A. GENERATE F1 ID (Format: F1-YYMMxxx)
            const dateObj = new Date(inputDOB);
            const yy = dateObj.getFullYear().toString().slice(-2); // Ambil 2 digit tahun
            const mm = ('0' + (dateObj.getMonth() + 1)).slice(-2); // Ambil 2 digit bulan (01-12)
            const random3 = Math.floor(Math.random() * 900) + 100; // Random 100 - 999
            const generatedF1Id = `F1-${yy}${mm}${random3}`;

            // B. SUNTIK KE SUPABASE (Asumsi masuk ke Klub ID 1 / Jago Academy)
            const dummyClubId = 1; 

            const { error } = await supabase
                .from('athletes')
                .insert([{
                    f1_id: generatedF1Id,
                    full_name: inputNama,
                    dob: inputDOB,
                    gender: inputGender,
                    club_id: dummyClubId
                }]);

            if (error) throw error;

            // C. SUKSES! Kosongkan form dan reload data
            statusMsg.innerText = `Berhasil! F1 ID: ${generatedF1Id}`;
            statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-green-100 text-green-600 block";
            
            document.getElementById('inputNama').value = '';
            document.getElementById('inputDOB').value = '';

            // Reload tabel di background
            setTimeout(() => {
                modalAddAthlete.classList.add('hidden');
                btnSaveAthlete.innerText = "Simpan & Generate F1 ID";
                btnSaveAthlete.disabled = false;
                statusMsg.classList.add('hidden');
                
                // Panggil ulang fungsi tarik data biar tabel langsung update otomatis!
                if(typeof fetchDashboardData === 'function') {
                    fetchDashboardData();
                } else {
                    location.reload(); // Fallback kalau fungsi tidak terbaca
                }
            }, 1500);

        } catch (err) {
            console.error(err);
            statusMsg.innerText = "Gagal menyimpan data: " + err.message;
            statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-red-100 text-red-600 block";
            btnSaveAthlete.innerText = "Simpan & Generate F1 ID";
            btnSaveAthlete.disabled = false;
        }
    });
}
