import{s as m}from"./supabase-00114a9c.js";/* empty css              */let b=null,p="";document.addEventListener("DOMContentLoaded",async()=>{let e=new URLSearchParams(window.location.search).get("id");const o=document.getElementById("loadingState"),s=document.getElementById("errorState"),r=document.getElementById("profileData");if(!e){o.classList.add("hidden"),s.classList.remove("hidden");return}e=e.trim().toUpperCase(),b=e;try{const{data:d,error:c}=await m.from("athletes").select(`
                *,
                clubs (
                    club_name
                )
            `).eq("f1_id",e).single();if(c||!d)throw new Error("Data tidak ditemukan");p=d.full_name,g(d),o.classList.add("hidden"),r.classList.remove("hidden"),f(),x()}catch(d){console.error("Gagal load profil:",d),o.classList.add("hidden"),s.classList.remove("hidden")}const a=document.getElementById("tabPencapaian"),n=document.getElementById("tabBestTime"),l=document.getElementById("contentPencapaian"),i=document.getElementById("contentBestTime");a.addEventListener("click",()=>{a.className="flex-1 py-2.5 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm transition-colors",n.className="flex-1 py-2.5 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm transition-colors",l.classList.remove("hidden"),i.classList.add("hidden")}),n.addEventListener("click",()=>{n.className="flex-1 py-2.5 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm transition-colors",a.className="flex-1 py-2.5 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm transition-colors",i.classList.remove("hidden"),l.classList.add("hidden")})});function g(t){var l;document.getElementById("atletName").innerText=t.full_name,document.getElementById("atletKlub").innerText=((l=t.clubs)==null?void 0:l.club_name)||"Independen / Sekolah";const e=document.getElementById("atletF1Id");e.innerText=t.f1_id;const o=e.parentElement,s=e.previousElementSibling;t.is_verified?(s&&(s.outerHTML='<span class="bg-gradient-to-r from-amber-300 to-yellow-500 text-yellow-900 text-[11px] font-black px-1.5 py-0.5 rounded shadow-sm">ID</span>'),o.className="inline-flex items-center gap-2 bg-amber-900/20 border border-amber-400/50 px-3 py-1.5 rounded-lg backdrop-blur-sm mb-4 cursor-pointer hover:bg-amber-900/40 transition-colors shadow-[0_0_10px_rgba(251,191,36,0.1)]",e.className="font-mono text-lg font-black text-amber-400 tracking-wider"):(s&&(s.outerHTML='<span class="bg-blue-500 text-white text-[11px] font-black px-1.5 py-0.5 rounded shadow-sm">ID</span>'),o.className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-400/30 px-3 py-1.5 rounded-lg backdrop-blur-sm mb-4 cursor-pointer hover:bg-blue-900/50 transition-colors",e.className="font-mono text-lg font-black text-blue-200 tracking-wider");const r=t.foto_url?t.foto_url:`https://ui-avatars.com/api/?name=${encodeURIComponent(t.full_name)}&background=f8fafc&color=1e293b&size=256&bold=true`;if(document.getElementById("atletFoto").src=r,t.dob){const i=new Date(t.dob),d=Date.now()-i.getTime(),c=new Date(d),u=Math.abs(c.getUTCFullYear()-1970);document.getElementById("atletUsia").innerText=`${u} Thn`}const a=document.getElementById("atletGenderIcon");t.gender==="Putra"?(a.innerHTML="👦",a.className="absolute -bottom-3 -right-3 w-10 h-10 bg-sky-400 rounded-full border-4 border-slate-900 flex items-center justify-center shadow-lg text-lg"):(a.innerHTML="👧",a.className="absolute -bottom-3 -right-3 w-10 h-10 bg-pink-400 rounded-full border-4 border-slate-900 flex items-center justify-center shadow-lg text-lg");const n=document.getElementById("badgeVerifikasi");t.is_verified?n.innerHTML=`
            <div class="flex items-center gap-1.5 bg-gradient-to-r from-amber-200 to-yellow-400 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.3)] border border-amber-300">
                <span class="text-sm">👑</span>
                <span class="text-[10px] font-black text-amber-900 uppercase tracking-widest">Verified</span>
            </div>
        `:n.innerHTML=`
            <div class="flex items-center gap-1.5 bg-blue-900/40 px-3 py-1 rounded-full border border-blue-400/30 backdrop-blur-md">
                <span class="text-sm">⏳</span>
                <span class="text-[10px] font-bold text-blue-100 uppercase tracking-widest">Pending</span>
            </div>
        `}async function f(){const t=document.getElementById("medaliList");try{const{data:e,error:o}=await m.from("event_leaderboard").select(`
                *,
                events (event_name)
            `).ilike("nama_peserta",`%${p}%`).lte("peringkat",3).order("published_at",{ascending:!1});if(o)throw o;if(document.getElementById("totalMedali").innerText=`${e.length} Medali`,e.length===0){t.innerHTML=`
                <div class="text-center py-10">
                    <span class="text-5xl block mb-3 grayscale opacity-30">🎖️</span>
                    <p class="text-sm font-bold text-slate-500">Belum ada medali yang dikoleksi.</p>
                </div>
            `;return}let s="";e.forEach(r=>{var l;let a="🥉",n="text-orange-700 bg-orange-50 border-orange-200";r.peringkat===1&&(a="🥇",n="text-amber-600 bg-amber-50 border-amber-200"),r.peringkat===2&&(a="🥈",n="text-slate-500 bg-slate-50 border-slate-200"),s+=`
                <div class="p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div class="w-12 h-12 flex items-center justify-center text-3xl shrink-0 rounded-full border ${n} shadow-sm">
                        ${a}
                    </div>
                    <div class="flex-1">
                        <h4 class="font-black text-slate-800 text-sm uppercase">${r.nomor_lomba}</h4>
                        <p class="text-xs text-slate-500 font-bold mb-1">🏆 ${((l=r.events)==null?void 0:l.event_name)||"Kejuaraan SCS"}</p>
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-black tracking-wider">⏱️ ${r.catatan_waktu}</span>
                            <span class="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">${r.kelompok_umur}</span>
                        </div>
                    </div>
                </div>
            `}),t.innerHTML=s}catch(e){console.error("Gagal load medali:",e),t.innerHTML='<p class="text-center py-6 text-sm text-red-500 font-bold">Gagal memuat rekap medali.</p>'}}async function x(){const t=document.getElementById("bestTimeList");try{const{data:e,error:o}=await m.from("race_results").select(`
                *,
                events (event_name)
            `).eq("athlete_f1_id",b).neq("waktu_string","DQ").neq("waktu_string","DNS").neq("waktu_string","NT").order("time_seconds",{ascending:!0});if(o)throw o;if(!e||e.length===0){t.innerHTML=`
                <div class="text-center py-10">
                    <span class="text-5xl block mb-3 grayscale opacity-30">⏱️</span>
                    <p class="text-sm font-bold text-slate-500">Belum ada catatan waktu resmi.</p>
                </div>
            `;return}const s=new Map;e.forEach(a=>{const n=a.nomor_lomba;s.has(n)||s.set(n,a)});let r="";s.forEach((a,n)=>{var l;r+=`
                <div class="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div>
                        <h4 class="font-black text-slate-800 text-sm uppercase">${n}</h4>
                        <p class="text-[10px] text-slate-500 font-bold mt-1">Dicetak pada: <span class="text-slate-700">${((l=a.events)==null?void 0:l.event_name)||"Event SCS"}</span></p>
                    </div>
                    <div class="text-right shrink-0">
                        <span class="block text-lg font-black text-blue-600 font-mono tracking-wider drop-shadow-sm group-hover:scale-105 transition-transform origin-right">
                            ${a.waktu_string}
                        </span>
                    </div>
                </div>
            `}),t.innerHTML=r}catch(e){console.error("Gagal load best time:",e),t.innerHTML='<p class="text-center py-6 text-sm text-red-500 font-bold">Gagal memuat catatan waktu.</p>'}}
