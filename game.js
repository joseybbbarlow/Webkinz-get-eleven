// Card mapping (1-10 only)
const CARD_IMAGES = {
    1: 'images/card_hearts_A.png',
    2: 'images/card_diamonds_02.png',
    3: 'images/card_clubs_03.png',
    4: 'images/card_hearts_04.png',
    5: 'images/card_spades_05.png',
    6: 'images/card_diamonds_06.png',
    7: 'images/card_clubs_07.png',
    8: 'images/card_hearts_08.png',
    9: 'images/card_spades_09.png',
    10: 'images/card_diamonds_10.png'
};

const CARD_BACK = 'images/card_back.png';

// Preload images
function preloadImages() {
    Object.values(CARD_IMAGES).forEach(src => {
        const img = new Image();
        img.src = src;
    });
    const backImg = new Image();
    backImg.src = CARD_BACK;
}

// Game State
let gameState = {
    deck: [],
    leftPyramid: [],
    middlePyramid: [],
    rightPyramid: [],
    drawnCard: null,
    selected: [],
    bonusCards: [],
    score: 0,
    level: 1,
    timeRemaining: 148,
    gameOver: false,
    combo: 0
};

let timerInterval = null;

preloadImages();

// Create deck with more low cards
function createDeck() {
    const deck = [];
    
    // More 1s, 2s, 3s (8 of each)
    for (let i = 0; i < 8; i++) {
        deck.push(1, 2, 3);
    }
    
    // Regular amount of 4-7 (5 of each)
    for (let i = 0; i < 5; i++) {
        deck.push(4, 5, 6, 7);
    }
    
    // Fewer 8-10 (3 of each)
    for (let i = 0; i < 3; i++) {
        deck.push(8, 9, 10);
    }
    
    return shuffle(deck);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getTimeForLevel(level) {
    return Math.max(60, 148 - ((level - 1) * 8));
}

// Setup three pyramids with covering information
function setupPyramids() {
    let cardIndex = 0;
    const deck = gameState.deck;
    
    // Left pyramid (1,2,3,2,1 = 9 cards)
    // Each card knows which cards cover it
    const leftPyramid = [
        // Row 0 - covered by row 1 col 0 and 1
        [{value: deck[cardIndex++], row: 0, col: 0, pyramid: 'left', removed: false, 
          coveredBy: [{row:1, col:0}, {row:1, col:1}]}],
        // Row 1 - covered by row 2
        [{value: deck[cardIndex++], row: 1, col: 0, pyramid: 'left', removed: false,
          coveredBy: [{row:2, col:0}, {row:2, col:1}]},
         {value: deck[cardIndex++], row: 1, col: 1, pyramid: 'left', removed: false,
          coveredBy: [{row:2, col:1}, {row:2, col:2}]}],
        // Row 2 - covered by row 3
        [{value: deck[cardIndex++], row: 2, col: 0, pyramid: 'left', removed: false,
          coveredBy: [{row:3, col:0}]},
         {value: deck[cardIndex++], row: 2, col: 1, pyramid: 'left', removed: false,
          coveredBy: [{row:3, col:0}, {row:3, col:1}]},
         {value: deck[cardIndex++], row: 2, col: 2, pyramid: 'left', removed: false,
          coveredBy: [{row:3, col:1}]}],
        // Row 3 - covered by row 4
        [{value: deck[cardIndex++], row: 3, col: 0, pyramid: 'left', removed: false,
          coveredBy: [{row:4, col:0}]},
         {value: deck[cardIndex++], row: 3, col: 1, pyramid: 'left', removed: false,
          coveredBy: [{row:4, col:0}]}],
        // Row 4 - bottom, not covered
        [{value: deck[cardIndex++], row: 4, col: 0, pyramid: 'left', removed: false,
          coveredBy: []}]
    ];
    
    // Middle pyramid (1,2,1 = 4 cards)
    const middlePyramid = [
        // Row 0 - top, covered by row 1
        [{value: deck[cardIndex++], row: 0, col: 0, pyramid: 'middle', removed: false,
          coveredBy: [{row:1, col:0}, {row:1, col:1}]}],
        // Row 1 - middle, covered by row 2, LOCKED initially
        [{value: deck[cardIndex++], row: 1, col: 0, pyramid: 'middle', removed: false,
          coveredBy: [{row:2, col:0}], locked: true},
         {value: deck[cardIndex++], row: 1, col: 1, pyramid: 'middle', removed: false,
          coveredBy: [{row:2, col:0}], locked: true}],
        // Row 2 - bottom, ALWAYS AVAILABLE
        [{value: deck[cardIndex++], row: 2, col: 0, pyramid: 'middle', removed: false,
          coveredBy: []}]
    ];
    
    // Right pyramid (1,2,3,2,1 = 9 cards)
    const rightPyramid = [
        [{value: deck[cardIndex++], row: 0, col: 0, pyramid: 'right', removed: false,
          coveredBy: [{row:1, col:0}, {row:1, col:1}]}],
        [{value: deck[cardIndex++], row: 1, col: 0, pyramid: 'right', removed: false,
          coveredBy: [{row:2, col:0}, {row:2, col:1}]},
         {value: deck[cardIndex++], row: 1, col: 1, pyramid: 'right', removed: false,
          coveredBy: [{row:2, col:1}, {row:2, col:2}]}],
        [{value: deck[cardIndex++], row: 2, col: 0, pyramid: 'right', removed: false,
          coveredBy: [{row:3, col:0}]},
         {value: deck[cardIndex++], row: 2, col: 1, pyramid: 'right', removed: false,
          coveredBy: [{row:3, col:0}, {row:3, col:1}]},
         {value: deck[cardIndex++], row: 2, col: 2, pyramid: 'right', removed: false,
          coveredBy: [{row:3, col:1}]}],
        [{value: deck[cardIndex++], row: 3, col: 0, pyramid: 'right', removed: false,
          coveredBy: [{row:4, col:0}]},
         {value: deck[cardIndex++], row: 3, col: 1, pyramid: 'right', removed: false,
          coveredBy: [{row:4, col:0}]}],
        [{value: deck[cardIndex++], row: 4, col: 0, pyramid: 'right', removed: false,
          coveredBy: []}]
    ];
    
    // Remaining cards go to deck
    gameState.deck = deck.slice(cardIndex);
    
    return { leftPyramid, middlePyramid, rightPyramid };
}

// Check if middle row 1 should be unlocked
function isMiddleRow1Unlocked() {
    // Unlocks when innermost card from left OR right 3-row is cleared
    const leftInner = gameState.leftPyramid[2][2]; // rightmost of left 3-row
    const rightInner = gameState.rightPyramid[2][0]; // leftmost of right 3-row
    
    return leftInner.removed || rightInner.removed;
}

// Check if a card is available (all covering cards removed)
function isCardAvailable(pyramid, card) {
    if (card.removed) return false;
    
    // Middle pyramid row 1 special case
    if (card.pyramid === 'middle' && card.row === 1 && card.locked) {
        if (!isMiddleRow1Unlocked()) return false;
        // Unlock the cards
        card.locked = false;
    }
    
    // Check if all covering cards are removed
    for (let cover of card.coveredBy) {
        const coveringCard = pyramid[cover.row][cover.col];
        if (!coveringCard.removed) {
            return false;
        }
    }
    
    return true;
}

function updateAvailability() {
    // Check middle unlock first
    const middleUnlocked = isMiddleRow1Unlocked();
    if (middleUnlocked) {
        gameState.middlePyramid[1].forEach(card => card.locked = false);
    }
    
    // Update left pyramid
    gameState.leftPyramid.forEach(row => {
        row.forEach(card => {
            card.available = isCardAvailable(gameState.leftPyramid, card);
        });
    });
    
    // Update middle pyramid
    gameState.middlePyramid.forEach(row => {
        row.forEach(card => {
            card.available = isCardAvailable(gameState.middlePyramid, card);
        });
    });
    
    // Update right pyramid
    gameState.rightPyramid.forEach(row => {
        row.forEach(card => {
            card.available = isCardAvailable(gameState.rightPyramid, card);
        });
    });
}

// Rendering
function renderPyramids() {
    const container = document.getElementById('pyramidsContainer');
    container.innerHTML = '';
    
    // Render middle pyramid first (highest, in back)
    const middleDiv = document.createElement('div');
    middleDiv.className = 'pyramid middle';
    renderPyramid(gameState.middlePyramid, middleDiv, 'middle');
    container.appendChild(middleDiv);
    
    // Render left pyramid
    const leftDiv = document.createElement('div');
    leftDiv.className = 'pyramid left';
    renderPyramid(gameState.leftPyramid, leftDiv, 'left');
    container.appendChild(leftDiv);
    
    // Render right pyramid
    const rightDiv = document.createElement('div');
    rightDiv.className = 'pyramid right';
    renderPyramid(gameState.rightPyramid, rightDiv, 'right');
    container.appendChild(rightDiv);
}

function renderPyramid(pyramid, container, pyramidName) {
    pyramid.forEach((row, rowIndex) => {
        const rowEl = document.createElement('div');
        rowEl.className = 'pyramid-row';
        
        row.forEach((card, colIndex) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            cardEl.style.backgroundImage = `url('${CARD_IMAGES[card.value]}')`;
            
            if (card.removed) {
                cardEl.classList.add('removed');
            } else if (card.available) {
                cardEl.classList.add('available');
                cardEl.onclick = () => selectCard(pyramidName, rowIndex, colIndex);
            } else {
                cardEl.classList.add('unavailable');
            }
            
            if (gameState.selected.some(s => !s.isBonus && !s.isDrawn && 
                s.pyramid === pyramidName && s.row === rowIndex && s.col === colIndex)) {
                cardEl.classList.add('selected');
            }
            
            rowEl.appendChild(cardEl);
        });
        
        container.appendChild(rowEl);
    });
}

function selectCard(pyramid, row, col) {
    let card;
    if (pyramid === 'left') card = gameState.leftPyramid[row][col];
    else if (pyramid === 'middle') card = gameState.middlePyramid[row][col];
    else card = gameState.rightPyramid[row][col];
    
    if (!card.available || card.removed) return;
    
    const selectedIndex = gameState.selected.findIndex(s => 
        !s.isBonus && !s.isDrawn && s.pyramid === pyramid && s.row === row && s.col === col);
    
    if (selectedIndex >= 0) {
        gameState.selected.splice(selectedIndex, 1);
    } else {
        gameState.selected.push({ pyramid, row, col, value: card.value, isBonus: false, isDrawn: false });
    }
    
    checkSelection();
}

function selectDrawnCard() {
    if (!gameState.drawnCard) return;
    
    const selectedIndex = gameState.selected.findIndex(s => s.isDrawn);
    
    if (selectedIndex >= 0) {
        gameState.selected.splice(selectedIndex, 1);
    } else {
        gameState.selected.push({ value: gameState.drawnCard, isDrawn: true, isBonus: false });
    }
    
    checkSelection();
}

function selectBonusCard(bonusIndex) {
    const selectedIndex = gameState.selected.findIndex(s => s.isBonus && s.bonusIndex === bonusIndex);
    
    if (selectedIndex >= 0) {
        gameState.selected.splice(selectedIndex, 1);
    } else {
        const bonusCard = gameState.bonusCards[bonusIndex];
        gameState.selected.push({ bonusIndex, value: bonusCard.value, isBonus: true, isDrawn: false });
    }
    
    checkSelection();
}

function checkSelection() {
    const sum = gameState.selected.reduce((acc, card) => acc + card.value, 0);
    
    if (sum === 11) {
        setTimeout(() => removeSelected(), 100);
    }
    
    renderPyramids();
    renderDrawnCard();
    renderBonusCards();
}

function removeSelected() {
    if (gameState.selected.length === 0) return;
    
    const sum = gameState.selected.reduce((acc, card) => acc + card.value, 0);
    
    if (sum === 11) {
        gameState.selected.forEach(card => {
            if (card.isBonus) {
                gameState.bonusCards.splice(card.bonusIndex, 1);
            } else if (card.isDrawn) {
                gameState.drawnCard = null;
            } else {
                let pyramid;
                if (card.pyramid === 'left') pyramid = gameState.leftPyramid;
                else if (card.pyramid === 'middle') pyramid = gameState.middlePyramid;
                else pyramid = gameState.rightPyramid;
                
                pyramid[card.row][card.col].removed = true;
            }
        });
        
        const points = gameState.selected.length * 10;
        gameState.score += points;
        gameState.combo++;
        
        if (gameState.combo >= 5) {
            addBonusCard();
            gameState.combo = 0;
        }
        
        gameState.selected = [];
        updateAvailability();
        renderPyramids();
        renderDrawnCard();
        renderBonusCards();
        updateStats();
        
        checkWinCondition();
    }
}

function drawCard() {
    if (gameState.deck.length === 0) return;
    
    // If there's already a drawn card, put it back
    if (gameState.drawnCard !== null) {
        // Try to find highest empty spot
        const emptySpot = findEmptySpot();
        if (emptySpot) {
            // Place old drawn card in empty spot
            let pyramid;
            if (emptySpot.pyramid === 'left') pyramid = gameState.leftPyramid;
            else if (emptySpot.pyramid === 'middle') pyramid = gameState.middlePyramid;
            else pyramid = gameState.rightPyramid;
            
            const oldCard = pyramid[emptySpot.row][emptySpot.col];
            oldCard.value = gameState.drawnCard;
            oldCard.removed = false;
        } else {
            // No empty spots - put card back in deck at bottom
            gameState.deck.push(gameState.drawnCard);
        }
    }
    
    // Draw new card
    gameState.drawnCard = gameState.deck.shift();
    gameState.combo = 0; // Drawing resets combo
    
    updateAvailability();
    renderPyramids();
    renderDrawnCard();
    updateDeckCount();
    checkMovesAvailable();
}

function findEmptySpot() {
    // Get all empty spots
    const emptySpots = [];
    const pyramids = [
        {name: 'left', pyramid: gameState.leftPyramid},
        {name: 'middle', pyramid: gameState.middlePyramid},
        {name: 'right', pyramid: gameState.rightPyramid}
    ];
    
    for (let p of pyramids) {
        for (let row = 0; row < p.pyramid.length; row++) {
            for (let col = 0; col < p.pyramid[row].length; col++) {
                if (p.pyramid[row][col].removed) {
                    emptySpots.push({pyramid: p.name, row, col});
                }
            }
        }
    }
    
    if (emptySpots.length === 0) return null;
    
    // Filter for spots that don't cover any cards
    const uncoveringSpots = emptySpots.filter(spot => !coversAnyCard(spot));
    
    // If we have uncovering spots, return the topmost one (highest priority = lowest row)
    if (uncoveringSpots.length > 0) {
        // Sort by row (ascending), then by pyramid order, then by col
        uncoveringSpots.sort((a, b) => {
            if (a.row !== b.row) return a.row - b.row;
            const pyramidOrder = {left: 0, middle: 1, right: 2};
            if (pyramidOrder[a.pyramid] !== pyramidOrder[b.pyramid]) {
                return pyramidOrder[a.pyramid] - pyramidOrder[b.pyramid];
            }
            return a.col - b.col;
        });
        return uncoveringSpots[0];
    }
    
    // Otherwise, return the topmost covering spot as fallback
    emptySpots.sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        const pyramidOrder = {left: 0, middle: 1, right: 2};
        if (pyramidOrder[a.pyramid] !== pyramidOrder[b.pyramid]) {
            return pyramidOrder[a.pyramid] - pyramidOrder[b.pyramid];
        }
        return a.col - b.col;
    });
    
    return emptySpots[0];
}

function coversAnyCard(emptySpot) {
    // Determine which pyramid we're in
    let pyramid;
    if (emptySpot.pyramid === 'left') pyramid = gameState.leftPyramid;
    else if (emptySpot.pyramid === 'middle') pyramid = gameState.middlePyramid;
    else pyramid = gameState.rightPyramid;
    
    // Check if any card lists this empty spot in their coveredBy array
    for (let row = 0; row < pyramid.length; row++) {
        for (let col = 0; col < pyramid[row].length; col++) {
            const card = pyramid[row][col];
            // If the card is not removed, check if it's covered by this spot
            if (!card.removed) {
                for (let coverSpot of card.coveredBy) {
                    if (coverSpot.row === emptySpot.row && coverSpot.col === emptySpot.col) {
                        return true; // This empty spot covers an active card
                    }
                }
            }
        }
    }
    
    return false;
}

function renderDrawnCard() {
    const drawnEl = document.getElementById('drawnCard');
    
    if (gameState.drawnCard !== null) {
        drawnEl.style.backgroundImage = `url('${CARD_IMAGES[gameState.drawnCard]}')`;
        drawnEl.className = 'drawn-card';
        drawnEl.onclick = () => selectDrawnCard();
        
        if (gameState.selected.some(s => s.isDrawn)) {
            drawnEl.classList.add('selected');
        }
    } else {
        drawnEl.style.backgroundImage = 'none';
        drawnEl.className = 'drawn-card empty';
        drawnEl.onclick = null;
    }
}

function updateDeckCount() {
    const deckPile = document.getElementById('deckPile');
    const countEl = document.getElementById('cardsLeftCount');
    
    countEl.textContent = gameState.deck.length;
    
    if (gameState.deck.length > 0) {
        deckPile.style.backgroundImage = `url('${CARD_BACK}')`;
    } else {
        deckPile.style.backgroundImage = 'none';
        deckPile.style.background = '#999';
    }
}

function renderBonusCards() {
    const container = document.getElementById('bonusCards');
    container.innerHTML = '';
    
    gameState.bonusCards.forEach((bonusCard, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'bonus-card';
        cardEl.style.backgroundImage = `url('${CARD_IMAGES[bonusCard.value]}')`;
        cardEl.onclick = () => selectBonusCard(index);
        
        if (gameState.selected.some(s => s.isBonus && s.bonusIndex === index)) {
            cardEl.classList.add('selected');
        }
        
        container.appendChild(cardEl);
    });
}

function addBonusCard() {
    const randomValue = Math.floor(Math.random() * 10) + 1;
    gameState.bonusCards.push({ value: randomValue });
    showNotification('⭐ BONUS CARD!', 'bonus');
    renderBonusCards();
}

function hasMovesAvailable() {
    const availableCards = [];
    
    [gameState.leftPyramid, gameState.middlePyramid, gameState.rightPyramid].forEach(pyramid => {
        pyramid.forEach(row => {
            row.forEach(card => {
                if (card.available && !card.removed) {
                    availableCards.push(card.value);
                }
            });
        });
    });
    
    if (gameState.drawnCard !== null) {
        availableCards.push(gameState.drawnCard);
    }
    
    gameState.bonusCards.forEach(bonusCard => {
        availableCards.push(bonusCard.value);
    });
    
    if (availableCards.length === 0) return false;
    
    return checkCombinations(availableCards, 11);
}

function checkCombinations(cards, target) {
    for (let size = 2; size <= Math.min(5, cards.length); size++) {
        if (hasCombination(cards, target, size)) return true;
    }
    return false;
}

function hasCombination(cards, target, size) {
    function combine(start, chosen) {
        if (chosen.length === size) {
            const sum = chosen.reduce((a, b) => a + b, 0);
            if (sum === target) return true;
            return false;
        }
        
        for (let i = start; i < cards.length; i++) {
            chosen.push(cards[i]);
            if (combine(i + 1, chosen)) return true;
            chosen.pop();
        }
        
        return false;
    }
    
    return combine(0, []);
}

function checkMovesAvailable() {
    if (!hasMovesAvailable() && gameState.deck.length === 0) {
        setTimeout(() => endGame(false, 'No more moves!'), 500);
    }
}

function updateStats() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('w').textContent = '0'; // Placeholder for W
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        gameState.timeRemaining--;
        
        const timerEl = document.getElementById('timer');
        timerEl.textContent = gameState.timeRemaining;
        
        if (gameState.timeRemaining <= 30) {
            timerEl.classList.add('warning');
        } else {
            timerEl.classList.remove('warning');
        }
        
        if (gameState.timeRemaining <= 0) {
            clearInterval(timerInterval);
            endGame(false, 'Time\'s up!');
        }
    }, 1000);
}

function checkWinCondition() {
    const allCleared = 
        gameState.leftPyramid.every(row => row.every(card => card.removed)) &&
        gameState.middlePyramid.every(row => row.every(card => card.removed)) &&
        gameState.rightPyramid.every(row => row.every(card => card.removed));
    
    if (allCleared) {
        clearInterval(timerInterval);
        setTimeout(() => showLevelComplete(), 500);
    }
}

function showLevelComplete() {
    const overlay = document.getElementById('messageOverlay');
    const box = document.getElementById('messageBox');
    const title = document.getElementById('messageTitle');
    const text = document.getElementById('messageText');
    
    title.textContent = `Level ${gameState.level} Complete!`;
    text.textContent = `Score: ${gameState.score}\nGet ready for Level ${gameState.level + 1}!`;
    box.className = 'message-box';
    
    overlay.classList.add('show');
}

function nextLevel() {
    document.getElementById('messageOverlay').classList.remove('show');
    
    gameState.level++;
    gameState.timeRemaining = getTimeForLevel(gameState.level);
    gameState.deck = createDeck();
    
    const pyramids = setupPyramids();
    gameState.leftPyramid = pyramids.leftPyramid;
    gameState.middlePyramid = pyramids.middlePyramid;
    gameState.rightPyramid = pyramids.rightPyramid;
    
    gameState.selected = [];
    gameState.combo = 0;
    gameState.drawnCard = null;
    gameState.bonusCards = [];
    
    updateAvailability();
    renderPyramids();
    renderDrawnCard();
    renderBonusCards();
    updateDeckCount();
    updateStats();
    
    startTimer();
}

function endGame(won, message) {
    gameState.gameOver = true;
    clearInterval(timerInterval);
    
    const overlay = document.getElementById('messageOverlay');
    const box = document.getElementById('messageBox');
    const title = document.getElementById('messageTitle');
    const text = document.getElementById('messageText');
    const btn = box.querySelector('.btn');
    
    if (won) {
        title.textContent = '🎉 Amazing!';
        text.textContent = `Final Score: ${gameState.score}\nLevel: ${gameState.level}`;
        box.className = 'message-box';
    } else {
        title.textContent = '😔 Game Over';
        text.textContent = `${message}\nFinal Score: ${gameState.score}\nLevel: ${gameState.level}`;
        box.className = 'message-box game-over';
    }
    
    btn.textContent = 'Play Again';
    btn.onclick = resetGame;
    
    overlay.classList.add('show');
}

function showNotification(text, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = text;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 1500);
}

function resetGame() {
    document.getElementById('messageOverlay').classList.remove('show');
    initGame();
}

function initGame() {
    gameState = {
        deck: createDeck(),
        leftPyramid: [],
        middlePyramid: [],
        rightPyramid: [],
        drawnCard: null,
        selected: [],
        bonusCards: [],
        score: 0,
        level: 1,
        timeRemaining: 148,
        gameOver: false,
        combo: 0
    };
    
    const pyramids = setupPyramids();
    gameState.leftPyramid = pyramids.leftPyramid;
    gameState.middlePyramid = pyramids.middlePyramid;
    gameState.rightPyramid = pyramids.rightPyramid;
    
    updateAvailability();
    renderPyramids();
    renderDrawnCard();
    renderBonusCards();
    updateDeckCount();
    updateStats();
    
    startTimer();
}

window.addEventListener('load', () => {
    initGame();
});
