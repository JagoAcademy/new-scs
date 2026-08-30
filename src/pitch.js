import { supabaseClient } from './supabase.js';

let allSponsors = [];
let selectedBrands = []; 

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. CEK AUTHENTICATION
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
    const inputCorpLogo = document.getElementById('inputCorpLogo'); // Ini sekarang File Input
    const inputMessage = document.getElementById('inputMessage');
    const dataListCorporate = document.getElementById('corporateList');

    try {
        // 2. LOAD MASTER SPONSORS UNTUK DROPDOWN
        const { data: sponsors, error: spErr } = await supabaseClient
            .from('master_sponsors')
            .select('*')
            .order('sponsor_name', { ascending: true });

        if (spErr) throw spErr;
        
        allSponsors = sponsors;
        selectSponsor.innerHTML = '<option value="">-- Pilih Brand Sponsor --</option>';
        allSponsors.forEach(sp => {
            selectSponsor.innerHTML += `<option value="${sp.id}">${sp.sponsor_name} (${sp.kategori})</option>`;
        });

        // 3. LOAD HISTORY CORPORATE UNTUK AUTO-COMPLETE (DATALIST)
        const { data: pitches, error: pitchErr } = await supabaseClient
            .from('sponsor_pitches')
            .select('company_name');
            
        if (!pitchErr && pitches) {
            // Ambil nama unik aja biar gak dobel-dobel di dropdown
            const uniqueCompanies = [...new Set(pitches.map(p => p.company_name).filter(Boolean))];
            uniqueCompanies.forEach(company => {
                dataListCorporate.innerHTML += `<option value="${company}">`;
            });
        }

        renderSimulation([]);
    } catch (err) {
        console.error("Gagal memuat data awal:", err.message);
    }

    // FUNGSI RENDER BADGE BRAND TERPILIH
    function renderSelectedBrands() {
        containerBrands.innerHTML = '';
        if (selectedBrands.length === 0) return renderSimulation([]);

        selectedBrands.forEach(b => {
            const badge = document.createElement('div');
            badge.className = "bg-white border border-indigo-200 text-indigo-800 text-[10px] font-black uppercase px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm";
            badge.innerHTML = `${b.sponsor_name} <button type="button" class="text-red-400 hover:text-red-600 font-black ml-1 text-sm leading-none focus:outline-none" data-id="${b.id}">&times;</button>`;
            
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

    // AUTO-GENERATE SLUG DARI NAMA CORPORATE
    function generateSlug() {
        const company = inputCompanyName.value.trim();
        if (company) {
            inputSlug.value = company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        } else {
            inputSlug.value = '';
        }
    }

    inputCompanyName.addEventListener('input', generateSlug);

    // TOMBOL TAMBAH BRAND KE ARRAY
    btnAddBrand.addEventListener('click', () => {
        const id = selectSponsor.value;
        if (!id) return alert("Pilih brand dulu!");
        const sp = allSponsors.find(s => String(s.id) === String(id));
        if (!sp || selectedBrands.some(b => b.id === sp.id)) return;

        selectedBrands.push(sp);
        selectSponsor.value = "";
        renderSelectedBrands();
        generateSlug();
        renderSimulation(selectedBrands); 
    });

    // EKSEKUSI UTAMA (UPLOAD LOGO & SIMPAN KE DB)
    const btnGenerate = document.getElementById('btnGeneratePitch');
    btnGenerate.addEventListener('click', async () => {
        const companyName = inputCompanyName.value.trim();
        if (!companyName) return alert("Nama Perusahaan wajib diisi!");
        if (selectedBrands.length === 0) return alert("Tambahkan minimal 1 brand!");
        
        const cpName = document.getElementById('inputCPName').value.trim();
        const cpWa = document.getElementById('inputCPWa').value.trim();
        const cpEmail = document.getElementById('inputCPEmail').value.trim();
        const slug = document.getElementById('inputSlug').value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
        const appMessage = inputMessage.value.trim() || null;
        const logoFile = inputCorpLogo.files[0]; // Tangkap file upload
        
        const statusMsg = document.getElementById('statusMsg');

        if (!cpName || !slug) {
            statusMsg.innerText = "Nama PIC dan Slug URL wajib diisi!";
            statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-red-100 text-red-600 block mt-2";
            statusMsg.classList.remove('hidden');
            return;
        }

        btnGenerate.innerText = "Memproses & Upload Logo... ⏳";
        btnGenerate.disabled = true;

        try {
            let uploadedLogoUrl = null;

            // 1. PROSES UPLOAD LOGO KE STORAGE (JIKA ADA)
            if (logoFile) {
                const fileExt = logoFile.name.split('.').pop();
                const fileName = `corp_${Date.now()}.${fileExt}`;
                const filePath = `corporate_logos/${fileName}`;

                const { data: uploadData, error: uploadErr } = await supabaseClient
                    .storage
                    .from('sponsor-ads')
                    .upload(filePath, logoFile);

                if (uploadErr) throw new Error("Gagal mengupload logo corporate: " + uploadErr.message);

                // Dapatkan URL publik dari logo yang diupload
                const { data: publicUrlData } = supabaseClient
                    .storage
                    .from('sponsor-ads')
                    .getPublicUrl(filePath);

                uploadedLogoUrl = publicUrlData.publicUrl;
            }

            // 2. SIMPAN DATA PITCHING KE DATABASE
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
                    corporate_logo: uploadedLogoUrl, // Masukkan URL hasil upload (atau null)
                    approach_message: appMessage,
                    created_by: session.user.id
                }]);

            if (insertErr) {
                if (insertErr.code === '23505') throw new Error("Slug URL ini sudah dipakai!");
                throw insertErr;
            }

            // SUKSES
            statusMsg.innerHTML = `✅ <strong>Berhasil!</strong><br>Link klien: <a href="https://f1swimming.com/pitch/${slug}" target="_blank" class="text-blue-600 underline font-mono">f1swimming.com/pitch/${slug}</a>`;
            statusMsg.className = "text-sm text-center rounded-lg p-3 bg-green-100 text-green-800 block mt-2 border border-green-200";
            statusMsg.classList.remove('hidden');

            // RESET FORM PARSIAL
            document.getElementById('inputCPName').value = '';
            document.getElementById('inputCPWa').value = '';
            document.getElementById('inputCPEmail').value = '';
            inputCorpLogo.value = ''; // Kosongkan file input
            inputMessage.value = '';

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

// SIMULASI DENGAN UI REAL RESULT
function renderSimulation(brandsArray) {
    const container = document.getElementById('simulationContainer');
    if (!container) return; 
    
    let html = '';
    const dummyEvents = ["Gaya Bebas 50m Putra", "Gaya Dada 50m Putri", "Gaya Punggung 100m Putra", "Estafet 4x50m Bebas", "Gaya Kupu 50m Putra"];

    if (!brandsArray || brandsArray.length === 0) {
        container.innerHTML = `<div class="text-center text-slate-400 font-bold text-xs mt-10 italic border-2 border-dashed border-slate-300 rounded-xl p-6">Tambahkan brand di samping kiri untuk melihat simulasi iklan.</div>`;
        return;
    }

    for (let i = 0; i < 5; i++) {
        let sponsorHeader = '';
        
        if (i === 0 || i === 2) {
            let spIndex = (i === 0) ? 0 : (brandsArray.length > 1 ? 1 : 0);
            let sponsor = brandsArray[spIndex];

            sponsorHeader = `
            <a href="${sponsor.link_url || '#'}" target="_blank" class="flex items-center justify-between bg-amber-50 hover:bg-amber-100 transition-colors border-b border-amber-200 px-3 py-2 -mx-3 -mt-3 mb-2 rounded-t-xl group cursor-pointer">
                <div class="flex items-center gap-1.5 flex-1 min-w-0 pr-2">
                    <span class="text-[7px] font-black text-amber-600 uppercase tracking-widest shrink-0">Supported By:</span>
                    <span class="text-[9px] font-bold text-slate-800 truncate">${sponsor.sponsor_name}</span>
                </div>
                <div class="bg-white p-1 rounded border border-slate-200 shadow-sm shrink-0" style="aspect-ratio: 16/9; width: 45px;">
                    <img src="${sponsor.logo_url}" class="w-full h-full object-contain" onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\\'text-[6px] font-bold text-slate-400\\'>SPONSOR</span>';">
                </div>
            </a>
            `;
        }

        html += `
        <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-3 overflow-hidden relative ${i === 0 || i === 2 ? 'border-amber-300 ring-1 ring-amber-100 transform hover:scale-[1.02] transition-transform' : 'opacity-80'}">
            <div class="absolute left-0 top-0 bottom-0 w-1 ${i === 0 || i === 2 ? 'bg-amber-400' : 'bg-slate-300'} z-10"></div>
            ${sponsorHeader}
            <div class="pl-1 mb-2">
                <h3 class="text-[10px] font-black text-slate-800 uppercase leading-tight">Event #${i+1}: ${dummyEvents[i]}</h3>
                <p class="text-[7px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">HEAT 1 <span class="text-slate-300 mx-1">|</span> Dari 3</p>
            </div>
            <div class="bg-slate-50/50 rounded-lg p-1.5 border border-slate-100">
                <div class="flex items-center text-[7px] font-black text-slate-400 uppercase border-b border-slate-200 pb-1 mb-1 px-1">
                    <div class="w-5 text-center">LN</div><div class="flex-1 pl-1">ATLET</div><div class="w-10 text-right pr-1">WAKTU</div>
                </div>
                <div class="flex items-center py-1 border-b border-slate-100 px-1">
                    <div class="w-5 flex justify-center shrink-0"><div class="w-3 h-3 rounded bg-slate-200 text-slate-600 text-[6px] font-black flex items-center justify-center">4</div></div>
                    <div class="flex-1 pl-1"><p class="text-[8px] font-black text-slate-800 uppercase truncate">Fajar Aditya</p></div>
                    <div class="w-10 shrink-0 text-right pr-1"><span class="font-mono text-[8px] font-black text-emerald-600">28.45</span></div>
                </div>
                <div class="flex items-center py-1 border-b border-slate-100 px-1">
                    <div class="w-5 flex justify-center shrink-0"><div class="w-3 h-3 rounded bg-slate-200 text-slate-600 text-[6px] font-black flex items-center justify-center">5</div></div>
                    <div class="flex-1 pl-1"><p class="text-[8px] font-black text-slate-800 uppercase truncate">Perenang Dummy 2</p></div>
                    <div class="w-10 shrink-0 text-right pr-1"><span class="font-mono text-[8px] font-black text-slate-400">NT</span></div>
                </div>
            </div>
        </div>`;
    }
    container.innerHTML = html;
}
