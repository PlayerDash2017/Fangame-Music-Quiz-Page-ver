// script.js

// Lista de IDs de pantallas
const screens = [
  "Screen_Loading",
  "Screen_Title",
  "Screen_InGame",
  "Screen_Result"
];

// Función para mostrar una pantalla y ocultar el resto
function showScreen(screenId) {
  screens.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = (id === screenId) ? "block" : "none";
    }
  });
}

// Referencias
const btnLoadExcel = document.getElementById("btnLoadExcel");
const inputExcel   = document.getElementById("excel-file");

// Al iniciar: solo pantalla de carga
showScreen("Screen_Loading");

// Botón que abre el input file
btnLoadExcel.addEventListener("click", () => {
  inputExcel.click();
  playSound('Select.wav');
});

// Cuando se selecciona un archivo
let quizData = []; // Aquí guardaremos las preguntas
inputExcel.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    // Tomamos la primera hoja del Excel
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convertimos toda la hoja a JSON (con encabezados generados por defecto)
    let rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    rawData = rawData.slice(3);

    quizData = rawData.map(row => ({
        youtube: row[0] || "",
        fangames: (row[1] || "").split(";").map(f => f.trim()), // <-- array de fangames
        music: row[2] || "",
        author: row[3] || ""
    }));

    console.log("Preguntas cargadas:", quizData);
    console.log("Archivo cargado:", workbook.SheetNames);

    playMusic();
    showScreen("Screen_Title");
  };
  reader.readAsArrayBuffer(file);
});

let totalQuestions, timePerQuestion;
//let totalQuestions = 20;
//let timePerQuestion = 50.0; // segundos
let currentQuestionIndex = 0;
let currentTimer;
let timeLeft = timePerQuestion;

// Cargar preguntas aleatorias desde quizData
function prepareQuestions() {
  const shuffled = [...quizData].sort(() => Math.random() - 0.5);
  return gameConfig.infiniteRounds ? shuffled : shuffled.slice(0, totalQuestions);

  //return shuffled.slice(0, totalQuestions);
}

// Iniciar el modo de opciones
function startOptionMode() {
    //questionList = prepareQuestions();
    //currentQuestionIndex = 0;
    totalQuestions = gameConfig.infiniteRounds ? Infinity : gameConfig.rounds;
    timePerQuestion = gameConfig.timer;
    questionList = prepareQuestions();
    currentQuestionIndex = 0;
    
    playSound('Select.wav');
    stopMusic();
    showScreen("Screen_InGame");
    showQuestion();
}

// Mostrar una pregunta
function showQuestion() {
    const q = questionList[currentQuestionIndex];

    // Mostrar número de pregunta
    document.getElementById("Game_Question").textContent = 
        `Question ${currentQuestionIndex + 1} - ${totalQuestions}`;

    // Resetear tiempo
    timeLeft = timePerQuestion;
    updateTimer();
    if (currentTimer) clearInterval(currentTimer);
    currentTimer = setInterval(updateTimer, 100);

    // Poner video de YouTube
    const videoUrl = extractYoutubeEmbed(q.youtube);
    document.getElementById("Video_iframe").src = videoUrl;

    // Mostrar opciones
    const optionList = document.getElementById("GameOption_List");
    optionList.style.display = "flex"; // o "block" según tu CSS
    
    // Generar opciones
    const options = generateOptions(q.fangames);
    renderOptions(options, q.fangames);
}

// Actualizar el temporizador
function updateTimer() {
    timeLeft -= 0.1;
    if (timeLeft <= 0) {
        clearInterval(currentTimer);
        timeLeft = 0;
        document.getElementById("Game_Time").textContent = `Time: 0.0`;

        // Llamar a la función para mostrar respuesta como no respondida
        handleTimeUp();
    } else {
        document.getElementById("Game_Time").textContent = `Time: ${timeLeft.toFixed(1)}`;
    }
}

function handleTimeUp() {
    const q = questionList[currentQuestionIndex];

    // Guardar resultado como no respondida
    results.push({
        question: q.music,
        fangameCorrect: q.fangames.join("; "),
        selectedAnswer: "", // vacío
        isCorrect: false
    });

    // Mostrar div de respuesta
    const answerDiv = document.getElementById("Game_Answer");
    const answerText = document.getElementById("Answer_Text");
    const answerInfo = document.getElementById("Answer_Info");

    answerText.textContent = "⏱ Time's up!";
    answerInfo.innerHTML = `
        Fangame: ${q.fangames.join("; ").replace(/;/g, ",")} <br>
        Music: ${q.music} <br>
        Author: ${q.author}
    `;

    answerDiv.style.display = "block";

    // Ocultar opciones
    const optionList = document.getElementById("Game_Option");
    optionList.style.display = "none";

    // Scroll al div de respuesta
    answerDiv.scrollIntoView({ behavior: "smooth", block: "start" });

    // Deshabilitar botones de opciones
    const optionButtons = optionList.querySelectorAll("button");
    optionButtons.forEach(btn => btn.disabled = true);
}


function generateOptions(fangamesArray) {
  const correct = fangamesArray[Math.floor(Math.random() * fangamesArray.length)];
  
  let others = quizData.flatMap(q => q.fangames)
                       .filter(f => f !== correct);
  others = [...new Set(others)].sort(() => Math.random() - 0.5).slice(0, 3);

  return [correct, ...others].sort(() => Math.random() - 0.5);
}

// Renderizar botones de opciones
function renderOptions(options, correctAnswer) {
    const list = document.getElementById("GameOption_List");
    list.innerHTML = "";

    options.forEach(opt => {
        const btn = document.createElement("button");
        btn.textContent = opt;
        btn.onclick = () => checkAnswer(opt, correctAnswer);
        list.appendChild(btn);
    });
}

// Revisar respuesta
function checkAnswer(selected, correctFangames) {
    clearInterval(currentTimer);
    
    const q = questionList[currentQuestionIndex];

    const isCorrect = correctFangames.includes(selected); // ✅ acepta cualquiera de los posibles

    // Guardar resultado
    results.push({
        question: q.music,
        fangameCorrect: correctFangames.join("; "),
        selectedAnswer: selected,
        isCorrect: isCorrect
    });

    // Ocultar las opciones
    const optionList = document.getElementById("Game_Option");
    optionList.style.display = "none";

    // Mostrar div de respuesta
    const answerDiv = document.getElementById("Game_Answer");
    const answerText = document.getElementById("Answer_Text");
    const answerInfo = document.getElementById("Answer_Info");

    // Tomamos la pregunta actual
    answerText.textContent = isCorrect ? "✅ Correct!" : "❌ Wrong!";
    answerInfo.innerHTML = `
        Fangame: ${q.fangames.join("; ").replace(/;/g, ",")} <br>
        Music: ${q.music} <br>
        Author: ${q.author}
    `;

    answerDiv.style.display = "block";

    // Hacer scroll hacia el div de respuesta
    answerDiv.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.getElementById("btnContinue").onclick = () => {
    const answerDiv = document.getElementById("Game_Answer");
    answerDiv.style.display = "none";

    const optionList = document.getElementById("Game_Option");
    optionList.style.display = "block";

    const optionButtons = optionList.querySelectorAll("button");
    optionButtons.forEach(btn => btn.disabled = false);

    playSound('Select.wav');

    // Pasar a la siguiente pregunta
    nextQuestion();
};

document.getElementById("btnExit").onclick = () => {
    if (currentTimer) clearInterval(currentTimer);
    
    const answerDiv = document.getElementById("Game_Answer");
    answerDiv.style.display = "none";
    
    const optionList = document.getElementById("Game_Option");
    optionList.style.display = "block";

    const optionButtons = optionList.querySelectorAll("button");
    optionButtons.forEach(btn => btn.disabled = false);

    // Mostrar pantalla de resultados
    showResults();
    playSound('Select.wav');
};

// Ir a la siguiente pregunta o terminar
function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questionList.length) {
        showQuestion();
    } else {
        showResults();
    }
}

// Extraer ID de YouTube desde link
function extractYoutubeEmbed(url) {
    // Extraer ID del video
    const idMatch = url.match(/(?:v=|youtu\.be\/)([^&\?]+)/);
    const videoId = idMatch ? idMatch[1] : null;

    if (!videoId) return url; // fallback

    // Buscar parámetro t= en la URL
    const tMatch = url.match(/[?&]t=(\d+)s?/);
    const startTime = tMatch ? parseInt(tMatch[1]) : 0;

    // Construir URL para iframe
    return `https://www.youtube.com/embed/${videoId}?start=${startTime}&autoplay=1`;
}


let questionList = [];
let results = []; // historial de respuestas

function showResults() {
    showScreen("Screen_Result");
    document.getElementById("Video_iframe").src = "";

    const resultList = document.getElementById("Result_List");
    resultList.innerHTML = "";

    let correctCount = results.filter(r => r.isCorrect).length;
    let incorrectCount = results.length - correctCount;

    const summary = document.createElement("div");
    summary.innerHTML = `<h3>Correct: ${correctCount} / ${results.length}</h3>
                        <h3>Incorrect: ${incorrectCount} / ${results.length}</h3>`;
    resultList.appendChild(summary);

  // Lista detallada
  results.forEach((r, i) => {
    const div = document.createElement("div");
    div.innerHTML = `<strong>Q${i + 1} - ${r.question}</strong><br>
                     Your answer: ${r.selectedAnswer} ${r.isCorrect ? "✅" : "❌"}<br>
                     Correct answer: ${r.fangameCorrect.replace(/;/g, ",")}`;
    div.style.marginBottom = "10px";
    resultList.appendChild(div);
  });
}

// Botón Back para reiniciar
document.getElementById("btnBackMenu").onclick = () => {
  results = [];
  playSound('Select.wav');
  playMusic();
  showScreen("Screen_Title");
};

document.getElementById("btnOptionMode").addEventListener('mouseenter', () => {
    playSound('Click.wav',0.2);
});

// Agregar evento al pasar el mouse
/*boton.addEventListener('mouseenter', () => {
    playSound('Click');
});*/

function playSound(fileName, fileVolume=1.0) {
    const audio = new Audio('snd/' + fileName);
    audio.volume = fileVolume;
    audio.play().catch(error => {
        console.error("Error al reproducir el sonido:", error);
    });
}

// Crear el audio de fondo
const musMenu = new Audio('snd/Menu.mp3');
musMenu.loop = true; // Activar el loop
musMenu.volume = 0.2; // (Opcional) Ajustar volumen entre 0.0 y 1.0

function playMusic() {
    musMenu.play().catch(error => {
        console.error("No se pudo reproducir la música de fondo:", error);
    });
}

function stopMusic() {
    musMenu.pause();
    musMenu.currentTime = 0; // Reiniciar desde el principio si la quieres volver a tocar luego
}

// Estado de configuración
const gameConfig = {
  rounds: 20,
  infiniteRounds: false,
  timer: 50,
  blockInvalidVideos: false
};

// Evento para número de rondas
document.getElementById('roundsInput').addEventListener('input', (e) => {
  const val = parseInt(e.target.value);
  gameConfig.rounds = Math.max(1, val || 1);
});

// Botón de rondas infinitas
document.getElementById('infiniteRoundsBtn').addEventListener('click', () => {
    gameConfig.infiniteRounds = !gameConfig.infiniteRounds;

    const input = document.getElementById('roundsInput');
    const status = document.getElementById('infiniteRoundsStatus');

    if (gameConfig.infiniteRounds) {
        input.disabled = true;
        status.textContent = "Infinite";
    } else {
        input.disabled = false;
        status.textContent = "Limited";
    }
});

// Slider de temporizador
document.getElementById('timerRange').addEventListener('input', (e) => {
  const val = parseInt(e.target.value);
  gameConfig.timer = val;
  document.getElementById('timerValue').textContent = val;
});

// Botón para bloquear videos inválidos
document.getElementById('blockInvalidVideosBtn').addEventListener('click', () => {
  gameConfig.blockInvalidVideos = !gameConfig.blockInvalidVideos;
  
  const status = document.getElementById('blockInvalidVideosStatus');
  status.textContent = gameConfig.blockInvalidVideos ? 
    "Estado: Bloqueando inválidos" : 
    "Estado: Permitir todos";
});
