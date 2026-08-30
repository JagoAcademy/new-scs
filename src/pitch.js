import { supabaseClient } from './supabase.js';

let allSponsors = [];
let selectedBrands = []; 

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Cek Auth (Hanya Admin yang boleh buka)
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        alert("Akses ditolak. Wajib Login!");
        window.location.href = '/auth.html';
        return;
    }

    const inputCompanyName = document.getElementById('inputCompanyName');
    const selectSponsor = document.getElementById('selectSponsor');
    const btnAddBrand = document.getElementById('btnAddBrand');
    const containerBrands = document.getElementById('selectedBrandsContainer');
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
        renderSimulation([]);

    } catch (err) {
        console.error(err);
        alert("Gagal memuat data sponsor: " + err.message);
    }

    // FUNGSI MENGGAMBAR BADGE BRAND YANG TERPILIH
    function renderSelectedBrands() {
        containerBrands.innerHTML = '';
        if (selectedBrands.length === 0) {
            renderSimulation([]);
            return;
        }

        selectedBrands.forEach(b => {
            const badge = document.createElement('div');
            badge.className = "bg-white border border-indigo-200 text-indigo-800 text-[10px] font-black uppercase px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm";
            badge.innerHTML = `
                ${b.sponsor_name}
                <button type="button" class="text-red-400 hover:text-red-600 font-black ml-1 text-sm leading-none focus:outline-none" data-id="${b.id}">&times;</button>
            `;
            
            // Tombol hapus brand
            badge.querySelector('button').addEventListener('click', (e) => {
                const removeId = e.target.getAttribute('data-id');
                selectedBrands = selectedBrands.filter(brand => String(brand.id) !== String(removeId));
                renderSelectedBrands();
                generateSlug();
                renderSimulation(selectedBrands);
            });
            
            containerBrands.appendChild(badge);
        });
    }

    // FUNGSI MEMBUAT OTOMATIS SLUG URL KLIEN
    function generateSlug() {
        const company = inputCompanyName.value.trim();
        if (company) {
            let slugBase = company;
            if (selectedBrands.length > 0) {
                slugBase += '-' + selectedBrands[0].sponsor_name;
            }
            inputSlug.value = slugBase.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        } else if (selectedBrands.length > 0) {
            inputSlug.value = selectedBrands[0].sponsor_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        } else {
            inputSlug.value = '';
        }
    }

    // LISTENER UNTUK COMPANY NAME -> AUTO SLUG
    inputCompanyName.addEventListener('input', generateSlug);

    // LISTENER TOMBOL "+ TAMBAH"
    btnAddBrand.addEventListener('click', () => {
        const id = selectSponsor.value;
        if (!id) return alert("Pilih brand dari dropdown terlebih dahulu!");

        const sp = allSponsors.find(s => String(s.id) === String(id));
        if (!sp) return;

        // Cegah duplikat brand yang sama
        if (selectedBrands.some(b => b.id === sp.id)) {
            return alert("Brand ini sudah ditambahkan ke daftar!");
        }

        selectedBrands.push(sp);
        
        // Reset dropdown kembali ke default
        selectSponsor.value = "";

        renderSelectedBrands();
        generateSlug();
        renderSimulation(selectedBrands); // Update Layar HP
    });

    // 5. FUNGSI EKSEKUSI SIMPAN KE DATABASE
    const btnGenerate = document.getElementById('btnGeneratePitch');
    btnGenerate.addEventListener('click', async () => {
        const companyName = inputCompanyName.value.trim();
        
        if (!companyName) return alert("Nama Perusahaan (Corporate) wajib diisi!");
        if (selectedBrands.length === 0) return alert("Pilih dan Tambahkan minimal 1 brand!");
        
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

        btnGenerate.innerText = "Menyimpan Pitch Deck... ⏳";
        btnGenerate.disabled = true;

        try {
            // HANYA KIRIM DATA YANG BERSIH SESUAI HIERARKI BARU
            const brandIds = selectedBrands.map(b => b.id);

            const { error: insertErr } = await supabaseClient
                .from('sponsor_pitches')
                .insert([{
                    company_name: companyName,
                    brand_ids: brandIds,
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
            statusMsg.innerHTML = `✅ <strong>Berhasil!</strong><br>Kirim link ini ke klien: <br><a href="https://f1swimming.com/pitch/${slug}" target="_blank" class="text-blue-600 underline font-mono mt-1 inline-block">f1swimming.com/pitch/${slug}</a>`;
            statusMsg.className = "text-sm text-center rounded-lg p-3 bg-green-100 text-green-800 block mt-2 border border-green-200";
            statusMsg.classList.remove('hidden');

            // Reset Form Parsial
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
// RENDER SIMULASI HP (MOCKUP LIVE RESULT) DENGAN ARRAY
// ==========================================
function renderSimulation(brandsArray) {
    const container = document.getElementById('simulationContainer');
    let html = '';

    const dummyEvents = [
        "Gaya Bebas 50m Putra", "Gaya Bebas 50m Putri", 
        "Gaya Dada 100m Putra", "Gaya Punggung 50m Putri",
        "Gaya Kupu 100m Putra", "Estafet Bebas 4x50m Mix",
        "Gaya Bebas 100m Putra", "Gaya Dada 50m Putri",
        "Gaya Punggung 100m Putra", "Gaya Kupu 50m Putri"
    ];

    if (!brandsArray || brandsArray.length === 0) {
        container.innerHTML = `
            <div class="text-center text-slate-400 font-bold text-xs mt-10 italic border-2 border-dashed border-slate-300 rounded-xl p-6">
                Tambahkan brand di samping kiri untuk melihat simulasi iklan.
            </div>
        `;
        return;
    }

    for (let i = 0; i < 10; i++) {
        
        // SELIPKAN IKLAN SETELAH EVENT KE-2 DAN KE-6 BERGANTIAN
        if (i === 2 || i === 6) {
            // Logika ganti brand: kalau brand > 1, event ke-6 pakai brand kedua
            let spIndex = (i === 2) ? 0 : (brandsArray.length > 1 ? 1 : 0);
            let sponsor = brandsArray[spIndex];
            
            html += `
            <a href="${sponsor.link_url || '#'}" target="_blank" class="block w-full bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] overflow-hidden border-2 border-amber-300 transform hover:scale-105 transition-transform duration-300 relative group mb-3">
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
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex justify-between items-center opacity-80 pointer-events-none grayscale-[30%] mb-3">
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
