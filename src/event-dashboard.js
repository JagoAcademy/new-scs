import { supabaseClient } from './supabase.js';

let currentEventId = null;

document.addEventListener('DOMContentLoaded', async () => {
    // ==========================================
    // LOGIKA DARK MODE TOGGLE
    // ==========================================
    const btnToggleDark = document.getElementById('btnToggleDark');
    const iconMoon = document.getElementById('iconMoon');
    const iconSun = document.getElementById('iconSun');

    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        iconMoon.classList.add('hidden');
        iconSun.classList.remove('hidden');
    }

    if (btnToggleDark) {
        btnToggleDark.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            if (document.documentElement.classList.contains('dark')) {
                localStorage.setItem('theme', 'dark');
                iconMoon.classList.add('hidden');
                iconSun.classList.remove('hidden');
            } else {
                localStorage.setItem('theme', 'light');
                iconMoon.classList.remove('hidden');
                iconSun.classList.add('hidden');
            }
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    currentEventId = urlParams.get('id');

    if (!currentEventId) {
        alert("ID Event tidak ditemukan! Mengembalikan ke Dashboard Utama.");
        window.location.replace('/dashboard.html');
        return;
    }

    try {
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

        document.getElementById('headerEventName').innerText = eventData.event_name;
        document.getElementById('headerSubdomain').innerText = `${eventData.subdomain}.f1swimming.com`;

        // ==========================================
        // DYNAMIC EVENT STATUS TIER (FREE / FREEMIUM / PRO)
        // ==========================================
        const statLayananText = document.getElementById('statLayananText');
        const btnHeaderUpgrade = document.getElementById('btnHeaderUpgrade');
        
        // Default tier adalah FREEMIUM untuk menampung event-event promo
        const eventTier = eventData.event_tier || 'FREEMIUM';

        if (eventTier === 'PRO') {
            statLayananText.innerText = "🌟 PRO / EMAS";
            statLayananText.className = "text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 uppercase mt-1";
            if (btnHeaderUpgrade) btnHeaderUpgrade.classList.add('hidden');
        } else if (eventTier === 'FREEMIUM') {
            statLayananText.innerText = "FREEMIUM";
            statLayananText.className = "text-xl md:text-2xl font-black text-blue-500 uppercase mt-1";
            if (btnHeaderUpgrade) {
                btnHeaderUpgrade.classList.remove('hidden');
                btnHeaderUpgrade.onclick = () => document.getElementById('modalUpgrade').classList.remove('hidden');
            }
        } else {
            // Level FREE
            statLayananText.innerText = "FREE";
            statLayananText.className = "text-xl md:text-2xl font-black text-slate-400 uppercase mt-1";
            if (btnHeaderUpgrade) {
                btnHeaderUpgrade.classList.remove('hidden');
                btnHeaderUpgrade.onclick = () => document.getElementById('modalUpgrade').classList.remove('hidden');
            }
        }

        // ==========================================
        // EVENT LISTENER BUKTI BAYAR (ANTI HACKER)
        // ==========================================
        const btnSubmitUpgrade = document.getElementById('btnSubmitUpgrade');
        if (btnSubmitUpgrade) {
            btnSubmitUpgrade.onclick = async () => {
                const fileInput = document.getElementById('uploadBuktiBayar').files[0];
                if (!fileInput) return alert("Pilih foto bukti transfer terlebih dahulu bos!");

                btnSubmitUpgrade.innerText = "⏳ Memproses...";
                btnSubmitUpgrade.disabled = true;

                try {
                    const fileExt = fileInput.name.split('.').pop();
                    const fileName = `upgrade_${currentEventId}_${Date.now()}.${fileExt}`;
                    const { error: upErr } = await supabaseClient.storage.from('berkas-atlet').upload(fileName, fileInput);
                    if (upErr) throw upErr;

                    const { data: urlData } = supabaseClient.storage.from('berkas-atlet').getPublicUrl(fileName);

                    // Nominal dikunci 500rb
                    const { error: insErr } = await supabaseClient.from('event_transactions').insert([{
                        event_id: currentEventId,
                        user_id: currentUserId,
                        jenis_transaksi: 'UPGRADE_PRO',
                        nominal: 500000, 
                        bukti_url: urlData.publicUrl,
                        status: 'PENDING'
                    }]);

                    if (insErr) throw insErr;

                    alert("✅ Bukti transfer berhasil dikirim! Menunggu verifikasi Admin Pusat.");
                    document.getElementById('modalUpgrade').classList.add('hidden');
                    
                } catch (err) {
                    alert("Gagal mengirim bukti: " + err.message);
                } finally {
                    btnSubmitUpgrade.innerText = "Konfirmasi Pembayaran";
                    btnSubmitUpgrade.disabled = false;
                }
            };
        }

        // ==========================================
        // SISANYA FUNGSI BIASA
        // ==========================================
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

        // ==========================================
        // KUNCI FITUR BERDASARKAN TIER
        // ==========================================
        const btnMenuSertifikat = document.getElementById('btnMenuSertifikat');
        if (btnMenuSertifikat) {
            btnMenuSertifikat.onclick = () => {
                if (eventTier === 'FREE') {
                    document.getElementById('modalUpgrade').classList.remove('hidden');
                    return;
                }
                window.location.href = `/book/event-sertifikat.html?id=${currentEventId}`;
            };
        }

        const btnHeatBuilderPro = document.getElementById('btnHeatBuilderPro');
        if (btnHeatBuilderPro) {
            btnHeatBuilderPro.onclick = () => {
                if (eventTier === 'FREE') {
                    document.getElementById('modalUpgrade').classList.remove('hidden');
                    return;
                }
                window.location.href = `/book/heat-builder.html?id=${currentEventId}`;
            };
        }

        // Pintu menuju ke Panel Sponsor DIBUKA BEBAS biar mereka bisa "ngiler"
        const btnSuperProSponsor = document.getElementById('btnSuperProSponsor');
        if (btnSuperProSponsor) {
            btnSuperProSponsor.onclick = () => {
                window.location.href = `/event-sponsor.html?id=${currentEventId}`;
            }
        }

        document.querySelectorAll('.btn-close-modal').forEach(btn => btn.onclick = (e) => e.target.closest('.fixed').classList.add('hidden'));

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
});

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

// ==========================================
// FUNGSI TIM PANITIA (COLLABORATORS) DIKEMBALIKAN UTUH!
// ==========================================
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
                <div class="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl p-8 text-center transition-colors">
                    <span class="text-4xl block mb-3 opacity-40">📭</span>
                    <p class="text-sm text-slate-500 dark:text-slate-400 font-bold">Belum ada kolaborator tambahan. Anda mengurus event ini sendirian.</p>
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
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 md:p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:border-purple-300 dark:hover:border-purple-500/50 transition-colors group gap-4">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 rounded-full flex items-center justify-center font-black text-xl shadow-inner shrink-0">
                            ${displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p class="font-extrabold text-slate-800 dark:text-slate-200 text-sm md:text-base">${displayName}</p>
                            <span class="inline-block mt-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">${collab.role}</span>
                        </div>
                    </div>
                    <button onclick="window.removeCollab('${collab.id}')" class="w-full sm:w-auto text-xs font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-700 px-5 py-2.5 rounded-xl transition md:opacity-0 group-hover:opacity-100 border border-transparent hover:border-red-200 dark:hover:border-red-800">
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

const btnInvite = document.getElementById('btnInviteCollab');
if (btnInvite) {
    btnInvite.addEventListener('click', async () => {
        const targetUserId = document.getElementById('selectCollabClub').value;
        const role = document.getElementById('inputCollabRole').value;
        const statusMsg = document.getElementById('collabStatusMsg');

        if (!targetUserId) {
            statusMsg.innerText = "Pilih klub yang mau diundang dulu Bos!";
            statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 block mb-4";
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
            statusMsg.className = "text-sm text-center rounded-lg p-3 bg-green-100 dark:bg-emerald-900/40 text-green-700 dark:text-emerald-400 block mb-4";
            statusMsg.classList.remove('hidden');
            
            document.getElementById('selectCollabClub').value = '';
            loadCollaborators();

        } catch (err) {
            statusMsg.innerText = err.message;
            statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 block mb-4";
            statusMsg.classList.remove('hidden');
        } finally {
            btnInvite.innerText = "Undang Panitia 🚀";
            btnInvite.disabled = false;
            setTimeout(() => statusMsg.classList.add('hidden'), 4000);
        }
    });
}

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
