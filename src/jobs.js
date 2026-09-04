document.addEventListener('DOMContentLoaded', () => {
    // State penyimpanan data pelamar
    let userAnswers = { 
        namaLengkap: '',
        namaPanggilan: '',
        email: '',
        divisi: '', 
        tech: '', 
        kondisi: '' 
    };

    // FUNGSI ANIMASI TRANSISI SLIDE
    window.nextSlide = function(currentId, nextId) {
        const currentSlide = document.getElementById(currentId);
        const nextSlide = document.getElementById(nextId);

        // Animate out current
        currentSlide.classList.remove('translate-x-0', 'opacity-100');
        currentSlide.classList.add('-translate-x-10', 'opacity-0');

        setTimeout(() => {
            currentSlide.classList.add('hidden');
            currentSlide.classList.remove('block');
            
            nextSlide.classList.remove('hidden');
            nextSlide.classList.add('block');
            
            // Trigger reflow biar animasinya jalan
            void nextSlide.offsetWidth;

            // Animate in next
            nextSlide.classList.remove('translate-x-10', 'opacity-0');
            nextSlide.classList.add('translate-x-0', 'opacity-100');
        }, 300);
    };

    // FUNGSI VALIDASI & SIMPAN DATA DIRI
    window.simpanDataDiri = function(currentId, nextId) {
        const nl = document.getElementById('inputNamaLengkap').value.trim();
        const np = document.getElementById('inputNamaPanggilan').value.trim();
        const em = document.getElementById('inputEmail').value.trim();
        const errAlert = document.getElementById('errorDataDiri');

        // Validasi Kosong
        if (!nl || !np || !em) {
            errAlert.classList.remove('hidden');
            return;
        }

        // Kalau lolos, sembunyikan error dan simpan ke state
        errAlert.classList.add('hidden');
        userAnswers.namaLengkap = nl;
        userAnswers.namaPanggilan = np;
        userAnswers.email = em;

        window.nextSlide(currentId, nextId);
    };

    window.pilihDivisi = function(val, current, next) {
        userAnswers.divisi = val;
        
        // Aturan Khusus 1: Jika Akunting, Langsung On-Site & In-House
        if (val === 'akunting') {
            window.hitungHasil('onsite', current);
        } else {
            window.nextSlide(current, next);
        }
    };

    window.pilihTech = function(val, current, next) {
        userAnswers.tech = val;
        window.nextSlide(current, next);
    };

    window.hitungHasil = function(kondisiVal, current) {
        userAnswers.kondisi = kondisiVal;
        
        const targetHasil = document.getElementById('textHasil');
        let isInHouse = false;
        let laporanWA = "";

        // ==========================================
        // LOGIKA CORE PENENTUAN TIPE KERJA (The Brain)
        // ==========================================
        if (userAnswers.divisi === 'akunting') {
            isInHouse = true; // Mutlak In-House
        } else if (userAnswers.kondisi === 'onsite') {
            isInHouse = true; // Siap ke Surabaya = In-House
        } else if (userAnswers.divisi === 'dev' && userAnswers.tech === 'game') {
            isInHouse = true; // Developer Roblox wajib ditarik ke markas untuk integrasi core
        }

        // ==========================================
        // RENDER OUTPUT UI BERDASARKAN HASIL
        // ==========================================
        let detailPosisi = "";
        let badgeDivisi = userAnswers.divisi.toUpperCase().replace('-', ' ');
        let sapaan = userAnswers.namaPanggilan ? `Halo Kak ${userAnswers.namaPanggilan}! ` : '';

        if (isInHouse) {
            if (userAnswers.divisi === 'akunting') {
                detailPosisi = "Mengelola arus keuangan event F1 Swimming, audit dana stimulus korporat, dan validasi rekonsiliasi payment gateway (QRIS/VA).";
            } else if (userAnswers.divisi === 'admin-ads' || userAnswers.divisi === 'marketing-ads') {
                detailPosisi = "Mengelola arsitektur kampanye iklan digital secara terpusat, memantau ROI promosi corporate, serta eksekusi Growth Hacking langsung di Command Center.";
            } else if (userAnswers.divisi === 'dev') {
                detailPosisi = "Mengawal transisi core system web, arsitektur database Supabase, hingga interkoneksi dunia virtual game Roblox.";
            }

            targetHasil.innerHTML = `
                <div class="bg-gradient-to-br from-emerald-900/40 to-slate-900 border-l-4 border-emerald-500 rounded-r-2xl p-5 shadow-lg relative overflow-hidden">
                    <div class="absolute -right-4 -bottom-4 text-6xl opacity-10">🏢</div>
                    <div class="inline-block bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-1 rounded mb-3 uppercase tracking-widest border border-emerald-500/30">
                        Penempatan: In-House Team
                    </div>
                    <h3 class="text-xl font-black text-white mb-2">${badgeDivisi}</h3>
                    <p class="text-sm font-bold text-emerald-400 mb-2">${sapaan}</p>
                    <p class="text-xs text-slate-400 leading-relaxed mb-4">${detailPosisi}</p>
                    
                    <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <p class="text-[10px] text-slate-500 font-bold uppercase mb-1">Langkah Berikutnya:</p>
                        <p class="text-xs text-slate-300">Tim HR kami sedang memvalidasi CV Anda. Undangan wawancara tatap muka di Kantor Surabaya akan dikirimkan via email atau WhatsApp.</p>
                    </div>
                </div>
            `;

            laporanWA = `Halo Tim HR F1 Swimming, saya telah mengisi pemetaan karir di portal rekrutmen.\n\n*DATA KANDIDAT*\n- Nama Lengkap: ${userAnswers.namaLengkap}\n- Panggilan: ${userAnswers.namaPanggilan}\n- Email: ${userAnswers.email}\n\n*HASIL PENEMPATAN SISTEM*\n- Proyeksi: IN-HOUSE TEAM (Surabaya)\n- Divisi: ${badgeDivisi}\n\nSaya menunggu kabar baik dari evaluasi CV saya. Terima kasih!`;

        } else {
            if (userAnswers.divisi === 'admin-ads' || userAnswers.divisi === 'marketing-ads') {
                detailPosisi = "Menangani setup ads taktis per-event secara remote, optimalisasi copywriting media sosial, dan pelaporan metrik (CTR/Impressions) secara berkala.";
            } else if (userAnswers.divisi === 'dev') {
                detailPosisi = "Pengerjaan modul fitur mandiri secara terpisah seperti Pitching Generator client page, slicing UI Tailwind, atau maintenance skrip sistem.";
            }

            targetHasil.innerHTML = `
                <div class="bg-gradient-to-br from-amber-900/40 to-slate-900 border-l-4 border-amber-500 rounded-r-2xl p-5 shadow-lg relative overflow-hidden">
                    <div class="absolute -right-4 -bottom-4 text-6xl opacity-10">💻</div>
                    <div class="inline-block bg-amber-500/20 text-amber-400 text-[10px] font-black px-2 py-1 rounded mb-3 uppercase tracking-widest border border-amber-500/30">
                        Penempatan: Freelance Partner
                    </div>
                    <h3 class="text-xl font-black text-white mb-2">${badgeDivisi}</h3>
                    <p class="text-sm font-bold text-amber-400 mb-2">${sapaan}</p>
                    <p class="text-xs text-slate-400 leading-relaxed mb-4">${detailPosisi}</p>
                    
                    <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <p class="text-[10px] text-slate-500 font-bold uppercase mb-1">Langkah Berikutnya:</p>
                        <p class="text-xs text-slate-300">Kontrak kerja berbasis proyek (PKS) remote akan disiapkan secara digital setelah CV Anda terverifikasi oleh tim pusat kami.</p>
                    </div>
                </div>
            `;

            laporanWA = `Halo Tim HR F1 Swimming, saya telah mengisi pemetaan karir di portal rekrutmen.\n\n*DATA KANDIDAT*\n- Nama Lengkap: ${userAnswers.namaLengkap}\n- Panggilan: ${userAnswers.namaPanggilan}\n- Email: ${userAnswers.email}\n\n*HASIL PENEMPATAN SISTEM*\n- Proyeksi: FREELANCE / REMOTE\n- Divisi: ${badgeDivisi}\n\nSaya menunggu kabar baik dari evaluasi CV saya. Terima kasih!`;
        }

        // Binding tombol WA Lapor
        const btnLapor = document.getElementById('btnLaporWA');
        btnLapor.onclick = () => {
            const phone = "6289691219977"; // WA F1 Swimming / Tim HR
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(laporanWA)}`, '_blank');
        };

        window.nextSlide(current, 'slideHasil');
    };

    window.resetQuiz = function() {
        // Reset input form visual
        document.getElementById('inputNamaLengkap').value = '';
        document.getElementById('inputNamaPanggilan').value = '';
        document.getElementById('inputEmail').value = '';
        document.getElementById('errorDataDiri').classList.add('hidden');

        // Reset state di background
        userAnswers = { namaLengkap: '', namaPanggilan: '', email: '', divisi: '', tech: '', kondisi: '' };
        
        const currentSlide = document.getElementById('slideHasil');
        const nextSlide = document.getElementById('slide1');

        currentSlide.classList.remove('translate-x-0', 'opacity-100');
        currentSlide.classList.add('translate-x-10', 'opacity-0');

        setTimeout(() => {
            currentSlide.classList.add('hidden');
            currentSlide.classList.remove('block');
            
            nextSlide.classList.remove('hidden');
            nextSlide.classList.add('block');
            
            nextSlide.classList.remove('-translate-x-10', 'translate-x-10');
            nextSlide.classList.add('-translate-x-10');
            
            void nextSlide.offsetWidth;

            nextSlide.classList.remove('-translate-x-10', 'opacity-0');
            nextSlide.classList.add('translate-x-0', 'opacity-100');
        }, 300);
    };
});