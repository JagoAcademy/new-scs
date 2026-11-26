import { supabaseClient } from './supabase.js';

let currentEventId = null;
let currentPayMethod = 'transfer';
let eventTitle = '';
let currentEventData = null; 

// ==========================================
// FUNGSI NATIVE SHARE (WEB SHARE API)
// ==========================================
window.bagikanNative = async function(title, text, url) {
    if (navigator.share) {
        try {
            await navigator.share({
                title: title,
                text: text,
                url: url
            });
            console.log('Berhasil membuka menu share bawaan HP');
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error sharing:', err);
            }
        }
    } else {
        navigator.clipboard.writeText(url);
        alert('Link disalin ke clipboard! (Browser ini tidak mendukung menu share bawaan)');
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    
    // ==========================================
    // LOGIKA TOGGLE VIEW DESKTOP/MOBILE
    // ==========================================
    const btnToggleView = document.getElementById('btnToggleView');
    const viewportMeta = document.getElementById('viewportMeta');
    
    const iconDesktop = document.getElementById('iconDesktop');
    const iconMobile = document.getElementById('iconMobile');

    let isDesktopMode = localStorage.getItem('scs_desktop_mode') === 'true';

    function applyViewportMode() {
        if (isDesktopMode) {
            viewportMeta.setAttribute('content', 'width=1280');
            if(iconDesktop) iconDesktop.classList.add('hidden');
            if(iconMobile) iconMobile.classList.remove('hidden');
        } else {
            viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0');
            if(iconDesktop) iconDesktop.classList.remove('hidden');
            if(iconMobile) iconMobile.classList.add('hidden');
        }
    }

    applyViewportMode();

    function toggleViewMode() {
        isDesktopMode = !isDesktopMode;
        localStorage.setItem('scs_desktop_mode', isDesktopMode);
        applyViewportMode();
    }

    if (btnToggleView) btnToggleView.addEventListener('click', toggleViewMode);


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

        currentEventData = eventData;
        eventTitle = eventData.event_name;
        document.getElementById('headerEventName').innerText = eventData.event_name;
        document.getElementById('headerSubdomain').innerText = `${eventData.subdomain}.f1swimming.com`;

        // ==========================================
        // DYNAMIC EVENT STATUS TIER (UX KELAS KAKAP)
        // ==========================================
        const statLayananText = document.getElementById('statLayananText');
        const btnNavUpgrade = document.getElementById('btnNavUpgrade');
        
        const eventTier = eventData.event_tier || 'FREEMIUM';

        if (eventTier === 'PRO') {
            statLayananText.innerText = "🌟 PRO / EMAS";
            statLayananText.className = "text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 uppercase mt-1";
            if (btnNavUpgrade) btnNavUpgrade.classList.add('hidden');
        } else if (eventTier === 'FREEMIUM') {
            statLayananText.innerText = "FREEMIUM";
            statLayananText.className = "text-xl md:text-2xl font-black text-blue-500 uppercase mt-1";
            if (btnNavUpgrade) {
                btnNavUpgrade.classList.remove('hidden');
                btnNavUpgrade.onclick = () => document.getElementById('modalUpgrade').classList.remove('hidden');
            }
        } else {
            statLayananText.innerText = "FREE";
            statLayananText.className = "text-xl md:text-2xl font-black text-slate-400 uppercase mt-1";
            if (btnNavUpgrade) {
                btnNavUpgrade.classList.remove('hidden');
                btnNavUpgrade.onclick = () => document.getElementById('modalUpgrade').classList.remove('hidden');
            }
        }

        // ==========================================
        // LOGIC MODAL CHECKOUT ENTERPRISE
        // ==========================================
        const payTabs = document.querySelectorAll('.pay-tab');
        const paySections = document.querySelectorAll('.pay-section');
        const btnSubmitUpgrade = document.getElementById('btnSubmitUpgrade');
        const uploadBuktiSection = document.getElementById('uploadBuktiSection');

        payTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                payTabs.forEach(t => { 
                    t.classList.remove('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-slate-800', 'dark:text-white'); 
                    t.classList.add('text-slate-500', 'dark:text-slate-400'); 
                });
                
                tab.classList.add('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-slate-800', 'dark:text-white');
                tab.classList.remove('text-slate-500', 'dark:text-slate-400');

                paySections.forEach(s => s.classList.add('hidden'));
                
                const target = tab.getAttribute('data-target');
                document.getElementById(`pay${target.charAt(0).toUpperCase() + target.slice(1)}`).classList.remove('hidden');

                currentPayMethod = target;

                if(target === 'transfer' || target === 'qris') {
                    btnSubmitUpgrade.innerText = 'Konfirmasi Pembayaran';
                    uploadBuktiSection.classList.remove('hidden');
                    uploadBuktiSection.classList.add('block');
                }
                if(target === 'voucher') {
                    btnSubmitUpgrade.innerText = 'Klaim & Aktifkan Pro';
                    uploadBuktiSection.classList.remove('block');
                    uploadBuktiSection.classList.add('hidden');
                }
            });
        });

        // HANDLE SUBMIT BUTTON MULTI-PURPOSE
        if (btnSubmitUpgrade) {
            btnSubmitUpgrade.onclick = async () => {
                
                if (currentPayMethod === 'transfer' || currentPayMethod === 'qris') {
                    const fileInput = document.getElementById('uploadBuktiBayar').files[0];
                    if (!fileInput) return alert("Pilih foto bukti transfer terlebih dahulu bos!");
                    if (fileInput.size > 2 * 1024 * 1024) return alert("Ups! Ukuran file maksimal 2MB ya.");

                    btnSubmitUpgrade.innerText = "⏳ Mengirim Data...";
                    btnSubmitUpgrade.disabled = true;

                    try {
                        const fileExt = fileInput.name.split('.').pop();
                        const fileName = `upgrade_${currentEventId}_${Date.now()}.${fileExt}`;
                        
                        const { error: upErr } = await supabaseClient.storage.from('bukti-transaksi').upload(fileName, fileInput);
                        if (upErr) throw upErr;

                        const { data: urlData } = supabaseClient.storage.from('bukti-transaksi').getPublicUrl(fileName);

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
                }

                if (currentPayMethod === 'voucher') {
                    const vCode = document.getElementById('inputVoucherCode').value.trim().toUpperCase();
                    if (!vCode) return alert("Masukkan kode voucher terlebih dahulu!");

                    btnSubmitUpgrade.innerText = "⏳ Memvalidasi Kode...";
                    btnSubmitUpgrade.disabled = true;

                    setTimeout(async () => {
                        if(vCode === 'PROGRATIS') {
                            try {
                                await supabaseClient.from('events').update({event_tier: 'PRO', is_pro: true}).eq('id', currentEventId);
                                alert("🎉 VOUCHER VALID! Event Anda berhasil di-upgrade ke PRO.");
                                window.location.reload();
                            } catch(e) {
                                alert("Error update database: " + e.message);
                                btnSubmitUpgrade.innerText = "Klaim & Aktifkan Pro";
                                btnSubmitUpgrade.disabled = false;
                            }
                        } else {
                            alert("Kode voucher tidak valid atau sudah expired!");
                            btnSubmitUpgrade.innerText = "Klaim & Aktifkan Pro";
                            btnSubmitUpgrade.disabled = false;
                        }
                    }, 1000);
                }
            };
        }

        // ==========================================
        // SISANYA FUNGSI BIASA (LINK, COPY, OPEN, DKK)
        // ==========================================
        
        const publicLink = `https://${eventData.subdomain}.f1swimming.com?id=${currentEventId}`;
        const linkInput = document.getElementById('publicLinkInput');
        if (linkInput) linkInput.value = publicLink;

        const publicResultLink = `https://${eventData.subdomain}.f1swimming.com/result?id=${currentEventId}`;
        const resultLinkInput = document.getElementById('publicResultLinkInput');
        if (resultLinkInput) resultLinkInput.value = publicResultLink;

        // FUNGSI COPY
        document.getElementById('btnCopyLink').addEventListener('click', () => {
            linkInput.select();
            document.execCommand('copy'); 
            const btn = document.getElementById('btnCopyLink');
            const originalText = btn.innerText;
            btn.innerText = "Tersalin!";
            btn.classList.replace('bg-blue-600', 'bg-green-500');
            setTimeout(() => { btn.innerText = originalText; btn.classList.replace('bg-green-500', 'bg-blue-600'); }, 2000);
        });

        document.getElementById('btnCopyResultLink').addEventListener('click', () => {
            resultLinkInput.select();
            document.execCommand('copy'); 
            const btn = document.getElementById('btnCopyResultLink');
            const originalText = btn.innerText;
            btn.innerText = "Tersalin!";
            btn.classList.replace('bg-red-600', 'bg-green-500');
            setTimeout(() => { btn.innerText = originalText; btn.classList.replace('bg-green-500', 'bg-red-600'); }, 2000);
        });

        // FUNGSI OPEN LINK LANGSUNG DI TAB BARU
        const btnOpenLink = document.getElementById('btnOpenLink');
        if (btnOpenLink) {
            btnOpenLink.addEventListener('click', () => {
                window.open(publicLink, '_blank');
            });
        }
        
        const btnOpenResultLink = document.getElementById('btnOpenResultLink');
        if (btnOpenResultLink) {
            btnOpenResultLink.addEventListener('click', () => {
                window.open(publicResultLink, '_blank');
            });
        }

        // FUNGSI SHARE NATIVE SOCIAL MEDIA BARU
        const textReg = `Yuk daftar lomba renang ${eventTitle} sekarang! Klik link berikut:`;
        document.getElementById('btnShareNative_Reg').onclick = () => window.bagikanNative('Pendaftaran Lomba SCS', textReg, publicLink);

        const textRes = `Pantau hasil pertandingan dan perolehan medali ${eventTitle} secara LIVE di sini:`;
        document.getElementById('btnShareNative_Res').onclick = () => window.bagikanNative('Live Result SCS', textRes, publicResultLink);

        // FUNGSI DOWNLOAD QR CODE BER-BINGKAI (SULAP CANVAS!)
        async function generateFramedQR(url, filename, titleText, topText) {
            document.getElementById('modalPreviewQR').classList.remove('hidden');
            document.getElementById('qrLoading').classList.remove('hidden');
            document.getElementById('qrPreviewImage').classList.add('hidden');
            document.getElementById('btnDownloadFinalQR').classList.add('hidden');

            const canvas = document.createElement('canvas');
            canvas.width = 500;
            canvas.height = 650;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 500, 650);

            ctx.strokeStyle = '#1e3a8a'; 
            ctx.lineWidth = 12;
            ctx.strokeRect(15, 15, 470, 620);
            
            ctx.strokeStyle = '#f59e0b'; 
            ctx.lineWidth = 3;
            ctx.strokeRect(33, 33, 434, 584);

            ctx.fillStyle = '#1e3a8a';
            ctx.font = '900 24px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(topText.toUpperCase(), 250, 80);

            ctx.fillStyle = '#334155';
            ctx.font = 'bold 22px Arial, sans-serif';
            ctx.fillText(titleText, 250, 560);

            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 14px Arial, sans-serif';
            ctx.fillText('Powered by f1swimming.com', 250, 590);

            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                ctx.drawImage(img, 50, 110, 400, 400); 
                const finalImageUrl = canvas.toDataURL('image/png');
                
                document.getElementById('qrLoading').classList.add('hidden');
                document.getElementById('qrPreviewImage').src = finalImageUrl;
                document.getElementById('qrPreviewImage').classList.remove('hidden');
                
                const btnDl = document.getElementById('btnDownloadFinalQR');
                btnDl.href = finalImageUrl;
                btnDl.download = filename;
                btnDl.classList.remove('hidden');
            };
            img.onerror = () => {
                alert("Gagal memuat QR Code. Pastikan koneksi internet stabil.");
                document.getElementById('modalPreviewQR').classList.add('hidden');
            };
            img.src = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}&margin=0`;
        }

        document.getElementById('btnPreviewQR_Reg').addEventListener('click', () => {
            generateFramedQR(publicLink, `QR_Daftar_${eventTitle.replace(/\s+/g, '_')}.png`, eventTitle, "Scan Untuk Mendaftar");
        });

        document.getElementById('btnPreviewQR_Res').addEventListener('click', () => {
            generateFramedQR(publicResultLink, `QR_LiveResult_${eventTitle.replace(/\s+/g, '_')}.png`, eventTitle, "Scan Untuk Live Result");
        });

        // LINK TIKET HTM PENONTON
        const publicTicketLink = `https://${eventData.subdomain}.f1swimming.com/tiket?id=${currentEventId}`;
        const ticketLinkInput = document.getElementById('publicTicketLinkInput');
        if (ticketLinkInput) ticketLinkInput.value = publicTicketLink;

        const btnCopyTicket = document.getElementById('btnCopyTicketLink');
        if (btnCopyTicket && ticketLinkInput) {
            btnCopyTicket.addEventListener('click', () => {
                ticketLinkInput.select();
                document.execCommand('copy');
                const orig = btnCopyTicket.innerText;
                btnCopyTicket.innerText = "Tersalin!";
                btnCopyTicket.classList.replace('bg-amber-600', 'bg-green-500');
                setTimeout(() => {
                    btnCopyTicket.innerText = orig;
                    btnCopyTicket.classList.replace('bg-green-500', 'bg-amber-600');
                }, 2000);
            });
        }

        const btnOpenTicket = document.getElementById('btnOpenTicketLink');
        if (btnOpenTicket) {
            btnOpenTicket.addEventListener('click', () => window.open(publicTicketLink, '_blank'));
        }

        const btnShareTix = document.getElementById('btnShareNative_Tix');
        if (btnShareTix) {
            const textTix = `Beli tiket masuk (HTM) penonton ${eventTitle} secara online di sini:`;
            btnShareTix.onclick = () => window.bagikanNative('Tiket HTM Penonton SCS', textTix, publicTicketLink);
        }

        const btnQrTix = document.getElementById('btnPreviewQR_Tix');
        if (btnQrTix) {
            btnQrTix.addEventListener('click', () => {
                generateFramedQR(publicTicketLink, `QR_TiketHTM_${eventTitle.replace(/\s+/g, '_')}.png`, eventTitle, "Scan Beli Tiket HTM");
            });
        }

        const btnKelolaTiketHtm = document.getElementById('btnKelolaTiketHtm');
        if (btnKelolaTiketHtm) {
            btnKelolaTiketHtm.addEventListener('click', () => openModalKelolaTiket());
        }

        const btnCetakRekapModal = document.getElementById('btnCetakRekapTiketKlub');
        if (btnCetakRekapModal) {
            btnCetakRekapModal.addEventListener('click', () => window.cetakRekapTiketPerKlub());
        }

        const btnMenuCetakRekapTiket = document.getElementById('btnMenuCetakRekapTiket');
        if (btnMenuCetakRekapTiket) {
            btnMenuCetakRekapTiket.addEventListener('click', () => window.cetakRekapTiketPerKlub());
        }

        const btnAddTicketType = document.getElementById('btnAddTicketType');
        if (btnAddTicketType) {
            btnAddTicketType.addEventListener('click', () => {
                appendTicketTypeRow({ nama: 'Tiket Gelang', harga: 0 });
            });
        }

        const btnSimpanSettingHtm = document.getElementById('btnSimpanSettingHtm');
        if (btnSimpanSettingHtm) {
            btnSimpanSettingHtm.addEventListener('click', async () => {
                const rows = document.querySelectorAll('#ticketTypesEditorList .ticket-type-row');
                const parsedTypes = [];
                rows.forEach((row, idx) => {
                    const nama = row.querySelector('.input-type-name')?.value.trim() || 'Tiket Gelang';
                    const harga = Math.max(0, Number(row.querySelector('.input-type-price')?.value || 0));
                    parsedTypes.push({
                        id: `type_${idx + 1}_${Date.now().toString().slice(-3)}`,
                        nama,
                        harga
                    });
                });

                if (parsedTypes.length === 0) {
                    parsedTypes.push({ id: 'gelang_default', nama: 'Tiket Gelang', harga: 0 });
                }

                const aktif = document.getElementById('selectSettingAktifHtm').value === 'true';
                const rek = document.getElementById('inputSettingRekHtm').value.trim();

                btnSimpanSettingHtm.innerText = "Menyimpan...";
                btnSimpanSettingHtm.disabled = true;
                try {
                    const updatedConfig = {
                        ...(currentEventData?.config || {}),
                        ticket_types: parsedTypes,
                        harga_tiket_htm: parsedTypes[0].harga,
                        aktif_tiket_htm: aktif,
                        rekening_tiket_htm: rek
                    };
                    const { error: upErr } = await supabaseClient
                        .from('events')
                        .update({ config: updatedConfig })
                        .eq('id', currentEventId);
                    if (upErr) throw upErr;

                    currentEventData.config = updatedConfig;
                    alert("✅ Pengaturan Tipe & Harga Tiket berhasil disimpan!");
                } catch (err) {
                    alert("Gagal menyimpan pengaturan tiket: " + err.message);
                } finally {
                    btnSimpanSettingHtm.innerText = "💾 Simpan Pengaturan Tiket";
                    btnSimpanSettingHtm.disabled = false;
                }
            });
        }

        // TAUTAN HALAMAN
        document.getElementById('btnSettingsLomba').onclick = () => window.location.href = `/settings-lomba.html?id=${currentEventId}`;
        const btnEventCashflow = document.getElementById('btnEventCashflow');
        if (btnEventCashflow) {
            btnEventCashflow.onclick = () => window.location.href = `/event-cashflow.html?id=${currentEventId}`;
        }
        document.getElementById('btnLiveResult').onclick = () => window.location.href = `/live-result.html?id=${currentEventId}`;
        const btnKlasemenMedali = document.getElementById('btnKlasemenMedali');
        if (btnKlasemenMedali) {
            btnKlasemenMedali.onclick = () => window.location.href = `/event-medal.html?id=${currentEventId}`;
        }
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

        const btnSuperProSponsor = document.getElementById('btnSuperProSponsor');
        if (btnSuperProSponsor) {
            btnSuperProSponsor.onclick = () => {
                window.location.href = `/event-sponsor.html?id=${currentEventId}`;
            }
        }

        document.querySelectorAll('.btn-close-modal').forEach(btn => {
            btn.onclick = (e) => {
                e.target.closest('.fixed').classList.add('hidden');
            }
        });

        const btnExcel = document.getElementById('btnMenuCetakExcel');
        if (btnExcel) {
            btnExcel.onclick = async () => {
                const originalHtml = btnExcel.innerHTML;
                btnExcel.innerHTML = '<div class="text-emerald-700 font-bold text-sm py-2 text-center w-full">Mengekspor Data Terpadu... ⏳</div>';

                try {
                    const [regRes, tixRes] = await Promise.all([
                        supabaseClient
                            .from('event_registrations')
                            .select('*')
                            .eq('event_id', currentEventId)
                            .order('klub_asal', { ascending: true })
                            .order('nama_peserta', { ascending: true }),
                        supabaseClient
                            .from('event_tickets')
                            .select('*')
                            .eq('event_id', currentEventId)
                            .order('created_at', { ascending: true })
                    ]);

                    if (regRes.error) throw regRes.error;
                    const regData = regRes.data || [];
                    const tixData = (!tixRes.error && Array.isArray(tixRes.data)) ? tixRes.data : [];

                    if (regData.length === 0 && tixData.length === 0) {
                        alert("Belum ada data pendaftar maupun tiket untuk event ini.");
                        btnExcel.innerHTML = originalHtml;
                        return;
                    }

                    // Hitung tiket per registration_id & per klub_asal
                    const tixByRegId = new Map();
                    const clubRecapMap = new Map();

                    const getClubBucket = (rawClubName) => {
                        const label = (rawClubName || 'Individu').trim() || 'Individu';
                        const key = label.toUpperCase();
                        if (!clubRecapMap.has(key)) {
                            clubRecapMap.set(key, {
                                klub: label,
                                jumlahPeserta: 0,
                                totalNomorLomba: 0,
                                tiketLunas: 0,
                                tiketPending: 0,
                                biayaLomba: 0,
                                biayaTiketLunas: 0
                            });
                        }
                        return clubRecapMap.get(key);
                    };

                    regData.forEach(row => {
                        const isLunas = String(row.status_pembayaran || '').toLowerCase() === 'lunas';
                        if (!isLunas) return;

                        const bucket = getClubBucket(row.klub_asal);
                        bucket.jumlahPeserta += 1;
                        const countNomor = Array.isArray(row.nomor_lomba) ? row.nomor_lomba.length : 0;
                        bucket.totalNomorLomba += countNomor;
                        bucket.biayaLomba += Number(row.total_biaya || 0);
                    });

                    tixData.forEach(t => {
                        const statusLow = String(t.status_pembayaran || '').toLowerCase();
                        const qty = Number(t.jumlah_tiket || 0);
                        const nom = Number(t.total_harga || 0);

                        if (t.registration_id) {
                            const rid = String(t.registration_id);
                            const prev = tixByRegId.get(rid) || { lunas: 0, pending: 0 };
                            if (statusLow === 'lunas') prev.lunas += qty;
                            else if (statusLow === 'pending') prev.pending += qty;
                            tixByRegId.set(rid, prev);
                        }

                        const bucket = getClubBucket(t.klub_asal);
                        if (statusLow === 'lunas') {
                            bucket.tiketLunas += qty;
                            bucket.biayaTiketLunas += nom;
                        } else if (statusLow === 'pending') {
                            bucket.tiketPending += qty;
                        }
                    });

                    // SHEET 1: REKAP PER KLUB / SEKOLAH (PESERTA + TIKET HTM)
                    const sortedClubs = Array.from(clubRecapMap.values()).sort((a, b) =>
                        a.klub.localeCompare(b.klub, 'id')
                    );

                    let sumPeserta = 0;
                    let sumNomor = 0;
                    let sumTixLunas = 0;
                    let sumTixPending = 0;
                    let sumBiayaLomba = 0;
                    let sumBiayaTiket = 0;

                    const sheet1Data = sortedClubs.map((c, idx) => {
                        sumPeserta += c.jumlahPeserta;
                        sumNomor += c.totalNomorLomba;
                        sumTixLunas += c.tiketLunas;
                        sumTixPending += c.tiketPending;
                        sumBiayaLomba += c.biayaLomba;
                        sumBiayaTiket += c.biayaTiketLunas;

                        return {
                            'No': idx + 1,
                            'Klub / Sekolah Asal': c.klub,
                            'Jumlah Peserta': c.jumlahPeserta,
                            'Total Nomor Lomba': c.totalNomorLomba,
                            'Total Tiket HTM (Lunas)': c.tiketLunas,
                            'Tiket HTM (Pending)': c.tiketPending,
                            'Tagihan Lomba (Rp)': c.biayaLomba,
                            'Tagihan Tiket HTM (Rp)': c.biayaTiketLunas,
                            'Total Keseluruhan (Rp)': c.biayaLomba + c.biayaTiketLunas
                        };
                    });

                    sheet1Data.push({
                        'No': '',
                        'Klub / Sekolah Asal': 'TOTAL KESELURUHAN',
                        'Jumlah Peserta': sumPeserta,
                        'Total Nomor Lomba': sumNomor,
                        'Total Tiket HTM (Lunas)': sumTixLunas,
                        'Tiket HTM (Pending)': sumTixPending,
                        'Tagihan Lomba (Rp)': sumBiayaLomba,
                        'Tagihan Tiket HTM (Rp)': sumBiayaTiket,
                        'Total Keseluruhan (Rp)': sumBiayaLomba + sumBiayaTiket
                    });

                    // SHEET 2: DATA PENDAFTAR + TIKET PER ATLET
                    const sheet2Data = regData.map((row, index) => {
                        let daftarLomba = "Tidak ada lomba";
                        if (row.nomor_lomba && Array.isArray(row.nomor_lomba)) {
                            if (typeof row.nomor_lomba[0] === 'object' && row.nomor_lomba[0] !== null) {
                                daftarLomba = row.nomor_lomba.map(n => n.gaya).join(', ');
                            } else {
                                daftarLomba = row.nomor_lomba.join(', ');
                            }
                        }

                        const statusF1 = row.f1_id ? row.f1_id : 'Non-F1 (Guest)';
                        const tixInfo = tixByRegId.get(String(row.id)) || { lunas: 0, pending: 0 };

                        return {
                            'No': index + 1,
                            'F1 ID / Status': statusF1,
                            'Nama Peserta': row.nama_peserta || '-',
                            'Klub Asal': row.klub_asal || '-',
                            'Jenis Kelamin': row.gender || '-',
                            'Tanggal Lahir': row.tanggal_lahir || '-',
                            'Kelompok Umur': row.kelompok_umur || '-',
                            'Daftar Nomor Lomba': daftarLomba,
                            'Total Biaya Lomba': row.total_biaya || 0,
                            'Status Lomba': row.status_pembayaran || '-',
                            'Tiket HTM Atlet (Lunas)': tixInfo.lunas,
                            'Tiket HTM Atlet (Pending)': tixInfo.pending
                        };
                    });

                    // SHEET 3: DETAIL TRANSAKSI TIKET HTM
                    const sheet3Data = tixData.map((t, index) => ({
                        'No': index + 1,
                        'Kode Referensi': t.kode_tiket || '-',
                        'Tipe Tiket': t.tipe_tiket || 'Tiket Gelang',
                        'Waktu Pesan': t.created_at ? new Date(t.created_at).toLocaleString('id-ID') : '-',
                        'Klub / Sekolah Asal': t.klub_asal || '-',
                        'Atlet Terkait': t.nama_atlet || 'Kolektif Klub',
                        'Nama Pemesan': t.nama_pembeli || '-',
                        'No WhatsApp': t.no_wa || '-',
                        'Qty Tiket': Number(t.jumlah_tiket || 0),
                        'Harga Satuan (Rp)': Number(t.harga_satuan || 0),
                        'Total Bayar (Rp)': Number(t.total_harga || 0),
                        'Status Pembayaran': t.status_pembayaran || '-',
                        'Bukti Transfer': t.bukti_url || '-'
                    }));

                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet1Data), "Rekap_Klub_&_Tiket");
                    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet2Data), "Data_Pendaftar");
                    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet3Data), "Detail_Transaksi_Tiket");

                    XLSX.writeFile(wb, `Rekap_Peserta_dan_Tiket_Event_${currentEventId}.xlsx`);
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


// ==========================================
// MANAJEMEN & VERIFIKASI TIKET GELANG (HTM)
// ==========================================
function appendTicketTypeRow(item = { nama: 'Tiket Gelang', harga: 0 }) {
    const list = document.getElementById('ticketTypesEditorList');
    if (!list) return;

    const div = document.createElement('div');
    div.className = 'ticket-type-row grid grid-cols-12 gap-2 items-center';
    div.innerHTML = `
        <div class="col-span-6">
            <input type="text" value="${String(item.nama || 'Tiket Gelang').replace(/"/g, '&quot;')}" placeholder="Nama tipe (misal: Tiket Gelang)" class="input-type-name w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold outline-none">
        </div>
        <div class="col-span-4">
            <input type="number" value="${Number(item.harga || 0)}" placeholder="Harga (Rp)" class="input-type-price w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-black outline-none">
        </div>
        <div class="col-span-2 flex justify-end">
            <button type="button" class="btn-del-type px-2.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold">🗑️</button>
        </div>
    `;

    div.querySelector('.btn-del-type').addEventListener('click', () => {
        if (list.querySelectorAll('.ticket-type-row').length <= 1) {
            return alert("Minimal harus ada 1 tipe tiket.");
        }
        div.remove();
    });

    list.appendChild(div);
}

async function openModalKelolaTiket() {
    const modal = document.getElementById('modalKelolaTiket');
    if (!modal) return;
    modal.classList.remove('hidden');

    const cfg = currentEventData?.config || {};
    const list = document.getElementById('ticketTypesEditorList');
    if (list) {
        list.innerHTML = '';
        const types = Array.isArray(cfg.ticket_types) && cfg.ticket_types.length > 0
            ? cfg.ticket_types
            : [{ nama: 'Tiket Gelang', harga: Number(cfg.harga_tiket_htm || 0) }];
        types.forEach(t => appendTicketTypeRow(t));
    }

    document.getElementById('selectSettingAktifHtm').value = cfg.aktif_tiket_htm === false ? 'false' : 'true';
    document.getElementById('inputSettingRekHtm').value = cfg.rekening_tiket_htm || '';

    await loadTransaksiTiketHtm();
}

let cachedClubTicketRecap = [];

async function buildClubTicketRecapData() {
    const [regRes, tixRes] = await Promise.all([
        supabaseClient
            .from('event_registrations')
            .select('id, klub_asal, nama_peserta, status_pembayaran')
            .eq('event_id', currentEventId),
        supabaseClient
            .from('event_tickets')
            .select('*')
            .eq('event_id', currentEventId)
            .order('created_at', { ascending: true })
    ]);

    if (tixRes.error) throw tixRes.error;
    const regRows = (!regRes.error && Array.isArray(regRes.data)) ? regRes.data : [];
    const tixRows = Array.isArray(tixRes.data) ? tixRes.data : [];

    const clubMap = new Map();
    const ensureClub = (rawName) => {
        const clean = (rawName || 'Individu').trim() || 'Individu';
        const key = clean.toUpperCase();
        if (!clubMap.has(key)) {
            clubMap.set(key, {
                klub: clean,
                pesertaCount: 0,
                tiketLunas: 0,
                tiketPending: 0,
                totalNominalLunas: 0,
                typeBreakdown: new Map(),
                orders: []
            });
        }
        return clubMap.get(key);
    };

    regRows.forEach(r => {
        if (String(r.status_pembayaran || '').toLowerCase() === 'lunas') {
            ensureClub(r.klub_asal).pesertaCount += 1;
        }
    });

    tixRows.forEach(t => {
        const entry = ensureClub(t.klub_asal);
        const st = String(t.status_pembayaran || 'Pending').toLowerCase();
        const qty = Number(t.jumlah_tiket || 0);
        const tipe = (t.tipe_tiket || 'Tiket Gelang').trim();

        if (st === 'lunas') {
            entry.tiketLunas += qty;
            entry.totalNominalLunas += Number(t.total_harga || 0);
            entry.typeBreakdown.set(tipe, (entry.typeBreakdown.get(tipe) || 0) + qty);
        } else if (st === 'pending') {
            entry.tiketPending += qty;
        }

        if (st !== 'ditolak') {
            entry.orders.push({
                kode: t.kode_tiket,
                pemesan: t.nama_pembeli,
                atlet: t.nama_atlet || '',
                tipe,
                qty,
                status: st === 'lunas' ? 'TERVERIFIKASI' : 'PENDING'
            });
        }
    });

    const recapList = Array.from(clubMap.values())
        .filter(c => c.tiketLunas > 0 || c.tiketPending > 0 || c.pesertaCount > 0)
        .sort((a, b) => a.klub.localeCompare(b.klub, 'id'));

    cachedClubTicketRecap = recapList;
    return { tixRows, recapList };
}

async function loadTransaksiTiketHtm() {
    const container = document.getElementById('listTransaksiTiketContainer');
    const rekapBox = document.getElementById('rekapKlubTiketContainer');
    const badge = document.getElementById('badgeRingkasanTiket');
    if (!container) return;

    container.innerHTML = '<p class="text-xs text-slate-400 text-center py-6">Memuat daftar pemesanan...</p>';
    if (rekapBox) rekapBox.innerHTML = '<p class="text-xs text-slate-400 text-center py-3">Menghitung rekap per klub...</p>';

    try {
        const { tixRows: rows, recapList } = await buildClubTicketRecapData();

        const totalLunas = rows
            .filter(r => String(r.status_pembayaran || '').toLowerCase() === 'lunas')
            .reduce((acc, r) => acc + Number(r.jumlah_tiket || 0), 0);
        if (badge) badge.innerText = `${totalLunas} Tiket Terverifikasi`;

        if (rekapBox) {
            const clubsWithTickets = recapList.filter(c => c.tiketLunas > 0 || c.tiketPending > 0);
            if (clubsWithTickets.length === 0) {
                rekapBox.innerHTML = '<p class="text-xs text-slate-400 text-center py-3">Belum ada data pembelian tiket pada klub manapun.</p>';
            } else {
                rekapBox.innerHTML = clubsWithTickets.map(c => {
                    const breakdownText = Array.from(c.typeBreakdown.entries())
                        .map(([tp, q]) => `${tp}: ${q}`)
                        .join(', ');
                    return `
                        <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs">
                            <div class="min-w-0">
                                <p class="font-black text-slate-800 dark:text-white uppercase truncate">${c.klub}</p>
                                <p class="text-[11px] text-slate-500 truncate">
                                    ${c.pesertaCount} Peserta ${breakdownText ? `• ${breakdownText}` : ''}
                                </p>
                            </div>
                            <div class="text-right shrink-0">
                                <span class="inline-block bg-emerald-100 text-emerald-800 font-black px-2.5 py-1 rounded-lg text-xs">
                                    ${c.tiketLunas} Tiket
                                </span>
                                ${c.tiketPending > 0 ? `<span class="block text-[10px] font-bold text-amber-600 mt-0.5">+${c.tiketPending} pending</span>` : ''}
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        if (rows.length === 0) {
            container.innerHTML = '<p class="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-xl">Belum ada pemesanan tiket masuk.</p>';
            return;
        }

        const sortedRows = [...rows].reverse();
        container.innerHTML = sortedRows.map(r => {
            const st = String(r.status_pembayaran || 'Pending');
            const isLunas = st.toLowerCase() === 'lunas';
            const isDitolak = st.toLowerCase() === 'ditolak';
            const statusText = isLunas ? 'TERVERIFIKASI' : (isDitolak ? 'DITOLAK' : 'MENUNGGU VERIFIKASI');
            const badgeCls = isLunas
                ? 'bg-emerald-100 text-emerald-800'
                : (isDitolak ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800');

            return `
                <div class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="space-y-1 text-xs">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="font-mono font-black text-slate-900 dark:text-white">${r.kode_tiket}</span>
                            <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase ${badgeCls}">${statusText}</span>
                            <span class="font-black text-amber-700 dark:text-amber-400">${r.tipe_tiket || 'Tiket Gelang'} • ${r.jumlah_tiket} Tiket (Rp ${Number(r.total_harga || 0).toLocaleString('id-ID')})</span>
                        </div>
                        <p class="font-bold text-slate-700 dark:text-slate-300 uppercase">${r.klub_asal} ${r.nama_atlet ? `(${r.nama_atlet})` : ''}</p>
                        <p class="text-[11px] text-slate-500">Pemesan: ${r.nama_pembeli} (${r.no_wa || '-'})</p>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                        ${r.bukti_url ? `<a href="${r.bukti_url}" target="_blank" class="px-2.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold hover:bg-blue-100">Cek Bukti</a>` : ''}
                        ${!isLunas ? `<button type="button" onclick="window.verifTiketHtm(${r.id}, 'Lunas')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold">ACC Lunas</button>` : ''}
                        ${!isDitolak ? `<button type="button" onclick="window.verifTiketHtm(${r.id}, 'Ditolak')" class="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-[11px] font-bold">Tolak</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        container.innerHTML = `<p class="text-xs text-red-500 font-bold text-center py-4">Gagal memuat pemesanan: ${err.message}</p>`;
    }
}

window.verifTiketHtm = async function(ticketId, newStatus) {
    try {
        const { error } = await supabaseClient
            .from('event_tickets')
            .update({ status_pembayaran: newStatus })
            .eq('id', ticketId)
            .eq('event_id', currentEventId);
        if (error) throw error;
        await loadTransaksiTiketHtm();
    } catch (err) {
        alert("Gagal memperbarui status pemesanan: " + err.message);
    }
};

window.cetakRekapTiketPerKlub = async function() {
    try {
        const { recapList } = await buildClubTicketRecapData();
        const rowsToPrint = recapList.filter(c => c.tiketLunas > 0 || c.tiketPending > 0);

        if (rowsToPrint.length === 0) {
            alert("Belum ada data pemesanan tiket masuk untuk dicetak.");
            return;
        }

        let totalAtlet = 0;
        let totalLunas = 0;
        let totalPending = 0;

        const tableRowsHtml = rowsToPrint.map((c, idx) => {
            totalAtlet += c.pesertaCount;
            totalLunas += c.tiketLunas;
            totalPending += c.tiketPending;

            const detailOrders = c.orders.map(o =>
                `<div>• <strong>${o.pemesan}</strong> (${o.kode}): ${o.qty} ${o.tipe} ${o.atlet ? `- ${o.atlet}` : ''} <em>[${o.status}]</em></div>`
            ).join('');

            return `
                <tr>
                    <td style="text-align:center;">${idx + 1}</td>
                    <td><strong>${c.klub}</strong></td>
                    <td style="text-align:center;">${c.pesertaCount}</td>
                    <td style="text-align:center; font-size:14px;"><strong>${c.tiketLunas}</strong></td>
                    <td style="text-align:center;">${c.tiketPending > 0 ? c.tiketPending : '-'}</td>
                    <td style="font-size:11px; line-height:1.4;">${detailOrders || '-'}</td>
                    <td style="text-align:center;">[ &nbsp;&nbsp; ] Sudah Diambil</td>
                </tr>
            `;
        }).join('');

        const printWin = window.open('', '_blank');
        if (!printWin) {
            alert("Popup diblokir browser. Izinkan pop-up untuk mencetak rekap tiket.");
            return;
        }

        printWin.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Rekap Tiket Gelang per Klub - ${eventTitle}</title>
    <style>
        @page { size: A4 portrait; margin: 14mm; }
        body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 0; padding: 0; }
        .header { border-bottom: 3px solid #0f172a; padding-bottom: 10px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
        .header h1 { margin: 0; font-size: 18px; text-transform: uppercase; }
        .header p { margin: 4px 0 0; font-size: 12px; color: #475569; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #94a3b8; padding: 8px 7px; vertical-align: top; }
        th { background: #f1f5f9; font-weight: bold; text-transform: uppercase; font-size: 11px; }
        tfoot td { background: #f8fafc; font-weight: bold; }
        .no-print { margin-bottom: 14px; text-align: right; }
        @media print { .no-print { display: none; } }
    </style>
</head>
<body>
    <div class="no-print">
        <button onclick="window.print()" style="padding:8px 16px; background:#0f172a; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">🖨️ Print / Simpan PDF</button>
    </div>
    <div class="header">
        <div>
            <h1>REKAP PENGAMBILAN TIKET GELANG PER KLUB</h1>
            <p><strong>${eventTitle}</strong></p>
        </div>
        <div style="text-align:right; font-size:11px; color:#475569;">
            Dicetak: ${new Date().toLocaleString('id-ID')}
        </div>
    </div>
    <table>
        <thead>
            <tr>
                <th style="width:32px;">No</th>
                <th>Klub / Sekolah Asal</th>
                <th style="width:65px;">Peserta</th>
                <th style="width:85px;">Tiket ACC</th>
                <th style="width:65px;">Pending</th>
                <th>Rincian Pemesan & Tipe Tiket</th>
                <th style="width:125px;">Checklist Loket</th>
            </tr>
        </thead>
        <tbody>
            ${tableRowsHtml}
        </tbody>
        <tfoot>
            <tr>
                <td colspan="2" style="text-align:right;">TOTAL KESELURUHAN</td>
                <td style="text-align:center;">${totalAtlet}</td>
                <td style="text-align:center; font-size:14px;">${totalLunas}</td>
                <td style="text-align:center;">${totalPending}</td>
                <td colspan="2"></td>
            </tr>
        </tfoot>
    </table>
    <script>window.onload = () => setTimeout(() => window.print(), 300);</script>
</body>
</html>`);
        printWin.document.close();
    } catch (err) {
        alert("Gagal menyiapkan halaman cetak rekap tiket: " + err.message);
    }
};
