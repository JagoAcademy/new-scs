import { supabaseClient } from './supabase.js';

let currentEventId = null;

async function loadEventDashboard() {
    const urlParams = new URLSearchParams(window.location.search);
    currentEventId = urlParams.get('id');

    if (!currentEventId) {
        alert("ID Event tidak ditemukan! Mengembalikan ke Dashboard Utama.");
        window.location.replace('/dashboard.html');
        return;
    }

    try {
        // ==========================================
        // SATPAM LAPISAN 1: CEK OTORISASI USER
        // ==========================================
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            alert("Akses ditolak! Silakan login terlebih dahulu.");
            window.location.replace('/auth.html');
            return;
        }
        
        const currentUserId = session.user.id;
        const currentUserEmail = session.user.email;

        const { data: eventData, error } = await supabaseClient
            .from('events')
            .select('*')
            .eq('id', currentEventId)
            .single();

        if (error || !eventData) throw new Error("Gagal memuat dari database.");

        let isAuthorized = false;
        
        if (eventData.owner_id === currentUserId) {
            isAuthorized = true;
        } else if (currentUserEmail === 'radityaraja@gmail.com') {
            isAuthorized = true;
        } else {
            const { data: collabData } = await supabaseClient
                .from('event_collaborators')
                .select('id')
                .eq('event_id', currentEventId)
                .eq('user_id', currentUserId)
                .single();
                
            if (collabData) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            alert("🛑 WOY! Kamu bukan Owner atau Panitia di event ini. Dilarang ngintip!");
            window.location.replace('/dashboard.html');
            return;
        }
        // ==========================================

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

        document.getElementById('btnMenuCetakPDF').onclick = () => {
            window.location.href = `/book/print-startlist.html?id=${currentEventId}`;
        };

        document.getElementById('btnMenuHasilLomba').onclick = () => {
            window.location.href = `/book/event-result.html?id=${currentEventId}`;
        };

        // EVENT LISTENER PRO BUTTONS
        const btnMenuSertifikat = document.getElementById('btnMenuSertifikat');
        if (btnMenuSertifikat) btnMenuSertifikat.onclick = () => window.location.href = `/book/event-sertifikat.html?id=${currentEventId}`;

        const btnHeatBuilderPro = document.getElementById('btnHeatBuilderPro');
        if (btnHeatBuilderPro) btnHeatBuilderPro.onclick = () => window.location.href = `/book/heat-builder.html?id=${currentEventId}`;
        
        // Heat builder dari Pusat Cetak juga dialihkan ke tempat yang sama
        const btnMenuHeatBuilder = document.getElementById('btnMenuHeatBuilder');
        if (btnMenuHeatBuilder) btnMenuHeatBuilder.onclick = () => window.location.href = `/book/heat-builder.html?id=${currentEventId}`;

        const btnSponsorPro = document.getElementById('btnConfigSponsor');
        if(btnSponsorPro) btnSponsorPro.onclick = () => { document.getElementById('modalPitching').classList.remove('hidden'); };

        document.querySelectorAll('.btn-close-modal').forEach(btn => btn.onclick = (e) => e.target.closest('.fixed').classList.add('hidden'));

        // LOGIKA SUBMIT PITCHING SPONSOR
        const btnSubmitPitching = document.getElementById('btnSubmitPitching');
        if(btnSubmitPitching) {
            btnSubmitPitching.addEventListener('click', async () => {
                const hari = document.getElementById('pitchHari').value;
                const peserta = document.getElementById('pitchPeserta').value;
                const t3x3 = document.getElementById('pitch3x3').value || 0;
                const t5x5 = document.getElementById('pitch5x5').value || 0;
                const tCustom = document.getElementById('pitchCustom').value || '';
                const msg = document.getElementById('pitchMsg');

                if(!hari || !peserta) {
                    msg.innerHTML = "Jumlah Hari & Total Peserta wajib diisi!";
                    msg.className = "text-[10px] font-bold text-center rounded-lg p-2 mt-2 bg-red-100 text-red-600 block";
                    msg.classList.remove('hidden');
                    return;
                }

                btnSubmitPitching.innerText = "Mengirim...";
                btnSubmitPitching.disabled = true;

                try {
                    const { error } = await supabaseClient.from('sponsor_approach').insert([{
                        event_id: currentEventId,
                        jumlah_hari: parseInt(hari),
                        total_peserta: parseInt(peserta),
                        tenant_3x3: parseInt(t3x3),
                        tenant_5x5: parseInt(t5x5),
                        custom_tenant: tCustom
                    }]);

                    if(error) throw error;

                    msg.innerHTML = "✅ Proposal berhasil diajukan! Masuk antrian approach SCS.";
                    msg.className = "text-[10px] font-bold text-center rounded-lg p-2 mt-2 bg-green-100 text-green-700 block";
                    msg.classList.remove('hidden');
                    
                    setTimeout(() => {
                        document.getElementById('modalPitching').classList.add('hidden');
                        msg.classList.add('hidden');
                        document.getElementById('pitchHari').value = '';
                        document.getElementById('pitchPeserta').value = '';
                    }, 2500);

                } catch (err) {
                    msg.innerHTML = "Gagal: " + err.message;
                    msg.className = "text-[10px] font-bold text-center rounded-lg p-2 mt-2 bg-red-100 text-red-600 block";
                    msg.classList.remove('hidden');
                } finally {
                    btnSubmitPitching.innerText = "Ajukan Proposal 🚀";
                    btnSubmitPitching.disabled = false;
                }
            });
        }

        const btnExcel = document.getElementById('btnMenuCetakExcel');
        if(btnExcel) {
            btnExcel.onclick = async () => {
                const originalHtml = btnExcel.innerHTML;
                btnExcel.innerHTML = '<div class="text-emerald-700 font-bold text-sm py-2 text-center w-full">Mengekspor Data... ⏳</div>';
                
                try {
                    const { data: regData, error: regError } = await supabaseClient
                        .from('event_registrations')
                        .select('*')
                        .eq('event_id', currentEventId);
                        
                    if (regError) throw regError;
                    
                    if (!regData || regData.length === 0) {
                        alert("Belum ada data pendaftar untuk event ini.");
                        btnExcel.innerHTML = originalHtml;
                        return;
                    }

                    const excelData = regData.map((row, index) => {
                        let daftarLomba = "Tidak ada lomba";
                        if (row.nomor_lomba && Array.isArray(row.nomor_lomba)) {
                            if(typeof row.nomor_lomba[0] === 'object' && row.nomor_lomba[0] !== null) {
                                daftarLomba = row.nomor_lomba.map(n => n.gaya).join(', ');
                            } else {
                                daftarLomba = row.nomor_lomba.join(', ');
                            }
                        }

                        let statusF1 = row.f1_id ? row.f1_id : 'Non-F1 (Guest)';

                        return {
                            'No': index + 1,
                            'F1 ID / Status': statusF1,
                            'Nama Peserta': row.nama_peserta || '-',
                            'Klub Asal': row.klub_asal || '-',
                            'Jenis Kelamin': row.gender || '-',
                            'Tanggal Lahir': row.tanggal_lahir || '-',
                            'Kelompok Umur': row.kelompok_umur || '-',
                            'Daftar Nomor Lomba': daftarLomba,
                            'Total Biaya': row.total_biaya || 0,
                            'Status Pembayaran': row.status_pembayaran || '-'
                        };
                    });

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
        
        await loadEventStats();
        await loadClubsForCollab();
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
    }
}

// 1. Fungsi Narik Daftar Klub untuk Dropdown
async function loadClubsForCollab() {
    const selectClub = document.getElementById('selectCollabClub');
    if (!selectClub) return;

    try {
        const { data, error } = await supabaseClient
            .from('clubs')
            .select('id, club_name, owner_id')
            .not('owner_id', 'is', null)
            .order('club_name', { ascending: true });

        if (error) throw error;

        let options = '<option value="">-- Pilih Klub untuk Diundang --</option>';
        data.forEach(c => {
            options += `<option value="${c.owner_id}">${c.club_name}</option>`;
        });
        selectClub.innerHTML = options;
    } catch (err) {
        selectClub.innerHTML = '<option value="">Gagal memuat klub</option>';
    }
}

// 2. Fungsi Load Kolaborator yang udah nempel di event
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

// 3. Tombol Undang Panitia (Insert Data Baru)
const btnInvite = document.getElementById('btnInviteCollab');
if (btnInvite) {
    btnInvite.addEventListener('click', async () => {
        const targetUserId = document.getElementById('selectCollabClub').value;
        const role = document.getElementById('inputCollabRole').value;
        const statusMsg = document.getElementById('collabStatusMsg');

        if (!targetUserId) {
            statusMsg.innerText = "Pilih klub yang mau diundang dulu Bos!";
            statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-red-100 text-red-600 block mb-4";
            statusMsg.classList.remove('hidden');
            return;
        }

        btnInvite.innerText = "Mengeksekusi...";
        btnInvite.disabled = true;

        try {
            const { error: insertError } = await supabaseClient
                .from('event_collaborators')
                .insert([{
                    event_id: currentEventId,
                    user_id: targetUserId,
                    role: role
                }]);

            if (insertError) {
                if (insertError.code === '23505') throw new Error("Klub ini udah jadi panitia di event ini!");
                throw insertError;
            }

            statusMsg.innerHTML = "✅ <strong>Mantap!</strong> Klub tersebut resmi dapet akses ke Command Center ini.";
            statusMsg.className = "text-sm text-center rounded-lg p-3 bg-green-100 text-green-700 block mb-4";
            statusMsg.classList.remove('hidden');
            
            document.getElementById('selectCollabClub').value = '';
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

// 4. Fungsi Cabut Akses (Delete Data)
window.removeCollab = async function(collabId) {
    if(!confirm("Yakin mau cabut akses klub ini? Mereka nggak akan bisa buka Command Center ini lagi dari akun mereka.")) return;
    try {
        const { error } = await supabaseClient.from('event_collaborators').delete().eq('id', collabId);
        if (error) throw error;
        loadCollaborators();
    } catch (err) {
        alert("Gagal mencabut akses: " + err.message);
    }
}

// INIT
loadEventDashboard();
