document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Logika Routing WhatsApp (Tier 1, 2, 3)
    const waButtons = document.querySelectorAll('.btn-wa');
    waButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const paket = e.target.getAttribute('data-paket');
            const phone = "6289691219977"; 
            const text = `Halo tim F1 Swimming, saya tertarik untuk mendiskusikan penawaran *${paket}*. Mohon info lebih lanjut mengenai proses penempatan Ad-Tech ini.`;
            
            const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
            window.open(waUrl, '_blank');
        });
    });

    // 2. Logika Routing Email (Tier 0)
    const emailButtons = document.querySelectorAll('.btn-email');
    emailButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const paket = e.target.getAttribute('data-paket');
            const subject = `Pengajuan Kolaborasi - ${paket}`;
            const body = `Halo Tim Kemitraan F1 Swimming,\n\nKami tertarik untuk mendaftarkan Brand kami sebagai bagian dari ekosistem SCS Partner.\n\nMohon informasi mengenai kelengkapan data yang dibutuhkan untuk bergabung ke dalam Master Katalog Anda.\n\nTerima kasih.`;
            
            const mailtoUrl = `mailto:fajar@f1swimming.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailtoUrl;
        });
    });

    // 3. Menutup Modal saat area backdrop hitam diklik
    const modal = document.getElementById('previewModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closePreviewSimulasi();
        });
    }
});

// =======================================================================
// 🚀 FUNGSI GLOBAL SIMULASI MULTI-HEAT (THE WOW FACTOR)
// =======================================================================
window.openPreviewSimulasi = function(tipePaket) {
    const modal = document.getElementById('previewModal');
    const content = document.getElementById('modalSimulationContent');
    const title = document.getElementById('modalSimulationTitle');
    
    let htmlSimulation = '';

    if (tipePaket === 'single') {
        title.innerText = "Simulasi: 1 Brand Placement (Dominasi Seri)";
        htmlSimulation = `
            <div class="bg-blue-950/40 text-blue-300 p-4 rounded-2xl border border-blue-500/30 text-xs leading-relaxed mb-5 text-left">
                🚀 <strong>The Power of Multi-Heat:</strong> 1 Nomor Lomba terdiri dari 8 hingga 15 seri (Heat). Setiap berganti seri, penonton me-refresh halaman Live Result. Logo Anda akan <strong>tayang berulang kali di seluruh Heat</strong> sepanjang nomor lomba berlangsung!
            </div>
            <div class="space-y-2.5 text-left">
                <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px] text-slate-500 font-bold flex justify-between items-center">
                    <span>🏊 Event #1: 50m Gaya Dada Putri</span>
                    <span class="text-[9px] text-slate-600 uppercase">Slot Klien Lain</span>
                </div>
                
                <div class="bg-gradient-to-b from-blue-950 to-slate-950 p-4 rounded-2xl border-2 border-blue-500 shadow-xl space-y-2.5">
                    <div class="flex justify-between items-center text-xs text-white font-black border-b border-blue-800/50 pb-2">
                        <span>🏊 Event #2: 50m Gaya Bebas Putra</span>
                        <span class="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded font-black tracking-wider uppercase animate-pulse">8x Penayangan</span>
                    </div>
                    
                    <div class="flex flex-col gap-1.5 pt-1">
                        <div class="bg-blue-900/30 border border-blue-500/20 p-2.5 rounded-xl text-[10px] text-blue-200 font-semibold flex justify-between items-center">
                            <span>🔥 HEAT 1 dari 8</span> <span class="bg-blue-600 text-white text-[8px] px-2 py-0.5 rounded font-bold uppercase">BRAND ANDA</span>
                        </div>
                        <div class="bg-blue-900/30 border border-blue-500/20 p-2.5 rounded-xl text-[10px] text-blue-200 font-semibold flex justify-between items-center">
                            <span>🔥 HEAT 2 dari 8</span> <span class="bg-blue-600 text-white text-[8px] px-2 py-0.5 rounded font-bold uppercase">BRAND ANDA</span>
                        </div>
                        <div class="bg-blue-900/30 border border-blue-500/20 p-2.5 rounded-xl text-[10px] text-blue-200 font-semibold flex justify-between items-center">
                            <span>🔥 HEAT 3 dari 8</span> <span class="bg-blue-600 text-white text-[8px] px-2 py-0.5 rounded font-bold uppercase">BRAND ANDA</span>
                        </div>
                        <div class="text-[9px] text-slate-400 text-center font-bold py-1 bg-slate-900/60 rounded-lg border border-slate-800">
                            ...dan berlanjut otomatis tayang eksklusif hingga HEAT 8
                        </div>
                    </div>
                </div>
                
                <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px] text-slate-500 font-bold flex justify-between items-center">
                    <span>🏊 Event #3: 100m Gaya Kupu Putra</span>
                    <span class="text-[9px] text-slate-600 uppercase">Slot Klien Lain</span>
                </div>
            </div>
        `;
    } else if (tipePaket === 'dual') {
        title.innerText = "Simulasi: 2 Brand Mix (Rotasi Seimbang)";
        htmlSimulation = `
            <div class="bg-blue-950/40 text-blue-300 p-4 rounded-2xl border border-blue-500/30 text-xs leading-relaxed mb-5 text-left">
                🔄 <strong>Rotasi Seimbang Multi-Heat:</strong> Menayangkan 2 produk atau lini bisnis berbeda dari korporat Anda secara bergantian di setiap seri lomba.
            </div>
            <div class="space-y-2.5 text-left">
                <div class="bg-gradient-to-b from-blue-950 to-slate-950 p-4 rounded-2xl border-2 border-blue-500 shadow-xl space-y-2.5">
                    <div class="flex justify-between items-center text-xs text-white font-black border-b border-blue-800/50 pb-2">
                        <span>🏊 Event #2: 50m Gaya Bebas Putra</span>
                        <span class="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded font-black tracking-wider uppercase">Rotasi 2 Brand</span>
                    </div>
                    
                    <div class="flex flex-col gap-1.5 pt-1">
                        <div class="bg-blue-900/30 border border-blue-500/20 p-2.5 rounded-xl text-[10px] text-blue-200 font-semibold flex justify-between items-center">
                            <span>🔥 HEAT 1</span> <span class="bg-amber-500 text-slate-950 text-[8px] px-2 py-0.5 rounded font-bold uppercase">BRAND A (Produk 1)</span>
                        </div>
                        <div class="bg-blue-900/30 border border-blue-500/20 p-2.5 rounded-xl text-[10px] text-blue-200 font-semibold flex justify-between items-center">
                            <span>🔥 HEAT 2</span> <span class="bg-emerald-500 text-slate-950 text-[8px] px-2 py-0.5 rounded font-bold uppercase">BRAND B (Produk 2)</span>
                        </div>
                        <div class="bg-blue-900/30 border border-blue-500/20 p-2.5 rounded-xl text-[10px] text-blue-200 font-semibold flex justify-between items-center">
                            <span>🔥 HEAT 3</span> <span class="bg-amber-500 text-slate-950 text-[8px] px-2 py-0.5 rounded font-bold uppercase">BRAND A (Produk 1)</span>
                        </div>
                        <div class="bg-blue-900/30 border border-blue-500/20 p-2.5 rounded-xl text-[10px] text-blue-200 font-semibold flex justify-between items-center">
                            <span>🔥 HEAT 4</span> <span class="bg-emerald-500 text-slate-950 text-[8px] px-2 py-0.5 rounded font-bold uppercase">BRAND B (Produk 2)</span>
                        </div>
                        <div class="text-[9px] text-slate-400 text-center font-bold py-1 bg-slate-900/60 rounded-lg border border-slate-800">
                            Kedua brand berbagi porsi tayang secara adil di seluruh seri lomba
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (tipePaket === 'triple') {
        title.innerText = "Simulasi: 3 Brand Mix (Rotasi Masif)";
        htmlSimulation = `
            <div class="bg-blue-950/40 text-blue-300 p-4 rounded-2xl border border-blue-500/30 text-xs leading-relaxed mb-5 text-left">
                🌐 <strong>Eksposur Multi-Brand:</strong> Distribusi 3 portofolio produk sekaligus secara dinamis di sepanjang 8 hingga 15 seri heat pertandingan.
            </div>
            <div class="space-y-2.5 text-left">
                <div class="bg-gradient-to-b from-blue-950 to-slate-950 p-4 rounded-2xl border-2 border-blue-500 shadow-xl space-y-2.5">
                    <div class="flex justify-between items-center text-xs text-white font-black border-b border-blue-800/50 pb-2">
                        <span>🏊 Event #2: 50m Gaya Bebas Putra</span>
                        <span class="text-[9px] bg-purple-600 text-white px-2 py-0.5 rounded font-black tracking-wider uppercase">Rotasi 3 Brand</span>
                    </div>
                    
                    <div class="flex flex-col gap-1.5 pt-1">
                        <div class="bg-blue-900/30 border border-blue-500/20 p-2.5 rounded-xl text-[10px] text-blue-200 font-semibold flex justify-between items-center">
                            <span>🔥 HEAT 1</span> <span class="bg-amber-500 text-slate-950 text-[8px] px-2 py-0.5 rounded font-bold uppercase">BRAND A</span>
                        </div>
                        <div class="bg-blue-900/30 border border-blue-500/20 p-2.5 rounded-xl text-[10px] text-blue-200 font-semibold flex justify-between items-center">
                            <span>🔥 HEAT 2</span> <span class="bg-emerald-500 text-slate-950 text-[8px] px-2 py-0.5 rounded font-bold uppercase">BRAND B</span>
                        </div>
                        <div class="bg-blue-900/30 border border-blue-500/20 p-2.5 rounded-xl text-[10px] text-blue-200 font-semibold flex justify-between items-center">
                            <span>🔥 HEAT 3</span> <span class="bg-purple-500 text-white text-[8px] px-2 py-0.5 rounded font-bold uppercase">BRAND C</span>
                        </div>
                        <div class="text-[9px] text-slate-400 text-center font-bold py-1 bg-slate-900/60 rounded-lg border border-slate-800">
                            Sistem secara cerdas merotasi ketiga brand sepanjang seluruh Heat
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    content.innerHTML = htmlSimulation;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

window.closePreviewSimulasi = function() {
    const modal = document.getElementById('previewModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};
