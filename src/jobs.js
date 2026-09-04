document.addEventListener('DOMContentLoaded', () => {
    // Penampung data jawaban
    let userAnswers = { 
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
            isInHouse = true; // Mutlak
        } else if (userAnswers.kondisi === 'onsite') {
            isInHouse = true; // Siap ke Surabaya = In-House
        } else if (userAnswers.divisi === 'dev' && userAnswers.tech === 'game') {
            isInHouse = true; // Developer Roblox wajib ditarik ke markas untuk integrasi core
        }

        // ==========================================
        // RENDER OUTPUT UI BERDASARKAN HASIL
        // ==========================================
        if (isInHouse) {
            let detailPosisi = "";
            let badgeDivisi = userAnswers.divisi.toUpperCase().replace('-', ' ');

            if (userAnswers.divisi === 'akunting') {
                detailPosisi = "Mengelola arus keuangan event SCS, audit dana stimulus korporat, dan validasi rekonsiliasi payment gateway (QRIS/VA).";
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
                    <h3 class="text-xl font-black text-white mb-1">${badgeDivisi}</h3>
                    <p class="text-xs text-slate-400 leading-relaxed mb-4">${detailPosisi}</p>
                    
                    <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <p class="text-[10px] text-slate-500 font-bold uppercase mb-1">Langkah Berikutnya:</p>
                        <p class="text-xs text-slate-300">Tim internal kami sedang memvalidasi CV Anda. Undangan wawancara tatap muka di Kantor Surabaya akan dikirimkan via email atau WhatsApp.</p>
                    </div>
                </div>
            `;

            laporanWA = `Halo Tim HR F1 Swimming, saya telah mengisi pemetaan karir di portal rekrutmen.\n\nSistem memproyeksikan saya untuk masuk ke dalam tim *IN-HOUSE* pada divisi *${badgeDivisi}*.\n\nSaya siap untuk dijadwalkan sesi interview lanjutan. Terima kasih!`;

        } else {
            let detailPosisi = "";
            let badgeDivisi = userAnswers.divisi.toUpperCase().replace('-', ' ');

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
                    <h3 class="text-xl font-black text-white mb-1">${badgeDivisi}</h3>
                    <p class="text-xs text-slate-400 leading-relaxed mb-4">${detailPosisi}</p>
                    
                    <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <p class="text-[10px] text-slate-500 font-bold uppercase mb-1">Langkah Berikutnya:</p>
                        <p class="text-xs text-slate-300">Kontrak kerja berbasis proyek (PKS) remote akan disiapkan secara digital setelah CV Anda terverifikasi oleh tim pusat kami.</p>
                    </div>
                </div>
            `;

            laporanWA = `Halo Tim HR F1 Swimming, saya telah mengisi pemetaan karir di portal rekrutmen.\n\nSistem memproyeksikan saya untuk posisi *FREELANCE / REMOTE* pada divisi *${badgeDivisi}*.\n\nSaya menunggu kabar baik dari evaluasi CV saya. Terima kasih!`;
        }

        // Binding tombol WA Lapor
        const btnLapor = document.getElementById('btnLaporWA');
        btnLapor.onclick = () => {
            const phone = "6289691219977"; // WA F1 Swimming / Vanessa
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(laporanWA)}`, '_blank');
        };

        window.nextSlide(current, 'slideHasil');
    };

    window.resetQuiz = function() {
        // Reset state & animasi balik ke slide 1
        userAnswers = { divisi: '', tech: '', kondisi: '' };
        
        const currentSlide = document.getElementById('slideHasil');
        const nextSlide = document.getElementById('slide1');

        currentSlide.classList.remove('translate-x-0', 'opacity-100');
        currentSlide.classList.add('translate-x-10', 'opacity-0');

        setTimeout(() => {
            currentSlide.classList.add('hidden');
            currentSlide.classList.remove('block');
            
            nextSlide.classList.remove('hidden');
            nextSlide.classList.add('block');
            
            // Reset posisi untuk slide yang akan di-animate-in dari kiri
            nextSlide.classList.remove('-translate-x-10', 'translate-x-10');
            nextSlide.classList.add('-translate-x-10');
            
            void nextSlide.offsetWidth;

            nextSlide.classList.remove('-translate-x-10', 'opacity-0');
            nextSlide.classList.add('translate-x-0', 'opacity-100');
        }, 300);
    };
});