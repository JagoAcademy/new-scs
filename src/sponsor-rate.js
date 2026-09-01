document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.btn-pilih');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const paket = e.target.getAttribute('data-paket');
            
            // Konfigurasi Nomor WA Tujuan Admin
            const phone = "6289691219977"; 
            const text = `Halo tim F1 Swimming, saya tertarik untuk mendiskusikan *${paket}*. Mohon info lebih lanjut mengenai proses onboarding brand ke sistem Ad-Tech.`;
            
            const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
            window.open(waUrl, '_blank');
        });
    });
});
