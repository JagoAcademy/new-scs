import"./modulepreload-polyfill-3cfb730f.js";/* empty css              */import{s as g}from"./supabase-e9059105.js";document.addEventListener("DOMContentLoaded",async()=>{var i;const d=new URLSearchParams(window.location.search).get("id"),a=document.getElementById("uiClubName"),r=document.getElementById("uiEventInfo"),n=document.getElementById("rosterList"),s=document.getElementById("uiTotalPeserta");if(!d){a.innerText="Data Tidak Ditemukan",r.innerText="Pastikan link URL sudah benar.",n.innerHTML="",s.classList.add("hidden");return}try{const{data:e,error:c}=await g.from("unofficial_events").select(`
                *,
                clubs (club_name)
            `).eq("id",d).single();if(c||!e)throw new Error("Event tidak valid");a.innerText=((i=e.clubs)==null?void 0:i.club_name)||"Klub Renang";const m=new Date(e.tanggal).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"});r.innerHTML=`
            Akan bertanding di <span class="text-amber-400 font-bold">${e.nama_event}</span><br>
            <span class="text-xs mt-1 block">📍 ${e.lokasi_kolam}, ${e.kota}, ${e.provinsi} • 📅 ${m}</span>
        `;let o=e.peserta||[];if(s.innerText=`${o.length} Pasukan`,o.length===0){n.innerHTML='<div class="col-span-2 text-center py-6 text-slate-500 font-bold">Belum ada atlet yang didaftarkan.</div>';return}let l="";o.forEach((t,u)=>{const b=t.foto_url?t.foto_url:`https://ui-avatars.com/api/?name=${encodeURIComponent(t.nama)}&background=1e293b&color=cbd5e1&bold=true`,p=t.gender==="Putra"?"bg-blue-500/20 text-blue-400 border-blue-500/30":"bg-pink-500/20 text-pink-400 border-pink-500/30";l+=`
                <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 hover:border-slate-600 transition-colors group">
                    <span class="text-slate-700 font-black text-xl w-6 text-center shrink-0">${u+1}</span>
                    <img src="${b}" class="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                    <div class="flex-1 min-w-0">
                        <h3 class="font-extrabold text-white text-sm md:text-base truncate drop-shadow-sm mb-1">${t.nama}</h3>
                        <div class="flex items-center gap-2">
                            <span class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${p}">${t.gender}</span>
                            <span class="font-mono text-[9px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded tracking-widest">${t.f1_id}</span>
                        </div>
                    </div>
                </div>
            `}),n.innerHTML=l}catch(e){console.error(e),a.innerText="Gagal Memuat",r.innerText=e.message,n.innerHTML="",s.classList.add("hidden")}});
