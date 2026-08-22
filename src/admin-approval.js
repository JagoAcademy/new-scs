import { supabaseClient } from './supabase.js';

let submissions = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (sessionStorage.getItem('aztec_key') !== 'buka_sesame') return window.location.replace('/dashboard.html');
    loadAntrian();
    document.querySelectorAll('.btn-close').forEach(btn => btn.onclick = () => document.getElementById('modalReview').classList.add('hidden'));
});

async function loadAntrian() {
    const tbody = document.getElementById('approvalTableBody');
    try {
        const { data: subs, error } = await supabaseClient
            .from('sponsor_submissions')
            .select('*, events(event_name), master_sponsors(sponsor_name)')
            .eq('status', 'Menunggu Review')
            .order('created_at', { ascending: false });

        if (error) throw error;
        submissions = subs || [];

        if (submissions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-slate-500 font-bold">Yeay! Tidak ada antrian proposal.</td></tr>';
            return;
        }

        let html = '';
        submissions.forEach(sub => {
            const evName = sub.events ? sub.events.event_name : 'Event ID: ' + sub.event_id;
            const spName = sub.master_sponsors ? sub.master_sponsors.sponsor_name : 'Sponsor ID: ' + sub.sponsor_id;
            const subDataEncoded = encodeURIComponent(JSON.stringify(sub));
            
            html += `
                <tr class="hover:bg-slate-800/50 transition-colors">
                    <td class="p-4 font-bold text-white">${evName}</td>
                    <td class="p-4 font-black text-amber-400">${spName}</td>
                    <td class="p-4 text-center"><span class="bg-amber-900/50 text-amber-500 px-3 py-1 rounded text-[10px] font-bold border border-amber-500/30">⏳ Menunggu</span></td>
                    <td class="p-4 text-center">
                        <button onclick="openReview('${subDataEncoded}', '${evName}', '${spName}')" class="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-4 rounded-lg text-xs transition shadow">Review & Approve</button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    } catch(err) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-red-500 font-bold">Error: ${err.message}</td></tr>`;
    }
}

window.openReview = function(encodedData, evName, spName) {
    const sub = JSON.parse(decodeURIComponent(encodedData));
    
    document.getElementById('revSubId').value = sub.id;
    document.getElementById('revEventId').value = sub.event_id;
    document.getElementById('revSponsorId').value = sub.sponsor_id;
    
    document.getElementById('revEventName').innerText = evName;
    document.getElementById('revBrandName').innerText = spName;

    // Tampilkan Detail Form
    document.getElementById('revSupportType').innerText = sub.support_type_req || '-';
    document.getElementById('revBenefits').innerText = sub.benefits_offered || '-';
    document.getElementById('revNotes').innerText = sub.proposal_note || '-';

    document.getElementById('modalReview').classList.remove('hidden');
}

// === TAMBAHKAN DIV DETAIL INI KE DALAM HTML ADMIN-APPROVAL MODAL ===
// Tepat di bawah <p id="revBrandName">...</p>
/*
    <div class="mt-4 pt-4 border-t border-slate-700">
        <p class="text-[10px] text-slate-500 font-bold uppercase mb-1">Dukungan yang Diminta</p>
        <p id="revSupportType" class="text-xs text-white mb-3">...</p>
        
        <p class="text-[10px] text-slate-500 font-bold uppercase mb-1">Benefit Ditawarkan EO</p>
        <p id="revBenefits" class="text-xs text-white mb-3">...</p>
        
        <p class="text-[10px] text-slate-500 font-bold uppercase mb-1">Catatan EO</p>
        <p id="revNotes" class="text-xs text-slate-300 italic bg-slate-800 p-2 rounded">...</p>
    </div>
*/

document.getElementById('btnApprove').addEventListener('click', async () => {
    const subId = document.getElementById('revSubId').value;
    const evId = document.getElementById('revEventId').value;
    const spId = parseInt(document.getElementById('revSponsorId').value);
    const jenisDeal = document.getElementById('revJenisDeal').value;
    const btn = document.getElementById('btnApprove');
    
    btn.innerText = "⏳ Memproses...";
    btn.disabled = true;

    try {
        await supabaseClient.from('sponsor_submissions').update({ status: 'Disetujui', jenis_bantuan_deal: jenisDeal }).eq('id', subId);
        
        const { data: linkData } = await supabaseClient.from('event_sponsors').select('*').eq('event_id', evId).single();
        if (linkData) {
            let currentIds = linkData.sponsor_ids || [];
            if (!currentIds.includes(spId)) {
                currentIds.push(spId);
                await supabaseClient.from('event_sponsors').update({ sponsor_ids: currentIds }).eq('id', linkData.id);
            }
        } else {
            await supabaseClient.from('event_sponsors').insert([{ event_id: evId, sponsor_ids: [spId] }]);
        }

        document.getElementById('modalReview').classList.add('hidden');
        loadAntrian();
    } catch(err) {
        alert("Gagal Approve: " + err.message);
    } finally {
        btn.innerText = "✅ APPROVE & TAYANGKAN LOGO";
        btn.disabled = false;
    }
});

window.tolakProposal = async function() {
    const subId = document.getElementById('revSubId').value;
    if(!confirm("Yakin menolak proposal ini?")) return;
    try {
        await supabaseClient.from('sponsor_submissions').update({ status: 'Ditolak' }).eq('id', subId);
        document.getElementById('modalReview').classList.add('hidden');
        loadAntrian();
    } catch(err) { alert(err.message); }
}
