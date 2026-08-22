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
            
            html += `
                <tr class="hover:bg-slate-800/50 transition-colors">
                    <td class="p-4 font-bold text-white">${evName}</td>
                    <td class="p-4 font-black text-amber-400">${spName}</td>
                    <td class="p-4 text-center"><span class="bg-amber-900/50 text-amber-500 px-3 py-1 rounded text-[10px] font-bold border border-amber-500/30">⏳ Menunggu</span></td>
                    <td class="p-4 text-center">
                        <button onclick="openReview('${sub.id}', '${sub.event_id}', '${sub.sponsor_id}', '${evName}', '${spName}')" class="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-4 rounded-lg text-xs transition shadow">Review</button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    } catch(err) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-red-500 font-bold">Error: ${err.message}</td></tr>`;
    }
}

window.openReview = function(id, evId, spId, evName, spName) {
    document.getElementById('revSubId').value = id;
    document.getElementById('revEventId').value = evId;
    document.getElementById('revSponsorId').value = spId;
    document.getElementById('revEventName').innerText = evName;
    document.getElementById('revBrandName').innerText = spName;
    document.getElementById('modalReview').classList.remove('hidden');
}

document.getElementById('btnApprove').addEventListener('click', async () => {
    const subId = document.getElementById('revSubId').value;
    const evId = document.getElementById('revEventId').value;
    const spId = parseInt(document.getElementById('revSponsorId').value);
    const jenisDeal = document.getElementById('revJenisDeal').value;
    const btn = document.getElementById('btnApprove');
    
    btn.innerText = "⏳ Memproses...";
    btn.disabled = true;

    try {
        // 1. Update status submission + set jenis deal
        await supabaseClient.from('sponsor_submissions')
            .update({ status: 'Disetujui', jenis_bantuan_deal: jenisDeal })
            .eq('id', subId);

        // 2. Suntik logo ke event_sponsors
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
