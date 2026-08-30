import { supabaseClient } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. AMBIL SLUG BRAND DARI URL BROWSER
    // Coba ambil dari Query Param dulu (berguna kalau lagi tes di localhost: ?brand=xyz)
    const urlParams = new URLSearchParams(window.location.search);
    let brandSlug = urlParams.get('brand');

    // JIKA KOSONG (Berarti lagi di Vercel: /pitch/j99corp), potong langsung dari URL Path!
    if (!brandSlug) {
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        // Hasilnya pathParts = ['pitch', 'j99corp']
        if (pathParts.length >= 2 && pathParts[0] === 'pitch') {
            brandSlug = pathParts[1];
        }
    }

    const loadingScreen = document.getElementById('loadingScreen');
    const errorScreen = document.getElementById('errorScreen');

    if (!brandSlug) {
        loadingScreen.classList.add('hidden');
        errorScreen.classList.remove('hidden');
        errorScreen.classList.add('flex');
        return;
    }

    try {
        // 2. Tarik Data Pitching berdasarkan Slug
        const { data: pitchData, error: pitchErr } = await supabaseClient
            .from('sponsor_pitches')
            .select('*')
            .eq('pitch_slug', brandSlug)
            .single();

        if (pitchErr || !pitchData) throw new Error("Pitching data not found");

        // 3. Tarik Master Sponsor yang nyambung sama Pitching ini
        // Karena sekarang kita pakai array brand_ids, kita tarik brand pertama dulu buat cover
        const targetSponsorId = (pitchData.brand_ids && pitchData.brand_ids.length > 0) 
                                ? pitchData.brand_ids[0] 
                                : pitchData.sponsor_id;

        const { data: sponsorData, error: sponsorErr } = await supabaseClient
            .from('master_sponsors')
            .select('*')
            .eq('id', targetSponsorId)
            .single();

        if (sponsorErr || !sponsorData) throw new Error("Sponsor data not found");

        // Tarik semua brand kalau corporate-nya bawa banyak brand (Contoh: J99 bawa MS Glow & J Water)
        let allBrandsData = [sponsorData];
        if (pitchData.brand_ids && pitchData.brand_ids.length > 1) {
            const { data: multiBrands } = await supabaseClient
                .from('master_sponsors')
                .select('*')
                .in('id', pitchData.brand_ids);
            
            if (multiBrands) {
                allBrandsData = multiBrands;
            }
        }

        // 4. Injeksi Teks dan Gambar ke HTML
        document.title = `Sponsorship Proposal - ${pitchData.company_name || sponsorData.sponsor_name}`;
        
        // Render Foto Cover & Logo (Pake fallback gambar abu-abu kalau kosong)
        document.getElementById('sponsorCover').src = sponsorData.cover_url || 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=1000&auto=format&fit=crop';
        document.getElementById('sponsorLogo').src = sponsorData.logo_url || 'https://ui-avatars.com/api/?name=Sponsor&background=fff&color=000';
        
        document.getElementById('cpName').innerText = pitchData.cp_name;
        document.getElementById('brandName').innerText = pitchData.company_name || sponsorData.sponsor_name;
        document.getElementById('sponsorSyarat').innerText = sponsorData.syarat || "Custom partnership agreement.";

        // 5. Render Simulasi Live Result di HP Mockup
        renderSimulation(allBrandsData);

        // 6. Tombol WA langsung ke lu (Admin F1 Swimming)
        const myWaNumber = "6289691219977"; // WA lu
        const waText = `Halo tim F1 Swimming, saya ${pitchData.cp_name} dari ${pitchData.company_name || sponsorData.sponsor_name}. Saya sudah melihat presentasinya dan tertarik berdiskusi lebih lanjut.`;
        document.getElementById('btnWA').addEventListener('click', () => {
            window.open(`https://wa.me/${myWaNumber}?text=${encodeURIComponent(waText)}`, '_blank');
        });

        // Tampilkan halaman
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => loadingScreen.classList.add('hidden'), 500);
        }, 1000);

    } catch (err) {
        console.error(err);
        loadingScreen.classList.add('hidden');
        errorScreen.classList.remove('hidden');
        errorScreen.classList.add('flex');
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
