import { supabaseClient } from '../src/supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');

    const clubNameEl = document.getElementById('uiClubName');
    const eventInfoEl = document.getElementById('uiEventInfo');
    const rosterListEl = document.getElementById('rosterList');
    const totalPesertaEl = document.getElementById('uiTotalPeserta');

    if (!eventId) {
        clubNameEl.innerText = 'Data Tidak Ditemukan';
        eventInfoEl.innerText = 'Pastikan link URL sudah benar.';
        rosterListEl.innerHTML = '';
        totalPesertaEl.classList.add('hidden');
        return;
    }

    try {
        // Ambil data unofficial_events dan join ke clubs untuk dapat nama klubnya
        const { data, error } = await supabaseClient
            .from('unofficial_events')
            .select(`
                *,
                clubs (club_name)
            `)
            .eq('id', eventId)
            .single();

        if (error || !data) throw new Error('Event tidak valid');

        // Render Header
        clubNameEl.innerText = data.clubs?.club_name || 'Klub Renang';
        
        const dateObj = new Date(data.tanggal);
        const dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        
        eventInfoEl.innerHTML = `
            Akan bertanding di <span class="text-amber-400 font-bold">${data.nama_event}</span><br>
            <span class="text-xs mt-1 block">📍 ${data.lokasi_kolam}, ${data.kota}, ${data.provinsi} • 📅 ${dateStr}</span>
        `;

        // Ambil JSONB Peserta
        let pesertaArray = data.peserta || [];
        totalPesertaEl.innerText = `${pesertaArray.length} Pasukan`;

        if (pesertaArray.length === 0) {
            rosterListEl.innerHTML = '<div class="col-span-2 text-center py-6 text-slate-500 font-bold">Belum ada atlet yang didaftarkan.</div>';
            return;
        }

        // Render Roster
        let html = '';
        pesertaArray.forEach((atlet, index) => {
            const avatarUrl = atlet.foto_url 
                ? atlet.foto_url 
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(atlet.nama)}&background=1e293b&color=cbd5e1&bold=true`;
            
            const genderBadgeClass = atlet.gender === 'Putra' 
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                : 'bg-pink-500/20 text-pink-400 border-pink-500/30';

            html += `
                <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 hover:border-slate-600 transition-colors group">
                    <span class="text-slate-700 font-black text-xl w-6 text-center shrink-0">${index + 1}</span>
                    <img src="${avatarUrl}" class="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                    <div class="flex-1 min-w-0">
                        <h3 class="font-extrabold text-white text-sm md:text-base truncate drop-shadow-sm mb-1">${atlet.nama}</h3>
                        <div class="flex items-center gap-2">
                            <span class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${genderBadgeClass}">${atlet.gender}</span>
                            <span class="font-mono text-[9px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded tracking-widest">${atlet.f1_id}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        rosterListEl.innerHTML = html;

    } catch (err) {
        console.error(err);
        clubNameEl.innerText = 'Gagal Memuat';
        eventInfoEl.innerText = err.message;
        rosterListEl.innerHTML = '';
        totalPesertaEl.classList.add('hidden');
    }
});
