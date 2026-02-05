// script.js

//#region Init, Misc

// --- Configuración general ---
let totalQuestions = 20;
let infiniteMode = false;
let timerValue = 50;
let showSongName = true;

// --- Estados del juego ---
let gameMode = "Option";
let currentQuestion = 0;
let score = 0;
let timer = null;
let currentTime = timerValue; // tiempo actual en segundos
let typeData = "";
let gameData = []; // Aquí se guardarán las preguntas (del CSV o Excel)
let currentMusic = null;
let gameHistory = []; // Array para almacenar historial de preguntas
let usedQuestions = new Set();
let didFinish = false;
let rankedMode = false;
let reportIndex = 0;
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1443734653310599174/KeHIyMRXaijvdAmfOmJeCcXYJm1SigMpjNtVfJrlRDj9tu-KtVEfx9hWNsLKLjI0G2Lm";

// --- Elementos del DOM ---
let screens = {
    loading: document.getElementById('Screen_Loading'),
    title: document.getElementById('Screen_Title'),
    ingame: document.getElementById('Screen_InGame'),
    result: document.getElementById('Screen_Result'),
};

let gameElements = {
    questionText: document.getElementById('Game_Question'),
    timeText: document.getElementById('Game_Time'),
    videoFrame: document.getElementById('Video_iframe'),
    videoName: document.getElementById('Video_Name'),
    videoOpen: document.getElementById('Video_Open'),
    optionGame: document.getElementById('Game_Option'),
    optionList: document.getElementById('GameOption_List'),
    manualGame: document.getElementById('Game_Manual'),
    manualInput: document.getElementById('GameManual_Answer'),
    manualList: document.getElementById('GameManual_List'),
    manualSuggestions: document.getElementById('GameManual_Suggestion'),
    manualSubmit: document.getElementById('GameManual_Submit'),
    answerSection: document.getElementById('Game_Answer'),
    resultScore: document.getElementById('Result_Score'),
    reportReason: document.getElementById("Report_Reason"),
    reportMenu: document.getElementById("Report_Menu"),
    reportSend: document.getElementById("Report_Send"),
    reportAddFangame: document.getElementById("Report_AddFangame"),
    rankedName: document.getElementById("Ranked_PlayerName"),
    rankedLeaderboard: document.getElementById("Ranked_LeaderboardMode"),
    rankedTime: document.getElementById("Ranked_Time"),
    rankedLoading: document.getElementById("Ranked_Loading"),
};

const configElements = {
    roundsInput: document.getElementById('roundsInput'),
    infiniteRoundsBtn: document.getElementById('infiniteRoundsBtn'),
    timerRange: document.getElementById('timerRange'),
    timerValue: document.getElementById('timerValue'),
    musicNameBtn: document.getElementById('musicNameBtn'),
    excelFileInput: document.getElementById('excel-file'),
    btnLoadExcel: document.getElementById('btnLoadExcel')
};

//#region Sonidos y música

const soundUI = {
    btnMusic: document.getElementById('btnSettingMusic'),
    btnSound: document.getElementById('btnSettingSound'),
    musicSettings: document.getElementById('musicSettings'),
    soundSettings: document.getElementById('soundSettings'),
    rangeMusic: document.getElementById('rangeMusic'),
    rangeSound: document.getElementById('rangeSound')
};

// Cargar volúmenes guardados
window.addEventListener('DOMContentLoaded', () => {
    const savedSoundVolume = localStorage.getItem('soundVolume');
    if (savedSoundVolume !== null) {
        soundUI.rangeSound.value = savedSoundVolume;
    }

    const savedMusicVolume = localStorage.getItem('musicVolume');
    if (savedMusicVolume !== null) {
        rangeMusic.value = savedMusicVolume;
    }

    // Aplicar los valores cargados
    const userSoundVolume = parseInt(soundUI.rangeSound.value) / 100;
    Object.values(sounds).forEach(audio => {
        const baseVolume = parseFloat(audio.dataset.baseVolume);
        audio.volume = baseVolume * userSoundVolume;
    });

    musicVolume = parseInt(rangeMusic.value) / 100;
    musMenu.volume = musicVolume * 0.2;
});


// Función auxiliar para mostrar solo un slider
function toggleSlider(type) {
    if (type === 'music') {
        if (soundUI.musicSettings.style.display == 'none') {
            soundUI.musicSettings.style.display = 'block';
            soundUI.soundSettings.style.display = 'none';
        } else {
            soundUI.musicSettings.style.display = 'none';
        }
    } else if (type === 'sound') {
        if (soundUI.soundSettings.style.display == 'none') {
            soundUI.soundSettings.style.display = 'block';
            soundUI.musicSettings.style.display = 'none';
        } else {
            soundUI.soundSettings.style.display = 'none';
        }
    }
    playSound('Select.wav');
}

soundUI.btnMusic.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSlider('music');
});

soundUI.btnSound.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSlider('sound');
});

// -- Sonidos --
let sounds = {};
loadSounds();

function loadSounds() {
    const soundFiles = [
        { file: "Click.wav", baseVolume: 0.4 },
        { file: "Select.wav", baseVolume: 0.6 },
        { file: "Clock.wav", baseVolume: 0.4 },
    ];

    soundFiles.forEach(({ file, baseVolume }) => {
        const audio = new Audio(`snd/${file}`);
        audio.volume = baseVolume * (parseInt(soundUI.rangeSound.value) / 100); // volumen inicial ajustado al control
        audio.dataset.baseVolume = baseVolume; // guardamos el volumen base
        sounds[file] = audio;
    });

    console.log("Sonidos cargados:", Object.keys(sounds));
}

function playSound(name) {
    if (!sounds[name]) {
        console.warn(`El sonido "${name}" no está cargado.`);
        return;
    }

    // Clonar el audio para permitir reproducir múltiples veces
    const soundClone = sounds[name].cloneNode();

    // Tomar el volumen base del dataset
    const baseVolume = parseFloat(sounds[name].dataset.baseVolume) || 1.0;

    // Ajustar según el slider de usuario
    soundClone.volume = baseVolume * (parseInt(rangeSound.value) / 100);

    soundClone.play();
}

// Sonido
soundUI.rangeSound.addEventListener('input', () => {
    const userVolume = parseInt(soundUI.rangeSound.value) / 100;

    Object.values(sounds).forEach(audio => {
        const baseVolume = parseFloat(audio.dataset.baseVolume);
        audio.volume = baseVolume * userVolume;
    });

    localStorage.setItem('soundVolume', soundUI.rangeSound.value);
});

// -- Musica --
const musMenu = new Audio('snd/Menu.mp3');
musMenu.loop = true; // Activar el loop

// Valor inicial del volumen
let musicVolume = parseInt(rangeMusic.value) / 100;
musMenu.volume = musicVolume * 0.2;

function playMusic() {
    musMenu.play().catch(error => {
        console.error("No se pudo reproducir la música de fondo:", error);
    });
}

function stopMusic() {
    musMenu.pause();
    musMenu.currentTime = 0; // Reiniciar desde el principio si la quieres volver a tocar luego
}

// Evento para ajustar volumen con el slider
rangeMusic.addEventListener('input', () => {
    musicVolume = parseInt(rangeMusic.value) / 100;
    musMenu.volume = musicVolume * 0.2;

    localStorage.setItem('musicVolume', rangeMusic.value);
});

//#endregion

// --- Configuración cargada ---
let customExcelData = null;

function showScreen(screenId) {
    // Seleccionamos todos los elementos que tengan id que empiece con "Screen_"
    const screens = document.querySelectorAll('[id^="Screen_"]');

    // Ocultamos todas
    screens.forEach(screen => {
        screen.style.display = "none";
    });

    // Mostramos solo la deseada
    const screenToShow = document.getElementById(screenId);
    if (screenToShow) {
        screenToShow.style.display = "block";
    } else {
        console.warn(`Pantalla con id "${screenId}" no encontrada.`);
    }
}

showScreen('Screen_Loading');

//#endregion

//#region Title name animation

const titleOri = "Fangame Music Quiz";
let titleX = "                                                       "+titleOri;
let interval;
let titleSpd = 200;

window.onload = function() {
    interval = setInterval(titleMove, titleSpd);

    const playerName = localStorage.getItem("playerName");
    if (playerName) gameElements.rankedName.value = playerName;
}

function titleMove() {
    titleX = titleX.slice(1) + titleX[0];
    document.title = titleX;
}

//#endregion

//#region Loading Screen

btnLoadCSV.addEventListener('click', () => {
    loadCSV();
    playMusic();
    showScreen('Screen_Title');
});

function loadCSV(){
    playSound('Select.wav');
    Papa.parse("FMQ.csv", {
        download: true,       // Descarga directa desde la ruta del proyecto
        header: false,        // No necesitamos encabezados, empezamos desde fila 4
        skipEmptyLines: true, // Ignora filas vacías
        complete: function(results) {
            const rawData = results.data;
            gameData = [];

            // Recorremos desde la fila 4 (índice 3)
            for (let i = 3; i < rawData.length; i++) {
                const row = rawData[i];

                // Ignorar filas con columnas vacías
                if (!row[0] || !row[1] || !row[2] || !row[3]) continue;

                const fangamesArray = row[1].split(';').map(f => f.trim());

                gameData.push({
                    index: i-3,
                    youtube: row[0].trim(),
                    fangames: fangamesArray,
                    musicName: row[2].trim(),
                    author: row[3].trim()
                });
            }

            console.log("CSV cargado correctamente:", gameData);
        },
        error: function(err) {
            alert("Error al cargar el CSV: " + err.message);
        }
    });
    typeData = "Original";
}

//#endregion

//#region Title Screen

configElements.roundsInput.addEventListener('input', () => {
    const roundRange = configElements.roundsInput;
    const min = parseInt(roundRange.min);
    const valor = parseInt(roundRange.value);

    if (isNaN(valor)){
        roundRange.value = 1;
        return;
    }
    
    if (valor < min) roundRange.value = min;
    roundRange.value = Math.floor(roundRange.value);
});

configElements.infiniteRoundsBtn.addEventListener('click', () => {
    infiniteMode = !infiniteMode;
    playSound('Select.wav');

    if (infiniteMode) {
        totalQuestions = configElements.roundsInput.value;
        configElements.roundsInput.disabled = true;
        configElements.roundsInput.type = "text";
        configElements.roundsInput.value = "Infinite";
    } else {
        configElements.roundsInput.type = "number";
        configElements.roundsInput.value = totalQuestions; // volver a valor por defecto
        configElements.roundsInput.disabled = false;
    }
});

configElements.timerRange.addEventListener('input', () => {
    timerValue = parseInt(configElements.timerRange.value);
    configElements.timerValue.textContent = timerValue;
});

configElements.musicNameBtn.addEventListener('click', () => {
    showSongName = !showSongName;
    configElements.musicNameBtn.textContent = `Show Song Name: ${showSongName ? "On" : "Off"}`;
    playSound('Select.wav');
});

configElements.btnLoadExcel.addEventListener('click', () => {
    if (!configElements.excelFileInput) {
        console.error("excelFileInput no está definido");
        return;
    }

    configElements.excelFileInput.click();
    playSound('Select.wav');
});

configElements.excelFileInput.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file) {
        console.warn("No se seleccionó archivo");
        return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);

            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

            if (!firstSheet) {
                console.error("La primera hoja del Excel está vacía o no existe");
                return;
            }

            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, raw: false });

            // Reiniciar gameData de forma segura
            window.gameData = [];

            // Procesar filas a partir de la fila 4
            for (let i = 3; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!Array.isArray(row)) continue;

                const [index, youtube, fangamesRaw, musicName, author] = row;

                // Validación más robusta
                if (
                    index == null ||
                    !youtube ||
                    !fangamesRaw ||
                    !musicName ||
                    !author
                ) {
                    continue;
                }

                const fangames = String(fangamesRaw).split(';').map(f => f.trim());

                gameData.push({
                    index,
                    youtube,
                    fangames,
                    musicName,
                    author
                });
            }

            console.log("Excel cargado:", gameData);
            typeData = "Custom";

        } catch (err) {
            console.error("Error leyendo el Excel:", err);
        }
    };

    reader.onerror = (e) => {
        console.error("Error leyendo el archivo:", e);
    };

    reader.readAsArrayBuffer(file);
});

//#endregion

//#region Ranked Mode
function activeRanked(){
    rankedMode = !rankedMode;
    playSound('Select.wav');

    if (rankedMode) {
        document.getElementById("Config_Menu").style.display = "none";
        document.getElementById("Ranked_Menu").style.display = "block";

        const mode = gameElements.rankedLeaderboard.value;
        leaderboardLoad();
        leaderboardShow(`leaderboard_${mode}`);

        totalQuestions = 20;
        configElements.roundsInput.value = totalQuestions;

        infiniteMode = false;
        configElements.roundsInput.type = "number";
        configElements.roundsInput.value = totalQuestions;
        configElements.roundsInput.disabled = false;

        timerValue = 50;
        configElements.timerValue.textContent = timerValue;

        showSongName = true;
        configElements.musicNameBtn.textContent = `Show Song Name: ${showSongName ? "On" : "Off"}`;

        if (typeData != "Original"){
            loadCSV();
        }

        document.getElementById("btnRankedMode").textContent = "Single Mode";
    } else {
        document.getElementById("Config_Menu").style.display = "block";
        document.getElementById("Ranked_Menu").style.display = "none";

        document.getElementById("btnRankedMode").textContent = "Ranked Mode";
    }
}

gameElements.rankedName.addEventListener("input", function() {
    const saveName = this.value;
    localStorage.setItem("playerName", saveName);
});

gameElements.rankedLeaderboard.addEventListener("change", function () {
    const selectedValue = this.value;
    leaderboardShow(`leaderboard_${selectedValue}`);
});

function rankedCountdown() {
    const now = new Date();

    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);

    const diff = tomorrow - now;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    gameElements.rankedTime.textContent =
        `${hours}h ${minutes}m ${seconds}s`;
}

setInterval(rankedCountdown, 1000);
rankedCountdown();

function leaderboardUpdate(){
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem("lastVisit");
    const isDifferentDay = lastVisit !== today;

    localStorage.setItem("lastVisit", today);

    return isDifferentDay;
}

async function leaderboardSave(_mode, _name, _score) {
    const {
        db, collection, addDoc
    } = window._firebase;

    const collectionName =
        _mode === "Option" ? "leaderboard_option" : "leaderboard_manual";

    try {
        await addDoc(collection(db, collectionName), {
            name: _name,
            score: _score,
            timestamp: Date.now()
        });

        console.log("Score saved:", _name, _score);
    } catch (err) {
        console.error("Error saving score:", err);
    }
}

async function leaderboardLoad() {
    if (!leaderboardUpdate()){
        return;
    }

    const {
        db, collection, query, orderBy, limit, getDocs
    } = window._firebase;

    const collections = ["leaderboard_option", "leaderboard_manual"];

    try {
        // Ejecutar ambas consultas en paralelo
        const queries = collections.map(name =>
            getDocs(
                query(
                    collection(db, name),
                    orderBy("score", "desc"),
                    limit(20)
                )
            )
        );

        const snapshots = await Promise.all(queries);

        // Convertir cada snapshot en array de datos
        const results = {};
        snapshots.forEach((snapshot, i) => {
            const data = [];
            snapshot.forEach(doc => data.push(doc.data()));
            results[collections[i]] = data;
        });

        // Guardar en localStorage
        localStorage.setItem("leaderboards", JSON.stringify(results));
        return results;

    } catch (err) {
        console.error("Error loading leaderboards:", err);
    }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function leaderboardShow(selected) {
    gameElements.rankedLoading.style.display = "block";
    document.getElementById("Ranked_LeaderboardTable").style.display = "none";

    await sleep(1000);// 1 segundo
    gameElements.rankedLoading.style.display = "none";
    document.getElementById("Ranked_LeaderboardTable").style.display = "table";

    // Recuperar todos los leaderboards guardados en localStorage
    const stored = localStorage.getItem("leaderboards");
    if (!stored) {
        console.warn("No hay leaderboards en localStorage");
        return;
    }

    const leaderboards = JSON.parse(stored);

    // Verificar que el seleccionado exista
    const data = leaderboards[selected];
    if (!data) {
        console.warn(`Leaderboard '${selected}' no encontrado`);
        return;
    }

    // Renderizar en la tabla
    const tbody = document.querySelector("#Ranked_LeaderboardTable tbody");
    tbody.innerHTML = "";

    data.forEach((entry, index) => {
        const tr = document.createElement("tr");

        const timestamp = entry.timestamp;
        const dateObj = new Date(timestamp);
        const setDate = dateObj.toISOString().split('T')[0];

        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.name}</td>
            <td>${entry.score}</td>
            <td>${setDate}</td>
        `;

        tbody.appendChild(tr);
    });
}

//#endregion

//#region InGame Screen




//#region Option Mode

function startOptionMode() {
    playSound('Select.wav');

    const playerName = gameElements.rankedName.value;
    if (rankedMode && playerName == ""){
        alert("Please enter a name.");
        return;
    }

    gameMode = "Option";
    totalQuestions = configElements.roundsInput.value;
    currentQuestion = 1;
    score = 0;
    usedQuestions.clear();
    showScreen('Screen_InGame');
    stopMusic();

    // Mostrar la sección de Manual Mode y ocultar opciones
    gameElements.optionGame.style.display = "block";
    gameElements.manualGame.style.display = "none";

    showOptionQuestion();
}

function showOptionQuestion() {
    if (currentQuestion > totalQuestions && !infiniteMode) {
        didFinish = true;
        showResults();
        return;
    }

    // Elege una canción correcta
    let correctIndex;
    do {
        correctIndex = Math.floor(Math.random() * gameData.length);
    } while (usedQuestions.has(correctIndex) && !infiniteMode);

    usedQuestions.add(correctIndex);
    currentMusic = gameData[correctIndex];
    reportIndex = correctIndex;

    startTimer();
    showQuestion();

    const correctFangame = currentMusic.fangames[Math.floor(Math.random() * currentMusic.fangames.length)];
    const validFangamesSet = new Set(currentMusic.fangames.map(f => f.trim().toLowerCase()));

    // Genera las opciones
    const options = [correctFangame];

    while (options.length < 5) {
        const randomIndex = Math.floor(Math.random() * gameData.length);
        const randomMusic = gameData[randomIndex];
        const randomFangame = randomMusic.fangames[Math.floor(Math.random() * randomMusic.fangames.length)];

        // Sistema para evitar duplicados
        if (
            !options.some(opt => opt.toLowerCase() === randomFangame.toLowerCase()) &&
            !validFangamesSet.has(randomFangame.toLowerCase())
        ) {
            options.push(randomFangame);
        }
    }

    // Shuffle
    options.sort(() => Math.random() - 0.5);
    gameElements.optionList.innerHTML = "";

    options.forEach(option => {
        const btn = document.createElement("button");
        btn.textContent = option;
        btn.addEventListener("click", () => {
            const allButtons = gameElements.optionList.querySelectorAll("button");
            allButtons.forEach(b => b.disabled = true);

            checkAnswer(option);
        });
        gameElements.optionList.appendChild(btn);
    });
}
//#endregion

//#region Manual Mode
function startManualMode() {
    playSound('Select.wav');

    const playerName = gameElements.rankedName.value;
    if (rankedMode && playerName == ""){
        alert("Please enter a name.");
        return;
    }

    gameMode = "Manual";
    currentQuestion = 1;
    totalQuestions = configElements.roundsInput.value;
    score = 0;
    usedQuestions.clear();
    showScreen('Screen_InGame');
    stopMusic();

    // Mostrar la sección de Manual Mode y ocultar opciones
    gameElements.optionGame.style.display = "none";
    gameElements.manualGame.style.display = "block";

    showManualQuestion();
}

function showManualQuestion() {
    if (currentQuestion > totalQuestions && !infiniteMode) {
        didFinish = true;
        showResults();
        return;
    }

    gameElements.manualInput.style.border = "3px solid white";
    gameElements.manualSubmit.style.border = "3px solid white";
    gameElements.manualSubmit.style.pointerEvents = 'auto';

    gameElements.manualInput.innerHTML = "";
    gameElements.manualInput.disabled = false;
    gameElements.manualSubmit.disabled = false;

    // Elegir canción correcta
    let correctIndex;
    do {
        correctIndex = Math.floor(Math.random() * gameData.length);
    } while (usedQuestions.has(correctIndex) && !infiniteMode);

    usedQuestions.add(correctIndex);
    currentMusic = gameData[correctIndex];
    reportIndex = correctIndex;

    showQuestion(); // carga video y contador
    startTimer();   // inicia el temporizador

    // Limpiar input y sugerencias
    gameElements.manualInput.value = "";
    gameElements.manualSuggestions.innerHTML = "";
    gameElements.manualInput.style.color = "white";
    gameElements.manualInput.style.textShadow = "0px 0px 5px #000000";
}

gameElements.manualInput.addEventListener('input', () => {
    const input = gameElements.manualInput.value.toLowerCase();
    const suggestions = [];

    if (input == ""){
        gameElements.manualSuggestions.innerHTML = "";
        return;
    }

    // Buscar hasta 8 coincidencias
    gameData.forEach(song => {
        song.fangames.forEach(f => {
            if (f.toLowerCase().includes(input) && !suggestions.includes(f)) {
                suggestions.push(f);
            }
        });
    });

    // Limitar a 8 sugerencias
    suggestions.splice(8);

    // Mostrar en el div
    gameElements.manualSuggestions.innerHTML = "";
    suggestions.forEach(s => {
        const div = document.createElement('div');
        div.textContent = s;
        div.classList.add("suggestion-item");
        div.addEventListener('click', () => {
            gameElements.manualInput.value = s; // poner la sugerencia en el input
            gameElements.manualInput.focus();         // volver a foco
            gameElements.manualSuggestions.innerHTML = ""; // limpiar sugerencias
        });
        gameElements.manualSuggestions.appendChild(div);
    });
});

// Botón Submit
gameElements.manualSubmit.addEventListener('click', () => {
    submitManualAnswer();
});

// Enter
gameElements.manualInput.addEventListener('keydown', (e) => {
    if (e.key === "Enter") {
        submitManualAnswer();
    }
});

function submitManualAnswer() {
    const answer = gameElements.manualInput.value.trim();

    // Bloquear input y botón
    gameElements.manualInput.disabled = true;
    gameElements.manualSubmit.disabled = true;

    // Limpiar sugerencias
    gameElements.manualSuggestions.innerHTML = "";

    checkAnswer(answer);
}
//#endregion

async function startTimer() {
    currentTime = timerValue; // reinicia el tiempo para cada pregunta
    gameElements.timeText.textContent = `Time: ${currentTime.toFixed(1)}`;
    let lastSecondPlayed = null;

    // Limpiar cualquier timer previo
    if (timer) clearInterval(timer);

    await sleep(2000);
    if (gameElements.answerSection.style.display == "block") return

    timer = setInterval(() => {
        currentTime -= 0.1; // bajar de a 0.1s
        if (currentTime <= 0) {
            clearInterval(timer);
            gameElements.timeText.textContent = `Time: 0.0`;

            if (gameMode == "Option"){
                const allButtons = gameElements.optionList.querySelectorAll('button');
                allButtons.forEach(b => b.disabled = true);
            } else {
                gameElements.manualInput.disabled = true;
                gameElements.manualSubmit.disabled = true;

                gameElements.manualSuggestions.innerHTML = "";
            }

            // Tiempo agotado
            checkAnswer(""); 
        } else {
            gameElements.timeText.textContent = `Time: ${currentTime.toFixed(1)}`;

            const wholeSecond = Math.floor(currentTime);
            if (wholeSecond < 10 && wholeSecond >= 0 && wholeSecond !== lastSecondPlayed) {
                playSound("Clock.wav");
                lastSecondPlayed = wholeSecond;
            }
        }
    }, 100); // cada 100ms
}

function showQuestion() {

    // Carga el video y actualiza contador de pregunta
    const videoUrl = getEmbedURL(currentMusic.youtube);
    gameElements.videoFrame.src = videoUrl;
    gameElements.videoName.textContent = showSongName ? currentMusic.musicName : "";

    if (!infiniteMode) {
        gameElements.questionText.textContent = `Question ${currentQuestion} - ${totalQuestions}`;
    } else {
        gameElements.questionText.textContent = `Question ${currentQuestion} - Infinite`;
    }
}

function checkAnswer(selectedFangame) {

    // Detener timer si aún está corriendo
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    
    // Comprobamos si el nombre del fangame seleccionado coincide con alguno de los correctos
    const isCorrect = currentMusic.fangames.some(fg => fg.toLowerCase().trim() === selectedFangame.toLowerCase().trim());

    // Guardar en historial
    gameHistory.push({
        questionNumber: currentQuestion,
        musicName: currentMusic.musicName,
        userAnswer: selectedFangame,
        isCorrect: isCorrect,
        correctFangames: [...currentMusic.fangames]
    });

    if (gameMode == "Option"){
        const allButtons = gameElements.optionList.querySelectorAll("button");
        allButtons.forEach(b => {
            b.style.color = "gray";
            b.style.textShadow = "none";
            b.style.pointerEvents = 'none';
            b.style.border = "3px solid gray";
        });

        if (selectedFangame != ""){
            const selectedButton = Array.from(allButtons).find(b => b.textContent.toLowerCase().trim() === selectedFangame.toLowerCase().trim());
            if (!isCorrect) {
                selectedButton.style.color = "red";
                selectedButton.style.textShadow = "0px 0px 5px #FF0000";
            }
        }
        

        // Mostrar opcion correcta
        currentMusic.fangames.forEach(correctFangame => {
            const correctButton = Array.from(allButtons).find(b => b.textContent.toLowerCase().trim() === correctFangame.toLowerCase().trim());
            if (correctButton) {
                correctButton.style.color = "lime";
                correctButton.style.textShadow = "0px 0px 5px #00FF00";
            }
        });
    }
    else
    {
        gameElements.manualInput.style.border = "3px solid gray";
        gameElements.manualSubmit.style.border = "3px solid gray";
        gameElements.manualSubmit.style.pointerEvents = 'none';

        gameElements.manualInput.style.color = isCorrect ? "lime" : "red";
        gameElements.manualInput.style.textShadow = isCorrect ?
                                                    "0px 0px 5px #00FF00" :
                                                    "0px 0px 5px #FF0000";
    }

    gameElements.answerSection.style.display = "block";
    const answerText = document.getElementById('Answer_Text');
    const answerInfo = document.getElementById('Answer_Info');

    if (isCorrect) {
        answerText.style.color = "lime";
        answerText.style.textShadow = "0px 0px 5px #00FF00";
    } else {
        answerText.style.color = "red";
        answerText.style.textShadow = "0px 0px 5px #FF0000";
    }

    answerText.textContent = `Your answer: ${selectedFangame} — ${isCorrect ? "Correct!" : "Wrong!"}`;
    answerInfo.innerHTML = `
        <p><strong>Correct Fangame(s):</strong> ${currentMusic.fangames.join(", ")}</p>
        <p><strong>Music:</strong> ${currentMusic.musicName}</p>
        <p><strong>Author:</strong> ${currentMusic.author}</p>
    `;

    // Scroll hacia el div de respuesta
    gameElements.answerSection.scrollIntoView({ behavior: "smooth", block: "start" });
    if (isCorrect) score += 100 + Math.floor(currentTime * 2);

    // El botón Continue manejará la siguiente pregunta, sin recargar opciones ni video
    const btnContinue = document.getElementById('btnContinue');
    btnContinue.onclick = () => {
        gameElements.answerSection.style.display = "none";
        currentQuestion++;
        playSound('Select.wav');

        // Detener timer si aún está corriendo
        if (timer) {
            clearInterval(timer);
            timer = null;
        }

        if (gameMode == "Option")
            { showOptionQuestion(); }
        else
            { showManualQuestion(); }
    };

    const btnExit = document.getElementById('btnExit');
    btnExit.onclick = () => {
        playSound('Select.wav');
        didFinish = false;
        showResults();
    };
}

// Función para convertir un link normal de YouTube a embed
function getEmbedURL(youtubeURL) {
    // Extraer ID del video
    const idMatch = youtubeURL.match(/(?:v=|youtu\.be\/)([^&\?]+)/);
    const videoId = idMatch ? idMatch[1] : null;

    if (!videoId) return youtubeURL; // fallback

    // Buscar parámetro t= en la URL
    const tMatch = youtubeURL.match(/[?&]t=(\d+)s?/);
    const startTime = tMatch ? parseInt(tMatch[1]) : 0;

    // Construir URL para iframe
    return `https://www.youtube.com/embed/${videoId}?start=${startTime}&autoplay=1`;
}

gameElements.videoOpen.addEventListener("click", function() {
    window.open(currentMusic.youtube,"_blank");
});

//#region Report Button

document.getElementById("btnReport").onclick = () => {
    playSound('Select.wav');

    if (gameElements.reportMenu.style.display == "block")
        { gameElements.reportMenu.style.display = "none"; }
    else
        { gameElements.reportMenu.style.display = "block"; }
};

gameElements.reportReason.addEventListener("change", () => {
    if (gameElements.reportReason.value === "addfangame") {
        gameElements.reportAddFangame.style.display = "block";
    } else {
        gameElements.reportAddFangame.style.display = "none";
        gameElements.reportAddFangame.value = "";
    }
});

gameElements.reportSend.onclick = () => {
    playSound('Select.wav');
    gameElements.reportSend.disabled = true;

    const reason = gameElements.reportReason.value;
    const addFangame = gameElements.reportAddFangame.value.trim();
    if (!currentMusic) {
        alert("Error");
        return;
    }

    // Texto final del motivo
    let reasonText = "";
    switch (reason) {
        case "video":
            reasonText = "🔍 Private/Delete video";
            break;
        case "wrong":
            reasonText = "⚠️ Incorrect fangame/song";
            break;
        case "addfangame":
            reasonText = "📌 Add missing fangame";
            break;
    }

    const fields = [
        { name: "CSV Index", value: String(reportIndex + 4), inline: true },
        { name: "Link", value: currentMusic.youtube },
        { name: "Song Name", value: `${currentMusic.musicName}\n${currentMusic.author}` },
        { name: "Fangames", value: currentMusic.fangames.join(", ") },
        { name: "Reason", value: reasonText }
    ];

    // Si eligió añadir fangame, incluimos el campo adicional
    if (reason === "addfangame") {
        if (addFangame.length === 0) {
            alert("Please enter the fangame you wish to add.");
            return;
        }
        fields.push({
            name: "Suggested Fangame",
            value: addFangame
        });
    }

    fields.push({
        name: "Date",
        value: new Date().toLocaleString()
    });

    // Se hace el payload
    const payload = {
        embeds: [
            {
                title: "New Report",
                color: 15158332,
                fields: fields
            }
        ]
    };

    fetch(DISCORD_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    }).then(() => {
        alert("Report submitted!");
        gameElements.reportMenu.style.display = "none";
        gameElements.reportAddFangame.style.display = "none";
        gameElements.reportAddFangame.value = "";
        gameElements.reportReason.value = "video";
        gameElements.reportSend.disabled = false;
    }).catch(err => {
        console.error(err);
        alert("Error sending the report.");
        gameElements.reportSend.disabled = false;
    });
};
//#endregion

//#endregion

//#region Result Screen

function showResults() {
    showScreen('Screen_Result'); // Mostrar la pantalla de resultados
    playMusic();
    document.getElementById("Video_iframe").src = "";
    gameElements.answerSection.style.display = "none";
    gameElements.manualInput.innerHTML = "";

    gameElements.resultScore.textContent = `Your Score: ${score}`;

    if (didFinish && rankedMode){
        const _name = gameElements.rankedName.value;
        const _mode = gameMode;
        const _score = score;

        leaderboardSave(_mode, _name, _score);
    }

    const resultList = document.getElementById('Result_List');
    resultList.innerHTML = ""; // Limpiar lista antes de agregar

    let correctCount = gameHistory.filter(r => r.isCorrect).length;
    let incorrectCount = gameHistory.length - correctCount;

    const summary = document.createElement("div");
    summary.innerHTML = `<h3 style="color: lime; text-shadow: 2px 2px 5px rgba(144, 255, 144, 0.57);">Correct: ${correctCount} / ${gameHistory.length}</h3>
                        <h3 style="color: red; text-shadow: 2px 2px 5px rgba(255, 144, 144, 0.57);">Incorrect: ${incorrectCount} / ${gameHistory.length}</h3>`;
    resultList.appendChild(summary);

    gameHistory.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('result-item');

        const blendText = item.isCorrect ? "rgba(202, 255, 202, 1)" : "rgba(255, 202, 202, 1)";
        div.innerHTML = `
            <p style="color: ${blendText}"><strong>Question ${item.questionNumber}: ${item.musicName}</strong></p>
            <p style="color: ${blendText}">Your answer: ${item.userAnswer} ${item.isCorrect ? "✔️" : "❌"}</p>
            <p style="color: ${blendText}">Correct Answer: ${item.correctFangames.join(", ")}</p>
        `;

        resultList.appendChild(div);
    });
}

const btnBackMenu = document.getElementById('btnBackMenu');
btnBackMenu.onclick = () => {
    gameHistory = []; // Limpiar historial
    score = 0;
    currentQuestion = 1;
    playSound('Select.wav');
    showScreen('Screen_Title');
};

//#endregion