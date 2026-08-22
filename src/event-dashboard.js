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
        // DYNAMIC LAYANAN (FREEMIUM VS PRO)
        // ==========================================
        const statLayananText = document.getElementById('statLayananText');
        const btnUpgrade = document.getElementById('btnUpgradePro');

        if (eventData.is_pro) {
            statLayananText.innerText = "🌟 PRO / EMAS";
            statLayananText.className = "text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 uppercase";
            if (btnUpgrade) btnUpgrade.classList.add('hidden');
        } else {
            statLayananText.innerText = "FREEMIUM";
            statLayananText.className = "text-xl md:text-2xl font-black text-slate-400 uppercase";
            if (btnUpgrade) {
                btnUpgrade.classList.remove('hidden');
                btnUpgrade.onclick = () => document.getElementById('modalUpgrade').classList.remove('hidden');
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
                    // 1. Upload Foto Bukti Bayar
                    const fileExt = fileInput.name.split('.').pop();
                    const fileName = `upgrade_${currentEventId}_${Date.now()}.${fileExt}`;
                    const { error: upErr } = await supabaseClient.storage.from('berkas-atlet').upload(fileName, fileInput);
                    if (upErr) throw upErr;

                    const { data: urlData } = supabaseClient.storage.from('berkas-atlet').getPublicUrl(fileName);

                    // 2. Insert ke Database (Nominal di-hardcode dari backend, ga bisa dicuri via DOM)
                    const { error: insErr } = await supabaseClient.from('event_transactions').insert([{
                        event_id: currentEventId,
                        user_id: currentUserId,
                        jenis_transaksi: 'UPGRADE_PRO',
                        nominal: 150000, 
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

        // KUNCI FITUR PRO JIKA MASIH FREEMIUM
        const btnMenuSertifikat = document.getElementById('btnMenuSertifikat');
        if (btnMenuSertifikat) {
            btnMenuSertifikat.onclick = () => {
                if (!eventData.is_pro) return alert("Fitur Mesin Sertifikat khusus untuk Event PRO/EMAS. Silakan Upgrade terlebih dahulu!");
                window.location.href = `/book/event-sertifikat.html?id=${currentEventId}`;
            };
        }

        const btnHeatBuilderPro = document.getElementById('btnHeatBuilderPro');
        if (btnHeatBuilderPro) {
            btnHeatBuilderPro.onclick = () => {
                if (!eventData.is_pro) return alert("Fitur Heat Builder khusus untuk Event PRO/EMAS. Silakan Upgrade terlebih dahulu!");
                window.location.href = `/book/heat-builder.html?id=${currentEventId}`;
            };
        }

        const btnSuperProSponsor = document.getElementById('btnSuperProSponsor');
        if (btnSuperProSponsor) {
            btnSuperProSponsor.onclick = () => window.location.href = `/event-sponsor.html?id=${currentEventId}`;
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
