import{s as k}from"./supabase-00114a9c.js";/* empty css              */let h=[],x=[],w="Putra",f="";document.addEventListener("DOMContentLoaded",async()=>{await y(),_()});async function y(){const n=document.getElementById("filterContainer"),s=document.getElementById("loadingState");s.classList.remove("hidden");try{const{data:t,error:a}=await k.from("race_results").select("*").not("time_seconds","is",null).lt("time_seconds",9999);if(a)throw a;h=t||[];const o=new Set;h.forEach(r=>{r.nomor_lomba&&o.add(r.nomor_lomba)}),x=Array.from(o).sort(),g()}catch(t){console.error("Gagal load data nasional:",t),n.innerHTML='<p class="text-red-500 font-bold text-sm py-2">Gagal memuat database SCS.</p>'}finally{s.classList.add("hidden")}}function g(){const n=document.getElementById("filterContainer");if(n.innerHTML="",x.length===0){n.innerHTML='<p class="text-sm font-bold text-slate-400 py-2">Belum ada data lomba.</p>';return}f||(f=x[0]),x.forEach(s=>{const t=document.createElement("button");s===f?t.className="bg-blue-900 text-white px-6 py-2 rounded-full font-bold text-sm shrink-0 shadow-md transition-all":t.className="bg-white text-slate-500 border border-slate-200 px-6 py-2 rounded-full font-bold text-sm shrink-0 hover:bg-slate-50 hover:text-slate-800 transition-all",t.innerText=s,t.onclick=()=>{f=s,g()},n.appendChild(t)}),v()}function _(){const n=document.querySelectorAll(".gender-btn");n.forEach(s=>{s.addEventListener("click",t=>{n.forEach(o=>{o.classList.remove("bg-blue-900","text-white","shadow-md","font-black"),o.classList.add("text-slate-500","font-bold")});const a=t.target;a.classList.remove("text-slate-500","font-bold"),a.classList.add("bg-blue-900","text-white","shadow-md","font-black"),w=a.getAttribute("data-gender"),v()})})}function v(){const n=document.getElementById("emptyState"),s=document.getElementById("leaderboardContent"),t=document.getElementById("podiumContainer"),a=document.getElementById("listContainer");t.innerHTML="",a.innerHTML="";const o=h.filter(e=>e.gender===w&&e.nomor_lomba===f);if(o.length===0){n.classList.remove("hidden"),s.classList.add("hidden");return}n.classList.add("hidden"),s.classList.remove("hidden");const r=new Map;o.forEach(e=>{const l=e.nama_peserta.toLowerCase().trim();if(!r.has(l))r.set(l,e);else{const b=r.get(l);e.time_seconds<b.time_seconds&&r.set(l,e)}});const i=Array.from(r.values()).sort((e,l)=>e.time_seconds-l.time_seconds),d=i[0],c=i[1],m=i[2];let u="";if(c&&(u+=`
            <div class="bg-white rounded-t-2xl shadow-lg w-28 md:w-36 flex flex-col items-center p-4 border-t-4 border-slate-300 relative h-36 justify-end hover:-translate-y-2 transition-transform cursor-pointer" onclick="window.location.href='/f1-id.html?id=${c.athlete_f1_id}'">
                <div class="absolute -top-6 w-12 h-12 bg-slate-100 rounded-full border-2 border-white flex items-center justify-center font-black text-slate-500 shadow-sm">#2</div>
                <p class="font-bold text-xs md:text-sm text-center text-slate-800 line-clamp-1">${c.nama_peserta}</p>
                <p class="text-slate-400 text-[9px] uppercase tracking-wider truncate w-full text-center mt-0.5">${c.klub_asal}</p>
                <p class="font-black text-blue-900 mt-2">${c.waktu_string}</p>
            </div>
        `),d&&(u+=`
            <div class="bg-white rounded-t-2xl shadow-2xl w-32 md:w-44 flex flex-col items-center p-4 border-t-4 border-amber-400 relative h-44 justify-end z-10 transform scale-105 hover:scale-110 transition-transform cursor-pointer" onclick="window.location.href='/f1-id.html?id=${d.athlete_f1_id}'">
                <div class="absolute -top-8 w-16 h-16 bg-gradient-to-br from-amber-300 to-yellow-500 rounded-full border-4 border-white flex items-center justify-center font-black text-white shadow-md text-xl">#1</div>
                <p class="font-black text-sm md:text-base text-center text-slate-900 line-clamp-2 leading-tight">${d.nama_peserta}</p>
                <p class="text-slate-500 text-[10px] uppercase tracking-wider truncate w-full text-center mt-1">${d.klub_asal}</p>
                <p class="font-black text-2xl text-blue-900 mt-2">${d.waktu_string}</p>
            </div>
        `),m&&(u+=`
            <div class="bg-white rounded-t-2xl shadow-lg w-28 md:w-36 flex flex-col items-center p-4 border-t-4 border-orange-600 relative h-32 justify-end hover:-translate-y-2 transition-transform cursor-pointer" onclick="window.location.href='/f1-id.html?id=${m.athlete_f1_id}'">
                <div class="absolute -top-6 w-12 h-12 bg-orange-50 rounded-full border-2 border-white flex items-center justify-center font-black text-orange-700 shadow-sm">#3</div>
                <p class="font-bold text-xs md:text-sm text-center text-slate-800 line-clamp-1">${m.nama_peserta}</p>
                <p class="text-slate-400 text-[9px] uppercase tracking-wider truncate w-full text-center mt-0.5">${m.klub_asal}</p>
                <p class="font-black text-blue-900 mt-2">${m.waktu_string}</p>
            </div>
        `),t.innerHTML=u,i.length>3){let e="";for(let l=3;l<i.length;l++){const b=l+1,p=i[l];e+=`
                <div class="flex items-center justify-between p-4 md:p-5 hover:bg-blue-50 transition-colors cursor-pointer group" onclick="window.location.href='/f1-id.html?id=${p.athlete_f1_id}'">
                    <div class="flex items-center gap-4 min-w-0">
                        <span class="font-black text-slate-300 w-6 text-center text-lg group-hover:text-blue-400 transition-colors">${b}</span>
                        <div class="min-w-0">
                            <p class="font-extrabold text-slate-800 truncate">${p.nama_peserta}</p>
                            <p class="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider truncate mt-0.5">🏠 ${p.klub_asal}</p>
                        </div>
                    </div>
                    <div class="font-mono font-black text-blue-900 text-lg shrink-0 ml-4">
                        ${p.waktu_string}
                    </div>
                </div>
            `}a.innerHTML=e,a.parentElement.classList.remove("hidden")}else a.parentElement.classList.add("hidden")}
