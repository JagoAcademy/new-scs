import { supabaseClient } from '../src/supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const currentEventId = urlParams.get('id');

    if (!currentEventId) {
        alert("ID Event tidak ditemukan!");
        return;
    }

    try {
        // 1. Tarik Data Event Lengkap (Untuk Cover)
        const { data: eventData } = await supabaseClient.from('events').select('*').eq('id', currentEventId).single();
        if (eventData) {
            document.getElementById('coverTitle').innerText = eventData.event_name || 'EVENT TANPA NAMA';
            document.getElementById('contentTitle').innerText = eventData.event_name || 'EVENT TANPA NAMA';
            
            let formattedDate = 'Jadwal belum dikonfirmasi';
            const rawDate = eventData.start_date || eventData.event_date || eventData.tanggal; 
            if (rawDate) {
                try {
                    const dateObj = new Date(rawDate);
                    if (!isNaN(dateObj.getTime())) {
                        formattedDate = dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                    }
                } catch (e) {}
            }
            document.getElementById('coverDate').innerText = formattedDate;
            
            const config = eventData.config || {};
            const namaKota = eventData.kota || '';
            const namaProvinsi = eventData.provinsi || '';
            const namaKolam = config.nama_kolam || '';
            
            let teksLokasiLengkap = '';
            if (namaKolam) teksLokasiLengkap += `${namaKolam} - `;
            if (namaKota && namaProvinsi) {
                teksLokasiLengkap += `${namaKota}, ${namaProvinsi}`;
            } else if (namaKota || namaProvinsi) {
                teksLokasiLengkap += `${namaKota}${namaProvinsi}`;
            }

            document.getElementById('coverLocation').innerText = teksLokasiLengkap || 'Lokasi belum dikonfirmasi';
            
            await renderCoverSponsors(currentEventId);
        }

        // 2. Tarik Data Formasi (event_heats)
        const { data: heats, error } = await supabaseClient
            .from('event_heats')
            .select('*')
            .eq('event_id', currentEventId)
            .order('event_number', { ascending: true })
            .order('heat_number', { ascending: true });

        if (error) throw error;

        const container = document.getElementById('heatContainer');
        container.innerHTML = '';

        if (!heats || heats.length === 0) {
            container.innerHTML = `
            <div class="text-center p-10 border-2 border-dashed border-red-300 rounded-2xl bg-red-50">
                <h3 class="text-red-600 font-black text-lg">⚠️ Buku Acara Kosong!</h3>
                <p class="text-slate-600 text-sm mt-2">Anda belum meng-generate Start List. Harap masuk ke menu "Pusat Cetak > Buku Acara" lalu klik Simpan.</p>
            </div>`;
            return;
        }

        // 3. Kelompokkan berdasarkan Sesi
        const groupedBySesi = {};
        heats.forEach(heat => {
            const sesi = heat.sesi || 'SESI UTAMA';
            if (!groupedBySesi[sesi]) groupedBySesi[sesi] = [];
            groupedBySesi[sesi].push(heat);
        });

        // 4. Render ke Kertas A4 (Format Identik dengan book.js)
        Object.keys(groupedBySesi).forEach(sesiName => {
            
            container.innerHTML += `
            <div class="bg-slate-800 text-white p-2 text-center font-black uppercase tracking-widest text-sm mb-4 mt-8 print:mt-4 rounded-md print:rounded-none print:border-y-2 print:border-black print:bg-transparent print:text-black">
                --- ${sesiName} ---
            </div>`;

            let html = '';
            groupedBySesi[sesiName].forEach(heat => {
                let tbodyHtml = '';
                
                heat.lanes_data.sort((a,b) => a.lane - b.lane);
                const maxLanes = heat.lanes_data.length;

                for (let i = 0; i < maxLanes; i++) {
                    const swimmer = heat.lanes_data[i];
                    if (swimmer && swimmer.f1_id && swimmer.nama) {
                        tbodyHtml += `
                        <tr class="border-b border-slate-200 text-xs text-slate-800">
                            <td class="py-1.5 px-2 text-center font-bold">${swimmer.lane}</td>
                            <td class="py-1.5 px-2 font-bold truncate max-w-0" title="${swimmer.nama.toUpperCase()}">${swimmer.nama.toUpperCase()}</td>
                            <td class="py-1.5 px-2 font-medium text-slate-600 truncate max-w-0 uppercase" title="${swimmer.klub}">${swimmer.klub}</td>
                            <td class="py-1.5 px-2 text-center font-mono text-slate-500">${swimmer.seed_time || 'NT'}</td>
                        </tr>`;
                    } else {
                        tbodyHtml += `
                        <tr class="border-b border-slate-200 text-xs text-slate-300">
                            <td class="py-1.5 px-2 text-center">${swimmer ? swimmer.lane : (i+1)}</td>
                            <td class="py-1.5 px-2 italic truncate max-w-0">--- Kosong ---</td>
                            <td class="py-1.5 px-2 truncate max-w-0"></td>
                            <td class="py-1.5 px-2"></td>
                        </tr>`;
                    }
                }

                html += `
                <div class="avoid-break mb-6 mt-4">
                    <div class="flex justify-between items-end border-b-2 border-slate-700 pb-1 mb-1">
                        <h3 class="font-extrabold text-[11px] uppercase text-slate-900">Event #${heat.event_number}: ${heat.nomor_lomba} - ${heat.gender} - ${heat.kelompok_umur}</h3>
                        <span class="font-bold text-[10px] text-slate-600 uppercase">HEAT ${heat.heat_number} of ${heat.total_heats}</span>
                    </div>
                    <table class="w-full text-left border-collapse table-fixed">
                        <thead>
                            <tr class="text-[9px] text-slate-400 uppercase tracking-widest border-b border-slate-200 bg-slate-50/50 print:bg-transparent">
                                <th class="py-1.5 px-2 w-10 text-center font-bold">LINT</th>
                                <th class="py-1.5 px-2 w-1/2 font-bold">NAMA ATLET</th>
                                <th class="py-1.5 px-2 w-1/3 font-bold">KLUB / SEKOLAH</th>
                                <th class="py-1.5 px-2 text-center font-bold">SEED TIME</th>
                            </tr>
                        </thead>
                        <tbody>${tbodyHtml}</tbody>
                    </table>
                </div>`;
            });
            container.innerHTML += html;
        });

    } catch (err) {
        alert("Gagal memuat dokumen: " + err.message);
    }
});

async function renderCoverSponsors(eventId) {
    try {
        const { data: linkData } = await supabaseClient.from('event_sponsors').select('sponsor_ids').eq('event_id', eventId).single();
        const coverSponsorDiv = document.getElementById('coverSponsors');

        if (!linkData || !linkData.sponsor_ids || linkData.sponsor_ids.length === 0) {
            coverSponsorDiv.innerHTML = `<span class="text-xs text-slate-300 font-bold italic">Tanpa Dukungan Sponsor</span>`;
            return;
        }

        const { data: sponsors } = await supabaseClient.from('master_sponsors').select('*').in('id', linkData.sponsor_ids);

        if (!sponsors || sponsors.length === 0) {
            coverSponsorDiv.innerHTML = `<span class="text-xs text-slate-300 font-bold italic">Tanpa Dukungan Sponsor</span>`;
            return;
        }

        const platinumSponsors = sponsors.slice(0, 3);
        let spHtml = '';

        platinumSponsors.forEach(sp => {
            spHtml += `
                <img src="${sp.logo_url}" 
                     alt="${sp.sponsor_name}" 
                     class="transition-transform hover:scale-105"
                     onerror="this.onerror=null; this.outerHTML='<div class=\\'bg-white border border-slate-200 px-4 py-2 rounded shadow-sm text-sm font-black text-slate-400 uppercase\\'>${sp.sponsor_name}</div>';">
            `;
        });

        coverSponsorDiv.innerHTML = spHtml;
    } catch (err) {
        console.error("Gagal merender sponsor cover:", err);
    }
}
