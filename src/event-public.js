import { supabaseClient } from './supabase.js';

// ==========================================
// HELPER: CARI ATAU TERBITKAN F1 ID OTOMATIS (ATLET TAMU)
// ==========================================
async function generateOrFindF1Id(supabase, { nama, dob, gender, aktaUrl = null }) {
    const cleanName = (nama || '').trim();
    const cleanDob = (dob || '').trim();

    if (cleanName && cleanDob) {
        const { data: existingList } = await supabase
            .from('athletes')
            .select('f1_id')
            .ilike('full_name', cleanName)
            .eq('dob', cleanDob)
            .limit(1);

        if (existingList && existingList.length > 0 && existingList[0].f1_id) {
            return existingList[0].f1_id;
        }
    }

    let yy = '00';
    let mm = '00';
    if (cleanDob) {
        const parts = cleanDob.split('-');
        if (parts.length >= 2) {
            yy = parts[0].slice(-2);
            mm = parts[1].padStart(2, '0');
        }
    }
    const random3 = Math.floor(Math.random() * 900) + 100;
    const newF1Id = `F1-${yy}${mm}${random3}`;

    try {
        await supabase.from('athletes').insert([{
            f1_id: newF1Id,
            full_name: cleanName,
            dob: cleanDob || null,
            gender: gender || null,
            akta_url: aktaUrl || null
        }]);
    } catch (e) {
        console.warn('[SCS-F1] Insert ke master athletes dilewati:', e?.message || e);
    }

    return newF1Id;
}


async function decodeImageSource(file) {
    // Lapis 1: createImageBitmap (decoder native Android/iOS, aman untuk content:// Photo Picker)
    if (typeof createImageBitmap === 'function') {
        try {
            const bmp = await createImageBitmap(file);
            return {
                source: bmp,
                width: bmp.width,
                height: bmp.height,
                cleanup: () => { if (typeof bmp.close === 'function') bmp.close(); }
            };
        } catch (e) {
            console.warn('[SCS-IMG] createImageBitmap dilewati:', e?.message || e);
        }
    }

    // Lapis 2: FileReader DataURL + HTMLImageElement
    try {
        const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('FileReader gagal'));
            reader.readAsDataURL(file);
        });
        const img = await new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error('DataURL Image gagal'));
            image.src = dataUrl;
        });
        return {
            source: img,
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
            cleanup: () => {}
        };
    } catch (e) {
        console.warn('[SCS-IMG] FileReader fallback dilewati:', e?.message || e);
    }

    // Lapis 3: ObjectURL + HTMLImageElement
    const objectUrl = URL.createObjectURL(file);
    try {
        const img = await new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error('ObjectURL Image gagal'));
            image.src = objectUrl;
        });
        return {
            source: img,
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
            cleanup: () => URL.revokeObjectURL(objectUrl)
        };
    } catch (err) {
        URL.revokeObjectURL(objectUrl);
        throw err;
    }
}

async function compressImageTo150KB(file, maxKB = 180) {
    if (!file) return file;
    const maxBytes = maxKB * 1024;
    const maxDirectUploadBytes = 8 * 1024 * 1024; // 8 MB batas aman upload langsung tanpa kompresi

    // Jika file sudah ringan (<= maxKB) atau bukan gambar (misal PDF hasil scan), langsung pakai file asli
    if (!file.type || !file.type.startsWith("image/") || file.size <= maxBytes) {
        return file;
    }

    let decoded = null;
    try {
        decoded = await decodeImageSource(file);
        let width = decoded.width;
        let height = decoded.height;
        if (!width || !height) return file;

        const maxDim = 1600;
        if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return file;

        let blob = null;
        while (width >= 400 && height >= 200) {
            canvas.width = width;
            canvas.height = height;
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(decoded.source, 0, 0, width, height);

            for (let q = 0.85; q >= 0.45; q -= 0.1) {
                blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", Number(q.toFixed(2))));
                if (blob && blob.size <= maxBytes) break;
            }
            if (blob && blob.size <= maxBytes) break;

            width = Math.round(width * 0.75);
            height = Math.round(height * 0.75);
        }

        if (!blob || blob.size >= file.size) return file;
        const baseName = (file.name || "dokumen").replace(/\.[^/.]+$/, "");
        return new File([blob], baseName + ".jpg", { type: "image/jpeg", lastModified: Date.now() });
    } catch (err) {
        // JANGAN PERNAH MEMBLOKIR PENDAFTARAN JIKA KOMPRESI BROWSER GAGAL
        console.warn("[SCS-IMG] Kompresi dilewati, memakai file asli:", err?.message || err);
        if (file.size <= maxDirectUploadBytes) {
            return file;
        }
        throw new Error("Ukuran file terlalu besar (> 8 MB) dan gagal dikompres otomatis. Perkecil ukuran foto terlebih dahulu.");
    } finally {
        if (decoded && typeof decoded.cleanup === "function") {
            decoded.cleanup();
        }
    }
}

function buildSafeStorageUploadMeta(file, prefix) {
    const mimeMap = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/heic": "heic",
        "image/heif": "heif",
        "application/pdf": "pdf"
    };
    const rawExt = (file.name && file.name.includes("."))
        ? file.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "")
        : "";
    const fileExt = mimeMap[file.type] || (rawExt && rawExt.length <= 5 ? rawExt : "jpg");
    const contentType = file.type || (fileExt === "pdf" ? "application/pdf" : "image/jpeg");
    const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    return { fileName, contentType };
}

let currentEvent = null; 
let isKlubLoggedIn = false; 
let loggedInClubData = null; 
let dataTagihan = []; 
let selectedTagihanIds = new Set(); 

// Peta Counter Kuota Real-Time
let kuotaMapSpecific = {}; // Key: "NamaNomor|||KU|||Gender" -> jumlah terisi
let kuotaMapTotal = {};    // Key: "NamaNomor" -> jumlah terisi total

function hitungUlangPetaKuota(regsList) {
    kuotaMapSpecific = {};
    kuotaMapTotal = {};
    (regsList || []).forEach(reg => {
        if (reg.gender === 'Regu/Tim') return;
        const ku = (reg.kelompok_umur || '').trim();
        const gender = (reg.gender || '').trim();
        const listNomor = Array.isArray(reg.nomor_lomba) ? reg.nomor_lomba : [];
        listNomor.forEach(n => {
            const namaNomor = typeof n === 'object' ? n.gaya : n;
            if (!namaNomor) return;
            kuotaMapTotal[namaNomor] = (kuotaMapTotal[namaNomor] || 0) + 1;
            if (ku && gender) {
                const key = `${namaNomor}|||${ku}|||${gender}`;
                kuotaMapSpecific[key] = (kuotaMapSpecific[key] || 0) + 1;
            }
        });
    });
}

async function refreshKuotaCounter() {
    if (!currentEvent) return [];
    const { data, error } = await supabaseClient
        .from('event_registrations')
        .select('f1_id, nama_peserta, tanggal_lahir, nomor_lomba, kelompok_umur, gender')
        .eq('event_id', currentEvent.id);

    if (!error && data) {
        hitungUlangPetaKuota(data);
        const stripEl = document.getElementById('stripPeserta');
        if (stripEl) stripEl.innerText = `${data.length} Terdaftar`;
        updateStatusNomorLomba();
        return data;
    }
    return [];
}

function updateStatusNomorLomba() {
    const currentKUName = (document.getElementById('inputAutoKU')?.value || '').trim();
    const currentGender = (document.getElementById('inputGender')?.value || '').trim();

    const checkboxes = document.querySelectorAll('input[name="nomor_lomba"]');
    checkboxes.forEach(cb => {
        const namaNomor = cb.value;
        const blacklistArr = JSON.parse(cb.getAttribute('data-blacklist') || '[]');
        const kuota = Number(cb.getAttribute('data-kuota') || 0);
        const tipeKuota = cb.getAttribute('data-tipe-kuota') || 'per_ku_gender';

        const lbl = cb.closest('.lbl-nomor');
        const teks = lbl?.querySelector('.teks-nomor');
        const badgeKuota = lbl?.querySelector('.badge-kuota');

        const setDisabled = (isFullOrBlocked, badgeHtml) => {
            if (isFullOrBlocked) {
                cb.checked = false;
                cb.disabled = true;
                lbl?.classList.add('bg-slate-200', 'opacity-60', 'cursor-not-allowed');
                lbl?.classList.remove('bg-slate-50', 'hover:bg-blue-50', 'cursor-pointer');
                teks?.classList.add('line-through', 'text-slate-400');
                teks?.classList.remove('text-slate-700');
            } else {
                cb.disabled = false;
                lbl?.classList.remove('bg-slate-200', 'opacity-60', 'cursor-not-allowed');
                lbl?.classList.add('bg-slate-50', 'hover:bg-blue-50', 'cursor-pointer');
                teks?.classList.remove('line-through', 'text-slate-400');
                teks?.classList.add('text-slate-700');
            }
            if (badgeKuota) badgeKuota.innerHTML = badgeHtml || '';
        };

        // 1. Cek validitas KU & Blacklist terlebih dahulu
        if (currentKUName === "Di Luar Rentang KU") {
            setDisabled(true, `<span class="text-[9px] font-bold text-red-600">Di luar KU</span>`);
            return;
        }
        if (currentKUName !== "" && blacklistArr.includes(currentKUName)) {
            setDisabled(true, `<span class="text-[9px] font-bold text-red-600">🚫 Bukan ${currentKUName}</span>`);
            return;
        }

        // 2. Cek Kuota jika diset > 0
        if (kuota > 0) {
            if (tipeKuota === 'total_nomor') {
                const terpakai = kuotaMapTotal[namaNomor] || 0;
                const sisa = Math.max(0, kuota - terpakai);
                if (terpakai >= kuota) {
                    setDisabled(true, `<span class="text-[9px] font-black text-red-700 bg-red-100 px-1.5 py-0.5 rounded">⛔ PENUH (${terpakai}/${kuota})</span>`);
                } else {
                    setDisabled(false, `<span class="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Sisa ${sisa}/${kuota} Total</span>`);
                }
            } else {
                // Mode default: per_ku_gender
                if (currentKUName !== "" && currentGender !== "") {
                    const key = `${namaNomor}|||${currentKUName}|||${currentGender}`;
                    const terpakai = kuotaMapSpecific[key] || 0;
                    const sisa = Math.max(0, kuota - terpakai);
                    if (terpakai >= kuota) {
                        setDisabled(true, `<span class="text-[9px] font-black text-red-700 bg-red-100 px-1.5 py-0.5 rounded">⛔ PENUH (${terpakai}/${kuota})</span>`);
                    } else {
                        setDisabled(false, `<span class="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Sisa ${sisa}/${kuota} (${currentKUName} ${currentGender})</span>`);
                    }
                } else if (currentKUName !== "" && currentGender === "") {
                    const usedPa = kuotaMapSpecific[`${namaNomor}|||${currentKUName}|||Putra`] || 0;
                    const usedPi = kuotaMapSpecific[`${namaNomor}|||${currentKUName}|||Putri`] || 0;
                    if (usedPa >= kuota && usedPi >= kuota) {
                        setDisabled(true, `<span class="text-[9px] font-black text-red-700 bg-red-100 px-1.5 py-0.5 rounded">⛔ PENUH (${currentKUName})</span>`);
                    } else {
                        setDisabled(false, `<span class="text-[9px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">Pa ${usedPa}/${kuota} • Pi ${usedPi}/${kuota}</span>`);
                    }
                } else {
                    setDisabled(false, `<span class="text-[9px] font-bold text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded">Maks ${kuota} / KU & Gender</span>`);
                }
            }
        } else {
            // Tanpa batas kuota
            setDisabled(false, '');
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const initialAuthHash = window.__SCS_INIT_HASH || window.location.hash;
    const hostname = window.location.hostname;
    let subdomain = null;
    
    // Jangan lupa komen baris di bawah ini kalau sudah online!
    // subdomain = 'fs-samawa'; 

    if (!subdomain) {
        const domainParts = hostname.split('.');
        
        if (domainParts.length === 3 && domainParts[1] === 'f1swimming' && domainParts[2] === 'com') {
            subdomain = domainParts[0];
            console.log(`[SCS-ROUTING] ✅ Valid event subdomain detected: ${subdomain}`);
        } else {
            console.warn(`[SCS-ROUTING] ⚠️ Hostname diabaikan atau format tidak valid: ${hostname}`);
            return;
        }
    }
    
    if (!subdomain || subdomain === 'f1swimming') return;

    try {
        const { data: eventData, error } = await supabaseClient
            .from('events')
            .select('*')
            .eq('subdomain', subdomain)
            .single();

        if (error || !eventData) throw new Error("Event tidak ditemukan.");
        currentEvent = eventData;

        const config = eventData.config || {};
        document.getElementById('pageTitle').innerText = `${eventData.event_name} | Pendaftaran Resmi`;
        document.getElementById('publicEventName').innerText = eventData.event_name;
        
        // =========================================================
        // CEK STATUS PENDAFTARAN (IS_CLOSED)
        // =========================================================
        if (eventData.is_closed) {
            const formPeserta = document.querySelector('.bg-white\\/95.backdrop-blur-md');
            const boxBiaya = document.querySelector('.bg-blue-900.border.border-blue-800');
            const sectionAksesCepat = document.getElementById('sectionAksesCepat');
            
            if (formPeserta) formPeserta.classList.add('hidden');
            if (boxBiaya) boxBiaya.classList.add('hidden');
            if (sectionAksesCepat) sectionAksesCepat.classList.add('hidden');

            let waLink = "#";
            if (config.admin_wa_1 || config.admin_wa_2) {
                let nomorTarget = config.admin_wa_1 || config.admin_wa_2;
                let cleanNum = nomorTarget.replace(/\D/g, '');
                if (cleanNum.startsWith('0')) cleanNum = '62' + cleanNum.substring(1);
                waLink = `https://wa.me/${cleanNum}?text=Halo%20Admin%20${encodeURIComponent(eventData.event_name)},%20apakah%20pendaftaran%20masih%20bisa%20dibuka%20untuk%20susulan?`;
            }

            const alertHtml = `
                <div class="bg-red-50 border-2 border-red-200 rounded-3xl p-8 text-center shadow-lg mt-10">
                    <div class="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 border-4 border-white shadow-sm">⛔</div>
                    <h2 class="text-2xl font-black text-red-700 mb-2 tracking-tight">Pendaftaran Telah Ditutup</h2>
                    <p class="text-slate-600 font-medium mb-6 leading-relaxed max-w-md mx-auto">
                        Mohon maaf, pendaftaran untuk event <strong>${eventData.event_name}</strong> sudah ditutup oleh panitia. Silakan hubungi admin jika ada keperluan mendesak.
                    </p>
                    <a href="${waLink}" target="_blank" class="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-xl transition-all hover:scale-105 shadow-md">
                        Hubungi Panitia (WA)
                    </a>
                </div>
            `;
            
            const mainContainer = document.querySelector('.max-w-3xl.mx-auto.px-4.mt-6');
            if(mainContainer) mainContainer.insertAdjacentHTML('afterbegin', alertHtml);
        }

        // =========================================================
        // 📅 RENDER SECOND HEADER / INFO STRIP
        // =========================================================
        let formattedDate = 'Tanggal blm diset';
        const rawDate = eventData.start_date || eventData.event_date || eventData.tanggal;
        if (rawDate) {
            try {
                const dateObj = new Date(rawDate);
                if (!isNaN(dateObj.getTime())) formattedDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            } catch (e) { console.error("Gagal format tanggal:", e); }
        }
        const elStripTanggal = document.getElementById('stripTanggal');
        if (elStripTanggal) elStripTanggal.innerText = formattedDate;

        const rawKota = eventData.kota || '';
        const namaKota = rawKota.split(',')[0].trim(); 
        const namaKolam = config.nama_kolam || '';
        let teksLokasiLengkap = '';
        if (namaKolam && namaKota) {
            teksLokasiLengkap = `${namaKolam} - ${namaKota}`;
        } else if (namaKolam) {
            teksLokasiLengkap = namaKolam;
        } else if (namaKota) {
            teksLokasiLengkap = namaKota;
        } else {
            teksLokasiLengkap = 'Lokasi blm diset';
        }
        
        const elStripLokasi = document.getElementById('stripLokasi');
        if (elStripLokasi) elStripLokasi.innerText = teksLokasiLengkap;

        // =========================================================
        // RENDER BACKGROUND & BIAYA 
        // =========================================================
        if (config.header_url) document.getElementById('headerBannerContainer').style.backgroundImage = `url('${config.header_url}')`;
        if (config.bg_url) {
            const bgOverlay = document.getElementById('bgOverlay');
            bgOverlay.style.backgroundImage = `url('${config.bg_url}')`;
            bgOverlay.classList.remove('hidden');
        }

        const infoBiayaNormal = document.getElementById('infoBiayaNormal');
        const infoDiskon = document.getElementById('infoDiskon');
        let hargaStripTampil = "Rp 0";

        const validTiersDisplay = (config.tarif_individu || [])
            .filter(t => Number(t.qty) > 0 && t.price !== '' && t.price !== null && t.price !== undefined)
            .map(t => ({ qty: Number(t.qty), price: Number(t.price) }))
            .sort((a, b) => a.qty - b.qty);

        const hargaEkstraDisplay = Number(config.tarif_tambahan ?? config.biaya_normal ?? 0);

        if (validTiersDisplay.length > 0) {
            let textTarif = "<span class='font-bold opacity-80'>Pendaftaran Individu:</span><br>";
            
            validTiersDisplay.forEach(t => {
                textTarif += `• ${t.qty} Nomor = Rp ${t.price.toLocaleString('id-ID')}<br>`;
            });

            if (hargaEkstraDisplay > 0) {
                let maxQty = validTiersDisplay[validTiersDisplay.length - 1].qty;
                textTarif += `<span class="text-[10.5px] text-blue-200 mt-1 inline-block border-t border-blue-800/50 pt-1 w-full">💡 Lebih dari ${maxQty} nomor: +Rp ${hargaEkstraDisplay.toLocaleString('id-ID')} / nomor ekstra.</span>`;
            }

            infoBiayaNormal.innerHTML = textTarif;
            if(infoDiskon) infoDiskon.classList.add('hidden'); 
            hargaStripTampil = `Mulai Rp ${validTiersDisplay[0].price.toLocaleString('id-ID')}`;
        } else {
            const normalPrice = Number(config.biaya_normal || 0).toLocaleString('id-ID');
            infoBiayaNormal.innerText = `Biaya per nomor: Rp ${normalPrice}`;
            hargaStripTampil = `Rp ${normalPrice}`;
            
            if (config.min_diskon && config.biaya_diskon) {
                const diskonPrice = Number(config.biaya_diskon).toLocaleString('id-ID');
                infoDiskon.innerText = `🔥 Diskon spesial: Ambil minimal ${config.min_diskon} nomor, harga per nomor jadi Rp ${diskonPrice}!`;
                infoDiskon.classList.remove('hidden');
            }
        }

        const elStripBiaya = document.getElementById('stripBiaya');
        if (elStripBiaya) elStripBiaya.innerText = hargaStripTampil;
        
        if (config.biaya_estafet !== undefined && config.biaya_estafet !== '') {
            const estafetPrice = Number(config.biaya_estafet).toLocaleString('id-ID');
            const infoEstafet = document.getElementById('infoBiayaEstafet');
            if(infoEstafet) {
                infoEstafet.innerText = `Biaya Estafet (Per Regu): Rp ${estafetPrice}`;
                infoEstafet.classList.remove('hidden');
            }
        }

        // =========================================================
        // INJEKSI TAUTAN EKSTRA (JUKNIS / WA GROUP)
        // =========================================================
        if (config.tautan_ekstra && config.tautan_ekstra.length > 0) {
            const containerTautan = document.getElementById('containerTautanEkstraPublik');
            if (containerTautan) {
                containerTautan.classList.remove('hidden');
                config.tautan_ekstra.forEach(link => {
                    if(link.title && link.url) {
                        containerTautan.innerHTML += `
                            <a href="${link.url}" target="_blank" class="flex-1 sm:flex-none inline-flex justify-center items-center gap-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 hover:border-indigo-600 font-extrabold py-2.5 px-5 rounded-xl text-xs md:text-sm transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 whitespace-nowrap">
                                🔗 ${link.title}
                            </a>
                        `;
                    }
                });
            }
        }

        // =========================================================
        // 1. FLOATING WHATSAPP BUTTON
        // =========================================================
        const btnToggleMenu = document.getElementById('btnToggleWAMenu');
        const waMenuOptions = document.getElementById('waMenuOptions');
        const btnWA1 = document.getElementById('btnWA_Admin1');
        const btnWA2 = document.getElementById('btnWA_Admin2');
        let hasWA = false;

        function formatWANumber(num) {
            let cleanNum = num.replace(/\D/g, '');
            if (cleanNum.startsWith('0')) cleanNum = '62' + cleanNum.substring(1);
            return cleanNum;
        }

        if (config.admin_wa_1) {
            hasWA = true;
            btnWA1.href = `https://wa.me/${formatWANumber(config.admin_wa_1)}?text=Halo%20Admin%201%20${encodeURIComponent(eventData.event_name)},%20saya%20mau%20tanya...`;
            btnWA1.classList.remove('hidden');
            btnWA1.classList.add('flex'); 
        }

        if (config.admin_wa_2) {
            hasWA = true;
            btnWA2.href = `https://wa.me/${formatWANumber(config.admin_wa_2)}?text=Halo%20Admin%202%20${encodeURIComponent(eventData.event_name)},%20saya%20mau%20tanya...`;
            btnWA2.classList.remove('hidden');
            btnWA2.classList.add('flex'); 
        }

        if (hasWA && btnToggleMenu) {
            btnToggleMenu.classList.remove('hidden');
            btnToggleMenu.addEventListener('click', (e) => {
                e.preventDefault();
                waMenuOptions.classList.toggle('hidden');
                waMenuOptions.classList.toggle('flex');
            });
        }

        // =========================================================
        // MANGGIL INFO PEMBAYARAN & QRIS 
        // =========================================================
        if (config.info_pembayaran || config.qris_url) {
            document.getElementById('boxInfoPembayaran').classList.remove('hidden');
            if (config.info_pembayaran) {
                document.getElementById('teksInfoPembayaran').innerText = config.info_pembayaran;
                document.getElementById('teksInfoPembayaran').classList.remove('hidden');
            } else {
                document.getElementById('teksInfoPembayaran').classList.add('hidden');
            }
            if (config.qris_url) {
                document.getElementById('boxQris').classList.remove('hidden');
                document.getElementById('boxQris').classList.add('flex'); 
                document.getElementById('imgQris').src = config.qris_url;
            }
        }

        // =========================================================
        // RENDER KELOMPOK UMUR & GAYA INDIVIDU (WITH BLACKLIST & KUOTA)
        // =========================================================
        const kuList = eventData.config_ku || [];
        const gayaList = eventData.config_gaya || [];
        const containerGaya = document.getElementById('containerNomorLomba');
        containerGaya.innerHTML = '';

        gayaList.forEach(gaya => {
            let jarakHTML = '';
            (gaya.jarak || []).forEach(jrk => {
                if(jrk.aktif) {
                    const blacklistKuJSON = JSON.stringify(jrk.blacklist_ku || []);
                    const kuotaVal = Number(jrk.kuota || 0);
                    const tipeKuota = jrk.tipe_kuota || 'per_ku_gender';
                    jarakHTML += `
                        <label class="lbl-nomor flex flex-col justify-between gap-1 text-xs font-bold text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-blue-50 transition-colors">
                            <div class="flex items-center gap-2">
                                <input type="checkbox" name="nomor_lomba" value="${gaya.nama} ${jrk.nama}" data-blacklist='${blacklistKuJSON}' data-kuota="${kuotaVal}" data-tipe-kuota="${tipeKuota}" class="w-4 h-4 text-blue-600 rounded disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
                                <span class="teks-nomor leading-tight">${jrk.nama}</span>
                            </div>
                            <div class="badge-kuota empty:hidden pl-6"></div>
                        </label>
                    `;
                }
            });
            if(jarakHTML) {
                containerGaya.innerHTML += `
                    <div class="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                        <p class="font-extrabold text-blue-900 text-xs mb-2">${gaya.nama}</p>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">${jarakHTML}</div>
                    </div>
                `;
            }
        });

        // Muat Statistik & Kuota Terkini dari Database
        await refreshKuotaCounter();

        // LOGIKA DETEKSI UMUR & UPDATE STATUS KUOTA/BLACKLIST
        document.getElementById('inputTglLahir').addEventListener('change', (e) => {
            const tahunLahir = new Date(e.target.value).getFullYear();
            if (isNaN(tahunLahir)) {
                document.getElementById('inputAutoKU').value = '';
                updateStatusNomorLomba();
                return;
            }
            
            const matchedKU = kuList.find(ku => tahunLahir >= Number(ku.tahunMulai) && tahunLahir <= Number(ku.tahunAkhir));
            const currentKUName = matchedKU ? matchedKU.nama : "Di Luar Rentang KU";
            document.getElementById('inputAutoKU').value = currentKUName;

            updateStatusNomorLomba();
        });

        // LOGIKA DETEKSI PERUBAHAN GENDER & UPDATE STATUS KUOTA
        document.getElementById('inputGender').addEventListener('change', () => {
            updateStatusNomorLomba();
        });

        // =========================================================
        // RENDER DROPDOWN ESTAFET (KOSONGAN TIKET)
        // =========================================================
        const estafetList = eventData.config_estafet || [];
        const selectEstafet = document.getElementById('inputNomorEstafet');
        if (selectEstafet) {
            selectEstafet.innerHTML = '<option value="">-- Pilih Kategori & Jarak Estafet --</option>';
            estafetList.forEach(estafet => {
                const items = estafet.items || estafet.list || [];
                items.forEach(item => {
                    selectEstafet.innerHTML += `<option value="${estafet.nama} ${item.jarak} (${item.jenis})">${estafet.nama} - ${item.jarak} ${item.jenis}</option>`;
                });
            });
        }

        const selectKUEstafet = document.getElementById('inputKUEstafet');
        if (selectKUEstafet) {
            selectKUEstafet.innerHTML = '<option value="">-- Tentukan KU Regu --</option>';
            [...kuList].sort((a,b) => b.tahunAkhir - a.tahunAkhir).forEach(ku => {
                selectKUEstafet.innerHTML += `<option value="${ku.nama}">${ku.nama} (${ku.tahunMulai}-${ku.tahunAkhir})</option>`;
            });
        }

        // =========================================================
        // TANGKAP TOKEN BALIKAN DARI f1swimming.com/auth.html (JIKA ADA)
        // =========================================================
        const authHashToParse = (window.location.hash && window.location.hash.includes('access_token='))
            ? window.location.hash
            : initialAuthHash;

        let activeSession = null;
        if (authHashToParse && authHashToParse.includes('access_token=')) {
            const hashParams = new URLSearchParams(authHashToParse.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            if (accessToken && refreshToken) {
                const { data: setSessData, error: setSessErr } = await supabaseClient.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken
                });
                if (setSessErr) {
                    console.warn('[SCS-AUTH] Gagal setSession dari hash:', setSessErr.message);
                } else {
                    activeSession = setSessData?.session || null;
                }
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
        }

        // =========================================================
        // OTOMATIS CEK SESSION (JIKA SUDAH LOGIN SEBELUMNYA)
        // =========================================================
        if (!activeSession) {
            const { data: { session } } = await supabaseClient.auth.getSession();
            activeSession = session;
        }
        if (activeSession) {
            await applySuccessfulLoginUI(activeSession.user.id);
        }

        loadTagihan();

    } catch (err) {
        alert(err.message);
    }
  
    // ==========================================
    // ARAHKAN GOOGLE LOGIN & REGISTER KE DOMAIN UTAMA + REDIRECT BALIK
    // ==========================================
    const currentEventUrl = window.location.origin + window.location.pathname + window.location.search;
    const linkAuthGoogle = document.getElementById('linkAuthGoogle');
    const linkAuthRegister = document.getElementById('linkAuthRegister');
    if (linkAuthGoogle) {
        linkAuthGoogle.href = `https://f1swimming.com/auth.html?redirect=${encodeURIComponent(currentEventUrl)}`;
    }
    if (linkAuthRegister) {
        linkAuthRegister.href = `https://f1swimming.com/auth.html?mode=register&redirect=${encodeURIComponent(currentEventUrl)}`;
    }

    // ==========================================
    // LOGIKA LOGIN LANGSUNG VIA EMAIL & PASSWORD
    // ==========================================
    const handleDirectEmailLogin = async () => {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const btnLogin = document.getElementById('btnProsesLogin');

        if (!email || !password) return alert("Email dan Password wajib diisi!");

        btnLogin.innerText = "Mengecek akun...";
        btnLogin.disabled = true;

        try {
            const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (authError) throw authError;

            await applySuccessfulLoginUI(authData.user.id);
        } catch (err) {
            alert("Gagal login: " + err.message);
        } finally {
            btnLogin.innerText = "Masuk & Sinkronisasi 🚀";
            btnLogin.disabled = false;
        }
    };

    const formPublicLogin = document.getElementById('formPublicLogin');
    if (formPublicLogin) {
        formPublicLogin.addEventListener('submit', handleDirectEmailLogin);
    }

        // ==========================================
    // LOGOUT
    // ==========================================
    document.getElementById('btnLogout').addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = window.location.origin + window.location.pathname + window.location.search;
    });

    // ==========================================
    // FUNGSI LOAD ATLET KE DROPDOWN
    // ==========================================
    async function loadAthletesToDropdown(clubId, preselectId = null) {
        const { data: athletes, error: athErr } = await supabaseClient
            .from('athletes')
            .select('*')
            .eq('club_id', clubId)
            .order('full_name', { ascending: true });
            
        if (athErr) throw athErr;

        const dropdown = document.getElementById('dropdownAtlet');
        dropdown.innerHTML = '<option value="">-- Pilih Peserta dari Data Kamu --</option>';
        (athletes || []).forEach(atlet => {
            const tgl = atlet.dob || ''; 
            const jk = atlet.gender || ''; 
            const akta = atlet.akta_url || ''; 
            dropdown.innerHTML += `<option value="${atlet.f1_id}" data-name="${atlet.full_name}" data-tgl="${tgl}" data-gender="${jk}" data-akta="${akta}">${atlet.full_name} (${atlet.f1_id})</option>`;
        });

        if (preselectId) {
            dropdown.value = preselectId;
            dropdown.dispatchEvent(new Event('change'));
        }
    }

    // ==========================================
    // FUNGSI GLOBAL APLIKASI UI SETELAH LOGIN
    // ==========================================
    async function applySuccessfulLoginUI(userId) {
        try {
            const { data: clubData, error: clubErr } = await supabaseClient.from('clubs').select('*').eq('owner_id', userId).single();
            if (clubErr || !clubData) {
                const { data: { session: activeSess } } = await supabaseClient.auth.getSession();
                alert("Akun berhasil masuk! Silakan lengkapi Profil Klub Anda terlebih dahulu di Dashboard utama.");
                if (activeSess?.access_token && activeSess?.refresh_token) {
                    const hash = `access_token=${encodeURIComponent(activeSess.access_token)}&refresh_token=${encodeURIComponent(activeSess.refresh_token)}`;
                    window.location.href = `https://f1swimming.com/dashboard.html?redirect=${encodeURIComponent(currentEventUrl)}#${hash}`;
                } else {
                    window.location.href = `https://f1swimming.com/dashboard.html?redirect=${encodeURIComponent(currentEventUrl)}`;
                }
                return;
            }
            
            isKlubLoggedIn = true;
            loggedInClubData = clubData;

            await loadAthletesToDropdown(clubData.id);

            document.getElementById('sectionAksesCepat').classList.add('hidden');
            
            const badge = document.getElementById('activeClubBadge');
            badge.classList.remove('hidden');
            badge.classList.add('flex');
            
            const namaKlub = clubData.club_name || clubData.nama_klub || "Klub Terdaftar SCS";
            const avatarUrl = clubData.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(namaKlub)}&background=1e3a8a&color=fff`;
            
            document.getElementById('activeClubName').innerText = namaKlub;
            document.getElementById('activeClubLogo').src = avatarUrl;

            document.getElementById('areaGuestOnly').classList.add('hidden'); 
            document.getElementById('areaAkta').classList.add('hidden');
            
            const btnQuickAddAthlete = document.getElementById('btnQuickAddAthlete');
            if (btnQuickAddAthlete) {
                btnQuickAddAthlete.classList.remove('hidden');
                btnQuickAddAthlete.classList.add('inline-flex');
            }
            
            const areaEstafet = document.getElementById('areaEstafetVVIP');
            if(areaEstafet) areaEstafet.classList.remove('hidden');
            
            document.getElementById('inputCariAtlet').classList.add('hidden');
            const dropdown = document.getElementById('dropdownAtlet');
            dropdown.classList.remove('hidden');

            loadTagihan();
        } catch (err) {
            console.error("Gagal build UI pasca-login:", err);
            await supabaseClient.auth.signOut();
        }
    }

    // ==========================================
    // LOGIKA QUICK ADD ATHLETE (ON-THE-FLY)
    // ==========================================
    const btnQuickAddAthlete = document.getElementById('btnQuickAddAthlete');
    const modalQuickAdd = document.getElementById('modalQuickAddAthlete');
    const closeQuickAddBtn = document.getElementById('closeQuickAddBtn');
    const btnSaveQuickAdd = document.getElementById('btnSaveQuickAdd');

    if (btnQuickAddAthlete && modalQuickAdd && closeQuickAddBtn) {
        btnQuickAddAthlete.addEventListener('click', () => {
            modalQuickAdd.classList.remove('hidden');
            setTimeout(() => modalQuickAdd.firstElementChild.classList.remove('scale-95'), 10);
        });

        closeQuickAddBtn.addEventListener('click', () => {
            modalQuickAdd.firstElementChild.classList.add('scale-95');
            setTimeout(() => modalQuickAdd.classList.add('hidden'), 200);
        });
    }

    if (btnSaveQuickAdd) {
        btnSaveQuickAdd.addEventListener('click', async () => {
            const inputNama = document.getElementById('qaInputNama').value.trim();
            const inputDOB = document.getElementById('qaInputDOB').value;
            const inputGender = document.getElementById('qaInputGender').value;
            const statusMsg = document.getElementById('qaStatusMsg');

            if (!inputNama || !inputDOB) {
                statusMsg.innerText = "Nama dan Tanggal Lahir wajib diisi!";
                statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-red-100 text-red-600 block mt-2";
                statusMsg.classList.remove('hidden');
                return;
            }

            if (!isKlubLoggedIn || !loggedInClubData) return;

            btnSaveQuickAdd.innerText = "Menyimpan ke Database...";
            btnSaveQuickAdd.disabled = true;

            try {
                const dateObj = new Date(inputDOB);
                const yy = dateObj.getFullYear().toString().slice(-2);
                const mm = ('0' + (dateObj.getMonth() + 1)).slice(-2);
                const random3 = Math.floor(Math.random() * 900) + 100;
                const generatedF1Id = `F1-${yy}${mm}${random3}`;

                const { error } = await supabaseClient
                    .from('athletes')
                    .insert([{
                        f1_id: generatedF1Id,
                        full_name: inputNama,
                        dob: inputDOB,
                        gender: inputGender,
                        club_id: loggedInClubData.id 
                    }]);

                if (error) {
                    if (error.code === '23505') throw new Error("Atlet dengan Nama dan Tgl Lahir ini sudah terdaftar!");
                    throw error;
                }

                statusMsg.innerText = "✅ Atlet Berhasil Ditambahkan!";
                statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-green-100 text-green-700 block mt-2";
                statusMsg.classList.remove('hidden');

                document.getElementById('qaInputNama').value = '';
                document.getElementById('qaInputDOB').value = '';

                setTimeout(async () => {
                    closeQuickAddBtn.click();
                    btnSaveQuickAdd.innerText = "Simpan & Masukkan ke Form";
                    btnSaveQuickAdd.disabled = false;
                    statusMsg.classList.add('hidden');
                    
                    await loadAthletesToDropdown(loggedInClubData.id, generatedF1Id);
                }, 1000);

            } catch (err) {
                statusMsg.innerText = err.message;
                statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-red-100 text-red-600 block mt-2";
                statusMsg.classList.remove('hidden');
                btnSaveQuickAdd.innerText = "Simpan & Masukkan ke Form";
                btnSaveQuickAdd.disabled = false;
            }
        });
    }

    // ==========================================
    // LOGIKA AUTO-FILL SAAT PILIH ATLET
    // ==========================================
    document.getElementById('dropdownAtlet').addEventListener('change', (e) => {
        document.querySelectorAll('input[name="nomor_lomba"]:checked').forEach(cb => cb.checked = false);
        const opt = e.target.options[e.target.selectedIndex];
        const inputTgl = document.getElementById('inputTglLahir');
        const inputGender = document.getElementById('inputGender');
        const areaAkta = document.getElementById('areaAkta');

        if(opt.value !== "") {
            inputTgl.value = opt.getAttribute('data-tgl'); 
            inputGender.value = opt.getAttribute('data-gender');
            inputTgl.readOnly = true; 
            inputTgl.classList.add('bg-slate-200', 'pointer-events-none');
            inputGender.classList.add('bg-slate-200', 'pointer-events-none');

            const aktaUrl = opt.getAttribute('data-akta');
            if (!aktaUrl || aktaUrl === 'null' || aktaUrl.trim() === '') areaAkta.classList.remove('hidden'); 
            else areaAkta.classList.add('hidden'); 
            
            inputTgl.dispatchEvent(new Event('change'));
        } else {
            resetFormAtlet();
        }
    });

    // ==========================================
    // LOGIKA PENDAFTARAN INDIVIDU
    // ==========================================
    document.getElementById('btnKirimPendaftaran').addEventListener('click', async () => {
        const btn = document.getElementById('btnKirimPendaftaran');
        const inputKlubManual = document.getElementById('inputKlubManual').value.trim();
        const inputWhatsapp = document.getElementById('inputWhatsapp').value.trim();
        const inputManualName = document.getElementById('inputCariAtlet').value.trim();
        const dropdownAtlet = document.getElementById('dropdownAtlet');
        
        let f1_id = null; 
        let nama_peserta = ""; 
        let klub_asal = ""; 
        let nomor_wa_pic = null; 
        let requiresAktaUpload = false;

        if (isKlubLoggedIn) {
            if(dropdownAtlet.value === "") return alert("Pilih peserta terlebih dahulu!");
            f1_id = dropdownAtlet.value;
            nama_peserta = dropdownAtlet.options[dropdownAtlet.selectedIndex].getAttribute('data-name');
            klub_asal = loggedInClubData.club_name || loggedInClubData.nama_klub;
            nomor_wa_pic = loggedInClubData.contact_wa || "Belum Diatur di Profil Klub";
            if (!document.getElementById('areaAkta').classList.contains('hidden')) requiresAktaUpload = true;
        } else {
            if(!inputKlubManual) return alert("Nama Klub/Sekolah wajib diisi!");
            if(!inputWhatsapp) return alert("Nomor WhatsApp wajib diisi agar panitia bisa menghubungi Anda!");
            if(!inputManualName) return alert("Nama Peserta wajib diisi!");
            klub_asal = inputKlubManual; 
            nomor_wa_pic = inputWhatsapp; 
            nama_peserta = inputManualName; 
            requiresAktaUpload = true; 
        }

        const tanggal_lahir = document.getElementById('inputTglLahir').value;
        const kelompok_umur = document.getElementById('inputAutoKU').value;
        const gender = document.getElementById('inputGender').value;
        
        if(!tanggal_lahir || !gender) return alert("Lengkapi Tanggal Lahir dan Jenis Kelamin!");
        if(kelompok_umur === "Di Luar Rentang KU") return alert("Usia peserta tidak masuk kelompok umur yang dilombakan.");

        const checkboxesNomor = Array.from(document.querySelectorAll('input[name="nomor_lomba"]:checked'));
        const selectedNomor = checkboxesNomor.map(cb => cb.value);
        if(selectedNomor.length === 0) return alert("Pilih minimal 1 nomor lomba!");

        const fileAkta = document.getElementById('inputAkta').files[0];
        if (requiresAktaUpload && !fileAkta) return alert("Anda wajib mengunggah foto Akta Kelahiran atau KIA!");

        btn.innerHTML = "Mengecek Kuota & Data... ⏳"; 
        btn.disabled = true;

        try {
            // 1. Tarik seluruh data pendaftaran event terkini (untuk cek duplikat + validasi kuota live)
            const { data: allEventRegs, error: errCheck } = await supabaseClient
                .from('event_registrations')
                .select('f1_id, nama_peserta, tanggal_lahir, nomor_lomba, kelompok_umur, gender')
                .eq('event_id', currentEvent.id);

            if (errCheck) throw errCheck;

            // Segarkan peta kuota terbaru dari database
            hitungUlangPetaKuota(allEventRegs || []);

            // 2. Cek apakah atlet sudah terdaftar di nomor yang sama
            let nomorSudahAda = [];
            (allEventRegs || []).forEach(reg => {
                const isSameAthlete = (isKlubLoggedIn && f1_id)
                    ? (reg.f1_id === f1_id)
                    : (reg.nama_peserta === nama_peserta && reg.tanggal_lahir === tanggal_lahir);
                if (isSameAthlete && Array.isArray(reg.nomor_lomba)) {
                    nomorSudahAda.push(...reg.nomor_lomba);
                }
            });

            let nomorBentrok = selectedNomor.filter(n => nomorSudahAda.includes(n));
            if (nomorBentrok.length > 0) {
                btn.innerHTML = "Daftar Individu, Masuk Antrian";
                btn.disabled = false;
                return alert(`❌ GAGAL! Atlet ini sudah pernah didaftarkan di nomor:\n\n${nomorBentrok.join(', ')}\n\nSilakan hilangkan centang pada nomor tersebut jika ingin menambah nomor gaya baru.`);
            }

            // 3. Validasi Live Kuota per Nomor (Per KU & Per Gender / Total)
            let nomorPenuh = [];
            checkboxesNomor.forEach(cb => {
                const namaNomor = cb.value;
                const kuota = Number(cb.getAttribute('data-kuota') || 0);
                const tipeKuota = cb.getAttribute('data-tipe-kuota') || 'per_ku_gender';
                if (kuota > 0) {
                    if (tipeKuota === 'total_nomor') {
                        const terpakai = kuotaMapTotal[namaNomor] || 0;
                        if (terpakai >= kuota) {
                            nomorPenuh.push(`${namaNomor} (Penuh ${terpakai}/${kuota} Total)`);
                        }
                    } else {
                        const key = `${namaNomor}|||${kelompok_umur}|||${gender}`;
                        const terpakai = kuotaMapSpecific[key] || 0;
                        if (terpakai >= kuota) {
                            nomorPenuh.push(`${namaNomor} — ${kelompok_umur} ${gender} (Penuh ${terpakai}/${kuota})`);
                        }
                    }
                }
            });

            if (nomorPenuh.length > 0) {
                updateStatusNomorLomba();
                btn.innerHTML = "Daftar Individu, Masuk Antrian";
                btn.disabled = false;
                return alert(`❌ MAAF, KUOTA PENUH!\n\nNomor berikut baru saja mencapai batas maksimal peserta:\n• ${nomorPenuh.join('\n• ')}\n\nSilakan pilih nomor lain.`);
            }

            // =========================================================
            // KALKULASI TARIF BERJENJANG + NOMOR EKSTRA
            // =========================================================
            const config = currentEvent.config || {};
            let qty = selectedNomor.length;
            let totalBiaya = 0;

            const validTiers = (config.tarif_individu || [])
                .filter(t => Number(t.qty) > 0 && t.price !== '' && t.price !== null && t.price !== undefined)
                .map(t => ({ qty: Number(t.qty), price: Number(t.price) }))
                .sort((a, b) => a.qty - b.qty);

            const extraPrice = Number(config.tarif_tambahan ?? config.biaya_normal ?? 0);

            if (validTiers.length > 0) {
                let maxTier = validTiers[validTiers.length - 1];
                let exactTier = validTiers.find(t => t.qty === qty);
                
                if (exactTier) {
                    totalBiaya = exactTier.price;
                } else if (qty > maxTier.qty) {
                    let basePrice = maxTier.price;
                    let extraQty = qty - maxTier.qty;
                    totalBiaya = basePrice + (extraQty * extraPrice);
                } else {
                    let lowerTier = [...validTiers].reverse().find(t => t.qty < qty);
                    if (lowerTier) {
                        totalBiaya = lowerTier.price + ((qty - lowerTier.qty) * extraPrice);
                    } else {
                        totalBiaya = qty * extraPrice;
                    }
                }
            } else {
                totalBiaya = qty >= Number(config.min_diskon || 999) 
                    ? qty * Number(config.biaya_diskon || 0) 
                    : qty * Number(config.biaya_normal || 0);
            }

            btn.innerHTML = "Menambahkan... ⏳"; 

            let finalAktaUrl = null;
            if (requiresAktaUpload && fileAkta) {
                if (fileAkta.size === 0) throw new Error("File Akta kosong (0 KB). Pilih ulang file dari galeri HP.");
                const readyAkta = await compressImageTo150KB(fileAkta, 180);
                const { fileName, contentType } = buildSafeStorageUploadMeta(readyAkta, 'akta');
                const { error: uploadError } = await supabaseClient.storage.from('verifikasi-akta').upload(fileName, readyAkta, { contentType, upsert: false });
                if (uploadError) throw uploadError;
                const { data: urlData } = supabaseClient.storage.from('verifikasi-akta').getPublicUrl(fileName);
                finalAktaUrl = urlData.publicUrl;
                if (isKlubLoggedIn && f1_id) await supabaseClient.from('athletes').update({ akta_url: finalAktaUrl }).eq('f1_id', f1_id);
            } else if (isKlubLoggedIn) {
                finalAktaUrl = dropdownAtlet.options[dropdownAtlet.selectedIndex].getAttribute('data-akta');
            }

            if (!isKlubLoggedIn && !f1_id) {
                f1_id = await generateOrFindF1Id(supabaseClient, {
                    nama: nama_peserta,
                    dob: tanggal_lahir,
                    gender: gender,
                    aktaUrl: finalAktaUrl
                });
            }

            const { data: insertedData, error: insertError } = await supabaseClient.from('event_registrations').insert([{
                event_id: currentEvent.id, 
                f1_id: f1_id, 
                klub_asal: klub_asal, 
                nama_peserta: nama_peserta,
                tanggal_lahir: tanggal_lahir, 
                gender: gender, 
                kelompok_umur: kelompok_umur,
                nomor_lomba: selectedNomor, 
                akta_url: finalAktaUrl, 
                total_biaya: totalBiaya, 
                status_pembayaran: 'Belum Bayar', 
                whatsapp_tamu: nomor_wa_pic
            }]).select();

            if (insertError) throw insertError;

            if (!isKlubLoggedIn && insertedData && insertedData.length > 0) {
                let guestIds = JSON.parse(localStorage.getItem(`scs_guest_${currentEvent.id}`) || '[]');
                guestIds.push(insertedData[0].id);
                localStorage.setItem(`scs_guest_${currentEvent.id}`, JSON.stringify(guestIds));
            }

            resetFormAtlet();
            checkboxesNomor.forEach(cb => cb.checked = false);
            alert("✅ Individu berhasil dimasukkan ke Daftar Tagihan!");
            
            await refreshKuotaCounter();
            loadTagihan();

        } catch (err) {
            const detailErr = err?.message || err?.error_description || err?.details || "Koneksi internet terputus atau file gagal diunggah. Coba lagi.";
            alert("Terjadi kesalahan sistem: " + detailErr);
        } finally {
            btn.innerHTML = "Daftar Individu, Masuk Antrian"; 
            btn.disabled = false;
        }
    });

    // ==========================================
    // LOGIKA PENDAFTARAN ESTAFET
    // ==========================================
    const btnEstafet = document.getElementById('btnKirimEstafet');
    if(btnEstafet) {
        btnEstafet.addEventListener('click', async () => {
            const valNomor = document.getElementById('inputNomorEstafet').value;
            const valKU = document.getElementById('inputKUEstafet').value;
            
            if(!valNomor || !valKU) return alert("Pilih Kategori Estafet dan Kelompok Umur Tim terlebih dahulu!");
            
            btnEstafet.innerHTML = "Memesan Slot... ⏳";
            btnEstafet.disabled = true;
            
            try {
                const klubName = loggedInClubData.club_name || loggedInClubData.nama_klub;
                const nomorWaPic = loggedInClubData.contact_wa || "Belum Diatur";
                const config = currentEvent.config || {};
                const biayaEstafet = Number(config.biaya_estafet || 0);
                
                const namaTim = `TIM ESTAFET ${klubName.toUpperCase()}`;
                
                const { error: insertError } = await supabaseClient.from('event_registrations').insert([{
                    event_id: currentEvent.id, 
                    f1_id: 'ESTAFET-VVIP', 
                    klub_asal: klubName, 
                    nama_peserta: namaTim,
                    tanggal_lahir: new Date().toISOString().split('T')[0], 
                    gender: 'Regu/Tim', 
                    kelompok_umur: valKU,
                    nomor_lomba: [valNomor], 
                    akta_url: null, 
                    total_biaya: biayaEstafet, 
                    status_pembayaran: 'Belum Bayar', 
                    whatsapp_tamu: nomorWaPic
                }]);

                if (insertError) throw insertError;
                
                alert("✅ Tiket Slot Estafet berhasil dimasukkan ke Daftar Tagihan di bawah!");
                
                document.getElementById('inputNomorEstafet').value = "";
                document.getElementById('inputKUEstafet').value = "";
                
                await refreshKuotaCounter();
                loadTagihan();

            } catch (err) {
                alert("Gagal memesan estafet: " + err.message);
            } finally {
                btnEstafet.innerHTML = "Pesan Slot Estafet";
                btnEstafet.disabled = false;
            }
        });
    }

    function resetFormAtlet() {
        document.getElementById('inputCariAtlet').value = "";
        document.getElementById('inputTglLahir').value = "";
        document.getElementById('inputAutoKU').value = "";
        document.getElementById('inputGender').value = "";
        document.getElementById('inputAkta').value = "";
        document.getElementById('areaAkta').classList.add('hidden'); 
        if(isKlubLoggedIn) document.getElementById('dropdownAtlet').value = "";
        
        if(!isKlubLoggedIn) {
            document.getElementById('inputTglLahir').readOnly = false;
            document.getElementById('inputTglLahir').classList.remove('bg-slate-200', 'pointer-events-none');
            document.getElementById('inputGender').classList.remove('bg-slate-200', 'pointer-events-none');
            document.getElementById('areaAkta').classList.remove('hidden'); 
        }

        document.querySelectorAll('input[name="nomor_lomba"]').forEach(cb => {
            cb.checked = false;
        });
        updateStatusNomorLomba();
    }

    // ==========================================
    // SISTEM KERANJANG & PEMBAYARAN KOLEKTIF
    // ==========================================
    async function loadTagihan() {
        if (!currentEvent) return;

        let query = supabaseClient.from('event_registrations').select('*').eq('event_id', currentEvent.id).order('created_at', { ascending: false }); 
        
        if (isKlubLoggedIn) {
            const namaKlub = loggedInClubData.club_name || loggedInClubData.nama_klub;
            query = query.eq('klub_asal', namaKlub);
        } else {
            const guestIds = JSON.parse(localStorage.getItem(`scs_guest_${currentEvent.id}`) || '[]');
            if (guestIds.length === 0) {
                document.getElementById('areaPembayaran').classList.add('hidden');
                return;
            }
            query = query.in('id', guestIds);
        }

        const { data, error } = await query;
        if (error) return console.error(error);

        dataTagihan = data || [];
        renderDaftarTagihan();
    }

    function renderDaftarTagihan() {
        const area = document.getElementById('areaPembayaran');
        const container = document.getElementById('listTagihanContainer');
        container.innerHTML = '';
        selectedTagihanIds.clear(); 
        kalkulasiTotalBayar();

        if (dataTagihan.length === 0) {
            area.classList.add('hidden'); 
            return;
        }

        area.classList.remove('hidden');

        dataTagihan.forEach(item => {
            const card = document.createElement('div');
            card.className = "card-tagihan bg-white border border-slate-200 rounded-2xl p-4 flex gap-3 items-start shadow-sm transition-all hover:border-blue-300";
            
            let arrayNomor = item.nomor_lomba || [];
            let listNomor = arrayNomor.map(n => typeof n === 'object' ? n.gaya : n).join(', ');

            const isBelumBayar = item.status_pembayaran === 'Belum Bayar';
            const isLunas = item.status_pembayaran === 'Lunas';
            const isMenunggu = item.status_pembayaran === 'Menunggu Konfirmasi';

            let checkboxHtml = '';
            let statusBadge = '';
            let aksiHtml = '';

            if (isBelumBayar) {
                checkboxHtml = `<input type="checkbox" value="${item.id}" class="chk-tagihan w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5">`;
                aksiHtml = `<button data-id="${item.id}" class="btn-hapus-tagihan text-red-500 hover:text-white hover:bg-red-500 bg-red-50 px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-sm"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>Hapus</button>`;
            } else if (isLunas) {
                checkboxHtml = `<div class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[10px] mt-0.5">✓</div>`;
                statusBadge = `<span class="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[9px] font-extrabold ml-2 uppercase tracking-wider">LUNAS</span>`;
            } else if (isMenunggu) {
                checkboxHtml = `<div class="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-[10px] mt-0.5">⏳</div>`;
                statusBadge = `<span class="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[9px] font-extrabold ml-2 uppercase tracking-wider">PROSES</span>`;
            }

            let badgeTipe = item.gender === 'Regu/Tim' ? `<span class="bg-purple-100 text-purple-800 text-[9px] font-bold px-2 py-0.5 rounded">REGU</span>` : '';

            card.innerHTML = `
                <div class="shrink-0 pt-0.5">
                    ${checkboxHtml}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start gap-3">
                        <div>
                            <h3 class="font-extrabold text-slate-800 text-sm leading-tight flex items-center flex-wrap gap-1">${item.nama_peserta} ${statusBadge}</h3>
                            <p class="text-[10px] text-slate-500 font-medium mt-1 truncate">${item.klub_asal} • KU ${item.kelompok_umur}</p>
                        </div>
                        <div class="text-right shrink-0 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                            <p class="text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-0.5">Biaya</p>
                            <p class="font-black text-blue-800 text-sm leading-none">Rp ${Number(item.total_biaya).toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                    
                    <div class="mt-3 bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-1.5">
                                ${badgeTipe}
                                <span class="bg-slate-200 text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded">${arrayNomor.length} Nomor</span>
                            </div>
                            ${aksiHtml}
                        </div>
                        <p class="text-[10px] text-slate-600 font-medium leading-relaxed">${listNomor}</p>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        document.querySelectorAll('.chk-tagihan').forEach(chk => {
            chk.addEventListener('change', (e) => {
                if(e.target.checked) selectedTagihanIds.add(e.target.value);
                else selectedTagihanIds.delete(e.target.value);
                kalkulasiTotalBayar();
            });
        });

        const btnCheckAll = document.getElementById('checkAllTagihan');
        if(btnCheckAll) {
            btnCheckAll.checked = false;
            btnCheckAll.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                document.querySelectorAll('.chk-tagihan').forEach(chk => {
                    chk.checked = isChecked;
                    if(isChecked) selectedTagihanIds.add(chk.value);
                    else selectedTagihanIds.delete(chk.value);
                });
                kalkulasiTotalBayar();
            });
        }

        document.querySelectorAll('.btn-hapus-tagihan').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if(!confirm("Yakin ingin menghapus antrian ini dari keranjang?")) return;
                
                const cardNode = e.currentTarget.closest('.card-tagihan');
                cardNode.style.opacity = '0.4';
                cardNode.style.pointerEvents = 'none';

                try {
                    const { error } = await supabaseClient.from('event_registrations').delete().eq('id', id);
                    if (error) throw error;
                    
                    if (!isKlubLoggedIn) {
                        let guestIds = JSON.parse(localStorage.getItem(`scs_guest_${currentEvent.id}`) || '[]');
                        guestIds = guestIds.filter(gId => gId !== id);
                        localStorage.setItem(`scs_guest_${currentEvent.id}`, JSON.stringify(guestIds));
                    }
                    loadTagihan(); 
                    await refreshKuotaCounter();

                } catch (err) {
                    alert("Gagal menghapus data: " + err.message);
                    cardNode.style.opacity = '1';
                    cardNode.style.pointerEvents = 'auto';
                }
            });
        });
    }

    function kalkulasiTotalBayar() {
        let total = 0;
        dataTagihan.forEach(item => {
            if (selectedTagihanIds.has(item.id)) total += Number(item.total_biaya);
        });
        document.getElementById('teksTotalTagihan').innerText = `Rp ${total.toLocaleString('id-ID')}`;
        
        const btnKonfirmasi = document.getElementById('btnKonfirmasiBayar');
        btnKonfirmasi.disabled = selectedTagihanIds.size === 0;

        const inputBuktiContainer = document.getElementById('inputBuktiTransfer').parentElement;
        if (total === 0 && selectedTagihanIds.size > 0) {
            btnKonfirmasi.innerText = "Konfirmasi Pendaftaran (Gratis)";
            inputBuktiContainer.classList.add('hidden'); 
        } else {
            btnKonfirmasi.innerText = "Konfirmasi Pembayaran";
            inputBuktiContainer.classList.remove('hidden'); 
        }
    }

    document.getElementById('btnKonfirmasiBayar').addEventListener('click', async () => {
        let total = 0;
        dataTagihan.forEach(item => {
            if (selectedTagihanIds.has(item.id)) total += Number(item.total_biaya);
        });

        const fileStruk = document.getElementById('inputBuktiTransfer').files[0];
        if (total > 0 && !fileStruk) return alert("Wajib mengunggah foto Bukti Transfer!");

        const btn = document.getElementById('btnKonfirmasiBayar');
        btn.innerText = total === 0 ? "Memproses Pendaftaran... ⏳" : "Mengunggah Struk... ⏳"; 
        btn.disabled = true;

        try {
            let strukUrl = null;
            let statusBayar = 'Lunas'; 

            if (total > 0) {
                statusBayar = 'Menunggu Konfirmasi';
                if (fileStruk.size === 0) throw new Error("File Bukti Transfer kosong (0 KB). Pilih ulang file dari galeri HP.");
                const readyStruk = await compressImageTo150KB(fileStruk, 180);
                const { fileName, contentType } = buildSafeStorageUploadMeta(readyStruk, 'struk');
                const { error: uploadError } = await supabaseClient.storage.from('bukti-transfer').upload(fileName, readyStruk, { contentType, upsert: false });
                if (uploadError) throw uploadError;
                const { data: urlData } = supabaseClient.storage.from('bukti-transfer').getPublicUrl(fileName);
                strukUrl = urlData.publicUrl;
            }

            const listIds = Array.from(selectedTagihanIds);
            const { error: updateError } = await supabaseClient.from('event_registrations').update({ status_pembayaran: statusBayar, bukti_transfer_url: strukUrl }).in('id', listIds);
            if (updateError) throw updateError;

            if (total === 0) alert("✅ Pendaftaran berhasil! Status langsung Lunas (Gratis).");
            else alert("✅ Pembayaran berhasil dikirim! Silakan tunggu konfirmasi panitia.");
            
            document.getElementById('inputBuktiTransfer').value = "";
            loadTagihan(); 

        } catch (err) {
            alert("Gagal memproses: " + err.message);
        } finally {
            btn.innerText = total === 0 ? "Konfirmasi Pendaftaran (Gratis)" : "Konfirmasi Pembayaran"; 
            btn.disabled = false;
        }
    });
});
