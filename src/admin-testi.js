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

    const ev = allEvents.find(e => e.id === eventId);
    currentTestimonies = ev.testimony || [];

    if (currentTestimonies.length === 0) {
        container.innerHTML = '<p class="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">Event ini belum memiliki testimoni.</p>';
        return;
    }

    container.innerHTML = currentTestimonies.map((t, idx) => `
        <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
            <button onclick="window.deleteTesti(${idx})" class="absolute top-2 right-2 text-red-500 hover:bg-red-100 p-1 rounded font-bold text-xs">Hapus</button>
            <p class="text-sm text-slate-700 italic mb-2">"${t.text}"</p>
            <p class="text-xs font-bold text-slate-900">${t.name} <span class="text-slate-400 font-normal">\vert{} ${t.role}</span></p>
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
        statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-red-100 text-red-600 block";
        return;
    }

    btn.innerText = "Menyuntik Data...";
    btn.disabled = true;

    const newTesti = { text, name, role, timestamp: new Date().toISOString() };
    const updatedTestimonies = [...currentTestimonies, newTesti];

    try {
        const { error } = await supabaseClient
            .from('events')
            .update({ testimony: updatedTestimonies })
            .eq('id', eventId);

        if (error) throw error;

        // Update local state
        const evIndex = allEvents.findIndex(e => e.id === eventId);
        allEvents[evIndex].testimony = updatedTestimonies;

        statusMsg.innerText = "✅ Testimoni berhasil disuntik ke Landing Page!";
        statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-green-100 text-green-700 block mt-3";
        
        // Reset form
        document.getElementById('inputTesti').value = '';
        document.getElementById('inputName').value = '';
        document.getElementById('inputRole').value = '';
        
        renderTestiList(eventId);

    } catch (err) {
        statusMsg.innerText = "Gagal: " + err.message;
        statusMsg.className = "text-sm font-bold text-center rounded-lg p-3 bg-red-100 text-red-600 block mt-3";
    } finally {
        btn.innerText = "Suntik ke Landing Page 🚀";
        btn.disabled = false;
        setTimeout(() => statusMsg.classList.add('hidden'), 3000);
    }
}

// Global function untuk hapus testi
window.deleteTesti = async function(idx) {
    if(!confirm("Yakin hapus testi ini?")) return;
    
    const eventId = document.getElementById('selectEvent').value;
    currentTestimonies.splice(idx, 1);

    try {
        await supabaseClient.from('events').update({ testimony: currentTestimonies }).eq('id', eventId);
        const evIndex = allEvents.findIndex(e => e.id === eventId);
        allEvents[evIndex].testimony = currentTestimonies;
        renderTestiList(eventId);
    } catch (err) {
        alert("Gagal menghapus testi!");
    }
}
