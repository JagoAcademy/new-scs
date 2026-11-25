import { supabaseClient } from './supabase.js';

const FREE_EGRESS_QUOTA_MB = 5120; // 5 GB
const FREE_STORAGE_QUOTA_MB = 1024; // 1 GB

function formatDateID(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function formatGBorMB(mbVal) {
    const num = Number(mbVal) || 0;
    if (num >= 1024) {
        return `${(num / 1024).toFixed(2)} GB`;
    }
    return `${num.toFixed(2)} MB`;
}

function getDaysUntilFirstOfNextMonth() {
    const now = new Date();
    const nextFirst = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
    const diffMs = nextFirst - now;
    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Catat aktivitas egress (dipanggil otomatis di halaman publik atau saat admin buka bukti transfer)
 */
export async function logEgressActivity({ pagePath = window.location.pathname, eventId = null, logType = 'page_view', estMb = 0.60 } = {}) {
    try {
        const params = new URLSearchParams(window.location.search);
        const resolvedEventId = eventId || params.get('id') || null;
        await supabaseClient.from('analytics_logs').insert([{
            page_path: pagePath,
            event_id: resolvedEventId ? String(resolvedEventId) : null,
            log_type: logType,
            est_mb: estMb
        }]);
    } catch (_) {
        // Silent fail agar tidak mengganggu UX pengunjung
    }
}

window.logStoragePreviewEgress = function(estMb = 0.15, label = '/admin/preview-bukti') {
    logEgressActivity({ pagePath: label, logType: 'storage_view', estMb });
};

/**
 * Render Kartu Monitor Egress & Storage Bulanan di admin.html
 */
export async function initEgressMonitor(containerId = 'egressMonitorContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 md:p-5 shadow-sm mb-6 animate-pulse">
            <div class="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
            <div class="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded"></div>
        </div>
    `;

    try {
        const { data, error } = await supabaseClient.rpc('get_monthly_usage_summary');
        if (error) throw error;

        const usedEgressMb = Number(data?.total_egress_mb || 0);
        const quotaEgressMb = Number(data?.quota_limit_mb || FREE_EGRESS_QUOTA_MB);
        const pctEgress = Math.min(100, (usedEgressMb / quotaEgressMb) * 100);

        const usedStorageMb = Number(data?.total_storage_mb || 0);
        const pctStorage = Math.min(100, (usedStorageMb / FREE_STORAGE_QUOTA_MB) * 100);

        const daysToReset = getDaysUntilFirstOfNextMonth();
        const nextResetLabel = formatDateID(data?.next_reset);
        const cycleRangeLabel = `${formatDateID(data?.cycle_start)} – ${formatDateID(data?.cycle_end)}`;

        // Status warna berdasarkan threshold 70% (3.5 GB)
        let statusBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
        let statusText = '🟢 AMAN (< 50%)';
        let barColorClass = 'bg-emerald-500';
        let cardBorderClass = 'border-slate-200 dark:border-slate-700';

        if (pctEgress >= 70) {
            statusBadgeClass = 'bg-red-100 text-red-700 border-red-300 animate-pulse';
            statusText = '🚨 KRITIS ≥ 70% — UPGRADE PRO';
            barColorClass = 'bg-red-600';
            cardBorderClass = 'border-red-400 ring-2 ring-red-500/20';
        } else if (pctEgress >= 50) {
            statusBadgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
            statusText = '🟡 WASPADA (50% – 69%)';
            barColorClass = 'bg-amber-500';
            cardBorderClass = 'border-amber-300';
        }

        const buckets = Array.isArray(data?.buckets) ? data.buckets : [];
        const bucketRowsHtml = buckets.length > 0
            ? buckets.map(b => `
                <div class="flex items-center justify-between py-1.5 px-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200/70 dark:border-slate-700 text-xs">
                    <span class="font-mono font-bold text-slate-700 dark:text-slate-300">🗂️ ${b.bucket_id}</span>
                    <span class="font-bold text-slate-500">${b.total_files} file • <strong class="text-slate-800 dark:text-white">${Number(b.total_size_mb).toFixed(2)} MB</strong></span>
                </div>
            `).join('')
            : `<p class="text-xs text-slate-400 italic">Belum ada file di storage bucket.</p>`;

        container.innerHTML = `
            <div class="bg-white dark:bg-slate-800 rounded-2xl border ${cardBorderClass} p-4 md:p-5 shadow-sm mb-6">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-xs md:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">📊 Supabase Egress & Storage Monitor</span>
                            <span class="text-[10px] font-black px-2.5 py-0.5 rounded-full border ${statusBadgeClass}">${statusText}</span>
                        </div>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                            Siklus Aktif: <strong>${cycleRangeLabel}</strong> • Reset otomatis ke <strong>0 MB</strong> pada <strong>${nextResetLabel}</strong> (${daysToReset} hari lagi)
                        </p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <button id="btnToggleEgressDetail" type="button" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer">
                            Rincian ▾
                        </button>
                        <button id="btnRefreshEgress" type="button" class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer">
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                <!-- PROGRESS BAR EGRESS BULANAN -->
                <div class="mb-2">
                    <div class="flex justify-between items-end text-xs mb-1">
                        <span class="font-bold text-slate-600 dark:text-slate-300">Estimasi Egress Bulan Ini (Reset tiap tgl 1)</span>
                        <span class="font-mono font-black text-slate-900 dark:text-white">
                            ${formatGBorMB(usedEgressMb)} / 5.00 GB <span class="text-slate-400">(${pctEgress.toFixed(1)}%)</span>
                        </span>
                    </div>
                    <div class="w-full h-3 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200/80 dark:border-slate-700 relative">
                        <div class="h-full ${barColorClass} transition-all duration-500 rounded-full" style="width: ${pctEgress}%"></div>
                        <!-- Marker Batas Peringatan 70% (3.5 GB) -->
                        <div class="absolute top-0 bottom-0 w-0.5 bg-red-500/80" style="left: 70%;" title="Batas Peringatan 3.5 GB (70%)"></div>
                    </div>
                </div>

                <!-- RINGKASAN METRIK CEPAT -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs">
                    <div class="bg-slate-50 dark:bg-slate-900/70 p-2.5 rounded-xl">
                        <p class="text-[10px] font-bold text-slate-400 uppercase">Page Views Bln Ini</p>
                        <p class="font-black text-slate-800 dark:text-white mt-0.5">${Number(data?.page_views || 0).toLocaleString('id-ID')}x <span class="text-[10px] font-semibold text-slate-400">(${Number(data?.page_egress_mb || 0).toFixed(1)} MB)</span></p>
                    </div>
                    <div class="bg-slate-50 dark:bg-slate-900/70 p-2.5 rounded-xl">
                        <p class="text-[10px] font-bold text-slate-400 uppercase">Cek Bukti/Media</p>
                        <p class="font-black text-slate-800 dark:text-white mt-0.5">${Number(data?.storage_views || 0).toLocaleString('id-ID')}x <span class="text-[10px] font-semibold text-slate-400">(${Number(data?.storage_view_mb || 0).toFixed(1)} MB)</span></p>
                    </div>
                    <div class="bg-slate-50 dark:bg-slate-900/70 p-2.5 rounded-xl">
                        <p class="text-[10px] font-bold text-slate-400 uppercase">Upload Baru Bln Ini</p>
                        <p class="font-black text-slate-800 dark:text-white mt-0.5">${Number(data?.new_upload_mb || 0).toFixed(2)} MB</p>
                    </div>
                    <div class="bg-slate-50 dark:bg-slate-900/70 p-2.5 rounded-xl">
                        <p class="text-[10px] font-bold text-slate-400 uppercase">Total Storage (1 GB)</p>
                        <p class="font-black ${pctStorage >= 80 ? 'text-red-600' : 'text-slate-800 dark:text-white'} mt-0.5">${usedStorageMb.toFixed(1)} MB <span class="text-[10px] font-semibold text-slate-400">(${pctStorage.toFixed(0)}%)</span></p>
                    </div>
                </div>

                <!-- PANEL RINCIAN BUCKET (COLLAPSIBLE) -->
                <div id="egressBucketDetailPanel" class="hidden mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Rincian File Permanen per Bucket Storage (${data?.total_storage_files || 0} File):</p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        ${bucketRowsHtml}
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btnRefreshEgress')?.addEventListener('click', () => initEgressMonitor(containerId));
        document.getElementById('btnToggleEgressDetail')?.addEventListener('click', () => {
            document.getElementById('egressBucketDetailPanel')?.classList.toggle('hidden');
        });
    } catch (err) {
        container.innerHTML = `
            <div class="bg-amber-50 border border-amber-300 rounded-2xl p-4 mb-6 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <p class="font-black">⚠️ Supabase Egress Monitor Belum Aktif</p>
                    <p class="mt-0.5">Jalankan fungsi SQL <code>get_monthly_usage_summary()</code> di Supabase SQL Editor untuk mengaktifkan meteran kuota otomatis.</p>
                </div>
                <button type="button" onclick="location.reload()" class="px-3 py-1.5 bg-amber-500 text-slate-950 font-black rounded-xl shrink-0 cursor-pointer">Coba Lagi</button>
            </div>
        `;
    }
}

// Auto-init jika dipanggil di admin.html atau halaman publik
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('egressMonitorContainer')) {
        initEgressMonitor('egressMonitorContainer');
    } else if (document.body?.dataset?.trackPageview === 'true') {
        logEgressActivity({ pagePath: window.location.pathname, logType: 'page_view', estMb: 0.60 });
    }
});
