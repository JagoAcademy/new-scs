import{s as l}from"./supabase-00114a9c.js";/* empty css              */document.addEventListener("DOMContentLoaded",async()=>{const{data:{session:a},error:e}=await l.auth.getSession();if(e||!a){window.location.replace("/auth.html");return}if(a.user.email!=="radityaraja@gmail.com"){alert("Akses Ditolak! Anda bukan Super Admin."),window.location.replace("/dashboard.html");return}document.getElementById("btnAdminLogout").addEventListener("click",async()=>{await l.auth.signOut(),window.location.replace("/auth.html")}),i()});async function i(){try{const{data:a,error:e}=await l.from("athletes").select("*, clubs(club_name)").eq("is_verified",!1).not("foto_url","is",null).not("akta_url","is",null);if(e)throw e;u(a);const{data:n,error:t}=await l.from("f1_edit_requests").select("*, athletes (full_name, dob, gender, clubs(club_name))").eq("status","PENDING").order("created_at",{ascending:!1});if(t)throw t;p(n);const{data:r,error:s}=await l.from("clubs").select("*").order("id",{ascending:!1});if(s)throw s;b(r)}catch(a){console.error("Gagal memuat admin:",a),alert("Gagal memuat data admin: "+a.message)}}function u(a){const e=document.getElementById("queueTableBody");if(document.getElementById("badgeQueue").innerText=`${a.length} Pending`,a.length===0){e.innerHTML='<tr><td colspan="4" class="p-8 text-center text-slate-500 font-bold">Tidak ada antrian verifikasi awal.</td></tr>';return}let n="";a.forEach(t=>{var s;const r=((s=t.clubs)==null?void 0:s.club_name)||"Tanpa Klub";n+=`
            <tr class="hover:bg-slate-800 transition-colors">
                <td class="p-4">
                    <p class="font-extrabold text-white">${t.full_name}</p>
                    <p class="text-xs font-mono text-emerald-400 mt-0.5">${t.f1_id}</p>
                </td>
                <td class="p-4 text-slate-300 font-medium">${r}</td>
                <td class="p-4">
                    <div class="flex gap-2">
                        <a href="${t.foto_url}" target="_blank" class="px-2 py-1 bg-blue-900/50 text-blue-400 rounded text-[10px] font-bold hover:bg-blue-900 transition border border-blue-800">📸 Lihat Foto</a>
                        <a href="${t.akta_url}" target="_blank" class="px-2 py-1 bg-purple-900/50 text-purple-400 rounded text-[10px] font-bold hover:bg-purple-900 transition border border-purple-800">📄 Lihat Akta</a>
                    </div>
                </td>
                <td class="p-4 text-center">
                    <button onclick="approveAthlete('${t.f1_id}')" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-lg transition transform hover:scale-105">✅ APPROVE</button>
                </td>
            </tr>
        `}),e.innerHTML=n}function p(a){const e=document.getElementById("editQueueTableBody");if(document.getElementById("badgeEditQueue").innerText=`${a.length} Pending`,a.length===0){e.innerHTML='<tr><td colspan="5" class="p-8 text-center text-slate-500 font-bold">Tidak ada usulan perubahan data. Server aman! ☕</td></tr>';return}let n="";a.forEach(t=>{var d;const r=t.athletes,s=((d=r==null?void 0:r.clubs)==null?void 0:d.club_name)||"Tanpa Klub";n+=`
            <tr class="hover:bg-slate-800 transition-colors">
                <td class="p-4">
                    <p class="font-mono font-bold text-amber-400">${t.f1_id}</p>
                    <p class="text-[10px] text-slate-500 mt-1">${s}</p>
                </td>
                <td class="p-4 bg-red-950/20 border-r border-slate-700">
                    <p class="text-sm font-bold text-slate-300 line-through">${r.full_name}</p>
                    <p class="text-xs text-slate-500 mt-0.5">${r.gender} • ${r.dob}</p>
                </td>
                <td class="p-4 bg-emerald-950/20">
                    <p class="text-sm font-extrabold text-emerald-400">${t.new_name}</p>
                    <p class="text-xs text-emerald-600 mt-0.5">${t.new_gender} • ${t.new_dob}</p>
                </td>
                <td class="p-4">
                    <a href="${t.new_akta_url}" target="_blank" class="px-3 py-1.5 bg-purple-900/50 text-purple-400 rounded text-[10px] font-bold hover:bg-purple-900 transition border border-purple-800 inline-block">📄 Cek Akta</a>
                </td>
                <td class="p-4 text-center space-x-2">
                    <button onclick="rejectEdit(${t.id})" class="px-3 py-1.5 bg-slate-700 hover:bg-red-600 text-white font-bold rounded-lg text-xs shadow-lg transition">TOLAK</button>
                    <button onclick="approveEdit(${t.id}, '${t.f1_id}', '${t.new_name}', '${t.new_dob}', '${t.new_gender}', '${t.new_foto_url}', '${t.new_akta_url}')" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-lg transition transform hover:scale-105">✅ ACC</button>
                </td>
            </tr>
        `}),e.innerHTML=n}function b(a){const e=document.getElementById("clubTableBody");if(a.length===0){e.innerHTML='<tr><td colspan="5" class="p-8 text-center text-slate-500">Belum ada klub.</td></tr>';return}let n="";a.forEach((t,r)=>{const s=t.provinsi?`${t.kota_asal||""}, ${t.provinsi}`:t.kota_asal||"Belum diatur";n+=`
            <tr class="hover:bg-slate-800 transition-colors">
                <td class="p-4 text-center text-slate-500 font-bold">${r+1}</td>
                <td class="p-4">
                    <p class="font-extrabold text-white">${t.club_name}</p>
                    <p class="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">${t.short_name||"NO-TAG"}</p>
                </td>
                <td class="p-4 text-slate-300 font-bold flex items-center gap-2">
                    <span class="text-lg">👤</span> ${t.coach_name||"Belum diisi"}
                </td>
                <td class="p-4 text-slate-400 text-xs">${s}</td>
                <td class="p-4 text-center"><span class="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs font-bold font-mono">TBD</span></td>
            </tr>
        `}),e.innerHTML=n}window.approveAthlete=async a=>{if(confirm(`Yakin ingin ACC aktivasi F1 ID: ${a}?`))try{const{error:e}=await l.from("athletes").update({is_verified:!0}).eq("f1_id",a);if(e)throw e;alert("Boom! F1 ID berhasil diaktifkan."),i()}catch(e){alert("Gagal ACC: "+e.message)}};window.approveEdit=async(a,e,n,t,r,s,d)=>{if(confirm(`Yakin ACC perubahan data untuk F1 ID: ${e}? Data master akan DITIMPA!`))try{const{error:o}=await l.from("athletes").update({full_name:n,dob:t,gender:r,foto_url:s,akta_url:d,is_verified:!0}).eq("f1_id",e);if(o)throw o;const{error:c}=await l.from("f1_edit_requests").update({status:"APPROVED"}).eq("id",a);if(c)throw c;alert("Data berhasil diubah dan diverifikasi ulang!"),i()}catch(o){console.error(o),alert("Gagal ACC Edit: "+o.message)}};window.rejectEdit=async a=>{if(confirm("Tolak pengajuan perubahan data ini?"))try{const{error:e}=await l.from("f1_edit_requests").update({status:"REJECTED"}).eq("id",a);if(e)throw e;i()}catch(e){alert("Gagal menolak: "+e.message)}};
