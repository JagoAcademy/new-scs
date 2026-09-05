// ==========================================
// 🔑 SUNTIKAN KONFIGURASI SUPABASE & LOGIN
// ==========================================
const CONFIG = {
    // Informasi Login WFH (Hardcoded Auth)
    auth: {
        username: "adminscs01",
        accessCode: "f1wfh2026"
    },
    // Kredensial Akses REST API Supabase Proyek F1 Swimming kamu
    // PENTING: Ganti nilai url dan anonKey dengan proyek Supabase F1 Swimming asli
    supabase: {
        url: "https://YOUR_PROJECT_ID.supabase.co", 
        anonKey: "YOUR_SUPABASE_PUBLIC_ANON_KEY" 
    }
};

// State Penyimpanan Sesi Kerja Lokal (Untuk Generator Laporan WA)
let currentAdmin = "";
let localScrapingData = [];
let localOutreachData = [];

// 1. Sistem Validasi Login Sederhana
window.handleLogin = function() {
    const userIn = document.getElementById('username').value.trim();
    const codeIn = document.getElementById('access-code').value.trim();
    const errorMsg = document.getElementById('login-error');

    if(userIn === CONFIG.auth.username && codeIn === CONFIG.auth.accessCode) {
        currentAdmin = userIn;
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('admin-badge').innerText = `Admin: ${currentAdmin}`;
        window.updateReport();
    } else {
        errorMsg.classList.remove('hidden');
    }
};

// 2. Fungsi Kirim Data ke Supabase via REST API
window.postToSupabase = async function(endpoint, payload) {
    // Cegah error jika user belum mengonfigurasi URL asli
    if (CONFIG.supabase.url.includes("YOUR_PROJECT_ID")) {
        console.warn("Supabase URL belum diisi. Menyimpan data lokal saja.");
        return true; 
    }

    try {
        const response = await fetch(`${CONFIG.supabase.url}/rest/v1/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': CONFIG.supabase.anonKey,
                'Authorization': `Bearer ${CONFIG.supabase.anonKey}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP Error Status: ${response.status}`);
        }
        return true;
    } catch (error) {
        console.error("Gagal sinkronisasi ke Supabase:", error);
        alert("⚠️ Gagal mengirim data ke cloud database! Cek koneksi atau setelan Supabase.");
        return false;
    }
};

// 3. Aksi submit form data Scraping
window.submitScraping = async function(event) {
    event.preventDefault();
    
    const name = document.getElementById('scrap-name').value.trim();
    const location = document.getElementById('scrap-location').value.trim();
    const contact = document.getElementById('scrap-contact').value.trim();

    const dbPayload = {
        admin_id: currentAdmin,
        club_name: name,
        location: location,
        contact_info: contact,
        created_at: new Date().toISOString()
    };

    const submitBtn = document.querySelector('#form-scraping button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = "<span>⏳</span> Mengirim...";
    submitBtn.disabled = true;

    // Kirim langsung ke tabel public.scraping di Supabase Cloud
    const success = await window.postToSupabase('scraping', dbPayload);

    if (success) {
        // Simpan di memori lokal halaman untuk kompilasi laporan teks WA
        localScrapingData.push({ name, location, contact });
        document.getElementById('form-scraping').reset();
        window.updateMetrics();
        window.updateReport();
    }
    
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
};

// 4. Aksi submit log data Outreach
window.submitOutreach = async function(event) {
    event.preventDefault();

    const target = document.getElementById('out-target').value.trim();
    const status = document.getElementById('out-status').value;
    const notes = document.getElementById('out-notes').value.trim() || "-";

    const dbPayload = {
        admin_id: currentAdmin,
        target_contact: target,
        status_response: status,
        notes: notes,
        created_at: new Date().toISOString()
    };

    const submitBtn = document.querySelector('#form-outreach button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = "<span>⏳</span> Mengirim...";
    submitBtn.disabled = true;

    // Kirim langsung ke tabel public.outreach_logs di Supabase Cloud
    const success = await window.postToSupabase('outreach_logs', dbPayload);

    if (success) {
        localOutreachData.push({ target, status, notes });
        document.getElementById('form-outreach').reset();
        window.updateMetrics();
        window.updateReport();
    }
    
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
};

// 5. Hitung Metrik Kelayakan Gaji
window.updateMetrics = function() {
    const scCount = localScrapingData.length;
    const outCount = localOutreachData.length;

    document.getElementById('count-scraping').innerText = scCount;
    document.getElementById('count-outreach').innerText = outCount;

    const statusBox = document.getElementById('salary-status');
    
    // Evaluasi target harian dari PKS (Min 15 Scraping dan Min 10 Outreach)
    if (scCount >= 15 && outCount >= 10) {
        statusBox.innerText = "✅ Target Terpenuhi (Valid Rp20.000 / Hari)";
        statusBox.className = "text-xs font-bold text-emerald-600 bg-emerald-50 p-2 rounded border border-emerald-100 text-center";
    } else {
        statusBox.innerText = "❌ Target Harian Belum Terpenuhi";
        statusBox.className = "text-xs font-bold text-red-500 bg-red-50 p-2 rounded border border-red-100 text-center";
    }
};

// 6. Kompilasi Sinkronisasi Teks Laporan untuk WhatsApp Owner
window.updateReport = function() {
    const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const isQualified = (localScrapingData.length >= 15 && localOutreachData.length >= 10) ? "TERPENUHI (Valid Rp20.000)" : "BELUM TERPENUHI";
    
    let text = `LAPORAN HARIAN ADMIN WFH - F1 SWIMMING (SCS)\n`;
    text += `Tanggal: ${dateStr}\n`;
    text += `ID Admin: ${currentAdmin}\n`;
    text += `Status Gaji Hari Ini: [ ${isQualified} ]\n`;
    text += `=========================================\n\n`;

    text += `📊 RINGKASAN DATA (SUDAH MASUK DATABASE):\n`;
    text += `- Total Scraping: ${localScrapingData.length} klub\n`;
    text += `- Total Outreach: ${localOutreachData.length} kontak\n\n`;

    text += `🔍 LIST SCRAPING BARU (public.scraping):\n`;
    if(localScrapingData.length === 0) text += `- Belum ada data\n`;
    localScrapingData.forEach((item, idx) => {
        text += `${idx + 1}. ${item.name} (${item.location}) -> ${item.contact}\n`;
    });

    text += `\n💬 LOG COLD OUTREACH HARI INI:\n`;
    if(localOutreachData.length === 0) text += `- Belum ada data\n`;
    localOutreachData.forEach((item, idx) => {
        text += `${idx + 1}. ${item.target} | Respon: ${item.status} | Keterangan: ${item.notes}\n`;
    });

    document.getElementById('whatsapp-report-box').value = text;
};

// 7. Utilitas Salin Clipboard Sekali Klik
window.copyToClipboard = function() {
    const reportBox = document.getElementById('whatsapp-report-box');
    reportBox.select();
    reportBox.setSelectionRange(0, 99999);
    
    try {
        document.execCommand('copy');
        alert("📋 Laporan kerja harian berhasil disalin! Silakan langsung paste ke WhatsApp Owner.");
    } catch (err) {
        console.error("Gagal menyalin teks", err);
        alert("Gagal menyalin otomatis, silakan copy manual di dalam kotak laporan.");
    }
};
