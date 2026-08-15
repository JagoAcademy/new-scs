import { supabaseClient } from './supabase.js';

let currentEventId = null;
let eventConfigData = {}; 

async function loadEventDashboard() {
    const urlParams = new URLSearchParams(window.location.search);
    currentEventId = urlParams.get('id');

    if (!currentEventId) {
        alert("ID Event tidak ditemukan! Mengembalikan ke Dashboard Utama.");
        window.location.replace('/dashboard.html');
        return;
    }

    try {
        const { data: eventData, error } = await supabaseClient
            .from('events')
            .select('*')
            .eq('id', currentEventId)
            .single();

        if (error || !eventData) throw new Error("Gagal memuat dari database.");

        eventConfigData = eventData.config || {};

        document.getElementById('headerEventName').innerText = eventData.event_name;
        document.getElementById('headerSubdomain').innerText = `${eventData.subdomain}.f1swimming.com`;

        const publicLink = `https://${eventData.subdomain}.f1swimming.com?id=${currentEventId}`;
        const linkInput = document.getElementById('publicLinkInput');
        if (linkInput) linkInput.value = publicLink;

        const btnCopyLink = document.getElementById('btnCopyLink');
        if (btnCopyLink) {
            btnCopyLink.addEventListener('click', () => {
                linkInput.select();
                document.execCommand('copy'); 
                const originalText = btnCopyLink.innerText;
                btnCopyLink.innerText = "Tersalin!";
                btnCopyLink.classList.replace('bg-blue-600', 'bg-green-500');
                setTimeout(() => {
                    btnCopyLink.innerText = originalText;
                    btnCopyLink.classList.replace('bg-green-500', 'bg-blue-600');
                }, 2000);
            });
        }

        const publicResultLink = `https://${eventData.subdomain}.f1swimming.com/result?id=${currentEventId}`;
        const resultLinkInput = document.getElementById('publicResultLinkInput');
        if (resultLinkInput) resultLinkInput.value = publicResultLink;

        const btnCopyResultLink = document.getElementById('btnCopyResultLink');
        if (btnCopyResultLink) {
            btnCopyResultLink.addEventListener('click', () => {
                resultLinkInput.select();
                document.execCommand('copy'); 
                const originalText = btnCopyResultLink.innerText;
                btnCopyResultLink.innerText = "Tersalin!";
                btnCopyResultLink.classList.replace('bg-red-600', 'bg-green-500');
                setTimeout(() => {
                    btnCopyResultLink.innerText = originalText;
                    btnCopyResultLink.classList.replace('bg-green-500', 'bg-red-600');
                }, 2000);
            });
        }

        document.getElementById('btnSettingsLomba').onclick = () => window.location.href = `/settings-lomba.html?id=${currentEventId}`;
        document.getElementById('btnLiveResult').onclick = () => window.location.href = `/live-result.html?id=${currentEventId}`;
        document.getElementById('btnDataPeserta').onclick = () => window.location.href = `/event-peserta.html?id=${currentEventId}`;

        document.getElementById('btnPusatCetak').onclick = () => {
            document.getElementById('modalPusatCetak').classList.remove('hidden');
        };

        document.getElementById('btnCloseCetak').onclick = () => {
            document.getElementById('modalPusatCetak').classList.add('hidden');
        };

        document.getElementById('btnMenuBukuAcara').onclick = () => {
            let lanes = prompt("Berapa jumlah lintasan kolam yang digunakan?", "8");
            if (lanes) {
                window.location.href = `/book/book.html?id=${currentEventId}&lanes=${lanes}`;
            }
        };

        document.getElementById('btnMenuHeatBuilder').onclick = () => {
            window.location.href = `/book/heat-builder.html?id=${currentEventId}`;
        };

        document.getElementById('btnMenuCetakPDF').onclick = () => {
            window.location.href = `/book/print-startlist.html?id=${currentEventId}`;
        };

        document.getElementById('btnMenuHasilLomba').onclick = () => {
            window.location.href = `/book/event-result.html?id=${currentEventId}`;
        };

        // ==========================================
        // 🟢 SUNTIKAN BARU: LOGIKA EXPORT TO EXCEL
        // ==========================================
        const btnExcel = document.getElementById('btnMenuCetakExcel');
        if(btnExcel) {
            btnExcel.onclick = async () => {
                const originalHtml = btnExcel.innerHTML;
                btnExcel.innerHTML = '<div class="text-emerald-700 font-bold text-sm py-2 text-center w-full">Mengekspor Data... ⏳</div>';
                
                try {
                    const { data, error } = await supabaseClient
                        .from('event_registrations')
                        .select(`
                            id,
                            event_id,
                            athlete_id,
                            event_number,
                            entry_time,
                            status_pembayaran,
                            athletes ( full_name, dob, gender, f1_id )
                        `)
                        .eq('event_id', currentEventId);
                        
                    if (error) throw error;
                    
                    if (!data || data.length === 0) {
                        alert("Belum ada data pendaftar untuk event ini.");
                        btnExcel.innerHTML = originalHtml;
                        return;
                    }

                    // Mapping Data mentah ke format Tabel Excel
                    const excelData = data.map((row, index) => ({
                        'No': index + 1,
                        'F1 ID': row.athletes?.f1_id || '-',
                        'Nama Lengkap Atlet': row.athletes?.full_name || '-',
                        'Jenis Kelamin': row.athletes?.gender || '-',
                        'Tanggal Lahir': row.athletes?.dob || '-',
                        'Nomor Lomba': row.event_number || '-',
                        'Entry Time / Seed': row.entry_time || '00:00:00',
                        'Status Pembayaran': row.status_pembayaran || '-'
                    }));

                    // Konversi ke Excel file
                    const ws = XLSX.utils.json_to_sheet(excelData);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Data_Pendaftar");
                    XLSX.writeFile(wb, `Data_Register_Event_${currentEventId}.xlsx`);
                    
                } catch (err) {
                    console.error(err);
                    alert("Gagal mengekspor data: " + err.message);
                } finally {
                    btnExcel.innerHTML = originalHtml;
                }
            };
        }

        updateConfigBadges();
        
        await loadEventStats();
        
        // Panggil sistem baru: Load Panitia Collab
        await loadCollaborators();

    } catch (err) {
        alert("Gagal memuat data event.");
    }
}

async function loadEventStats() {
    try {
        const { count: countPeserta, error: errPeserta } = await supabaseClient
            .from('event_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', currentEventId)
            .eq('status_pembayaran', 'Lunas');
        
        if (!errPeserta) document.getElementById('statPeserta').innerText = countPeserta || 0;

        const { data: heatsData, error: errHeats } = await supabaseClient
            .from('event_heats')
            .select('event_number')
            .eq('event_id', currentEventId);

        if (!errHeats && heatsData) {
            document.getElementById('statHeat').innerText = heatsData.length;
            const uniqueEvents = new Set(heatsData.map(h => h.event_number));
            document.getElementById('statKategori').innerText = uniqueEvents.size;
        }
    } catch (error) {
        // Error diam-diam untuk UX mulus
    }
}

function updateConfigBadges() {
    let completedCount = 0;
    if (eventConfigData.landing_text) { setCompleteBadge('badgeLanding'); completedCount++; }
    if (eventConfigData.entry_limit) { setCompleteBadge('badgeEntry'); completedCount++; }
    if (eventConfigData.tiket_harga) { setCompleteBadge('badgeTiket'); completedCount++; }
    
    // 🟡 SUNTIKAN BARU: Sponsor dihapus dari hitungan config karena jadi fitur PRO murni
    const percent = (completedCount / 3) * 100;
    document.getElementById('statSetup').innerText = `${percent.toFixed(0)}% Selesai`;
    document.getElementById('barSetup').style.width = `${percent}%`;
}

function setCompleteBadge(elementId) {
    const el = document.getElementById(elementId);
    if(el) {
        el.className = "px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded flex items-center gap-1 border border-emerald-200";
        el.innerHTML = "Selesai";
    }
}

// 🟡 SUNTIKAN BARU: Penyesuaian Trigger Modal Config
// Modal Standar
document.getElementById('btnConfigLanding').onclick = () => { document.getElementById('valLandingText').value = eventConfigData.landing_text || ""; document.getElementById('modalLanding').classList.remove('hidden'); };
document.getElementById('btnConfigEntry').onclick = () => { document.getElementById('valEntryLimit').value = eventConfigData.entry_limit || ""; document.getElementById('modalEntry').classList.remove('hidden'); };
document.getElementById('btnConfigTiket').onclick = () => { document.getElementById('valTiketHarga').value = eventConfigData.tiket_harga || ""; document.getElementById('valTiketWA').value = eventConfigData.tiket_wa || ""; document.getElementById('modalTiket').classList.remove('hidden'); };

// Modal PRO
const btnFina = document.getElementById('btnFinaGenerator');
if(btnFina) btnFina.onclick = () => { document.getElementById('modalFina').classList.remove('hidden'); };
const btnSponsorPro = document.getElementById('btnConfigSponsor');
if(btnSponsorPro) btnSponsorPro.onclick = () => { document.getElementById('modalSponsor').classList.remove('hidden'); };


document.querySelectorAll('.btn-close-modal').forEach(btn => btn.onclick = (e) => e.target.closest('.fixed').classList.add('hidden'));

async function saveConfigToJSONB(key, valueObj, modalId, btnSaveId) {
    const btn = document.getElementById(btnSaveId);
    btn.innerText = "Menyimpan...";
    btn.disabled = true;

    const newConfigData = { ...eventConfigData, ...valueObj };

    try {
        const { error } = await supabaseClient.from('events').update({ config: newConfigData }).eq('id', currentEventId);
        if (error) throw error;
        
        eventConfigData = newConfigData;
        updateConfigBadges();
        document.getElementById(modalId).classList.add('hidden');
    } catch (error) {
        alert("Gagal menyimpan: Cek koneksi Anda.");
    } finally {
        btn.innerText = "Simpan";
        btn.disabled = false;
    }
}

document.getElementById('btnSaveLanding').onclick = () => saveConfigToJSONB('landing', { landing_text: document.getElementById('valLandingText').value }, 'modalLanding', 'btnSaveLanding');
document.getElementById('btnSaveEntry').onclick = () => saveConfigToJSONB('entry', { entry_limit: document.getElementById('valEntryLimit').value }, 'modalEntry', 'btnSaveEntry');
document.getElementById('btnSaveTiket').onclick = () => saveConfigToJSONB('tiket', { tiket_harga: document.getElementById('valTiketHarga').value, tiket_wa: document.getElementById('valTiketWA').value }, 'modalTiket', 'btnSaveTiket');


// ==========================================
// FITUR TIM PANITIA (COLLAB)
// ==========================================
async function loadCollaborators() {
    const container = document.getElementById('collabListContainer');
    if (!container) return;

    try {
        const { data, error } = await supabaseClient
            .from('event_collaborators')
            .select('id, role, user_id')
            .eq('event_id', currentEventId);

        if (error) throw error;

        if (data.length === 0) {
            container.innerHTML = `
                <div class="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center">
                    <span class="text-4xl block mb-3 opacity-40">📭</span>
                    <p class="text-sm text-slate-500 font-bold">Belum ada kolaborator tambahan. Anda mengurus event ini sendirian.</p>
                </div>
            `;
            return;
        }

        let html = '';
        for (const collab of data) {
            // Coba ambil nama klubnya dari tabel clubs
            const { data: clubData } = await supabaseClient
                .from('clubs')
                .select('club_name')
                .eq('owner_id', collab.user_id)
                .single();
            
            const displayName = clubData ? clubData.club_name : 'User Terdaftar SCS';

            html += `
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 md:p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-purple-300 transition group gap-4">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-black text-xl shadow-inner shrink-0">
                            ${displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p class="font-extrabold text-slate-800 text-sm md:text-base">${displayName}</p>
                            <span class="inline-block mt-1 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">${collab.role}</span>
                        </div>
                    </div>
                    <button onclick="window.removeCollab('${collab.id}')" class="w-full sm:w-auto text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 px-5 py-2.5 rounded-xl transition md:opacity-0 group-hover:opacity-100 border border-transparent hover:border-red-200">
                        Cabut Akses ❌
                    </button>
                </div>
            `;
        }
        container.innerHTML = html;

    } catch (err) {
        container.innerHTML = `<p class="text-sm text-red-500 font-bold text-center py-4">Gagal memuat daftar panitia: ${err.message}</p>`;
    }
}

// Tombol Undang Panitia
const btnInvite = document.getElementById('btnInviteCollab');
if (btnInvite) {
    btnInvite.addEventListener('click', async () => {
        const email = document.getElementById('inputCollabEmail').value.trim();
        const role = document.getElementById('inputCollabRole').value;
        const statusMsg = document.getElementById('collabStatusMsg');

        if (!email) {
            statusMsg.innerText = "Masukkan alamat email teman lu Bos!";
            statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-red-100 text-red-600 block mb-4";
            statusMsg.classList.remove('hidden');
            return;
        }

        btnInvite.innerText = "Mencari Akun...";
        btnInvite.disabled = true;

        try {
            // 1. Panggil fungsi RPC rahasia untuk cari User_ID dari Email
            const { data: targetUserId, error: rpcError } = await supabaseClient.rpc('get_user_id_by_email', { user_email: email });
            
            if (rpcError) throw rpcError;
            
            if (!targetUserId) {
                throw new Error("Gagal! Email ini belum terdaftar di sistem SCS.");
            }

            // 2. Suntik ke tabel event_collaborators
            const { error: insertError } = await supabaseClient
                .from('event_collaborators')
                .insert([{
                    event_id: currentEventId,
                    user_id: targetUserId,
                    role: role
                }]);

            if (insertError) {
                if (insertError.code === '23505') throw new Error("Orang ini udah jadi panitia di event ini!");
                throw insertError;
            }

            statusMsg.innerHTML = "✅ <strong>Mantap!</strong> Teman lu resmi dapet akses ke Command Center ini.";
            statusMsg.className = "text-sm text-center rounded-lg p-3 bg-green-100 text-green-700 block mb-4";
            statusMsg.classList.remove('hidden');
            
            document.getElementById('inputCollabEmail').value = '';
            
            loadCollaborators();

        } catch (err) {
            statusMsg.innerText = err.message;
            statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-red-100 text-red-600 block mb-4";
            statusMsg.classList.remove('hidden');
        } finally {
            btnInvite.innerText = "Undang Panitia 🚀";
            btnInvite.disabled = false;
            setTimeout(() => statusMsg.classList.add('hidden'), 4000);
        }
    });
}

// Fungsi Hapus Global
window.removeCollab = async function(collabId) {
    if(!confirm("Yakin mau cabut akses orang ini? Mereka nggak akan bisa buka Command Center ini lagi dari akun mereka.")) return;
    try {
        const { error } = await supabaseClient.from('event_collaborators').delete().eq('id', collabId);
        if (error) throw error;
        loadCollaborators();
    } catch (err) {
        alert("Gagal menghapus: " + err.message);
    }
}

// INIT
loadEventDashboard();
const btnMenuSertifikat = document.getElementById('btnMenuSertifikat');
if (btnMenuSertifikat) {
    btnMenuSertifikat.onclick = () => window.location.href = `/book/event-sertifikat.html?id=${currentEventId}`;
}
