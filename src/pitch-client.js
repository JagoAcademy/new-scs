import { supabaseClient } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. PRIORITAS UTAMA: Ambil param ?brand= dari URL (Hasil sulap vercel.json)
    const urlParams = new URLSearchParams(window.location.search);
    let brandSlug = urlParams.get('brand');

    // 2. PLAN B: Kalau Vercel tembus murni dari Path (/pitch/j99corp)
    if (!brandSlug) {
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        if (pathParts.length >= 2 && pathParts[0] === 'pitch') {
            brandSlug = pathParts[1];
        }
    }

    console.log("🔍 SEDANG MENCARI SLUG DI DATABASE:", brandSlug);

    const loadingScreen = document.getElementById('loadingScreen');
    const errorScreen = document.getElementById('errorScreen');

    if (!brandSlug) {
        loadingScreen.classList.add('hidden');
        errorScreen.classList.remove('hidden');
        errorScreen.classList.add('flex');
        return;
    }

    try {
        // 3. Tarik Data Pitching berdasarkan Slug persis
        const { data: pitchData, error: pitchErr } = await supabaseClient
            .from('sponsor_pitches')
            .select('*')
            .eq('pitch_slug', brandSlug)
            .single();

        if (pitchErr || !pitchData) throw new Error("Pitching data not found! Pastikan slug-nya sama persis dengan yang di-generate.");

        // 4. Tarik SEMUA Master Sponsor yang nyambung sama brand_ids di tabel pitch
        if (!pitchData.brand_ids || pitchData.brand_ids.length === 0) {
            throw new Error("Tidak ada brand yang disimulasikan di dalam data pitching ini.");
        }

        const { data: allBrandsData, error: sponsorErr } = await supabaseClient
            .from('master_sponsors')
            .select('*')
            .in('id', pitchData.brand_ids);

        if (sponsorErr || !allBrandsData || allBrandsData.length === 0) {
            throw new Error("Sponsor data not found in master database.");
        }

        // Pakai brand pertama sebagai patokan cover & logo
        const primaryBrand = allBrandsData[0];

        // 5. Injeksi Teks dan Gambar ke HTML
        document.title = `Sponsorship Proposal - ${pitchData.company_name}`;
        
        // Render Foto Cover & Logo (Pake fallback gambar kalau kosong)
        document.getElementById('sponsorCover').src = primaryBrand.cover_url || 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=1000&auto=format&fit=crop';
        document.getElementById('sponsorLogo').src = primaryBrand.logo_url || 'https://ui-avatars.com/api/?name=Sponsor&background=fff&color=000';
        
        document.getElementById('cpName').innerText = pitchData.cp_name;
        document.getElementById('brandName').innerText = pitchData.company_name; // Ganti jadi nama korporatnya
        document.getElementById('sponsorSyarat').innerText = primaryBrand.syarat || "Custom partnership agreement.";

        // 6. Render Simulasi Live Result di HP Mockup
        renderSimulation(allBrandsData);

        // 7. Tombol WA langsung ke Admin F1 Swimming
        const myWaNumber = "6289691219977"; 
        const waText = `Halo tim F1 Swimming, saya ${pitchData.cp_name} dari ${pitchData.company_name}. Saya sudah melihat presentasinya dan tertarik berdiskusi lebih lanjut.`;
        document.getElementById('btnWA').addEventListener('click', () => {
            window.open(`https://wa.me/${myWaNumber}?text=${encodeURIComponent(waText)}`, '_blank');
        });

        // Tampilkan halaman
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => loadingScreen.classList.add('hidden'), 500);
        }, 1000);

    } catch (err) {
        console.error("❌ ERROR SYSTEM:", err.message);
        loadingScreen.classList.add('hidden');
        errorScreen.classList.remove('hidden');
        errorScreen.classList.add('flex');
        
        // Kasih tahu klien kalau slug-nya salah
        errorScreen.innerHTML = `
            <span class="text-6xl mb-4">📭</span>
            <h1 class="text-2xl font-black text-slate-800 mb-2">Proposal Tidak Ditemukan</h1>
            <p class="text-slate-500 font-medium text-sm">Pastikan link URL yang Anda ketik sudah benar.<br>Slug yang dicari: <strong class="text-red-500">${brandSlug}</strong></p>
        `;
    }
});

// FUNGSI RENDER MOCKUP LIVE RESULT DENGAN MULTI-BRAND
function renderSimulation(brandsArray) {
    const container = document.getElementById('simulationContainer');
    let html = '';

    const dummyEvents = [
        "Gaya Bebas 50m Putra", "Gaya Dada 50m Putri", 
        "Gaya Punggung 100m Putra", "Estafet 4x50m Bebas",
        "Gaya Kupu 50m Putra", "Gaya Bebas 100m Putri",
        "Gaya Dada 100m Putra", "Gaya Kupu 100m Putri"
    ];

    for (let i = 0; i < 8; i++) {
        
        // Injeksi Iklan Sponsor di event urutan ke-2 dan ke-5
        if (i === 1 || i === 4) {
            // Logika muter brand jika ada lebih dari 1 brand
            let spIndex = (i === 1) ? 0 : (brandsArray.length > 1 ? 1 : 0);
            let sponsor = brandsArray[spIndex];

            html += `
            <a href="${sponsor.link_url || '#'}" target="_blank" class="block w-full bg-white rounded-xl shadow-md overflow-hidden border border-amber-200 transform hover:scale-105 transition-transform duration-300 relative group my-3 cursor-pointer">
                <span class="absolute top-0 right-0 bg-amber-400 text-[7px] font-black px-2 py-0.5 rounded-bl-lg text-amber-900 tracking-widest z-10">SPONSORED</span>
                <div class="h-20 w-full relative">
                    <img src="${sponsor.cover_url || sponsor.logo_url}" class="w-full h-full object-cover object-center" onerror="this.src='https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=400&auto=format&fit=crop'">
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                </div>
                <div class="p-2.5 bg-gradient-to-r from-amber-50 to-white flex justify-between items-center">
                    <div class="flex items-center gap-2">
                        <img src="${sponsor.logo_url}" class="w-6 h-6 rounded-md bg-white border border-slate-200 object-contain p-0.5">
                        <div>
                            <p class="text-[9px] font-black text-slate-800 uppercase tracking-widest leading-none">${sponsor.sponsor_name}</p>
                            <p class="text-[7px] text-slate-500 font-medium mt-0.5 uppercase">${sponsor.jenis_bantuan}</p>
                        </div>
                    </div>
                    <span class="text-amber-500 text-xs font-black bg-white w-5 h-5 rounded-full flex items-center justify-center shadow-sm">›</span>
                </div>
            </a>
            `;
        }

        // Tampilan Kartu Event Biasa
        html += `
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex justify-between items-center opacity-70">
            <div>
                <p class="text-[8px] font-bold text-red-500 mb-0.5 uppercase tracking-wider">Event ${i+1}</p>
                <p class="text-[11px] font-black text-slate-800">${dummyEvents[i]}</p>
            </div>
            <div class="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-bold">›</div>
        </div>
        `;
    }

    container.innerHTML = html;
}
