document.addEventListener('DOMContentLoaded', () => {
    let startTime = 0;
    let elapsedTime = 0;
    let timerInterval = null;
    let isRunning = false;

    const masterClock = document.getElementById('masterClock');
    const btnStart = document.getElementById('btnMasterStart');
    const btnReset = document.getElementById('btnMasterReset');

    function formatTime(ms) {
        const date = new Date(ms);
        const m = date.getUTCMinutes().toString().padStart(2, '0');
        const s = date.getUTCSeconds().toString().padStart(2, '0');
        const msFormatted = Math.floor(date.getUTCMilliseconds() / 10).toString().padStart(2, '0');
        return `${m}:${s}.${msFormatted}`;
    }

    function updateClock() {
        const now = Date.now();
        elapsedTime = now - startTime;
        masterClock.innerText = formatTime(elapsedTime);
    }

    btnStart.addEventListener('click', () => {
        if (isRunning) {
            clearInterval(timerInterval);
            btnStart.innerText = "RESUME";
            btnStart.classList.replace('bg-red-600', 'bg-blue-600');
            btnStart.classList.replace('hover:bg-red-500', 'hover:bg-blue-500');
        } else {
            startTime = Date.now() - elapsedTime;
            timerInterval = setInterval(updateClock, 10);
            btnStart.innerText = "STOP";
            btnStart.classList.replace('bg-blue-600', 'bg-red-600');
            btnStart.classList.replace('hover:bg-blue-500', 'hover:bg-red-500');
        }
        isRunning = !isRunning;
    });

    btnReset.addEventListener('click', () => {
        clearInterval(timerInterval);
        isRunning = false;
        elapsedTime = 0;
        masterClock.innerText = "00:00.00";
        btnStart.innerText = "START";
        btnStart.classList.replace('bg-red-600', 'bg-blue-600');
        
        // Reset laps
        for(let i=1; i<=4; i++) {
            const el = document.getElementById(`lapTime${i}`);
            el.innerText = "00:00.00";
            el.classList.remove('text-white');
            el.classList.add('text-slate-500');
        }
    });

    window.recordLap = function(laneNumber) {
        if (!isRunning) return;
        const lapEl = document.getElementById(`lapTime${laneNumber}`);
        lapEl.innerText = formatTime(elapsedTime);
        lapEl.classList.remove('text-slate-500');
        lapEl.classList.add('text-white');
        
        lapEl.style.transform = 'scale(1.1)';
        setTimeout(() => lapEl.style.transform = 'scale(1)', 150);
    };
});
