import"./modulepreload-polyfill-3cfb730f.js";/* empty css              */import{s as u}from"./supabase-b7fcd0c7.js";let c=1;const g=10;let m=[];document.addEventListener("DOMContentLoaded",async()=>{if(sessionStorage.getItem("aztec_key")!=="buka_sesame"){$();return}const{data:{user:e},error:t}=await u.auth.getUser();if(t||!e){window.location.replace("/auth.html");return}if(!["radityaraja@gmail.com","fajar@f1swimming.com","jagorenangakademi@gmail.com","indra@f1swimming.com"].includes(e.email)){v(e.email);return}document.getElementById("btnAdminLogout").addEventListener("click",async()=>{await u.auth.signOut(),window.location.replace("/auth.html")}),p();const a=document.getElementById("searchClub");a&&a.addEventListener("input",l=>{const r=l.target.value.toLowerCase();window.allClubsAdmin&&(m=window.allClubsAdmin.filter(i=>i.club_name&&i.club_name.toLowerCase().includes(r)||i.coach_name&&i.coach_name.toLowerCase().includes(r)||i.kota_asal&&i.kota_asal.toLowerCase().includes(r)||i.provinsi&&i.provinsi.toLowerCase().includes(r)),c=1,x(m))});const n=document.getElementById("btnPrevClub"),s=document.getElementById("btnNextClub");n&&n.addEventListener("click",()=>{c>1&&(c--,x(m))}),s&&s.addEventListener("click",()=>{const l=Math.ceil(m.length/g);c<l&&(c++,x(m))})});function v(e){document.body.innerHTML=`
        <div style="height:100vh;width:100vw;display:flex;flex-direction:column;align-items:center;justify-content:center;background-color:#0f172a;color:#f87171;font-family:sans-serif;text-align:center;position:fixed;top:0;left:0;z-index:999999;">
            <span style="font-size:6rem;margin-bottom:20px;">🛑</span>
            <h1 style="font-size:2rem;font-weight:900;text-transform:uppercase;margin-bottom:10px;">Akses Ditolak!</h1>
            <p style="color:#94a3b8;">Sistem mendeteksi email Anda (${e}) tidak terotorisasi.</p>
        </div>`,setTimeout(()=>window.location.replace("/dashboard.html"),3e3)}function $(){document.body.innerHTML=`
        <div style="height:100vh;width:100vw;display:flex;flex-direction:column;align-items:center;justify-content:center;background-color:#0f172a;color:#f87171;font-family:sans-serif;text-align:center;position:fixed;top:0;left:0;z-index:999999;">
            <span style="font-size:6rem;margin-bottom:20px;">🗿</span>
            <h1 style="font-size:3rem;font-weight:900;text-transform:uppercase;">Boss Pintunya ga disini 🤣</h1>
        </div>`,setTimeout(()=>window.location.replace("/dashboard.html"),2500)}async function p(){try{await E();const{data:e,error:t}=await u.from("athletes").select("*, clubs(club_name)").eq("is_verified",!1).not("foto_url","is",null).not("akta_url","is",null);if(t)throw t;C(e);const{data:o,error:a}=await u.from("f1_edit_requests").select("*, athletes (full_name, dob, gender, clubs(club_name))").eq("status","PENDING").order("created_at",{ascending:!1});if(a)throw a;T(o);const{data:n,error:s}=await u.from("clubs").select("*").order("id",{ascending:!1});if(s)throw s;const l=await Promise.all(n.map(async r=>{const{count:i,error:b}=await u.from("athletes").select("*",{count:"exact",head:!0}).eq("club_id",r.id);return{...r,athlete_count:b?0:i||0}}));window.allClubsAdmin=l||[],m=[...window.allClubsAdmin],c=1,x(m)}catch(e){console.error("Gagal memuat admin:",e)}}async function E(){const e=document.getElementById("upgradeQueueTableBody");try{const{data:t,error:o}=await u.from("event_transactions").select("*, events(event_name)").eq("status","PENDING").order("created_at",{ascending:!1});if(o)throw o;if(document.getElementById("badgeUpgradeQueue").innerText=`${t?t.length:0} Pending`,!t||t.length===0){e.innerHTML='<tr><td colspan="4" class="p-8 text-center text-slate-500 font-bold">Tidak ada pengajuan bayar PRO baru. Server aman! ☕</td></tr>';return}let a="";t.forEach(n=>{var r;const s=((r=n.events)==null?void 0:r.event_name)||"Event ID: "+n.event_id,l=new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR"}).format(n.nominal);a+=`
                <tr class="hover:bg-slate-800 transition-colors">
                    <td class="p-4">
                        <p class="font-extrabold text-white text-base">${s}</p>
                        <p class="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Trans ID: #${n.id} • ${n.jenis_transaksi}</p>
                    </td>
                    <td class="p-4">
                        <span class="text-sm font-black text-amber-400 bg-amber-900/30 px-3 py-1.5 rounded-lg border border-amber-700/50 shadow-inner">${l}</span>
                    </td>
                    <td class="p-4">
                        <a href="${n.bukti_url}" target="_blank" class="px-4 py-2 bg-blue-900/50 text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition border border-blue-800 inline-flex items-center gap-2">
                            <span>📄</span> Cek Struk
                        </a>
                    </td>
                    <td class="p-4 text-center space-x-2">
                        <button onclick="rejectUpgrade(${n.id})" class="px-4 py-2 bg-slate-700 hover:bg-red-600 text-white font-bold rounded-lg text-xs shadow-lg transition">TOLAK</button>
                        <button onclick="approveUpgrade(${n.id}, ${n.event_id}, '${s}')" class="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black rounded-lg text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)] transition transform hover:scale-105">✅ AKTIFKAN PRO</button>
                    </td>
                </tr>
            `}),e.innerHTML=a}catch(t){console.error("Gagal load upgrade requests:",t),e.innerHTML=`<tr><td colspan="4" class="p-8 text-center text-red-500 font-bold">Error memuat transaksi: ${t.message}</td></tr>`}}window.approveUpgrade=async(e,t,o)=>{if(confirm(`Yakin ingin ACC pembayaran dan mengaktifkan kasta PRO/EMAS untuk event:

👉 ${o}

Pastikan uang sudah masuk mutasi BCA!`))try{const{error:a}=await u.from("event_transactions").update({status:"APPROVED"}).eq("id",e);if(a)throw a;const{error:n}=await u.from("events").update({event_tier:"PRO"}).eq("id",t);if(n)throw n;alert(`✅ BOOM! Transaksi sukses di-ACC.
Event "${o}" resmi menjadi PRO/EMAS!`),p()}catch(a){alert("Gagal menyetujui: "+a.message)}};window.rejectUpgrade=async e=>{if(confirm("Yakin ingin MENOLAK bukti bayar ini? Transaksi akan dibatalkan."))try{const{error:t}=await u.from("event_transactions").update({status:"REJECTED"}).eq("id",e);if(t)throw t;p()}catch(t){alert("Gagal menolak transaksi: "+t.message)}};function C(e){const t=document.getElementById("queueTableBody");if(document.getElementById("badgeQueue").innerText=`${e?e.length:0} Pending`,!e||e.length===0){t.innerHTML='<tr><td colspan="4" class="p-8 text-center text-slate-500 font-bold">Tidak ada antrian verifikasi awal.</td></tr>';return}let o="";e.forEach(a=>{var s;const n=((s=a.clubs)==null?void 0:s.club_name)||"Tanpa Klub";o+=`
            <tr class="hover:bg-slate-800 transition-colors">
                <td class="p-4">
                    <p class="font-extrabold text-white">${a.full_name}</p>
                    <p class="text-xs font-mono text-emerald-400 mt-0.5">${a.f1_id}</p>
                </td>
                <td class="p-4 text-slate-300 font-medium">${n}</td>
                <td class="p-4">
                    <div class="flex gap-2">
                        <a href="${a.foto_url}" target="_blank" class="px-2 py-1 bg-blue-900/50 text-blue-400 rounded text-[10px] font-bold hover:bg-blue-900 transition border border-blue-800">📸 Lihat Foto</a>
                        <a href="${a.akta_url}" target="_blank" class="px-2 py-1 bg-purple-900/50 text-purple-400 rounded text-[10px] font-bold hover:bg-purple-900 transition border border-purple-800">📄 Lihat Akta</a>
                    </div>
                </td>
                <td class="p-4 text-center">
                    <button onclick="approveAthlete('${a.f1_id}')" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-lg transition transform hover:scale-105">✅ APPROVE</button>
                </td>
            </tr>
        `}),t.innerHTML=o}function T(e){const t=document.getElementById("editQueueTableBody");if(document.getElementById("badgeEditQueue").innerText=`${e?e.length:0} Pending`,!e||e.length===0){t.innerHTML='<tr><td colspan="5" class="p-8 text-center text-slate-500 font-bold">Tidak ada usulan perubahan data. Server aman! ☕</td></tr>';return}let o="";e.forEach(a=>{var l;const n=a.athletes||{},s=((l=n==null?void 0:n.clubs)==null?void 0:l.club_name)||"Tanpa Klub";o+=`
            <tr class="hover:bg-slate-800 transition-colors">
                <td class="p-4">
                    <p class="font-mono font-bold text-amber-400">${a.f1_id}</p>
                    <p class="text-[10px] text-slate-500 mt-1">${s}</p>
                </td>
                <td class="p-4 bg-red-950/20 border-r border-slate-700">
                    <p class="text-sm font-bold text-slate-300 line-through">${n.full_name||"N/A"}</p>
                    <p class="text-xs text-slate-500 mt-0.5">${n.gender||"N/A"} • ${n.dob||"N/A"}</p>
                </td>
                <td class="p-4 bg-emerald-950/20">
                    <p class="text-sm font-extrabold text-emerald-400">${a.new_name}</p>
                    <p class="text-xs text-emerald-600 mt-0.5">${a.new_gender} • ${a.new_dob}</p>
                </td>
                <td class="p-4">
                    <a href="${a.new_akta_url}" target="_blank" class="px-3 py-1.5 bg-purple-900/50 text-purple-400 rounded text-[10px] font-bold hover:bg-purple-900 transition border border-purple-800 inline-block">📄 Cek Akta</a>
                </td>
                <td class="p-4 text-center space-x-2">
                    <button onclick="rejectEdit(${a.id})" class="px-3 py-1.5 bg-slate-700 hover:bg-red-600 text-white font-bold rounded-lg text-xs shadow-lg transition">TOLAK</button>
                    <button onclick="approveEdit(${a.id}, '${a.f1_id}', '${a.new_name}', '${a.new_dob}', '${a.new_gender}', '${a.new_foto_url}', '${a.new_akta_url}')" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-lg transition transform hover:scale-105">✅ ACC</button>
                </td>
            </tr>
        `}),t.innerHTML=o}function x(e){const t=document.getElementById("clubTableBody"),o=document.getElementById("clubCountInfo"),a=document.getElementById("btnPrevClub"),n=document.getElementById("btnNextClub"),s=document.getElementById("pageInfoClub");if(!e||e.length===0){t.innerHTML='<tr><td colspan="6" class="p-8 text-center text-slate-500 font-bold">Tidak ada klub ditemukan.</td></tr>',o&&(o.innerText="Menampilkan 0 klub."),a&&(a.disabled=!0),n&&(n.disabled=!0),s&&(s.innerText="Page 1 of 1");return}const l=Math.ceil(e.length/g);c>l&&(c=l),c<1&&(c=1);const r=(c-1)*g,i=r+g,b=e.slice(r,i);let f="";if(b.forEach((d,h)=>{const w=r+h+1,k=d.kota_asal?`${d.kota_asal}, ${d.provinsi||""}`:d.provinsi||"Belum diatur",y=d.athlete_count||0,_=d.event_tier==="PRO"?'<span class="px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded text-[10px] font-black tracking-widest uppercase">PRO</span>':'<span class="px-2 py-1 bg-slate-700/50 text-slate-400 border border-slate-600 rounded text-[10px] font-bold tracking-widest uppercase">BASIC</span>';f+=`
            <tr class="hover:bg-slate-700/50 transition-colors">
                <td class="p-4 text-center text-slate-500 font-bold">${w}</td>
                <td class="p-4">
                    <p class="font-extrabold text-white">${d.club_name}</p>
                    <p class="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">${d.short_name||"NO-TAG"}</p>
                </td>
                <td class="p-4 text-center font-mono font-bold text-emerald-400">${y} Atlet</td>
                <td class="p-4 text-slate-400 text-xs">${k}</td>
                <td class="p-4 text-slate-300 font-bold flex items-center gap-2">
                    <span class="text-lg">👤</span> ${d.coach_name||"Belum diisi"}
                </td>
                <td class="p-4 text-center">${_}</td>
            </tr>
        `}),t.innerHTML=f,o){const d=Math.min(i,e.length);o.innerText=`Menampilkan ${r+1}-${d} dari total ${e.length} klub.`}s&&(s.innerText=`Page ${c} of ${l}`),a&&(a.disabled=c===1),n&&(n.disabled=c===l)}window.approveAthlete=async e=>{if(confirm(`Yakin ingin ACC aktivasi F1 ID: ${e}?`))try{const{error:t}=await u.from("athletes").update({is_verified:!0}).eq("f1_id",e);if(t)throw t;alert("Boom! F1 ID berhasil diaktifkan."),p()}catch(t){alert("Gagal ACC: "+t.message)}};window.approveEdit=async(e,t,o,a,n,s,l)=>{if(confirm(`Yakin ACC revisi untuk ${t}? Sistem akan DITIMPA & F1 ID akan di-update otomatis!`))try{let r=t;const i=a.split("-")[0];if(i&&i.length===4){const h=i.substring(2,4),w=t.substring(5);r=`F1-${h}${w}`}const b=`${o} 👑`,{error:f}=await u.from("athletes").update({f1_id:r,full_name:b,dob:a,gender:n,foto_url:s,akta_url:l,is_verified:!0}).eq("f1_id",t);if(f)throw f;const{error:d}=await u.from("f1_edit_requests").update({status:"APPROVED"}).eq("id",e);if(d)throw d;alert(`BAM! Data berhasil diubah!
F1 ID otomatis di-update menjadi: ${r} 👑`),p()}catch(r){console.error(r),alert("Gagal ACC Edit: "+r.message)}};window.rejectEdit=async e=>{if(confirm("Tolak pengajuan perubahan data ini?"))try{const{error:t}=await u.from("f1_edit_requests").update({status:"REJECTED"}).eq("id",e);if(t)throw t;p()}catch(t){alert("Gagal menolak: "+t.message)}};
