document.addEventListener('DOMContentLoaded', () => {
    const setupArea = document.getElementById('setupArea');
    const activeArea = document.getElementById('activeArea');
    const bgBody = document.getElementById('bgBody');
    
    const displayTime = document.getElementById('displayTime');
    const displayReps = document.getElementById('displayReps');
    const progressCircle = document.getElementById('progressCircle');
    const circleLength = 2 * Math.PI * 46; 
    
    let totalReps = 0;
    let currentRep = 0;
    let intervalTotalSeconds = 0;
    let timeRemaining = 0;
    let timer = null;
    let isPaused = false;

    // Beep sound pakai AudioContext biar jalan di semua HP
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function playBeep(hz, duration, type) {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(hz, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);
    }

    document.getElementById('btnStart').addEventListener('click', () => {
        totalReps = parseInt(document.getElementById('inputReps').value) || 0;
        const mins = parseInt(document.getElementById('inputMin').value) || 0;
        const secs = parseInt(document.getElementById('inputSec').value) || 0;
        
        intervalTotalSeconds = (mins * 60) + secs;
        
        if (totalReps <= 0 || intervalTotalSeconds <= 0) return alert("Setting tidak valid!");

        currentRep = totalReps;
        setupArea.classList.add('hidden');
        activeArea.classList.replace('hidden', 'flex');
        
        startRep();
    });

    document.getElementById('btnPause').addEventListener('click', (e) => {
        isPaused = !isPaused;
        e.target.innerText = isPaused ? "RESUME" : "PAUSE";
    });

    document.getElementById('btnStop').addEventListener('click', () => {
        clearInterval(timer);
        activeArea.classList.replace('flex', 'hidden');
        setupArea.classList.remove('hidden');
        bgBody.className = "bg-slate-950 text-slate-200 min-h-screen transition-colors duration-300 flex flex-col";
    });

    function startRep() {
        if (currentRep <= 0) {
            playBeep(800, 1, 'sine');
            document.getElementById('btnStop').click();
            alert("Set Selesai! Kerja Bagus Coach!");
            return;
        }

        displayReps.innerText = currentRep;
        timeRemaining = intervalTotalSeconds;
        updateDisplay();
        
        bgBody.classList.remove('flash-green', 'flash-red');
        void bgBody.offsetWidth; // Trigger reflow
        bgBody.classList.add('flash-green'); // Flash Hijau tanda jalan
        playBeep(600, 0.5, 'square');

        if(timer) clearInterval(timer);
        
        timer = setInterval(() => {
            if (isPaused) return;
            
            timeRemaining--;
            updateDisplay();

            // Peringatan 3 detik terakhir (Beep pendek)
            if (timeRemaining <= 3 && timeRemaining > 0) {
                bgBody.classList.remove('flash-red');
                void bgBody.offsetWidth;
                bgBody.classList.add('flash-red');
                playBeep(400, 0.2, 'square');
            }

            if (timeRemaining <= 0) {
                clearInterval(timer);
                currentRep--;
                startRep();
            }
        }, 1000);
    }

    function updateDisplay() {
        const m = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
        const s = (timeRemaining % 60).toString().padStart(2, '0');
        displayTime.innerText = `${m}:${s}`;

        const percent = timeRemaining / intervalTotalSeconds;
        progressCircle.style.strokeDashoffset = 1000 - (percent * 1000);
        
        if (timeRemaining <= 5) progressCircle.style.stroke = '#ef4444'; // Merah
        else if (timeRemaining <= 15) progressCircle.style.stroke = '#f59e0b'; // Kuning
        else progressCircle.style.stroke = '#10b981'; // Hijau
    }
});
