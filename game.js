// Game constants
const GAME_DURATION = 30; // Game duration in seconds
const CART_SPEED = 20; // Increased from 14 to make cart movement more rapid
const ITEM_SPEED = 6; // Doubled from 3 to match larger item size
const SPAWN_RATE = 500; // Reduced from 1000 to make items appear more frequently
const CART_WIDTH = 160; // Doubled from 80
const CART_HEIGHT = 100; // Doubled from 50
const ITEM_SIZE = 100; // Doubled from 50

// Game variables
let canvas, ctx;
let score = 0;
let timeLeft = GAME_DURATION;
let gameRunning = false;
let gameItems = [];
let cartX = 0;
let cartY = 0;
let keysPressed = {};
let cartImage; // Image for the player's cart
let backgroundImage; // Image for the game background
let pointsAnimations = []; // Array to store point animations
let collectedItems = []; // Array to store collected items
let bonusSpawned = false; // Track if bonus has been spawned
let malusSpawned = false; // Track if malus has been spawned
let gretaSpawned = false; // Track if Tiny Greta has been spawned
let trumpSpawned = false; // Track if Mr Trump has been spawned
let grandmaSpawned = false; // Track if Grandma's Recipes has been spawned
let bearSpawned = false; // Track if Polar Bear has been spawned
let spawnedBehaviors = {}; // Track which behaviors have been spawned
let challengeItems = []; // Array to store the 5 challenge items
let collectedChallengeItems = {}; // Object to track collected challenge items
let carbonCreditEarned = false; // Track if carbon credit has been earned
let countdownSoundPlayed = false; // Track if countdown sound has been played
let itemsSlowed = false; // Track if items are slowed down
let itemsSlowedEndTime = 0; // When the slow effect ends
let itemsFast = false; // Track if items are faster
let itemsFastEndTime = 0; // When the fast effect ends

// Special items
const bonusItem = { name: 'Garden Gnome', points: 25, image: 'bonus.png', fastSpeed: true, smokeColor: 'rgba(100, 200, 255, 0.8)' }; // Light blue haze
const malusItem = { name: 'Pollutant Barrell', points: -20, image: 'malus.png', fastSpeed: true, smokeColor: 'rgba(255, 100, 100, 0.8)' }; // Light red haze
const greenwashingItem = { name: 'Greenwashing', points: -40, image: 'greenwashing.png', sound: 'greenwashing.wav', fastSpeed: true, maxSpawns: 2, smokeColor: 'rgba(255, 100, 100, 0.8)' }; // Light red haze

// Easter Eggs
const gretaItem = { name: 'Tiny Greta', points: '+10 seconds', image: 'greta.png', sound: 'greta.wav', fastSpeed: true, isEasterEgg: true, addTime: 10 }; // Adds 10 seconds to timer
const trumpItem = { name: 'Mr Trump', points: 'Sets score at -20', image: 'trump.png', sound: 'trump.wav', fastSpeed: true, isEasterEgg: true, setScore: -20 }; // Sets score to -20
const grandmaItem = { name: 'Grandma\'s Recipes', points: 'Slow items for 5 seconds', image: 'grandma.png', sound: 'grandma.wav', fastSpeed: true, isEasterEgg: true, slowItems: true }; // Slows items for 5 seconds
const bearItem = { name: 'Polar Bear', points: 'Fast items for 5 seconds', image: 'bear.png', sound: 'bear.mp3', fastSpeed: true, isEasterEgg: true, fastItems: true }; // Makes items faster for 5 seconds

// Positive behaviors
const positiveBehaviors = [
    { name: 'Partner with local farmers', points: 20, image: 'farmer.png', sound: 'farmer.wav', isBehavior: true },
    { name: 'Offer refill stations', points: 25, image: 'refill.png', sound: 'refill.wav', isBehavior: true },
    { name: 'Donate unsold food to charities', points: 30, image: 'charity.png', sound: 'charity.wav', isBehavior: true }
];

// Negative behaviors
const negativeBehaviors = [
    { name: 'Leave Refrigerators Open', points: -20, image: 'refrigerator.png', sound: 'refrigerator.wav', isBehavior: true },
    { name: 'Overstock and Waste Unsold Food', points: -25, image: 'waste.png', sound: 'waste.wav', isBehavior: true },
    { name: 'Encourage Over-Consumption Through Promotions', points: -30, image: 'overconsumption.png', sound: 'overconsumption.wav', isBehavior: true }
];

// Track greenwashing spawns
let greenwashingSpawnCount = 0;

// Green items (low carbon footprint) - positive points
const greenItems = [
    { name: 'Apple', points: 10, image: 'apple.png' },
    { name: 'Led', points: 8, image: 'led.png' },
    { name: 'Lentil Soup', points: 9, image: 'lentil_soup.png' },
    { name: 'Cloth Bag', points: 7, image: 'cloth_bag.png' },
    { name: 'Organic Carrot', points: 8, image: 'organic_carrot.png' },
    { name: 'Plant Milk', points: 9, image: 'plant_milk.png' },
    { name: 'Solar Torch', points: 10, image: 'solar_torch.png' },
    { name: 'Recycled Paper', points: 6, image: 'recycled_paper.png' },
    { name: 'Tofu Pack', points: 9, image: 'tofu_pack.png' },
    { name: 'Wood Spoon', points: 7, image: 'wood_spoon.png' },
    { name: 'Eco Shampoo', points: 8, image: 'eco_shampoo.png' },
    { name: 'Reusable Cup', points: 7, image: 'reusable_cup.png' },
    { name: 'Organic Rice', points: 10, image: 'organic_rice.png' },
    { name: 'Veggie Burger', points: 9, image: 'veggie_burger.png' },
    { name: 'Cork Stopper', points: 6, image: 'cork_stopper.png' },
    { name: 'Seed Pack', points: 8, image: 'seed_pack.png' },
    { name: 'Eco Detergent', points: 9, image: 'eco_detergent.png' },
    { name: 'Bulk Pasta', points: 7, image: 'bulk_pasta.png' },
    { name: 'Tea', points: 8, image: 'tea.png' },
    { name: 'Dark Chocolate', points: 8, image: 'choco_bar.png' },
    { name: 'Whole Grain Bread', points: 5, image: 'bread.png' }
];

// Non-green items (high carbon footprint) - negative points
const nonGreenItems = [
    { name: 'Plastic Cup', points: -8, image: 'plastic_cup.png' },
    { name: 'Bulb', points: -8, image: 'bulb.png' },
    { name: 'Steak', points: -10, image: 'steak.png' },
    { name: 'Plastic Bag', points: -7, image: 'plastic_bag.png' },
    { name: 'Imported Avocado', points: -9, image: 'imported_avocado.png' },
    { name: 'Cow Milk', points: -8, image: 'cow_milk.png' },
    { name: 'Battery Torch', points: -9, image: 'battery_torch.png' },
    { name: 'Newspaper', points: -5, image: 'newspaper.png' },
    { name: 'Pork Sausage', points: -9, image: 'pork_sausage.png' },
    { name: 'Plastic Spoon', points: -6, image: 'plastic_spoon.png' },
    { name: 'Chemical Shampoo', points: -8, image: 'chemical_shampoo.png' },
    { name: 'Single-use Cup', points: -7, image: 'single_use_cup.png' },
    { name: 'White Rice', points: -7, image: 'white_rice.png' },
    { name: 'Meat Burger', points: -10, image: 'meat_burger.png' },
    { name: 'Plastic Stopper', points: -5, image: 'plastic_stopper.png' },
    { name: 'Flower Bouquet', points: -8, image: 'flower_bouquet.png' },
    { name: 'Chemical Cleaner', points: -9, image: 'chemical_cleaner.png' },
    { name: 'Packed Pasta', points: -6, image: 'packed_pasta.png' },
    { name: 'Cigarettes', points: -10, image: 'cigarettes.png' },
    { name: 'Nutella', points: -8, image: 'nutella.png' },
    { name: 'Packaged Croissant', points: -4, image: 'croissant.png' }
];

// DOM elements
let scoreElement, timerElement, finalScoreElement, feedbackElement, gameOverElement, startScreenElement, factsScreenElement, backgroundMusic;
let scoreChartButton, scoreChartModal, scoreChartList, closeButton;
let fullScreenButton;
let isInFullScreen = false;

// Image objects for items
const itemImages = {};

// Prevent mobile scrolling/bouncing
function preventMobileScrolling() {
    // Prevent pull-to-refresh and other default touch behaviors
    document.addEventListener('touchmove', function(e) {
        // Allow scrolling within elements that need to scroll
        const isScrollableElement = 
            e.target.closest('.facts-container') || 
            e.target.closest('.facts-screen') ||
            e.target.closest('.shopping-cart-container') ||
            e.target.closest('.collected-items-list');
            
        if (!isScrollableElement) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Prevent double-tap to zoom
    document.addEventListener('touchend', function(e) {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;
        if (now - lastTap < DOUBLE_TAP_DELAY) {
            e.preventDefault();
        }
        lastTap = now;
    }, false);
    
    // Lock screen orientation to portrait if supported
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('portrait').catch(e => {
            console.log('Orientation lock failed:', e);
        });
    }
}

// Track last tap for double-tap prevention
let lastTap = 0;

// Initialize the game
window.onload = function() {
    // Apply mobile-specific behaviors
    if (isMobileDevice()) {
        preventMobileScrolling();
    }
    
    // Hide mobile controls initially (will be shown when game starts)
    document.getElementById('mobileControls').style.display = 'none';
    
    // Get DOM elements
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    scoreElement = document.getElementById('score');
    timerElement = document.getElementById('timer');
    finalScoreElement = document.getElementById('finalScore');
    feedbackElement = document.getElementById('feedback');
    gameOverElement = document.getElementById('gameOver');
    startScreenElement = document.getElementById('startScreen');
    factsScreenElement = document.getElementById('factsScreen');
    backgroundMusic = document.getElementById('backgroundMusic');
    
    // Score chart elements
    scoreChartButton = document.getElementById('scoreChartButton');
    scoreChartModal = document.getElementById('scoreChartModal');
    scoreChartList = document.getElementById('scoreChartList');
    closeButton = document.querySelector('.close-button');
    
    // Event listeners for score chart
    scoreChartButton.addEventListener('click', showScoreChart);
    closeButton.addEventListener('click', hideScoreChart);
    
    // Variables for touch controls
    let touchActive = false;
    let touchX = 0;
    let targetCartX = 0;
    
// Add touch event listeners for the swipe area instead of the canvas
const swipeArea = document.getElementById('swipeArea');

swipeArea.addEventListener('touchstart', function(e) {
    e.preventDefault();
    touchActive = true;
    touchX = e.touches[0].clientX;
});

swipeArea.addEventListener('touchmove', function(e) {
    e.preventDefault();
    if (touchActive) {
        // Calculate how much the touch has moved
        const newTouchX = e.touches[0].clientX;
        const deltaX = newTouchX - touchX;
        
        // Move the cart by that amount (with increased sensitivity for more responsive movement)
        cartX += deltaX * 1.5;
        
        // Keep cart within boundaries
        cartX = Math.max(0, Math.min(canvas.width - CART_WIDTH, cartX));
        
        // Update touch position for next move
        touchX = newTouchX;
    }
});

swipeArea.addEventListener('touchend', function(e) {
    e.preventDefault();
    touchActive = false;
});

swipeArea.addEventListener('touchcancel', function(e) {
    e.preventDefault();
    touchActive = false;
});
    
    // Add touch event listener for the entire document to handle touches outside canvas
    document.addEventListener('touchend', function() {
        touchActive = false;
    });
    
    // Load item images
    greenItems.concat(nonGreenItems).forEach(item => {
        itemImages[item.name] = new Image();
        itemImages[item.name].src = `assets/images/${item.image}`;
    });
    
    // Load bonus and malus images
    itemImages[bonusItem.name] = new Image();
    itemImages[bonusItem.name].src = `assets/images/${bonusItem.image}`;
    
    itemImages[malusItem.name] = new Image();
    itemImages[malusItem.name].src = `assets/images/${malusItem.image}`;
    
    itemImages[greenwashingItem.name] = new Image();
    itemImages[greenwashingItem.name].src = `assets/images/${greenwashingItem.image}`;
    
    // Load Easter Egg images
    itemImages[gretaItem.name] = new Image();
    itemImages[gretaItem.name].src = `assets/images/${gretaItem.image}`;
    
    itemImages[trumpItem.name] = new Image();
    itemImages[trumpItem.name].src = `assets/images/${trumpItem.image}`;
    
    itemImages[grandmaItem.name] = new Image();
    itemImages[grandmaItem.name].src = `assets/images/${grandmaItem.image}`;
    
    itemImages[bearItem.name] = new Image();
    itemImages[bearItem.name].src = `assets/images/${bearItem.image}`;
    
    // Load positive behavior images
    positiveBehaviors.forEach(behavior => {
        itemImages[behavior.name] = new Image();
        itemImages[behavior.name].src = `assets/images/${behavior.image}`;
    });
    
    // Load negative behavior images
    negativeBehaviors.forEach(behavior => {
        itemImages[behavior.name] = new Image();
        itemImages[behavior.name].src = `assets/images/${behavior.image}`;
    });
    
    // Load background image
    backgroundImage = new Image();
    backgroundImage.src = 'assets/images/background.png';
    
// Set cart initial position
cartX = canvas.width / 2 - CART_WIDTH / 2;
// Adjust cart position to be closer to the bottom on mobile
if (isMobileDevice()) {
    cartY = canvas.height - CART_HEIGHT - 10; // Reduced from 20 to 10 for mobile
} else {
    cartY = canvas.height - CART_HEIGHT - 20; // Original position for desktop
}
    
    // Event listeners for keyboard
    window.addEventListener('keydown', function(e) {
        keysPressed[e.key] = true;
    });
    
    window.addEventListener('keyup', function(e) {
        keysPressed[e.key] = false;
    });
    
    // Event listener for restart button
    document.getElementById('restartButton').addEventListener('click', restartGame);
    
    // Event listener for start button
    document.getElementById('startButton').addEventListener('click', startGame);
    
    // Event listener for facts button
    document.getElementById('factsButton').addEventListener('click', showFactsScreen);
    
    // Event listener for back button
    document.getElementById('backButton').addEventListener('click', hideFactsScreen);
    
    // Load cart image
    cartImage = new Image();
    cartImage.src = 'assets/images/cart.png';
    
    // When the cart image is loaded, draw it
    cartImage.onload = function() {
        // Draw cart using the loaded image
        ctx.drawImage(cartImage, cartX, cartY, CART_WIDTH, CART_HEIGHT);
    };
    
    // If the image fails to load, use the fallback rectangle
    cartImage.onerror = function() {
        // Fallback to rectangle if image isn't loaded
        ctx.fillStyle = '#FFD700'; // Gold color for cart
        ctx.fillRect(cartX, cartY, CART_WIDTH, CART_HEIGHT);
        
        // Draw cart details (pixel art style)
        ctx.fillStyle = '#333';
        ctx.fillRect(cartX + 20, cartY + CART_HEIGHT - 20, 30, 20); // Left wheel (doubled size)
        ctx.fillRect(cartX + CART_WIDTH - 50, cartY + CART_HEIGHT - 20, 30, 20); // Right wheel (doubled size)
    };
    
    // Show start screen
    startScreenElement.style.display = 'block';
};

// Select 5 random green items for the challenge
function selectChallengeItems() {
    // Shuffle the green items array
    const shuffledItems = [...greenItems].sort(() => Math.random() - 0.5);
    
    // Select the first 5 items
    challengeItems = shuffledItems.slice(0, 5);
    
    // Reset the collected challenge items
    collectedChallengeItems = {};
    challengeItems.forEach(item => {
        collectedChallengeItems[item.name] = false;
    });
    
    // Reset carbon credit earned flag
    carbonCreditEarned = false;
    
    // Hide coin animation
    document.getElementById('coinAnimation').classList.remove('show');
    
    // Display challenge items in the UI
    displayChallengeItems();
}

// Display challenge items in the UI
function displayChallengeItems() {
    const challengeItemsContainer = document.getElementById('challengeItems');
    challengeItemsContainer.innerHTML = '';
    
    challengeItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = `challenge-item ${collectedChallengeItems[item.name] ? 'collected' : ''}`;
        itemElement.dataset.itemName = item.name;
        
        const imgElement = document.createElement('img');
        imgElement.src = `assets/images/${item.image}`;
        imgElement.alt = item.name;
        imgElement.title = item.name;
        
        itemElement.appendChild(imgElement);
        challengeItemsContainer.appendChild(itemElement);
    });
}

// Check if a collected item is part of the challenge
function checkChallengeItem(item) {
    // If carbon credit already earned, no need to check
    if (carbonCreditEarned) return;
    
    // Check if the item is in the challenge items
    const challengeItem = challengeItems.find(ci => ci.name === item.name);
    if (challengeItem) {
        // Mark as collected
        collectedChallengeItems[item.name] = true;
        
        // Update the UI
        displayChallengeItems();
        
        // Check if all challenge items are collected
        const allCollected = challengeItems.every(ci => collectedChallengeItems[ci.name]);
        if (allCollected && !carbonCreditEarned) {
            // Award carbon credit
            awardCarbonCredit();
        }
    }
}

// Award carbon credit
function awardCarbonCredit() {
    carbonCreditEarned = true;
    
    // Add carbon credit to collected items
    const carbonCredit = { 
        name: 'Carbon Credit', 
        points: 50, 
        image: 'coin.png',
        isCarbonCredit: true
    };
    collectedItems.push(carbonCredit);
    
    // Update score
    score += carbonCredit.points;
    updateScore();
    
    // Show coin animation
    const coinAnimation = document.getElementById('coinAnimation');
    coinAnimation.classList.add('show');
    
    // Play coin sound
    const coinSound = new Audio('assets/audio/coin.wav');
    coinSound.play().catch(e => console.log("Coin sound play failed:", e));
    
    // Hide coin animation after 3 seconds
    setTimeout(() => {
        coinAnimation.classList.remove('show');
    }, 3000);
}

// Function to detect if the device is a mobile device
function isMobileDevice() {
    return (window.innerWidth <= 800) || 
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Check if fullscreen is available
function isFullscreenAvailable() {
    return document.documentElement.requestFullscreen || 
           document.documentElement.webkitRequestFullscreen || 
           document.documentElement.mozRequestFullScreen || 
           document.documentElement.msRequestFullscreen;
}

// Enter fullscreen mode
function enterFullscreen() {
    if (!isInFullScreen) {
        const element = document.documentElement;
        
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) { /* Safari */
            element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) { /* Firefox */
            element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) { /* IE/Edge */
            element.msRequestFullscreen();
        }
        
        isInFullScreen = true;
        console.log("Entering fullscreen mode");
    }
}

// Exit fullscreen mode
function exitFullscreen() {
    if (isInFullScreen) {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) { /* Firefox */
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) { /* IE/Edge */
            document.msExitFullscreen();
        }
        
        isInFullScreen = false;
        console.log("Exiting fullscreen mode");
    }
}

// Handle fullscreen change events
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange);

function handleFullscreenChange() {
    // Update fullscreen state
    isInFullScreen = !!(document.fullscreenElement || 
                      document.webkitFullscreenElement || 
                      document.mozFullScreenElement || 
                      document.msFullscreenElement);
    
    console.log("Fullscreen state changed:", isInFullScreen);
}

// Start the game
function startGame() {
    // Reset game state
    score = 0;
    timeLeft = GAME_DURATION;
    gameItems = [];
    collectedItems = []; // Reset collected items
    bonusSpawned = false; // Reset bonus spawned flag
    malusSpawned = false; // Reset malus spawned flag
    gretaSpawned = false; // Reset Greta spawned flag
    trumpSpawned = false; // Reset Trump spawned flag
    grandmaSpawned = false; // Reset Grandma spawned flag
    bearSpawned = false; // Reset Bear spawned flag
    countdownSoundPlayed = false; // Reset countdown sound flag
    spawnedBehaviors = {}; // Reset spawned behaviors tracking
    greenwashingSpawnCount = 0; // Reset greenwashing spawn count
    itemsSlowed = false; // Reset items slowed flag
    itemsSlowedEndTime = 0; // Reset items slowed end time
    doublePoints = false; // Reset double points flag
    doublePointsEndTime = 0; // Reset double points end time
    gameRunning = true;
    
    // Initialize audio for mobile devices
    initAudio();
    
    // Reset cart image to empty cart at the start of each game
    cartImage.src = 'assets/images/cart.png';
    
    // Select challenge items
    selectChallengeItems();
    
    // Hide start screen and game over screen
    startScreenElement.style.display = 'none';
    gameOverElement.style.display = 'none';
    
    // Show mobile controls only on mobile devices
    const mobileControls = document.getElementById('mobileControls');
    if (isMobileDevice()) {
        mobileControls.style.display = 'flex';
        
        // Enter fullscreen mode on mobile devices
        if (isFullscreenAvailable() && !isInFullScreen) {
            enterFullscreen();
        }
    } else {
        mobileControls.style.display = 'none';
    }
    
    // Update UI
    updateScore();
    updateTimer();
    
    // Play background music
    backgroundMusic.volume = 0.5; // Set volume to 50%
    backgroundMusic.currentTime = 0; // Reset to beginning
    backgroundMusic.play().catch(e => console.log("Audio play failed:", e));
    
    // Start game loop
    requestAnimationFrame(gameLoop);
    
    // Start item spawning
    startItemSpawning();
    
    // Start timer countdown
    startTimer();
}

// Restart the game
function restartGame() {
    startGame();
}

// Start spawning items
function startItemSpawning() {
    // Clear any existing interval
    if (window.spawnInterval) {
        clearInterval(window.spawnInterval);
    }
    
    // Set new interval for spawning items
    window.spawnInterval = setInterval(function() {
        if (gameRunning) {
            spawnItem();
        }
    }, SPAWN_RATE);
}

// Start timer countdown
function startTimer() {
    // Clear any existing interval
    if (window.timerInterval) {
        clearInterval(window.timerInterval);
    }
    
    // Set new interval for timer countdown
    window.timerInterval = setInterval(function() {
        if (gameRunning) {
            timeLeft--;
            updateTimer();
            
            if (timeLeft <= 0) {
                endGame();
            }
        }
    }, 1000);
}

// Spawn a new item
function spawnItem() {
    // Randomize special item spawning throughout the game
    
    // Bonus can spawn anytime during the game with increasing probability
    if (!bonusSpawned) {
        // Probability increases as game progresses, peaking in the middle
        const bonusChance = 0.05 + (0.35 * (1 - Math.abs((GAME_DURATION - timeLeft) / GAME_DURATION - 0.5) * 2));
        if (Math.random() < bonusChance) {
            spawnSpecialItem(bonusItem);
            bonusSpawned = true;
            return;
        }
    }
    
    // Malus can spawn anytime during the game with increasing probability toward the end
    if (!malusSpawned) {
        // Probability increases as game progresses
        const malusChance = 0.05 + (0.35 * ((GAME_DURATION - timeLeft) / GAME_DURATION));
        if (Math.random() < malusChance) {
            spawnSpecialItem(malusItem);
            malusSpawned = true;
            return;
        }
    }
    
    // Greenwashing spawns throughout the game with a delay at the beginning
    if (greenwashingSpawnCount < greenwashingItem.maxSpawns) {
        // Don't spawn greenwashing in the first 20% of the game
        if (timeLeft < GAME_DURATION * 0.8) {
            // Probability increases slightly as game progresses
            const greenwashingChance = 0.05 + (0.15 * ((GAME_DURATION - timeLeft) / GAME_DURATION));
            if (Math.random() < greenwashingChance) {
                spawnSpecialItem(greenwashingItem);
                greenwashingSpawnCount++;
                return;
            }
        }
    }
    
    // Easter Egg: Tiny Greta - can spawn anytime with extremely low probability
    if (!gretaSpawned) {
        const gretaChance = 0.003; // 0.3% chance each spawn cycle
        if (Math.random() < gretaChance) {
            spawnSpecialItem(gretaItem);
            gretaSpawned = true;
            return;
        }
    }
    
    // Easter Egg: Mr Trump - can spawn anytime with extremely low probability
    if (!trumpSpawned) {
        const trumpChance = 0.003; // 0.3% chance each spawn cycle
        if (Math.random() < trumpChance) {
            spawnSpecialItem(trumpItem);
            trumpSpawned = true;
            return;
        }
    }
    
    // Easter Egg: Grandma's Recipes - can spawn anytime with extremely low probability
    if (!grandmaSpawned) {
        const grandmaChance = 0.003; // 0.3% chance each spawn cycle
        if (Math.random() < grandmaChance) {
            spawnSpecialItem(grandmaItem);
            grandmaSpawned = true;
            return;
        }
    }
    
    // Easter Egg: Polar Bear - can spawn anytime with extremely low probability
    if (!bearSpawned) {
        const bearChance = 0.003; // 0.3% chance each spawn cycle
        if (Math.random() < bearChance) {
            spawnSpecialItem(bearItem);
            bearSpawned = true;
            return;
        }
    }
    
    // 8% chance to spawn a positive behavior
    if (Math.random() < 0.08) {
        // Filter out behaviors that have already been spawned
        const availablePositiveBehaviors = positiveBehaviors.filter(behavior => !spawnedBehaviors[behavior.name]);
        
        // If there are still behaviors available to spawn
        if (availablePositiveBehaviors.length > 0) {
            // Select a random positive behavior from the available ones
            const behaviorType = availablePositiveBehaviors[Math.floor(Math.random() * availablePositiveBehaviors.length)];
            if (spawnBehaviorItem(behaviorType, true)) {
                return;
            }
        }
    }
    
    // 8% chance to spawn a negative behavior
    if (Math.random() < 0.08) {
        // Filter out behaviors that have already been spawned
        const availableNegativeBehaviors = negativeBehaviors.filter(behavior => !spawnedBehaviors[behavior.name]);
        
        // If there are still behaviors available to spawn
        if (availableNegativeBehaviors.length > 0) {
            // Select a random negative behavior from the available ones
            const behaviorType = availableNegativeBehaviors[Math.floor(Math.random() * availableNegativeBehaviors.length)];
            if (spawnBehaviorItem(behaviorType, false)) {
                return;
            }
        }
    }
    
    // Combine all items into one array for more randomness
    const allItems = [...greenItems, ...nonGreenItems];
    
    // Select a completely random item from all items
    const itemType = allItems[Math.floor(Math.random() * allItems.length)];
    
    // Determine if it's green based on the selected item
    const isGreen = greenItems.some(item => item.name === itemType.name);
    
    // Initial y position with randomness
    const initialY = -ITEM_SIZE - Math.random() * 50;
    
    // Create the item object with random horizontal position
    const item = {
        x: Math.random() * (canvas.width - ITEM_SIZE),
        y: initialY,
        previousY: initialY, // Track previous position for movement direction
        type: itemType,
        isGreen: isGreen,
        counted: false // Flag to prevent counting an item multiple times
    };
    
    // Add to game items array
    gameItems.push(item);
    
    // Sometimes spawn an additional item for more density
    if (Math.random() < 0.3) { // 30% chance to spawn an additional item
        setTimeout(() => {
            if (gameRunning) {
                spawnItem();
            }
        }, Math.random() * 250); // Random delay up to 250ms
    }
}

// Main game loop
function gameLoop() {
    if (!gameRunning) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update cart position based on key presses
    updateCartPosition();
    
    // Update items positions and check collisions
    updateItems();
    
    // Draw everything
    drawGame();
    
    // Continue the game loop
    requestAnimationFrame(gameLoop);
}

// Update cart position based on key presses or touch position
function updateCartPosition() {
    // For keyboard controls
    if (keysPressed['ArrowLeft'] || keysPressed['a']) {
        cartX -= CART_SPEED;
    }
    
    if (keysPressed['ArrowRight'] || keysPressed['d']) {
        cartX += CART_SPEED;
    }
    
    // Touch controls are now handled directly in the touchmove event
    // No need to handle them here as we're directly setting cartX in the event
    
    // Keep cart within canvas boundaries
    cartX = Math.max(0, Math.min(canvas.width - CART_WIDTH, cartX));
}

// Update items positions and check collisions
function updateItems() {
    for (let i = gameItems.length - 1; i >= 0; i--) {
        const item = gameItems[i];
        
        // Store previous position before moving
        item.previousY = item.y;
        
        // Check for active effects
        const currentTime = Date.now();
        
        // Check if items are slowed down
        if (itemsSlowed && currentTime < itemsSlowedEndTime) {
            // Items move at half speed when slowed
            if (item.fastSpeed) {
                item.y += ITEM_SPEED; // Normal speed instead of double
            } else {
                item.y += ITEM_SPEED / 2; // Half speed
            }
        } 
        // Check if items are sped up
        else if (itemsFast && currentTime < itemsFastEndTime) {
            // Items move at double speed when fast
            if (item.fastSpeed) {
                item.y += ITEM_SPEED * 3; // Triple speed for already fast items
            } else {
                item.y += ITEM_SPEED * 2; // Double speed for normal items
            }
        }
        // Normal speed
        else {
            // Reset effects if they just ended
            if (itemsSlowed && currentTime >= itemsSlowedEndTime) {
                itemsSlowed = false;
            }
            if (itemsFast && currentTime >= itemsFastEndTime) {
                itemsFast = false;
            }
            
            // Move item down (twice as fast for items with fastSpeed)
            if (item.fastSpeed) {
                item.y += ITEM_SPEED * 2; // Double speed for fast items
            } else {
                item.y += ITEM_SPEED;
            }
        }
        
        // Check if item is out of bounds
        if (item.y > canvas.height) {
            gameItems.splice(i, 1);
            continue;
        }
        
        // Check collision with cart
        if (checkCollision(item)) {
            // Mark as counted to prevent multiple counts
            item.counted = true;
            
            // Handle special effects for Easter Eggs
            if (item.type.isEasterEgg) {
                if (item.type.name === gretaItem.name) {
                    // Tiny Greta adds 10 seconds to the timer
                    timeLeft += item.type.addTime;
                    // Create special animation for added time
                    createPointsAnimation(item.x + ITEM_SIZE/2, item.y, `+${item.type.addTime}s`);
                } else if (item.type.name === trumpItem.name) {
                    // Mr Trump sets the score to -20
                    score = item.type.setScore;
                    updateScore();
                    // Create special animation for score reset
                    createPointsAnimation(item.x + ITEM_SIZE/2, item.y, "Score: -20");
                } else if (item.type.name === grandmaItem.name) {
                    // Grandma's Recipes slows all items for 5 seconds
                    itemsSlowed = true;
                    itemsSlowedEndTime = Date.now() + 5000; // 5 seconds from now
                    // Create special animation for slowed items with longer duration (3 seconds)
                    createPointsAnimation(item.x + ITEM_SIZE/2, item.y, "Items Slowed!", 3000);
                } else if (item.type.name === bearItem.name) {
                    // Polar Bear makes items faster for 5 seconds
                    itemsFast = true;
                    itemsFastEndTime = Date.now() + 5000; // 5 seconds from now
                    // Create special animation for faster items with longer duration (3 seconds)
                    createPointsAnimation(item.x + ITEM_SIZE/2, item.y, "Items Faster!", 3000);
                }
            } else {
                // Regular item - update score normally
                // Check if double points effect is active
                const currentTime = Date.now();
                if (doublePoints && currentTime < doublePointsEndTime) {
                    // Double the points
                    const doubledPoints = item.type.points * 2;
                    score += doubledPoints;
                    updateScore();
                    
                    // Create points animation showing the doubled points
                    createPointsAnimation(item.x + ITEM_SIZE/2, item.y, doubledPoints);
                    // Also show a small "x2" indicator
                    createPointsAnimation(item.x + ITEM_SIZE/2, item.y - 20, "x2");
                } else {
                    // Normal points
                    if (doublePoints && currentTime >= doublePointsEndTime) {
                        // Reset the double points effect if it just ended
                        doublePoints = false;
                    }
                    
                    score += item.type.points;
                    updateScore();
                    
                    // Create points animation at the collision location
                    createPointsAnimation(item.x + ITEM_SIZE/2, item.y, item.type.points);
                }
            }
            
            // Add to collected items
            collectedItems.push(item.type);
            
            // Check if this item is part of the challenge
            checkChallengeItem(item.type);
            
            // Remove item
            gameItems.splice(i, 1);
            
            // Play sound (optional)
            playCollectSound(item.isGreen, item);
        }
    }
    
    // Update points animations
    updatePointsAnimations();
}

// Create a new points animation
function createPointsAnimation(x, y, points, duration = 1000) {
    pointsAnimations.push({
        x: x,
        y: y,
        points: points,
        opacity: 1.0,
        createdAt: Date.now(),
        isText: typeof points === 'string', // Check if points is a string (for Easter Egg messages)
        duration: duration // Duration in milliseconds (default: 1000ms = 1 second)
    });
}

// Update and remove points animations
function updatePointsAnimations() {
    const currentTime = Date.now();
    
    // Update existing animations
    for (let i = pointsAnimations.length - 1; i >= 0; i--) {
        const animation = pointsAnimations[i];
        
        // Calculate how long the animation has been active
        const age = currentTime - animation.createdAt;
        
        // Get the animation duration (default: 1000ms)
        const duration = animation.duration || 1000;
        
        // Check if animation has expired
        if (age >= duration) {
            // Remove animation if it's older than its duration
            pointsAnimations.splice(i, 1);
        } else {
            // Update opacity based on age (fade out)
            animation.opacity = 1.0 - (age / duration);
            
            // Move animation upward slightly
            animation.y -= 0.5;
        }
    }
}

// Check collision between item and cart
function checkCollision(item) {
    // If this item has already been counted, don't count it again
    if (item.counted) {
        return false;
    }
    
    // Ensure the item is moving downward (not upward or static)
    if (item.y <= item.previousY) {
        return false;
    }
    
    // Get the item boundaries
    const itemLeft = item.x;
    const itemRight = item.x + ITEM_SIZE;
    const itemBottom = item.y + ITEM_SIZE;
    const itemCenter = item.x + ITEM_SIZE / 2;
    
    // Get the cart boundaries
    const cartTop = cartY;
    const cartLeft = cartX;
    const cartRight = cartX + CART_WIDTH;
    const cartCenter = cartX + CART_WIDTH / 2;
    
    // Calculate the cart's center area (middle 70% of the cart width)
    const cartCenterLeft = cartLeft + CART_WIDTH * 0.15;
    const cartCenterRight = cartRight - CART_WIDTH * 0.15;
    
    // Check if the item's bottom is touching the cart's top area
    // and if the item is horizontally overlapping with the cart's center
    const isVerticalCollision = (
        // Vertical collision: item's bottom is touching the top part of the cart
        itemBottom >= cartTop && 
        itemBottom <= cartTop + 20 // Only count if touching the top 20 pixels of the cart
    );
    
    // Check horizontal overlap - item must be centered over the cart
    const isHorizontalCollision = (
        // Item's center must be within the cart's center area
        itemCenter >= cartCenterLeft && 
        itemCenter <= cartCenterRight
    );
    
    // Both vertical and horizontal collision must occur
    const isColliding = isVerticalCollision && isHorizontalCollision;
    
    // Debug collision detection
    if (isColliding) {
        console.log(`Collision detected! Item at (${itemLeft}-${itemRight}, ${itemBottom}), Cart at (${cartLeft}-${cartRight}, ${cartTop})`);
    }
    
    return isColliding;
}

// Draw the game
function drawGame() {
    // Draw background
    if (backgroundImage && backgroundImage.complete) {
        // Use the background image if it's loaded
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        // Fallback to solid color if image isn't loaded
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Draw cart
    if (cartImage && cartImage.complete) {
        // Use the cart image if it's loaded
        ctx.drawImage(cartImage, cartX, cartY, CART_WIDTH, CART_HEIGHT);
    } else {
        // Fallback to rectangle if image isn't loaded
        ctx.fillStyle = '#FFD700'; // Gold color for cart
        ctx.fillRect(cartX, cartY, CART_WIDTH, CART_HEIGHT);
        
        // Draw cart details (pixel art style)
        ctx.fillStyle = '#333';
        ctx.fillRect(cartX + 20, cartY + CART_HEIGHT - 20, 30, 20); // Left wheel (doubled size)
        ctx.fillRect(cartX + CART_WIDTH - 50, cartY + CART_HEIGHT - 20, 30, 20); // Right wheel (doubled size)
    }
    
    // Draw items
    gameItems.forEach(item => {
        // No special visual effects for special items
        
        // Draw the item image
        if (itemImages[item.type.name] && itemImages[item.type.name].complete) {
            // Draw the image
            ctx.drawImage(itemImages[item.type.name], item.x, item.y, ITEM_SIZE, ITEM_SIZE);
        }
    });
    
    // Draw points animations
    drawPointsAnimations();
}

// Draw points animations
function drawPointsAnimations() {
    pointsAnimations.forEach(animation => {
        // Set font properties
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        
        if (animation.isText) {
            // For text messages (Easter Eggs)
            // Use a special color for Easter Egg messages
            const color = animation.points.includes('+') ? '#4CAF50' : '#F44336'; // Green for positive, red for negative
            
            // Set color with opacity for fade-out effect
            ctx.fillStyle = `${color}${Math.floor(animation.opacity * 255).toString(16).padStart(2, '0')}`;
            
            // Draw the text message
            ctx.fillText(animation.points, animation.x, animation.y);
        } else {
            // For regular point animations
            // Determine color based on points value
            const color = animation.points >= 0 ? '#4CAF50' : '#F44336'; // Green for positive, red for negative
            
            // Set color with opacity for fade-out effect
            ctx.fillStyle = `${color}${Math.floor(animation.opacity * 255).toString(16).padStart(2, '0')}`;
            
            // Format points with + or - sign
            const pointsText = animation.points > 0 ? `+${animation.points}` : `${animation.points}`;
            
            // Draw the points text
            ctx.fillText(pointsText, animation.x, animation.y);
        }
    });
}

// Spawn a special item (bonus or malus)
function spawnSpecialItem(itemType) {
    // Initial y position with randomness
    const initialY = -ITEM_SIZE - Math.random() * 50;
    
    // Create the item object with random horizontal position
    const item = {
        x: Math.random() * (canvas.width - ITEM_SIZE),
        y: initialY,
        previousY: initialY, // Track previous position for movement direction
        type: itemType,
        isGreen: itemType.points > 0, // Bonus is green, malus is not
        isSpecial: true, // Flag to identify special items
        counted: false, // Flag to prevent counting an item multiple times
        fastSpeed: itemType.fastSpeed || false // Set fastSpeed flag if the item has it
    };
    
    // Add to game items array
    gameItems.push(item);
    
    console.log(`Special item spawned: ${itemType.name}`);
}

// Spawn a behavior item (positive or negative)
function spawnBehaviorItem(behaviorType, isPositive) {
    // Check if this behavior has already been spawned
    if (spawnedBehaviors[behaviorType.name]) {
        console.log(`Behavior ${behaviorType.name} already spawned, skipping`);
        return false;
    }
    
    // No special handling for greenwashing behavior anymore as it's now a special item
    
    // Initial y position with randomness
    const initialY = -ITEM_SIZE - Math.random() * 50;
    
    // Create the item object with random horizontal position
    const item = {
        x: Math.random() * (canvas.width - ITEM_SIZE),
        y: initialY,
        previousY: initialY, // Track previous position for movement direction
        type: behaviorType,
        isGreen: isPositive, // Positive behaviors are green, negative are not
        isBehavior: true, // Flag to identify behavior items
        counted: false, // Flag to prevent counting an item multiple times
        fastSpeed: behaviorType.fastSpeed || false // Set fastSpeed flag if the behavior has it
    };
    
    // Add to game items array
    gameItems.push(item);
    
    // Mark this behavior as spawned
    spawnedBehaviors[behaviorType.name] = true;
    
    console.log(`Behavior item spawned: ${behaviorType.name}`);
    return true;
}

// Audio context for better mobile sound support
let audioContext;
let audioInitialized = false;
let soundBuffers = {};

// Initialize audio context
function initAudio() {
    if (audioInitialized) return;
    
    try {
        // Create audio context
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
        
        // Load common sounds
        loadSound('sound.wav');
        loadSound('bonus.wav');
        loadSound('malus.wav');
        loadSound('greenwashing.wav');
        loadSound('greta.wav');
        loadSound('trump.wav');
        loadSound('grandma.wav');
        loadSound('bear.mp3');
        loadSound('coin.wav');
        
        // Load behavior sounds
        positiveBehaviors.concat(negativeBehaviors).forEach(behavior => {
            loadSound(behavior.sound);
        });
        
        audioInitialized = true;
        console.log("Audio initialized successfully");
    } catch (e) {
        console.error("Audio initialization failed:", e);
    }
}

// Load a sound file into buffer
function loadSound(filename) {
    fetch(`assets/audio/${filename}`)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            soundBuffers[filename] = audioBuffer;
        })
        .catch(e => console.error(`Error loading sound ${filename}:`, e));
}

// Play a sound from buffer
function playSound(filename) {
    // Initialize audio if not already done
    if (!audioInitialized) {
        initAudio();
        // If we just initialized, we need to resume the context on mobile
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }
    
    // If audio context is suspended (common on mobile), try to resume it
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    // If we have the buffer, play it
    if (audioContext && soundBuffers[filename]) {
        const source = audioContext.createBufferSource();
        source.buffer = soundBuffers[filename];
        source.connect(audioContext.destination);
        source.start(0);
        return true;
    } else {
        // Fallback to traditional Audio API
        const sound = new Audio(`assets/audio/${filename}`);
        sound.play().catch(e => console.log(`Sound play failed (${filename}):`, e));
        return false;
    }
}

// Play sound when collecting an item
function playCollectSound(isGreen, item) {
    // Determine which sound to play
    let soundFile = 'sound.wav'; // Default sound
    
    // Check if this is a special item (bonus or malus)
    if (item && item.isSpecial) {
        if (item.type.name === bonusItem.name) {
            soundFile = 'bonus.wav';
        } else if (item.type.name === malusItem.name) {
            soundFile = 'malus.wav';
        } else if (item.type.name === greenwashingItem.name) {
            soundFile = 'greenwashing.wav';
        } else if (item.type.name === gretaItem.name) {
            soundFile = 'greta.wav';
        } else if (item.type.name === trumpItem.name) {
            soundFile = 'trump.wav';
        } else if (item.type.name === grandmaItem.name) {
            soundFile = 'grandma.wav';
        } else if (item.type.name === bearItem.name) {
            soundFile = 'bear.mp3';
        }
    } 
    // Check if this is a behavior item
    else if (item && item.isBehavior && item.type.sound) {
        soundFile = item.type.sound;
    }
    
    // Play the sound
    playSound(soundFile);
}

// Update score display
function updateScore() {
    scoreElement.textContent = score;
}

// Update timer display
function updateTimer() {
    timerElement.textContent = timeLeft;
    
    // Check if we're at the halfway point (15 seconds) to change the cart image
    if (timeLeft === GAME_DURATION / 2) {
        // Change the cart image to cart2.png to show it's filling up
        cartImage.src = 'assets/images/cart2.png';
    }
    
    // Play countdown sound 4 seconds before the end
    if (timeLeft === 4 && !countdownSoundPlayed) {
        const countdownSound = new Audio('assets/audio/countdown.wav');
        countdownSound.play().catch(e => console.log("Countdown sound play failed:", e));
        countdownSoundPlayed = true;
    }
}

// Show shopping list screen
function showFactsScreen() {
    startScreenElement.style.display = 'none';
    
    // Update the title of the facts screen to "Shopping List"
    const factsTitle = factsScreenElement.querySelector('h2');
    factsTitle.textContent = 'Shopping List';
    
    // Get the facts container
    const factsContainer = factsScreenElement.querySelector('.facts-container');
    
    // Clear existing content
    factsContainer.innerHTML = '';
    
    // Create and display the shopping list
    displayShoppingList(factsContainer);
    
    // Show the screen
    factsScreenElement.style.display = 'block';
    
    // Scroll to top to ensure proper positioning
    setTimeout(() => {
        factsScreenElement.scrollTop = 0;
        
        // Enter fullscreen mode on mobile devices
        if (isMobileDevice() && isFullscreenAvailable() && !isInFullScreen) {
            enterFullscreen();
        }
    }, 100);
}

// Hide shopping list screen
function hideFactsScreen() {
    factsScreenElement.style.display = 'none';
    startScreenElement.style.display = 'block';
}

// Display shopping list with all items and behaviors
function displayShoppingList(container) {
    // Create section for good items
    const goodItemsSection = document.createElement('div');
    goodItemsSection.className = 'shopping-list-section';
    
    const goodItemsHeader = document.createElement('div');
    goodItemsHeader.className = 'collected-items-header';
    goodItemsHeader.textContent = 'Good Items';
    goodItemsHeader.style.backgroundColor = '#4CAF50';
    goodItemsHeader.style.color = 'white';
    goodItemsSection.appendChild(goodItemsHeader);
    
    // Add all green items
    greenItems.forEach(item => {
        addItemToShoppingList(goodItemsSection, item);
    });
    
    // Create section for bonus items
    const bonusSection = document.createElement('div');
    bonusSection.className = 'shopping-list-section';
    
    const bonusHeader = document.createElement('div');
    bonusHeader.className = 'collected-items-header';
    bonusHeader.textContent = 'Bonus';
    bonusHeader.style.backgroundColor = '#4CAF50';
    bonusHeader.style.color = 'white';
    bonusSection.appendChild(bonusHeader);
    
    // Add Garden Gnome to bonus section
    addItemToShoppingList(bonusSection, bonusItem);
    
    // Create section for good behaviors
    const goodBehaviorsSection = document.createElement('div');
    goodBehaviorsSection.className = 'shopping-list-section';
    
    const goodBehaviorsHeader = document.createElement('div');
    goodBehaviorsHeader.className = 'collected-items-header';
    goodBehaviorsHeader.textContent = 'Good Supermarket Behaviors (More Bonus Points)';
    goodBehaviorsHeader.style.backgroundColor = '#4CAF50';
    goodBehaviorsHeader.style.color = 'white';
    goodBehaviorsSection.appendChild(goodBehaviorsHeader);
    
    // Add all positive behaviors
    positiveBehaviors.forEach(behavior => {
        addItemToShoppingList(goodBehaviorsSection, behavior);
    });
    
    // Create section for bad items
    const badItemsSection = document.createElement('div');
    badItemsSection.className = 'shopping-list-section';
    
    const badItemsHeader = document.createElement('div');
    badItemsHeader.className = 'collected-items-header';
    badItemsHeader.textContent = 'Bad Items';
    badItemsHeader.style.backgroundColor = '#F44336';
    badItemsHeader.style.color = 'white';
    badItemsSection.appendChild(badItemsHeader);
    
    // Add all non-green items
    nonGreenItems.forEach(item => {
        addItemToShoppingList(badItemsSection, item);
    });
    
    // Create section for malus items
    const malusSection = document.createElement('div');
    malusSection.className = 'shopping-list-section';
    
    const malusHeader = document.createElement('div');
    malusHeader.className = 'collected-items-header';
    malusHeader.textContent = 'Malus';
    malusHeader.style.backgroundColor = '#F44336';
    malusHeader.style.color = 'white';
    malusSection.appendChild(malusHeader);
    
    // Add Pollutant and Greenwashing to malus section
    addItemToShoppingList(malusSection, malusItem);
    addItemToShoppingList(malusSection, greenwashingItem);
    
    // Create section for bad behaviors
    const badBehaviorsSection = document.createElement('div');
    badBehaviorsSection.className = 'shopping-list-section';
    
    const badBehaviorsHeader = document.createElement('div');
    badBehaviorsHeader.className = 'collected-items-header';
    badBehaviorsHeader.textContent = 'Bad Supermarket Behaviors (More Malus Points)';
    badBehaviorsHeader.style.backgroundColor = '#F44336';
    badBehaviorsHeader.style.color = 'white';
    badBehaviorsSection.appendChild(badBehaviorsHeader);
    
    // Add all negative behaviors
    negativeBehaviors.forEach(behavior => {
        addItemToShoppingList(badBehaviorsSection, behavior);
    });
    
    // Create section for Easter Eggs
    const easterEggsSection = document.createElement('div');
    easterEggsSection.className = 'shopping-list-section';
    
    const easterEggsHeader = document.createElement('div');
    easterEggsHeader.className = 'collected-items-header';
    easterEggsHeader.textContent = 'Easter Eggs (Rare)';
    easterEggsHeader.style.backgroundColor = '#9C27B0'; // Purple color for Easter Eggs
    easterEggsHeader.style.color = 'white';
    easterEggsSection.appendChild(easterEggsHeader);
    
    // Add Easter Eggs
    addItemToShoppingList(easterEggsSection, gretaItem);
    addItemToShoppingList(easterEggsSection, trumpItem);
    addItemToShoppingList(easterEggsSection, grandmaItem);
    addItemToShoppingList(easterEggsSection, bearItem);
    
    // Add all sections to the container in the new order
    container.appendChild(goodItemsSection);
    container.appendChild(bonusSection);
    container.appendChild(goodBehaviorsSection);
    container.appendChild(badItemsSection);
    container.appendChild(malusSection);
    container.appendChild(badBehaviorsSection);
    container.appendChild(easterEggsSection);
}

// Helper function to add an item to the shopping list
function addItemToShoppingList(container, item) {
    // Create a row container
    const rowContainer = document.createElement('div');
    rowContainer.className = 'shopping-list-row';
    
    // Create the item element
    const itemElement = document.createElement('div');
    itemElement.className = 'collected-item';
    
    // Create item name with image
    const nameElement = document.createElement('div');
    nameElement.className = 'collected-item-name';
    
    // Add item image
    const imageElement = document.createElement('img');
    imageElement.className = 'collected-item-image';
    imageElement.src = `assets/images/${item.image}`;
    imageElement.alt = item.name;
    imageElement.style.width = '40px';
    imageElement.style.height = '40px';
    nameElement.appendChild(imageElement);
    
    // Add item name
    const nameText = document.createElement('span');
    nameText.textContent = item.name;
    nameElement.appendChild(nameText);
    
    // Add points
    const pointsElement = document.createElement('div');
    
    // Special handling for Easter Eggs
    if (item.isEasterEgg) {
        // Use purple color for Easter Egg effects
        pointsElement.className = 'collected-item-points';
        pointsElement.style.color = '#9C27B0'; // Purple color matching the Easter Egg header
        pointsElement.textContent = item.points;
    } else {
        // Regular items use the standard positive/negative classes
        pointsElement.className = `collected-item-points ${item.points > 0 ? 'positive' : 'negative'}`;
        pointsElement.textContent = `${item.points > 0 ? '+' : ''}${item.points}`;
    }
    
    // Add elements to item
    itemElement.appendChild(nameElement);
    itemElement.appendChild(pointsElement);
    
    // Add item to row container
    rowContainer.appendChild(itemElement);
    
    // Add row container to the main container
    container.appendChild(rowContainer);
}

// Display collected items in the shopping cart list
function displayCollectedItems() {
    // Get the collected items list element
    const collectedItemsList = document.getElementById('collectedItemsList');
    
    // Clear any existing items
    collectedItemsList.innerHTML = '';
    
    // If no items were collected, show a message
    if (collectedItems.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'collected-item';
        emptyMessage.textContent = 'Your cart is empty!';
        collectedItemsList.appendChild(emptyMessage);
        return;
    }
    
    // Check if carbon credit was earned
    let carbonCredit = null;
    
    // Group identical items and count them
    const itemCounts = {};
    const behaviorCounts = {};
    let carbonCreditItem = null;
    
    collectedItems.forEach(item => {
        // Check if this is a carbon credit
        if (item.isCarbonCredit) {
            carbonCreditItem = item;
        }
        // Check if this is a behavior item
        else if (item.isBehavior) {
            if (!behaviorCounts[item.name]) {
                behaviorCounts[item.name] = {
                    count: 1,
                    points: item.points,
                    image: item.image,
                    isGreen: item.points > 0,
                    isBehavior: true
                };
            } else {
                behaviorCounts[item.name].count++;
            }
        } else {
            // Regular item
            if (!itemCounts[item.name]) {
                itemCounts[item.name] = {
                    count: 1,
                    points: item.points,
                    image: item.image,
                    isGreen: item.points > 0
                };
            } else {
                itemCounts[item.name].count++;
            }
        }
    });
    
    // Add Carbon Credit section if earned
    if (carbonCreditItem) {
        const carbonCreditHeader = document.createElement('div');
        carbonCreditHeader.className = 'collected-items-header';
        carbonCreditHeader.textContent = 'Achievement';
        carbonCreditHeader.style.backgroundColor = '#FFD700'; // Gold color
        carbonCreditHeader.style.color = '#000';
        collectedItemsList.appendChild(carbonCreditHeader);
        
        // Create Carbon Credit item
        const carbonCreditElement = document.createElement('div');
        carbonCreditElement.className = 'collected-item';
        carbonCreditElement.style.backgroundColor = '#FFD70033'; // Gold with transparency
        carbonCreditElement.style.border = '2px solid #FFD700';
        
        // Create item name with image
        const nameElement = document.createElement('div');
        nameElement.className = 'collected-item-name';
        
        // Add item image
        const imageElement = document.createElement('img');
        imageElement.className = 'collected-item-image';
        imageElement.src = `assets/images/${carbonCreditItem.image}`;
        imageElement.alt = carbonCreditItem.name;
        imageElement.style.width = '40px';
        imageElement.style.height = '40px';
        nameElement.appendChild(imageElement);
        
        // Add item name
        const nameText = document.createElement('span');
        nameText.textContent = `${carbonCreditItem.name} (Special Challenge Complete!)`;
        nameText.style.fontWeight = 'bold';
        nameElement.appendChild(nameText);
        
        // Add points
        const pointsElement = document.createElement('div');
        pointsElement.className = 'collected-item-points positive';
        pointsElement.textContent = `+${carbonCreditItem.points}`;
        pointsElement.style.fontWeight = 'bold';
        
        // Add elements to item
        carbonCreditElement.appendChild(nameElement);
        carbonCreditElement.appendChild(pointsElement);
        
        // Add item to list
        collectedItemsList.appendChild(carbonCreditElement);
    }
    
    // Add behaviors section if any behaviors were collected
    const positiveBehaviorNames = Object.keys(behaviorCounts).filter(name => behaviorCounts[name].isGreen);
    const negativeBehaviorNames = Object.keys(behaviorCounts).filter(name => !behaviorCounts[name].isGreen);
    
    if (positiveBehaviorNames.length > 0 || negativeBehaviorNames.length > 0) {
        // Add behaviors header
        const behaviorsHeader = document.createElement('div');
        behaviorsHeader.className = 'collected-items-header';
        behaviorsHeader.textContent = 'Behaviors';
        collectedItemsList.appendChild(behaviorsHeader);
        
        // Sort positive behaviors by points (highest to lowest)
        positiveBehaviorNames.sort((a, b) => behaviorCounts[b].points - behaviorCounts[a].points);
        
        // Add positive behaviors
        positiveBehaviorNames.forEach(behaviorName => {
            addItemToList(collectedItemsList, behaviorName, behaviorCounts[behaviorName]);
        });
        
        // Sort negative behaviors by points (lowest to highest)
        negativeBehaviorNames.sort((a, b) => behaviorCounts[a].points - behaviorCounts[b].points);
        
        // Add negative behaviors
        negativeBehaviorNames.forEach(behaviorName => {
            addItemToList(collectedItemsList, behaviorName, behaviorCounts[behaviorName]);
        });
    }
    
    // Add items section if any items were collected
    if (Object.keys(itemCounts).length > 0) {
        // Add items header
        const itemsHeader = document.createElement('div');
        itemsHeader.className = 'collected-items-header';
        itemsHeader.textContent = 'Items';
        collectedItemsList.appendChild(itemsHeader);
        
        // Sort items by points (highest to lowest)
        const sortedItems = Object.keys(itemCounts).sort((a, b) => {
            return itemCounts[b].points - itemCounts[a].points;
        });
        
        // Add items
        sortedItems.forEach(itemName => {
            addItemToList(collectedItemsList, itemName, itemCounts[itemName]);
        });
    }
}

// Helper function to add an item to the collected items list
function addItemToList(parentElement, itemName, itemData) {
    const itemElement = document.createElement('div');
    itemElement.className = 'collected-item';
    
    // Create item name with image
    const nameElement = document.createElement('div');
    nameElement.className = 'collected-item-name';
    
    // Add item image
    const imageElement = document.createElement('img');
    imageElement.className = 'collected-item-image';
    imageElement.src = `assets/images/${itemData.image}`;
    imageElement.alt = itemName;
    nameElement.appendChild(imageElement);
    
    // Add item name and count
    const nameText = document.createElement('span');
    nameText.textContent = `${itemName} ${itemData.count > 1 ? `(x${itemData.count})` : ''}`;
    nameElement.appendChild(nameText);
    
    // Add points
    const pointsElement = document.createElement('div');
    
    // Check if this is an Easter Egg item
    if (itemName === 'Tiny Greta' || itemName === 'Mr Trump' || 
        itemName === 'Grandma\'s Recipes' || itemName === 'Polar Bear') {
        
        // Special handling for Easter Eggs
        pointsElement.className = 'collected-item-points';
        pointsElement.style.color = '#9C27B0'; // Purple color for Easter Eggs
        
        // Specific text for each Easter Egg
        if (itemName === 'Tiny Greta') {
            pointsElement.textContent = '+10 seconds';
        } else if (itemName === 'Mr Trump') {
            pointsElement.textContent = 'Sets score at -20';
        } else if (itemName === 'Grandma\'s Recipes') {
            pointsElement.textContent = 'Items slower for 5 seconds';
        } else if (itemName === 'Polar Bear') {
            pointsElement.textContent = 'Items faster for 5 seconds';
        }
    } else {
        // Regular items
        pointsElement.className = `collected-item-points ${itemData.isGreen ? 'positive' : 'negative'}`;
        pointsElement.textContent = `${itemData.points > 0 ? '+' : ''}${itemData.points} × ${itemData.count} = ${itemData.points * itemData.count}`;
    }
    
    // Add elements to item
    itemElement.appendChild(nameElement);
    itemElement.appendChild(pointsElement);
    
    // Add item to list
    parentElement.appendChild(itemElement);
}

// End the game
function endGame() {
    gameRunning = false;
    
    // Clear intervals
    clearInterval(window.spawnInterval);
    clearInterval(window.timerInterval);
    
    // Stop background music
    backgroundMusic.pause();
    
    // Create score sound effect
    const scoreSound = new Audio('assets/audio/score.wav');
    
    // For mobile devices, we need to handle audio differently
    if (isMobileDevice()) {
        // Add a click/touch event to the game over screen to play sound
        // This ensures sound plays in response to user interaction
        const playScoreSound = function() {
            scoreSound.play().catch(e => console.log("Score sound play failed:", e));
            gameOverElement.removeEventListener('click', playScoreSound);
            gameOverElement.removeEventListener('touchstart', playScoreSound);
        };
        
        // Add event listeners for both click and touch
        gameOverElement.addEventListener('click', playScoreSound, { once: true });
        gameOverElement.addEventListener('touchstart', playScoreSound, { once: true });
        
        // Also try to play it directly (might work on some devices)
        setTimeout(() => {
            scoreSound.play().catch(e => console.log("Initial score sound play failed:", e));
        }, 100);
    } else {
        // On desktop, just play the sound directly
        scoreSound.play().catch(e => console.log("Score sound play failed:", e));
    }
    
    // Update final score
    finalScoreElement.textContent = score;
    
    // Get medal image element
    const medalImage = document.getElementById('medalImage');
    
    // Set feedback message and medal image based on score
    let feedback;
    let medalSrc;
    
    if (score >= 150) {
        feedback = "Eco-Warrior! Your cart is greener than a forest!";
        medalSrc = "assets/images/medal_1.png";
    } else if (score >= 100) {
        feedback = "Green Star! You are shopping sustainably";
        medalSrc = "assets/images/medal_2.png";
    } else if (score >= 50) {
        feedback = "Eco-Apprentice! Almost there, keep it up!";
        medalSrc = "assets/images/medal_3.png";
    } else if (score >= 0) {
        feedback = "Plastic Panic! Let's learn a bit more about eco choices";
        medalSrc = "assets/images/medal_4.png";
    } else {
        feedback = "Oops, your cart is a carbon bomb! Better luck next time!";
        medalSrc = "assets/images/medal_5.png";
    }
    
    // Update feedback text and medal image
    feedbackElement.textContent = feedback;
    medalImage.src = medalSrc;
    
    // Display collected items
    displayCollectedItems();
    
    // Save score to localStorage
    saveScore(score);
    
    // Show game over screen
    gameOverElement.style.display = 'block';
}

// Save score to localStorage
function saveScore(score) {
    // Get existing scores from localStorage
    let scores = JSON.parse(localStorage.getItem('catchItGreenScores')) || [];
    
    // Add new score with timestamp
    scores.push({
        score: score,
        date: new Date().toLocaleString()
    });
    
    // Sort scores by highest first
    scores.sort((a, b) => b.score - a.score);
    
    // Keep only top 10 scores
    if (scores.length > 10) {
        scores = scores.slice(0, 10);
    }
    
    // Save back to localStorage
    localStorage.setItem('catchItGreenScores', JSON.stringify(scores));
}

// Show score chart
function showScoreChart() {
    // Get scores from localStorage
    const scores = JSON.parse(localStorage.getItem('catchItGreenScores')) || [];
    
    // Clear existing scores
    scoreChartList.innerHTML = '';
    
    // If no scores, show message
    if (scores.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'score-item';
        emptyMessage.textContent = 'No scores yet. Play a game first!';
        scoreChartList.appendChild(emptyMessage);
    } else {
        // Add each score to the list
        scores.forEach((scoreData, index) => {
            const scoreItem = document.createElement('div');
            scoreItem.className = 'score-item';
            
            const rankElement = document.createElement('div');
            rankElement.className = 'score-rank';
            rankElement.textContent = `#${index + 1}`;
            
            const scoreElement = document.createElement('div');
            scoreElement.className = 'score-value';
            scoreElement.textContent = scoreData.score;
            
            const dateElement = document.createElement('div');
            dateElement.className = 'score-date';
            dateElement.textContent = scoreData.date;
            
            scoreItem.appendChild(rankElement);
            scoreItem.appendChild(scoreElement);
            scoreItem.appendChild(dateElement);
            
            scoreChartList.appendChild(scoreItem);
        });
    }
    
    // Show the modal
    scoreChartModal.style.display = 'block';
}

// Hide score chart
function hideScoreChart() {
    scoreChartModal.style.display = 'none';
}
