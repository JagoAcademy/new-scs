import { supabaseClient } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    const urlParams = new URLSearchParams(window.location.search);
    let brandSlug = urlParams.get('brand');

    if (!brandSlug) {
        const pathParts = window.location.pathname.split('/').filter(Boolean);
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
        const { data: pitchData, error: pitchErr } = await supabaseClient
            .from('sponsor_pitches')
            .select('*')
            .eq('pitch_slug', brandSlug)
            .single();

        if (pitchErr || !pitchData) throw new Error("Data Pitching tidak ditemukan!");

        document.title = `Proposal - ${pitchData.company_name}`;
        
        const logoEl = document.getElementById('corporateLogo');
        const cpEl = document.getElementById('cpName');
        const msgEl = document.getElementById('approachMessage');
        const coverEl = document.getElementById('sponsorCover');
        const syaratEl = document.getElementById('sponsorSyarat');

        if (cpEl) cpEl.innerText = pitchData.cp_name;
        
        if (pitchData.target_type === 'club') {
            
            if (coverEl) coverEl.src = 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=1000&auto=format&fit=crop';
            if (logoEl) logoEl.src = pitchData.corporate_logo || 'https://ui-avatars.com/api/?name=EO&background=fff&color=000';
            if (syaratEl) syaratEl.innerText = "Sistem Live Result Cepat\nDatabase F1 ID Terpusat\nBebas Manipulasi Umur\nPendapatan Ekstra dari Ads";
            
            if (msgEl) {
                msgEl.innerHTML = pitchData.approach_message || `Berikut adalah simulasi bagaimana sistem Live Result Digital (SCS) mendigitalisasi event dari <strong class="text-slate-800">${pitchData.company_name}</strong> untuk tampil lebih profesional di mata ribuan peserta.`;
            }

            renderSimulationClub(pitchData.company_name);

        } else {
            
            if (!pitchData.brand_ids || pitchData.brand_ids.length === 0) throw new Error("Tidak ada brand_ids!");

            const { data: allBrandsData, error: sponsorErr } = await supabaseClient
                .from('master_sponsors')
                .select('*')
                .in('id', pitchData.brand_ids);

            if (sponsorErr || !allBrandsData || allBrandsData.length === 0) throw new Error("Gagal menarik data Master Sponsor.");

            const primaryBrand = allBrandsData[0];

            if (coverEl) coverEl.src = primaryBrand.cover_url || 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=1000&auto=format&fit=crop';
            if (logoEl) logoEl.src = pitchData.corporate_logo || primaryBrand.logo_url || 'https://ui-avatars.com/api/?name=Brand&background=fff&color=000';
            if (syaratEl) syaratEl.innerText = primaryBrand.syarat || "Custom partnership agreement.";
            
            // 🚀 REVISI COPYWRITING PITCHING BRAND
            if (msgEl) {
                msgEl.innerHTML = pitchData.approach_message || `Berikut adalah simulasi interaktif bagaimana produk dan kampanye visual dari <strong class="text-slate-800">${pitchData.company_name}</strong> diinjeksi langsung ke dalam urat nadi sistem Live-Result digital kami.<br><br>Halaman penyiaran skor ini di-refresh puluhan ribu kali secara real-time oleh atlet, pelatih, dan orang tua sepanjang kompetisi berjalan, memberikan paparan visual tingkat tinggi yang tidak bisa dihindari oleh audiens target Anda.<br><br><div class="bg-amber-50 border border-amber-300 rounded-xl p-3 text-amber-900 text-xs font-medium flex items-start gap-2 shadow-sm animate-pulse"> <span class="text-base leading-none">💡</span> <span class="leading-relaxed"><strong>Panduan Simulasi:</strong> Silakan scroll ke bawah dan <strong>klik pada logo brand Anda</strong> untuk mencoba langsung pengalihan konversi. Setelah itu, Anda dapat meninjau rincian biaya penayangan iklan pada halaman <strong>Sponsor Rate</strong> kami.</span> </div>`;
            }

            renderSimulationBrand(allBrandsData);
        }

        // FUNGSI GLOBAL UNTUK TOMBOL WA (Mencakup tombol baru di dalam layar HP)
        const btnWaElements = document.querySelectorAll('.btnWaAction');
        if (btnWaElements.length > 0) {
            const waText = `Halo tim F1 Swimming, saya ${pitchData.cp_name} dari ${pitchData.company_name}. Saya sudah melihat penawarannya dan tertarik berdiskusi.`;
            btnWaElements.forEach(btn => {
                btn.addEventListener('click', () => {
                    window.open(`https://wa.me/6289691219977?text=${encodeURIComponent(waText)}`, '_blank');
                });
            });
        }

        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => loadingScreen.classList.add('hidden'), 500);
        }, 1000);

    } catch (err) {
        console.error("❌ ERROR SYSTEM:", err.message);
        loadingScreen.classList.add('hidden');
        errorScreen.classList.remove('hidden');
        errorScreen.classList.add('flex');
    }
});

function renderSimulationClub(companyName) {
    const container = document.getElementById('simulationContainer');
    let html = '';
    const dummyEvents = ["Gaya Bebas 50m Putra", "Gaya Dada 50m Putri", "Gaya Punggung 100m Putra"];
    
    for (let i = 0; i < 3; i++) {
        html += `
        <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-3 opacity-90">
            <div class="pl-1 mb-2">
                <h3 class="text-[10px] font-black text-slate-800 uppercase leading-tight">Event #${i+1}: ${dummyEvents[i]}</h3>
            </div>
            <div class="bg-slate-50/50 rounded-lg p-2 border border-slate-100 text-center py-4">
                <span class="text-[9px] font-bold text-slate-500">Hasil pertandingan dari event <strong class="text-slate-800">${companyName}</strong> tampil di sini.</span>
            </div>
        </div>`;
    }
    container.innerHTML = html;
}

function renderSimulationBrand(brandsArray) {
    const container = document.getElementById('simulationContainer');
    let html = '';
    
    const dummyEvents = [
        "Gaya Bebas 50m Putra", "Gaya Dada 50m Putri", "Gaya Punggung 100m Putra", 
        "Estafet 4x50m Bebas", "Gaya Kupu 50m Putra", "Gaya Bebas 100m Putri", 
        "Gaya Dada 100m Putra", "Gaya Punggung 50m Putri", "Gaya Kupu 100m Putri", "Estafet 4x100m Mix"
    ];

    for (let i = 0; i < 10; i++) {
        let spIndex = i % brandsArray.length;
        let sponsor = brandsArray[spIndex];
        
        let sponsorHeader = `
        <a href="${sponsor.link_url || '#'}" target="_blank" class="flex items-center justify-between bg-amber-50 hover:bg-amber-100 transition-colors border-b border-amber-200 px-3 py-2 -mx-3 -mt-3 mb-2 rounded-t-xl group cursor-pointer">
            <div class="flex items-center gap-1.5 flex-1 min-w-0 pr-2">
                <span class="text-[7px] font-black text-amber-600 uppercase tracking-widest shrink-0">Supported By:</span>
                <span class="text-[9px] font-bold text-slate-800 truncate">${sponsor.sponsor_name}</span>
            </div>
            <div class="bg-white p-1 rounded border border-slate-200 shadow-sm shrink-0" style="aspect-ratio: 16/9; width: 45px;">
                <img src="${sponsor.logo_url}" class="w-full h-full object-contain" onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\\'text-[6px] font-bold text-slate-400\\'>SPONSOR</span>';">
            </div>
        </a>`;

        html += `
        <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-3 overflow-hidden relative border-amber-300 ring-1 ring-amber-100 transform hover:scale-[1.02] transition-transform">
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 z-10"></div>
            ${sponsorHeader}
            <div class="pl-1 mb-2">
                <h3 class="text-[10px] font-black text-slate-800 uppercase leading-tight">Event #${i+1}: ${dummyEvents[i]}</h3>
                <p class="text-[7px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">HEAT 1 <span class="text-slate-300 mx-1">|</span> Dari 3</p>
            </div>
            
            <div class="bg-slate-50/50 rounded-lg p-1.5 border border-slate-100">
                <div class="flex items-center text-[7px] font-black text-slate-400 uppercase border-b border-slate-200 pb-1 mb-1 px-1">
                    <div class="w-5 text-center">LN</div><div class="flex-1 pl-1">ATLET</div><div class="w-10 text-right pr-1">WAKTU</div>
                </div>
                <div class="flex items-center py-1 border-b border-slate-100 px-1">
                    <div class="w-5 flex justify-center shrink-0"><div class="w-3 h-3 rounded bg-slate-200 text-slate-600 text-[6px] font-black flex items-center justify-center">3</div></div>
                    <div class="flex-1 pl-1"><p class="text-[8px] font-black text-slate-800 uppercase truncate">Nama Atlit 1</p></div>
                    <div class="w-10 shrink-0 text-right pr-1"><span class="font-mono text-[8px] font-black text-slate-400">NT</span></div>
                </div>
                <div class="flex items-center py-1 border-b border-slate-100 px-1">
                    <div class="w-5 flex justify-center shrink-0"><div class="w-3 h-3 rounded bg-amber-200 text-amber-800 text-[6px] font-black flex items-center justify-center">4</div></div>
                    <div class="flex-1 pl-1"><p class="text-[8px] font-black text-slate-800 uppercase truncate">Nama Atlit 2</p></div>
                    <div class="w-10 shrink-0 text-right pr-1"><span class="font-mono text-[8px] font-black text-emerald-600">28.45</span></div>
                </div>
                <div class="flex items-center py-1 px-1">
                    <div class="w-5 flex justify-center shrink-0"><div class="w-3 h-3 rounded bg-slate-200 text-slate-600 text-[6px] font-black flex items-center justify-center">5</div></div>
                    <div class="flex-1 pl-1"><p class="text-[8px] font-black text-slate-800 uppercase truncate">Nama Atlit 3</p></div>
                    <div class="w-10 shrink-0 text-right pr-1"><span class="font-mono text-[8px] font-black text-slate-400">NT</span></div>
                </div>
            </div>
        </div>`;
    }
    container.innerHTML = html;
}
