import"./modulepreload-polyfill-3cfb730f.js";/* empty css              */import{s as g}from"./supabase-e9059105.js";document.addEventListener("DOMContentLoaded",async()=>{let a=new URLSearchParams(window.location.search).get("brand");if(!a){const e=window.location.pathname.split("/").filter(Boolean);e.length>=2&&e[0]==="pitch"&&(a=e[1])}const t=document.getElementById("loadingScreen"),s=document.getElementById("errorScreen");if(!a){t.classList.add("hidden"),s.classList.remove("hidden"),s.classList.add("flex");return}try{const{data:e,error:c}=await g.from("sponsor_pitches").select("*").eq("pitch_slug",a).single();if(c||!e)throw new Error("Data Pitching tidak ditemukan!");document.title=`Proposal - ${e.company_name}`;const n=document.getElementById("corporateLogo"),o=document.getElementById("cpName"),d=document.getElementById("approachMessage"),m=document.getElementById("sponsorCover"),i=document.getElementById("sponsorSyarat");if(o&&(o.innerText=e.cp_name),e.target_type==="club")m&&(m.src="https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=1000&auto=format&fit=crop"),n&&(n.src=e.corporate_logo||"https://ui-avatars.com/api/?name=EO&background=fff&color=000"),i&&i.parentElement&&(i.parentElement.style.display="block",i.innerText=`Sistem Live Result Cepat
Database F1 ID Terpusat
Bebas Manipulasi Umur
Pendapatan Ekstra dari Ads`),d&&(d.innerHTML=`<p class="mb-4">Berikut adalah simulasi bagaimana sistem Live Result Digital (SCS) mendigitalisasi event dari <strong class="text-slate-800">${e.company_name}</strong> untuk tampil lebih profesional di mata ribuan peserta.</p>`),y(e.company_name);else{if(!e.brand_ids||e.brand_ids.length===0)throw new Error("Tidak ada brand_ids!");const{data:r,error:p}=await g.from("master_sponsors").select("*").in("id",e.brand_ids);if(p||!r||r.length===0)throw new Error("Gagal menarik data Master Sponsor.");n&&(n.src=e.corporate_logo||r[0].logo_url||"https://ui-avatars.com"),i&&i.parentElement&&(i.parentElement.style.display="none"),d&&(d.innerHTML=`
                    <div class="space-y-4 text-slate-600 text-xs md:text-sm leading-relaxed max-w-xl text-left">
                        <p>
                            Berikut adalah simulasi interaktif bagaimana produk dan kampanye visual dari <strong class="text-slate-900 uppercase">${e.company_name}</strong> diinjeksi langsung ke dalam urat nadi sistem Live-Result digital kami.
                        </p>
                        <p>
                            Halaman penyiaran skor ini di-refresh puluhan ribu kali secara real-time oleh atlet, pelatih, dan orang tua sepanjang kompetisi berjalan, memberikan paparan visual tingkat tinggi yang tidak bisa dihindari oleh audiens target Anda.
                        </p>
                        
                        <!-- KOTAK PANDUAN PREMIUM (UNIVERSAL URL ACTION) -->
                        <div class="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 text-amber-900 text-xs font-semibold flex items-start gap-3 shadow-sm mt-4 text-left animate-pulse">
                            <span class="text-base leading-none">💡</span>
                            <span class="leading-relaxed">
                                <strong>Panduan Simulasi:</strong> Silakan scroll pada tampilan layar HP berikut ini dan <strong>klik pada logo brand Anda</strong> untuk mencoba simulasi pengalihan aksi (<em>Call-to-Action</em>). Setelah mencoba simulasi, Anda dapat meninjau rincian biaya penayangan iklan pada tombol <strong>Sponsor Rate</strong> di bawah.
                            </span>
                        </div>

                        <!-- KOTAK BENEFIT DIUBAH MENJADI SEKSI KUSTOMISASI KAMPANYE -->
                        <div class="bg-blue-50/50 border border-blue-200 rounded-2xl p-4 md:p-5 text-slate-700 text-xs mt-4 text-left shadow-sm">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="text-base leading-none">🎨</span>
                                <strong class="text-blue-900 font-black uppercase tracking-wider text-[10px] md:text-xs">Kontrol Penuh Kampanye Anda</strong>
                            </div>
                            <p class="leading-relaxed text-slate-600">
                                Seluruh penempatan visual, logo produk, teks promosi (<em>copywriting</em>), hingga link tujuan pengalihan (<em>URL Redirect</em> ke toko online, WhatsApp, atau landing page khusus) dapat disesuaikan penuh secara eksklusif oleh tim brand atau agensi periklanan Anda.
                            </p>
                        </div>
                    </div>
                `),w(r);const x=document.getElementById("mainContent");if(x){const b=document.getElementById("f1-penutup-ads");b&&b.remove();const f=`
                    <div id="f1-penutup-ads" class="w-full mt-4 lg:mt-12 pt-8 lg:pt-12 border-t border-slate-300 px-4">
                        <div class="bg-white rounded-[2rem] shadow-xl p-8 lg:p-12 text-center max-w-4xl mx-auto border border-slate-100 relative overflow-hidden">
                            <div class="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50 via-white to-white pointer-events-none"></div>
                            <div class="relative z-10">
                                <h4 class="text-sm lg:text-base font-black text-slate-800 uppercase tracking-widest mb-3">🚀 Proyeksi Dampak & Biaya Kampanye</h4>
                                <p class="text-xs lg:text-sm text-slate-500 leading-relaxed mb-8 max-w-2xl mx-auto">
                                    Untuk melihat skema investasi slot iklan, pembagian target demografi audiens (usia/gender), serta kuota impresi penayangan yang tersedia, silakan masuk ke halaman rincian tarif resmi kami.
                                </p>
                                
                                <div class="flex flex-col sm:flex-row justify-center gap-4 max-w-xl mx-auto">
                                    <a href="/sponsor-rate.html" class="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-xs transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 uppercase tracking-wide transform active:scale-95">
                                        📊 LIHAT SPONSOR RATE
                                    </a>
                                    <button class="btnWaAction flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-all border border-slate-300 flex items-center justify-center gap-2 uppercase tracking-wide transform active:scale-95">
                                        💬 DISKUSI VIA WHATSAPP
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;x.insertAdjacentHTML("afterend",f);const h=document.querySelectorAll("#f1-penutup-ads .btnWaAction"),v=`Halo tim F1 Swimming, saya ${e.cp_name} dari ${e.company_name}. Saya sudah mencoba simulasi sistem Ad-Tech Anda dan tertarik berdiskusi lebih lanjut mengenai tarif dan penempatan.`;h.forEach(k=>{k.addEventListener("click",()=>{window.open(`https://wa.me/6283146851999?text=${encodeURIComponent(v)}`,"_blank")})})}}const u=document.querySelectorAll(".btnWaAction:not(#f1-penutup-ads .btnWaAction)");if(u.length>0){const r=`Halo tim F1 Swimming, saya ${e.cp_name} dari ${e.company_name}. Saya sudah melihat penawarannya dan tertarik berdiskusi.`;u.forEach(p=>{p.addEventListener("click",()=>{window.open(`https://wa.me/6283146851999?text=${encodeURIComponent(r)}`,"_blank")})})}setTimeout(()=>{t.style.opacity="0",setTimeout(()=>t.classList.add("hidden"),500)},1e3)}catch(e){console.error("❌ ERROR SYSTEM:",e.message),t.classList.add("hidden"),s.classList.remove("hidden"),s.classList.add("flex")}});function y(l){const a=document.getElementById("simulationContainer");let t="";const s=["Gaya Bebas 50m Putra","Gaya Dada 50m Putri","Gaya Punggung 100m Putra"];for(let e=0;e<3;e++)t+=`
        <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-3 opacity-90">
            <div class="pl-1 mb-2">
                <h3 class="text-[10px] font-black text-slate-800 uppercase leading-tight">Event #${e+1}: ${s[e]}</h3>
            </div>
            <div class="bg-slate-50/50 rounded-lg p-2 border border-slate-100 text-center py-4">
                <span class="text-[9px] font-bold text-slate-500">Hasil pertandingan dari event <strong class="text-slate-800">${l}</strong> tampil di sini.</span>
            </div>
        </div>`;a.innerHTML=t}function w(l){const a=document.getElementById("simulationContainer");let t="";const s=["Gaya Bebas 50m Putra","Gaya Dada 50m Putri","Gaya Punggung 100m Putra","Estafet 4x50m Bebas","Gaya Kupu 50m Putra","Gaya Bebas 100m Putri","Gaya Dada 100m Putra","Gaya Punggung 50m Putri","Gaya Kupu 100m Putri","Estafet 4x100m Mix"];for(let e=0;e<10;e++){let c=e%l.length,n=l[c],o=`
        <a href="${n.link_url||"#"}" target="_blank" class="flex items-center justify-between bg-amber-50 hover:bg-amber-100 transition-colors border-b border-amber-200 px-3 py-2 -mx-3 -mt-3 mb-2 rounded-t-xl group cursor-pointer">
            <div class="flex items-center gap-1.5 flex-1 min-w-0 pr-2">
                <span class="text-[7px] font-black text-amber-600 uppercase tracking-widest shrink-0">Supported By:</span>
                <span class="text-[9px] font-bold text-slate-800 truncate">${n.sponsor_name}</span>
            </div>
            <div class="bg-white p-1 rounded border border-slate-200 shadow-sm shrink-0" style="aspect-ratio: 16/9; width: 45px;">
                <img src="${n.logo_url}" class="w-full h-full object-contain" onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\\'text-[6px] font-bold text-slate-400\\'>SPONSOR</span>';">
            </div>
        </a>`;t+=`
        <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-3 overflow-hidden relative border-amber-300 ring-1 ring-amber-100 transform hover:scale-[1.02] transition-transform">
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 z-10"></div>
            ${o}
            <div class="pl-1 mb-2">
                <h3 class="text-[10px] font-black text-slate-800 uppercase leading-tight">Event #${e+1}: ${s[e]}</h3>
                <p class="text-[7px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">SERI/HEAT 1 <span class="text-slate-300 mx-1">|</span> Dari 3</p>
            </div>
            
            <div class="bg-slate-50/50 rounded-lg p-1.5 border border-slate-100">
                <div class="flex items-center text-[7px] font-black text-slate-400 uppercase border-b border-slate-200 pb-1 mb-1 px-1">
                    <div class="w-5 text-center">LN</div><div class="flex-1 pl-1">ATLET</div><div class="w-10 text-right pr-1">WAKTU</div>
                </div>
                <div class="flex items-center py-1 border-b border-slate-100 px-1">
                    <div class="w-5 flex justify-center shrink-0"><div class="w-3 h-3 rounded bg-slate-200 text-slate-600 text-[6px] font-black flex items-center justify-center">3</div></div>
                    <div class="flex-1 pl-1"><p class="text-[8px] font-black text-slate-800 uppercase truncate">Nama Atlit 1</p></div>
                    <div class="w-10 shrink-0 text-right pr-1"><span class="font-mono text-[8px] font-black text-slate-400">NT</span></div>
                </div>
                <div class="flex items-center py-1 border-b border-slate-100 px-1">
                    <div class="w-5 flex justify-center shrink-0"><div class="w-3 h-3 rounded bg-amber-200 text-amber-800 text-[6px] font-black flex items-center justify-center">4</div></div>
                    <div class="flex-1 pl-1"><p class="text-[8px] font-black text-slate-800 uppercase truncate">Nama Atlit 2</p></div>
                    <div class="w-10 shrink-0 text-right pr-1"><span class="font-mono text-[8px] font-black text-emerald-600">28.45</span></div>
                </div>
                <div class="flex items-center py-1 px-1">
                    <div class="w-5 flex justify-center shrink-0"><div class="w-3 h-3 rounded bg-slate-200 text-slate-600 text-[6px] font-black flex items-center justify-center">5</div></div>
                    <div class="flex-1 pl-1"><p class="text-[8px] font-black text-slate-800 uppercase truncate">Nama Atlit 3</p></div>
                    <div class="w-10 shrink-0 text-right pr-1"><span class="font-mono text-[8px] font-black text-slate-400">NT</span></div>
                </div>
            </div>
        </div>`}a.innerHTML=t}
