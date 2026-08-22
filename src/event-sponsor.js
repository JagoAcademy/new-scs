import { supabaseClient } from './supabase.js';

let currentEventId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentEventId = urlParams.get('id');

    if (!currentEventId) {
        alert("ID Event tidak ditemukan!");
        window.location.replace('/dashboard.html');
        return;
    }

    // Set link kembali ke Dashboard
    const btnBack = document.getElementById('btnBackDashboard');
    if (btnBack) {
        btnBack.href = `/event-dashboard.html?id=${currentEventId}`;
    }

    try {
        // ==========================================
        // SATPAM LAPISAN 1: CEK OTORISASI USER
        // ==========================================
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            alert("Akses ditolak! Silakan login terlebih dahulu.");
            window.location.replace('/auth.html');
            return;
        }
        
        const currentUserId = session.user.id;
        const currentUserEmail = session.user.email;

        const { data: eventData, error } = await supabaseClient
            .from('events')
            .select('owner_id')
            .eq('id', currentEventId)
            .single();

        if (error || !eventData) throw new Error("Gagal memuat dari database.");

        let isAuthorized = false;
        
        if (eventData.owner_id === currentUserId) {
            isAuthorized = true;
        } else if (currentUserEmail === 'radityaraja@gmail.com') {
            isAuthorized = true;
        } else {
            const { data: collabData } = await supabaseClient
                .from('event_collaborators')
                .select('id')
                .eq('event_id', currentEventId)
                .eq('user_id', currentUserId)
                .single();
                
            if (collabData) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            alert("🛑 WOY! Kamu bukan Owner atau Panitia di event ini. Dilarang ngintip!");
            window.location.replace('/dashboard.html');
            return;
        }
        // ==========================================

        // Inisialisasi Fungsi
        setupPitchingForm();
        await loadSponsorDeals();

    } catch (err) {
        alert("Terjadi kesalahan: " + err.message);
    }
});

function setupPitchingForm() {
    const btnSubmitPitching = document.getElementById('btnSubmitPitching');
    if(!btnSubmitPitching) return;

    btnSubmitPitching.addEventListener('click', async () => {
        const hari = document.getElementById('pitchHari').value;
        const peserta = document.getElementById('pitchPeserta').value;
        const t3x3 = document.getElementById('pitch3x3').value || 0;
        const t5x5 = document.getElementById('pitch5x5').value || 0;
        const tCustom = document.getElementById('pitchCustom').value || '';
        const msg = document.getElementById('pitchMsg');

        if(!hari || !peserta) {
            msg.innerHTML = "Jumlah Hari & Total Peserta wajib diisi!";
            msg.className = "text-sm font-bold text-center rounded-lg p-3 mt-2 bg-red-100 text-red-600 block";
            msg.classList.remove('hidden');
            return;
        }

        btnSubmitPitching.innerText = "Mengirim...";
        btnSubmitPitching.disabled = true;

        try {
            const { error } = await supabaseClient.from('sponsor_approach').insert([{
                event_id: currentEventId,
                jumlah_hari: parseInt(hari),
                total_peserta: parseInt(peserta),
                tenant_3x3: parseInt(t3x3),
                tenant_5x5: parseInt(t5x5),
                custom_tenant: tCustom
            }]);

            if(error) throw error;

            msg.innerHTML = "✅ Proposal berhasil diajukan! Masuk antrian approach SCS Pusat.";
            msg.className = "text-sm font-bold text-center rounded-lg p-3 mt-2 bg-green-100 text-green-700 block";
            msg.classList.remove('hidden');
            
            setTimeout(() => {
                msg.classList.add('hidden');
                document.getElementById('pitchHari').value = '';
                document.getElementById('pitchPeserta').value = '';
                document.getElementById('pitch3x3').value = '';
                document.getElementById('pitch5x5').value = '';
                document.getElementById('pitchCustom').value = '';
            }, 3000);

        } catch (err) {
            msg.innerHTML = "Gagal: " + err.message;
            msg.className = "text-sm font-bold text-center rounded-lg p-3 mt-2 bg-red-100 text-red-600 block";
            msg.classList.remove('hidden');
        } finally {
            btnSubmitPitching.innerText = "Ajukan Proposal ke SCS Pusat 🚀";
            btnSubmitPitching.disabled = false;
        }
    });
}

// ==========================================
// FUNGSI LOAD SPONSOR DEAL (PRO FEATURE)
// ==========================================
async function loadSponsorDeals() {
    const container = document.getElementById('sponsorDealContainer');
    if (!container) return;

    try {
        // 1. Cek apakah ada deal di event_sponsors
        const { data: linkData, error: linkErr } = await supabaseClient
            .from('event_sponsors')
            .select('sponsor_ids')
            .eq('event_id', currentEventId)
            .single();

        if (linkErr || !linkData || !linkData.sponsor_ids || linkData.sponsor_ids.length === 0) {
            container.innerHTML = `
                <div class="text-center py-6">
                    <span class="text-4xl block mb-3 opacity-30 grayscale">🏢</span>
                    <p class="text-sm font-bold text-slate-400">Belum Ada Sponsor Deal</p>
                    <p class="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">Kirim form pengajuan di atas agar tim pusat SCS bisa mencarikan sponsor untuk event Anda.</p>
                </div>
            `;
            return;
        }

        // 2. Tarik master datanya
        const { data: sponsors, error: spErr } = await supabaseClient
            .from('master_sponsors')
            .select('*')
            .in('id', linkData.sponsor_ids);

        if (spErr || !sponsors || sponsors.length === 0) throw new Error("Data master sponsor tidak ditemukan.");

        let html = `<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">`;
        
        sponsors.forEach(sp => {
            html += `
                <div class="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-4 hover:border-amber-500 transition-colors group">
                    <div class="w-16 h-16 bg-white rounded-lg p-2 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                        <img src="${sp.logo_url}" alt="${sp.sponsor_name}" class="w-full h-full object-contain" onerror="this.style.display='none'">
                    </div>
                    <div>
                        <h4 class="font-black text-white text-sm md:text-base">${sp.sponsor_name}</h4>
                        <a href="${sp.link_url || '#'}" target="_blank" class="text-[10px] text-blue-400 hover:text-blue-300 font-mono mt-1 block truncate max-w-[150px]">🔗 Cek Website</a>
                    </div>
                </div>
            `;
        });
        html += `</div>`;

        // 3. Keterangan Syarat & Ketentuan Deal yang dipindah dari dashboard
        html += `
            <div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 md:p-5 mt-2 shadow-inner">
                <h4 class="text-amber-400 font-black text-xs mb-3 flex items-center gap-2"><span>⚠️</span> SYARAT & KEWAJIBAN PANITIA (DEAL ACTIVE):</h4>
                <ul class="list-disc list-inside text-[11px] text-slate-300 space-y-2 ml-1 leading-relaxed">
                    <li>Logo sponsor otomatis tayang eksklusif di halaman <strong>Live Result</strong>, <strong>Leaderboard</strong>, dan Header Aplikasi publik.</li>
                    <li>Layanan Freemium SCS & F1 Swimming yang digunakan dari awal pendaftaran hingga mencetak hasil akhir lomba <strong>telah ditanggung oleh pihak sponsor</strong>.</li>
                    <li>MC / Announcer wajib menyebutkan nama sponsor dan tagline minimal <strong>1x setiap pergantian kategori lomba</strong>.</li>
                    <li>Panitia wajib menyediakan spot untuk pemasangan <strong>banner / umbul-umbul fisik</strong> di area strategis kolam renang sesuai proposal kesepakatan.</li>
                    <li>Tim SCS berhak meninjau pelaksanaan kewajiban ini di lapangan secara berkala.</li>
                </ul>
            </div>
        `;

        container.innerHTML = html;

    } catch (err) {
        container.innerHTML = `<p class="text-xs text-red-400 font-bold text-center py-4 bg-red-900/20 rounded-xl border border-red-900/50">Gagal memuat sponsor: ${err.message}</p>`;
    }
}
