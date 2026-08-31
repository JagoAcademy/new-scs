import { supabaseClient } from './supabase.js';

let allSponsors = [];
let selectedBrands = []; 
let historyData = []; 

document.addEventListener('DOMContentLoaded', async () => {
    
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        alert("Akses ditolak. Wajib Login!");
        window.location.href = '/auth.html';
        return;
    }

    const targetRadios = document.getElementsByName('targetType');
    const lblCompanyName = document.getElementById('lblCompanyName');
    const boxBrandSimulasi = document.getElementById('boxBrandSimulasi');
    
    const inputCompanyName = document.getElementById('inputCompanyName');
    const selectHistoryCompany = document.getElementById('selectHistoryCompany');
    const selectSponsor = document.getElementById('selectSponsor');
    const btnAddBrand = document.getElementById('btnAddBrand');
    const containerBrands = document.getElementById('selectedBrandsContainer');
    
    const inputSlug = document.getElementById('inputSlug');
    const inputCorpLogo = document.getElementById('inputCorpLogo');
    const inputMessage = document.getElementById('inputMessage');
    const btnAutoCopywrite = document.getElementById('btnAutoCopywrite');

    const statusMsg = document.getElementById('statusMsg');
    const actionButtons = document.getElementById('actionButtons');

    targetRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'club') {
                lblCompanyName.innerText = "Nama Klub / Event Organizer (EO)";
                boxBrandSimulasi.classList.add('hidden');
            } else {
                lblCompanyName.innerText = "Nama Perusahaan (Corporate)";
                boxBrandSimulasi.classList.remove('hidden');
            }
            generateSlug();
            renderSimulation(selectedBrands);
        });
    });

    try {
        const { data: sponsors } = await supabaseClient
            .from('master_sponsors')
            .select('*')
            .order('sponsor_name', { ascending: true });
        
        allSponsors = sponsors || [];
        selectSponsor.innerHTML = '<option value="">-- Pilih Brand Sponsor --</option>';
        allSponsors.forEach(sp => {
            selectSponsor.innerHTML += `<option value="${sp.id}">${sp.sponsor_name} (${sp.kategori})</option>`;
        });

        const { data: pitches } = await supabaseClient
            .from('sponsor_pitches')
            .select('*')
            .order('created_at', { ascending: false });

        if (pitches) {
            historyData = pitches;
            const uniqueCompanies = [];
            pitches.forEach(p => {
                if (p.company_name && !uniqueCompanies.includes(p.company_name)) {
                    uniqueCompanies.push(p.company_name);
                    selectHistoryCompany.innerHTML += `<option value="${p.id}">${p.company_name}</option>`;
                }
            });
        }
    } catch (err) {
        console.error(err);
    }

    selectHistoryCompany.addEventListener('change', (e) => {
        const pitchId = e.target.value;
        if (!pitchId) return;
        
        const selected = historyData.find(p => String(p.id) === String(pitchId));
        if (selected) {
            inputCompanyName.value = selected.company_name || '';
            document.getElementById('inputCPName').value = selected.cp_name || '';
            document.getElementById('inputCPWa').value = selected.cp_wa || '';
            document.getElementById('inputCPEmail').value = selected.cp_email || '';
            inputMessage.value = selected.approach_message || '';
            
            if (selected.target_type) {
                document.querySelector(`input[name="targetType"][value="${selected.target_type}"]`).checked = true;
                document.querySelector(`input[name="targetType"][value="${selected.target_type}"]`).dispatchEvent(new Event('change'));
            }
            generateSlug();
        }
    });

    btnAutoCopywrite.addEventListener('click', () => {
        const type = document.querySelector('input[name="targetType"]:checked').value;
        const pic = document.getElementById('inputCPName').value || 'Bpk/Ibu';
        const company = inputCompanyName.value || '[Nama Perusahaan]';
        const slug = inputSlug.value || 'proposal';
        const link = `https://f1swimming.com/pitch/${slug}`;

        let msg = "";
        if (type === 'brand') {
            msg = `Halo ${pic},\n\nPerkenalkan saya dari F1 Swimming. Khusus untuk ${company}, kami telah merancang simulasi eksklusif bagaimana brand Anda dapat mendominasi perhatian ribuan atlet dan orang tua di urat nadi kompetisi renang nasional.\n\nSilakan cek proposal interaktif berikut dari HP Anda:\n👉 ${link}\n\nJika berkenan, saya ingin mendiskusikan peluang kolaborasi ini lebih lanjut. Terima kasih!`;
        } else {
            msg = `Halo ${pic},\n\nPerkenalkan saya dari F1 Swimming. Untuk mendukung kemajuan event dari ${company}, kami ingin mendemonstrasikan bagaimana sistem Live Result Digital (SCS) dapat mendigitalisasi dan meningkatkan profesionalisme perlombaan Anda.\n\nSilakan cek simulasi sistem kami di sini:\n👉 ${link}\n\nMari berdiskusi untuk membawa event Anda ke level berikutnya. Terima kasih!`;
        }
        inputMessage.value = msg;
    });

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
                renderSimulation(selectedBrands);
            });
            containerBrands.appendChild(badge);
        });
    }

    function generateSlug() {
        const company = inputCompanyName.value.trim();
        if (company) {
            inputSlug.value = company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        }
    }
    inputCompanyName.addEventListener('input', generateSlug);

    btnAddBrand.addEventListener('click', () => {
        const id = selectSponsor.value;
        if (!id) return;
        const sp = allSponsors.find(s => String(s.id) === String(id));
        if (!sp || selectedBrands.some(b => b.id === sp.id)) return;

        selectedBrands.push(sp);
        selectSponsor.value = "";
        renderSelectedBrands();
        renderSimulation(selectedBrands); 
    });

    const btnGenerate = document.getElementById('btnGeneratePitch');
    btnGenerate.addEventListener('click', async () => {
        const type = document.querySelector('input[name="targetType"]:checked').value;
        const companyName = inputCompanyName.value.trim();
        if (!companyName) return alert("Nama Perusahaan / Klub wajib diisi!");
        if (type === 'brand' && selectedBrands.length === 0) return alert("Tambahkan minimal 1 brand!");
        
        const cpName = document.getElementById('inputCPName').value.trim();
        const cpWa = document.getElementById('inputCPWa').value.trim();
        const cpEmail = document.getElementById('inputCPEmail').value.trim();
        const slug = inputSlug.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
        const appMessage = inputMessage.value.trim();
        const logoFile = inputCorpLogo.files[0];

        if (!cpName || !slug) return alert("Nama PIC dan Slug wajib diisi!");

        btnGenerate.innerText = "Memproses & Menyimpan Draf... ⏳";
        btnGenerate.disabled = true;

        try {
            let uploadedLogoUrl = null;
            if (logoFile) {
                const fileExt = logoFile.name.split('.').pop();
                const fileName = `corp_${Date.now()}.${fileExt}`;
                const filePath = `corporate_logos/${fileName}`;
                await supabaseClient.storage.from('sponsor-ads').upload(filePath, logoFile);
                const { data: publicUrlData } = supabaseClient.storage.from('sponsor-ads').getPublicUrl(filePath);
                uploadedLogoUrl = publicUrlData.publicUrl;
            }

            const brandIds = type === 'brand' ? selectedBrands.map(b => b.id) : [];
            
            const { error: insertErr } = await supabaseClient.from('sponsor_pitches').insert([{
                target_type: type,
                company_name: companyName,
                brand_ids: brandIds,
                cp_name: cpName,
                cp_wa: cpWa,
                cp_email: cpEmail,
                pitch_slug: slug,
                corporate_logo: uploadedLogoUrl,
                approach_message: appMessage,
                created_by: session.user.id
            }]);

            if (insertErr) throw new Error(insertErr.code === '23505' ? "Slug URL sudah dipakai!" : insertErr.message);

            statusMsg.innerHTML = `<div class="bg-green-100 border border-green-300 text-green-800 p-3 rounded-lg text-sm text-center">✅ <strong>Link & Draf Berhasil Disimpan!</strong></div>`;
            statusMsg.classList.remove('hidden');
            actionButtons.classList.remove('hidden');

            document.getElementById('btnCopyTeks').onclick = () => {
                navigator.clipboard.writeText(appMessage);
                alert("Teks berhasil disalin ke clipboard!");
            };
            document.getElementById('btnKirimWa').onclick = () => {
                if (!cpWa) return alert("Nomor WA belum diisi!");
                window.open(`https://wa.me/${cpWa.replace(/^0/, '62')}?text=${encodeURIComponent(appMessage)}`, '_blank');
            };
            document.getElementById('btnKirimEmail').onclick = () => {
                if (!cpEmail) return alert("Email belum diisi!");
                window.open(`mailto:${cpEmail}?subject=Peluang Kolaborasi Digital & F1 Swimming&body=${encodeURIComponent(appMessage)}`, '_blank');
            };

        } catch (err) {
            statusMsg.innerHTML = `<div class="bg-red-100 border border-red-300 text-red-600 p-3 rounded-lg text-sm text-center">❌ ${err.message}</div>`;
            statusMsg.classList.remove('hidden');
        } finally {
            btnGenerate.innerText = "Generate Link & Simpan Draf";
            btnGenerate.disabled = false;
        }
    });
});

function renderSimulation(brandsArray) {
    const container = document.getElementById('simulationContainer');
    if (!container) return; 
    
    const type = document.querySelector('input[name="targetType"]:checked').value;
    const companyName = document.getElementById('inputCompanyName').value || 'Nama Klub/EO';

    if (type === 'club') {
        let html = '';
        const dummyEvents = ["Gaya Bebas 50m Putra", "Gaya Dada 50m Putri", "Gaya Punggung 100m Putra"];
        for (let i = 0; i < 3; i++) {
            html += `
            <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-3 opacity-80">
                <div class="pl-1 mb-2">
                    <h3 class="text-[10px] font-black text-slate-800 uppercase">Event #${i+1}: ${dummyEvents[i]}</h3>
                    <p class="text-[7px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">HEAT 1 | Dari 3</p>
                </div>
                <div class="bg-slate-50 rounded-lg p-1.5 border border-slate-100 text-center py-4">
                    <span class="text-[8px] font-bold text-slate-400">Data hasil dari event <br><strong class="text-slate-600">${companyName}</strong> akan tampil di sini secara real-time.</span>
                </div>
            </div>`;
        }
        container.innerHTML = html;
        return;
    }

    let html = '';
    const dummyEvents = [
        "Gaya Bebas 50m Putra", "Gaya Dada 50m Putri", "Gaya Punggung 100m Putra", 
        "Estafet 4x50m Bebas", "Gaya Kupu 50m Putra", "Gaya Bebas 100m Putri", 
        "Gaya Dada 100m Putra", "Gaya Punggung 50m Putri", "Gaya Kupu 100m Putri", "Estafet 4x100m Mix"
    ];

    if (!brandsArray || brandsArray.length === 0) {
        container.innerHTML = `<div class="text-center text-slate-400 font-bold text-xs mt-10 italic border-2 border-dashed border-slate-300 rounded-xl p-6">Tambahkan brand untuk melihat simulasi iklan.</div>`;
        return;
    }

    for (let i = 0; i < 10; i++) {
        let spIndex = i % brandsArray.length;
        let sponsor = brandsArray[spIndex];
        
        let sponsorHeader = `
        <a href="${sponsor.link_url || '#'}" target="_blank" class="flex items-center justify-between bg-amber-50 hover:bg-amber-100 transition-colors border-b border-amber-200 px-3 py-2 -mx-3 -mt-3 mb-2 rounded-t-xl group cursor-pointer">
            <div class="flex items-center gap-1.5 flex-1 min-w-0 pr-2">
                <span class="text-[7px] font-black text-amber-600 uppercase tracking-widest shrink-0">Supported By:</span>
                <span class="text-[9px] font-bold text-slate-800 truncate">${sponsor.sponsor_name}</span>
            </div>
            <div class="bg-white p-1 rounded border border-slate-200 shadow-sm shrink-0" style="aspect-ratio: 16/9; width: 45px;">
                <img src="${sponsor.logo_url}" class="w-full h-full object-contain" onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\\'text-[6px] font-bold text-slate-400\\'>SPONSOR</span>';">
            </div>
        </a>`;

        html += `
        <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-3 overflow-hidden relative border-amber-300 ring-1 ring-amber-100 transform hover:scale-[1.02] transition-transform">
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 z-10"></div>
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
                    <div class="w-5 flex justify-center shrink-0"><div class="w-3 h-3 rounded bg-slate-200 text-slate-600 text-[6px] font-black flex items-center justify-center">3</div></div>
                    <div class="flex-1 pl-1"><p class="text-[8px] font-black text-slate-800 uppercase truncate">Nama Atlit 1</p></div>
                    <div class="w-10 shrink-0 text-right pr-1"><span class="font-mono text-[8px] font-black text-slate-400">NT</span></div>
                </div>
                <div class="flex items-center py-1 border-b border-slate-100 px-1">
                    <div class="w-5 flex justify-center shrink-0"><div class="w-3 h-3 rounded bg-amber-200 text-amber-800 text-[6px] font-black flex items-center justify-center">4</div></div>
                    <div class="flex-1 pl-1"><p class="text-[8px] font-black text-slate-800 uppercase truncate">Nama Atlit 2</p></div>
                    <div class="w-10 shrink-0 text-right pr-1"><span class="font-mono text-[8px] font-black text-emerald-600">28.45</span></div>
                </div>
                <div class="flex items-center py-1 px-1">
                    <div class="w-5 flex justify-center shrink-0"><div class="w-3 h-3 rounded bg-slate-200 text-slate-600 text-[6px] font-black flex items-center justify-center">5</div></div>
                    <div class="flex-1 pl-1"><p class="text-[8px] font-black text-slate-800 uppercase truncate">Nama Atlit 3</p></div>
                    <div class="w-10 shrink-0 text-right pr-1"><span class="font-mono text-[8px] font-black text-slate-400">NT</span></div>
                </div>
            </div>
            
        </div>`;
    }
    container.innerHTML = html;
}
