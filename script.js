let vocabData = [];
let currentPage = 1;
const itemsPerPage = 10;

window.onload = function() {
    loadVocab();
};

// --- ฟังก์ชันใหม่: สำหรับกดปุ่มเปลี่ยนวัน ---
function changeDay(step) {
    let dayInput = document.getElementById('dayInput');
    let currentDay = parseInt(dayInput.value);
    let nextDay = currentDay + step;
    
    if (nextDay < 1) return; // ไม่ให้ติดลบ
    
    dayInput.value = nextDay;
    loadVocab(); // โหลดข้อมูลวันใหม่ทันที
}

async function loadVocab() {
    const dayInput = document.getElementById('dayInput').value;
    const fileName = `day${dayInput}.json`;
    
    try {
        const response = await fetch(fileName);
        if (!response.ok) throw new Error(`ยังไม่มีข้อมูลของวันที่ ${dayInput} ครับคุณอ้วน`);
        
        vocabData = await response.json();
        currentPage = 1;
        displayVocab();
    } catch (error) {
        alert(error.message);
        // ถ้าหาไฟล์ไม่เจอ ให้ล้างหน้าจอ
        document.getElementById('vocab-container').innerHTML = '';
        document.getElementById('pagination-controls').innerHTML = '';
    }
}

function displayVocab() {
    const container = document.getElementById('vocab-container');
    container.innerHTML = ''; 

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = vocabData.slice(startIndex, endIndex);

    paginatedItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${item.image}" alt="${item.word}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
            <div>
                <div class="word">${item.word}</div>
                <div class="reading">${item.reading}</div>
                <div class="meaning">${item.meaning}</div>
            </div>
            <button class="btn-listen" onclick="speakFull('${item.word}', '${item.meaning}')">🔊 ฟังคำอ่าน (EN-TH)</button>
        `;
        container.appendChild(card);
    });

    updatePaginationButtons();
}

function speakFull(engText, thText) {
    window.speechSynthesis.cancel();
    const msgEng = new SpeechSynthesisUtterance(engText);
    msgEng.lang = 'en-US';
    msgEng.rate = 0.8; 
    const msgTh = new SpeechSynthesisUtterance(thText);
    msgTh.lang = 'th-TH';
    window.speechSynthesis.speak(msgEng);
    msgEng.onend = function() { window.speechSynthesis.speak(msgTh); };
}

function updatePaginationButtons() {
    const paginationDiv = document.getElementById('pagination-controls');
    // ถ้าคำศัพท์ในวันนั้นมีมากกว่า 10 คำ ถึงจะโชว์ปุ่มเลื่อนหน้า (หน้า 1, 2, 3...)
    if (vocabData.length <= itemsPerPage) {
        paginationDiv.innerHTML = '';
        return;
    }

    paginationDiv.innerHTML = `
        <button onclick="changePage(-1)" ${currentPage === 1 ? 'disabled' : ''} style="background:#666; margin:5px;">⬅️ หน้าก่อน</button>
        <span style="font-weight:bold; margin:0 15px;">หน้า ${currentPage}</span>
        <button onclick="changePage(1)" ${currentPage * itemsPerPage >= vocabData.length ? 'disabled' : ''} style="background:#666; margin:5px;">หน้าถัดไป ➡️</button>
    `;
}

function changePage(step) {
    currentPage += step;
    displayVocab();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            <img src="${item.image}" alt="${item.word}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
            <div>
                <div class="word">${item.word}</div>
                <div class="reading">${item.reading}</div>
                <div class="meaning">${item.meaning}</div>
            </div>
            <button class="btn-listen" onclick="speakFull('${item.word}', '${item.meaning}')">🔊 ฟังคำอ่าน (EN-TH)</button>
        `;
        container.appendChild(card);
    });
    if (searchTerm !== "") document.getElementById('pagination-controls').innerHTML = '';
    else updatePaginationButtons();
}