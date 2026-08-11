import{s as c}from"./supabase-00114a9c.js";/* empty css              */let u=null,m=[];document.addEventListener("DOMContentLoaded",async()=>{if(u=new URLSearchParams(window.location.search).get("id"),!u){alert("ID Kejuaraan tidak ditemukan di URL!");return}await p()});async function p(){try{const{data:n,error:a}=await c.from("event_heats").select("*").eq("event_id",u).order("event_number",{ascending:!0}).order("heat_number",{ascending:!0});if(a)throw a;m=n||[],f()}catch(n){console.error("Gagal menarik data:",n),alert("Terjadi kesalahan saat memuat data.")}}function f(){const n=document.getElementById("selectEvent");n.innerHTML='<option value="">-- Pilih Lomba Untuk Dicetak --</option>',[...new Map(m.map(e=>[e.event_number,e])).values()].forEach(e=>{let r=`Event #${e.event_number}: ${e.nomor_lomba} - ${e.gender} - ${e.kelompok_umur}`;n.innerHTML+=`<option value="${e.event_number}">${r}</option>`}),n.addEventListener("change",e=>{const r=e.target.value;r?(document.getElementById("emptyState").style.display="none",h(r)):(document.getElementById("emptyState").style.display="block",document.getElementById("resultTableContainer").innerHTML="")})}function h(n){const a=m.filter(i=>i.event_number==n);if(a.length===0)return;const e=a[0];let r=[];a.forEach(i=>{i.lanes_data.forEach(t=>{t.nama&&r.push({...t,asal_heat:i.heat_number})})}),r.sort((i,t)=>{let s=i.waktu_tempuh||"NT",o=t.waktu_tempuh||"NT",d=s==="NT"||s==="DQ",l=o==="NT"||o==="DQ";return d&&!l?1:!d&&l?-1:d&&l?s==="DQ"&&o==="NT"?1:s==="NT"&&o==="DQ"?-1:0:s<o?-1:s>o?1:0}),g(r,e)}function g(n,a){const e=document.getElementById("resultTableContainer");let r="";n.forEach((t,s)=>{let o=s+1,d=o,l="";t.waktu_tempuh==="NT"||t.waktu_tempuh==="DQ"||!t.waktu_tempuh?(d="-",l="color: #94a3b8;"):o===1?l="font-weight: 900; background-color: #fef3c7;":o===2?l="font-weight: 900; background-color: #f1f5f9;":o===3&&(l="font-weight: 900; background-color: #ffedd5;"),r+=`
            <tr>
                <td style="text-align: center; width: 50px; ${l}">${d}</td>
                <td style="font-weight: bold; text-transform: uppercase;">${t.nama}</td>
                <td style="text-transform: uppercase; font-size: 0.85em;">${t.klub}</td>
                <td style="text-align: center;">H${t.asal_heat} / L${t.lane}</td>
                <td style="text-align: center; font-family: monospace; font-weight: bold;">
                    ${t.waktu_tempuh||"NT"}
                </td>
            </tr>
        `});const i=`
        <div style="text-align: center; margin-bottom: 20px; text-transform: uppercase;">
            <h2 style="font-size: 1.5rem; font-weight: 900; margin: 0;">OFFICIAL RESULT</h2>
            <h3 style="font-size: 1.1rem; font-weight: bold; margin: 5px 0;">EVENT #${a.event_number}: ${a.nomor_lomba} - ${a.gender}</h3>
            <p style="font-size: 0.9rem; color: #475569;">Kelompok Umur: ${a.kelompok_umur}</p>
        </div>
        
        <table class="screen-table">
            <thead>
                <tr>
                    <th style="text-align: center;">Rank</th>
                    <th>Nama Perenang</th>
                    <th>Klub</th>
                    <th style="text-align: center;">Heat / Lane</th>
                    <th style="text-align: center;">Catatan Waktu</th>
                </tr>
            </thead>
            <tbody>
                ${r}
            </tbody>
        </table>
        
        <!-- Area Tanda Tangan -->
        <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 0.85rem;">
            <div>
                <p><strong>Dicetak pada:</strong> ${new Date().toLocaleString("id-ID")}</p>
            </div>
            <div style="text-align: center; width: 220px;">
                <p style="font-weight: bold;">Referee / Hakim Utama</p>
                <br><br><br>
                <p style="border-top: 1px solid black; padding-top: 5px;">( ........................................ )</p>
            </div>
        </div>
    `;e.innerHTML=i}
