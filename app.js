let correctAnswer;
let totalQuiz = 0;
let correctQuiz = 0;
let startTime;
let totalTime = 0; 
let myAnswer = "";
let question = {};

const domain = "http://localhost:8080";

function formatTime(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
} 

function calculateGrade() {
    const steps = [0.75, 0.775, 0.8, 0.825, 0.85, 0.875, 0.9, 0.925, 0.95, 0.975, 1];
    const notes = ["5,0", "4,0", "3,7", "3,3", "3,0", "2,7", "2,3", "2,0", "1,7", "1,3", "1,0"];

    let grade = {"note": notes[0], "lowerBorder": 0, "upperBorder": Math.ceil(steps[0] * totalQuiz) - 1};
    if (totalQuiz === 0) return grade;
    for(let i = 0; i < steps.length - 1; i++) {
        if (correctQuiz >= Math.ceil(steps[i] * totalQuiz)) {
            grade = {"note": notes[i + 1], "lowerBorder": Math.ceil(steps[i] * totalQuiz), "upperBorder": Math.ceil(steps[i + 1] * totalQuiz) - 1};
            if(i === steps.length - 2) grade.upperBorder = totalQuiz;
        } else break;
    }

    return grade;
}

function displayPerformance() {
    const grade = calculateGrade();
    document.getElementById('total').innerText = "Gesamt: " + totalQuiz;
    document.getElementById('correct').innerText = "Richtig: " + correctQuiz + " (" + (totalQuiz > 0 ? Math.round(correctQuiz / totalQuiz * 1000) / 10 : 0.0) + "%)";
    document.getElementById('grade').innerText = grade.note;
    document.getElementById('border').innerText = `(${grade.lowerBorder} bis ${grade.upperBorder} Punkte)`;
    document.getElementById('timer').innerText = "Zeit: " + formatTime(totalTime);
}

function incrementCorrect() {
    correctQuiz++;
    displayPerformance();
}

function decrementCorrect() {
    correctQuiz--;
    displayPerformance();
}

function greenPulse() {
    var element = document.body; // oder ein anderer Container, den du animieren möchtest
    element.classList.add('green-pulse');
  
    setTimeout(function() {
      element.classList.remove('green-pulse');
    }, 250);
}
  
function redPulse() {
    var element = document.body; // oder ein anderer Container, den du animieren möchtest
    element.classList.add('red-pulse');
  
    setTimeout(function() {
      element.classList.remove('red-pulse');
    }, 250);
}

async function getQuestion() {
    document.getElementById('quiz-question').innerText = "Deine Quizfrage wird generiert...";
    document.getElementById('feedback').innerText = "";
    document.getElementById('feedback').style.display = "none";
    document.getElementById('btnFeedback').style.display = "none";
    document.getElementById('btnWeiter').style.display = "none";

    const response = await fetch(`${domain}/get-quiz`);
    question = await response.json();
    document.getElementById('quiz-question').innerText = question.quiz;
    document.getElementById('buttonContainer').style.display = "flex";

    startTime = new Date();
}
  
async function submitAnswer(answer) {
    const endTime = new Date();
    totalTime += endTime - startTime;
    localStorage.setItem("totalTime", totalTime);
    document.getElementById('buttonContainer').style.display = "none";

    myAnswer = answer;
    let answerCorrect = false;
    if (myAnswer === "Wahr" && question.statementCorrect === true) answerCorrect = true;
    if (myAnswer === "Falsch" && question.statementCorrect === false) answerCorrect = true;
    if (answerCorrect) {
        document.getElementById('feedback').innerText = "Richtig! Du hast diese Aussage mit \"" + myAnswer + "\" korrekt beurteilt.";
        greenPulse();
        correctQuiz++;
        localStorage.setItem("correctQuiz", correctQuiz);
    } else {
        document.getElementById('feedback').innerText = "Falsch! Du hast diese Aussage mit \"" + myAnswer + "\" falsch beurteilt. Die Aussage ist tatsächlich " + (question.statementCorrect ? "wahr" : "falsch") + ".";
        redPulse();
    }
    totalQuiz++;
    localStorage.setItem("totalQuiz", totalQuiz);

    displayPerformance();
    document.getElementById('feedback').style.display = "block";
    document.getElementById('btnWeiter').style.display = "block";
    document.getElementById('btnFeedback').style.display = "block";
}
  
async function showFeedback() {
    document.getElementById('btnFeedback').style.display = "none";
    document.getElementById('btnWeiter').style.display = "none";
    document.getElementById('details').style.display = "block";
    document.getElementById('details').innerText = "Dein ausführliches Feedback wird generiert...";
    const feedbackResponse = await fetch(`${domain}/get-feedback?answer=${myAnswer}`);
    const feedback = await feedbackResponse.json();
    document.getElementById('details').innerText = feedback.feedback;
    document.getElementById('btnWeiter').style.display = "block";
}

function nextQuestion() {
    getQuestion(); // Startet die nächste Frage
    document.getElementById('feedback').style.display = "none";
    document.getElementById('details').style.display = "none";
}
  
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').then(function(registration) {
        console.log('Service Worker registered with scope:', registration.scope);
    }).catch(function(error) {
        console.log('Service Worker registration failed:', error);
    });
}

function loadProgress() {
    if(!localStorage.getItem("totalQuiz")) {
        localStorage.setItem("totalQuiz", 0);
        localStorage.setItem("correctQuiz", 0);
        localStorage.setItem("totalTime", 0);
    }
    totalQuiz = parseInt(localStorage.getItem("totalQuiz"));
    correctQuiz = parseInt(localStorage.getItem("correctQuiz"));
    totalTime = parseInt(localStorage.getItem("totalTime"));
    displayPerformance();
}

function resetProgress() {
    totalQuiz = 0;
    correctQuiz = 0;
    totalTime = 0;
    localStorage.setItem("totalQuiz", totalQuiz);
    localStorage.setItem("correctQuiz", correctQuiz);
    localStorage.setItem("totalTime", totalTime);
    displayPerformance();
}

// Startet die erste Frage beim Laden der Seite
loadProgress();
getQuestion();