import { supabaseClient } from './supabase.js';

let currentEvent = null; 
let isKlubLoggedIn = false; 
let loggedInClubData = null; 
let dataTagihan = []; 
let selectedTagihanIds = new Set(); 

document.addEventListener('DOMContentLoaded', async () => {
    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];
    
    // Jangan lupa komen baris di bawah ini kalau sudah online!
    // const subdomain = 'fs-samawa'; 

    if (!subdomain || subdomain === 'f1swimming' || subdomain === 'localhost') return; 

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
            
            const mainContainer = document.querySelector('.max-w-2xl.mx-auto.px-4.mt-6');
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

        const namaKota = eventData.kota || '';
        const namaProvinsi = eventData.provinsi || '';
        const namaKolam = config.nama_kolam || '';
        let teksLokasiLengkap = '';
        if (namaKolam) teksLokasiLengkap += `${namaKolam}`; // Di Info strip dibikin singkat aja
        else if (namaKota) teksLokasiLengkap += `${namaKota}`;
        else teksLokasiLengkap = 'Lokasi blm diset';
        
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

        if (config.tarif_individu && config.tarif_individu.length > 0) {
            let textTarif = "<span class='font-bold opacity-80'>Pendaftaran Individu:</span><br>";
            let sortedTiers = [...config.tarif_individu].sort((a,b) => a.qty - b.qty);
            
            sortedTiers.forEach(t => {
                textTarif += `• ${t.qty} Nomor = Rp ${Number(t.price).toLocaleString('id-ID')}<br>`;
            });

            if (config.tarif_tambahan) {
                let maxQty = sortedTiers[sortedTiers.length - 1].qty;
                textTarif += `<span class="text-[10.5px] text-blue-200 mt-1 inline-block border-t border-blue-800/50 pt-1 w-full">💡 Lebih dari ${maxQty} nomor: +Rp ${Number(config.tarif_tambahan).toLocaleString('id-ID')} / nomor ekstra.</span>`;
            }

            infoBiayaNormal.innerHTML = textTarif;
            if(infoDiskon) infoDiskon.classList.add('hidden'); 
            hargaStripTampil = `Mulai Rp ${Number(sortedTiers[0].price).toLocaleString('id-ID')}`;
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

        // SET BIAYA DI INFO STRIP
        const elStripBiaya = document.getElementById('stripBiaya');
        if (elStripBiaya) elStripBiaya.innerText = hargaStripTampil;
        
        // BIAYA ESTAFET
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
        // 2. STATISTIK REAL DARI DATABASE
        // =========================================================
        try {
            const { count: countPeserta } = await supabaseClient.from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', currentEvent.id);
            document.getElementById('stripPeserta').innerText = `${countPeserta || 0} Terdaftar`;
        } catch (err) { console.error("Stats Error"); }

        // =========================================================
        // RENDER KELOMPOK UMUR & GAYA INDIVIDU
        // =========================================================
        const kuList = eventData.config_ku || [];
        document.getElementById('inputTglLahir').addEventListener('change', (e) => {
            const tahunLahir = new Date(e.target.value).getFullYear();
            if (isNaN(tahunLahir)) return;
            const matchedKU = kuList.find(ku => tahunLahir >= Number(ku.tahunMulai) && tahunLahir <= Number(ku.tahunAkhir));
            document.getElementById('inputAutoKU').value = matchedKU ? matchedKU.nama : "Di Luar Rentang KU";
        });

        const gayaList = eventData.config_gaya || [];
        const containerGaya = document.getElementById('containerNomorLomba');
        containerGaya.innerHTML = '';

        gayaList.forEach(gaya => {
            let jarakHTML = '';
            (gaya.jarak || []).forEach(jrk => {
                if(jrk.aktif) {
                    jarakHTML += `
                        <label class="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-blue-50 transition-colors">
                            <input type="checkbox" name="nomor_lomba" value="${gaya.nama} ${jrk.nama}" class="w-4 h-4 text-blue-600 rounded">
                            ${jrk.nama}
                        </label>
                    `;
                }
            });
            if(jarakHTML) {
                containerGaya.innerHTML += `
                    <div class="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                        <p class="font-extrabold text-blue-900 text-xs mb-2">${gaya.nama}</p>
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">${jarakHTML}</div>
                    </div>
                `;
            }
        });

        // =========================================================
        // RENDER DROPDOWN ESTAFET (KOSONGAN TIKET)
        // =========================================================
        const estafetList = eventData.config_estafet || [];
        const selectEstafet = document.getElementById('inputNomorEstafet');
        if (selectEstafet) {
            selectEstafet.innerHTML = '<option value="">-- Pilih Kategori & Jarak Estafet --</option>';
            estafetList.forEach(estafet => {
                (estafet.list || []).forEach(item => {
                    if(item.aktif) {
                        selectEstafet.innerHTML += `<option value="${estafet.nama} ${item.jarak} (${item.jenis})">${estafet.nama} - ${item.jarak} ${item.jenis}</option>`;
                    }
                });
            });
        }

        const selectKUEstafet = document.getElementById('inputKUEstafet');
        if (selectKUEstafet) {
            selectKUEstafet.innerHTML = '<option value="">-- Tentukan KU Regu --</option>';
            kuList.forEach(ku => {
                if(ku.aktif) {
                    selectKUEstafet.innerHTML += `<option value="${ku.nama}">${ku.nama} (${ku.tahunMulai}-${ku.tahunAkhir})</option>`;
                }
            });
        }

        // =========================================================
        // OTOMATIS CEK SESSION (GOOGLE AUTH SUCCESS)
        // =========================================================
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            await applySuccessfulLoginUI(session.user.id);
        }

        loadTagihan();

    } catch (err) {
        alert(err.message);
    }
  
    // ==========================================
    // LOGIKA LOGIN GOOGLE (SEAMLESS UX - NO REDIRECT)
    // ==========================================
    const btnGoogleLoginPublic = document.getElementById('btnGoogleLoginPublic');
    if (btnGoogleLoginPublic) {
        
        // Ubah button HTML jadi container kosong biar bisa di-inject tombol Google resmi
        btnGoogleLoginPublic.innerHTML = ''; 
        btnGoogleLoginPublic.className = 'flex justify-center w-full mb-2';

        const renderGoogleButtonPublic = () => {
            if (typeof google === 'undefined' || !google.accounts) {
                setTimeout(renderGoogleButtonPublic, 100); 
                return;
            }

            // 1. Inisialisasi Google Auth (Sama persis dengan auth.js)
            google.accounts.id.initialize({
                client_id: '1047924463495-3virdj082194chl013ia1js0ls8c99rv.apps.googleusercontent.com',
                callback: async (response) => {
                    try {
                        const { data, error } = await supabaseClient.auth.signInWithIdToken({
                            provider: 'google',
                            token: response.credential,
                        });

                        if (error) throw error;
                        
                        // 2. INI "THE BEHAVIOR" NYA BRAY! 
                        // Langsung tembak UI pendaftaran tanpa window.location.replace
                        await applySuccessfulLoginUI(data.user.id);
                        
                    } catch (err) {
                        alert("Gagal sinkronisasi Google: " + err.message);
                    }
                }
            });

            // 3. Render tombol Google menyesuaikan lebar container
            google.accounts.id.renderButton(
                btnGoogleLoginPublic, 
                { 
                    theme: "outline", 
                    size: "large", 
                    text: "continue_with",
                    shape: "rectangular",
                    width: btnGoogleLoginPublic.offsetWidth || 300 // Responsive width
                } 
            );
        };

        renderGoogleButtonPublic();
    }


    // ==========================================
    // TOGGLE & LOGIKA LOGIN MANUAL EMAIL (FALLBACK)
    // ==========================================
    document.getElementById('btnToggleManualLogin').addEventListener('click', () => {
        document.getElementById('areaLogin').classList.toggle('hidden');
    });

    document.getElementById('btnProsesLogin').addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const btnLogin = document.getElementById('btnProsesLogin');

        if(!email || !password) return alert("Email dan Password wajib diisi!");
        
        btnLogin.innerText = "Mengecek data..."; 
        btnLogin.disabled = true;

        try {
            const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (authError) throw authError;

            await applySuccessfulLoginUI(authData.user.id);
            alert("Login berhasil!");
        } catch (err) {
            alert("Gagal login: " + err.message);
        } finally {
            btnLogin.innerText = "Masuk & Sinkronisasi"; 
            btnLogin.disabled = false;
        }
    });

    // LOGOUT
    document.getElementById('btnLogout').addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.reload();
    });

    // ==========================================
    // FUNGSI GLOBAL APLIKASI UI SETELAH LOGIN
    // ==========================================
    async function applySuccessfulLoginUI(userId) {
        try {
            const { data: clubData, error: clubErr } = await supabaseClient.from('clubs').select('*').eq('owner_id', userId).single();
            if (clubErr || !clubData) throw new Error("Data profil klub tidak ditemukan untuk akun ini.");
            
            isKlubLoggedIn = true;
            loggedInClubData = clubData;

            const { data: athletes, error: athErr } = await supabaseClient.from('athletes').select('*').eq('club_id', clubData.id).order('full_name', { ascending: true });
            if (athErr) throw athErr;

            // HIDE Quick Access Login
            document.getElementById('sectionAksesCepat').classList.add('hidden');
            
            // SHOW Badge Klub Aktif
            const badge = document.getElementById('activeClubBadge');
            badge.classList.remove('hidden');
            badge.classList.add('flex');
            
            const namaKlub = clubData.club_name || clubData.nama_klub || "Klub Terdaftar SCS";
            const avatarUrl = clubData.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(namaKlub)}&background=1e3a8a&color=fff`;
            
            document.getElementById('activeClubName').innerText = namaKlub;
            document.getElementById('activeClubLogo').src = avatarUrl;

            // Atur Visibilitas Form Input
            document.getElementById('areaGuestOnly').classList.add('hidden'); 
            document.getElementById('areaAkta').classList.add('hidden');
            
            // MUNCULIN FORM ESTAFET KARENA SUDAH LOGIN VVIP
            const areaEstafet = document.getElementById('areaEstafetVVIP');
            if(areaEstafet) areaEstafet.classList.remove('hidden');
            
            // Switch Input Manual Name ke Dropdown Atlet
            document.getElementById('inputCariAtlet').classList.add('hidden');
            const dropdown = document.getElementById('dropdownAtlet');
            dropdown.classList.remove('hidden');

            dropdown.innerHTML = '<option value="">-- Pilih Peserta dari Data Kamu --</option>';
            (athletes || []).forEach(atlet => {
                const tgl = atlet.dob || ''; 
                const jk = atlet.gender || ''; 
                const akta = atlet.akta_url || ''; 
                dropdown.innerHTML += `<option value="${atlet.f1_id}" data-name="${atlet.full_name}" data-tgl="${tgl}" data-gender="${jk}" data-akta="${akta}">${atlet.full_name} (${atlet.f1_id})</option>`;
            });

            loadTagihan();
        } catch (err) {
            console.error("Gagal build UI pasca-login:", err);
            // Kalau misal error gagal ambil profil klub, kita logout aja biar ga stuck
            await supabaseClient.auth.signOut();
        }
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
        if (requiresAktaUpload && !fileAkta) return alert("Anda wajib mengunggah foto Akta Kelahiran!");

        btn.innerHTML = "Mengecek Data... ⏳"; 
        btn.disabled = true;

        try {
            let checkQuery = supabaseClient.from('event_registrations').select('nomor_lomba').eq('event_id', currentEvent.id);
            if (isKlubLoggedIn && f1_id) checkQuery = checkQuery.eq('f1_id', f1_id);
            else checkQuery = checkQuery.eq('nama_peserta', nama_peserta).eq('tanggal_lahir', tanggal_lahir);

            const { data: existingRegs, error: errCheck } = await checkQuery;
            if (errCheck) throw errCheck;

            let nomorSudahAda = [];
            if (existingRegs && existingRegs.length > 0) {
                existingRegs.forEach(reg => {
                    if (Array.isArray(reg.nomor_lomba)) nomorSudahAda.push(...reg.nomor_lomba);
                });
            }

            let nomorBentrok = selectedNomor.filter(n => nomorSudahAda.includes(n));
            if (nomorBentrok.length > 0) {
                btn.innerHTML = "Daftar Individu, Masuk Antrian";
                btn.disabled = false;
                return alert(`❌ GAGAL! Atlet ini sudah pernah didaftarkan di nomor:\n\n${nomorBentrok.join(', ')}\n\nSilakan hilangkan centang pada nomor tersebut jika ingin menambah nomor gaya baru.`);
            }

            // KALKULASI TAGIHAN
            const config = currentEvent.config || {};
            let qty = selectedNomor.length;
            let totalBiaya = 0;

            if (config.tarif_individu && config.tarif_individu.length > 0) {
                let sortedTiers = [...config.tarif_individu].sort((a,b) => a.qty - b.qty);
                let maxTier = sortedTiers[sortedTiers.length - 1];
                let exactTier = sortedTiers.find(t => t.qty == qty);
                
                if (exactTier) {
                    totalBiaya = Number(exactTier.price);
                } else if (qty > maxTier.qty) {
                    let basePrice = Number(maxTier.price);
                    let extraQty = qty - maxTier.qty;
                    let extraPrice = Number(config.tarif_tambahan || 0);
                    totalBiaya = basePrice + (extraQty * extraPrice);
                } else {
                    let lowerTier = sortedTiers.slice().reverse().find(t => t.qty < qty);
                    if(lowerTier) {
                        totalBiaya = Number(lowerTier.price) + ((qty - lowerTier.qty) * Number(config.tarif_tambahan || 0));
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
                const fileExt = fileAkta.name.split('.').pop();
                const fileName = `akta_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const { error: uploadError } = await supabaseClient.storage.from('verifikasi-akta').upload(fileName, fileAkta);
                if (uploadError) throw uploadError;
                const { data: urlData } = supabaseClient.storage.from('verifikasi-akta').getPublicUrl(fileName);
                finalAktaUrl = urlData.publicUrl;
                if (isKlubLoggedIn && f1_id) await supabaseClient.from('athletes').update({ akta_url: finalAktaUrl }).eq('f1_id', f1_id);
            } else if (isKlubLoggedIn) {
                finalAktaUrl = dropdownAtlet.options[dropdownAtlet.selectedIndex].getAttribute('data-akta');
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
            
            const { count } = await supabaseClient.from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', currentEvent.id);
            document.getElementById('stripPeserta').innerText = `${count || 0} Terdaftar`;

            loadTagihan();

        } catch (err) {
            alert("Terjadi kesalahan sistem: " + err.message);
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
        document.querySelectorAll('input[name="nomor_lomba"]:checked').forEach(cb => cb.checked = false);
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
            let listNomor = arrayNomor.join(', ');

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
                    
                    const { count } = await supabaseClient.from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', currentEvent.id);
                    document.getElementById('stripPeserta').innerText = `${count || 0} Terdaftar`;

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
                const fileExt = fileStruk.name.split('.').pop();
                const fileName = `struk_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const { error: uploadError } = await supabaseClient.storage.from('bukti-transfer').upload(fileName, fileStruk);
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
