import { supabaseClient } from './supabase.js';

let allEvents = [];
let currentTestimonies = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadEvents();

    document.getElementById('selectEvent').addEventListener('change', (e) => {
        renderTestiList(e.target.value);
    });

    document.getElementById('btnSaveTesti').addEventListener('click', saveTestimony);
});

async function loadEvents() {
    const selectEvent = document.getElementById('selectEvent');
    try {
        const { data, error } = await supabaseClient.from('events').select('id, event_name, testimony');
        if (error) throw error;
        
        allEvents = data;
        selectEvent.innerHTML = '<option value="">-- Pilih Event / Klub --</option>';
        data.forEach(ev => {
            selectEvent.innerHTML += `<option value="${ev.id}">${ev.event_name}</option>`;
        });
    } catch (err) {
        selectEvent.innerHTML = '<option value="">Gagal memuat event</option>';
        console.error(err);
    }
}

function renderTestiList(eventId) {
    const container = document.getElementById('testiListContainer');
    if (!eventId) {
        container.innerHTML = '<p class="text-sm text-slate-500 italic">Pilih event di atas untuk melihat testimoninya.</p>';
        currentTestimonies = [];
        return;
    }

    const ev = allEvents.find(e => String(e.id) === String(eventId));
    
    if (!ev) {
        container.innerHTML = '<p class="text-sm text-red-500">Event tidak ditemukan di memori.</p>';
        return;
    }

    currentTestimonies = ev.testimony || [];

    if (currentTestimonies.length === 0) {
        container.innerHTML = '<p class="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">Bank Testimoni masih kosong.</p>';
        return;
    }

    // Render daftar dengan Badge Status & Tombol Action
    container.innerHTML = currentTestimonies.map((t, idx) => `
        <div class="p-4 ${t.isPublished ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'} border rounded-xl relative mt-2 transition-colors">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                <span class="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${t.isPublished ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}">
                    ${t.isPublished ? '🟢 Sedang Tayang' : '🟡 Di Bank Testi'}
                </span>
                <div class="flex gap-2 w-full sm:w-auto">
                    <button onclick="window.togglePublish(${idx})" class="flex-1 sm:flex-none text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${t.isPublished ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-blue-600 text-white hover:bg-blue-700'}">
                        ${t.isPublished ? 'Tarik Turun ❌' : 'Suntik ke Landing Page 🚀'}
                    </button>
                    <button onclick="window.deleteTesti(${idx})" class="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300">Hapus</button>
                </div>
            </div>
            <p class="text-sm text-slate-700 italic mb-2 leading-relaxed">"${t.text}"</p>
            <p class="text-xs font-bold text-slate-900">${t.name} <span class="text-slate-400 font-normal">| ${t.role}</span></p>
        </div>
    `).join('');
}

async function saveTestimony() {
    const eventId = document.getElementById('selectEvent').value;
    const text = document.getElementById('inputTesti').value.trim();
    const name = document.getElementById('inputName').value.trim();
    const role = document.getElementById('inputRole').value.trim();
    const statusMsg = document.getElementById('statusMsg');
    const btn = document.getElementById('btnSaveTesti');

    if (!eventId || !text || !name || !role) {
        statusMsg.innerText = "Semua form wajib diisi!";
        statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-red-100 text-red-600 block mt-2";
        return;
    }

    // 1. CEK ANTI-DUPLICATE
    const isDuplicate = currentTestimonies.some(t => t.text.toLowerCase() === text.toLowerCase());
    if (isDuplicate) {
        statusMsg.innerText = "Ditolak: Testimoni dengan teks ini sudah ada di bank!";
        statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-red-100 text-red-600 block mt-2";
        return;
    }

    btn.innerText = "Menyimpan ke Bank...";
    btn.disabled = true;

    // Default saat dibuat: isPublished = false
    const newTesti = { text, name, role, timestamp: new Date().toISOString(), isPublished: false };
    const updatedTestimonies = [...currentTestimonies, newTesti];

    try {
        const { error } = await supabaseClient
            .from('events')
            .update({ testimony: updatedTestimonies })
            .eq('id', eventId);

        if (error) throw error;

        const evIndex = allEvents.findIndex(e => String(e.id) === String(eventId));
        if(evIndex !== -1) allEvents[evIndex].testimony = updatedTestimonies;

        statusMsg.innerText = "✅ Tersimpan di Bank Testi! Silakan klik 'Suntik' di bawah untuk menayangkan.";
        statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-green-100 text-green-700 block mt-3";
        
        document.getElementById('inputTesti').value = '';
        document.getElementById('inputName').value = '';
        document.getElementById('inputRole').value = '';
        
        renderTestiList(eventId);

    } catch (err) {
        statusMsg.innerText = "Gagal: " + err.message;
        statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-red-100 text-red-600 block mt-3";
    } finally {
        btn.innerText = "Simpan ke Bank Testi 💾";
        btn.disabled = false;
        setTimeout(() => statusMsg.classList.add('hidden'), 4000);
    }
}

// Fitur Toggle: Publish / Unpublish
window.togglePublish = async function(idx) {
    const eventId = document.getElementById('selectEvent').value;
    
    // Balik statusnya (True jadi False, False jadi True)
    currentTestimonies[idx].isPublished = !currentTestimonies[idx].isPublished;

    try {
        await supabaseClient.from('events').update({ testimony: currentTestimonies }).eq('id', eventId);
        
        const evIndex = allEvents.findIndex(e => String(e.id) === String(eventId));
        if(evIndex !== -1) allEvents[evIndex].testimony = currentTestimonies;
        
        renderTestiList(eventId);
    } catch (err) {
        alert("Gagal mengubah status tayang!");
        // Revert status kalau gagal
        currentTestimonies[idx].isPublished = !currentTestimonies[idx].isPublished;
    }
}

window.deleteTesti = async function(idx) {
    if(!confirm("Yakin hapus testimoni ini dari database?")) return;
    
    const eventId = document.getElementById('selectEvent').value;
    currentTestimonies.splice(idx, 1);

    try {
        await supabaseClient.from('events').update({ testimony: currentTestimonies }).eq('id', eventId);
        
        const evIndex = allEvents.findIndex(e => String(e.id) === String(eventId));
        if(evIndex !== -1) allEvents[evIndex].testimony = currentTestimonies;
        
        renderTestiList(eventId);
    } catch (err) {
        alert("Gagal menghapus testi!");
    }
}