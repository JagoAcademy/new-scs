import { supabaseClient } from './supabase.js';

let registeredClubs = [];
// 🚀 FIX: Array untuk menampung riwayat lomba ganda
let pendingHistories = [];

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const searchResults = document.getElementById('searchResults');
    const searchStatus = document.getElementById('searchStatus');
    const searchList = document.getElementById('searchList');

    let debounceTimer;

    async function performSearch(query) {
        query = query.trim();
        if (!query) { searchResults.classList.add('hidden'); return; }

        searchResults.classList.remove('hidden');
        searchList.innerHTML = '';
        searchStatus.classList.remove('hidden');
        searchStatus.innerText = 'Mencari atlet... ⏳';

        try {
            const { data: clubMatches } = await supabaseClient.from('clubs').select('id').ilike('club_name', `%${query}%`);
            let clubIds = clubMatches && clubMatches.length > 0 ? clubMatches.map(c => c.id) : [];

            let orString = `full_name.ilike.%${query}%,f1_id.ilike.%${query}%`;
            if (clubIds.length > 0) orString += `,club_id.in.(${clubIds.join(',')})`;

            const { data, error } = await supabaseClient.from('athletes').select(`*, clubs (club_name)`).or(orString).limit(10);
            if (error) throw error;

            searchStatus.classList.add('hidden');

            if (data.length === 0) {
                searchStatus.classList.remove('hidden');
                searchStatus.innerHTML = `<span class="text-4xl block mb-2">🕵️‍♂️</span>Tidak ada atlet yang cocok dengan "<b>${query}</b>"`;
                return;
            }

            data.forEach(atlet => {
                const isEmas = atlet.is_verified;
                const statusIcon = isEmas ? '<span class="text-amber-500 text-xs" title="Verified">👑</span>' : '';
                const namaKlub = atlet.clubs?.club_name || '❌ Unattached Club';
                const avatarUrl = atlet.foto_url ? atlet.foto_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(atlet.full_name)}&background=f8fafc&color=1e293b&bold=true`;

                const li = document.createElement('li');
                li.innerHTML = `
                    <a href="/f1-id.html?id=${atlet.f1_id}" class="flex items-center gap-4 p-4 hover:bg-blue-50 transition-colors cursor-pointer group">
                        <img src="${avatarUrl}" class="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm group-hover:scale-105 transition-transform shrink-0">
                        <div class="flex-1 min-w-0">
                            <h4 class="font-extrabold text-slate-800 text-sm truncate">${atlet.full_name} ${statusIcon}</h4>
                            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">🏠 ${namaKlub}</p>
                            <span class="inline-block bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-mono px-2 py-0.5 rounded tracking-widest">${atlet.f1_id}</span>
                        </div>
                        <div class="shrink-0 text-slate-300 group-hover:text-blue-500 transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                        </div>
                    </a>
                `;
                searchList.appendChild(li);
            });
        } catch (err) {
            searchStatus.classList.remove('hidden');
            searchStatus.innerHTML = `<span class="text-red-500 font-bold">Terjadi kesalahan sistem. Coba lagi.</span>`;
        }
    }

    searchBtn.addEventListener('click', () => performSearch(searchInput.value));
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => performSearch(e.target.value), 500);
    });
    document.addEventListener('click', (e) => {
        if (!searchResults.contains(e.target) && e.target !== searchInput && e.target !== searchBtn) searchResults.classList.add('hidden');
    });
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim() !== '') searchResults.classList.remove('hidden');
    });

    // ==========================================
    // 2. MODAL & REGISTER F1-ID MANDIRI
    // ==========================================
    const modalCreateF1 = document.getElementById('modalCreateF1Id');
    const btnOpenCreateF1Id = document.getElementById('btnOpenCreateF1Id');
    const btnCloseModalCreateF1 = document.getElementById('btnCloseModalCreateF1');
    const regClubSelect = document.getElementById('regClubSelect');
    const boxViralCallout = document.getElementById('boxViralCallout');
    const btnSubmitF1 = document.getElementById('btnSubmitF1');
    const regStatusMsg = document.getElementById('regStatusMsg');

    btnOpenCreateF1Id.addEventListener('click', async () => {
        modalCreateF1.classList.replace('hidden', 'flex');
        await loadClubDropdown();
    });

    btnCloseModalCreateF1.addEventListener('click', () => {
        modalCreateF1.classList.replace('flex', 'hidden');
    });

    async function loadClubDropdown() {
        try {
            const { data: clubs, error } = await supabaseClient.from('clubs').select('id, club_name, kota_asal').order('club_name', { ascending: true });
            if (error) throw error;
            registeredClubs = clubs || [];

            regClubSelect.innerHTML = `<option value="">-- Pilih Klub Renang Asal --</option>`;
            regClubSelect.innerHTML += `<option value="UNATTACHED">❌ Unattached Club (Klub Belum Terdaftar)</option>`;
            
            registeredClubs.forEach(c => {
                regClubSelect.innerHTML += `<option value="${c.id}">${c.club_name} (${c.kota_asal || 'Klub'})</option>`;
            });
        } catch (err) {
            regClubSelect.innerHTML = `<option value="UNATTACHED">❌ Unattached Club</option>`;
        }
    }

    regClubSelect.addEventListener('change', (e) => {
        if (e.target.value === 'UNATTACHED') boxViralCallout.classList.remove('hidden');
        else boxViralCallout.classList.add('hidden');
    });

    // 🚀 FIX: FUNGSI SIMPAN & TAMBAH ARRAY CATATAN WAKTU
    const btnAddTempTime = document.getElementById('btnAddTempTime');
    const tempTimeList = document.getElementById('tempTimeList');

    function renderTempTimes() {
        if (pendingHistories.length === 0) {
            tempTimeList.innerHTML = '';
            return;
        }
        tempTimeList.innerHTML = pendingHistories.map((h, i) => `
            <div class="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-blue-300">
                <div>
                    <p class="font-extrabold text-slate-800 text-sm">${h.nomor_lomba} <span class="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-bold tracking-wider">${h.medali !== 'Peserta' ? '🏆 '+h.medali : ''}</span></p>
                    <p class="text-[11px] font-bold text-slate-500 mt-0.5">${h.event_name} • <span class="font-mono text-blue-600 font-black">${h.waktu}</span></p>
                </div>
                <button type="button" onclick="window.removeTempTime(${i})" class="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors font-black text-lg">&times;</button>
            </div>
        `).join('');
    }

    window.removeTempTime = (index) => {
        pendingHistories.splice(index, 1);
        renderTempTimes();
    };

    btnAddTempTime.addEventListener('click', () => {
        const evName = document.getElementById('regEventName').value.trim();
        const evDate = document.getElementById('regEventDate').value;
        const gaya = document.getElementById('regGaya').value;
        const jarak = document.getElementById('regJarak').value;
        const waktu = document.getElementById('regWaktu').value.trim();
        const medali = document.getElementById('regMedali').value;

        if(!evName || !evDate || !waktu) return alert("Nama Event, Tanggal, dan Waktu wajib diisi!");

        pendingHistories.push({
            event_name: evName,
            event_date: evDate,
            nomor_lomba: `${jarak} Gaya ${gaya}`,
            waktu: waktu,
            medali: medali
        });

        document.getElementById('regEventName').value = '';
        document.getElementById('regWaktu').value = '';
        document.getElementById('regMedali').value = 'Peserta';
        renderTempTimes();
    });


    // 🚀 SUBMIT F1 ID
    btnSubmitF1.addEventListener('click', async () => {
        const name = document.getElementById('regName').value.trim();
        const dob = document.getElementById('regDOB').value;
        const gender = document.getElementById('regGender').value;
        const clubVal = regClubSelect.value;
        const fotoFile = document.getElementById('regFoto').files[0];

        if (!name || !dob || !gender || !clubVal) {
            regStatusMsg.innerText = "Nama, Tanggal Lahir, Gender, dan Pilihan Klub wajib diisi!";
            regStatusMsg.className = "text-xs font-bold text-center rounded-lg p-3 bg-red-100 text-red-600 block";
            return;
        }

        // Kalau form lomba masih diisi tapi belum diklik "Tambah", kita otomatis masukkan ke array
        const evName = document.getElementById('regEventName').value.trim();
        const evDate = document.getElementById('regEventDate').value;
        const waktu = document.getElementById('regWaktu').value.trim();
        if(evName && evDate && waktu) {
            pendingHistories.push({
                event_name: evName,
                event_date: evDate,
                nomor_lomba: `${document.getElementById('regJarak').value} Gaya ${document.getElementById('regGaya').value}`,
                waktu: waktu,
                medali: document.getElementById('regMedali').value
            });
        }

        btnSubmitF1.innerText = "Menerbitkan F1 ID...";
        btnSubmitF1.disabled = true;

        try {
            const dateObj = new Date(dob);
            const yy = dateObj.getFullYear().toString().slice(-2);
            const mm = ('0' + (dateObj.getMonth() + 1)).slice(-2);
            const random3 = Math.floor(Math.random() * 900) + 100;
            const generatedF1Id = `F1-${yy}${mm}${random3}`;

            let uploadedFotoUrl = null;
            if (fotoFile) {
                const ext = fotoFile.name.split('.').pop();
                const path = `foto/${generatedF1Id}_${Date.now()}.${ext}`;
                const { error: uploadErr } = await supabaseClient.storage.from('berkas-atlet').upload(path, fotoFile);
                if (!uploadErr) {
                    const { data: pUrl } = supabaseClient.storage.from('berkas-atlet').getPublicUrl(path);
                    uploadedFotoUrl = pUrl.publicUrl;
                }
            }

            // Map untuk field JSONB history_lomba di tabel athletes
            let jsonbHistory = pendingHistories.map(h => ({
                event_name: h.event_name,
                nomor_lomba: h.nomor_lomba,
                waktu: h.waktu,
                medali: h.medali,
                status: "Unofficial",
                input_date: new Date().toISOString().split('T')[0]
            }));

            const { error: insertErr } = await supabaseClient.from('athletes').insert([{
                f1_id: generatedF1Id,
                full_name: name,
                dob: dob,
                gender: gender,
                club_id: null, 
                foto_url: uploadedFotoUrl,
                history_lomba: jsonbHistory,
                is_verified: false,
                owner_id: null 
            }]);

            if (insertErr) {
                if (insertErr.code === '23505') throw new Error("Atlet dengan Nama dan Tanggal Lahir tersebut sudah terdaftar di F1 ID.");
                throw insertErr;
            }

            // Inbox Tembakan
            if (clubVal !== 'UNATTACHED') {
                await supabaseClient.from('club_inbox').insert([{
                    club_id: parseInt(clubVal),
                    sender_name: name,
                    message_type: 'KLAIM_ATLET',
                    content: `Atlet baru atas nama ${name} (${generatedF1Id}) didaftarkan secara mandiri dan meminta untuk ditautkan ke klub Anda.`,
                    related_f1_id: generatedF1Id
                }]);
            }

            // 🚀 FIX: Insert Berjamaah ke manual_results
            if (pendingHistories.length > 0) {
                const manualInserts = pendingHistories.map(h => {
                    let timeSeconds = 0;
                    if (h.waktu.includes(':')) {
                        const parts = h.waktu.split(':');
                        timeSeconds = (parseInt(parts[0]) || 0) * 60 + parseFloat(parts[1] || 0);
                    } else {
                        timeSeconds = parseFloat(h.waktu);
                    }

                    return {
                        f1_id: generatedF1Id,
                        event_name: h.event_name,
                        event_date: h.event_date,
                        nomor_lomba: h.nomor_lomba,
                        waktu_string: h.waktu,
                        time_seconds: isNaN(timeSeconds) ? 0 : timeSeconds,
                        medali: h.medali !== 'Peserta' ? h.medali : null 
                    };
                });

                await supabaseClient.from('manual_results').insert(manualInserts);
            }

            regStatusMsg.innerHTML = `✅ <strong>Sukses!</strong> F1 ID Anda: <span class="font-mono">${generatedF1Id}</span>`;
            regStatusMsg.className = "text-xs font-bold text-center rounded-lg p-3 bg-green-100 text-green-700 block mt-2";

            setTimeout(() => { window.location.href = `/f1-id.html?id=${generatedF1Id}`; }, 1800);

        } catch (err) {
            regStatusMsg.innerText = "Gagal: " + err.message;
            regStatusMsg.className = "text-xs font-bold text-center rounded-lg p-3 bg-red-100 text-red-600 block mt-2";
            btnSubmitF1.innerText = "Terbitkan F1 ID Sekarang 🚀";
            btnSubmitF1.disabled = false;
        }
    });
});
