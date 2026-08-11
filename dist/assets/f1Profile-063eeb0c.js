import{s as b}from"./supabase-00114a9c.js";/* empty css              */document.addEventListener("DOMContentLoaded",()=>{const n=document.getElementById("searchInput"),o=document.getElementById("searchBtn"),a=document.getElementById("searchResults"),s=document.getElementById("searchStatus"),c=document.getElementById("searchList");let l;async function d(e){if(e=e.trim(),!e){a.classList.add("hidden");return}a.classList.remove("hidden"),c.innerHTML="",s.classList.remove("hidden"),s.innerText="Mencari atlet... ⏳";try{const{data:r}=await b.from("clubs").select("id").ilike("club_name",`%${e}%`);let i=[];r&&r.length>0&&(i=r.map(t=>t.id));let m=`full_name.ilike.%${e}%,f1_id.ilike.%${e}%`;i.length>0&&(m+=`,club_id.in.(${i.join(",")})`);const{data:u,error:h}=await b.from("athletes").select(`
                    *,
                    clubs (club_name)
                `).or(m).limit(10);if(h)throw h;if(s.classList.add("hidden"),u.length===0){s.classList.remove("hidden"),s.innerHTML=`<span class="text-4xl block mb-2">🕵️‍♂️</span>Tidak ada atlet yang cocok dengan "<b>${e}</b>"`;return}u.forEach(t=>{var f;const g=t.is_verified?'<span class="text-amber-500 text-xs" title="Verified">👑</span>':"",v=((f=t.clubs)==null?void 0:f.club_name)||"Independen / Sekolah",x=t.foto_url?t.foto_url:`https://ui-avatars.com/api/?name=${encodeURIComponent(t.full_name)}&background=f8fafc&color=1e293b&bold=true`,p=document.createElement("li");p.innerHTML=`
                    <a href="/f1-id.html?id=${t.f1_id}" class="flex items-center gap-4 p-4 hover:bg-blue-50 transition-colors cursor-pointer group">
                        <img src="${x}" class="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm group-hover:scale-105 transition-transform shrink-0">
                        <div class="flex-1 min-w-0">
                            <h4 class="font-extrabold text-slate-800 text-sm truncate">${t.full_name} ${g}</h4>
                            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate mb-1">🏠 ${v}</p>
                            <span class="inline-block bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-mono px-2 py-0.5 rounded tracking-widest">${t.f1_id}</span>
                        </div>
                        <div class="shrink-0 text-slate-300 group-hover:text-blue-500 transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                        </div>
                    </a>
                `,c.appendChild(p)})}catch(r){console.error("Search error:",r),s.classList.remove("hidden"),s.innerHTML='<span class="text-red-500 font-bold">Terjadi kesalahan sistem. Coba lagi.</span>'}}o.addEventListener("click",()=>{d(n.value)}),n.addEventListener("input",e=>{clearTimeout(l),l=setTimeout(()=>{d(e.target.value)},500)}),document.addEventListener("click",e=>{!a.contains(e.target)&&e.target!==n&&e.target!==o&&a.classList.add("hidden")}),n.addEventListener("focus",()=>{n.value.trim()!==""&&a.classList.remove("hidden")})});
