import { supabaseClient } from '../src/supabase.js';

let currentEventId = null;
let uploadedImage = null;
let currentMode = 'peserta';
let customFields = [];
let mvsAthletes = [];

const DUMMY_BY_MODE = {
    peserta: {
        nama: "Nama Lengkap Peserta"
    },
    juara: {
        nama: "Nama Lengkap Peserta",
        predikat: "JUARA 1",
        nomor: "50 M Gaya Bebas",
        ku: "KU C Putra • 00:32.45"
    },
    juara_seri: {
        nama: "Nama Lengkap Peserta",
        predikat: "JUARA 1 SERI/HEAT 2",
        nomor: "50 M Gaya Bebas",
        ku: "KU C Putra • 00:34.12"
    },
    mvs: {
        nama: "Nama Lengkap Peserta",
        predikat: "MOST VALUABLE SWIMMER (MVS)",
        nomor: "KU C Putra • Tirta Nirwana",
        ku: "3 Emas, 1 Perak (18 Poin)"
    }
};

function computeDeterministicCode(seedStr) {
    let hash = 2166136261;
    for (let i = 0; i < seedStr.length; i++) {
        hash ^= seedStr.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    const num = (hash >>> 0) % 9000 + 1000;
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const c1 = chars[(hash >>> 4) % chars.length];
    const c2 = chars[(hash >>> 12) % chars.length];
    return `${num}-${c1}${c2}`;
}

function renderCustomFieldValue(field, seedContext = 'PREVIEW-001', seqIndex = 1) {
    const tpl = (field.template || '').trim();
    const yearStr = String(new Date().getFullYear());
    const seqStr = String(seqIndex).padStart(3, '0');
    const randStr = computeDeterministicCode(`${currentEventId}|${currentMode}|${seedContext}|${field.id}`);

    if (field.mode === 'static_text') {
        return tpl || field.label || '';
    }
    const baseTpl = tpl || (field.mode === 'auto_number' ? 'NO. {SEQ}/SCS/{YEAR}' : 'NO. {RAND}/SCS/{YEAR}');
    return baseTpl
        .replace(/\{RAND\}/gi, randStr)
        .replace(/\{ACAK\}/gi, randStr)
        .replace(/\{SEQ\}/gi, seqStr)
        .replace(/\{YEAR\}/gi, yearStr);
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentEventId = urlParams.get('id');

    if (!currentEventId) {
        alert("ID Event tidak ditemukan!");
        window.history.back();
        return;
    }

    const { data: evData } = await supabaseClient.from('events').select('event_name').eq('id', currentEventId).single();
    if (evData) {
        document.getElementById('eventName').innerText = evData.event_name;
    }

    const baseUrl = window.location.origin;
    document.getElementById('linkPeserta').value = `${baseUrl}/cetak-sertifikat.html?id=${currentEventId}`;
    document.getElementById('linkJuara').value = `${baseUrl}/cetak-sertifikat.html?id=${currentEventId}&tab=juara`;

    // Cek apakah event sebelumnya sudah punya customFields di salah satu tipe sertifikat
    const { data: allCertRows } = await supabaseClient
        .from('event_certificates')
        .select('tipe, config_json')
        .eq('event_id', currentEventId);

    if (Array.isArray(allCertRows)) {
        const withCustom = allCertRows.find(r => Array.isArray(r.config_json?.customFields) && r.config_json.customFields.length > 0);
        if (withCustom) {
            customFields = JSON.parse(JSON.stringify(withCustom.config_json.customFields));
        }
        const mvsRow = allCertRows.find(r => r.tipe === 'mvs' && Array.isArray(r.config_json?.mvsAthletes));
        if (mvsRow) {
            mvsAthletes = mvsRow.config_json.mvsAthletes;
        }
    }

    const tabs = {
        peserta: document.getElementById('tabPeserta'),
        juara: document.getElementById('tabJuara'),
        juara_seri: document.getElementById('tabJuaraSeri'),
        mvs: document.getElementById('tabMvs')
    };

    const winnerFieldsBox = document.getElementById('winnerFieldsBox');
    const panelMvsConfig = document.getElementById('panelMvsConfig');

    function setActiveTab(mode) {
        currentMode = mode;
        Object.entries(tabs).forEach(([key, btn]) => {
            if (!btn) return;
            if (key === mode) {
                btn.className = "px-5 py-2.5 rounded-full font-bold text-xs md:text-sm bg-blue-900 text-white shadow transition-all shrink-0";
            } else {
                btn.className = "px-5 py-2.5 rounded-full font-bold text-xs md:text-sm bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shrink-0";
            }
        });

        if (mode === 'peserta') {
            winnerFieldsBox.classList.add('hidden');
        } else {
            winnerFieldsBox.classList.remove('hidden');
            const lbl2 = document.getElementById('lblField2Title');
            const lbl3 = document.getElementById('lblField3Title');
            const lbl4 = document.getElementById('lblField4Title');
            if (mode === 'juara') {
                if (lbl2) lbl2.innerText = '🥇 2. KOORDINAT JUARA';
                if (lbl3) lbl3.innerText = '🏊 3. KOORDINAT NOMOR LOMBA';
                if (lbl4) lbl4.innerText = '⏱️ 4. KOORDINAT WAKTU / KU';
            } else if (mode === 'juara_seri') {
                if (lbl2) lbl2.innerText = '⚡ 2. KOORDINAT JUARA SERI/HEAT';
                if (lbl3) lbl3.innerText = '🏊 3. KOORDINAT NOMOR LOMBA';
                if (lbl4) lbl4.innerText = '⏱️ 4. KOORDINAT WAKTU / KU';
            } else if (mode === 'mvs') {
                if (lbl2) lbl2.innerText = '👑 2. KOORDINAT PREDIKAT MVS';
                if (lbl3) lbl3.innerText = '🏊 3. KOORDINAT KATEGORI KU / KLUB';
                if (lbl4) lbl4.innerText = '🏅 4. KOORDINAT PEROLEHAN MEDALI / POIN';
            }
        }

        if (panelMvsConfig) {
            if (mode === 'mvs') {
                panelMvsConfig.classList.remove('hidden');
                renderMvsList();
            } else {
                panelMvsConfig.classList.add('hidden');
            }
        }

        renderCustomFieldsUI();
        drawPreview();
    }

    tabs.peserta.onclick = () => setActiveTab('peserta');
    tabs.juara.onclick = () => setActiveTab('juara');
    tabs.juara_seri.onclick = () => setActiveTab('juara_seri');
    tabs.mvs.onclick = () => setActiveTab('mvs');

    // ==========================================
    // CUSTOM FIELDS BUILDER (NOMOR SERTIFIKAT DLL)
    // ==========================================
    function renderCustomFieldsUI() {
        const container = document.getElementById('customFieldsContainer');
        if (!container) return;

        if (customFields.length === 0) {
            container.innerHTML = `<p class="text-[11px] text-amber-700/80 italic text-center py-2">Belum ada field tambahan. Klik "+ Tambah Field" untuk menambahkan Nomor Sertifikat.</p>`;
            return;
        }

        const defaultCenterX = uploadedImage ? Math.round(uploadedImage.width / 2) : 1000;
        container.innerHTML = customFields.map((cf, idx) => `
            <div class="bg-white p-3 rounded-xl border border-amber-200 shadow-sm space-y-2" data-cf-idx="${idx}">
                <div class="flex items-center justify-between gap-2">
                    <input type="text" data-cf-prop="label" data-idx="${idx}" value="${cf.label || 'Nomor Sertifikat'}" class="text-xs font-black text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-1 flex-1 outline-none" placeholder="Label Field">
                    <button type="button" data-cf-remove="${idx}" class="text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded">Hapus</button>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <span class="text-[9px] font-bold text-slate-500 block">Tipe Nilai</span>
                        <select data-cf-prop="mode" data-idx="${idx}" class="w-full px-2 py-1.5 text-xs font-bold border border-slate-300 rounded bg-white outline-none">
                            <option value="random_code" ${cf.mode === 'random_code' ? 'selected' : ''}>Nomor Acak Unik ({RAND})</option>
                            <option value="auto_number" ${cf.mode === 'auto_number' ? 'selected' : ''}>Nomor Urut ({SEQ})</option>
                            <option value="static_text" ${cf.mode === 'static_text' ? 'selected' : ''}>Teks Statis</option>
                        </select>
                    </div>
                    <div>
                        <span class="text-[9px] font-bold text-slate-500 block">Format / Isi Teks</span>
                        <input type="text" data-cf-prop="template" data-idx="${idx}" value="${cf.template || 'NO. {RAND}/SCS/{YEAR}'}" class="w-full px-2 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded outline-none" placeholder="NO. {RAND}/SCS/{YEAR}">
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-2">
                    <div>
                        <span class="text-[9px] font-bold text-slate-500">Kiri-Kanan (X)</span>
                        <input type="number" data-cf-prop="x" data-idx="${idx}" value="${cf.x ?? defaultCenterX}" class="w-full px-2 py-1 text-xs border border-slate-300 rounded">
                    </div>
                    <div>
                        <span class="text-[9px] font-bold text-slate-500">Atas-Bawah (Y)</span>
                        <input type="number" data-cf-prop="y" data-idx="${idx}" value="${cf.y ?? 280}" class="w-full px-2 py-1 text-xs border border-slate-300 rounded">
                    </div>
                    <div>
                        <span class="text-[9px] font-bold text-slate-500">Ukuran (px)</span>
                        <input type="number" data-cf-prop="size" data-idx="${idx}" value="${cf.size ?? 28}" class="w-full px-2 py-1 text-xs border border-slate-300 rounded">
                    </div>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('[data-cf-prop]').forEach(el => {
            const evName = el.tagName === 'SELECT' ? 'change' : 'input';
            el.addEventListener(evName, (e) => {
                const i = Number(e.target.getAttribute('data-idx'));
                const prop = e.target.getAttribute('data-cf-prop');
                if (!customFields[i]) return;
                if (prop === 'x' || prop === 'y' || prop === 'size') {
                    customFields[i][prop] = Number(e.target.value) || 0;
                } else {
                    customFields[i][prop] = e.target.value;
                }
                drawPreview();
            });
        });

        container.querySelectorAll('[data-cf-remove]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const i = Number(e.target.getAttribute('data-cf-remove'));
                customFields.splice(i, 1);
                renderCustomFieldsUI();
                drawPreview();
            });
        });
    }

    const btnAddCustomField = document.getElementById('btnAddCustomField');
    if (btnAddCustomField) {
        btnAddCustomField.addEventListener('click', () => {
            const centerX = uploadedImage ? Math.round(uploadedImage.width / 2) : 1000;
            const nextY = 280 + (customFields.length * 45);
            customFields.push({
                id: 'cf_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
                label: customFields.length === 0 ? 'Nomor Sertifikat' : `Field Tambahan ${customFields.length + 1}`,
                mode: 'random_code',
                template: 'NO. {RAND}/SCS/{YEAR}',
                x: centerX,
                y: nextY,
                size: 28
            });
            renderCustomFieldsUI();
            drawPreview();
        });
    }

    renderCustomFieldsUI();

    // ==========================================
    // MVS MANAGER (OTOMATIS DARI KLASEMEN & MANUAL)
    // ==========================================
    function renderMvsList() {
        const listDiv = document.getElementById('mvsListPreview');
        if (!listDiv) return;
        if (mvsAthletes.length === 0) {
            listDiv.innerHTML = `<p class="text-[11px] text-purple-600 italic">Belum ada data MVS ditetapkan.</p>`;
            return;
        }
        listDiv.innerHTML = mvsAthletes.map((m, idx) => `
            <div class="bg-white border border-purple-200 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs shadow-sm">
                <span class="font-black text-purple-900">${m.nama}</span>
                <span class="text-[10px] text-slate-500 font-bold">(${m.kategori || 'MVS'} • ${m.poin || '-'})</span>
                <button type="button" data-mvs-del="${idx}" class="text-red-500 hover:text-red-700 font-black ml-1">&times;</button>
            </div>
        `).join('');

        listDiv.querySelectorAll('[data-mvs-del]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const i = Number(e.target.getAttribute('data-mvs-del'));
                mvsAthletes.splice(i, 1);
                renderMvsList();
            });
        });
    }

    const btnAddMvsManual = document.getElementById('btnAddMvsManual');
    if (btnAddMvsManual) {
        btnAddMvsManual.addEventListener('click', () => {
            const nama = document.getElementById('mvsInputNama').value.trim();
            const kategori = document.getElementById('mvsInputKategori').value.trim() || 'Best Swimmer';
            const poin = document.getElementById('mvsInputPoin').value.trim() || 'Most Valuable Swimmer';
            if (!nama) return alert('Isi Nama Atlet atau F1 ID terlebih dahulu.');
            mvsAthletes.push({ nama, kategori, poin });
            document.getElementById('mvsInputNama').value = '';
            document.getElementById('mvsInputKategori').value = '';
            document.getElementById('mvsInputPoin').value = '';
            renderMvsList();
        });
    }

    const btnAutoCalcMvs = document.getElementById('btnAutoCalcMvs');
    if (btnAutoCalcMvs) {
        btnAutoCalcMvs.addEventListener('click', async () => {
            btnAutoCalcMvs.innerText = '⏳ Menghitung...';
            btnAutoCalcMvs.disabled = true;
            try {
                const { data: lbData, error } = await supabaseClient
                    .from('event_leaderboard')
                    .select('*')
                    .eq('event_id', currentEventId)
                    .lte('peringkat', 3);

                if (error) throw error;
                if (!lbData || lbData.length === 0) {
                    alert('Belum ada data juara (peringkat 1-3) di klasemen lomba ini.');
                    return;
                }

                // Kelompokkan per Kelompok Umur + Gender
                const groupMap = {};
                lbData.forEach(row => {
                    const ku = (row.kelompok_umur || 'Umum').trim();
                    const gender = (row.gender || '').trim();
                    const groupKey = `${ku} ${gender}`.trim();
                    if (!groupMap[groupKey]) groupMap[groupKey] = {};

                    const athleteKey = (row.nama_peserta || '').trim().toUpperCase();
                    if (!athleteKey) return;

                    if (!groupMap[groupKey][athleteKey]) {
                        groupMap[groupKey][athleteKey] = {
                            nama: row.nama_peserta.trim(),
                            klub: row.klub_asal || '',
                            gold: 0,
                            silver: 0,
                            bronze: 0,
                            points: 0
                        };
                    }

                    if (Number(row.peringkat) === 1) {
                        groupMap[groupKey][athleteKey].gold++;
                        groupMap[groupKey][athleteKey].points += 5;
                    } else if (Number(row.peringkat) === 2) {
                        groupMap[groupKey][athleteKey].silver++;
                        groupMap[groupKey][athleteKey].points += 3;
                    } else if (Number(row.peringkat) === 3) {
                        groupMap[groupKey][athleteKey].bronze++;
                        groupMap[groupKey][athleteKey].points += 1;
                    }
                });

                const computedMvs = [];
                Object.entries(groupMap).forEach(([groupKey, athletesObj]) => {
                    const sorted = Object.values(athletesObj).sort((a, b) =>
                        b.points - a.points || b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze
                    );
                    if (sorted.length > 0) {
                        const top = sorted[0];
                        const parts = [];
                        if (top.gold > 0) parts.push(`${top.gold} Emas`);
                        if (top.silver > 0) parts.push(`${top.silver} Perak`);
                        if (top.bronze > 0) parts.push(`${top.bronze} Perunggu`);
                        computedMvs.push({
                            nama: top.nama,
                            kategori: top.klub ? `${groupKey} • ${top.klub}` : groupKey,
                            poin: `${parts.join(', ')} (${top.points} Poin)`
                        });
                    }
                });

                mvsAthletes = computedMvs;
                renderMvsList();
                alert(`✅ Berhasil menghitung ${computedMvs.length} peraih MVS berdasarkan perolehan medali & poin tertinggi!`);
            } catch (err) {
                alert('Gagal menghitung MVS: ' + err.message);
            } finally {
                btnAutoCalcMvs.innerText = '⚡ Hitung Otomatis dari Klasemen';
                btnAutoCalcMvs.disabled = false;
            }
        });
    }

    // ==========================================
    // UPLOAD & CANVAS PREVIEW
    // ==========================================
    const uploadInput = document.getElementById('uploadTemplate');
    const canvas = document.getElementById('certCanvas');
    const ctx = canvas.getContext('2d');
    const placeholder = document.getElementById('placeholderCanvas');
    const panelKoordinat = document.getElementById('panelKoordinat');

    uploadInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                uploadedImage = img;
                canvas.width = img.width;
                canvas.height = img.height;

                const centerX = Math.round(img.width / 2);
                document.getElementById('coordNameX').value = centerX;
                document.getElementById('coordNameY').value = 400;

                if (currentMode !== 'peserta') {
                    document.getElementById('coordPreddX').value = centerX;
                    document.getElementById('coordPreddY').value = 500;
                    document.getElementById('coordNomorX').value = centerX;
                    document.getElementById('coordNomorY').value = 600;
                    document.getElementById('coordKUX').value = centerX;
                    document.getElementById('coordKUY').value = 700;
                }

                panelKoordinat.style.display = 'block';
                placeholder.classList.add('hidden');
                canvas.classList.remove('hidden');

                document.fonts.ready.then(() => drawPreview());
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    function drawRawText(ctx, text, x, y, fontSize, fontType, fontColor) {
        ctx.textAlign = "center";
        if (fontType.includes('Great Vibes')) {
            ctx.font = `${fontSize}px ${fontType}`;
        } else {
            ctx.font = `bold ${fontSize}px ${fontType}`;
        }
        ctx.fillStyle = fontColor;
        ctx.fillText(text, parseInt(x, 10), parseInt(y, 10));
    }

    function drawTextField(ctx, text, xId, yId, sizeId, fontType, fontColor) {
        const x = parseInt(document.getElementById(xId).value, 10);
        const y = parseInt(document.getElementById(yId).value, 10);
        const fontSize = document.getElementById(sizeId).value;
        drawRawText(ctx, text, x, y, fontSize, fontType, fontColor);
    }

    function drawPreview() {
        if (!uploadedImage) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(uploadedImage, 0, 0, canvas.width, canvas.height);

        const fontColor = document.getElementById('sharedColor').value;
        const fontType = document.getElementById('sharedFont').value;
        const dummy = DUMMY_BY_MODE[currentMode] || DUMMY_BY_MODE.peserta;

        drawTextField(ctx, dummy.nama, 'coordNameX', 'coordNameY', 'sizeName', fontType, fontColor);

        if (currentMode !== 'peserta') {
            drawTextField(ctx, dummy.predikat, 'coordPreddX', 'coordPreddY', 'sizePredd', fontType, fontColor);
            drawTextField(ctx, dummy.nomor, 'coordNomorX', 'coordNomorY', 'sizeNomor', fontType, fontColor);
            drawTextField(ctx, dummy.ku, 'coordKUX', 'coordKUY', 'sizeKU', fontType, fontColor);
        }

        // Gambar semua custom fields (misal Nomor Sertifikat)
        customFields.forEach((cf, idx) => {
            const sampleText = renderCustomFieldValue(cf, 'PREVIEW-SAMPLE', idx + 1);
            drawRawText(ctx, sampleText, cf.x, cf.y, cf.size || 28, fontType, fontColor);
        });
    }

    const inputsToAutoRefresh = document.querySelectorAll('#panelKoordinat input, #panelKoordinat select');
    inputsToAutoRefresh.forEach(input => {
        const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
        input.addEventListener(eventType, drawPreview);
    });

    document.getElementById('btnAutoCenter').addEventListener('click', () => {
        if (!uploadedImage) return;
        const centerX = Math.round(uploadedImage.width / 2);
        document.getElementById('coordNameX').value = centerX;
        if (currentMode !== 'peserta') {
            document.getElementById('coordPreddX').value = centerX;
            document.getElementById('coordNomorX').value = centerX;
            document.getElementById('coordKUX').value = centerX;
        }
        customFields.forEach(cf => { cf.x = centerX; });
        renderCustomFieldsUI();
        drawPreview();
    });

    function copyLink(inputId, btnId) {
        const copyText = document.getElementById(inputId);
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(copyText.value);

        const btn = document.getElementById(btnId);
        const originalText = btn.innerText;
        btn.innerText = "Tersalin! ✅";
        btn.classList.add("bg-emerald-600");
        setTimeout(() => {
            btn.innerText = originalText;
            btn.classList.remove("bg-emerald-600");
        }, 2000);
    }

    document.getElementById('btnCopyPeserta').addEventListener('click', () => copyLink('linkPeserta', 'btnCopyPeserta'));
    document.getElementById('btnCopyJuara').addEventListener('click', () => copyLink('linkJuara', 'btnCopyJuara'));

    // ==========================================
    // LOAD CONFIG PER TAB
    // ==========================================
    document.getElementById('btnLoadConfig').addEventListener('click', async () => {
        const btn = document.getElementById('btnLoadConfig');
        btn.innerText = "⏳ Loading...";

        try {
            const { data, error } = await supabaseClient
                .from('event_certificates')
                .select('*')
                .eq('event_id', currentEventId)
                .eq('tipe', currentMode)
                .single();

            if (error || !data) {
                alert(`Belum ada template tersimpan untuk tipe: ${currentMode.toUpperCase()}`);
                btn.innerHTML = "<span>🔄</span> Load Template Tersimpan";
                return;
            }

            const config = data.config_json || {};

            document.getElementById('sharedColor').value = config.sharedStyle?.color || '#1e293b';
            document.getElementById('sharedFont').value = config.sharedStyle?.font || 'Arial, sans-serif';

            document.getElementById('coordNameX').value = config.nama?.x || 1000;
            document.getElementById('coordNameY').value = config.nama?.y || 400;
            document.getElementById('sizeName').value = config.nama?.size || 95;

            if (currentMode !== 'peserta' && config.extra) {
                document.getElementById('coordPreddX').value = config.extra.juara?.x || 1000;
                document.getElementById('coordPreddY').value = config.extra.juara?.y || 500;
                document.getElementById('sizePredd').value = config.extra.juara?.size || 45;

                document.getElementById('coordNomorX').value = config.extra.nomorLomba?.x || 1000;
                document.getElementById('coordNomorY').value = config.extra.nomorLomba?.y || 600;
                document.getElementById('sizeNomor').value = config.extra.nomorLomba?.size || 35;

                document.getElementById('coordKUX').value = config.extra.kelompokUmur?.x || 1000;
                document.getElementById('coordKUY').value = config.extra.kelompokUmur?.y || 700;
                document.getElementById('sizeKU').value = config.extra.kelompokUmur?.size || 45;
            }

            if (Array.isArray(config.customFields)) {
                customFields = JSON.parse(JSON.stringify(config.customFields));
                renderCustomFieldsUI();
            }

            if (currentMode === 'mvs' && Array.isArray(config.mvsAthletes)) {
                mvsAthletes = config.mvsAthletes;
                renderMvsList();
            }

            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                uploadedImage = img;
                canvas.width = img.width;
                canvas.height = img.height;
                panelKoordinat.style.display = 'block';
                placeholder.classList.add('hidden');
                canvas.classList.remove('hidden');
                document.fonts.ready.then(() => drawPreview());
            };
            img.src = data.template_url + "?t=" + new Date().getTime();

            alert(`✅ Konfigurasi ${currentMode.toUpperCase()} berhasil di-load!`);

        } catch (err) {
            alert("Terjadi kesalahan saat memuat template.");
        } finally {
            btn.innerHTML = "<span>🔄</span> Load Template Tersimpan";
        }
    });

    // ==========================================
    // SAVE CONFIG + SYNC CUSTOM FIELDS KE SERTIFIKAT LAINNYA
    // ==========================================
    document.getElementById('btnSaveConfig').addEventListener('click', async () => {
        let publicUrl = null;
        let isUploadingNewImage = false;
        const file = uploadInput.files[0];

        if (file) {
            isUploadingNewImage = true;
        } else if (uploadedImage) {
            publicUrl = uploadedImage.src.split('?')[0];
        } else {
            alert("Pilih template image atau Load konfigurasi lama dulu Bos!");
            return;
        }

        const btn = document.getElementById('btnSaveConfig');
        const statusMsg = document.getElementById('statusMsg');
        btn.innerText = "Processing...";
        btn.disabled = true;
        statusMsg.classList.remove('hidden');
        statusMsg.innerText = "Menyimpan konfigurasi...";
        statusMsg.className = "text-xs text-center mt-3 font-bold text-blue-600";

        try {
            if (isUploadingNewImage) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${currentEventId}_${currentMode}_${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabaseClient.storage.from('sertifikat-template').upload(fileName, file);
                if (uploadError) throw uploadError;

                const { data: urlData } = supabaseClient.storage.from('sertifikat-template').getPublicUrl(fileName);
                publicUrl = urlData.publicUrl;
            }

            const sharedStyleObj = {
                color: document.getElementById('sharedColor').value,
                font: document.getElementById('sharedFont').value
            };

            let configJson = {
                sharedStyle: sharedStyleObj,
                nama: {
                    x: document.getElementById('coordNameX').value,
                    y: document.getElementById('coordNameY').value,
                    size: document.getElementById('sizeName').value
                },
                customFields: customFields
            };

            if (currentMode !== 'peserta') {
                configJson.extra = {
                    juara: {
                        x: document.getElementById('coordPreddX').value,
                        y: document.getElementById('coordPreddY').value,
                        size: document.getElementById('sizePredd').value
                    },
                    nomorLomba: {
                        x: document.getElementById('coordNomorX').value,
                        y: document.getElementById('coordNomorY').value,
                        size: document.getElementById('sizeNomor').value
                    },
                    kelompokUmur: {
                        x: document.getElementById('coordKUX').value,
                        y: document.getElementById('coordKUY').value,
                        size: document.getElementById('sizeKU').value
                    }
                };
            }

            if (currentMode === 'mvs') {
                configJson.mvsAthletes = mvsAthletes;
            }

            const { data: existingRow } = await supabaseClient
                .from('event_certificates')
                .select('id')
                .eq('event_id', currentEventId)
                .eq('tipe', currentMode)
                .single();

            if (existingRow) {
                const { error: updateError } = await supabaseClient
                    .from('event_certificates')
                    .update({
                        template_url: publicUrl,
                        config_json: configJson
                    })
                    .eq('id', existingRow.id);
                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabaseClient
                    .from('event_certificates')
                    .insert([{
                        event_id: currentEventId,
                        tipe: currentMode,
                        template_url: publicUrl,
                        config_json: configJson
                    }]);
                if (insertError) throw insertError;
            }

            // Terapkan field tambahan (Nomor Sertifikat, dll) ke tipe sertifikat lain yang sudah ada di event ini
            const shouldSyncCustom = document.getElementById('chkSyncCustomAllTypes')?.checked;
            if (shouldSyncCustom) {
                const { data: siblingRows } = await supabaseClient
                    .from('event_certificates')
                    .select('id, tipe, config_json')
                    .eq('event_id', currentEventId)
                    .neq('tipe', currentMode);

                if (Array.isArray(siblingRows)) {
                    for (const sib of siblingRows) {
                        const updatedSibConfig = {
                            ...(sib.config_json || {}),
                            customFields: customFields
                        };
                        await supabaseClient
                            .from('event_certificates')
                            .update({ config_json: updatedSibConfig })
                            .eq('id', sib.id);
                    }
                }
            }

            statusMsg.innerText = `✅ Tersimpan! Konfigurasi ${currentMode.toUpperCase()} siap digunakan.`;
            statusMsg.className = "text-xs text-center mt-3 font-bold text-emerald-600";
            btn.innerHTML = "<span>💾</span> Simpan & Timpa Template";
            btn.disabled = false;

        } catch (err) {
            console.error(err);
            statusMsg.innerText = "❌ Gagal: " + err.message;
            statusMsg.className = "text-xs text-center mt-3 font-bold text-red-600";
            btn.innerHTML = "<span>💾</span> Simpan & Timpa Template";
            btn.disabled = false;
        }
    });
});
