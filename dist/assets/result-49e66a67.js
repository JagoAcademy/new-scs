import"./modulepreload-polyfill-3cfb730f.js";/* empty css              */import{s as b}from"./supabase-b7fcd0c7.js";let x=null,v=[],g=null,f=[],y=30,m=y;document.addEventListener("DOMContentLoaded",async()=>{if(x=new URLSearchParams(window.location.search).get("id"),!x)return alert("Halaman tidak valid. ID Event tidak ditemukan!");await I(),await H(),await k(!0),B()});async function I(){try{const{data:t,error:r}=await b.from("events").select("event_name").eq("id",x).single();t&&(document.getElementById("headerEventName").innerText=t.event_name)}catch(t){console.error(t)}}async function H(){const t=document.getElementById("partnerWrapper");if(t)try{const{data:r,error:e}=await b.from("event_sponsors").select("sponsor_ids").eq("event_id",x).single();if(e||!r||!r.sponsor_ids||r.sponsor_ids.length===0)return;const{data:n,error:s}=await b.from("master_sponsors").select("*").in("id",r.sponsor_ids);if(s||!n||n.length===0)return;f=n;let p=`
            <div class="w-full mb-6 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 text-center">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">This event supported by:</span>
                <div class="flex items-center justify-center gap-4 md:gap-6 flex-wrap w-full">
        `,c=n.length===1?"160px":n.length===2?"120px":"90px";n.forEach(d=>{const l=d.logo_url||"/images/logo.png",i=d.link_url||"#";p+=`
                <a href="${i}" target="_blank" rel="noopener noreferrer" 
                   class="bg-white p-2 rounded-xl border border-slate-100 shadow-sm flex items-center justify-center shrink-0 transition-transform hover:scale-105" 
                   style="aspect-ratio: 16/9; width: ${c}; max-width: 100%;">
                    <img src="${l}" 
                         alt="${d.sponsor_name}" 
                         title="${d.sponsor_name}" 
                         class="w-full h-full object-contain"
                         loading="lazy"
                         onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\\'text-[10px] font-black text-slate-400 text-center uppercase\\'>${d.sponsor_name}</span>';">
                </a>
            `}),p+=`
                </div>
            </div>
        `,t.innerHTML=p}catch(r){console.error("Gagal menarik data sponsor:",r)}}async function k(t=!1){const r=document.getElementById("iconRefresh");r.classList.add("spin-anim");try{const{data:e,error:n}=await b.from("event_heats").select("*").eq("event_id",x).order("event_number",{ascending:!0}).order("heat_number",{ascending:!0});if(n)throw n;v=e||[],t?S():g&&E(g)}catch(e){console.error("Gagal memuat data Live Result:",e)}finally{setTimeout(()=>r.classList.remove("spin-anim"),500)}}function S(){const t=document.getElementById("selectEvent");t.innerHTML='<option value="">-- Pilih Nomor Lomba --</option>',[...new Map(v.map(e=>[e.event_number,e])).values()].forEach(e=>{let n=`Event #${e.event_number}: ${e.nomor_lomba} - ${e.gender} - ${e.kelompok_umur}`;t.innerHTML+=`<option value="${e.event_number}">${n}</option>`}),t.addEventListener("change",e=>{g=e.target.value,E(g)}),document.getElementById("btnShowAll").addEventListener("click",()=>{t.value="",g="ALL",E("ALL")})}function E(t){const r=document.getElementById("resultContainer");if(!t){r.innerHTML=`
        <div class="text-center py-10 opacity-50">
            <div class="text-4xl mb-3">🏊‍♂️</div>
            <h3 class="text-sm font-bold text-slate-600">Pilih lomba di atas untuk melihat hasil Heat.</h3>
        </div>`;return}let e=[];t==="ALL"?e=v:e=v.filter(s=>s.event_number==t);let n="";e.forEach((s,p)=>{let c="";c+=`
            <div class="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-2 px-1">
                <div class="w-8 text-center">LN</div>
                <div class="flex-1 pl-2">ATLET & KLUB</div>
                <div class="w-20 text-right pr-1">WAKTU</div>
            </div>
        `,s.lanes_data.forEach(l=>{if(!l.nama)return;let i=l.waktu_tempuh||"NT",o="text-slate-400";i!=="NT"&&i!=="DQ"?o="text-emerald-600":i==="DQ"&&(o="text-red-500"),c+=`
            <div class="flex items-center py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors px-1">
                <div class="w-8 flex justify-center shrink-0">
                    <div class="w-5 h-5 rounded bg-slate-200 text-slate-600 text-[10px] font-black flex items-center justify-center">${l.lane}</div>
                </div>
                <div class="flex-1 pl-2 flex flex-col sm:flex-row sm:items-center min-w-0">
                    <p class="text-xs font-black text-slate-800 uppercase truncate mr-2">${l.nama}</p>
                    <p class="text-[9px] font-bold text-slate-400 uppercase truncate sm:border-l sm:border-slate-300 sm:pl-2 mt-0.5 sm:mt-0">${l.klub}</p>
                </div>
                <div class="w-20 shrink-0 text-right pr-1">
                    <span class="font-mono text-xs font-black tracking-wider ${o}">
                        ${i}
                    </span>
                </div>
            </div>`}),(s.lanes_data.length===0||!s.lanes_data.some(l=>l.nama))&&(c+='<p class="text-[10px] text-slate-400 italic text-center py-3">Tidak ada data atlet di Heat ini.</p>');let d="";if(f.length>0){const l=s.gender.toUpperCase(),i=s.kelompok_umur.toUpperCase();let o=f.filter(a=>{let w=!1,h=!1;return!a.target_gender||a.target_gender==="ALL"?w=!0:w=l.includes(a.target_gender.toUpperCase()),!a.target_umur||a.target_umur==="ALL"?h=!0:a.target_umur==="KIDS"?h=["PEMULA","TAHUN","THN","SD","TK","GRUP","GROUP","KIDS","UMUR","YOUTH"].some(_=>i.includes(_)):a.target_umur==="ADULT"&&(h=["OPEN","SENIOR","DEWASA","MAHASISWA","MASTER","BEBAS"].some(_=>i.includes(_))),w&&h});o.length===0&&(o=f.filter(a=>(!a.target_gender||a.target_gender==="ALL")&&(!a.target_umur||a.target_umur==="ALL"))),o.length===0&&(o=f);const $=p%o.length,u=o[$],T=u.logo_url||"/images/logo.png";d=`
                <a href="${u.link_url||"#"}" target="_blank" class="flex items-center justify-between bg-slate-50 hover:bg-amber-50/80 transition-colors border-b border-slate-200 px-4 py-3 -mx-3 -mt-3 md:-mx-4 md:-mt-4 mb-3 rounded-t-xl group">
                    <div class="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-2 flex-1 min-w-0 pr-4">
                        <span class="text-[9px] md:text-[10px] font-black text-slate-400 group-hover:text-amber-500 uppercase tracking-widest transition-colors shrink-0">
                            Supported By:
                        </span>
                        <span class="text-xs md:text-sm font-bold text-slate-700 group-hover:text-amber-700 truncate transition-colors leading-tight">
                            ${u.sponsor_name}
                        </span>
                    </div>
                    <div class="bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center shrink-0 transition-transform group-hover:scale-105" 
                         style="aspect-ratio: 16/9; width: 72px;">
                        <img src="${T}" 
                             alt="${u.sponsor_name}" 
                             class="w-full h-full object-contain" 
                             loading="lazy" 
                             onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\\'text-[8px] font-bold text-slate-400 text-center leading-tight uppercase\\'>${u.sponsor_name}</span>';">
                    </div>
                </a>
            `}n+=`
        <div class="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 mb-4 overflow-hidden relative">
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-slate-300 z-10"></div>
            ${d}
            <div class="pl-2 mb-3">
                <h3 class="text-xs font-black text-slate-800 uppercase leading-tight">Event #${s.event_number}: ${s.nomor_lomba} - ${s.gender}</h3>
                <p class="text-[9px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">HEAT ${s.heat_number} <span class="text-slate-300 mx-1">|</span> Dari ${s.total_heats}</p>
            </div>
            <div class="bg-slate-50/50 rounded-lg p-2 border border-slate-100">
                ${c}
            </div>
        </div>`}),r.innerHTML=n}function B(){const t=document.getElementById("countdownText"),r=document.getElementById("refreshProgressBar");setInterval(()=>{m--,t.innerText=`${m}s`;const e=m/y*100;r.style.width=`${e}%`,m<=0&&L()},1e3)}document.getElementById("btnRefresh").addEventListener("click",()=>{L()});function L(){k(!1),m=y,document.getElementById("countdownText").innerText=`${m}s`,document.getElementById("refreshProgressBar").style.width="100%"}
