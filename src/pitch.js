import { supabaseClient } from './supabase.js';

let allSponsors = [];
let selectedSponsor = null;

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Cek Auth (Hanya Admin yang boleh buka)
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        alert("Akses ditolak. Wajib Login!");
        window.location.href = '/auth.html';
        return;
    }

    const selectSponsor = document.getElementById('selectSponsor');
    const inputSlug = document.getElementById('inputSlug');

    try {
        // 2. Load Master Sponsors dari DB
        const { data: sponsors, error } = await supabaseClient
            .from('master_sponsors')
            .select('*')
            .order('sponsor_name', { ascending: true });

        if (error) throw error;
        
        allSponsors = sponsors;
        
        selectSponsor.innerHTML = '<option value="">-- Pilih Brand Sponsor --</option>';
        allSponsors.forEach(sp => {
            selectSponsor.innerHTML += `<option value="${sp.id}">${sp.sponsor_name} (${sp.kategori})</option>`;
        });

        // 3. Render awal simulasi kosong
        renderSimulation(null);

    } catch (err) {
        console.error(err);
        alert("Gagal memuat data sponsor: " + err.message);
    }

    // 4. Update Simulasi saat Sponsor Dipilih
    selectSponsor.addEventListener('change', (e) => {
        const id = e.target.value;
        if (!id) {
            selectedSponsor = null;
            inputSlug.value = "";
            renderSimulation(null);
            return;
        }

        selectedSponsor = allSponsors.find(s => String(s.id) === String(id));
        
        // Bikin auto-slug dari nama sponsor (e.g., "Milo Nestle" -> "milo-nestle")
        const autoSlug = selectedSponsor.sponsor_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        inputSlug.value = autoSlug;

        // Update Layar HP
        renderSimulation(selectedSponsor);
    });

    // 5. Fungsi Eksekusi Simpan ke DB
    const btnGenerate = document.getElementById('btnGeneratePitch');
    btnGenerate.addEventListener('click', async () => {
        if (!selectedSponsor) return alert("Pilih sponsor dulu, Bos!");
        
        const cpName = document.getElementById('inputCPName').value.trim();
        const cpWa = document.getElementById('inputCPWa').value.trim();
        const cpEmail = document.getElementById('inputCPEmail').value.trim();
        const slug = document.getElementById('inputSlug').value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
        
        const statusMsg = document.getElementById('statusMsg');

        if (!cpName || !slug) {
            statusMsg.innerText = "Nama PIC dan Slug URL wajib diisi!";
            statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-red-100 text-red-600 block mt-2";
            statusMsg.classList.remove('hidden');
            return;
        }

        btnGenerate.innerText = "Meyimpan Pitch Deck... ⏳";
        btnGenerate.disabled = true;

        try {
            const { error: insertErr } = await supabaseClient
                .from('sponsor_pitches')
                .insert([{
                    sponsor_id: selectedSponsor.id,
                    cp_name: cpName,
                    cp_wa: cpWa,
                    cp_email: cpEmail,
                    pitch_slug: slug,
                    created_by: session.user.id
                }]);

            if (insertErr) {
                if (insertErr.code === '23505') throw new Error("Slug URL ini sudah dipakai. Ganti yang lain!");
                throw insertErr;
            }

            // SUKSES
            statusMsg.innerHTML = `✅ <strong>Berhasil!</strong><br>Kirim link ini ke klien: <br><a href="https://f1swimming.com/pitch/${slug}" target="_blank" class="text-blue-600 underline font-mono">f1swimming.com/pitch/${slug}</a>`;
            statusMsg.className = "text-sm text-center rounded-lg p-3 bg-green-100 text-green-800 block mt-2";
            statusMsg.classList.remove('hidden');

            // Reset Form
            document.getElementById('inputCPName').value = '';
            document.getElementById('inputCPWa').value = '';
            document.getElementById('inputCPEmail').value = '';

        } catch (err) {
            statusMsg.innerText = err.message;
            statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-red-100 text-red-600 block mt-2";
            statusMsg.classList.remove('hidden');
        } finally {
            btnGenerate.innerText = "Generate Pitch Deck & Simpan";
            btnGenerate.disabled = false;
        }
    });
});

// ==========================================
// RENDER SIMULASI HP (MOCKUP LIVE RESULT)
// ==========================================
function renderSimulation(sponsor) {
    const container = document.getElementById('simulationContainer');
    let html = '';

    // Bikin array gaya dummy buat realistis
    const dummyEvents = [
        "Gaya Bebas 50m Putra", "Gaya Bebas 50m Putri", 
        "Gaya Dada 100m Putra", "Gaya Punggung 50m Putri",
        "Gaya Kupu 100m Putra", "Estafet Bebas 4x50m Mix",
        "Gaya Bebas 100m Putra", "Gaya Dada 50m Putri",
        "Gaya Punggung 100m Putra", "Gaya Kupu 50m Putri"
    ];

    for (let i = 0; i < 10; i++) {
        
        // SELIPKAN IKLAN SETELAH EVENT KE-2 DAN KE-6 BIAR KLASIK
        if (sponsor && (i === 2 || i === 6)) {
            html += `
            <a href="${sponsor.link_url || '#'}" target="_blank" class="block w-full bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] overflow-hidden border-2 border-amber-300 transform hover:scale-105 transition-transform duration-300 relative group">
                <span class="absolute top-0 right-0 bg-amber-400 text-[8px] font-black px-2 py-0.5 rounded-bl-lg text-amber-900 tracking-widest z-10">SPONSORED</span>
                <img src="${sponsor.cover_url || sponsor.logo_url}" class="w-full h-24 object-cover object-center bg-slate-50" alt="${sponsor.sponsor_name}">
                <div class="p-2 bg-gradient-to-r from-amber-50 to-white flex justify-between items-center">
                    <div>
                        <p class="text-[10px] font-black text-slate-800 uppercase tracking-widest">${sponsor.sponsor_name}</p>
                        <p class="text-[8px] text-slate-500 font-medium">${sponsor.jenis_bantuan}</p>
                    </div>
                    <span class="text-amber-500 text-sm">➔</span>
                </div>
            </a>
            `;
        }

        // Tampilan Kartu Event Dummy
        html += `
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex justify-between items-center opacity-80 pointer-events-none grayscale-[30%]">
            <div>
                <p class="text-[9px] font-bold text-red-500 mb-0.5 uppercase tracking-wider">Event ${i+1}</p>
                <p class="text-xs font-black text-slate-800">${dummyEvents[i]}</p>
            </div>
            <div class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">»</div>
        </div>
        `;
    }

    container.innerHTML = html;
}