import"./modulepreload-polyfill-3cfb730f.js";/* empty css              */import{s as g}from"./supabase-e9059105.js";let c=null,b=[],v=null,x=[],y=30,f=y;async function A(t){if(!t||t.length===0||!c)return;const n=`f1_visited_event_${c}`,e=!localStorage.getItem(n);e&&localStorage.setItem(n,"true");try{const r=t.map(s=>g.rpc("increment_impression",{p_sponsor_id:s,p_event_id:parseInt(c),p_is_new_device:e}));await Promise.all(r),console.log("Analytics: Impressions berhasil dicatat.")}catch(r){console.error("Gagal mencatat impression:",r)}}window.trackSponsorClick=async function(t,n){if(!(!c||!t))try{g.rpc("increment_click",{p_sponsor_id:t,p_event_id:parseInt(c)}).then(({error:e})=>{e&&console.error("Gagal mencatat klik:",e)}),n&&n!=="#"&&window.open(n,"_blank")}catch(e){console.error("Error tracker klik:",e)}};document.addEventListener("DOMContentLoaded",async()=>{if(c=new URLSearchParams(window.location.search).get("id"),!c)return alert("Halaman tidak valid. ID Event tidak ditemukan!");await B(),await H(),await E(!0),M()});async function B(){try{const{data:t,error:n}=await g.from("events").select("event_name, config").eq("id",c).single();if(t){document.getElementById("headerEventName").innerText=t.event_name;const e=t.config||{},r=e.kop_surat||e.header_image||e.banner;if(r){const s=document.getElementById("eventBannerWrapper"),m=document.getElementById("eventBannerImg");m.src=r,s.classList.remove("hidden")}}}catch(t){console.error(t)}}async function H(){const t=document.getElementById("partnerWrapper");if(t)try{const{data:n,error:e}=await g.from("event_sponsors").select("sponsor_ids").eq("event_id",c).single();if(e||!n||!n.sponsor_ids||n.sponsor_ids.length===0)return;const{data:r,error:s}=await g.from("master_sponsors").select("*").in("id",n.sponsor_ids);if(s||!r||r.length===0)return;x=r,A(r.map(o=>o.id));let m=`
            <div class="w-full mb-6 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 text-center">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">This event supported by:</span>
                <div class="flex items-center justify-center gap-4 md:gap-6 flex-wrap w-full">
        `,p=r.length===1?"160px":r.length===2?"120px":"90px";r.forEach(o=>{const l=o.logo_url||"/images/logo.png",d=o.link_url||"#";m+=`
                <button onclick="trackSponsorClick(${o.id}, '${d}')" 
                   class="bg-white p-2 rounded-xl border border-slate-100 shadow-sm flex items-center justify-center shrink-0 transition-transform hover:scale-105 cursor-pointer outline-none focus:outline-none" 
                   style="aspect-ratio: 16/9; width: ${p}; max-width: 100%;">
                    <img src="${l}" 
                         alt="${o.sponsor_name}" 
                         title="${o.sponsor_name}" 
                         class="w-full h-full object-contain pointer-events-none"
                         loading="lazy"
                         onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\\'text-[10px] font-black text-slate-400 text-center uppercase\\'>${o.sponsor_name}</span>';">
                </button>
            `}),m+=`
                </div>
            </div>
        `,t.innerHTML=m}catch(n){console.error("Gagal menarik data sponsor:",n)}}async function E(t=!1){const n=document.getElementById("iconRefresh");n.classList.add("spin-anim");try{const{data:e,error:r}=await g.from("event_heats").select("*").eq("event_id",c).order("event_number",{ascending:!0}).order("heat_number",{ascending:!0});if(r)throw r;b=e||[],t?U():v&&k(v)}catch(e){console.error("Gagal memuat data Live Result:",e)}finally{setTimeout(()=>n.classList.remove("spin-anim"),500)}}function U(){const t=document.getElementById("selectEvent");t.innerHTML='<option value="">-- Pilih Nomor Lomba --</option>',[...new Map(b.map(e=>[e.event_number,e])).values()].forEach(e=>{let r=`Event #${e.event_number}: ${e.nomor_lomba} - ${e.gender} - ${e.kelompok_umur}`;t.innerHTML+=`<option value="${e.event_number}">${r}</option>`}),t.addEventListener("change",e=>{v=e.target.value,k(v)}),document.getElementById("btnShowAll").addEventListener("click",()=>{t.value="",v="ALL",k("ALL")})}function k(t){const n=document.getElementById("resultContainer");if(!t){n.innerHTML=`
        <div class="text-center py-10 opacity-50">
            <div class="text-4xl mb-3">🏊‍♂️</div>
            <h3 class="text-sm font-bold text-slate-600">Pilih lomba di atas untuk melihat hasil Heat.</h3>
        </div>`;return}let e=[];t==="ALL"?e=b:e=b.filter(s=>s.event_number==t);let r="";e.forEach((s,m)=>{let p="";p+=`
            <div class="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-2 px-1">
                <div class="w-8 text-center">LN</div>
                <div class="flex-1 pl-2">ATLET & KLUB</div>
                <div class="w-20 text-right pr-1">WAKTU</div>
            </div>
        `,s.lanes_data.forEach(l=>{if(!l.nama)return;let d=l.waktu_tempuh||"NT",i="text-slate-400";d!=="NT"&&d!=="DQ"?i="text-emerald-600":d==="DQ"&&(i="text-red-500"),p+=`
            <div class="flex items-center py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors px-1">
                <div class="w-8 flex justify-center shrink-0">
                    <div class="w-5 h-5 rounded bg-slate-200 text-slate-600 text-[10px] font-black flex items-center justify-center">${l.lane}</div>
                </div>
                <div class="flex-1 pl-2 flex flex-col sm:flex-row sm:items-center min-w-0">
                    <p class="text-xs font-black text-slate-800 uppercase truncate mr-2">${l.nama}</p>
                    <p class="text-[9px] font-bold text-slate-400 uppercase truncate sm:border-l sm:border-slate-300 sm:pl-2 mt-0.5 sm:mt-0">${l.klub}</p>
                </div>
                <div class="w-20 shrink-0 text-right pr-1">
                    <span class="font-mono text-xs font-black tracking-wider ${i}">
                        ${d}
                    </span>
                </div>
            </div>`}),(s.lanes_data.length===0||!s.lanes_data.some(l=>l.nama))&&(p+='<p class="text-[10px] text-slate-400 italic text-center py-3">Tidak ada data atlet di Heat ini.</p>');let o="";if(x.length>0){const l=s.gender.toUpperCase(),d=s.kelompok_umur.toUpperCase();let i=x.filter(a=>{let _=!1,h=!1;return!a.target_gender||a.target_gender==="ALL"?_=!0:_=l.includes(a.target_gender.toUpperCase()),!a.target_umur||a.target_umur==="ALL"?h=!0:a.target_umur==="KIDS"?h=["PEMULA","TAHUN","THN","SD","TK","GRUP","GROUP","KIDS","UMUR","YOUTH"].some(w=>d.includes(w)):a.target_umur==="ADULT"&&(h=["OPEN","SENIOR","DEWASA","MAHASISWA","MASTER","BEBAS"].some(w=>d.includes(w))),_&&h});i.length===0&&(i=x.filter(a=>(!a.target_gender||a.target_gender==="ALL")&&(!a.target_umur||a.target_umur==="ALL"))),i.length===0&&(i=x);const $=m%i.length,u=i[$],I=u.logo_url||"/images/logo.png",T=u.link_url||"#";o=`
                <button onclick="trackSponsorClick(${u.id}, '${T}')" class="w-full outline-none focus:outline-none cursor-pointer flex items-center justify-between bg-slate-50 hover:bg-amber-50/80 transition-colors border-b border-slate-200 px-4 py-3 -mx-3 -mt-3 md:-mx-4 md:-mt-4 mb-3 rounded-t-xl group">
                    <div class="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-2 flex-1 min-w-0 pr-4 text-left">
                        <span class="text-[9px] md:text-[10px] font-black text-slate-400 group-hover:text-amber-500 uppercase tracking-widest transition-colors shrink-0">
                            Supported By:
                        </span>
                        <span class="text-xs md:text-sm font-bold text-slate-700 group-hover:text-amber-700 truncate transition-colors leading-tight">
                            ${u.sponsor_name}
                        </span>
                    </div>
                    <div class="bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center shrink-0 transition-transform group-hover:scale-105" 
                         style="aspect-ratio: 16/9; width: 72px;">
                        <img src="${I}" 
                             alt="${u.sponsor_name}" 
                             class="w-full h-full object-contain pointer-events-none" 
                             loading="lazy" 
                             onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\\'text-[8px] font-bold text-slate-400 text-center leading-tight uppercase\\'>${u.sponsor_name}</span>';">
                    </div>
                </button>
            `}r+=`
        <div class="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 mb-4 overflow-hidden relative">
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-slate-300 z-10"></div>
            ${o}
            <div class="pl-2 mb-3">
                <h3 class="text-xs font-black text-slate-800 uppercase leading-tight">Event #${s.event_number}: ${s.nomor_lomba} - ${s.gender}</h3>
                <p class="text-[9px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">HEAT ${s.heat_number} <span class="text-slate-300 mx-1">|</span> Dari ${s.total_heats}</p>
            </div>
            <div class="bg-slate-50/50 rounded-lg p-2 border border-slate-100">
                ${p}
            </div>
        </div>`}),n.innerHTML=r}function M(){const t=document.getElementById("countdownText"),n=document.getElementById("refreshProgressBar");setInterval(()=>{f--,t.innerText=`${f}s`;const e=f/y*100;n.style.width=`${e}%`,f<=0&&L()},1e3)}document.getElementById("btnRefresh").addEventListener("click",()=>{L()});function L(){E(!1),f=y,document.getElementById("countdownText").innerText=`${f}s`,document.getElementById("refreshProgressBar").style.width="100%"}
