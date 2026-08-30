import"./modulepreload-polyfill-3cfb730f.js";/* empty css              */import{s as x}from"./supabase-b7fcd0c7.js";document.addEventListener("DOMContentLoaded",async()=>{const n=new URLSearchParams(window.location.search).get("id");if(!n){alert("ID Event tidak ditemukan!");return}try{const{data:e}=await x.from("events").select("*").eq("id",n).single();if(e){const o=e.event_name||"EVENT TANPA NAMA";document.getElementById("coverTitle").innerText=o,document.getElementById("contentTitle").innerText=o,document.getElementById("repeatTitle").innerText=o;let l="Jadwal belum dikonfirmasi";const a=e.start_date||e.event_date||e.tanggal;if(a)try{const b=new Date(a);isNaN(b.getTime())||(l=b.toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"}))}catch{}document.getElementById("coverDate").innerText=l;const p=e.config||{},c=e.kota||"",s=e.provinsi||"",t=p.nama_kolam||"";let u="";t&&(u+=`${t} - `),c&&s?u+=`${c}, ${s}`:(c||s)&&(u+=`${c}${s}`),document.getElementById("coverLocation").innerText=u||"Lokasi belum dikonfirmasi",await g(n)}const{data:i,error:m}=await x.from("event_heats").select("*").eq("event_id",n).order("event_number",{ascending:!0}).order("heat_number",{ascending:!0});if(m)throw m;const d=document.getElementById("heatContainer");if(d.innerHTML="",!i||i.length===0){d.innerHTML=`
            <div class="text-center p-10 border-2 border-dashed border-red-300 rounded-2xl bg-red-50">
                <h3 class="text-red-600 font-black text-lg">⚠️ Buku Acara Kosong!</h3>
                <p class="text-slate-600 text-sm mt-2">Anda belum meng-generate Start List. Harap masuk ke menu "Pusat Cetak > Buku Acara" lalu klik Simpan.</p>
            </div>`;return}const r={};i.forEach(o=>{const l=o.sesi||"SESI UTAMA";r[l]||(r[l]=[]),r[l].push(o)}),Object.keys(r).forEach(o=>{d.innerHTML+=`
            <div class="bg-slate-800 text-white py-3 text-center font-black uppercase tracking-widest text-sm mb-8 mt-10 print:mt-6 rounded-md print:rounded-none print:border-y-[3px] print:border-black print:bg-transparent print:text-black">
                --- ${o} ---
            </div>`;let l="";r[o].forEach(a=>{let p="";a.lanes_data.sort((s,t)=>s.lane-t.lane);const c=a.lanes_data.length;for(let s=0;s<c;s++){const t=a.lanes_data[s];t&&t.f1_id&&t.nama?p+=`
                        <tr class="border-b border-slate-200 text-[13px] text-slate-800">
                            <td class="py-2 px-3 text-center font-bold">${t.lane}</td>
                            <td class="py-2 px-3 font-bold truncate max-w-0" title="${t.nama.toUpperCase()}">${t.nama.toUpperCase()}</td>
                            <td class="py-2 px-3 font-medium text-slate-600 truncate max-w-0 uppercase" title="${t.klub}">${t.klub}</td>
                            <td class="py-2 px-3 text-center font-mono font-bold text-slate-500">${t.seed_time||"NT"}</td>
                        </tr>`:p+=`
                        <tr class="border-b border-slate-200 text-[13px] text-slate-300">
                            <td class="py-2 px-3 text-center">${t?t.lane:s+1}</td>
                            <td class="py-2 px-3 italic truncate max-w-0">--- Kosong ---</td>
                            <td class="py-2 px-3 truncate max-w-0"></td>
                            <td class="py-2 px-3"></td>
                        </tr>`}l+=`
                <div class="avoid-break mb-8 mt-6">
                    <div class="flex justify-between items-end border-b-2 border-slate-700 pb-2 mb-2 bg-slate-50/50 print:bg-transparent px-1">
                        <h3 class="font-extrabold text-[12px] uppercase text-slate-900 tracking-tight">Event #${a.event_number}: ${a.nomor_lomba} - ${a.gender} - ${a.kelompok_umur}</h3>
                        <span class="font-black text-[11px] text-slate-600 uppercase tracking-widest bg-slate-200 print:bg-transparent px-2 py-0.5 rounded">HEAT ${a.heat_number} of ${a.total_heats}</span>
                    </div>
                    <table class="w-full text-left border-collapse table-fixed mt-1">
                        <thead>
                            <tr class="text-[10px] text-slate-400 uppercase tracking-widest border-b-[2px] border-slate-300">
                                <th class="py-2 px-3 w-12 text-center font-black">LINT</th>
                                <th class="py-2 px-3 w-[45%] font-black">NAMA ATLET</th>
                                <th class="py-2 px-3 w-[35%] font-black">KLUB / SEKOLAH</th>
                                <th class="py-2 px-3 text-center font-black">SEED TIME</th>
                            </tr>
                        </thead>
                        <tbody>${p}</tbody>
                    </table>
                </div>`}),d.innerHTML+=l})}catch(e){alert("Gagal memuat dokumen: "+e.message)}});async function g(f){try{const{data:n}=await x.from("event_sponsors").select("sponsor_ids").eq("event_id",f).single(),e=document.getElementById("coverSponsors");if(!n||!n.sponsor_ids||n.sponsor_ids.length===0){e.innerHTML='<span class="text-xs text-slate-300 font-bold italic">Tanpa Dukungan Sponsor</span>';return}const{data:i}=await x.from("master_sponsors").select("*").in("id",n.sponsor_ids);if(!i||i.length===0){e.innerHTML='<span class="text-xs text-slate-300 font-bold italic">Tanpa Dukungan Sponsor</span>';return}const m=i.slice(0,3);let d="";m.forEach(r=>{d+=`
                <img src="${r.logo_url}" 
                     alt="${r.sponsor_name}" 
                     class="transition-transform hover:scale-105"
                     onerror="this.onerror=null; this.outerHTML='<div class=\\'bg-white border border-slate-200 px-4 py-2 rounded shadow-sm text-sm font-black text-slate-400 uppercase\\'>${r.sponsor_name}</div>';">
            `}),e.innerHTML=d}catch(n){console.error("Gagal merender sponsor cover:",n)}}
