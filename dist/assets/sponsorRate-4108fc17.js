import"./modulepreload-polyfill-3cfb730f.js";import{s as p}from"./supabase-e9059105.js";document.addEventListener("DOMContentLoaded",async()=>{try{const{data:{session:e}}=await p.auth.getSession();if(e){const t=document.getElementById("navLoginBtn");t&&(t.href="/sponsor.html",t.innerHTML="Dashboard Saya &rarr;",t.classList.replace("text-slate-300","text-amber-400"),t.classList.replace("hover:text-white","hover:text-amber-300"))}}catch(e){console.error("Session check failed",e)}let r="";const a=document.getElementById("contactChoiceModal"),d=()=>{a.classList.add("hidden"),a.classList.remove("flex")};document.querySelectorAll(".btn-pilih-paket").forEach(e=>{e.addEventListener("click",t=>{r=t.target.getAttribute("data-paket"),document.getElementById("contactPaketName").innerText=r,a.classList.remove("hidden"),a.classList.add("flex")})}),document.getElementById("btnCloseContact").addEventListener("click",d),document.getElementById("btnContactWa").addEventListener("click",()=>{const e="6283146851999",t=`Halo tim F1 Swimming (Vanessa), saya tertarik untuk mendiskusikan penawaran *${r}*. Mohon info lebih lanjut mengenai proses penempatan Ad-Tech ini.`;window.open(`https://wa.me/${e}?text=${encodeURIComponent(t)}`,"_blank"),d()}),document.getElementById("btnContactEmail").addEventListener("click",()=>{const e=`Pengajuan Sponsorship - ${r}`,t=`Halo Tim Kemitraan F1 Swimming,

Kami tertarik untuk mendiskusikan penawaran ${r}.

Mohon informasi lebih lanjut terkait prosedur kerja sama dan ketersediaan slot penayangan.

Terima kasih.`;window.location.href=`mailto:support@f1swimming.com?subject=${encodeURIComponent(e)}&body=${encodeURIComponent(t)}`,d()}),a.addEventListener("click",e=>{e.target===a&&d()}),document.querySelectorAll(".btn-email").forEach(e=>{e.addEventListener("click",t=>{const b=`Pengajuan Kolaborasi - ${t.target.getAttribute("data-paket")}`,i=`Halo Tim Kemitraan F1 Swimming,

Kami tertarik untuk mendaftarkan Brand kami sebagai bagian dari ekosistem SCS Partner (Tier 0).

Mohon informasi mengenai persyaratan dan kelengkapan dokumen yang dibutuhkan untuk bergabung ke dalam Master Katalog Anda.

Terima kasih.`;window.location.href=`mailto:support@f1swimming.com?subject=${encodeURIComponent(b)}&body=${encodeURIComponent(i)}`})}),document.querySelectorAll(".btn-akuisisi").forEach(e=>{e.addEventListener("click",()=>{const t="Pengajuan Ultimate Acquisition - F1 ID Naming Rights",s=`Halo Mas Fajar Aditya,

Kami mewakili perusahaan/brand kami sangat tertarik dengan penawaran Naming Rights F1 ID senilai Rp 10 Miliar.

Kami ingin mengatur jadwal meeting untuk mendiskusikan Terms & Conditions serta roadmap akuisisi ekosistem Live Result ini selama 5 tahun ke depan.

Mohon arahannya untuk langkah selanjutnya.

Salam hormat.`;window.location.href=`mailto:fajar@f1swimming.com?subject=${encodeURIComponent(t)}&body=${encodeURIComponent(s)}`})});const n=document.getElementById("previewModal"),l=()=>{n.classList.add("hidden"),n.classList.remove("flex")};document.querySelectorAll(".btn-preview").forEach(e=>{e.addEventListener("click",t=>{const s=t.currentTarget.getAttribute("data-tipe"),b=document.getElementById("modalSimulationContent"),i=document.getElementById("modalSimulationTitle");let o="";s==="single"?(i.innerText="Simulasi: 1 Brand Placement",o=`
                    <div class="bg-blue-950/40 text-blue-300 p-4 rounded-2xl border border-blue-500/30 text-xs leading-relaxed mb-5 text-left">
                        🚀 <strong>The Power of Multi-Heat:</strong> 1 Nomor Lomba terdiri dari 8 hingga 15 seri (Seri/Heat). Setiap berganti seri, penonton me-refresh halaman Live Result. Logo Anda akan <strong>tayang berulang kali di seluruh Seri/Heat</strong> sepanjang nomor lomba berlangsung!
                    </div>
                    <div class="space-y-2.5 text-left">
                        <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px] text-slate-500 font-bold flex justify-between items-center">
                            <span>🏊 Event #1: 50m Gaya Dada Putri</span>
                            <span class="text-[9px] text-slate-600 uppercase">Slot Klien Lain</span>
                        </div>
                        
                        <div class="bg-gradient-to-b from-blue-950 to-slate-950 p-4 rounded-2xl border-2 border-blue-500 shadow-xl space-y-2.5">
                            <div class="flex justify-between items-center text-xs text-white font-black border-b border-blue-800/50 pb-2">
                                <span>🏊 Event #2: 50m Gaya Bebas Putra</span>
                                <span class="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded font-black tracking-wider uppercase animate-pulse">8x Penayangan</span>
                            </div>
                            
                            <div class="flex flex-col gap-1.5 pt-1">
                                <div class="bg-blue-900/30 border border-blue-500/20 p-2.5 rounded-xl text-[10px] text-blue-200 font-semibold flex justify-between items-center">
                                    <span>🔥 SERI/HEAT 1 dari 8</span> <span class="bg-blue-600 text-white text-[8px] px-2 py-0.5 rounded font-bold uppercase">BRAND ANDA</span>
                                </div>
                                <div class="bg-blue-900/30 border border-blue-500/20 p-2.5 rounded-xl text-[10px] text-blue-200 font-semibold flex justify-between items-center">
                                    <span>🔥 SERI/HEAT 2 dari 8</span> <span class="bg-blue-600 text-white text-[8px] px-2 py-0.5 rounded font-bold uppercase">BRAND ANDA</span>
                                </div>
                                <div class="bg-blue-900/30 border border-blue-500/20 p-2.5 rounded-xl text-[10px] text-blue-200 font-semibold flex justify-between items-center">
                                    <span>🔥 SERI/HEAT 3 dari 8</span> <span class="bg-blue-600 text-white text-[8px] px-2 py-0.5 rounded font-bold uppercase">BRAND ANDA</span>
                                </div>
                                <div class="text-[9px] text-slate-400 text-center font-bold py-1 bg-slate-900/60 rounded-lg border border-slate-800">
                                    ...dan berlanjut otomatis tayang eksklusif hingga SERI/HEAT 8
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px] text-slate-500 font-bold flex justify-between items-center">
                            <span>🏊 Event #3: 100m Gaya Kupu Putra</span>
                            <span class="text-[9px] text-slate-600 uppercase">Slot Klien Lain</span>
                        </div>
                    </div>
                `):s==="dual"?(i.innerText="Simulasi: 2 Brand Mix",o=`
                    <div class="bg-blue-950/40 text-blue-300 p-4 rounded-2xl border border-blue-500/30 text-xs leading-relaxed mb-5 text-left">
                        🔄 <strong>Rotasi Seimbang Multi-Heat:</strong> Menayangkan 2 produk atau lini bisnis berbeda dari korporat Anda secara bergantian di setiap seri lomba.
                    </div>
                    <div class="space-y-2.5 text-left">
                        <div class="bg-gradient-to-b from-blue-950 to-slate-950 p-4 rounded-2xl border-2 border-blue-500 shadow-xl space-y-2.5">
                            <div class="flex justify-between items-center text-xs text-white font-black border-b border-blue-800/50 pb-2">
                                <span>🏊 Event #2: 50m Gaya Bebas Putra</span>
                                <span class="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded font-black tracking-wider uppercase">Rotasi 2 Brand</span>
                            </div>
                            
                            <div class="flex flex-col gap-1.5 pt-1">
                                <div class="bg-blue-900/30 border border-blue-500/20 p-2.5 rounded-xl text-[10px] text-blue-200 font-semibold flex justify-between items-center">
                                    <span>🔥 SERI/HEAT 1</span> <span class="bg-amber-500 text-slate-950 text-[8px] px-2 py-0.5 rounded font-bold uppercase">BRAND A (Produk 1)</span>
                                </div>
                                <div class="bg-blue-900/30 border border-blue-500/20 p-2.5 rounded-xl text-[10px] text-blue-200 font-semibold flex justify-between items-center">
                                    <span>🔥 SERI/HEAT 2</span> <span class="bg-emerald-500 text-slate-950 text-[8px] px-2 py-0.5 rounded font-bold uppercase">BRAND B (Produk 2)</span>
                                </div>
                                <div class="bg-blue-900/30 border border-blue-500/20 p-2.5 rounded-xl text-[10px] text-blue-200 font-semibold flex justify-between items-center">
                                    <span>🔥 SERI/HEAT 3</span> <span class="bg-amber-500 text-slate-950 text-[8px] px-2 py-0.5 rounded font-bold uppercase">BRAND A (Produk 1)</span>
                                </div>
                                <div class="bg-blue-900/30 border border-blue-500/20 p-2.5 rounded-xl text-[10px] text-blue-200 font-semibold flex justify-between items-center">
                                    <span>🔥 SERI/HEAT 4</span> <span class="bg-emerald-500 text-slate-950 text-[8px] px-2 py-0.5 rounded font-bold uppercase">BRAND B (Produk 2)</span>
                                </div>
                                <div class="text-[9px] text-slate-400 text-center font-bold py-1 bg-slate-900/60 rounded-lg border border-slate-800">
                                    Kedua brand berbagi porsi tayang secara adil di seluruh seri lomba
                                </div>
                            </div>
                        </div>
                    </div>
                `):s==="triple"&&(i.innerText="Simulasi: 3 Brand Mix",o=`
                    <div class="bg-blue-950/40 text-blue-300 p-4 rounded-2xl border border-blue-500/30 text-xs leading-relaxed mb-5 text-left">
                        🌐 <strong>Eksposur Multi-Brand:</strong> Distribusi 3 portofolio produk sekaligus secara dinamis di sepanjang 8 hingga 15 seri seri/heat pertandingan.
                    </div>
                    <div class="space-y-2.5 text-left">
                        <div class="bg-gradient-to-b from-blue-950 to-slate-950 p-4 rounded-2xl border-2 border-blue-500 shadow-xl space-y-2.5">
                            <div class="flex justify-between items-center text-xs text-white font-black border-b border-blue-800/50 pb-2">
                                <span>🏊 Event #2: 50m Gaya Bebas Putra</span>
                                <span class="text-[9px] bg-purple-600 text-white px-2 py-0.5 rounded font-black tracking-wider uppercase">Rotasi 3 Brand</span>
                            </div>
                            
                            <div class="flex flex-col gap-1.5 pt-1">
                                <div class="bg-blue-900/30 border border-blue-500/20 p-2.5 rounded-xl text-[10px] text-blue-200 font-semibold flex justify-between items-center">
                                    <span>🔥 SERI/HEAT 1</span> <span class="bg-amber-500 text-slate-950 text-[8px] px-2 py-0.5 rounded font-bold uppercase">BRAND A</span>
                                </div>
                                <div class="bg-blue-900/30 border border-blue-500/20 p-2.5 rounded-xl text-[10px] text-blue-200 font-semibold flex justify-between items-center">
                                    <span>🔥 SERI/HEAT 2</span> <span class="bg-emerald-500 text-slate-950 text-[8px] px-2 py-0.5 rounded font-bold uppercase">BRAND B</span>
                                </div>
                                <div class="bg-blue-900/30 border border-blue-500/20 p-2.5 rounded-xl text-[10px] text-blue-200 font-semibold flex justify-between items-center">
                                    <span>🔥 SERI/HEAT 3</span> <span class="bg-purple-500 text-white text-[8px] px-2 py-0.5 rounded font-bold uppercase">BRAND C</span>
                                </div>
                                <div class="text-[9px] text-slate-400 text-center font-bold py-1 bg-slate-900/60 rounded-lg border border-slate-800">
                                    Sistem secara cerdas merotasi ketiga brand sepanjang seluruh Seri/Heat
                                </div>
                            </div>
                        </div>
                    </div>
                `),b.innerHTML=o,n.classList.remove("hidden"),n.classList.add("flex")})}),document.getElementById("btnClosePreview").addEventListener("click",l),document.getElementById("btnClosePreviewBtn").addEventListener("click",l),n.addEventListener("click",e=>{e.target===n&&l()})});
