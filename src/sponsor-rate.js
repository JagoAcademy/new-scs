document.addEventListener('DOMContentLoaded', () => {
    
    // Logika Routing untuk WhatsApp (Tier 1, 2, 3)
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

    // Logika Routing untuk Email (Tier 0: SCS Partner)
    const emailButtons = document.querySelectorAll('.btn-email');
    emailButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const paket = e.target.getAttribute('data-paket');
            const subject = `Pengajuan Kolaborasi - ${paket}`;
            const body = `Halo Tim Kemitraan F1 Swimming,\n\nKami tertarik untuk mendaftarkan Brand kami sebagai bagian dari ekosistem SCS Partner.\n\nKami mengerti bahwa melalui program ini, kami membuka kesempatan bagi Event Organizer di seluruh Indonesia untuk mengajukan proposal kolaborasi kepada kami secara independen.\n\nMohon informasi mengenai persyaratan dan kelengkapan dokumen yang dibutuhkan untuk bergabung ke dalam Master Katalog Anda.\n\nTerima kasih.`;
            
            const mailtoUrl = `mailto:fajar@f1swimming.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailtoUrl;
        });
    });
});
