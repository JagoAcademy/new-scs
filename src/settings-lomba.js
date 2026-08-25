import { supabaseClient } from './supabase.js';

let currentEventId = null;
let currentEventData = null;

// State Variabel untuk nampung data
window.configKU = [];
window.configGaya = [];
window.configEstafet = [];
window.tarifIndividu = [];
window.tautanEkstra = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Validasi Sesi & Ambil ID Event
    const { data: sessionData } = await supabaseClient.auth.getSession();
    if (!sessionData.session) {
        alert("Akses ditolak. Silakan login terlebih dahulu.");
        window.location.href = '/auth.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    currentEventId = urlParams.get('id');

    if (!currentEventId) {
        alert("Event tidak ditemukan!");
        window.location.href = '/dashboard.html';
        return;
    }

    // 2. Tarik Data Event
    try {
        const { data: eventData, error } = await supabaseClient
            .from('events')
            .select('*')
            .eq('id', currentEventId)
            .single();

        if (error) throw error;
        currentEventData = eventData;

        // 3. PROTEKSI BRANKAS EO (LOGIKA CO-ADMIN)
        const userId = sessionData.session.user.id;
        const { data: collabData } = await supabaseClient
            .from('event_collaborators')
            .select('*')
            .eq('event_id', currentEventId)
            .eq('user_id', userId)
            .single();

        // JIKA YANG LOGIN ADALAH TIM MILO / SPONSOR (CO-ADMIN)
        if (collabData && collabData.role === 'Co-Admin') {
            // Sembunyikan Info Pembayaran & QRIS
            document.getElementById('inputInfoPembayaran').parentElement.classList.add('hidden');
            document.getElementById('inputQris').parentElement.classList.add('hidden');
            
            // Nonaktifkan pengaturan Biaya & Tarif biar gak diubah sepihak
            document.getElementById('inputTarifTambahan').disabled = true;
            document.getElementById('inputBiayaEstafet').disabled = true;
            const btnTambahTarif = document.querySelector('button[onclick="window.tambahTarifIndividu()"]');
            if(btnTambahTarif) btnTambahTarif.classList.add('hidden');

            console.log("Co-Admin Mode Activated: Payment info hidden.");
        }

        // 4. Injeksi Data ke State
        window.configKU = eventData.config_ku || [];
        window.configGaya = eventData.config_gaya || [];
        window.configEstafet = eventData.config_estafet || [];
        
        const config = eventData.config || {};
        window.tarifIndividu = config.tarif_individu || [];
        window.tautanEkstra = config.tautan_ekstra || [];

        // 5. Injeksi Input HTML
        // Status Event (PERBAIKAN KOLOM IS_CLOSED)
        const toggleStatus = document.getElementById('toggleStatusEvent');
        const labelStatus = document.getElementById('labelStatusEvent');
        
        // Logika: Jika is_closed false/null, maka saklar DIBUKA (true)
        toggleStatus.checked = !eventData.is_closed; 
        
        labelStatus.innerText = toggleStatus.checked ? 'DIBUKA' : 'DITUTUP';
        labelStatus.className = toggleStatus.checked 
            ? 'text-xs font-black text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-md uppercase tracking-widest'
            : 'text-xs font-black text-red-600 bg-red-100 px-2.5 py-1 rounded-md uppercase tracking-widest';

        toggleStatus.addEventListener('change', (e) => {
            labelStatus.innerText = e.target.checked ? 'DIBUKA' : 'DITUTUP';
            labelStatus.className = e.target.checked 
                ? 'text-xs font-black text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-md uppercase tracking-widest'
                : 'text-xs font-black text-red-600 bg-red-100 px-2.5 py-1 rounded-md uppercase tracking-widest';
        });

        // Basic Config
        document.getElementById('inputTarifTambahan').value = config.biaya_normal || '';
        document.getElementById('inputBiayaEstafet').value = config.biaya_estafet !== undefined ? config.biaya_estafet : '';
        document.getElementById('inputNamaKolam').value = config.nama_kolam || '';
        document.getElementById('inputAdminWA1').value = config.admin_wa_1 || '';
        document.getElementById('inputAdminWA2').value = config.admin_wa_2 || '';
        document.getElementById('inputInfoPembayaran').value = config.info_pembayaran || '';

        // Previews
        if (config.header_url) {
            document.getElementById('previewHeader').src = config.header_url;
            document.getElementById('previewHeader').classList.remove('hidden');
        }
        if (config.bg_url) {
            document.getElementById('previewBg').src = config.bg_url;
            document.getElementById('previewBg').classList.remove('hidden');
        }
        if (config.qris_url) {
            document.getElementById('previewQris').src = config.qris_url;
            document.getElementById('previewQris').classList.remove('hidden');
        }

        // Render UIs
        window.renderKU();
        window.renderGaya();
        window.renderEstafet();
        window.renderTarifIndividu();
        window.renderTautanEkstra();

    } catch (err) {
        alert("Gagal memuat pengaturan: " + err.message);
    }
});

// ========================================================
// RENDER & MANAJEMEN TARIF BERJENJANG
// ========================================================
window.renderTarifIndividu = () => {
    const container = document.getElementById('containerTarifIndividu');
    container.innerHTML = '';
    window.tarifIndividu.forEach((t, i) => {
        container.innerHTML += `
            <div class="flex items-center gap-2 mb-2">
                <input type="number" id="tarif_qty_${i}" value="${t.qty}" class="w-16 p-2 border border-slate-300 rounded-lg text-sm text-center font-bold text-blue-900 outline-none focus:ring-2 ring-blue-500" placeholder="Jml">
                <span class="text-[10px] text-blue-800 font-bold uppercase shrink-0">Nomor = Rp</span>
                <input type="number" id="tarif_price_${i}" value="${t.price}" class="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 outline-none focus:ring-2 ring-blue-500" placeholder="Harga Total">
                <button onclick="window.hapusTarifIndividu(${i})" class="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 font-bold shadow-sm shrink-0">X</button>
            </div>
        `;
    });
};

window.tambahTarifIndividu = () => {
    window.tarifIndividu.forEach((t, i) => {
        if(document.getElementById(`tarif_qty_${i}`)) {
            t.qty = document.getElementById(`tarif_qty_${i}`).value;
            t.price = document.getElementById(`tarif_price_${i}`).value;
        }
    });
    window.tarifIndividu.push({qty: '', price: ''});
    window.renderTarifIndividu();
};

window.hapusTarifIndividu = (index) => {
    window.tarifIndividu.forEach((t, i) => {
        if(document.getElementById(`tarif_qty_${i}`)) {
            t.qty = document.getElementById(`tarif_qty_${i}`).value;
            t.price = document.getElementById(`tarif_price_${i}`).value;
        }
    });
    window.tarifIndividu.splice(index, 1);
    window.renderTarifIndividu();
};

// ========================================================
// RENDER & MANAJEMEN TAUTAN EKSTRA (JUKNIS/WA)
// ========================================================
window.renderTautanEkstra = () => {
    const container = document.getElementById('containerTautanEkstra');
    container.innerHTML = '';
    window.tautanEkstra.forEach((t, i) => {
        container.innerHTML += `
            <div class="flex items-center gap-2">
                <input type="text" id="tautan_title_${i}" value="${t.title}" class="w-1/3 p-2 border border-slate-300 rounded-lg text-xs font-bold text-indigo-900 outline-none focus:ring-2 ring-indigo-500" placeholder="Judul (Juknis)">
                <input type="text" id="tautan_url_${i}" value="${t.url}" class="w-full p-2 border border-slate-300 rounded-lg text-xs text-slate-600 outline-none focus:ring-2 ring-indigo-500" placeholder="URL (https://...)">
                <button onclick="window.hapusTautan(${i})" class="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 font-bold shadow-sm shrink-0">X</button>
            </div>
        `;
    });
};

window.tambahTautan = () => {
    window.tautanEkstra.forEach((t, i) => {
        if(document.getElementById(`tautan_title_${i}`)) {
            t.title = document.getElementById(`tautan_title_${i}`).value;
            t.url = document.getElementById(`tautan_url_${i}`).value;
        }
    });
    window.tautanEkstra.push({title: '', url: ''});
    window.renderTautanEkstra();
};

window.hapusTautan = (index) => {
    window.tautanEkstra.forEach((t, i) => {
        if(document.getElementById(`tautan_title_${i}`)) {
            t.title = document.getElementById(`tautan_title_${i}`).value;
            t.url = document.getElementById(`tautan_url_${i}`).value;
        }
    });
    window.tautanEkstra.splice(index, 1);
    window.renderTautanEkstra();
};

// ========================================================
// IMAGE UPLOAD PREVIEW LOGIC
// ========================================================
['inputHeader', 'inputBg', 'inputQris'].forEach(id => {
    const el = document.getElementById(id);
    if(el) {
        el.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const previewId = 'preview' + id.replace('input', '');
                    const img = document.getElementById(previewId);
                    img.src = e.target.result;
                    img.classList.remove('hidden');
                }
                reader.readAsDataURL(file);
            }
        });
    }
});

// ========================================================
// KELOMPOK UMUR (KU) LOGIC
// ========================================================
window.renderKU = () => {
    const container = document.getElementById('kuContainer');
    container.innerHTML = '';
    window.configKU.sort((a,b) => b.tahunAkhir - a.tahunAkhir).forEach(ku => {
        container.innerHTML += `
            <div class="p-3 border border-slate-200 rounded-xl flex justify-between items-center bg-slate-50 hover:border-blue-300 transition-colors">
                <div>
                    <h3 class="text-sm font-extrabold text-blue-900">${ku.nama}</h3>
                    <p class="text-[10px] text-slate-500 font-medium">${ku.tahunMulai} - ${ku.tahunAkhir}</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="window.openModalKU('${ku.id}')" class="text-blue-500 hover:text-blue-700 bg-white shadow-sm border border-slate-100 p-1.5 rounded-md text-xs">✏️</button>
                    <button onclick="window.deleteKU('${ku.id}')" class="text-red-500 hover:text-red-700 bg-white shadow-sm border border-slate-100 p-1.5 rounded-md text-xs">🗑️</button>
                </div>
            </div>
        `;
    });
};

window.openModalKU = (id = null) => {
    if (id) {
        const ku = window.configKU.find(k => k.id === id);
        document.getElementById('kuId').value = ku.id;
        document.getElementById('kuNama').value = ku.nama;
        document.getElementById('kuTahunMulai').value = ku.tahunMulai;
        document.getElementById('kuTahunAkhir').value = ku.tahunAkhir;
        document.getElementById('modalKUTitle').innerText = "Edit KU";
    } else {
        document.getElementById('kuId').value = '';
        document.getElementById('kuNama').value = '';
        document.getElementById('kuTahunMulai').value = '';
        document.getElementById('kuTahunAkhir').value = '';
        document.getElementById('modalKUTitle').innerText = "Buat KU Baru";
    }
    document.getElementById('modalKU').classList.remove('hidden');
    document.getElementById('modalKU').classList.add('flex');
};

window.saveKU = () => {
    const id = document.getElementById('kuId').value || Date.now().toString();
    const nama = document.getElementById('kuNama').value.trim();
    const tahunMulai = document.getElementById('kuTahunMulai').value;
    const tahunAkhir = document.getElementById('kuTahunAkhir').value;

    if(!nama || !tahunMulai || !tahunAkhir) return alert("Semua kolom KU wajib diisi!");

    const existingIndex = window.configKU.findIndex(k => k.id === id);
    const newData = { id, nama, tahunMulai: Number(tahunMulai), tahunAkhir: Number(tahunAkhir) };

    if (existingIndex > -1) window.configKU[existingIndex] = newData;
    else window.configKU.push(newData);

    window.closeModal('modalKU');
    window.renderKU();
};

window.deleteKU = (id) => {
    if(!confirm("Yakin hapus KU ini?")) return;
    window.configKU = window.configKU.filter(k => k.id !== id);
    window.renderKU();
};

// ========================================================
// GAYA & JARAK (INDIVIDU) LOGIC
// ========================================================
window.renderGaya = () => {
    const container = document.getElementById('gayaContainer');
    container.innerHTML = '';
    window.configGaya.forEach(gaya => {
        let jarakHtml = '';
        (gaya.jarak || []).forEach(jrk => {
            const bgBadge = jrk.aktif ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-400 border-slate-200 line-through';
            jarakHtml += `
                <div class="flex items-center gap-1.5 ${bgBadge} px-2 py-1 rounded-md border text-[10px] font-bold cursor-pointer group" onclick="window.toggleJarak('${gaya.id}', '${jrk.id}')">
                    <span>${jrk.nama}</span>
                    <button onclick="event.stopPropagation(); window.deleteJarak('${gaya.id}', '${jrk.id}')" class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 ml-1">×</button>
                </div>
            `;
        });

        container.innerHTML += `
            <div class="p-4 border border-slate-200 rounded-xl mb-3 bg-slate-50">
                <div class="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                    <h3 class="text-sm font-black text-slate-800">${gaya.nama}</h3>
                    <div class="flex gap-2">
                        <button onclick="window.openModalJarak('${gaya.id}')" class="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded font-bold shadow-sm">+ Jarak</button>
                        <button onclick="window.openModalGaya('${gaya.id}')" class="text-xs bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 px-2 py-1 rounded shadow-sm">✏️</button>
                        <button onclick="window.deleteGaya('${gaya.id}')" class="text-xs bg-white border border-slate-200 hover:bg-red-50 text-red-500 px-2 py-1 rounded shadow-sm">🗑️</button>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2">
                    ${jarakHtml || '<span class="text-[10px] text-slate-400 italic">Belum ada jarak ditambahkan.</span>'}
                </div>
            </div>
        `;
    });
};

window.openModalGaya = (id = null) => {
    if (id) {
        const gaya = window.configGaya.find(g => g.id === id);
        document.getElementById('gayaId').value = gaya.id;
        document.getElementById('gayaNama').value = gaya.nama;
        document.getElementById('modalGayaTitle').innerText = "Edit Kategori Gaya";
    } else {
        document.getElementById('gayaId').value = '';
        document.getElementById('gayaNama').value = '';
        document.getElementById('modalGayaTitle').innerText = "Kategori Gaya Baru";
    }
    document.getElementById('modalGaya').classList.remove('hidden');
    document.getElementById('modalGaya').classList.add('flex');
};

window.saveGaya = () => {
    const id = document.getElementById('gayaId').value || Date.now().toString();
    const nama = document.getElementById('gayaNama').value.trim();
    if(!nama) return alert("Nama gaya wajib diisi!");

    const existingIndex = window.configGaya.findIndex(g => g.id === id);
    if (existingIndex > -1) {
        window.configGaya[existingIndex].nama = nama;
    } else {
        window.configGaya.push({ id, nama, jarak: [] });
    }

    window.closeModal('modalGaya');
    window.renderGaya();
};

window.deleteGaya = (id) => {
    if(!confirm("Yakin hapus kategori gaya ini beserta semua jaraknya?")) return;
    window.configGaya = window.configGaya.filter(g => g.id !== id);
    window.renderGaya();
};

window.openModalJarak = (gayaId) => {
    document.getElementById('jarakParentId').value = gayaId;
    document.getElementById('jarakId').value = '';
    document.getElementById('jarakNama').value = '';
    document.getElementById('modalJarak').classList.remove('hidden');
    document.getElementById('modalJarak').classList.add('flex');
};

window.saveJarak = () => {
    const gayaId = document.getElementById('jarakParentId').value;
    const jarakId = Date.now().toString();
    const nama = document.getElementById('jarakNama').value.trim();
    
    if(!nama) return alert("Jarak wajib diisi!");

    const gaya = window.configGaya.find(g => g.id === gayaId);
    if(gaya) {
        gaya.jarak.push({ id: jarakId, nama: nama, aktif: true });
        window.renderGaya();
    }
    window.closeModal('modalJarak');
};

window.deleteJarak = (gayaId, jarakId) => {
    if(!confirm("Hapus jarak ini?")) return;
    const gaya = window.configGaya.find(g => g.id === gayaId);
    if(gaya) {
        gaya.jarak = gaya.jarak.filter(j => j.id !== jarakId);
        window.renderGaya();
    }
};

window.toggleJarak = (gayaId, jarakId) => {
    const gaya = window.configGaya.find(g => g.id === gayaId);
    if(gaya) {
        const jrk = gaya.jarak.find(j => j.id === jarakId);
        if(jrk) {
            jrk.aktif = !jrk.aktif;
            window.renderGaya();
        }
    }
};

// ========================================================
// ESTAFET LOGIC
// ========================================================
window.renderEstafet = () => {
    const container = document.getElementById('estafetContainer');
    container.innerHTML = '';
    window.configEstafet.forEach(estafet => {
        let itemsHtml = '';
        (estafet.items || []).forEach(item => {
            let bgBadge = 'bg-purple-100 text-purple-700 border-purple-200';
            if(item.jenis === 'Putra') bgBadge = 'bg-blue-100 text-blue-700 border-blue-200';
            if(item.jenis === 'Putri') bgBadge = 'bg-pink-100 text-pink-700 border-pink-200';

            itemsHtml += `
                <div class="flex items-center gap-1.5 ${bgBadge} px-2 py-1 rounded-md border text-[10px] font-bold group">
                    <span>${item.jarak} (${item.jenis})</span>
                    <button onclick="window.deleteItemEstafet('${estafet.id}', '${item.id}')" class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 ml-1">×</button>
                </div>
            `;
        });

        container.innerHTML += `
            <div class="p-4 border border-purple-100 rounded-xl mb-3 bg-purple-50/50">
                <div class="flex justify-between items-center mb-3 border-b border-purple-100 pb-2">
                    <h3 class="text-sm font-black text-purple-900">${estafet.nama}</h3>
                    <div class="flex gap-2">
                        <button onclick="window.openModalItemEstafet('${estafet.id}')" class="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded font-bold shadow-sm">+ Tambah</button>
                        <button onclick="window.openModalEstafet('${estafet.id}')" class="text-xs bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 px-2 py-1 rounded shadow-sm">✏️</button>
                        <button onclick="window.deleteEstafet('${estafet.id}')" class="text-xs bg-white border border-slate-200 hover:bg-red-50 text-red-500 px-2 py-1 rounded shadow-sm">🗑️</button>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2">
                    ${itemsHtml || '<span class="text-[10px] text-slate-400 italic">Belum ada regu estafet ditambahkan.</span>'}
                </div>
            </div>
        `;
    });
};

window.openModalEstafet = (id = null) => {
    if (id) {
        const estafet = window.configEstafet.find(e => e.id === id);
        document.getElementById('estafetId').value = estafet.id;
        document.getElementById('estafetNama').value = estafet.nama;
    } else {
        document.getElementById('estafetId').value = '';
        document.getElementById('estafetNama').value = '';
    }
    document.getElementById('modalEstafet').classList.remove('hidden');
    document.getElementById('modalEstafet').classList.add('flex');
};

window.saveEstafet = () => {
    const id = document.getElementById('estafetId').value || Date.now().toString();
    const nama = document.getElementById('estafetNama').value.trim();
    if(!nama) return alert("Nama kategori estafet wajib diisi!");

    const existingIndex = window.configEstafet.findIndex(e => e.id === id);
    if (existingIndex > -1) {
        window.configEstafet[existingIndex].nama = nama;
    } else {
        window.configEstafet.push({ id, nama, items: [] });
    }

    window.closeModal('modalEstafet');
    window.renderEstafet();
};

window.deleteEstafet = (id) => {
    if(!confirm("Yakin hapus kategori estafet ini?")) return;
    window.configEstafet = window.configEstafet.filter(e => e.id !== id);
    window.renderEstafet();
};

window.openModalItemEstafet = (estafetId) => {
    document.getElementById('itemEstafetParentId').value = estafetId;
    document.getElementById('itemEstafetJarak').value = '';
    document.getElementById('modalItemEstafet').classList.remove('hidden');
    document.getElementById('modalItemEstafet').classList.add('flex');
};

window.saveItemEstafet = () => {
    const estafetId = document.getElementById('itemEstafetParentId').value;
    const itemId = Date.now().toString();
    const jarak = document.getElementById('itemEstafetJarak').value.trim();
    const jenis = document.getElementById('itemEstafetJenis').value;
    
    if(!jarak) return alert("Jarak estafet wajib diisi!");

    const estafet = window.configEstafet.find(e => e.id === estafetId);
    if(estafet) {
        estafet.items.push({ id: itemId, jarak: jarak, jenis: jenis });
        window.renderEstafet();
    }
    window.closeModal('modalItemEstafet');
};

window.deleteItemEstafet = (estafetId, itemId) => {
    if(!confirm("Hapus regu estafet ini?")) return;
    const estafet = window.configEstafet.find(e => e.id === estafetId);
    if(estafet) {
        estafet.items = estafet.items.filter(i => i.id !== itemId);
        window.renderEstafet();
    }
};

// ========================================================
// GLOBAL MODAL CLOSER
// ========================================================
window.closeModal = (modalId) => {
    const el = document.getElementById(modalId);
    el.firstElementChild.classList.remove('modal-enter');
    el.classList.add('hidden');
    el.classList.remove('flex');
};

// ========================================================
// MASTER SAVE KE DATABASE
// ========================================================
window.simpanKeDatabase = async () => {
    const btn = document.querySelector('button[onclick="window.simpanKeDatabase()"]');
    btn.innerHTML = 'Menyimpan... ⏳';
    btn.disabled = true;

    try {
        // Sinkronisasi input dinamis yg mungkin belum disave via tombol +
        window.tarifIndividu.forEach((t, i) => {
            if(document.getElementById(`tarif_qty_${i}`)) {
                t.qty = document.getElementById(`tarif_qty_${i}`).value;
                t.price = document.getElementById(`tarif_price_${i}`).value;
            }
        });
        window.tautanEkstra.forEach((t, i) => {
            if(document.getElementById(`tautan_title_${i}`)) {
                t.title = document.getElementById(`tautan_title_${i}`).value;
                t.url = document.getElementById(`tautan_url_${i}`).value;
            }
        });

        // Ambil File Upload
        const fileHeader = document.getElementById('inputHeader').files[0];
        const fileBg = document.getElementById('inputBg').files[0];
        const fileQris = document.getElementById('inputQris').files[0];

        let finalHeaderUrl = currentEventData.config?.header_url || null;
        let finalBgUrl = currentEventData.config?.bg_url || null;
        let finalQrisUrl = currentEventData.config?.qris_url || null;

        // FUNGSI HELPER UPLOAD SUPABASE
        const uploadFile = async (file, prefix) => {
            const ext = file.name.split('.').pop();
            const fileName = `${prefix}_${currentEventId}_${Date.now()}.${ext}`;
            const { error } = await supabaseClient.storage.from('event-assets').upload(fileName, file);
            if (error) throw error;
            const { data } = supabaseClient.storage.from('event-assets').getPublicUrl(fileName);
            return data.publicUrl;
        };

        if (fileHeader) finalHeaderUrl = await uploadFile(fileHeader, 'header');
        if (fileBg) finalBgUrl = await uploadFile(fileBg, 'bg');
        if (fileQris) finalQrisUrl = await uploadFile(fileQris, 'qris');

        // Rakit Data Config
        const newConfig = {
            ...currentEventData.config,
            biaya_normal: document.getElementById('inputTarifTambahan').value, 
            biaya_estafet: document.getElementById('inputBiayaEstafet').value,
            nama_kolam: document.getElementById('inputNamaKolam').value,
            admin_wa_1: document.getElementById('inputAdminWA1').value,
            admin_wa_2: document.getElementById('inputAdminWA2').value,
            info_pembayaran: document.getElementById('inputInfoPembayaran').value,
            header_url: finalHeaderUrl,
            bg_url: finalBgUrl,
            qris_url: finalQrisUrl,
            tarif_individu: window.tarifIndividu,
            tautan_ekstra: window.tautanEkstra
        };

        // BACA SAKLAR: Kalo true (DIBUKA), berarti is_closed = false
        const isRegistrationOpen = document.getElementById('toggleStatusEvent').checked;
        const isClosedStatus = !isRegistrationOpen;

        // Tembak Database
        const { error } = await supabaseClient
            .from('events')
            .update({
                config_ku: window.configKU,
                config_gaya: window.configGaya,
                config_estafet: window.configEstafet,
                config: newConfig,
                is_closed: isClosedStatus
            })
            .eq('id', currentEventId);

        if (error) throw error;

        alert("✅ Konfigurasi Lomba & Informasi Pendaftaran berhasil disimpan!");
        window.location.reload();

    } catch (err) {
        alert("Gagal menyimpan data: " + err.message);
    } finally {
        btn.innerHTML = 'Simpan Pengaturan';
        btn.disabled = false;
    }
};
