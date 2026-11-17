import"./modulepreload-polyfill-3cfb730f.js";/* empty css              */import{s as b}from"./supabase-e9059105.js";let B=[],i=[],H=[],f=null;document.addEventListener("DOMContentLoaded",async()=>{const l=localStorage.getItem("wfh_user")||sessionStorage.getItem("wfh_user"),{data:{session:p}}=await b.auth.getSession();if(l)f=JSON.parse(l),f.id=f.admin_id;else if(p)f=p.user;else{alert("Akses ditolak. Wajib Login!"),window.location.href="/auth.html";return}const S=document.getElementsByName("targetType"),k=document.getElementById("lblCompanyName"),v=document.getElementById("boxBrandSimulasi"),u=document.getElementById("inputCompanyName"),r=document.getElementById("selectHistoryCompany"),d=document.getElementById("selectSponsor"),o=document.getElementById("btnAddBrand"),E=document.getElementById("selectedBrandsContainer"),w=document.getElementById("inputSlug"),D=document.getElementById("inputCorpLogo"),P=document.getElementById("inputMarketingName"),I=document.getElementById("inputMessage"),A=document.getElementById("btnAutoCopywrite"),_=document.getElementById("statusMsg"),j=document.getElementById("actionButtons");l&&f.full_name&&(P.value=f.full_name),S.forEach(t=>{t.addEventListener("change",a=>{a.target.value==="club"?(k.innerText="Nama Klub / Event Organizer (EO)",v.classList.add("hidden")):(k.innerText="Nama Perusahaan (Corporate)",v.classList.remove("hidden")),C(),y(i)})});try{const{data:t}=await b.from("master_sponsors").select("*").order("sponsor_name",{ascending:!0});B=t||[],d.innerHTML='<option value="">-- Pilih Brand Sponsor --</option>',B.forEach(n=>{d.innerHTML+=`<option value="${n.id}">${n.sponsor_name} (${n.kategori})</option>`});let a=b.from("sponsor_pitches").select("*").order("created_at",{ascending:!1});const{data:e}=await a;if(e){H=e;const n=[];e.forEach(s=>{s.company_name&&!n.includes(s.company_name)&&(n.push(s.company_name),r.innerHTML+=`<option value="${s.id}">${s.company_name}</option>`)})}}catch(t){console.error(t)}r.addEventListener("change",t=>{const a=t.target.value;if(!a)return;const e=H.find(n=>String(n.id)===String(a));e&&(u.value=e.company_name||"",document.getElementById("inputCPName").value=e.cp_name||"",document.getElementById("inputCPWa").value=e.cp_wa||"",document.getElementById("inputCPEmail").value=e.cp_email||"",I.value=e.approach_message||"",w.value=e.pitch_slug||"",e.target_type&&(document.querySelector(`input[name="targetType"][value="${e.target_type}"]`).checked=!0,document.querySelector(`input[name="targetType"][value="${e.target_type}"]`).dispatchEvent(new Event("change"))),i=[],e.brand_ids&&e.brand_ids.length>0&&e.brand_ids.forEach(n=>{const s=B.find(c=>String(c.id)===String(n));s&&i.push(s)}),T(),y(i))}),A.addEventListener("click",()=>{const t=document.querySelector('input[name="targetType"]:checked').value,a=document.getElementById("inputCPName").value||"Bpk/Ibu",e=u.value||"[Nama Perusahaan]",s=`https://f1swimming.com/pitch/${w.value||"proposal"}`,c=P.value.trim()||"Tim";let m="";t==="brand"?m=`Halo ${a},

Perkenalkan saya ${c} dari F1 Swimming. Khusus untuk ${e}, kami telah merancang simulasi eksklusif bagaimana brand Anda dapat mendominasi perhatian ribuan atlet dan orang tua di urat nadi kompetisi renang nasional.

Silakan cek proposal interaktif berikut dari HP Anda:
👉 ${s}

Jika berkenan, saya ingin mendiskusikan peluang kolaborasi ini lebih lanjut. Terima kasih!`:m=`Halo ${a},

Perkenalkan saya ${c} dari F1 Swimming. Untuk mendukung kemajuan event dari ${e}, kami ingin mendemonstrasikan bagaimana sistem Live Result Digital (SCS) dapat mendigitalisasi dan meningkatkan profesionalisme perlombaan Anda.

Silakan cek simulasi sistem kami di sini:
👉 ${s}

Mari berdiskusi untuk membawa event Anda ke level berikutnya. Terima kasih!`,I.value=m});function T(){if(E.innerHTML="",i.length===0)return y([]);i.forEach(t=>{const a=document.createElement("div");a.className="bg-white border border-indigo-200 text-indigo-800 text-[10px] font-black uppercase px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm",a.innerHTML=`${t.sponsor_name} <button type="button" class="text-red-400 hover:text-red-600 font-black ml-1 text-sm leading-none focus:outline-none" data-id="${t.id}">&times;</button>`,a.querySelector("button").addEventListener("click",e=>{const n=e.target.getAttribute("data-id");i=i.filter(s=>String(s.id)!==String(n)),T(),y(i)}),E.appendChild(a)})}function C(){const t=u.value.trim();t&&(w.value=t.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)+/g,""))}u.addEventListener("input",C),o.addEventListener("click",()=>{const t=d.value;if(!t)return;const a=B.find(e=>String(e.id)===String(t));!a||i.some(e=>e.id===a.id)||(i.push(a),d.value="",T(),y(i))});const x=document.getElementById("btnGeneratePitch");x.addEventListener("click",async()=>{const t=document.querySelector('input[name="targetType"]:checked').value,a=u.value.trim();if(!a)return alert("Nama Perusahaan / Klub wajib diisi!");if(t==="brand"&&i.length===0)return alert("Tambahkan minimal 1 brand!");const e=document.getElementById("inputCPName").value.trim(),n=document.getElementById("inputCPWa").value.trim(),s=document.getElementById("inputCPEmail").value.trim(),c=w.value.trim().toLowerCase().replace(/[^a-z0-9-]/g,""),m=I.value.trim(),$=D.files[0];if(!e||!c)return alert("Nama PIC dan Slug wajib diisi!");x.innerText="Memproses Data... ⏳",x.disabled=!0;try{let h=null;if($){const g=$.name.split(".").pop(),M=`corporate_logos/${`corp_${Date.now()}.${g}`}`;await b.storage.from("sponsor-ads").upload(M,$);const{data:U}=b.storage.from("sponsor-ads").getPublicUrl(M);h=U.publicUrl}const G=t==="brand"?i.map(g=>g.id):[];let L={target_type:t,company_name:a,brand_ids:G,cp_name:e,cp_wa:n,cp_email:s,pitch_slug:c,approach_message:m,created_by:f.id};if(h)L.corporate_logo=h;else{const{data:g}=await b.from("sponsor_pitches").select("corporate_logo").eq("pitch_slug",c).single();g&&g.corporate_logo&&(L.corporate_logo=g.corporate_logo)}const{error:N}=await b.from("sponsor_pitches").upsert(L,{onConflict:"pitch_slug"});if(N)throw N;_.innerHTML='<div class="bg-green-100 border border-green-300 text-green-800 p-3 rounded-lg text-sm text-center">✅ <strong>Link & Draf Berhasil Disimpan/Diperbarui!</strong></div>',_.classList.remove("hidden"),j.classList.remove("hidden"),document.getElementById("btnCopyTeks").onclick=()=>{navigator.clipboard.writeText(m),alert("Teks berhasil disalin ke clipboard!")},document.getElementById("btnKirimWa").onclick=()=>{if(!n)return alert("Nomor WA belum diisi!");window.open(`https://wa.me/${n.replace(/^0/,"62")}?text=${encodeURIComponent(m)}`,"_blank")},document.getElementById("btnKirimEmail").onclick=()=>{if(!s)return alert("Email belum diisi!");window.open(`mailto:${s}?subject=Peluang Kolaborasi Digital & F1 Swimming&body=${encodeURIComponent(m)}`,"_blank")}}catch(h){_.innerHTML=`<div class="bg-red-100 border border-red-300 text-red-600 p-3 rounded-lg text-sm text-center">❌ ${h.message}</div>`,_.classList.remove("hidden")}finally{x.innerText="Simpan & Update Draf",x.disabled=!1}})});function y(l){const p=document.getElementById("simulationContainer");if(!p)return;const S=document.querySelector('input[name="targetType"]:checked').value,k=document.getElementById("inputCompanyName").value||"Nama Klub/EO";if(S==="club"){let r="";const d=["Gaya Bebas 50m Putra","Gaya Dada 50m Putri","Gaya Punggung 100m Putra"];for(let o=0;o<3;o++)r+=`
            <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-3 opacity-80">
                <div class="pl-1 mb-2">
                    <h3 class="text-[10px] font-black text-slate-800 uppercase">Event #${o+1}: ${d[o]}</h3>
                    <p class="text-[7px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">HEAT 1 | Dari 3</p>
                </div>
                <div class="bg-slate-50 rounded-lg p-1.5 border border-slate-100 text-center py-4">
                    <span class="text-[8px] font-bold text-slate-400">Data hasil dari event <br><strong class="text-slate-600">${k}</strong> akan tampil di sini secara real-time.</span>
                </div>
            </div>`;p.innerHTML=r;return}let v="";const u=["Gaya Bebas 50m Putra","Gaya Dada 50m Putri","Gaya Punggung 100m Putra","Estafet 4x50m Bebas","Gaya Kupu 50m Putra","Gaya Bebas 100m Putri","Gaya Dada 100m Putra","Gaya Punggung 50m Putri","Gaya Kupu 100m Putri","Estafet 4x100m Mix"];if(!l||l.length===0){p.innerHTML='<div class="text-center text-slate-400 font-bold text-xs mt-10 italic border-2 border-dashed border-slate-300 rounded-xl p-6">Tambahkan brand untuk melihat simulasi iklan.</div>';return}for(let r=0;r<10;r++){let d=r%l.length,o=l[d],E=`
        <a href="${o.link_url||"#"}" target="_blank" class="flex items-center justify-between bg-amber-50 hover:bg-amber-100 transition-colors border-b border-amber-200 px-3 py-2 -mx-3 -mt-3 mb-2 rounded-t-xl group cursor-pointer">
            <div class="flex items-center gap-1.5 flex-1 min-w-0 pr-2">
                <span class="text-[7px] font-black text-amber-600 uppercase tracking-widest shrink-0">Supported By:</span>
                <span class="text-[9px] font-bold text-slate-800 truncate">${o.sponsor_name}</span>
            </div>
            <div class="bg-white p-1 rounded border border-slate-200 shadow-sm shrink-0" style="aspect-ratio: 16/9; width: 45px;">
                <img src="${o.logo_url}" class="w-full h-full object-contain" onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\\'text-[6px] font-bold text-slate-400\\'>SPONSOR</span>';">
            </div>
        </a>`;v+=`
        <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-3 overflow-hidden relative border-amber-300 ring-1 ring-amber-100 transform hover:scale-[1.02] transition-transform">
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 z-10"></div>
            ${E}
            <div class="pl-1 mb-2">
                <h3 class="text-[10px] font-black text-slate-800 uppercase leading-tight">Event #${r+1}: ${u[r]}</h3>
                <p class="text-[7px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">HEAT 1 <span class="text-slate-300 mx-1">|</span> Dari 3</p>
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
        </div>`}p.innerHTML=v}
