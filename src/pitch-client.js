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

        if (pitchErr || !pitchData) throw new Error("Data Pitching (Slug) tidak ditemukan di database!");
        if (!pitchData.brand_ids || pitchData.brand_ids.length === 0) throw new Error("Tidak ada brand_ids yang tersimpan.");

        const { data: allBrandsData, error: sponsorErr } = await supabaseClient
            .from('master_sponsors')
            .select('*')
            .in('id', pitchData.brand_ids);

        if (sponsorErr || !allBrandsData || allBrandsData.length === 0) throw new Error("Data Master Sponsor gagal ditarik.");

        const primaryBrand = allBrandsData[0];

        // INJEKSI DATA KE HTML
        document.title = `Sponsorship Proposal - ${pitchData.company_name}`;
        
        const coverEl = document.getElementById('sponsorCover');
        if (coverEl) coverEl.src = primaryBrand.cover_url || 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=1000&auto=format&fit=crop';
        
        // LOGIKA CORPORATE LOGO
        const logoEl = document.getElementById('corporateLogo');
        if (logoEl) {
            logoEl.src = pitchData.corporate_logo || primaryBrand.logo_url || 'https://ui-avatars.com/api/?name=Sponsor&background=fff&color=000';
        }
        
        const cpEl = document.getElementById('cpName');
        if (cpEl) cpEl.innerText = pitchData.cp_name;
        
        // LOGIKA APPROACH MESSAGE (COPYWRITING)
        const msgEl = document.getElementById('approachMessage');
        if (msgEl) {
            if (pitchData.approach_message) {
                msgEl.innerText = pitchData.approach_message;
            } else {
                msgEl.innerHTML = `Ini adalah simulasi eksklusif bagaimana brand <strong class="text-slate-800">${pitchData.company_name}</strong> Anda akan mendominasi perhatian ribuan atlet dan orang tua di seluruh event nasional F1 Swimming.`;
            }
        }
        
        const syaratEl = document.getElementById('sponsorSyarat');
        if (syaratEl) syaratEl.innerText = primaryBrand.syarat || "Custom partnership agreement.";

        renderSimulation(allBrandsData);

        const btnWaEl = document.getElementById('btnWA');
        if (btnWaEl) {
            const waText = `Halo tim F1 Swimming, saya ${pitchData.cp_name} dari ${pitchData.company_name}. Saya sudah melihat presentasinya dan tertarik berdiskusi lebih lanjut.`;
            btnWaEl.addEventListener('click', () => {
                window.open(`https://wa.me/6289691219977?text=${encodeURIComponent(waText)}`, '_blank');
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
        errorScreen.innerHTML = `
            <span class="text-6xl mb-4">📭</span>
            <h1 class="text-2xl font-black text-slate-800 mb-2">Proposal Tidak Ditemukan</h1>
            <p class="text-slate-500 font-medium text-sm mb-6">Pastikan link URL yang Anda ketik sudah benar.<br>Slug yang dicari: <strong class="text-red-500">${brandSlug}</strong></p>
        `;
    }
});

// SIMULASI DENGAN UI REAL RESULT
function renderSimulation(brandsArray) {
    const container = document.getElementById('simulationContainer');
    if (!container) return; 
    
    let html = '';
    const dummyEvents = ["Gaya Bebas 50m Putra", "Gaya Dada 50m Putri", "Gaya Punggung 100m Putra", "Estafet 4x50m Bebas", "Gaya Kupu 50m Putra"];

    for (let i = 0; i < 5; i++) {
        let sponsorHeader = '';
        
        if (i === 0 || i === 2) {
            let spIndex = (i === 0) ? 0 : (brandsArray.length > 1 ? 1 : 0);
            let sponsor = brandsArray[spIndex];

            sponsorHeader = `
            <a href="${sponsor.link_url || '#'}" target="_blank" class="flex items-center justify-between bg-amber-50 hover:bg-amber-100 transition-colors border-b border-amber-200 px-3 py-2 -mx-3 -mt-3 mb-2 rounded-t-xl group cursor-pointer">
                <div class="flex items-center gap-1.5 flex-1 min-w-0 pr-2">
                    <span class="text-[7px] font-black text-amber-600 uppercase tracking-widest shrink-0">Supported By:</span>
                    <span class="text-[9px] font-bold text-slate-800 truncate">${sponsor.sponsor_name}</span>
                </div>
                <div class="bg-white p-1 rounded border border-slate-200 shadow-sm shrink-0" style="aspect-ratio: 16/9; width: 45px;">
                    <img src="${sponsor.logo_url}" class="w-full h-full object-contain" onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\\'text-[6px] font-bold text-slate-400\\'>SPONSOR</span>';">
                </div>
            </a>
            `;
        }

        html += `
        <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-3 overflow-hidden relative ${i === 0 || i === 2 ? 'border-amber-300 ring-1 ring-amber-100 transform hover:scale-[1.02] transition-transform' : 'opacity-80'}">
            <div class="absolute left-0 top-0 bottom-0 w-1 ${i === 0 || i === 2 ? 'bg-amber-400' : 'bg-slate-300'} z-10"></div>
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
                    <div class="w-5 flex justify-center shrink-0"><div class="w-3 h-3 rounded bg-slate-200 text-slate-600 text-[6px] font-black flex items-center justify-center">4</div></div>
                    <div class="flex-1 pl-1"><p class="text-[8px] font-black text-slate-800 uppercase truncate">Fajar Aditya</p></div>
                    <div class="w-10 shrink-0 text-right pr-1"><span class="font-mono text-[8px] font-black text-emerald-600">28.45</span></div>
                </div>
                <div class="flex items-center py-1 border-b border-slate-100 px-1">
                    <div class="w-5 flex justify-center shrink-0"><div class="w-3 h-3 rounded bg-slate-200 text-slate-600 text-[6px] font-black flex items-center justify-center">5</div></div>
                    <div class="flex-1 pl-1"><p class="text-[8px] font-black text-slate-800 uppercase truncate">Perenang Dummy 2</p></div>
                    <div class="w-10 shrink-0 text-right pr-1"><span class="font-mono text-[8px] font-black text-slate-400">NT</span></div>
                </div>
            </div>
        </div>`;
    }
    container.innerHTML = html;
}
