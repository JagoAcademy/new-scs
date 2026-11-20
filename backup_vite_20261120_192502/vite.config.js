import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        // --- 1. MAIN & PUBLIC PAGES (Akses Tanpa Login) ---
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        jobs: resolve(__dirname, 'jobs.html'),
        openinvest: resolve(__dirname, 'openinvest.html'),
        auth: resolve(__dirname, 'auth.html'),
        register: resolve(__dirname, 'register.html'),
        pricing: resolve(__dirname, 'pricing.html'),
        promosi: resolve(__dirname, 'promosi.html'),
        event: resolve(__dirname, 'event.html'),
        pulse: resolve(__dirname, 'pulse.html'),
        eventPublic: resolve(__dirname, 'event-public.html'),
        liveResult: resolve(__dirname, 'live-result.html'),
        eventLeaderboard: resolve(__dirname, 'event-leaderboard.html'),
        rank: resolve(__dirname, 'rank.html'),
        result: resolve(__dirname, 'result.html'),
        cetakSertifikat: resolve(__dirname, 'cetak-sertifikat.html'),
        sponsorship: resolve(__dirname, 'sponsorship.html'),
        pitch: resolve(__dirname, 'pitch.html'),
        pitchClient: resolve(__dirname, 'pitch-client.html'),
        media: resolve(__dirname, 'media.html'),
        sponsorRate: resolve(__dirname, 'sponsor-rate.html'),

        // --- 2. DASHBOARD KLUB / PELATIH ---
        dashboard: resolve(__dirname, 'dashboard.html'),
        f1Profile: resolve(__dirname, 'f1-profile.html'),
        f1Id: resolve(__dirname, 'f1-id.html'),

        // --- 3. DASHBOARD EO / PANITIA LOMBA ---
        eventDashboard: resolve(__dirname, 'event-dashboard.html'),
        eventSponsor: resolve(__dirname, 'event-sponsor.html'),
        logoSponsor: resolve(__dirname, 'logosponsor.html'),
        eventPeserta: resolve(__dirname, 'event-peserta.html'),
        settingsLomba: resolve(__dirname, 'settings-lomba.html'),

        // --- 4. MODULE PUSAT CETAK & HEAT BUILDER (PRO) ---
        book: resolve(__dirname, 'book/book.html'),
        heatBuilder: resolve(__dirname, 'book/heat-builder.html'),
        printStartList: resolve(__dirname, 'book/print-startlist.html'),
        eventResult: resolve(__dirname, 'book/event-result.html'),
        eventSertifikatSetup: resolve(__dirname, 'book/event-sertifikat.html'),
        clubTestimony: resolve (__dirname, 'admin-testi.html'),
        pembukuan: resolve(__dirname, 'pembukuan.html'),

        // --- 5. SUPER ADMIN PUSAT ---
        admin: resolve(__dirname, 'admin.html'),
        adminAds: resolve(__dirname, 'admin-ads.html'),
        sponsorPreview: resolve(__dirname, 'sponsor-preview.html'),
        adminApproval: resolve(__dirname, 'admin-approval.html'),
        work: resolve(__dirname, 'work.html'),

        // --- 6. DASHBOARD BRAND / SPONSOR ---
        sponsorPortal: resolve(__dirname, 'sponsor.html'), 
        sponsorAuth: resolve(__dirname, 'sponsor-auth.html'),

        // --- 7. LEAD MAGNET: SCS COACH TOOLS ---
        toolsHub: resolve(__dirname, 'tools/index.html'), 
        toolsInterval: resolve(__dirname, 'tools/interval.html'), 
        toolsStopwatch: resolve(__dirname, 'tools/stopwatch.html'), 

        // --- 8. 🚀 UNOFFICIAL EVENT (KONTINGEN) ---
        unofficialHub: resolve(__dirname, 'unofficial/index.html'), 
      }
    }
  },
  server: {
    port: 3000,
    open: true,
  },
  appType: 'mpa', 
});
