import"./modulepreload-polyfill-3cfb730f.js";/* empty css              */import{s as y}from"./supabase-b7fcd0c7.js";let X=null,E=null,v=new Image,e=null,I=[];document.addEventListener("DOMContentLoaded",async()=>{const t=new URLSearchParams(window.location.search).get("id")||5,d=document.getElementById("loadingIndicator");try{const{data:i,error:c}=await y.from("events").select("event_name, config").eq("id",t).single();i&&(document.getElementById("eventName").innerText=i.event_name,X=i,await Y(t));const{data:n,error:p}=await y.from("event_certificates").select("*").eq("event_id",t);if(n&&n.length>0){let a=n.find(o=>o.tipe==="juara");a||(a=n.find(o=>o.tipe==="peserta")),a&&(e=a.config_json,E=a.template_url,v.crossOrigin="anonymous",v.src=E)}const{data:s,error:m}=await y.from("event_leaderboard").select("*").eq("event_id",t).order("nomor_lomba",{ascending:!0}).order("peringkat",{ascending:!0});if(m)throw m;q(s)}catch(i){console.error(i),d.innerHTML=`<span class="text-red-600 font-bold">❌ Error Sistem: ${i.message}</span>`}});async function Y(f){try{const{data:t}=await y.from("event_sponsors").select("sponsor_ids").eq("event_id",f).single();if(!t||!t.sponsor_ids||t.sponsor_ids.length===0)return;const{data:d}=await y.from("master_sponsors").select("*").in("id",t.sponsor_ids);if(!d||d.length===0)return;I=d;const i=document.getElementById("partnerWrapper");if(i){let n=`
                <div class="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 text-center mb-6">
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Official Event Partners:</span>
                    <div class="flex items-center justify-center gap-4 md:gap-6 flex-wrap w-full">
            `,p=d.length===1?"160px":d.length===2?"120px":"90px";d.forEach(s=>{n+=`
                    <a href="${s.link_url||"#"}" target="_blank" class="bg-white p-2 rounded-xl border border-slate-100 shadow-sm flex items-center justify-center shrink-0 transition-transform hover:scale-105" style="aspect-ratio: 16/9; width: ${p}; max-width: 100%;">
                        <img src="${s.logo_url}" alt="${s.sponsor_name}" class="w-full h-full object-contain" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\\'text-[10px] font-black text-slate-400 text-center uppercase\\'>${s.sponsor_name}</span>';">
                    </a>
                `}),n+="</div></div>",i.innerHTML=n}const c=d[0];if(!document.getElementById("scs-exclusive-partner")){const n=`
                <div id="scs-exclusive-partner" class="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-amber-500/50 shadow-[0_-10px_20px_rgba(0,0,0,0.4)] z-[99999] py-2 md:py-3 px-4">
                    <a href="${c.link_url||"#"}" target="_blank" rel="noopener noreferrer" class="max-w-4xl mx-auto flex items-center justify-center gap-4 cursor-pointer group">
                        <span class="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-amber-400 transition-colors">Exclusive Partner</span>
                        <div class="bg-white p-1 rounded-md border border-slate-700 flex items-center justify-center transition-transform group-hover:scale-105" style="aspect-ratio: 16/9; height: 36px;">
                            <img src="${c.logo_url}" alt="${c.sponsor_name}" class="h-full w-full object-contain" onerror="this.style.display='none'">
                        </div>
                    </a>
                </div>
            `;document.body.insertAdjacentHTML("beforeend",n),document.body.style.paddingBottom="70px"}}catch(t){console.error("Gagal menarik data sponsor:",t)}}function q(f){const t=document.getElementById("leaderboardList");if(document.getElementById("loadingIndicator").classList.add("hidden"),!f||f.length===0){t.classList.remove("hidden"),t.innerHTML=`
            <div class="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl">
                <span class="text-4xl block mb-2 opacity-50">🏁</span>
                <p class="text-slate-500 font-bold text-sm">Belum ada hasil resmi yang dipublish wasit.</p>
            </div>`;return}t.classList.remove("hidden");const i=f.reduce((p,s)=>{const m=`${s.nomor_lomba} ${s.gender} ${s.kelompok_umur}`;return p[m]||(p[m]=[]),p[m].push(s),p},{});let c="",n=0;for(const[p,s]of Object.entries(i)){let m="";if(I.length>0){const a=n%I.length,o=I[a];m=`
                <div class="bg-slate-50 border-b border-slate-100 p-2 md:p-3 flex justify-between items-center">
                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        Supported By: <span class="text-blue-900">${o.sponsor_name}</span>
                    </span>
                    <a href="${o.link_url||"#"}" target="_blank" class="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center hover:scale-105 transition-transform" style="aspect-ratio: 16/9; width: 50px;">
                        <img src="${o.logo_url}" class="w-full h-full object-contain" onerror="this.style.display='none'">
                    </a>
                </div>
            `}c+=`
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6 relative hover:shadow-md transition-shadow">
            <div class="bg-slate-900 px-5 py-3 border-b border-slate-200 flex items-center gap-2">
                <span class="text-lg">🏊‍♂️</span>
                <h4 class="font-black text-amber-400 text-[13px] md:text-sm tracking-wide uppercase">${p}</h4>
            </div>
            ${m}
            <div class="divide-y divide-slate-100">
        `,s.forEach(a=>{let o="";a.peringkat===1?o='<div class="text-4xl text-amber-500 drop-shadow-sm">🥇</div>':a.peringkat===2?o='<div class="text-4xl text-slate-400 drop-shadow-sm">🥈</div>':a.peringkat===3?o='<div class="text-4xl text-orange-700 drop-shadow-sm">🥉</div>':o=`<div class="w-9 h-9 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full text-lg font-black border-2 border-slate-200 ml-1 mr-1 shadow-sm">${a.peringkat}</div>`;const r=encodeURIComponent(JSON.stringify(a));c+=`
                <div class="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition">
                    <div class="flex items-center gap-4">
                        ${o}
                        <div>
                            <h5 class="font-black text-slate-800 text-sm md:text-base uppercase tracking-tight leading-tight">${a.nama_peserta}</h5>
                            <p class="text-[10px] md:text-xs text-slate-500 font-bold mb-1 mt-0.5">🏠 ${a.klub_asal}</p>
                            <span class="inline-block bg-sky-100 text-sky-800 text-[10px] px-2 py-0.5 rounded font-black tracking-wider">⏱️ ${a.catatan_waktu}</span>
                        </div>
                    </div>
                    <button onclick="downloadSertifikatJuara('${r}')" class="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 shrink-0 border border-emerald-400">
                        <span>⬇️</span> Cetak Piagam
                    </button>
                </div>
            `}),c+="</div></div>",n++}t.innerHTML=c}window.downloadSertifikatJuara=function(f){var t,d,i,c,n,p,s,m,a,o;if(!E){alert("❌ Template belum disetting! Pastikan EO sudah upload template Juara di Dapur Admin.");return}if(!v.complete){alert("⏳ Gambar template masih loading... Tunggu sebentar!");return}try{const r=JSON.parse(decodeURIComponent(f));alert(`Sedang merakit piagam Juara ${r.peringkat} untuk ${r.nama_peserta}...`);const h=document.getElementById("renderCanvas"),l=h.getContext("2d");h.width=v.width,h.height=v.height,l.drawImage(v,0,0,h.width,h.height),l.textAlign="center";const k=h.width/2,K=h.height/2,S=((t=e==null?void 0:e.sharedStyle)==null?void 0:t.font)||((d=e==null?void 0:e.nama)==null?void 0:d.font)||"'Great Vibes', cursive",_=((i=e==null?void 0:e.sharedStyle)==null?void 0:i.color)||((c=e==null?void 0:e.nama)==null?void 0:c.color)||"#1e293b";let $=r.peringkat;r.peringkat==1?$="1 (Satu)":r.peringkat==2?$="2 (Dua)":r.peringkat==3&&($="3 (Tiga)");const u=(n=e==null?void 0:e.extra)==null?void 0:n.juara,T=u!=null&&u.x?parseInt(u.x):k,R=u!=null&&u.y?parseInt(u.y):500,B=(u==null?void 0:u.size)||"45";l.font=`bold ${B}px Arial`,l.fillStyle=_,l.fillText($,T,R);const J=(p=e==null?void 0:e.nama)!=null&&p.x?parseInt(e.nama.x):k,O=(s=e==null?void 0:e.nama)!=null&&s.y?parseInt(e.nama.y):400,L=((m=e==null?void 0:e.nama)==null?void 0:m.size)||"110";S.includes("Great Vibes")?l.font=`${L}px ${S}`:l.font=`bold ${L}px ${S}`,l.fillStyle=_;const U=r.nama_peserta.toLowerCase().split(" ").map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ");l.fillText(U,J,O);const z=r.nomor_lomba,x=(a=e==null?void 0:e.extra)==null?void 0:a.nomorLomba,H=x!=null&&x.x?parseInt(x.x):k,A=x!=null&&x.y?parseInt(x.y):600,P=(x==null?void 0:x.size)||"35";l.font=`bold ${P}px Arial`,l.fillStyle=_,l.fillText(z,H,A);const M=`${r.kelompok_umur} ${r.gender}`,g=(o=e==null?void 0:e.extra)==null?void 0:o.kelompokUmur,N=g!=null&&g.x?parseInt(g.x):k,D=g!=null&&g.y?parseInt(g.y):700,G=(g==null?void 0:g.size)||"45";l.font=`bold ${G}px Arial`,l.fillStyle=_,l.fillText(M,N,D),h.toBlob(function(w){if(!w){alert("Gagal merender gambar! Kemungkinan diblokir memori HP.");return}const j=window.URL.createObjectURL(w),b=document.createElement("a");b.style.display="none",b.href=j,b.download=`Juara_${r.peringkat}_${r.nama_peserta.replace(/\s+/g,"_")}.jpg`,document.body.appendChild(b),b.click(),setTimeout(()=>{document.body.removeChild(b),window.URL.revokeObjectURL(j)},300)},"image/jpeg",.9)}catch(r){alert("❌ ERROR RENDER: "+r.message),console.error(r)}};
