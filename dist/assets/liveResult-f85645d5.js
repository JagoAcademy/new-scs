import{s as b}from"./supabase-00114a9c.js";/* empty css              */let f=null,g=[],h=[];document.addEventListener("DOMContentLoaded",async()=>{const{data:{session:t},error:n}=await b.auth.getSession();if(n||!t){alert("⚠️ Akses Ditolak! Anda belum login."),window.location.replace("/auth.html");return}if(f=new URLSearchParams(window.location.search).get("id"),!f)return alert("ID Event tidak ditemukan!");await E()});async function E(){try{const{data:t,error:n}=await b.from("event_heats").select("*").eq("event_id",f).order("event_number",{ascending:!0}).order("heat_number",{ascending:!0});if(n)throw n;g=t||[],x()}catch(t){console.error(t),alert("Gagal memuat data Start List.")}}function x(){const t=document.getElementById("selectEvent");t.innerHTML='<option value="">-- Pilih Nomor Lomba --</option>',[...new Map(g.map(e=>[e.event_number,e])).values()].forEach(e=>{let i=`Event #${e.event_number}: ${e.nomor_lomba} - ${e.gender} - ${e.kelompok_umur}`;t.innerHTML+=`<option value="${e.event_number}">${i}</option>`}),t.addEventListener("change",e=>{w(e.target.value)}),document.getElementById("btnShowAll").addEventListener("click",()=>{t.value="",w("ALL")})}function w(t){const n=document.getElementById("allHeatsContainer");if(!t){n.classList.add("hidden");return}h=t==="ALL"?g:g.filter(e=>e.event_number==t),n.innerHTML="",h.forEach((e,i)=>{let r="";e.lanes_data.forEach((s,a)=>{if(!s.nama){r+=`
                <div class="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200 opacity-50">
                    <div class="w-8 h-8 rounded bg-slate-200 text-slate-500 font-bold flex items-center justify-center shrink-0">${s.lane}</div>
                    <div class="flex-1"><p class="text-sm font-bold text-slate-400 italic">--- Kosong ---</p></div>
                </div>`;return}let u="",m="",o="";if(s.waktu_tempuh){if(s.waktu_tempuh==="DQ")u="DQ";else if(s.waktu_tempuh!=="NT"){const l=s.waktu_tempuh.split(/[:.]/);l.length===3&&(u=l[0],m=l[1],o=l[2])}}r+=`
            <div class="flex flex-col md:flex-row md:items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-red-300 transition-colors">
                <div class="flex items-center gap-3 flex-1">
                    <div class="w-8 h-8 rounded bg-slate-800 text-white font-bold flex items-center justify-center shrink-0">${s.lane}</div>
                    <div>
                        <p class="text-sm font-black text-slate-900 leading-tight uppercase">${s.nama}</p>
                        <p class="text-[10px] font-bold text-slate-500 uppercase">${s.klub}</p>
                    </div>
                </div>
                
                <div class="flex items-center gap-1 shrink-0 mt-2 md:mt-0">
                    <input type="text" inputmode="numeric" maxlength="2" id="min_${i}_${a}" value="${u}" placeholder="00" class="w-12 text-center py-2 bg-slate-100 border border-slate-300 rounded focus:ring-2 focus:ring-red-500 font-mono text-sm font-bold outline-none input-waktu">
                    <span class="font-black text-slate-400">:</span>
                    <input type="text" inputmode="numeric" maxlength="2" id="sec_${i}_${a}" value="${m}" placeholder="00" class="w-12 text-center py-2 bg-slate-100 border border-slate-300 rounded focus:ring-2 focus:ring-red-500 font-mono text-sm font-bold outline-none input-waktu">
                    <span class="font-black text-slate-400">.</span>
                    <input type="text" inputmode="numeric" maxlength="2" id="ms_${i}_${a}" value="${o}" placeholder="00" class="w-12 text-center py-2 bg-slate-100 border border-slate-300 rounded focus:ring-2 focus:ring-red-500 font-mono text-sm font-bold outline-none input-waktu">
                    
                    <button onclick="setDQ(${i}, ${a})" class="ml-2 px-2 py-2 bg-red-100 text-red-600 rounded text-xs font-bold hover:bg-red-200 transition-colors">DQ</button>
                </div>
            </div>`}),n.innerHTML+=`
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div class="flex justify-between items-end mb-4 border-b border-slate-200 pb-4">
                <div>
                    <h2 class="text-lg font-black text-slate-900 uppercase">Event #${e.event_number}: ${e.nomor_lomba} - ${e.gender}</h2>
                    <p class="text-sm font-bold text-red-600 mt-1">HEAT ${e.heat_number} (Dari ${e.total_heats})</p>
                </div>
            </div>
            <div class="space-y-3 mb-4">
                ${r}
            </div>
            <button id="btnSubmit_${i}" onclick="submitHeatData(${i}, '${e.id}')" class="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm py-3 rounded-xl shadow transition-transform active:scale-95 flex items-center justify-center gap-2">
                💾 Simpan Waktu Heat ${e.heat_number}
            </button>
        </div>`}),n.classList.remove("hidden"),y()}function y(){document.querySelectorAll(".input-waktu").forEach(t=>{t.addEventListener("input",function(){if(this.value.length>=2&&this.value.toUpperCase()!=="DQ"){let n=this.nextElementSibling;for(;n&&n.tagName!=="INPUT";)n=n.nextElementSibling;n&&n.focus()}})})}window.setDQ=function(t,n){document.getElementById(`min_${t}_${n}`).value="DQ",document.getElementById(`sec_${t}_${n}`).value="",document.getElementById(`ms_${t}_${n}`).value=""};window.submitHeatData=async function(t,n){const e=document.getElementById(`btnSubmit_${t}`),i=e.innerHTML;e.innerText="⏳ Menyimpan...",e.disabled=!0;let r=h[t],s=[...r.lanes_data];s.forEach((a,u)=>{if(!a.nama)return;let m=document.getElementById(`min_${t}_${u}`),o=document.getElementById(`sec_${t}_${u}`),l=document.getElementById(`ms_${t}_${u}`),d=m.value.trim().toUpperCase(),c=o.value.trim(),p=l.value.trim(),_=d===""&&c===""&&p==="";if(d==="DQ")a.waktu_tempuh="DQ";else if(d==="NT"||_)a.waktu_tempuh="NT";else{let v=d===""?"00":d.padStart(2,"0"),k=c===""?"00":c.padStart(2,"0"),$=p===""?"00":p.padStart(2,"0");a.waktu_tempuh=`${v}:${k}.${$}`}});try{const{data:a,error:u}=await b.from("event_heats").update({lanes_data:s}).eq("id",n).select();if(u)throw u;if(!a||a.length===0)throw new Error("Gagal menyimpan! Anda tidak memiliki Hak Akses (RLS).");r.lanes_data=s;let m=[];if(s.forEach(o=>{let l=o.waktu_tempuh,d=null;if(l==="DQ"||l==="DNS")d=9999.99;else if(l&&l!=="NT"){let c=l.split(/[:.]/);if(c.length===3){let p=parseInt(c[0])||0,_=parseInt(c[1])||0,v=parseInt(c[2])||0;d=p*60+_+v/100}}d!==null&&m.push({event_id:f,athlete_f1_id:o.f1_id||null,nama_peserta:o.nama,klub_asal:o.klub,nomor_lomba:r.nomor_lomba,kelompok_umur:r.kelompok_umur,gender:r.gender,heat_number:r.heat_number,waktu_string:l,time_seconds:d})}),m.length>0){await b.from("race_results").delete().eq("event_id",f).eq("nomor_lomba",r.nomor_lomba).eq("kelompok_umur",r.kelompok_umur).eq("gender",r.gender).eq("heat_number",r.heat_number);const{error:o}=await b.from("race_results").insert(m);if(o)throw o}e.classList.replace("bg-slate-800","bg-green-600"),e.innerText="✅ Tersimpan!",setTimeout(()=>{e.classList.replace("bg-green-600","bg-slate-800"),e.innerHTML=i},2e3)}catch(a){console.error(a),alert(a.message||"Gagal menyimpan waktu!")}finally{e.disabled=!1}};
