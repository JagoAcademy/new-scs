import{s as m}from"./supabase-00114a9c.js";/* empty css              */document.addEventListener("DOMContentLoaded",async()=>{const o=new URLSearchParams(window.location.search).get("id");if(!o){alert("ID Event tidak ditemukan!");return}try{const{data:l}=await m.from("events").select("event_name").eq("id",o).single();l&&(document.getElementById("eventName").innerText=l.event_name);const{data:c,error:p}=await m.from("event_heats").select("*").eq("event_id",o).order("event_number",{ascending:!0}).order("heat_number",{ascending:!0});if(p)throw p;const d=document.getElementById("heatContainer");if(d.innerHTML="",!c||c.length===0){d.innerHTML=`
            <div class="text-center p-10 border-2 border-dashed border-red-300 rounded-2xl bg-red-50">
                <h3 class="text-red-600 font-black text-lg">⚠️ Buku Acara Kosong!</h3>
                <p class="text-slate-600 text-sm mt-2">Anda belum meng-generate Start List. Harap masuk ke menu "Buku Acara (Start List)" lalu klik Simpan.</p>
            </div>`;return}const n={};c.forEach(r=>{const a=r.sesi||"SESI UTAMA";n[a]||(n[a]=[]),n[a].push(r)}),Object.keys(n).forEach(r=>{d.innerHTML+=`
            <div class="border-y-[3px] border-slate-900 py-2 text-center font-black uppercase tracking-[0.3em] text-sm mb-6 mt-10">
                ${r}
            </div>`;let a="";n[r].forEach(e=>{let i="";e.lanes_data.sort((s,t)=>s.lane-t.lane);const b=e.lanes_data.length;for(let s=0;s<b;s++){const t=e.lanes_data[s];t&&t.f1_id&&t.nama?i+=`
                        <tr class="border-b border-slate-300 text-xs text-slate-900">
                            <td class="py-1 px-2 text-center font-black">${t.lane}</td>
                            <td class="py-1 px-2 font-bold tracking-tight">${t.nama.toUpperCase()}</td>
                            <td class="py-1 px-2 font-semibold text-slate-600">${t.klub}</td>
                            <td class="py-1 px-2 text-center font-mono font-bold text-slate-700">${t.seed_time||"NT"}</td>
                        </tr>`:i+=`
                        <tr class="border-b border-slate-200 text-xs text-slate-400">
                            <td class="py-1 px-2 text-center font-bold">${t?t.lane:s+1}</td>
                            <td class="py-1 px-2 italic">--- Kosong ---</td>
                            <td class="py-1 px-2"></td>
                            <td class="py-1 px-2"></td>
                        </tr>`}a+=`
                <div class="print-break-inside-avoid mb-6">
                    <div class="flex justify-between items-end border-b-2 border-slate-800 pb-1 mb-1 mt-4">
                        <h3 class="font-black text-[11px] uppercase text-slate-900">EVENT #${e.event_number}: ${e.nomor_lomba} - ${e.gender} - ${e.kelompok_umur}</h3>
                        <span class="font-black text-[10px] text-slate-500 uppercase tracking-wider">HEAT ${e.heat_number} of ${e.total_heats}</span>
                    </div>
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="text-[9px] text-slate-500 uppercase tracking-widest border-b-[2px] border-slate-400">
                                <th class="py-1 px-2 w-10 text-center font-black">LINT</th>
                                <th class="py-1 px-2 font-black">NAMA ATLET</th>
                                <th class="py-1 px-2 font-black">KLUB / SEKOLAH</th>
                                <th class="py-1 px-2 w-24 text-center font-black">SEED TIME</th>
                            </tr>
                        </thead>
                        <tbody>${i}</tbody>
                    </table>
                </div>`}),d.innerHTML+=a})}catch(l){alert("Gagal memuat dokumen: "+l.message)}});
