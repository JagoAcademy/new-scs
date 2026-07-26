import { supabaseClient } from './supabase.js';

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
