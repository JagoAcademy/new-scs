import"./modulepreload-polyfill-3cfb730f.js";/* empty css              */import{s as c}from"./supabase-b7fcd0c7.js";let p=null,x="",u=null;document.addEventListener("DOMContentLoaded",async()=>{const{data:{session:e}}=await c.auth.getSession();if(e){u=e.user.id;const l=document.getElementById("navAuthBtn");l&&(l.innerText="Dashboard",l.href="/dashboard.html",l.className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 hover:bg-emerald-100 transition-colors")}let r=new URLSearchParams(window.location.search).get("id");const a=document.getElementById("loadingState"),n=document.getElementById("errorState"),s=document.getElementById("profileData");if(!r){a.classList.add("hidden"),n.classList.remove("hidden");return}r=r.trim().toUpperCase(),p=r;try{const{data:l,error:b}=await c.from("athletes").select(`
                *,
                clubs (
                    club_name,
                    owner_id
                )
            `).eq("f1_id",r).single();if(b||!l)throw new Error("Data tidak ditemukan");x=l.full_name,h(l),a.classList.add("hidden"),s.classList.remove("hidden"),w(),y()}catch(l){console.error("Gagal load profil:",l),a.classList.add("hidden"),n.classList.remove("hidden")}const o=document.getElementById("tabPencapaian"),d=document.getElementById("tabBestTime"),i=document.getElementById("contentPencapaian"),m=document.getElementById("contentBestTime");o.addEventListener("click",()=>{o.className="flex-1 py-2.5 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm transition-colors",d.className="flex-1 py-2.5 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm transition-colors",i.classList.remove("hidden"),m.classList.add("hidden")}),d.addEventListener("click",()=>{d.className="flex-1 py-2.5 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm transition-colors",o.className="flex-1 py-2.5 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm transition-colors",m.classList.remove("hidden"),i.classList.add("hidden")})});function h(e){var m;document.getElementById("atletName").innerText=e.full_name,document.getElementById("atletKlub").innerText=((m=e.clubs)==null?void 0:m.club_name)||"Independen / Sekolah";const t=document.getElementById("atletF1Id");t.innerText=e.f1_id;const r=t.parentElement,a=t.previousElementSibling;e.is_verified?(a&&(a.outerHTML='<span class="bg-gradient-to-r from-amber-300 to-yellow-500 text-yellow-900 text-[11px] font-black px-1.5 py-0.5 rounded shadow-sm">ID</span>'),r.className="inline-flex items-center gap-1.5 md:gap-2 bg-amber-900/20 border border-amber-400/50 px-2 py-1 md:px-3 md:py-1.5 rounded-lg backdrop-blur-sm mb-3 md:mb-4 cursor-pointer hover:bg-amber-900/40 transition-colors shadow-[0_0_10px_rgba(251,191,36,0.1)]",t.className="font-mono text-sm md:text-lg font-black text-amber-400 tracking-wider"):(a&&(a.outerHTML='<span class="bg-blue-500 text-white text-[11px] font-black px-1.5 py-0.5 rounded shadow-sm">ID</span>'),r.className="inline-flex items-center gap-1.5 md:gap-2 bg-blue-900/30 border border-blue-400/30 px-2 py-1 md:px-3 md:py-1.5 rounded-lg backdrop-blur-sm mb-3 md:mb-4 cursor-pointer hover:bg-blue-900/50 transition-colors",t.className="font-mono text-sm md:text-lg font-black text-blue-200 tracking-wider");const n=document.getElementById("atletFoto");let s=!1;const o=e.clubs&&e.clubs.owner_id===u;if(e.foto_url?e.hide_foto&&!o&&(s=!0):s=!0,s?(n.src="/images/f1logo.png",n.className="w-24 h-24 md:w-36 md:h-36 rounded-2xl object-contain p-3 md:p-4 border-2 md:border-4 border-white/10 shadow-xl bg-white"):(n.src=e.foto_url,n.className="w-24 h-24 md:w-36 md:h-36 rounded-2xl object-cover border-2 md:border-4 border-white/10 shadow-xl bg-slate-800"),e.dob){const l=new Date(e.dob),b=Date.now()-l.getTime(),g=new Date(b),f=Math.abs(g.getUTCFullYear()-1970);document.getElementById("atletUsia").innerText=`${f} Thn`}const d=document.getElementById("atletGenderIcon");e.gender==="Putra"?(d.innerHTML="👦",d.className="absolute -bottom-2 -right-2 md:-bottom-3 md:-right-3 w-8 h-8 md:w-10 md:h-10 bg-sky-400 rounded-full border-[3px] md:border-4 border-slate-900 flex items-center justify-center shadow-lg text-sm md:text-lg"):(d.innerHTML="👧",d.className="absolute -bottom-2 -right-2 md:-bottom-3 md:-right-3 w-8 h-8 md:w-10 md:h-10 bg-pink-400 rounded-full border-[3px] md:border-4 border-slate-900 flex items-center justify-center shadow-lg text-sm md:text-lg");const i=document.getElementById("badgeVerifikasi");e.is_verified?i.innerHTML=`
            <div class="flex items-center gap-1 bg-gradient-to-r from-amber-200 to-yellow-400 px-2 py-0.5 md:px-3 md:py-1 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.3)] border border-amber-300">
                <span class="text-xs md:text-sm">👑</span>
                <span class="text-[8px] md:text-[10px] font-black text-amber-900 uppercase tracking-widest">Verified</span>
            </div>
        `:i.innerHTML=`
            <div class="flex items-center gap-1 bg-blue-900/40 px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-blue-400/30 backdrop-blur-md">
                <span class="text-xs md:text-sm">⏳</span>
                <span class="text-[8px] md:text-[10px] font-bold text-blue-100 uppercase tracking-widest">Pending</span>
            </div>
        `}async function w(){const e=document.getElementById("medaliList");try{const{data:t,error:r}=await c.from("event_leaderboard").select(`
                *,
                events (event_name)
            `).ilike("nama_peserta",`%${x}%`).lte("peringkat",3).order("published_at",{ascending:!1});if(r)throw r;if(document.getElementById("totalMedali").innerText=`${t.length} Medali`,t.length===0){e.innerHTML=`
                <div class="text-center py-10">
                    <span class="text-5xl block mb-3 grayscale opacity-30">🎖️</span>
                    <p class="text-sm font-bold text-slate-500">Belum ada medali yang dikoleksi.</p>
                </div>
            `;return}let a="";t.forEach(n=>{var d;let s="🥉",o="text-orange-700 bg-orange-50 border-orange-200";n.peringkat===1&&(s="🥇",o="text-amber-600 bg-amber-50 border-amber-200"),n.peringkat===2&&(s="🥈",o="text-slate-500 bg-slate-50 border-slate-200"),a+=`
                <div class="p-4 md:p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div class="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-2xl md:text-3xl shrink-0 rounded-full border ${o} shadow-sm">
                        ${s}
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-black text-slate-800 text-xs md:text-sm uppercase truncate">${n.nomor_lomba}</h4>
                        <p class="text-[10px] md:text-xs text-slate-500 font-bold mb-1 truncate">🏆 ${((d=n.events)==null?void 0:d.event_name)||"Kejuaraan SCS"}</p>
                        <div class="flex items-center gap-2">
                            <span class="text-[9px] md:text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-black tracking-wider shrink-0">⏱️ ${n.catatan_waktu}</span>
                            <span class="text-[9px] md:text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold shrink-0">${n.kelompok_umur}</span>
                        </div>
                    </div>
                </div>
            `}),e.innerHTML=a}catch(t){console.error("Gagal load medali:",t),e.innerHTML='<p class="text-center py-6 text-sm text-red-500 font-bold">Gagal memuat rekap medali.</p>'}}async function y(){const e=document.getElementById("bestTimeList");try{const{data:t,error:r}=await c.from("race_results").select(`
                *,
                events (event_name)
            `).eq("athlete_f1_id",p).neq("waktu_string","DQ").neq("waktu_string","DNS").neq("waktu_string","NT").order("time_seconds",{ascending:!0});if(r)throw r;if(!t||t.length===0){e.innerHTML=`
                <div class="text-center py-10">
                    <span class="text-5xl block mb-3 grayscale opacity-30">⏱️</span>
                    <p class="text-sm font-bold text-slate-500">Belum ada catatan waktu resmi.</p>
                </div>
            `;return}const a=new Map;t.forEach(s=>{const o=s.nomor_lomba;a.has(o)||a.set(o,s)});let n="";a.forEach((s,o)=>{var d;n+=`
                <div class="p-4 md:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group gap-2">
                    <div class="min-w-0 flex-1">
                        <h4 class="font-black text-slate-800 text-xs md:text-sm uppercase truncate">${o}</h4>
                        <p class="text-[9px] md:text-[10px] text-slate-500 font-bold mt-1 truncate">Di: <span class="text-slate-700">${((d=s.events)==null?void 0:d.event_name)||"Event SCS"}</span></p>
                    </div>
                    <div class="text-right shrink-0">
                        <span class="block text-base md:text-lg font-black text-blue-600 font-mono tracking-wider drop-shadow-sm group-hover:scale-105 transition-transform origin-right">
                            ${s.waktu_string}
                        </span>
                    </div>
                </div>
            `}),e.innerHTML=n}catch(t){console.error("Gagal load best time:",t),e.innerHTML='<p class="text-center py-6 text-sm text-red-500 font-bold">Gagal memuat catatan waktu.</p>'}}
