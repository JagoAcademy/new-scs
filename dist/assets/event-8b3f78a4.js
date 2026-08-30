import"./modulepreload-polyfill-3cfb730f.js";/* empty css              */import{s as w}from"./supabase-b7fcd0c7.js";document.addEventListener("DOMContentLoaded",async()=>{try{const{data:{session:a}}=await w.auth.getSession(),l=document.getElementById("floatingAuthBtn"),u=document.getElementById("floatingAuthText");a&&(l.href="/dashboard.html",l.classList.replace("bg-blue-700","bg-emerald-600"),l.classList.replace("border-blue-800","border-emerald-700"),l.classList.replace("hover:bg-blue-800","hover:bg-emerald-700"),u.innerText="Ke Dashboard")}catch(a){console.error("Gagal cek auth:",a)}const m=document.getElementById("mobileMenuBtn"),o=document.getElementById("mobileMenu"),b=document.getElementById("closeMobileBtn");function p(){o.classList.contains("hidden")?(o.classList.remove("hidden"),o.classList.add("flex")):(o.classList.add("hidden"),o.classList.remove("flex"))}m&&m.addEventListener("click",p),b&&b.addEventListener("click",p);const n=document.getElementById("eventGrid");if(n){n.innerHTML=`
        <div class="col-span-full py-20 text-center">
            <div class="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-slate-500 font-bold animate-pulse">Memuat data event seluruh Indonesia...</p>
        </div>`;try{const{data:a,error:l}=await w.from("events").select("*").order("event_date",{ascending:!1});if(l)throw l;if(!a||a.length===0){n.innerHTML='<div class="col-span-full text-center py-20"><p class="text-gray-500 font-bold text-lg mb-2">Belum ada event perlombaan terdaftar.</p><p class="text-sm text-gray-400">Jadilah yang pertama menyelenggarakan event dengan SCS!</p></div>';return}let u="";a.forEach(e=>{const s=new Date,t=new Date(e.event_date),g=new Date(e.end_date);let r="",d="",i="",c="";e.is_closed===!0?(r='<div class="absolute top-4 left-4 bg-red-900/90 backdrop-blur-sm text-red-200 text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-lg border border-red-500 z-20">🛑 PENDAFTARAN DITUTUP</div>',c=`https://${e.subdomain}.f1swimming.com?id=${e.id}`,d="Kuota Penuh / Ditutup",i="tutup"):s>g?(r='<div class="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-lg border border-slate-700 z-20">SELESAI</div>',c=`https://${e.subdomain}.f1swimming.com/result?id=${e.id}`,d="Lihat Hasil Akhir",i="selesai"):s>=t&&s<=g?(r=`<div class="absolute top-4 left-4 bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-lg border border-red-500 flex items-center gap-1.5 z-20">
                        <span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE RESULT
                    </div>`,c=`https://${e.subdomain}.f1swimming.com/result?id=${e.id}`,d="Pantau Pertandingan",i="live"):(r='<div class="absolute top-4 left-4 bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-lg border border-emerald-400 z-20">PENDAFTARAN DIBUKA</div>',c=`https://${e.subdomain}.f1swimming.com?id=${e.id}`,d="Detail & Daftar",i="buka");const y=e.kota&&e.provinsi?`${e.kota}, ${e.provinsi}`:"Lokasi Belum Ditentukan",k=e.event_date===e.end_date?e.event_date:`${e.event_date} s/d ${e.end_date}`;let x="https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80";e.config&&e.config.header_url&&(x=e.config.header_url),u+=`
            <a href="${c}" class="block relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group event-card aspect-[4/3] sm:aspect-[16/10] bg-slate-900 ${i}">
                
                <!-- Gambar Cover Full -->
                <img src="${x}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 z-0" alt="${e.event_name}">
                
                <!-- Gradient Hitam dari Bawah -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                
                <!-- Badge Mengambang -->
                ${r}
                
                <!-- Konten Teks -->
                <div class="absolute bottom-0 left-0 w-full p-5 sm:p-6 flex flex-col justify-end z-20">
                    <p class="text-[10px] md:text-xs font-bold text-amber-400 mb-1.5 flex items-center gap-1.5 drop-shadow-md">🏆 ${k}</p>
                    <h3 class="text-xl md:text-2xl font-extrabold text-white mb-1.5 leading-tight drop-shadow-lg line-clamp-2" title="${e.event_name}">${e.event_name}</h3>
                    <p class="text-xs md:text-sm text-slate-300 font-medium flex items-center gap-1.5 mb-4 truncate drop-shadow-md"><span class="text-red-400">📍</span> ${y}</p>

                    <!-- Area CTA Bawah -->
                    <div class="flex justify-between items-center pt-3 md:pt-4 border-t border-white/20">
                        <span class="text-xs font-bold text-white/80 group-hover:text-white transition-colors tracking-wide uppercase">${d}</span>
                        <span class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-blue-600 group-hover:scale-110 transition-all backdrop-blur-sm border border-white/10 shadow-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>
                        </span>
                    </div>
                </div>
            </a>
            `}),n.innerHTML=u;const f=document.querySelectorAll(".filter-btn"),h=document.getElementById("rekapBanner"),v=document.querySelectorAll(".event-card");f.forEach(e=>{e.addEventListener("click",()=>{f.forEach(t=>{t.classList.remove("bg-blue-900","text-white","shadow-md"),t.classList.add("bg-white","text-slate-600","border","border-slate-200")}),e.classList.remove("bg-white","text-slate-600","border","border-slate-200"),e.classList.add("bg-blue-900","text-white","shadow-md");const s=e.getAttribute("data-filter");s==="semua"||s==="selesai"?h.classList.remove("hidden"):h.classList.add("hidden"),v.forEach(t=>{s==="semua"||s==="live"&&t.classList.contains("live")||s==="selesai"&&t.classList.contains("selesai")?t.style.display="block":t.style.display="none"})})})}catch(a){console.error(a),n.innerHTML=`<p class="text-center text-red-500 col-span-full py-10 font-bold">Gagal memuat kalender: ${a.message}</p>`}}});
