let vocabData = [];
let currentPage = 1;
const itemsPerPage = 10;
let currentDay = 1;

// --- ระบบเกม (Quiz Mode) ---
let score = 0;
let correctAnswer = null;
let currentGameMode = 1; // 1 = ทายภาพจากศัพท์, 2 = ทายศัพท์จากภาพ

// 1. โหลดข้อมูลคำศัพท์
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
        document.getElementById('vocab-container').innerHTML = `<p style="color:red; text-align:center;">ไม่พบข้อมูลของวันที่ ${day}</p>`;
    }
}

// 2. แสดงรายการคำศัพท์หน้าหลัก
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

// 3. ระบบเสียง
function speakFull(enText, thText) {
    window.speechSynthesis.cancel();
    const msgEn = new SpeechSynthesisUtterance(enText);
    msgEn.lang = 'en-US';
    msgEn.rate = 0.8;
    const msgTh = new SpeechSynthesisUtterance(thText);
    msgTh.lang = 'th-TH';
    msgEn.onend = () => { window.speechSynthesis.speak(msgTh); };
    window.speechSynthesis.speak(msgEn);
}

// 4. ระบบค้นหา
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

// 5. ระบบจัดการหน้าและเปลี่ยนวัน
function updatePaginationButtons() {
    const paginationDiv = document.getElementById('pagination-controls');
    paginationDiv.innerHTML = '';
    if (vocabData.length <= itemsPerPage) return;
    paginationDiv.innerHTML = `
        <button onclick="changePage(-1)" ${currentPage === 1 ? 'disabled' : ''}>⬅️ ก่อนหน้า</button>
        <span style="font-weight:bold; margin:0 15px;">หน้าที่ ${currentPage}</span>
        <button onclick="changePage(1)" ${currentPage * itemsPerPage >= vocabData.length ? 'disabled' : ''}>ถัดไป ➡️</button>
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
    if (nextDay < 1 || nextDay > 30) return;
    currentDay = nextDay;
    loadVocab(currentDay);
}

// 6. ระบบเกม (รองรับ 2 แบบ)
function startGame(mode = 1) {
    if (vocabData.length < 4) {
        alert("ต้องมีคำศัพท์อย่างน้อย 4 คำเพื่อเล่นเกมครับ");
        return;
    }
    currentGameMode = mode;
    score = 0;
    document.getElementById('score-display').innerText = `คะแนน: ${score}`;
    document.getElementById('game-container').style.display = 'block';
    
    // ตั้งหัวข้อเกม
    const title = document.querySelector('#game-container h1');
    title.innerText = (mode === 1) ? "คำนี้คือภาพไหน?" : "รูปนี้คือคำศัพท์ว่าอะไร?";
    
    nextQuestion();
}

function nextQuestion() {
    const choicesContainer = document.getElementById('choices-container');
    const targetWord = document.getElementById('target-word');
    const targetImage = document.getElementById('target-image');
    
    choicesContainer.innerHTML = '';
    
    const randomIndex = Math.floor(Math.random() * vocabData.length);
    correctAnswer = vocabData[randomIndex];

    if (currentGameMode === 1) {
        // เกม 1: โชว์ศัพท์
        targetWord.style.display = 'inline-block';
        if (targetImage) targetImage.style.display = 'none';
        targetWord.innerText = correctAnswer.word;
    } else {
        // เกม 2: โชว์รูป
        targetWord.style.display = 'none';
        if (targetImage) {
            targetImage.style.display = 'block';
            targetImage.src = correctAnswer.image;
            targetImage.onerror = () => { targetImage.src = correctAnswer.image_backup; };
        }
    }

    // สร้างตัวเลือก 4 อย่าง
    let choices = [correctAnswer];
    while (choices.length < 4) {
        let randomWrong = vocabData[Math.floor(Math.random() * vocabData.length)];
        if (!choices.includes(randomWrong)) choices.push(randomWrong);
    }
    choices.sort(() => Math.random() - 0.5);

    choices.forEach(item => {
        if (currentGameMode === 1) {
            // โหมด 1: ตัวเลือกเป็นรูปภาพ
            const img = document.createElement('img');
            img.src = item.image;
            img.style = "width: 100%; height: 150px; object-fit: cover; border-radius: 15px; cursor: pointer; border: 4px solid #eee;";
            img.onclick = () => checkAnswer(item, img);
            img.onerror = () => { img.src = item.image_backup; };
            choicesContainer.appendChild(img);
        } else {
            // โหมด 2: ตัวเลือกเป็นปุ่มคำศัพท์
            const btn = document.createElement('button');
            btn.innerText = item.word;
            btn.style = "width: 100%; padding: 20px; font-size: 1.3rem; border-radius: 15px; cursor: pointer; border: 2px solid #ddd; background: white; font-weight: bold;";
            btn.onclick = () => checkAnswer(item, btn);
            choicesContainer.appendChild(btn);
        }
    });
}

function checkAnswer(selectedItem, element) {
    if (selectedItem.word === correctAnswer.word) {
        score++;
        element.style.borderColor = "#4caf50";
        if (currentGameMode === 2) element.style.background = "#e8f5e9";
        document.getElementById('score-display').innerText = `คะแนน: ${score}`;
        speakFull(correctAnswer.word, correctAnswer.meaning);
        setTimeout(nextQuestion, 1200);
    } else {
        element.style.borderColor = "#ff5252";
        element.style.opacity = "0.5";
    }
}

function closeGame() {
    document.getElementById('game-container').style.display = 'none';
    window.speechSynthesis.cancel();
}

window.onload = () => { loadVocab(currentDay); };