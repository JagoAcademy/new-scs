import"./modulepreload-polyfill-3cfb730f.js";/* empty css              */import{s as m}from"./supabase-b7fcd0c7.js";let c=null;document.addEventListener("DOMContentLoaded",async()=>{const{data:{session:r},error:s}=await m.auth.getSession();if(s||!r){window.location.href="/auth.html";return}if(c=new URLSearchParams(window.location.search).get("id"),!c){alert("ID Event tidak ditemukan!");return}document.getElementById("btnBack").href=`/event-dashboard.html?id=${c}`,document.getElementById("btnLoadHeat").addEventListener("click",b),document.getElementById("btnSaveFormasi").addEventListener("click",p),Sortable.create(document.getElementById("gudangKosong"),{group:{name:"shared-heats",pull:"clone",put:!1},animation:200,sort:!1}),Sortable.create(document.getElementById("gudangAtlet"),{group:{name:"shared-heats",pull:!0,put:!0},animation:200,ghostClass:"ghost-drop"})});async function b(){const r=document.getElementById("heatContainerMain"),s=document.getElementById("loadingState");s.classList.remove("hidden"),r.innerHTML="";try{const{data:n,error:d}=await m.from("event_heats").select("*").eq("event_id",c).order("event_number",{ascending:!0}).order("heat_number",{ascending:!0});if(d)throw d;if(!n||n.length===0){r.innerHTML=`<p class="text-slate-500 p-5 text-center bg-white rounded-xl shadow-sm border border-slate-200">Belum ada heat yang di-generate. Silakan 'Simpan & Kunci Start List' dari halaman Buku Acara terlebih dahulu.</p>`,s.classList.add("hidden");return}let l=8;n[0]&&n[0].lanes_data&&(l=n[0].lanes_data.length);const a={};n.forEach(t=>{a[t.event_number]||(a[t.event_number]=[]),a[t.event_number].push(t)});let e="";Object.keys(a).forEach(t=>{let i=a[t];e+=`
            <div class="event-group bg-slate-100 rounded-3xl p-4 md:p-6 border border-slate-200 shadow-inner">
                <div class="event-header bg-slate-900 text-white rounded-xl p-4 shadow-lg mb-6 flex justify-between items-center">
                    <div>
                        <h2 class="text-sm md:text-base font-black uppercase tracking-widest text-emerald-400">EVENT #${t}</h2>
                        <p class="text-xs md:text-sm font-bold text-slate-300 mt-1">${i[0].nomor_lomba} • ${i[0].gender} • ${i[0].kelompok_umur}</p>
                    </div>
                    <div class="text-right">
                        <span class="bg-slate-700 px-3 py-1 rounded-lg text-xs font-bold font-mono">${i.length} Heats</span>
                    </div>
                </div>
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
            `,i.forEach(o=>{e+=h(o.id,o.heat_number,o.lanes_data,l)}),e+="</div></div>"}),r.innerHTML=e,document.querySelectorAll(".heat-sortable-list").forEach(t=>{Sortable.create(t,{group:"shared-heats",animation:200,ghostClass:"ghost-drop",delay:150,delayOnTouchOnly:!0,onEnd:function(){u()}})}),u()}catch(n){alert("Gagal memuat formasi Heat: "+n.message)}finally{s.classList.add("hidden")}}function h(r,s,n,d){let l="";n.sort((a,e)=>a.lane-e.lane);for(let a=1;a<=d;a++){let e=n.find(t=>t.lane==a);if(e&&e.f1_id&&e.nama){let t=e.seed_time?e.seed_time:"NT",i=e.seed_time!=="NT"?"text-indigo-600 bg-indigo-50 border-indigo-200":"text-slate-400 bg-slate-100 border-slate-200";l+=`
            <div class="item bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between cursor-move hover:border-indigo-400 hover:shadow-md transition-all mb-2" 
                 data-f1="${e.f1_id}" 
                 data-idreg="${e.id_pendaftaran}" 
                 data-name="${e.nama}" 
                 data-club="${e.klub}" 
                 data-time="${e.seed_time||"NT"}">
                <div class="flex items-center gap-3 w-full">
                    <div class="text-slate-300 font-black cursor-grab">⣿</div>
                    <span class="lane-label w-7 h-7 shrink-0 bg-slate-800 text-white rounded-lg flex items-center justify-center text-[10px] font-black font-mono shadow-sm">L${a}</span>
                    <div class="overflow-hidden">
                        <p class="text-[11px] md:text-xs font-bold text-slate-800 uppercase truncate leading-tight">${e.nama}</p>
                        <p class="text-[9px] font-bold text-slate-400 uppercase truncate">${e.klub}</p>
                    </div>
                </div>
                <span class="text-[10px] font-mono font-bold px-2 py-1 rounded border shrink-0 ml-2 ${i}">${t}</span>
            </div>`}else l+=`
            <div class="item border border-dashed border-slate-300 bg-slate-50/50 rounded-xl p-3 flex items-center gap-3 cursor-move mb-2" data-f1="EMPTY">
                <div class="text-slate-300 font-black cursor-grab">⣿</div>
                <span class="lane-label w-7 h-7 shrink-0 bg-slate-300 text-slate-500 rounded-lg flex items-center justify-center text-[10px] font-black font-mono">L${a}</span>
                <span class="text-xs font-bold text-slate-400 italic">[ LINTASAN KOSONG ]</span>
            </div>`}return`
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-5 relative" data-db-id="${r}">
        <div class="absolute -top-3 -left-3 w-8 h-8 bg-amber-400 text-white rounded-full flex items-center justify-center font-black text-sm border-2 border-white shadow-sm">${s}</div>
        <h3 class="text-xs font-black text-slate-700 border-b border-slate-100 pb-2 mb-4 pl-6 uppercase tracking-widest flex justify-between items-center">
            Heat ${s}
        </h3>
        <div class="heat-sortable-list min-h-[50px]" data-heat-number="${s}">
            ${l}
        </div>
    </div>`}function u(){document.querySelectorAll(".heat-sortable-list").forEach(s=>{s.querySelectorAll(".item").forEach((d,l)=>{const a=d.querySelector(".lane-label");a&&(a.innerText=`L${l+1}`)})})}async function p(){const r=document.getElementById("btnSaveFormasi"),s=document.querySelectorAll("#heatContainerMain > div > div > div[data-db-id]");if(s.length===0)return alert("Belum ada data yang di-load.");if(confirm("Peringatan: Aksi ini akan menimpa SELURUH formasi lomba di Database. Lanjutkan?")){r.innerHTML='<span class="animate-spin">⏳</span> Menyimpan Semua...',r.disabled=!0;try{const n=[];s.forEach(d=>{const l=d.getAttribute("data-db-id");let a=[];d.querySelectorAll(".heat-sortable-list .item").forEach((t,i)=>{let o=t.getAttribute("data-f1");o&&o!=="EMPTY"&&a.push({lane:i+1,f1_id:o,id_pendaftaran:t.getAttribute("data-idreg"),nama:t.getAttribute("data-name"),klub:t.getAttribute("data-club"),seed_time:t.getAttribute("data-time")!=="NT"?t.getAttribute("data-time"):null})}),n.push(m.from("event_heats").update({lanes_data:a}).eq("id",l))}),await Promise.all(n),alert("🔥 BOOM! Seluruh Formasi Lomba Berhasil Disimpan Massal! Siap Cetak!")}catch(n){alert("Gagal menyimpan formasi secara massal: "+n.message)}finally{r.innerHTML="<span>💾</span> Simpan Semua Formasi",r.disabled=!1}}}
