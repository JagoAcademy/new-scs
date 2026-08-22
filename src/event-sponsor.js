import { supabaseClient } from './supabase.js';

let currentEventId = null;
let masterSponsors = [];
let sponsorSubmissions = []; 

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentEventId = urlParams.get('id');

    if (!currentEventId) return window.location.replace('/dashboard.html');
    
    const btnBack = document.getElementById('btnBackDashboard');
    if (btnBack) btnBack.href = `/event-dashboard.html?id=${currentEventId}`;

    document.querySelectorAll('.btn-close-modal').forEach(btn => btn.onclick = (e) => e.target.closest('.fixed').classList.add('hidden'));

    await fetchSponsorData();
});

async function fetchSponsorData() {
    try {
        const { data: masters } = await supabaseClient.from('master_sponsors').select('*').order('id', {ascending: true});
        masterSponsors = masters || [];

        const { data: subs } = await supabaseClient.from('sponsor_submissions').select('*').eq('event_id', currentEventId);
        sponsorSubmissions = subs || [];

        renderTable();
    } catch(err) {
        document.getElementById('sponsorTableBody').innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500 font-bold">Gagal memuat: ${err.message}</td></tr>`;
    }
}

function renderTable() {
    const tbody = document.getElementById('sponsorTableBody');
    tbody.innerHTML = '';

    if(masterSponsors.length === 0) return tbody.innerHTML = '<tr><td colspan="5" class="text-center p-8">Kosong.</td></tr>';

    masterSponsors.forEach((sp, idx) => {
        const subData = sponsorSubmissions.find(s => s.sponsor_id === sp.id);

        let actionHtml = '';
        if (!subData) {
            actionHtml = `<button onclick="ajukanSponsor(${sp.id})" class="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[11px] font-bold shadow-md">Ajukan Proposal</button>`;
        } else if (subData.status === 'Menunggu Review') {
            actionHtml = `<span class="bg-slate-100 text-slate-500 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-sm">⏳ Sedang Direview Pusat</span>`;
        } else if (subData.status === 'Disetujui') {
            // INI DIA E=mc2 NYA BRAY!
            actionHtml = `<button onclick="bukaTindakanLanjutan('${subData.id}', '${subData.jenis_bantuan_deal}', '${sp.sponsor_name}')" class="bg-amber-400 text-amber-900 px-5 py-2.5 rounded-xl text-[11px] font-black shadow-md border border-amber-500 animate-pulse">🔔 TINDAKAN DIPERLUKAN</button>`;
        } else {
            actionHtml = `<span class="bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-sm border border-emerald-200">🤝 DEAL SELESAI / DIPROSES</span>`;
        }

        const safeSyarat = encodeURIComponent(sp.syarat || 'Tidak ada syarat khusus.');
        const safeName = encodeURIComponent(sp.sponsor_name);

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 border-b border-slate-100">
                <td class="p-4 text-center font-black text-slate-300 text-sm">${idx + 1}</td>
                <td class="p-4 flex items-center gap-4">
                    <img src="${sp.logo_url}" class="w-10 h-10 object-contain">
                    <h4 class="font-black text-slate-800 text-sm">${sp.sponsor_name}</h4>
                </td>
                <td class="p-4 text-center"><span class="bg-emerald-50 text-emerald-700 px-3 py-1 rounded text-[10px] font-bold border border-emerald-200">🎁 ${sp.jenis_bantuan || 'Support'}</span></td>
                <td class="p-4 text-center"><button onclick="lihatSyarat('${safeName}', '${safeSyarat}')" class="text-blue-600 hover:underline text-[11px] font-bold">Baca</button></td>
                <td class="p-4 text-center align-middle">${actionHtml}</td>
            </tr>`;
    });
}

window.lihatSyarat = function(name, syarat) {
    document.getElementById('modalSyaratTitle').innerText = decodeURIComponent(name);
    document.getElementById('modalSyaratContent').innerText = decodeURIComponent(syarat);
    document.getElementById('modalSyarat').classList.remove('hidden');
}

window.ajukanSponsor = async function(sponsorId) {
    if(!confirm("Ajukan proposal ke sponsor ini?")) return;
    try {
        const { error } = await supabaseClient.from('sponsor_submissions').insert([{ event_id: currentEventId, sponsor_id: sponsorId }]);
        if(error) throw error;
        alert("✅ Proposal terkirim! Menunggu review.");
        fetchSponsorData(); 
    } catch(err) { alert("Gagal: " + err.message); }
}

// ==========================================
// LOGIKA E = mc2 (MODAL TINDAKAN)
// ==========================================
window.bukaTindakanLanjutan = function(subId, jenisBantuan, sponsorName) {
    if (jenisBantuan === 'Product') {
        document.getElementById('prodSubId').value = subId;
        document.getElementById('modalProduct').classList.remove('hidden');
    } else {
        document.getElementById('cashSubId').value = subId;
        document.getElementById('cashBrandName').value = sponsorName;
        document.getElementById('modalCash').classList.remove('hidden');
    }
}

// 1. Eksekusi Form Produk
document.getElementById('btnSubmitProduct').addEventListener('click', async () => {
    const subId = document.getElementById('prodSubId').value;
    const nama = document.getElementById('prodPic').value;
    const hp = document.getElementById('prodHp').value;
    const alamat = document.getElementById('prodAlamat').value;
    const btn = document.getElementById('btnSubmitProduct');

    if(!nama || !hp || !alamat) return alert("Isi semua data pengiriman!");
    btn.innerText = "Mengirim..."; btn.disabled = true;

    try {
        await supabaseClient.from('sponsor_submissions')
            .update({ pic_nama: nama, pic_kontak: hp, alamat_pengiriman: alamat, status: 'Barang Diproses' })
            .eq('id', subId);
        alert("✅ Data terkirim! Tim gudang akan mengirimkan barang ke lokasi.");
        document.getElementById('modalProduct').classList.add('hidden');
        fetchSponsorData();
    } catch(e) { alert(e.message); } finally { btn.innerText = "Kirim Data Pengiriman"; btn.disabled = false; }
});

// 2. Eksekusi Form Cash/Uang
document.getElementById('btnSubmitCash').addEventListener('click', async () => {
    const subId = document.getElementById('cashSubId').value;
    const brandName = document.getElementById('cashBrandName').value;
    const rek = document.getElementById('cashRekening').value;
    const fileLpj = document.getElementById('cashLpj').files[0];
    const btn = document.getElementById('btnSubmitCash');

    if(!rek || !fileLpj) return alert("Rekening dan Foto LPJ wajib diisi untuk pencairan!");
    btn.innerText = "Mengunggah LPJ..."; btn.disabled = true;

    try {
        const fileExt = fileLpj.name.split('.').pop();
        const fileName = `lpj_${brandName.replace(/\s/g,'')}_${Date.now()}.${fileExt}`;
        const { error: upErr } = await supabaseClient.storage.from('berkas-atlet').upload(fileName, fileLpj);
        if (upErr) throw upErr;
        
        const { data: urlData } = supabaseClient.storage.from('berkas-atlet').getPublicUrl(fileName);

        await supabaseClient.from('sponsor_submissions')
            .update({ rekening_bank: rek, bukti_lpj_url: urlData.publicUrl, status: 'Menunggu Pencairan' })
            .eq('id', subId);
            
        alert("✅ LPJ Diterima! Dana akan segera ditransfer ke rekening Anda.");
        document.getElementById('modalCash').classList.add('hidden');
        fetchSponsorData();
    } catch(e) { alert(e.message); } finally { btn.innerText = "Ajukan Pencairan Dana"; btn.disabled = false; }
});
