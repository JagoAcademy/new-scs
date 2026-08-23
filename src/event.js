import { supabaseClient } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // --- 1. LOGIKA CEK LOGIN UNTUK NAVBAR ---
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        const floatBtn = document.getElementById('floatingAuthBtn');
        const floatText = document.getElementById('floatingAuthText');
        
        if (session) {
            floatBtn.href = '/dashboard.html';
            floatBtn.classList.replace('bg-blue-700', 'bg-emerald-600');
            floatBtn.classList.replace('border-blue-800', 'border-emerald-700');
            floatBtn.classList.replace('hover:bg-blue-800', 'hover:bg-emerald-700');
            floatText.innerText = 'Ke Dashboard';
        }
    } catch (err) {
        console.error("Gagal cek auth:", err);
    }

    // --- 2. LOGIKA BURGER MENU ---
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const closeMobileBtn = document.getElementById('closeMobileBtn');

    function toggleMobile() {
        if (mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.remove('hidden');
            mobileMenu.classList.add('flex');
        } else {
            mobileMenu.classList.add('hidden');
            mobileMenu.classList.remove('flex');
        }
    }

    if(mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMobile);
    if(closeMobileBtn) closeMobileBtn.addEventListener('click', toggleMobile);

    // --- 3. LOGIKA RENDER GRID EVENT ---
    const gridContainer = document.getElementById('eventGrid');
    
    if (!gridContainer) return;
    gridContainer.innerHTML = `
        <div class="col-span-full py-20 text-center">
            <div class="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-slate-500 font-bold animate-pulse">Memuat data event seluruh Indonesia...</p>
        </div>`;

    try {
        // Tarik semua event, urutkan dari yang terbaru
        const { data: events, error } = await supabaseClient
            .from('events')
            .select('*')
            .order('event_date', { ascending: false });

        if (error) throw error;

        if (!events || events.length === 0) {
            gridContainer.innerHTML = `<div class="col-span-full text-center py-20"><p class="text-gray-500 font-bold text-lg mb-2">Belum ada event perlombaan terdaftar.</p><p class="text-sm text-gray-400">Jadilah yang pertama menyelenggarakan event dengan SCS!</p></div>`;
            return;
        }

        let html = '';
        events.forEach(ev => {
            const today = new Date();
            const startDate = new Date(ev.event_date);
            const endDate = new Date(ev.end_date);
            
            let badgeHTML = '';
            let actionText = '';
            let filterClass = '';
            let cardUrl = '';

            // Tentukan Status Event & URL Destinasi
            if (today > endDate) {
                // Selesai
                badgeHTML = `<div class="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-lg border border-slate-700 z-20">SELESAI</div>`;
                cardUrl = `https://${ev.subdomain}.f1swimming.com/result?id=${ev.id}`;
                actionText = "Lihat Hasil Akhir";
                filterClass = 'selesai';
            } else if (today >= startDate && today <= endDate) {
                // Sedang Berjalan (LIVE)
                badgeHTML = `<div class="absolute top-4 left-4 bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-lg border border-red-500 flex items-center gap-1.5 z-20">
                        <span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE RESULT
                    </div>`;
                cardUrl = `https://${ev.subdomain}.f1swimming.com/result?id=${ev.id}`;
                actionText = "Pantau Pertandingan";
                filterClass = 'live';
            } else {
                // Masih Buka (Pendaftaran)
                badgeHTML = `<div class="absolute top-4 left-4 bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-lg border border-emerald-400 z-20">PENDAFTARAN DIBUKA</div>`;
                cardUrl = `https://${ev.subdomain}.f1swimming.com?id=${ev.id}`;
                actionText = "Detail & Daftar";
                filterClass = 'buka';
            }

            // Lokasi
            const lokasiText = (ev.kota && ev.provinsi) ? `${ev.kota}, ${ev.provinsi}` : 'Lokasi Belum Ditentukan';
            
            // Format Tanggal
            const dateText = (ev.event_date === ev.end_date) 
                ? ev.event_date 
                : `${ev.event_date} s/d ${ev.end_date}`;

            // LOGIKA GAMBAR DARI CONFIG
            let bgImage = "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80"; 
            if (ev.config && ev.config.header_url) {
                bgImage = ev.config.header_url;
            }

            // RENDER HTML KARTU (CINEMATIC GRADIENT)
            html += `
            <a href="${cardUrl}" class="block relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group event-card aspect-[4/3] sm:aspect-[16/10] bg-slate-900 ${filterClass}">
                
                <!-- Gambar Cover Full -->
                <img src="${bgImage}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 z-0" alt="${ev.event_name}">
                
                <!-- Gradient Hitam dari Bawah -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                
                <!-- Badge Mengambang -->
                ${badgeHTML}
                
                <!-- Konten Teks -->
                <div class="absolute bottom-0 left-0 w-full p-5 sm:p-6 flex flex-col justify-end z-20">
                    <p class="text-[10px] md:text-xs font-bold text-amber-400 mb-1.5 flex items-center gap-1.5 drop-shadow-md">🏆 ${dateText}</p>
                    <h3 class="text-xl md:text-2xl font-extrabold text-white mb-1.5 leading-tight drop-shadow-lg line-clamp-2" title="${ev.event_name}">${ev.event_name}</h3>
                    <p class="text-xs md:text-sm text-slate-300 font-medium flex items-center gap-1.5 mb-4 truncate drop-shadow-md"><span class="text-red-400">📍</span> ${lokasiText}</p>

                    <!-- Area CTA Bawah -->
                    <div class="flex justify-between items-center pt-3 md:pt-4 border-t border-white/20">
                        <span class="text-xs font-bold text-white/80 group-hover:text-white transition-colors tracking-wide uppercase">${actionText}</span>
                        <span class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-blue-600 group-hover:scale-110 transition-all backdrop-blur-sm border border-white/10 shadow-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>
                        </span>
                    </div>
                </div>
            </a>
            `;
        });

        gridContainer.innerHTML = html;

        // ==========================================
        // 4. LOGIKA FILTER & BANNER REKAPITULASI
        // ==========================================
        const filterBtns = document.querySelectorAll('.filter-btn');
        const rekapBanner = document.getElementById('rekapBanner');
        const allCards = document.querySelectorAll('.event-card');

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // 1. Reset warna semua tombol jadi abu-abu/putih
                filterBtns.forEach(b => {
                    b.classList.remove('bg-blue-900', 'text-white', 'shadow-md');
                    b.classList.add('bg-white', 'text-slate-600', 'border', 'border-slate-200');
                });
                
                // 2. Warnain tombol yang lagi diklik jadi biru
                btn.classList.remove('bg-white', 'text-slate-600', 'border', 'border-slate-200');
                btn.classList.add('bg-blue-900', 'text-white', 'shadow-md');

                const filterType = btn.getAttribute('data-filter');

                // 3. Logika munculin/hilangin teks "Server merekapitulasi..."
                if (filterType === 'semua' || filterType === 'selesai') {
                    rekapBanner.classList.remove('hidden');
                } else {
                    rekapBanner.classList.add('hidden');
                }

                // 4. Logika filter sembunyiin/munculin kartu event
                allCards.forEach(card => {
                    if (filterType === 'semua') {
                        card.style.display = 'block'; // Tampilkan semua
                    } else if (filterType === 'live' && card.classList.contains('live')) {
                        card.style.display = 'block'; // Tampilkan yang sedang berjalan
                    } else if (filterType === 'selesai' && card.classList.contains('selesai')) {
                        card.style.display = 'block'; // Tampilkan yang sudah selesai
                    } else {
                        card.style.display = 'none'; // Sembunyikan sisanya
                    }
                });
            });
        });

    } catch (err) {
        console.error(err);
        gridContainer.innerHTML = `<p class="text-center text-red-500 col-span-full py-10 font-bold">Gagal memuat kalender: ${err.message}</p>`;
    }
});