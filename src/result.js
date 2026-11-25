import { supabaseClient } from './supabase.js';

let currentEventId = null;
let allHeats = [];
let currentSelectedEventNumber = null;
let activeSponsors = [];
let activeRegFilter = null;

let refreshInterval = 30;
let timeLeft = refreshInterval;
let timerId = null;

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function isSwimmerStillActive(atlet) {
    if (!atlet || !atlet.nama) return false;
    if (!activeRegFilter) return true;

    if (activeRegFilter.hasIds && atlet.id_pendaftaran) {
        return activeRegFilter.ids.has(String(atlet.id_pendaftaran));
    }
    if (atlet.f1_id && activeRegFilter.f1Ids.has(String(atlet.f1_id).trim().toLowerCase())) {
        return true;
    }
    const cleanName = String(atlet.nama).trim().toLowerCase();
    return activeRegFilter.names.has(cleanName);
}

async function fetchActiveRegistrationFilter(eventId) {
    let validRegs = [];

    try {
        const { data: regRows, error: regErr } = await supabaseClient
            .from('event_registrations')
            .select('id, f1_id, nama_peserta, klub_asal, status_pembayaran')
            .eq('event_id', eventId);

        if (!regErr && Array.isArray(regRows) && regRows.length > 0) {
            validRegs = regRows.filter(
                r => String(r.status_pembayaran || '').toLowerCase() === 'lunas'
            );
        }
    } catch (_) {}

    if (validRegs.length === 0) {
        try {
            const { data: rpcRows, error: rpcErr } = await supabaseClient
                .rpc('get_public_event_contingents', { p_event_id: String(eventId) });

            if (!rpcErr && Array.isArray(rpcRows) && rpcRows.length > 0) {
                validRegs = rpcRows.filter(
                    r => String(r.status_pembayaran || '').toLowerCase() === 'lunas'
                );
            }
        } catch (_) {}
    }

    if (validRegs.length === 0) return null;

    const ids = new Set();
    const f1Ids = new Set();
    const names = new Set();
    const clubById = new Map();
    const clubByF1 = new Map();
    const clubByName = new Map();

    validRegs.forEach(r => {
        if (r.id) {
            const sid = String(r.id);
            ids.add(sid);
            clubById.set(sid, r.klub_asal || '');
        }
        if (r.f1_id) {
            const sf1 = String(r.f1_id).trim().toLowerCase();
            f1Ids.add(sf1);
            clubByF1.set(sf1, r.klub_asal || '');
        }
        if (r.nama_peserta) {
            const snm = String(r.nama_peserta).trim().toLowerCase();
            names.add(snm);
            clubByName.set(snm, r.klub_asal || '');
        }
    });

    return {
        hasIds: ids.size > 0,
        ids,
        f1Ids,
        names,
        clubById,
        clubByF1,
        clubByName
    };
}

// 1️⃣ FUNGSI PELACAK: Menghitung Impression (Tayangan)
async function trackImpressions(sponsorIdsArray) {
    if (!sponsorIdsArray || sponsorIdsArray.length === 0 || !currentEventId) return;

    const deviceKey = `f1_visited_event_${currentEventId}`;
    const isNewDevice = !localStorage.getItem(deviceKey);

    if (isNewDevice) {
        localStorage.setItem(deviceKey, 'true');
    }

    try {
        const promises = sponsorIdsArray.map(spId =>
            supabaseClient.rpc('increment_impression', {
                p_sponsor_id: spId,
                p_event_id: parseInt(currentEventId),
                p_is_new_device: isNewDevice
            })
        );

        await Promise.all(promises);
        console.log("Analytics: Impressions berhasil dicatat.");
    } catch (err) {
        console.error("Gagal mencatat impression:", err);
    }
}

// 2️⃣ FUNGSI PELACAK: Menghitung Click (Klik Banner)
window.trackSponsorClick = async function(sponsorId, urlDestination) {
    if (!currentEventId || !sponsorId) return;

    try {
        supabaseClient.rpc('increment_click', {
            p_sponsor_id: sponsorId,
            p_event_id: parseInt(currentEventId)
        }).then(({ error }) => {
            if (error) console.error("Gagal mencatat klik:", error);
        });

        if (urlDestination && urlDestination !== '#') {
            window.open(urlDestination, '_blank');
        }
    } catch (err) {
        console.error("Error tracker klik:", err);
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentEventId = urlParams.get('id');

    if (!currentEventId) return alert("Halaman tidak valid. ID Event tidak ditemukan!");

    await fetchEventName();
    await fetchSponsors();
    await fetchHeatsData(true);

    startAutoRefresh();
});

async function fetchEventName() {
    try {
        const { data } = await supabaseClient
            .from('events')
            .select('event_name, config')
            .eq('id', currentEventId)
            .single();

        if (data) {
            document.getElementById('headerEventName').innerText = data.event_name;

            const config = data.config || {};
            const headerImgUrl = config.kop_surat || config.header_image || config.banner;

            if (headerImgUrl) {
                const bannerWrapper = document.getElementById('eventBannerWrapper');
                const bannerImg = document.getElementById('eventBannerImg');
                if (bannerWrapper && bannerImg) {
                    bannerImg.src = headerImgUrl;
                    bannerWrapper.classList.remove('hidden');
                }
            }
        }
    } catch (err) { console.error(err); }
}

async function fetchSponsors() {
    const wrapper = document.getElementById('partnerWrapper');
    if (!wrapper) return;

    try {
        const { data: linkData, error: linkErr } = await supabaseClient
            .from('event_sponsors')
            .select('sponsor_ids')
            .eq('event_id', currentEventId)
            .single();

        if (linkErr || !linkData || !linkData.sponsor_ids || linkData.sponsor_ids.length === 0) return;

        const { data: sponsors, error: spErr } = await supabaseClient
            .from('master_sponsors')
            .select('*')
            .in('id', linkData.sponsor_ids);

        if (spErr || !sponsors || sponsors.length === 0) return;

        activeSponsors = sponsors;
        trackImpressions(sponsors.map(sp => sp.id));

        let html = `
            <div class="w-full mb-6 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 text-center">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">This event supported by:</span>
                <div class="flex items-center justify-center gap-4 md:gap-6 flex-wrap w-full">
        `;

        const boxWidth = sponsors.length === 1 ? '160px' : (sponsors.length === 2 ? '120px' : '90px');

        sponsors.forEach(sp => {
            const logo = sp.logo_url || '/images/logo.png';
            const link = sp.link_url || '#';

            html += `
                <button onclick="trackSponsorClick(${sp.id}, '${escapeHtml(link)}')" 
                   class="bg-white p-2 rounded-xl border border-slate-100 shadow-sm flex items-center justify-center shrink-0 transition-transform hover:scale-105 cursor-pointer outline-none focus:outline-none" 
                   style="aspect-ratio: 16/9; width: ${boxWidth}; max-width: 100%;">
                    <img src="${escapeHtml(logo)}" 
                         alt="${escapeHtml(sp.sponsor_name)}" 
                         title="${escapeHtml(sp.sponsor_name)}" 
                         class="w-full h-full object-contain pointer-events-none"
                         loading="lazy"
                         onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\\'text-[10px] font-black text-slate-400 text-center uppercase\\'>${escapeHtml(sp.sponsor_name)}</span>';">
                </button>
            `;
        });

        html += `
                </div>
            </div>
        `;

        wrapper.innerHTML = html;

    } catch (err) {
        console.error("Gagal menarik data sponsor:", err);
    }
}

async function fetchHeatsData(isFirstLoad = false) {
    const icon = document.getElementById('iconRefresh');
    icon.classList.add('spin-anim');

    try {
        const [heatsRes, regFilter] = await Promise.all([
            supabaseClient
                .from('event_heats')
                .select('*')
                .eq('event_id', currentEventId)
                .order('event_number', { ascending: true })
                .order('heat_number', { ascending: true }),
            fetchActiveRegistrationFilter(currentEventId)
        ]);

        if (heatsRes.error) throw heatsRes.error;
        allHeats = heatsRes.data || [];
        activeRegFilter = regFilter;

        if (isFirstLoad) {
            populateEventDropdown();
        } else {
            if (currentSelectedEventNumber) {
                renderResults(currentSelectedEventNumber);
            }
        }
    } catch (err) {
        console.error("Gagal memuat data Live Result:", err);
    } finally {
        setTimeout(() => icon.classList.remove('spin-anim'), 500);
    }
}

function populateEventDropdown() {
    const selectEvent = document.getElementById('selectEvent');
    selectEvent.innerHTML = '<option value="">-- Pilih Nomor Lomba --</option>';

    const uniqueEvents = [...new Map(allHeats.map(item => [item.event_number, item])).values()];
    uniqueEvents.forEach(ev => {
        const label = `Event #${ev.event_number}: ${ev.nomor_lomba} - ${ev.gender} - ${ev.kelompok_umur}`;
        selectEvent.innerHTML += `<option value="${ev.event_number}">${escapeHtml(label)}</option>`;
    });

    selectEvent.addEventListener('change', (e) => {
        currentSelectedEventNumber = e.target.value;
        renderResults(currentSelectedEventNumber);
    });

    document.getElementById('btnShowAll').addEventListener('click', () => {
        selectEvent.value = "";
        currentSelectedEventNumber = 'ALL';
        renderResults('ALL');
    });
}

function renderResults(eventNumber) {
    const container = document.getElementById('resultContainer');

    if (!eventNumber) {
        container.innerHTML = `
        <div class="text-center py-10 opacity-50">
            <div class="text-4xl mb-3">🏊‍♂️</div>
            <h3 class="text-sm font-bold text-slate-600">Pilih lomba di atas untuk melihat hasil Heat.</h3>
        </div>`;
        return;
    }

    let heatsToShow = [];
    if (eventNumber === 'ALL') {
        heatsToShow = allHeats;
    } else {
        heatsToShow = allHeats.filter(h => String(h.event_number) === String(eventNumber));
    }

    let htmlContent = '';

    heatsToShow.forEach((heat, index) => {
        let lanesHtml = `
            <div class="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-2 px-1">
                <div class="w-8 text-center">LN</div>
                <div class="flex-1 pl-2">ATLET & KLUB</div>
                <div class="w-20 text-right pr-1">WAKTU</div>
            </div>
        `;

        const rawLanes = Array.isArray(heat.lanes_data) ? heat.lanes_data : [];
        const activeLanes = rawLanes.filter(isSwimmerStillActive);

        activeLanes.forEach(atlet => {
            let timeDisplay = atlet.waktu_tempuh || 'NT';
            let timeColorClass = "text-slate-400";

            if (timeDisplay !== 'NT' && timeDisplay !== 'DQ') {
                timeColorClass = "text-emerald-600";
            } else if (timeDisplay === 'DQ') {
                timeColorClass = "text-red-500";
            }

            let latestKlub = atlet.klub || 'Individu';
            if (activeRegFilter) {
                if (atlet.id_pendaftaran && activeRegFilter.clubById.has(String(atlet.id_pendaftaran))) {
                    latestKlub = activeRegFilter.clubById.get(String(atlet.id_pendaftaran)) || latestKlub;
                } else if (atlet.f1_id && activeRegFilter.clubByF1.has(String(atlet.f1_id).trim().toLowerCase())) {
                    latestKlub = activeRegFilter.clubByF1.get(String(atlet.f1_id).trim().toLowerCase()) || latestKlub;
                } else {
                    const nmKey = String(atlet.nama).trim().toLowerCase();
                    if (activeRegFilter.clubByName.has(nmKey)) {
                        latestKlub = activeRegFilter.clubByName.get(nmKey) || latestKlub;
                    }
                }
            }

            lanesHtml += `
            <div class="flex items-center py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors px-1">
                <div class="w-8 flex justify-center shrink-0">
                    <div class="w-5 h-5 rounded bg-slate-200 text-slate-600 text-[10px] font-black flex items-center justify-center">${atlet.lane}</div>
                </div>
                <div class="flex-1 pl-2 flex flex-col sm:flex-row sm:items-center min-w-0">
                    <p class="text-xs font-black text-slate-800 uppercase truncate mr-2">${escapeHtml(atlet.nama)}</p>
                    <p class="text-[9px] font-bold text-slate-400 uppercase truncate sm:border-l sm:border-slate-300 sm:pl-2 mt-0.5 sm:mt-0">${escapeHtml(latestKlub)}</p>
                </div>
                <div class="w-20 shrink-0 text-right pr-1">
                    <span class="font-mono text-xs font-black tracking-wider ${timeColorClass}">
                        ${escapeHtml(timeDisplay)}
                    </span>
                </div>
            </div>`;
        });

        if (activeLanes.length === 0) {
            lanesHtml += `<p class="text-[10px] text-slate-400 italic text-center py-3">Tidak ada data atlet di Seri/Heat ini.</p>`;
        }

        let eventSponsorHeader = '';
        if (activeSponsors.length > 0) {
            const heatGender = String(heat.gender || '').toUpperCase();
            const heatKU = String(heat.kelompok_umur || '').toUpperCase();

            let matchedSponsors = activeSponsors.filter(sp => {
                let matchGender = false;
                let matchUmur = false;

                if (!sp.target_gender || sp.target_gender === 'ALL') {
                    matchGender = true;
                } else {
                    matchGender = heatGender.includes(sp.target_gender.toUpperCase());
                }

                if (!sp.target_umur || sp.target_umur === 'ALL') {
                    matchUmur = true;
                } else if (sp.target_umur === 'KIDS') {
                    const kidsKeywords = ['PEMULA', 'TAHUN', 'THN', 'SD', 'TK', 'GRUP', 'GROUP', 'KIDS', 'UMUR', 'YOUTH'];
                    matchUmur = kidsKeywords.some(kw => heatKU.includes(kw));
                } else if (sp.target_umur === 'ADULT') {
                    const adultKeywords = ['OPEN', 'SENIOR', 'DEWASA', 'MAHASISWA', 'MASTER', 'BEBAS'];
                    matchUmur = adultKeywords.some(kw => heatKU.includes(kw));
                }

                return matchGender && matchUmur;
            });

            if (matchedSponsors.length === 0) {
                matchedSponsors = activeSponsors.filter(sp => (!sp.target_gender || sp.target_gender === 'ALL') && (!sp.target_umur || sp.target_umur === 'ALL'));
            }

            if (matchedSponsors.length === 0) {
                matchedSponsors = activeSponsors;
            }

            const spIndex = index % matchedSponsors.length;
            const sp = matchedSponsors[spIndex];
            const spLogo = sp.logo_url || '/images/logo.png';
            const link = sp.link_url || '#';

            eventSponsorHeader = `
                <button onclick="trackSponsorClick(${sp.id}, '${escapeHtml(link)}')" class="w-full outline-none focus:outline-none cursor-pointer flex items-center justify-between bg-slate-50 hover:bg-amber-50/80 transition-colors border-b border-slate-200 px-4 py-3 -mx-3 -mt-3 md:-mx-4 md:-mt-4 mb-3 rounded-t-xl group">
                    <div class="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-2 flex-1 min-w-0 pr-4 text-left">
                        <span class="text-[9px] md:text-[10px] font-black text-slate-400 group-hover:text-amber-500 uppercase tracking-widest transition-colors shrink-0">
                            Supported By:
                        </span>
                        <span class="text-xs md:text-sm font-bold text-slate-700 group-hover:text-amber-700 truncate transition-colors leading-tight">
                            ${escapeHtml(sp.sponsor_name)}
                        </span>
                    </div>
                    <div class="bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center shrink-0 transition-transform group-hover:scale-105" 
                         style="aspect-ratio: 16/9; width: 72px;">
                        <img src="${escapeHtml(spLogo)}" 
                             alt="${escapeHtml(sp.sponsor_name)}" 
                             class="w-full h-full object-contain pointer-events-none" 
                             loading="lazy" 
                             onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\\'text-[8px] font-bold text-slate-400 text-center leading-tight uppercase\\'>${escapeHtml(sp.sponsor_name)}</span>';">
                    </div>
                </button>
            `;
        }

        htmlContent += `
        <div class="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 mb-4 overflow-hidden relative">
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-slate-300 z-10"></div>
            ${eventSponsorHeader}
            <div class="pl-2 mb-3">
                <h3 class="text-xs font-black text-slate-800 uppercase leading-tight">Event #${heat.event_number}: ${escapeHtml(heat.nomor_lomba)} - ${escapeHtml(heat.gender)}</h3>
                <p class="text-[9px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">SERI/HEAT ${heat.heat_number} <span class="text-slate-300 mx-1">|</span> Dari ${heat.total_heats}</p>
            </div>
            <div class="bg-slate-50/50 rounded-lg p-2 border border-slate-100">
                ${lanesHtml}
            </div>
        </div>`;
    });

    container.innerHTML = htmlContent;
}

function startAutoRefresh() {
    const textEl = document.getElementById('countdownText');
    const barEl = document.getElementById('refreshProgressBar');

    timerId = setInterval(() => {
        timeLeft--;
        textEl.innerText = `${timeLeft}s`;

        const percent = (timeLeft / refreshInterval) * 100;
        barEl.style.width = `${percent}%`;

        if (timeLeft <= 0) {
            triggerManualRefresh();
        }
    }, 1000);
}

document.getElementById('btnRefresh').addEventListener('click', () => {
    triggerManualRefresh();
});

function triggerManualRefresh() {
    fetchHeatsData(false);

    timeLeft = refreshInterval;
    document.getElementById('countdownText').innerText = `${timeLeft}s`;
    document.getElementById('refreshProgressBar').style.width = `100%`;
}
