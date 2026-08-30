import"./modulepreload-polyfill-3cfb730f.js";/* empty css              */import{s as x}from"./supabase-b7fcd0c7.js";document.addEventListener("DOMContentLoaded",async()=>{let t=new URLSearchParams(window.location.search).get("brand");if(!t){const e=window.location.pathname.split("/").filter(Boolean);e.length>=2&&e[0]==="pitch"&&(t=e[1])}const a=document.getElementById("loadingScreen"),s=document.getElementById("errorScreen");if(!t){a.classList.add("hidden"),s.classList.remove("hidden"),s.classList.add("flex");return}try{const{data:e,error:o}=await x.from("sponsor_pitches").select("*").eq("pitch_slug",t).single();if(o||!e)throw new Error("Data Pitching (Slug) tidak ditemukan di database!");if(!e.brand_ids||e.brand_ids.length===0)throw new Error("Tidak ada brand_ids yang tersimpan.");const{data:n,error:r}=await x.from("master_sponsors").select("*").in("id",e.brand_ids);if(r||!n||n.length===0)throw new Error("Data Master Sponsor gagal ditarik.");const l=n[0];document.title=`Sponsorship Proposal - ${e.company_name}`;const c=document.getElementById("sponsorCover");c&&(c.src=l.cover_url||"https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=1000&auto=format&fit=crop");const p=document.getElementById("corporateLogo");p&&(p.src=e.corporate_logo||l.logo_url||"https://ui-avatars.com/api/?name=Sponsor&background=fff&color=000");const m=document.getElementById("cpName");m&&(m.innerText=e.cp_name);const d=document.getElementById("approachMessage");d&&(e.approach_message?d.innerText=e.approach_message:d.innerHTML=`Ini adalah simulasi eksklusif bagaimana brand <strong class="text-slate-800">${e.company_name}</strong> Anda akan mendominasi perhatian ribuan atlet dan orang tua di seluruh event nasional F1 Swimming.`);const u=document.getElementById("sponsorSyarat");u&&(u.innerText=l.syarat||"Custom partnership agreement."),f(n);const b=document.getElementById("btnWA");if(b){const g=`Halo tim F1 Swimming, saya ${e.cp_name} dari ${e.company_name}. Saya sudah melihat presentasinya dan tertarik berdiskusi lebih lanjut.`;b.addEventListener("click",()=>{window.open(`https://wa.me/6289691219977?text=${encodeURIComponent(g)}`,"_blank")})}setTimeout(()=>{a.style.opacity="0",setTimeout(()=>a.classList.add("hidden"),500)},1e3)}catch(e){console.error("❌ ERROR SYSTEM:",e.message),a.classList.add("hidden"),s.classList.remove("hidden"),s.classList.add("flex"),s.innerHTML=`
            <span class="text-6xl mb-4">📭</span>
            <h1 class="text-2xl font-black text-slate-800 mb-2">Proposal Tidak Ditemukan</h1>
            <p class="text-slate-500 font-medium text-sm mb-6">Pastikan link URL yang Anda ketik sudah benar.<br>Slug yang dicari: <strong class="text-red-500">${t}</strong></p>
        `}});function f(i){const t=document.getElementById("simulationContainer");if(!t)return;let a="";const s=["Gaya Bebas 50m Putra","Gaya Dada 50m Putri","Gaya Punggung 100m Putra","Estafet 4x50m Bebas","Gaya Kupu 50m Putra"];for(let e=0;e<5;e++){let o="";if(e===0||e===2){let n=e===0?0:i.length>1?1:0,r=i[n];o=`
            <a href="${r.link_url||"#"}" target="_blank" class="flex items-center justify-between bg-amber-50 hover:bg-amber-100 transition-colors border-b border-amber-200 px-3 py-2 -mx-3 -mt-3 mb-2 rounded-t-xl group cursor-pointer">
                <div class="flex items-center gap-1.5 flex-1 min-w-0 pr-2">
                    <span class="text-[7px] font-black text-amber-600 uppercase tracking-widest shrink-0">Supported By:</span>
                    <span class="text-[9px] font-bold text-slate-800 truncate">${r.sponsor_name}</span>
                </div>
                <div class="bg-white p-1 rounded border border-slate-200 shadow-sm shrink-0" style="aspect-ratio: 16/9; width: 45px;">
                    <img src="${r.logo_url}" class="w-full h-full object-contain" onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\\'text-[6px] font-bold text-slate-400\\'>SPONSOR</span>';">
                </div>
            </a>
            `}a+=`
        <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-3 overflow-hidden relative ${e===0||e===2?"border-amber-300 ring-1 ring-amber-100 transform hover:scale-[1.02] transition-transform":"opacity-80"}">
            <div class="absolute left-0 top-0 bottom-0 w-1 ${e===0||e===2?"bg-amber-400":"bg-slate-300"} z-10"></div>
            ${o}
            <div class="pl-1 mb-2">
                <h3 class="text-[10px] font-black text-slate-800 uppercase leading-tight">Event #${e+1}: ${s[e]}</h3>
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
        </div>`}t.innerHTML=a}
