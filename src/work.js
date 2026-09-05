import { supabaseClient } from './supabase.js';

let currentUser = null;
let currentDate = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
let rowData = new Array(20).fill(null); 
let currentShareUser = ""; // Menyimpan username target yang sedang di-klik Share

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cek Sesi Tersimpan
    const savedUser = sessionStorage.getItem('wfh_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        initApp();
    }

    // 2. Login Logic
    document.getElementById('btnLogin').addEventListener('click', async () => {
        const id = document.getElementById('loginId').value.trim();
        const pass = document.getElementById('loginPass').value.trim();
        const errEl = document.getElementById('loginError');
        const btn = document.getElementById('btnLogin');

        if (!id || !pass) {
            errEl.innerText = "Isi ID dan Password!";
            errEl.classList.remove('hidden');
            return;
        }

        btn.innerText = "Memeriksa...";
        btn.disabled = true;

        try {
            const { data, error } = await supabaseClient
                .from('wfh_users')
                .select('*')
                .eq('admin_id', id)
                .eq('password', pass)
                .single();

            if (error || !data) throw new Error("Kredensial tidak valid!");

            currentUser = data;
            sessionStorage.setItem('wfh_user', JSON.stringify(data));
            initApp();

        } catch (err) {
            errEl.innerText = "⚠️ Akses Ditolak: " + err.message;
            errEl.classList.remove('hidden');
        } finally {
            btn.innerText = "Masuk Panel 🚀";
            btn.disabled = false;
        }
    });

    // 3. Logout
    document.getElementById('btnLogout').addEventListener('click', () => {
        sessionStorage.removeItem('wfh_user');
        window.location.reload();
    });

    // 4. Deteksi Perubahan Tanggal
    const dateInput = document.getElementById('uiTanggal');
    dateInput.addEventListener('change', (e) => {
        currentDate = e.target.value;
        updateDateHeader();
        fetchDailyData();
    });

    // 5. Setup Pop-up Sosmed Modal
    const sosmedModal = document.getElementById('sosmedChoiceModal');
    
    document.getElementById('btnCloseSosmed').addEventListener('click', () => {
        sosmedModal.classList.add('hidden');
        sosmedModal.classList.remove('flex');
    });

    sosmedModal.addEventListener('click', (e) => {
        if (e.target === sosmedModal) {
            document.getElementById('btnCloseSosmed').click();
        }
    });

    document.getElementById('btnGoIG').addEventListener('click', () => {
        window.open(`https://ig.me/m/${currentShareUser}`, '_blank');
        document.getElementById('btnCloseSosmed').click();
    });

    document.getElementById('btnGoTikTok').addEventListener('click', () => {
        window.open(`https://www.tiktok.com/@${currentShareUser}`, '_blank');
        document.getElementById('btnCloseSosmed').click();
    });
});

// ==========================================
// INISIALISASI APLIKASI
// ==========================================
function initApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    document.getElementById('uiFullName').innerText = currentUser.full_name;
    document.getElementById('uiTanggal').value = currentDate;
    
    updateDateHeader();
    fetchDailyData();
}

function updateDateHeader() {
    const d = new Date(currentDate);
    const textBulanTahun = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    document.getElementById('uiBulanTahun').innerText = textBulanTahun;
}

// ==========================================
// AMBIL DATA 20 BARIS DARI SUPABASE
// ==========================================
async function fetchDailyData() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-500 animate-pulse font-bold">Menarik Data ${currentDate}... ⏳</td></tr>`;

    try {
        const { data, error } = await supabaseClient
            .from('wfh_scraping')
            .select('*')
            .eq('admin_id', currentUser.admin_id)
            .eq('tanggal', currentDate);

        if (error) throw error;

        rowData = new Array(20).fill(null);
        
        if (data && data.length > 0) {
            data.forEach(item => {
                if(item.row_number >= 1 && item.row_number <= 20) {
                    rowData[item.row_number - 1] = item;
                }
            });
        }

        renderTable();
        updateProgress();

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-red-500 font-bold">Gagal memuat: ${err.message}</td></tr>`;
    }
}

// ==========================================
// RENDER TABEL 20 BARIS
// ==========================================
function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    for (let i = 0; i < 20; i++) {
        const rowNum = i + 1;
        const row = rowData[i] || {};

        const isSaved = !!row.nama; 
        const isBonus = rowNum > 15;
        
        const rowBg = isBonus ? 'bg-slate-800/30' : 'bg-transparent';
        const numColor = isBonus ? 'text-amber-500' : 'text-slate-500';

        // Hanya kolom input teks yang terkunci. 
        const lockClassGeneral = isSaved ? 'bg-slate-800 text-slate-400 border-slate-700 cursor-not-allowed opacity-70' : 'bg-slate-900 text-white border-slate-600 focus:border-blue-500';
        
        // Kolom Status SELALU BUKA (Tidak pernah di-disabled)
        const lockClassStatus = 'bg-slate-900 text-white border-slate-600 focus:border-blue-500 cursor-pointer hover:border-blue-400';

        // Logika Pergantian Tombol Simpan -> Share -> Edit
        let actionHtml = '';
        if (isSaved) {
            actionHtml = `
                <div class="flex gap-1" id="actionWrap_${rowNum}">
                    <button onclick="window.shareRow(${rowNum})" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-2 rounded-lg text-xs transition shadow w-full flex items-center justify-center gap-1" title="Hubungi Sosmed/WA">
                        📲 Share
                    </button>
                    <button onclick="window.unlockRow(${rowNum})" class="bg-slate-700 hover:bg-slate-600 text-slate-300 py-1.5 px-2 rounded-lg text-xs transition shadow" title="Edit Data Teks">
                        ✏️
                    </button>
                </div>
            `;
        } else {
            actionHtml = `
                <div id="actionWrap_${rowNum}">
                    <button onclick="window.saveRow(${rowNum})" id="btnSave_${rowNum}" class="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition shadow w-full flex items-center justify-center gap-1">
                        💾 Simpan
                    </button>
                </div>
            `;
        }

        const tr = document.createElement('tr');
        tr.className = `border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${rowBg}`;
        
        // Perhatikan fungsi onchange="window.triggerSaveStatus()" di dropdown status
        tr.innerHTML = `
            <td class="p-3 text-center font-black ${numColor}">${rowNum}</td>
            <td class="p-3">
                <input type="text" id="nama_${rowNum}" value="${row.nama || ''}" ${isSaved ? 'disabled' : ''} placeholder="Nama/IG/Tiktok" class="w-full rounded-lg p-2 text-xs outline-none border transition-colors ${lockClassGeneral}">
            </td>
            <td class="p-3">
                <input type="text" id="wa_${rowNum}" value="${row.no_wa || ''}" ${isSaved ? 'disabled' : ''} placeholder="08.../@tiktok" class="w-full rounded-lg p-2 text-xs outline-none font-mono border transition-colors ${lockClassGeneral}">
            </td>
            <td class="p-3">
                <input type="text" id="club_${rowNum}" value="${row.club_eo || ''}" ${isSaved ? 'disabled' : ''} placeholder="Klub / Wilayah" class="w-full rounded-lg p-2 text-xs outline-none border transition-colors ${lockClassGeneral}">
            </td>
            <td class="p-3">
                <input type="text" id="intro_${rowNum}" value="${row.intro_action || ''}" ${isSaved ? 'disabled' : ''} placeholder="Pesan dikirim" class="w-full rounded-lg p-2 text-xs outline-none border transition-colors ${lockClassGeneral}">
            </td>
            <td class="p-3 text-center" id="actionCol_${rowNum}">
                ${actionHtml}
            </td>
            <td class="p-3">
                <select id="status_${rowNum}" onchange="window.triggerSaveStatus(${rowNum})" class="w-full rounded-lg p-2 text-xs outline-none transition-colors ${lockClassStatus}">
                    <option value="" ${!row.status ? 'selected' : ''}>- Pilih Status -</option>
                    <option value="Segera Kirim Intro" ${row.status === 'Segera Kirim Intro' ? 'selected' : ''}>Segera Kirim Intro 🚀</option>
                    <option value="Terkirim" ${row.status === 'Terkirim' ? 'selected' : ''}>Terkirim 🕒</option>
                    <option value="Tertarik" ${row.status === 'Tertarik' ? 'selected' : ''}>Tertarik 🔥</option>
                    <option value="Menolak" ${row.status === 'Menolak' ? 'selected' : ''}>Menolak ❌</option>
                    <option value="Deal" ${row.status === 'Deal' ? 'selected' : ''}>Deal / Closing 💰</option>
                </select>
            </td>
        `;
        tbody.appendChild(tr);
    }
}

// ==========================================
// SIMPAN / UPDATE 1 BARIS KE SUPABASE
// ==========================================
window.saveRow = async function(rowNum, isSilent = false) {
    const btn = document.getElementById(`btnSave_${rowNum}`);
    const nama = document.getElementById(`nama_${rowNum}`).value.trim();
    const noWa = document.getElementById(`wa_${rowNum}`).value.trim();
    const club = document.getElementById(`club_${rowNum}`).value.trim();
    const intro = document.getElementById(`intro_${rowNum}`).value.trim();
    let status = document.getElementById(`status_${rowNum}`).value;

    if (!nama && !noWa) {
        if (!isSilent) alert("Isi minimal Nama atau Kontak WA/Sosmed terlebih dahulu!");
        return;
    }

    // Jika kosong saat pertama kali disimpan, otomatis set "Segera Kirim Intro"
    if (!status || status === "") {
        status = "Segera Kirim Intro";
    }

    if (btn && !isSilent) {
        btn.innerHTML = `<span class="animate-spin">↻</span>`;
        btn.disabled = true;
    }

    try {
        const { error } = await supabaseClient
            .from('wfh_scraping')
            .upsert({
                admin_id: currentUser.admin_id,
                tanggal: currentDate,
                row_number: rowNum,
                nama: nama,
                no_wa: noWa,
                club_eo: club,
                intro_action: intro,
                status: status
            }, { 
                onConflict: 'admin_id, tanggal, row_number' 
            });

        if (error) throw error;

        // Perbarui array lokal
        rowData[rowNum - 1] = { nama, no_wa: noWa, club_eo: club, intro_action: intro, status };
        
        showToast();
        updateProgress();
        if (!isSilent) renderTable(); // Render ulang jika klik Simpan manual

    } catch (err) {
        if (!isSilent) alert("Gagal menyimpan data: " + err.message);
        if (btn && !isSilent) {
            btn.innerHTML = `💾 Simpan`;
            btn.disabled = false;
        }
    }
};

// ==========================================
// AUTO-SAVE SAAT STATUS DIUBAH ADMIN
// ==========================================
window.triggerSaveStatus = function(rowNum) {
    const row = rowData[rowNum - 1];
    // Pastikan baris ini sudah disave sebelumnya (nama sudah ada)
    // Jika belum disave, biarkan user klik "Simpan" secara manual
    if (row && row.nama) {
        window.saveRow(rowNum, true); // Panggil saveRow secara "Silent" (tanpa loading berisik)
    }
};

// ==========================================
// OTAK "SMART-SHARE": WHATSAPP, IG & TIKTOK
// ==========================================
window.shareRow = function(rowNum) {
    const noWa = document.getElementById(`wa_${rowNum}`).value.trim();
    const intro = document.getElementById(`intro_${rowNum}`).value.trim();

    if (!noWa) return alert("Nomor WA / Username Kosong!");

    let introMsg = encodeURIComponent(intro);

    // Filter Pintar: Jika pakai "@" -> Buka Popup Pilihan Sosmed (IG / TikTok)
    if (noWa.startsWith('@')) {
        currentShareUser = noWa.replace('@', ''); // Simpan state nama akun
        document.getElementById('sosmedTargetName').innerText = "@" + currentShareUser;
        const modal = document.getElementById('sosmedChoiceModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } else {
        // Jika pakai angka -> Otomatis tembak ke WhatsApp
        let waNum = noWa;
        if (waNum.startsWith('0')) {
            waNum = '62' + waNum.substring(1);
        }
        waNum = waNum.replace(/[^0-9]/g, ''); 
        
        if (waNum) {
            window.open(`https://wa.me/${waNum}?text=${introMsg}`, '_blank');
        } else {
            alert("Format kontak tidak valid. Gunakan 08xxx atau @username");
        }
    }
};

// ==========================================
// UNLOCK ROW UNTUK MODE EDIT TEKS (Status sdh always open)
// ==========================================
window.unlockRow = function(rowNum) {
    // Array ini TIDAK menyertakan status karena status selalu open
    const inputs = ['nama', 'wa', 'club', 'intro'];
    
    // Buka Gembok Field Text
    inputs.forEach(id => {
        const el = document.getElementById(`${id}_${rowNum}`);
        el.disabled = false;
        el.classList.remove('bg-slate-800', 'text-slate-400', 'border-slate-700', 'cursor-not-allowed', 'opacity-70');
        el.classList.add('bg-slate-900', 'text-white', 'border-slate-600', 'focus:border-blue-500');
    });

    // Ubah Tombol Share jadi Update
    document.getElementById(`actionWrap_${rowNum}`).innerHTML = `
        <button onclick="window.saveRow(${rowNum})" id="btnSave_${rowNum}" class="bg-amber-600 hover:bg-amber-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition shadow w-full flex items-center justify-center gap-1">
            💾 Update
        </button>
    `;
};

// ==========================================
// UPDATE METRIK TARGET (15 ROW)
// ==========================================
function updateProgress() {
    const filledCount = rowData.filter(r => r !== null && r.nama !== null && r.nama !== "").length;
    
    document.getElementById('uiProgressCount').innerText = filledCount;
    
    const progressPercent = Math.min((filledCount / 20) * 100, 100);
    document.getElementById('uiProgressBar').style.width = `${progressPercent}%`;

    const uiStatus = document.getElementById('uiStatusTarget');
    if (filledCount >= 15) {
        uiStatus.innerText = "✅ TARGET TERPENUHI!";
        uiStatus.className = "text-xs text-emerald-400 font-bold mt-1 tracking-widest uppercase";
        document.getElementById('uiProgressBar').classList.replace('bg-blue-500', 'bg-emerald-500');
    } else {
        uiStatus.innerText = `⏳ KURANG ${15 - filledCount} DATA LAGI`;
        uiStatus.className = "text-xs text-amber-400 font-bold mt-1 tracking-widest uppercase";
        document.getElementById('uiProgressBar').classList.replace('bg-emerald-500', 'bg-blue-500');
    }
}

function showToast() {
    const toast = document.getElementById('toast');
    toast.classList.remove('translate-y-20', 'opacity-0');
    
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 2500);
}
