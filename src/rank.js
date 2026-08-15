// ============================================================================
// DUMMY SCRIPT UNTUK SHOWCASE PUBLIK (ANTI-DATABASE ERROR)
// ============================================================================

// Data Klub Asli dari Panel Super Admin SCS
const clubDatabase = [
    "DENIRA AKUATIK", "GSA Swim", "Kinara Swim Club", "Minang Akuatik", 
    "Bimi Mbojo Swim", "Deli Swim Club", "Tuah Sakato Swim", "The Speed", 
    "Energy Club", "Pesona Club", "Echo Speed", "Street Club", 
    "The Legend Team", "Global Club", "Kompak Team", "Sunrise Club", 
    "Goalspeed", "Mahakam Swim Team", "Galunggung Swim", "Samawa Swimming Club", 
    "Bagus Juara Academy", "Best Speed", "Fast Swimm Majalengka", "Jago Renang Academy"
];

const maleNames = [
    "Jazreel", "Rafisqy Hafiz", "Mochammad Rayhan", "Alresa Syawal", "Muhammad Arroyan", 
    "M Athalla Rafif", "Athafariz Ikhsan", "Nicholas Alvarendra", "Matthew Gevarel", "Gibran Dirgantara",
    "Bima Saputra", "Raditya Dika", "Fajar Nugroho", "Dimas Anggara", "Rizky Febrian", "Kevin Sanjaya"
];

const femaleNames = [
    "Afla Izzatunnisa", "Aira Sartika", "Aisyah Azkadina", "Aleena Asiyah", "Alessa Putri", 
    "Nabila Maharani", "Salsabila Firdaus", "Zahra Larasati", "Kirana Laras", "Nadya Kusuma",
    "Syifa Nur", "Tiara Andini", "Keysha Maharani", "Chelsea Islan", "Raisa Andriana"
];

// State Saat Ini
let currentGender = 'Putra';
let currentDistance = '50m';
let currentStroke = 'Gaya Bebas';

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    generateAndRenderDummy(); // Render awal
});

function setupEventListeners() {
    // 1. Toggle Gender (Biru vs Pink)
    const genderBtns = document.querySelectorAll('.gender-btn');
    genderBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetGender = e.target.getAttribute('data-gender');
            if (currentGender === targetGender) return; // Kalau udah aktif, biarin
            
            currentGender = targetGender;
            
            // Reset semua tombol ke Inactive (abu-abu/putih)
            genderBtns.forEach(b => {
                b.className = "gender-btn px-10 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm";
                if(b.getAttribute('data-gender') === 'Putra') {
                    b.classList.add('bg-white', 'text-blue-500', 'border', 'border-blue-200', 'hover:bg-blue-50');
                } else {
                    b.classList.add('bg-white', 'text-pink-500', 'border', 'border-pink-200', 'hover:bg-pink-50');
                }
            });

            // Set Tombol Aktif
            if (currentGender === 'Putra') {
                e.target.className = "gender-btn active px-10 py-2.5 rounded-full font-black text-sm transition-all bg-blue-600 text-white shadow-lg shadow-blue-200 border border-blue-600";
            } else {
                e.target.className = "gender-btn active px-10 py-2.5 rounded-full font-black text-sm transition-all bg-pink-500 text-white shadow-lg shadow-pink-200 border border-pink-500";
            }

            generateAndRenderDummy();
        });
    });

    // 2. Dropdown Jarak
    document.getElementById('selectDistance').addEventListener('change', (e) => {
        currentDistance = e.target.value;
        generateAndRenderDummy();
    });

    // 3. Dropdown Gaya
    document.getElementById('selectStroke').addEventListener('change', (e) => {
        currentStroke = e.target.value;
        generateAndRenderDummy();
    });
}

// Pseudo-Random Generator (Biar datanya nggak lompat-lompat tiap ganti filter)
function seededRandom(seedStr) {
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
        hash = Math.imul(31, hash) + seedStr.charCodeAt(i) | 0;
    }
    let x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
}

function formatWaktu(seconds) {
    let m = Math.floor(seconds / 60);
    let s = Math.floor(seconds % 60);
    let ms = Math.floor((seconds % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

function generateAndRenderDummy() {
    const listNames = currentGender === 'Putra' ? maleNames : femaleNames;
    const baseSeed = currentGender + currentDistance + currentStroke;
    
    let dummyData = [];
    
    // Kalkulasi Waktu Realistis berdasarkan jarak dan gaya
    let numericDist = parseInt(currentDistance.replace('m', ''));
    let baseTime = (numericDist / 50) * 26.5; // Anggap 50m bebas standar 26.5 detik
    
    if (currentStroke === 'Gaya Dada') baseTime *= 1.25;
    if (currentStroke === 'Gaya Punggung') baseTime *= 1.15;
    if (currentStroke === 'Gaya Kupu-kupu') baseTime *= 1.1;
    if (currentGender === 'Putri') baseTime *= 1.12;

    for (let i = 0; i < 10; i++) {
        let nameIdx = Math.floor(seededRandom(baseSeed + "name" + i) * listNames.length);
        let clubIdx = Math.floor(seededRandom(baseSeed + "club" + i) * clubDatabase.length);
        
        // Jarak waktu antar perenang sekitar 0.2 - 0.8 detik
        let timeIncrement = (i * 0.4) + (seededRandom(baseSeed + "time" + i) * 0.5); 
        
        dummyData.push({
            rank: i + 1,
            nama: listNames[nameIdx],
            klub: clubDatabase[clubIdx],
            waktu: formatWaktu(baseTime + timeIncrement)
        });
    }

    renderToHTML(dummyData);
}

function renderToHTML(data) {
    const podiumContainer = document.getElementById('podiumContainer');
    const listContainer = document.getElementById('listContainer');
    
    // Warnai teks podium & list sesuai gender
    const accentColor = currentGender === 'Putra' ? 'blue-900' : 'pink-600';
    const podium2Border = currentGender === 'Putra' ? 'border-blue-200' : 'border-pink-200';
    
    // 1. RENDER PODIUM (Rank 2, 1, 3)
    let podiumHTML = `
        <!-- RANK 2 -->
        <div class="bg-white rounded-t-3xl shadow-lg w-28 md:w-40 flex flex-col items-center p-4 md:p-5 border-t-4 border-slate-300 relative h-40 md:h-44 justify-end hover:-translate-y-2 transition-transform cursor-pointer">
            <div class="absolute -top-6 w-12 h-12 bg-slate-100 rounded-full border-2 border-white flex items-center justify-center font-black text-slate-500 shadow-sm text-lg">#2</div>
            <p class="font-bold text-xs md:text-sm text-center text-slate-800 line-clamp-1 w-full truncate">${data[1].nama}</p>
            <p class="text-slate-400 text-[8px] md:text-[9px] uppercase tracking-wider truncate w-full text-center mt-1">${data[1].klub}</p>
            <p class="font-black text-base md:text-lg text-${accentColor} mt-2">${data[1].waktu}</p>
        </div>

        <!-- RANK 1 -->
        <div class="bg-white rounded-t-3xl shadow-2xl w-32 md:w-48 flex flex-col items-center p-4 md:p-6 border-t-4 border-amber-400 relative h-48 md:h-56 justify-end z-10 transform scale-105 hover:scale-110 transition-transform cursor-pointer">
            <div class="absolute -top-8 w-16 h-16 bg-gradient-to-br from-amber-300 to-yellow-500 rounded-full border-4 border-white flex items-center justify-center font-black text-white shadow-md text-2xl">#1</div>
            <p class="font-black text-sm md:text-base text-center text-slate-900 line-clamp-2 leading-tight w-full truncate">${data[0].nama}</p>
            <p class="text-slate-500 text-[9px] md:text-[10px] uppercase tracking-wider truncate w-full text-center mt-1.5">${data[0].klub}</p>
            <p class="font-black text-xl md:text-2xl text-${accentColor} mt-3">${data[0].waktu}</p>
        </div>

        <!-- RANK 3 -->
        <div class="bg-white rounded-t-3xl shadow-lg w-28 md:w-40 flex flex-col items-center p-4 md:p-5 border-t-4 border-orange-600 relative h-36 md:h-40 justify-end hover:-translate-y-2 transition-transform cursor-pointer">
            <div class="absolute -top-6 w-12 h-12 bg-orange-50 rounded-full border-2 border-white flex items-center justify-center font-black text-orange-700 shadow-sm text-lg">#3</div>
            <p class="font-bold text-xs md:text-sm text-center text-slate-800 line-clamp-1 w-full truncate">${data[2].nama}</p>
            <p class="text-slate-400 text-[8px] md:text-[9px] uppercase tracking-wider truncate w-full text-center mt-1">${data[2].klub}</p>
            <p class="font-black text-base md:text-lg text-${accentColor} mt-2">${data[2].waktu}</p>
        </div>
    `;
    podiumContainer.innerHTML = podiumHTML;

    // 2. RENDER LIST (Rank 4 - 10)
    let listHTML = '';
    const hoverBg = currentGender === 'Putra' ? 'hover:bg-blue-50' : 'hover:bg-pink-50';
    const rankColor = currentGender === 'Putra' ? 'group-hover:text-blue-400' : 'group-hover:text-pink-400';

    for (let i = 3; i < 10; i++) {
        listHTML += `
            <div class="flex items-center justify-between p-4 md:p-6 ${hoverBg} transition-colors cursor-pointer group">
                <div class="flex items-center gap-4 md:gap-6 min-w-0">
                    <span class="font-black text-slate-300 w-6 text-center text-lg ${rankColor} transition-colors">${data[i].rank}</span>
                    <div class="min-w-0">
                        <p class="font-extrabold text-slate-800 text-sm md:text-base truncate">${data[i].nama}</p>
                        <p class="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider truncate mt-1">🏠 ${data[i].klub}</p>
                    </div>
                </div>
                <div class="font-mono font-black text-${accentColor} text-base md:text-lg shrink-0 ml-4">${data[i].waktu}</div>
            </div>
        `;
    }
    listContainer.innerHTML = listHTML;
}
