import"./modulepreload-polyfill-3cfb730f.js";/* empty css              */import{s as m}from"./supabase-e9059105.js";let p=1;const v=10;let g=[],f=1;const $=10;let x=[];document.addEventListener("DOMContentLoaded",async()=>{if(sessionStorage.getItem("aztec_key")!=="buka_sesame"){P();return}const{data:{user:t},error:n}=await m.auth.getUser();if(n||!t){window.location.replace("/auth.html");return}if(!["radityaraja@gmail.com","fajar@f1swimming.com","jagorenangakademi@gmail.com","indra@f1swimming.com","donybaktiar.me@gmail.com"].includes(t.email)){I(t.email);return}document.getElementById("btnAdminLogout").addEventListener("click",async()=>{await m.auth.signOut(),window.location.replace("/auth.html")}),h();const e=document.getElementById("searchClub");e&&e.addEventListener("input",c=>{const u=c.target.value.toLowerCase();window.allClubsAdmin&&(g=window.allClubsAdmin.filter(r=>r.club_name&&r.club_name.toLowerCase().includes(u)||r.coach_name&&r.coach_name.toLowerCase().includes(u)||r.kota_asal&&r.kota_asal.toLowerCase().includes(u)||r.provinsi&&r.provinsi.toLowerCase().includes(u)),p=1,C(g))});const a=document.getElementById("btnPrevClub"),l=document.getElementById("btnNextClub");a&&a.addEventListener("click",()=>{p>1&&(p--,C(g))}),l&&l.addEventListener("click",()=>{const c=Math.ceil(g.length/v);p<c&&(p++,C(g))});const i=document.getElementById("searchUnboundAthlete");i&&i.addEventListener("input",c=>{const u=c.target.value.toLowerCase();window.allUnboundAthletes&&(x=window.allUnboundAthletes.filter(r=>r.full_name&&r.full_name.toLowerCase().includes(u)||r.f1_id&&r.f1_id.toLowerCase().includes(u)),f=1,E(x))});const s=document.getElementById("btnPrevUnbound"),b=document.getElementById("btnNextUnbound");s&&s.addEventListener("click",()=>{f>1&&(f--,E(x))}),b&&b.addEventListener("click",()=>{const c=Math.ceil(x.length/$);f<c&&(f++,E(x))})});function I(t){document.body.innerHTML=`
        <div style="height:100vh;width:100vw;display:flex;flex-direction:column;align-items:center;justify-content:center;background-color:#0f172a;color:#f87171;font-family:sans-serif;text-align:center;position:fixed;top:0;left:0;z-index:999999;">
            <span style="font-size:6rem;margin-bottom:20px;">🛑</span>
            <h1 style="font-size:2rem;font-weight:900;text-transform:uppercase;margin-bottom:10px;">Akses Ditolak!</h1>
            <p style="color:#94a3b8;">Sistem mendeteksi email Anda (${t}) tidak terotorisasi.</p>
        </div>`,setTimeout(()=>window.location.replace("/dashboard.html"),3e3)}function P(){document.body.innerHTML=`
        <div style="height:100vh;width:100vw;display:flex;flex-direction:column;align-items:center;justify-content:center;background-color:#0f172a;color:#f87171;font-family:sans-serif;text-align:center;position:fixed;top:0;left:0;z-index:999999;">
            <span style="font-size:6rem;margin-bottom:20px;">🗿</span>
            <h1 style="font-size:3rem;font-weight:900;text-transform:uppercase;">Boss Pintunya ga disini 🤣</h1>
        </div>`,setTimeout(()=>window.location.replace("/dashboard.html"),2500)}async function h(){try{await B();const{data:t,error:n}=await m.from("athletes").select("*, clubs(club_name)").eq("is_verified",!1).not("foto_url","is",null).not("akta_url","is",null);if(n)throw n;L(t);const{data:o,error:e}=await m.from("f1_edit_requests").select("*, athletes (full_name, dob, gender, clubs(club_name))").eq("status","PENDING").order("created_at",{ascending:!1});if(e)throw e;U(o);const{data:a,error:l}=await m.from("clubs").select("*").order("id",{ascending:!1});if(l)throw l;const i=await Promise.all(a.map(async c=>{const{count:u,error:r}=await m.from("athletes").select("*",{count:"exact",head:!0}).eq("club_id",c.id);return{...c,athlete_count:r?0:u||0}}));window.allClubsAdmin=i||[],g=[...window.allClubsAdmin],p=1,C(g);const{data:s,error:b}=await m.from("athletes").select("*").is("club_id",null).order("full_name",{ascending:!0});if(b)throw b;window.allUnboundAthletes=s||[],x=[...window.allUnboundAthletes],f=1,E(x)}catch(t){console.error("Gagal memuat admin:",t)}}async function B(){const t=document.getElementById("upgradeQueueTableBody");try{const{data:n,error:o}=await m.from("event_transactions").select("*, events(event_name)").eq("status","PENDING").order("created_at",{ascending:!1});if(o)throw o;if(document.getElementById("badgeUpgradeQueue").innerText=`${n?n.length:0} Pending`,!n||n.length===0){t.innerHTML='<tr><td colspan="4" class="p-8 text-center text-slate-500 font-bold">Tidak ada pengajuan bayar PRO baru. Server aman! ☕</td></tr>';return}let e="";n.forEach(a=>{var s;const l=((s=a.events)==null?void 0:s.event_name)||"Event ID: "+a.event_id,i=new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR"}).format(a.nominal);e+=`
                <tr class="hover:bg-slate-800 transition-colors">
                    <td class="p-4">
                        <p class="font-extrabold text-white text-base">${l}</p>
                        <p class="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Trans ID: #${a.id} • ${a.jenis_transaksi}</p>
                    </td>
                    <td class="p-4">
                        <span class="text-sm font-black text-amber-400 bg-amber-900/30 px-3 py-1.5 rounded-lg border border-amber-700/50 shadow-inner">${i}</span>
                    </td>
                    <td class="p-4">
                        <a href="${a.bukti_url}" target="_blank" class="px-4 py-2 bg-blue-900/50 text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition border border-blue-800 inline-flex items-center gap-2">
                            <span>📄</span> Cek Struk
                        </a>
                    </td>
                    <td class="p-4 text-center space-x-2">
                        <button onclick="rejectUpgrade(${a.id})" class="px-4 py-2 bg-slate-700 hover:bg-red-600 text-white font-bold rounded-lg text-xs shadow-lg transition">TOLAK</button>
                        <button onclick="approveUpgrade(${a.id}, ${a.event_id}, '${l}')" class="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black rounded-lg text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)] transition transform hover:scale-105">✅ AKTIFKAN PRO</button>
                    </td>
                </tr>
            `}),t.innerHTML=e}catch(n){console.error("Gagal load upgrade requests:",n),t.innerHTML=`<tr><td colspan="4" class="p-8 text-center text-red-500 font-bold">Error memuat transaksi: ${n.message}</td></tr>`}}window.approveUpgrade=async(t,n,o)=>{if(confirm(`Yakin ingin ACC pembayaran dan mengaktifkan kasta PRO/EMAS untuk event:

👉 ${o}

Pastikan uang sudah masuk mutasi BCA!`))try{const{error:e}=await m.from("event_transactions").update({status:"APPROVED"}).eq("id",t);if(e)throw e;const{error:a}=await m.from("events").update({event_tier:"PRO"}).eq("id",n);if(a)throw a;alert(`✅ BOOM! Transaksi sukses di-ACC.
Event "${o}" resmi menjadi PRO/EMAS!`),h()}catch(e){alert("Gagal menyetujui: "+e.message)}};window.rejectUpgrade=async t=>{if(confirm("Yakin ingin MENOLAK bukti bayar ini? Transaksi akan dibatalkan."))try{const{error:n}=await m.from("event_transactions").update({status:"REJECTED"}).eq("id",t);if(n)throw n;h()}catch(n){alert("Gagal menolak transaksi: "+n.message)}};function L(t){const n=document.getElementById("queueTableBody");if(document.getElementById("badgeQueue").innerText=`${t?t.length:0} Pending`,!t||t.length===0){n.innerHTML='<tr><td colspan="4" class="p-8 text-center text-slate-500 font-bold">Tidak ada antrian verifikasi awal.</td></tr>';return}let o="";t.forEach(e=>{var l;const a=(l=e.clubs)!=null&&l.club_name?`<span class="text-slate-300 font-medium">${e.clubs.club_name}</span>`:'<span class="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded text-[10px] font-bold">⚠️ Tanpa Klub</span>';o+=`
            <tr class="hover:bg-slate-800 transition-colors">
                <td class="p-4">
                    <p class="font-extrabold text-white">${e.full_name}</p>
                    <p class="text-xs font-mono text-emerald-400 mt-0.5">${e.f1_id}</p>
                </td>
                <td class="p-4">${a}</td>
                <td class="p-4">
                    <div class="flex gap-2">
                        <a href="${e.foto_url}" target="_blank" class="px-2 py-1 bg-blue-900/50 text-blue-400 rounded text-[10px] font-bold hover:bg-blue-900 transition border border-blue-800">📸 Lihat Foto</a>
                        <a href="${e.akta_url}" target="_blank" class="px-2 py-1 bg-purple-900/50 text-purple-400 rounded text-[10px] font-bold hover:bg-purple-900 transition border border-purple-800">📄 Lihat Akta</a>
                    </div>
                </td>
                <td class="p-4 text-center">
                    <button onclick="approveAthlete('${e.f1_id}')" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-lg transition transform hover:scale-105">✅ APPROVE</button>
                </td>
            </tr>
        `}),n.innerHTML=o}function U(t){const n=document.getElementById("editQueueTableBody");if(document.getElementById("badgeEditQueue").innerText=`${t?t.length:0} Pending`,!t||t.length===0){n.innerHTML='<tr><td colspan="5" class="p-8 text-center text-slate-500 font-bold">Tidak ada usulan perubahan data. Server aman! ☕</td></tr>';return}let o="";t.forEach(e=>{var i;const a=e.athletes||{},l=((i=a==null?void 0:a.clubs)==null?void 0:i.club_name)||"Tanpa Klub";o+=`
            <tr class="hover:bg-slate-800 transition-colors">
                <td class="p-4">
                    <p class="font-mono font-bold text-amber-400">${e.f1_id}</p>
                    <p class="text-[10px] text-slate-500 mt-1">${l}</p>
                </td>
                <td class="p-4 bg-red-950/20 border-r border-slate-700">
                    <p class="text-sm font-bold text-slate-300 line-through">${a.full_name||"N/A"}</p>
                    <p class="text-xs text-slate-500 mt-0.5">${a.gender||"N/A"} • ${a.dob||"N/A"}</p>
                </td>
                <td class="p-4 bg-emerald-950/20">
                    <p class="text-sm font-extrabold text-emerald-400">${e.new_name}</p>
                    <p class="text-xs text-emerald-600 mt-0.5">${e.new_gender} • ${e.new_dob}</p>
                </td>
                <td class="p-4">
                    <a href="${e.new_akta_url}" target="_blank" class="px-3 py-1.5 bg-purple-900/50 text-purple-400 rounded text-[10px] font-bold hover:bg-purple-900 transition border border-purple-800 inline-block">📄 Cek Akta</a>
                </td>
                <td class="p-4 text-center space-x-2">
                    <button onclick="rejectEdit(${e.id})" class="px-3 py-1.5 bg-slate-700 hover:bg-red-600 text-white font-bold rounded-lg text-xs shadow-lg transition">TOLAK</button>
                    <button onclick="approveEdit(${e.id}, '${e.f1_id}', '${e.new_name}', '${e.new_dob}', '${e.new_gender}', '${e.new_foto_url}', '${e.new_akta_url}')" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-lg transition transform hover:scale-105">✅ ACC</button>
                </td>
            </tr>
        `}),n.innerHTML=o}function E(t){const n=document.getElementById("unboundAthleteTableBody"),o=document.getElementById("badgeUnboundQueue"),e=document.getElementById("unboundCountInfo"),a=document.getElementById("btnPrevUnbound"),l=document.getElementById("btnNextUnbound"),i=document.getElementById("pageInfoUnbound"),s=window.allUnboundAthletes?window.allUnboundAthletes.length:0;if(o&&(o.innerText=`${s} Atlet`),!t||t.length===0){n.innerHTML='<tr><td colspan="5" class="p-8 text-center text-slate-500 font-bold">Semua atlet sudah terikat ke club! 🎉</td></tr>',e&&(e.innerText="Menampilkan 0 atlet tanpa klub."),a&&(a.disabled=!0),l&&(l.disabled=!0),i&&(i.innerText="Page 1 of 1");return}const b=Math.ceil(t.length/$);f>b&&(f=b),f<1&&(f=1);const c=(f-1)*$,u=c+$,r=t.slice(c,u),k=[...window.allClubsAdmin||[]].sort((d,w)=>(d.club_name||"").localeCompare(w.club_name||"")).map(d=>{const w=d.kota_asal?` (${d.kota_asal})`:"";return`<option value="${d.id}">${d.club_name}${w}</option>`}).join("");let y="";if(r.forEach((d,w)=>{const T=c+w+1,A=d.is_verified?'<span class="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded text-[10px] font-black uppercase tracking-wider">👑 Verified</span>':'<span class="px-2.5 py-1 bg-slate-700/60 text-slate-400 border border-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">⏳ Pending</span>';y+=`
            <tr class="hover:bg-slate-700/40 transition-colors">
                <td class="p-4 text-center text-slate-500 font-bold">${T}</td>
                <td class="p-4">
                    <a href="/f1-id.html?id=${d.f1_id}" target="_blank" class="font-extrabold text-white hover:text-cyan-400 transition-colors">${d.full_name}</a>
                    <div class="flex items-center gap-2 mt-0.5 text-xs">
                        <span class="font-mono text-cyan-400 font-bold">${d.f1_id}</span>
                        <span class="text-slate-600">•</span>
                        <span class="text-slate-400">${d.gender||"-"} (${d.dob||"-"})</span>
                    </div>
                </td>
                <td class="p-4 text-center">${A}</td>
                <td class="p-4">
                    <select id="clubSelect_${d.f1_id}" class="bg-slate-900 border border-slate-600 text-xs font-bold rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full min-w-[220px] p-2.5 text-white">
                        <option value="">-- Pilih Club Tujuan --</option>
                        ${k}
                    </select>
                </td>
                <td class="p-4 text-center">
                    <button id="btnLink_${d.f1_id}" onclick="linkAthleteToClub('${d.f1_id}')" class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black rounded-lg text-xs shadow-lg transition transform hover:scale-105">
                        🔗 Tautkan
                    </button>
                </td>
            </tr>
        `}),n.innerHTML=y,e){const d=Math.min(u,t.length);e.innerText=`Menampilkan ${c+1}-${d} dari total ${t.length} atlet tanpa klub.`}i&&(i.innerText=`Page ${f} of ${b}`),a&&(a.disabled=f===1),l&&(l.disabled=f===b)}window.linkAthleteToClub=async t=>{const n=document.getElementById(`clubSelect_${t}`),o=document.getElementById(`btnLink_${t}`);if(!n)return;const e=n.value;if(!e){alert("Pilih club tujuan terlebih dahulu!"),n.focus();return}const a=(window.allClubsAdmin||[]).find(s=>String(s.id)===String(e)),l=(window.allUnboundAthletes||[]).find(s=>s.f1_id===t);if(!a){alert("Data club tidak ditemukan. Coba muat ulang halaman.");return}const i=l?`${l.full_name} (${t})`:t;if(confirm(`Yakin ingin menautkan atlet:

🏊 ${i}

Ke dalam club:
🏢 ${a.club_name}?`)){o&&(o.disabled=!0,o.innerText="⏳ Menautkan...");try{const{error:s}=await m.from("athletes").update({club_id:a.id,owner_id:a.owner_id||null}).eq("f1_id",t);if(s)throw s;alert(`✅ Berhasil! ${i} kini resmi terdaftar di ${a.club_name}.`),h()}catch(s){alert("Gagal menautkan atlet: "+s.message),o&&(o.disabled=!1,o.innerText="🔗 Tautkan")}}};function C(t){const n=document.getElementById("clubTableBody"),o=document.getElementById("clubCountInfo"),e=document.getElementById("btnPrevClub"),a=document.getElementById("btnNextClub"),l=document.getElementById("pageInfoClub");if(!t||t.length===0){n.innerHTML='<tr><td colspan="6" class="p-8 text-center text-slate-500 font-bold">Tidak ada klub ditemukan.</td></tr>',o&&(o.innerText="Menampilkan 0 klub."),e&&(e.disabled=!0),a&&(a.disabled=!0),l&&(l.innerText="Page 1 of 1");return}const i=Math.ceil(t.length/v);p>i&&(p=i),p<1&&(p=1);const s=(p-1)*v,b=s+v,c=t.slice(s,b);let u="";if(c.forEach((r,_)=>{const k=s+_+1,y=r.kota_asal?`${r.kota_asal}, ${r.provinsi||""}`:r.provinsi||"Belum diatur",d=r.athlete_count||0,T=r.event_tier==="PRO"?'<span class="px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded text-[10px] font-black tracking-widest uppercase">PRO</span>':'<span class="px-2 py-1 bg-slate-700/50 text-slate-400 border border-slate-600 rounded text-[10px] font-bold tracking-widest uppercase">BASIC</span>';u+=`
            <tr class="hover:bg-slate-700/50 transition-colors">
                <td class="p-4 text-center text-slate-500 font-bold">${k}</td>
                <td class="p-4">
                    <p class="font-extrabold text-white">${r.club_name}</p>
                    <p class="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">${r.short_name||"NO-TAG"}</p>
                </td>
                <td class="p-4 text-center font-mono font-bold text-emerald-400">${d} Atlet</td>
                <td class="p-4 text-slate-400 text-xs">${y}</td>
                <td class="p-4 text-slate-300 font-bold flex items-center gap-2">
                    <span class="text-lg">👤</span> ${r.coach_name||"Belum diisi"}
                </td>
                <td class="p-4 text-center">${T}</td>
            </tr>
        `}),n.innerHTML=u,o){const r=Math.min(b,t.length);o.innerText=`Menampilkan ${s+1}-${r} dari total ${t.length} klub.`}l&&(l.innerText=`Page ${p} of ${i}`),e&&(e.disabled=p===1),a&&(a.disabled=p===i)}window.approveAthlete=async t=>{if(confirm(`Yakin ingin ACC aktivasi F1 ID: ${t}?`))try{const{error:n}=await m.from("athletes").update({is_verified:!0}).eq("f1_id",t);if(n)throw n;alert("Boom! F1 ID berhasil diaktifkan."),h()}catch(n){alert("Gagal ACC: "+n.message)}};window.approveEdit=async(t,n,o,e,a,l,i)=>{if(confirm(`Yakin ACC revisi untuk ${n}? Sistem akan DITIMPA & F1 ID akan di-update otomatis!`))try{let s=n;const b=e.split("-")[0];if(b&&b.length===4){const _=b.substring(2,4),k=n.substring(5);s=`F1-${_}${k}`}const c=`${o} 👑`,{error:u}=await m.from("athletes").update({f1_id:s,full_name:c,dob:e,gender:a,foto_url:l,akta_url:i,is_verified:!0}).eq("f1_id",n);if(u)throw u;const{error:r}=await m.from("f1_edit_requests").update({status:"APPROVED"}).eq("id",t);if(r)throw r;alert(`BAM! Data berhasil diubah!
F1 ID otomatis di-update menjadi: ${s} 👑`),h()}catch(s){console.error(s),alert("Gagal ACC Edit: "+s.message)}};window.rejectEdit=async t=>{if(confirm("Tolak pengajuan perubahan data ini?"))try{const{error:n}=await m.from("f1_edit_requests").update({status:"REJECTED"}).eq("id",t);if(n)throw n;h()}catch(n){alert("Gagal menolak: "+n.message)}};
