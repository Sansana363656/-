let vocabData = [];
let currentPage = 1;
const itemsPerPage = 10;
let currentDay = 1;

// --- ระบบแสดงผลและจัดการข้อมูล ---

async function loadVocab(day) {
    try {
        const response = await fetch(`day${day}.json`);
        if (!response.ok) throw new Error('Network response was not ok');
        vocabData = await response.json();
        currentPage = 1;
        displayVocab();
        updatePaginationButtons();
        document.getElementById('current-day-display').innerText = `วันที่ ${day}`;
    } catch (error) {
        console.error('Error loading vocab:', error);
        document.getElementById('vocab-container').innerHTML = `<p style="color:red; text-align:center;">ไม่พบข้อมูลของวันที่ ${day} หรือไฟล์มีข้อผิดพลาด</p>`;
    }
}

function displayVocab() {
    const container = document.getElementById('vocab-container');
    container.innerHTML = '';

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = vocabData.slice(startIndex, endIndex);

    pageData.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${item.image}" 
                 alt="${item.word}" 
                 class="word-img" 
                 onerror="if (this.src !== '${item.image_backup}') { this.src = '${item.image_backup}'; } else { this.src = 'https://via.placeholder.com/300?text=No+Image'; }">
            <div>
                <div class="word">${item.word}</div>
                <div class="reading">${item.reading}</div>
                <div class="meaning">${item.meaning}</div>
            </div>
            <button class="btn-listen" onclick="speakFull('${item.word}', '${item.meaning}')">🔊 ฟังคำอ่าน (EN-TH)</button>
        `;
        container.appendChild(card);
    });
}

function speakFull(enText, thText) {
    window.speechSynthesis.cancel();
    const msgEn = new SpeechSynthesisUtterance(enText);
    msgEn.lang = 'en-US';
    msgEn.rate = 0.8;
    const msgTh = new SpeechSynthesisUtterance(thText);
    msgTh.lang = 'th-TH';
    msgTh.rate = 1.0;
    msgEn.onend = () => { window.speechSynthesis.speak(msgTh); };
    window.speechSynthesis.speak(msgEn);
}

function updatePaginationButtons() {
    const paginationDiv = document.getElementById('pagination-controls');
    paginationDiv.innerHTML = '';
    if (vocabData.length <= itemsPerPage) return;
    paginationDiv.innerHTML = `
        <button onclick="changePage(-1)" ${currentPage === 1 ? 'disabled' : ''} style="background:#666; margin:5px;">⬅️ หน้าก่อน</button>
        <span style="font-weight:bold; margin:0 15px;">หน้าที่ ${currentPage}</span>
        <button onclick="changePage(1)" ${currentPage * itemsPerPage >= vocabData.length ? 'disabled' : ''} style="background:#666; margin:5px;">หน้าถัดไป ➡️</button>
    `;
}

function changePage(step) {
    currentPage += step;
    displayVocab();
    updatePaginationButtons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function changeDay(step) {
    let nextDay = currentDay + step;
    if (nextDay < 1) return;
    currentDay = nextDay;
    loadVocab(currentDay);
}

function searchVocab() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredData = vocabData.filter(item => 
        item.word.toLowerCase().includes(searchTerm) || 
        item.meaning.includes(searchTerm)
    );
    const container = document.getElementById('vocab-container');
    container.innerHTML = '';
    filteredData.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${item.image}" alt="${item.word}" class="word-img" onerror="this.src='${item.image_backup}'">
            <div>
                <div class="word">${item.word}</div>
                <div class="reading">${item.reading}</div>
                <div class="meaning">${item.meaning}</div>
            </div>
            <button class="btn-listen" onclick="speakFull('${item.word}', '${item.meaning}')">🔊 ฟังคำอ่าน (EN-TH)</button>
        `;
        container.appendChild(card);
    });
}

// --- ระบบเกม (Quiz Mode) ---

let score = 0;
let correctAnswer = null;

function startGame() {
    if (vocabData.length < 4) {
        alert("ต้องมีคำศัพท์อย่างน้อย 4 คำเพื่อเล่นเกมครับ");
        return;
    }
    score = 0;
    document.getElementById('score-display').innerText = `คะแนน: ${score}`;
    document.getElementById('game-container').style.display = 'block';
    nextQuestion();
}

function nextQuestion() {
    const choicesContainer = document.getElementById('choices-container');
    choicesContainer.innerHTML = '';
    
    // สุ่มคำถาม
    const randomIndex = Math.floor(Math.random() * vocabData.length);
    correctAnswer = vocabData[randomIndex];
    document.getElementById('target-word').innerText = correctAnswer.word;

    // สร้างตัวเลือก 4 รูป
    let choices = [correctAnswer];
    while (choices.length < 4) {
        let randomWrong = vocabData[Math.floor(Math.random() * vocabData.length)];
        if (!choices.includes(randomWrong)) {
            choices.push(randomWrong);
        }
    }
    choices.sort(() => Math.random() - 0.5);

    choices.forEach(item => {
        const img = document.createElement('img');
        img.src = item.image;
        img.className = 'game-choice-img';
        img.style = "width: 100%; height: 150px; object-fit: cover; border-radius: 15px; cursor: pointer; border: 4px solid #eee; transition: 0.3s;";
        img.onclick = () => checkAnswer(item, img);
        img.onerror = () => { img.src = item.image_backup; };
        choicesContainer.appendChild(img);
    });
}

function checkAnswer(selectedItem, element) {
    if (selectedItem.word === correctAnswer.word) {
        score++;
        element.style.borderColor = "#4caf50";
        document.getElementById('score-display').innerText = `คะแนน: ${score}`;
        speakFull(correctAnswer.word, correctAnswer.meaning);
        setTimeout(() => { nextQuestion(); }, 1000);
    } else {
        element.style.borderColor = "#ff5252";
        element.style.opacity = "0.5";
    }
}

function closeGame() {
    document.getElementById('game-container').style.display = 'none';
}

window.onload = () => { loadVocab(currentDay); };