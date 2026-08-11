import{s as v}from"./supabase-00114a9c.js";/* empty css              */let c=null,m=[],i=null,b=30,o=b;document.addEventListener("DOMContentLoaded",async()=>{if(c=new URLSearchParams(window.location.search).get("id"),!c)return alert("Halaman tidak valid. ID Event tidak ditemukan!");await h(),await g(!0),E()});async function h(){try{const{data:t,error:s}=await v.from("events").select("event_name, config").eq("id",c).single();if(t){document.getElementById("headerEventName").innerText=t.event_name;let e=t.config;if(typeof e=="string")try{e=JSON.parse(e)}catch{}if(e&&e.ads_sponsor_name){const n=e.ads_sponsor_logo||"/images/logo.png",a=e.ads_link_url||"#";if(!document.getElementById("scs-global-info")){const r=`
                        <div id="scs-global-info" class="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-amber-500/50 shadow-[0_-10px_20px_rgba(0,0,0,0.4)] z-[99999] py-2 md:py-3 px-4">
                            <a href="${a}" target="_blank" rel="noopener noreferrer" class="max-w-4xl mx-auto flex items-center justify-center gap-4 cursor-pointer group">
                                <span class="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-amber-400 transition-colors">Official Partner</span>
                                <img src="${n}" alt="Official" class="h-8 md:h-10 object-contain drop-shadow-lg">
                            </a>
                        </div>
                    `;document.body.insertAdjacentHTML("beforeend",r),document.body.style.paddingBottom="70px"}}}}catch(t){console.error(t)}}async function g(t=!1){const s=document.getElementById("iconRefresh");s.classList.add("spin-anim");try{const{data:e,error:n}=await v.from("event_heats").select("*").eq("event_id",c).order("event_number",{ascending:!0}).order("heat_number",{ascending:!0});if(n)throw n;m=e||[],t?y():i&&p(i)}catch(e){console.error("Gagal memuat data Live Result:",e)}finally{setTimeout(()=>s.classList.remove("spin-anim"),500)}}function y(){const t=document.getElementById("selectEvent");t.innerHTML='<option value="">-- Pilih Nomor Lomba --</option>',[...new Map(m.map(e=>[e.event_number,e])).values()].forEach(e=>{let n=`Event #${e.event_number}: ${e.nomor_lomba} - ${e.gender} - ${e.kelompok_umur}`;t.innerHTML+=`<option value="${e.event_number}">${n}</option>`}),t.addEventListener("change",e=>{i=e.target.value,p(i)}),document.getElementById("btnShowAll").addEventListener("click",()=>{t.value="",i="ALL",p("ALL")})}function p(t){const s=document.getElementById("resultContainer");if(!t){s.innerHTML=`
        <div class="text-center py-10 opacity-50">
            <div class="text-4xl mb-3">🏊‍♂️</div>
            <h3 class="text-sm font-bold text-slate-600">Pilih lomba di atas untuk melihat hasil Heat.</h3>
        </div>`;return}let e=[];t==="ALL"?e=m:e=m.filter(a=>a.event_number==t);let n="";e.forEach(a=>{let r="";a.lanes_data.forEach(l=>{if(!l.nama)return;let d=l.waktu_tempuh||"NT",u="text-slate-400",f="bg-slate-100";d!=="NT"&&d!=="DQ"?(u="text-emerald-700",f="bg-emerald-50 border border-emerald-200"):d==="DQ"&&(u="text-red-600",f="bg-red-50 border border-red-200"),r+=`
            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 mb-2 hover:bg-slate-100 transition-colors">
                <div class="flex items-center gap-3">
                    <div class="w-7 h-7 rounded bg-slate-300 text-slate-700 text-xs font-black flex items-center justify-center shrink-0">${l.lane}</div>
                    <div>
                        <p class="text-sm font-black text-slate-900 leading-tight uppercase">${l.nama}</p>
                        <p class="text-[10px] font-bold text-slate-500 uppercase">${l.klub}</p>
                    </div>
                </div>
                <div class="shrink-0 pl-2">
                    <span class="inline-block px-3 py-1.5 rounded-lg font-mono text-sm font-black tracking-wider ${u} ${f} shadow-sm">
                        ${d}
                    </span>
                </div>
            </div>`}),r===""&&(r='<p class="text-xs text-slate-400 italic text-center py-2">Tidak ada data atlet di Heat ini.</p>'),n+=`
        <div class="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-slate-300"></div>
            <div class="pl-2 mb-4 flex justify-between items-end border-b border-slate-100 pb-2">
                <div>
                    <h3 class="text-sm font-black text-slate-800 uppercase">Event #${a.event_number}: ${a.nomor_lomba} - ${a.gender}</h3>
                    <p class="text-[10px] text-slate-400 font-bold mt-0.5">HEAT ${a.heat_number} (Dari ${a.total_heats})</p>
                </div>
            </div>
            <div>${r}</div>
        </div>`}),s.innerHTML=n}function E(){const t=document.getElementById("countdownText"),s=document.getElementById("refreshProgressBar");setInterval(()=>{o--,t.innerText=`${o}s`;const e=o/b*100;s.style.width=`${e}%`,o<=0&&x()},1e3)}document.getElementById("btnRefresh").addEventListener("click",()=>{x()});function x(){g(!1),o=b,document.getElementById("countdownText").innerText=`${o}s`,document.getElementById("refreshProgressBar").style.width="100%"}
