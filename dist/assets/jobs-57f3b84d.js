import"./modulepreload-polyfill-3cfb730f.js";/* empty css              */document.addEventListener("DOMContentLoaded",()=>{let a={namaLengkap:"",namaPanggilan:"",email:"",divisi:"",tech:"",kondisi:""};window.nextSlide=function(t,e){const i=document.getElementById(t),n=document.getElementById(e);i.classList.remove("translate-x-0","translate-x-10","-translate-x-10"),i.classList.add("-translate-x-10","opacity-0"),i.classList.remove("opacity-100"),setTimeout(()=>{i.classList.add("hidden"),i.classList.remove("block"),n.classList.remove("hidden"),n.classList.add("block"),n.classList.remove("translate-x-0","translate-x-10","-translate-x-10","opacity-100","opacity-0"),n.classList.add("translate-x-10","opacity-0"),n.offsetWidth,n.classList.remove("translate-x-10","opacity-0"),n.classList.add("translate-x-0","opacity-100")},300)},window.simpanDataDiri=function(t,e){const i=document.getElementById("inputNamaLengkap").value.trim(),n=document.getElementById("inputNamaPanggilan").value.trim(),l=document.getElementById("inputEmail").value.trim(),s=document.getElementById("errorDataDiri");if(!i||!n||!l){s.classList.remove("hidden");return}s.classList.add("hidden"),a.namaLengkap=i,a.namaPanggilan=n,a.email=l,window.nextSlide(t,e)},window.pilihDivisi=function(t,e,i){a.divisi=t,t==="akunting"?window.hitungHasil("onsite",e):window.nextSlide(e,i)},window.pilihTech=function(t,e,i){a.tech=t,window.nextSlide(e,i)},window.hitungHasil=function(t,e){a.kondisi=t;const i=document.getElementById("textHasil");let n=!1,l="";(a.divisi==="akunting"||a.kondisi==="onsite"||a.divisi==="dev"&&a.tech==="game")&&(n=!0);let s="",d=a.divisi.toUpperCase().replace("-"," "),r=a.namaPanggilan?`Halo Kak ${a.namaPanggilan}! `:"";n?(a.divisi==="akunting"?s="Mengelola arus keuangan event F1 Swimming, audit dana stimulus korporat, dan validasi rekonsiliasi payment gateway (QRIS/VA).":a.divisi==="admin-ads"||a.divisi==="marketing-ads"?s="Mengelola arsitektur kampanye iklan digital secara terpusat, memantau ROI promosi corporate, serta eksekusi Growth Hacking langsung di Command Center.":a.divisi==="dev"&&(s="Mengawal transisi core system web, arsitektur database Supabase, hingga interkoneksi dunia virtual game Roblox."),i.innerHTML=`
                <div class="bg-gradient-to-br from-emerald-900/40 to-slate-900 border-l-4 border-emerald-500 rounded-r-2xl p-5 shadow-lg relative overflow-hidden">
                    <div class="absolute -right-4 -bottom-4 text-6xl opacity-10">🏢</div>
                    <div class="inline-block bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-1 rounded mb-3 uppercase tracking-widest border border-emerald-500/30">
                        Penempatan: In-House Team
                    </div>
                    <h3 class="text-xl font-black text-white mb-2">${d}</h3>
                    <p class="text-sm font-bold text-emerald-400 mb-2">${r}</p>
                    <p class="text-xs text-slate-400 leading-relaxed mb-4">${s}</p>
                    
                    <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <p class="text-[10px] text-slate-500 font-bold uppercase mb-1">Langkah Berikutnya:</p>
                        <p class="text-xs text-slate-300">Tim HR kami sedang memvalidasi CV Anda. Undangan wawancara tatap muka di Kantor Surabaya akan dikirimkan via email atau WhatsApp.</p>
                    </div>
                </div>
            `,l=`Halo Tim HR F1 Swimming, saya telah mengisi pemetaan karir di portal rekrutmen.

*DATA KANDIDAT*
- Nama Lengkap: ${a.namaLengkap}
- Panggilan: ${a.namaPanggilan}
- Email: ${a.email}

*HASIL PENEMPATAN SISTEM*
- Proyeksi: IN-HOUSE TEAM (Surabaya)
- Divisi: ${d}

Saya menunggu kabar baik dari evaluasi CV saya. Terima kasih!`):(a.divisi==="admin-ads"||a.divisi==="marketing-ads"?s="Menangani setup ads taktis per-event secara remote, optimalisasi copywriting media sosial, dan pelaporan metrik (CTR/Impressions) secara berkala.":a.divisi==="dev"&&(s="Pengerjaan modul fitur mandiri secara terpisah seperti Pitching Generator client page, slicing UI Tailwind, atau maintenance skrip sistem."),i.innerHTML=`
                <div class="bg-gradient-to-br from-amber-900/40 to-slate-900 border-l-4 border-amber-500 rounded-r-2xl p-5 shadow-lg relative overflow-hidden">
                    <div class="absolute -right-4 -bottom-4 text-6xl opacity-10">💻</div>
                    <div class="inline-block bg-amber-500/20 text-amber-400 text-[10px] font-black px-2 py-1 rounded mb-3 uppercase tracking-widest border border-amber-500/30">
                        Penempatan: Freelance Partner
                    </div>
                    <h3 class="text-xl font-black text-white mb-2">${d}</h3>
                    <p class="text-sm font-bold text-amber-400 mb-2">${r}</p>
                    <p class="text-xs text-slate-400 leading-relaxed mb-4">${s}</p>
                    
                    <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <p class="text-[10px] text-slate-500 font-bold uppercase mb-1">Langkah Berikutnya:</p>
                        <p class="text-xs text-slate-300">Kontrak kerja berbasis proyek (PKS) remote akan disiapkan secara digital setelah CV Anda terverifikasi oleh tim pusat kami.</p>
                    </div>
                </div>
            `,l=`Halo Tim HR F1 Swimming, saya telah mengisi pemetaan karir di portal rekrutmen.

*DATA KANDIDAT*
- Nama Lengkap: ${a.namaLengkap}
- Panggilan: ${a.namaPanggilan}
- Email: ${a.email}

*HASIL PENEMPATAN SISTEM*
- Proyeksi: FREELANCE / REMOTE
- Divisi: ${d}

Saya menunggu kabar baik dari evaluasi CV saya. Terima kasih!`);const o=document.getElementById("btnLaporWA");o.onclick=()=>{const m="6283146851999";window.open(`https://wa.me/${m}?text=${encodeURIComponent(l)}`,"_blank")},window.nextSlide(e,"slideHasil")},window.resetQuiz=function(){document.getElementById("inputNamaLengkap").value="",document.getElementById("inputNamaPanggilan").value="",document.getElementById("inputEmail").value="",document.getElementById("errorDataDiri").classList.add("hidden"),a={namaLengkap:"",namaPanggilan:"",email:"",divisi:"",tech:"",kondisi:""};const t=document.getElementById("slideHasil"),e=document.getElementById("slide1");t.classList.remove("translate-x-0","translate-x-10","-translate-x-10"),t.classList.add("-translate-x-10","opacity-0"),t.classList.remove("opacity-100"),setTimeout(()=>{t.classList.add("hidden"),t.classList.remove("block"),e.classList.remove("hidden"),e.classList.add("block"),e.classList.remove("translate-x-0","translate-x-10","-translate-x-10","opacity-100","opacity-0"),e.classList.add("translate-x-10","opacity-0"),e.offsetWidth,e.classList.remove("translate-x-10","opacity-0"),e.classList.add("translate-x-0","opacity-100")},300)}});
