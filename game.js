// Game constants
const GAME_DURATION = 30; // Game duration in seconds
const CART_SPEED = 1500; // Base cart speed (pixels per second) - Increased from 1200
const ITEM_SPEED = 360; // Base item speed (pixels per second)
const SPAWN_RATE = 500; // Reduced from 1000 to make items appear more frequently
const CART_WIDTH = 160; // Doubled from 80
const CART_HEIGHT = 100; // Doubled from 50
const ITEM_SIZE = 100; // Doubled from 50
const TARGET_FPS = 60; // Target frames per second for delta time normalization
const CART_COLLISION_SURFACE_HEIGHT = 15; // Altezza in pixel della superficie di collisione superiore del carrello.
const CART_COLLISION_HORIZONTAL_PADDING = 20; // Padding orizzontale per lato per la collisione del carrello.

// Sound manager for improved audio handling, especially on mobile
let soundManager = {
    initialized: false,
    context: null,
    buffers: {},
    sounds: {},
    userInteracted: false,
    
    // Initialize with critical sounds
    init: function() {
        if (this.initialized) return;
        
        try {
            // Create audio context
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContext();
            
            // Preload critical sounds
            this.preloadSound('countdown.wav');
            this.preloadSound('coin.wav');
            this.preloadSound('score.wav');
            this.preloadSound('wizard.wav');
            this.preloadSound('double.wav'); // Added double.wav
            this.preloadSound('janitor.wav'); // Added janitor.wav
            
            // Mark as initialized
            this.initialized = true;
            console.log("Sound manager initialized successfully");
        } catch (e) {
            console.error("Sound manager initialization failed:", e);
        }
    },
    
    // Handle user interaction to unlock audio
    handleInteraction: function() {
        this.userInteracted = true;
        if (this.context && this.context.state === 'suspended') {
            this.context.resume().then(() => {
                console.log("AudioContext resumed successfully");
            }).catch(e => {
                console.error("Failed to resume AudioContext:", e);
            });
        }
    },
    
    // Preload a sound
    preloadSound: function(filename) {
        // Create both Web Audio and traditional Audio versions
        this.loadBuffer(filename);
        this.loadAudio(filename);
    },
    
    // Load sound into AudioContext buffer
    loadBuffer: function(filename) {
        fetch(`assets/audio/${filename}`)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => this.context.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                this.buffers[filename] = audioBuffer;
                console.log(`Sound buffer loaded: ${filename}`);
            })
            .catch(e => console.error(`Error loading sound buffer ${filename}:`, e));
    },
    
    // Load sound as traditional Audio object
    loadAudio: function(filename) {
        const audio = new Audio(`assets/audio/${filename}`);
        audio.load(); // Preload the audio
        this.sounds[filename] = audio;
        console.log(`Sound loaded: ${filename}`);
    },
    
    // Play a sound with multiple fallback mechanisms
    playSound: function(filename, options = {}) {
        const { volume = 1.0, forcePlay = false } = options;
        
        // Try to resume AudioContext if suspended
        if (this.context && this.context.state === 'suspended') {
            this.context.resume().catch(e => console.log("Failed to resume AudioContext:", e));
        }
        
        // Try Web Audio API first (if initialized and buffer is loaded)
        if (this.initialized && this.context && this.buffers[filename]) {
            try {
                const source = this.context.createBufferSource();
                source.buffer = this.buffers[filename];
                
                // Create gain node for volume control
                const gainNode = this.context.createGain();
                gainNode.gain.value = volume;
                
                // Connect nodes
                source.connect(gainNode);
                gainNode.connect(this.context.destination);
                
                // Start playback
                source.start(0);
                console.log(`Playing sound (Web Audio): ${filename}`);
                return true;
            } catch (e) {
                console.error(`Web Audio playback failed for ${filename}:`, e);
                // Fall through to next method
            }
        }
        
        // Try traditional Audio API with the preloaded Audio object
        if (this.sounds[filename]) {
            try {
                // Clone the audio to allow overlapping playback
                const soundClone = this.sounds[filename].cloneNode();
                soundClone.volume = volume;
                
                // Play with promise and fallback
                const playPromise = soundClone.play();
                
                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        console.log(`Traditional Audio playback failed for ${filename}:`, e);
                        
                        // If user hasn't interacted and this is a critical sound, try again with timeout
                        if (forcePlay) {
                            setTimeout(() => {
                                soundClone.play().catch(e => console.log(`Retry failed for ${filename}:`, e));
                            }, 300);
                        }
                    });
                }
                
                console.log(`Playing sound (Traditional Audio): ${filename}`);
                return true;
            } catch (e) {
                console.error(`Traditional Audio playback failed for ${filename}:`, e);
            }
        }
        
        // Last resort: create a new Audio object and try to play it
        if (forcePlay) {
            try {
                const newSound = new Audio(`assets/audio/${filename}`);
                newSound.volume = volume;
                setTimeout(() => {
                    newSound.play().catch(e => console.log(`New Audio playback failed for ${filename}:`, e));
                }, 0);
                return true;
            } catch (e) {
                console.error(`New Audio playback failed for ${filename}:`, e);
            }
        }
        
        return false;
    }
};

// Game variables
let canvas, ctx;
let score = 0;
let timeLeft = GAME_DURATION;
let gameRunning = false;
let gameItems = [];
let cartX = 0;
let cartY = 0;
let keysPressed = {};
let lastFrameTime = 0; // Last frame timestamp for delta time calculation
let deltaTime = 0; // Time between frames in seconds
let cartImage; // Image for the player's cart (currently displayed)
let cartImage1; // Image for the empty cart
let cartImage2; // Image for the filled cart
let backgroundImage; // Image for the game background
let pointsAnimations = []; // Array to store point animations
let collectedItems = []; // Array to store collected items
let bonusSpawned = false; // Track if bonus has been spawned
let malusSpawned = false; // Track if malus has been spawned
let gretaSpawned = false; // Track if Tiny Greta has been spawned
let trumpSpawned = false; // Track if Mr Trump has been spawned
let grandmaSpawned = false; // Track if Grandma's Recipes has been spawned
let bearSpawned = false; // Track if Polar Bear has been spawned
let climateChangeSpawned = false; // Track if Climate Change has been spawned
let timePlusSpawned = false; // Track if Time Plus has been spawned
let spawnedBehaviors = {}; // Track which behaviors have been spawned
let challengeItems = []; // Array to store the 5 challenge items
let collectedChallengeItems = {}; // Object to track collected challenge items
let carbonCreditEarned = false; // Track if carbon credit has been earned
let countdownSoundPlayed = false; // Track if countdown sound has been played
let itemsSlowed = false; // Track if items are slowed down
let itemsSlowedEndTime = 0; // When the slow effect ends
let itemsFast = false; // Track if items are faster
let itemsFastEndTime = 0; // When the fast effect ends
let timePlusDelayActive = false; // Track if Time Plus delay is active
let timePlusDelayUntil = 0; // When Time Plus can start spawning
let janitorSpawned = false; // Track if Freezing Janitor has been spawned
let cartSlowed = false; // Flag for Freezing Janitor effect
let cartSlowedEndTime = 0; // End time for Freezing Janitor effect
let doubleDoublePointsActive = false; // Flag for Double Double points effect
let doubleDoublePointsEndTime = 0; // End time for Double Double points effect
let doubleDoubleSpeedActive = false; // Flag for Double Double speed effect
let doubleDoubleSpeedEndTime = 0; // End time for Double Double speed effect

// Special items
const bonusItem = { name: 'Garden Gnome', points: 25, image: 'bonus.png', fastSpeed: true, smokeColor: 'rgba(100, 200, 255, 0.8)' }; // Light blue haze
const timePlusItem = { name: 'Time Plus', points: '+ 5 seconds', image: '5sec.png', sound: '5sec.wav', fastSpeed: true, addTime: 5, isGreen: true }; // Adds 5 seconds to timer
const malusItem = { name: 'Pollutant Barrell', points: -20, image: 'malus.png', fastSpeed: true, smokeColor: 'rgba(255, 100, 100, 0.8)' }; // Light red haze
const greenwashingItem = { name: 'Greenwashing', points: -40, image: 'greenwashing.png', sound: 'greenwashing.wav', fastSpeed: true, maxSpawns: 2, smokeColor: 'rgba(255, 100, 100, 0.8)' }; // Light red haze
const climateChangeItem = { name: 'Climate Change', points: -15, image: 'ny.png', sound: 'ny.wav', fastSpeed: true, smokeColor: 'rgba(255, 100, 100, 0.8)' }; // Light red haze
const janitorItem = { name: 'Freezing Janitor', points: 0, image: 'janitor.png', sound: 'janitor.wav', fastSpeed: true, isEasterEgg: true };
const doubleDoubleItem = { name: 'Double Double', image: 'double.png', sound: 'double.wav', points: 'Double points & speed (5s)', isEasterEgg: true };

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
    
    // Initialize sound manager
    soundManager.init();
    
    // Add user interaction handlers to unlock audio
    document.addEventListener('click', function() {
        soundManager.handleInteraction();
    }, { once: false });
    
    document.addEventListener('touchstart', function() {
        soundManager.handleInteraction();
    }, { once: false });
    
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
    
    // Make sure the welcome screen is displayed by default
    document.querySelectorAll('.app-screen').forEach(screen => {
        screen.style.display = 'none';
    });
    startScreenElement.style.display = 'block';
    
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
        const touchDeltaX = newTouchX - touchX;
        
        // Calculate a touch sensitivity factor that accounts for delta time
        // This ensures consistent touch response regardless of frame rate
        const touchSensitivity = 150; // Base sensitivity factor (doubled to match new speed)
        
        // Move the cart by that amount with delta time-aware sensitivity
        // If deltaTime is 0 (first frame), use a small default value to prevent no movement
        const effectiveDeltaTime = deltaTime || 0.016; // Default to ~60fps if deltaTime is 0
        cartX += touchDeltaX * touchSensitivity * effectiveDeltaTime;
        
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
    
    itemImages[timePlusItem.name] = new Image();
    itemImages[timePlusItem.name].src = `assets/images/${timePlusItem.image}`;
    
    itemImages[malusItem.name] = new Image();
    itemImages[malusItem.name].src = `assets/images/${malusItem.image}`;
    
    itemImages[greenwashingItem.name] = new Image();
    itemImages[greenwashingItem.name].src = `assets/images/${greenwashingItem.image}`;
    
    itemImages[climateChangeItem.name] = new Image();
    itemImages[climateChangeItem.name].src = `assets/images/${climateChangeItem.image}`;
    
    // Load Easter Egg images
    itemImages[gretaItem.name] = new Image();
    itemImages[gretaItem.name].src = `assets/images/${gretaItem.image}`;
    
    itemImages[trumpItem.name] = new Image();
    itemImages[trumpItem.name].src = `assets/images/${trumpItem.image}`;
    
    itemImages[grandmaItem.name] = new Image();
    itemImages[grandmaItem.name].src = `assets/images/${grandmaItem.image}`;
    
    itemImages[bearItem.name] = new Image();
    itemImages[bearItem.name].src = `assets/images/${bearItem.image}`;
    
    itemImages[janitorItem.name] = new Image();
    itemImages[janitorItem.name].src = `assets/images/${janitorItem.image}`;
    
    itemImages[doubleDoubleItem.name] = new Image();
    itemImages[doubleDoubleItem.name].src = `assets/images/${doubleDoubleItem.image}`;
    
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
    
    // Event listener for start button (REMOVED/COMMENTED as it's handled in index.html now)
    // document.getElementById('startButton').addEventListener('click', startGame);
    
    // Event listener for facts button (REMOVED/COMMENTED as it's handled in index.html now)
    // document.getElementById('factsButton').addEventListener('click', showFactsScreen);
    
    // Event listener for back button
    document.getElementById('backButton').addEventListener('click', hideFactsScreen);
    
    // Event listener for back to menu button in game over screen
    document.getElementById('backToMenuButton').addEventListener('click', backToMenu);
    
    // Load both cart images
    cartImage1 = new Image();
    cartImage1.src = 'assets/images/cart.png';
    
    cartImage2 = new Image();
    cartImage2.src = 'assets/images/cart2.png';
    
    // Set the initial cart image to the empty cart
    cartImage = cartImage1;
    
    // When the cart images are loaded, draw the initial cart
    cartImage1.onload = function() {
        // Draw cart using the loaded image
        ctx.drawImage(cartImage, cartX, cartY, CART_WIDTH, CART_HEIGHT);
    };
    
    // If the first image fails to load, use the fallback rectangle
    cartImage1.onerror = function() {
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
    const coinElement = document.getElementById('coinAnimation');
    if (coinElement) {
        coinElement.classList.remove('show');
    }
    
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
    showCoinAnimation();
    
    // Play coin sound using sound manager with force play option
    soundManager.playSound('coin.wav', { volume: 1.0, forcePlay: true });
}

// Function to show and then hide the coin animation
function showCoinAnimation() {
    const coinElement = document.getElementById('coinAnimation');
    if (coinElement) {
        coinElement.classList.add('show');
        // Add timeout to hide the animation after 2.5 seconds
        setTimeout(() => {
            coinElement.classList.remove('show');
        }, 2500); // 2500 milliseconds = 2.5 seconds
    }
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

// Variabile per gestire il suono del conto alla rovescia
let countdownAudio = null;

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
    climateChangeSpawned = false; // Reset Climate Change spawned flag
    timePlusSpawned = false; // Reset Time Plus spawned flag
    timePlusDelayActive = false; // Reset Time Plus delay flag
    timePlusDelayUntil = 0; // Reset Time Plus delay point
    countdownSoundPlayed = false; // Reset countdown sound flag
    spawnedBehaviors = {}; // Reset spawned behaviors tracking
    greenwashingSpawnCount = 0; // Reset greenwashing spawn count
    itemsSlowed = false; // Reset items slowed flag
    itemsSlowedEndTime = 0; // Reset items slowed end time
    doublePoints = false; // Reset double points flag
    doublePointsEndTime = 0; // Reset double points end time
    janitorSpawned = false;
    doubleDoublePointsActive = false; // Reset Double Double points flag
    doubleDoublePointsEndTime = 0; // Reset Double Double points end time
    doubleDoubleSpeedActive = false; // Reset Double Double speed flag
    doubleDoubleSpeedEndTime = 0; // Reset Double Double speed end time
    gameRunning = true;
    
    // Ensure sound manager is initialized and handle user interaction
    soundManager.init();
    soundManager.handleInteraction();
    
    // Reset cart image to empty cart at the start of each game
    cartImage = cartImage1;
    
    // Select challenge items
    selectChallengeItems();
    
    // Hide welcome screen and game over screen, show game screen
    document.querySelectorAll('.app-screen').forEach(screen => {
        screen.style.display = 'none';
    });
    document.getElementById('gameScreen').style.display = 'flex';
    
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

// Update timer display
function updateTimer() {
    timerElement.textContent = timeLeft;

    // Cambia immagine del carrello a metà del tempo
    if (timeLeft === GAME_DURATION / 2) {
        cartImage = cartImage2;
    }

    // --- Gestione suono conto alla rovescia (Stop & Restart) ---
    if (timeLeft <= 4 && timeLeft > 0) {
        // Se il tempo è <= 4 e il suono NON esiste, crealo e avvialo
        if (!countdownAudio) {
            countdownAudio = new Audio('assets/audio/countdown.wav');
            countdownAudio.loop = true;
            countdownAudio.play().catch(e => console.log("Errore nella riproduzione del suono del conto alla rovescia:", e));
        }
        // Se esiste ma è in pausa (potrebbe succedere se l'utente cambia tab), riprendilo
        else if (countdownAudio.paused) {
            countdownAudio.play().catch(e => console.log("Errore nella ripresa del suono del conto alla rovescia:", e));
        }
    } else { // Gestisce sia timeLeft > 4 sia timeLeft <= 0 (fine gioco implicita)
        // Se il tempo è fuori dal range del conto alla rovescia e il suono esiste, fermalo e distruggilo
        if (countdownAudio) {
            countdownAudio.pause();
            countdownAudio.currentTime = 0; // Resetta per sicurezza
            countdownAudio = null; // Rimuovi il riferimento per forzare la ricreazione la prossima volta
        }
    }
    // --- Fine gestione suono conto alla rovescia ---
}

// Spawn a new item
function spawnItem() {
    // Randomize special item spawning throughout the game
    
    // Bonus can spawn anytime during the game with increasing probability
    if (!bonusSpawned) {
        // Probability increases as game progresses, peaking in the middle, but lower overall
        const bonusChance = 0.02 + (0.15 * (1 - Math.abs((GAME_DURATION - timeLeft) / GAME_DURATION - 0.5) * 2));
        if (Math.random() < bonusChance) {
            spawnSpecialItem(bonusItem);
            bonusSpawned = true; // Mark as spawned
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
    
    // Easter Egg: Tiny Greta - can spawn anytime with low probability
    if (!gretaSpawned) {
        const gretaChance = 0.006; // 0.6% chance each spawn cycle
        if (Math.random() < gretaChance) {
            spawnSpecialItem(gretaItem);
            gretaSpawned = true;
            return;
        }
    }
    
    // Easter Egg: Mr Trump - can spawn anytime with low probability
    if (!trumpSpawned) {
        const trumpChance = 0.006; // 0.6% chance each spawn cycle
        if (Math.random() < trumpChance) {
            spawnSpecialItem(trumpItem);
            trumpSpawned = true;
            return;
        }
    }
    
    // Easter Egg: Grandma's Recipes - can spawn anytime with low probability
    if (!grandmaSpawned) {
        const grandmaChance = 0.006; // 0.6% chance each spawn cycle
        if (Math.random() < grandmaChance) {
            spawnSpecialItem(grandmaItem);
            grandmaSpawned = true;
            return;
        }
    }
    
    // Easter Egg: Polar Bear - can spawn anytime with low probability
    if (!bearSpawned) {
        const bearChance = 0.006; // 0.6% chance each spawn cycle
        if (Math.random() < bearChance) {
            spawnSpecialItem(bearItem);
            bearSpawned = true;
            return;
        }
    }
    
    // Easter Egg: Freezing Janitor - can spawn anytime with slightly higher probability
    if (!janitorSpawned) {
        const janitorChance = 0.01; // 1% chance each spawn cycle (reduced from 10%)
        if (Math.random() < janitorChance) {
            spawnSpecialItem(janitorItem);
            janitorSpawned = true;
            return;
        }
    }
    
    // Easter Egg: Double Double - can spawn anytime with low probability, only if not active
    if (!doubleDoublePointsActive && !doubleDoubleSpeedActive) { // Check if effect is NOT active
        const doubleDoubleChance = 0.005; // 0.5% chance each spawn cycle (was 0.8%)
        if (Math.random() < doubleDoubleChance) {
            spawnSpecialItem(doubleDoubleItem);
            // No need to set flags here, that happens on collection
            return;
        }
    }
    
    // Time Plus can spawn anytime during the game with a more randomized timing
    if (!timePlusSpawned && !timePlusDelayActive) {
        // Set a random delay before Time Plus can spawn
        // This will make it appear at different times in different games
        const shouldSetDelay = Math.random() < 0.1; // 10% chance each spawn cycle to set the delay
        
        if (shouldSetDelay) {
            // Set a random delay point in the game (between 0 and 100% of game time)
            timePlusDelayUntil = GAME_DURATION - (Math.random() * GAME_DURATION);
            timePlusDelayActive = true;
            console.log(`Time Plus will be available when timer reaches ${timePlusDelayUntil} seconds`);
        }
    }
    
    // Once the delay is active, check if we've reached the delay point
    if (!timePlusSpawned && timePlusDelayActive && timeLeft <= timePlusDelayUntil) {
        // Now Time Plus can spawn with a moderate chance
        const timePlusChance = 0.08; // 8% chance each spawn cycle after delay point is reached
        
        if (Math.random() < timePlusChance) {
            spawnSpecialItem(timePlusItem);
            timePlusSpawned = true;
            return;
        }
    }
    
    // Climate Change can spawn anytime during the game with increasing probability toward the end
    if (!climateChangeSpawned) {
        // Probability increases as game progresses
        const climateChangeChance = 0.05 + (0.35 * ((GAME_DURATION - timeLeft) / GAME_DURATION));
        if (Math.random() < climateChangeChance) {
            spawnSpecialItem(climateChangeItem);
            climateChangeSpawned = true;
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
function gameLoop(timestamp) {
    if (!gameRunning) return;
    
    // Calculate delta time (time since last frame in seconds)
    if (lastFrameTime === 0) {
        lastFrameTime = timestamp;
        deltaTime = 0;
    } else {
        deltaTime = (timestamp - lastFrameTime) / 1000; // Convert to seconds
        // Cap delta time to prevent extreme values during lag spikes
        deltaTime = Math.min(deltaTime, 0.1);
        lastFrameTime = timestamp;
    }
    
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

// Update cart position based on key presses
function updateCartPosition() {
    let effectiveCartSpeed = CART_SPEED;
    if (cartSlowed && Date.now() < cartSlowedEndTime) {
        effectiveCartSpeed = CART_SPEED / 2;
    } else if (cartSlowed && Date.now() >= cartSlowedEndTime) {
        cartSlowed = false;
    }
    if (keysPressed['ArrowLeft'] || keysPressed['a']) {
        cartX -= effectiveCartSpeed * deltaTime;
    }
    
    if (keysPressed['ArrowRight'] || keysPressed['d']) {
        cartX += effectiveCartSpeed * deltaTime;
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
        let currentItemSpeed = ITEM_SPEED;

        // Apply Double Double speed effect if active
        if (doubleDoubleSpeedActive && currentTime < doubleDoubleSpeedEndTime) {
            currentItemSpeed *= 2;
        } else if (doubleDoubleSpeedActive && currentTime >= doubleDoubleSpeedEndTime) {
            // Deactivate speed effect if time is up
            doubleDoubleSpeedActive = false;
        }
        
        // Check if items are slowed down
        if (itemsSlowed && currentTime < itemsSlowedEndTime) {
            // Items move at half speed when slowed
            if (item.fastSpeed) {
                item.y += currentItemSpeed * deltaTime; // Special items maintain speed even when slowed
            } else {
                item.y += (currentItemSpeed / 2) * deltaTime;
            }
        } 
        // Check if items are sped up by Polar Bear
        else if (itemsFast && currentTime < itemsFastEndTime) {
            // Items move at double speed when fast
            if (item.fastSpeed) {
                // Special items move even faster (e.g., 1.5x base * 2 = 3x base)
                item.y += (currentItemSpeed * 1.5 * 2) * deltaTime; // MODIFICATO: Assicura che la velocità extra sia raddoppiata
            } else {
                // Regular items move at double speed
                item.y += (currentItemSpeed * 2) * deltaTime; // MODIFICATO: Aggiunto * 2
            }
        }
        // Normal speed (potentially doubled by Double Double)
        else {
            if (item.fastSpeed) {
                item.y += (currentItemSpeed * 1.5) * deltaTime; // Special items move 1.5x normal speed (or 3x if doubled)
            } else {
                item.y += currentItemSpeed * deltaTime; // Regular items move at normal speed (or 2x if doubled)
            }
        }

        // Deactivate slow/fast effects if time is up
        if (itemsSlowed && currentTime >= itemsSlowedEndTime) {
            itemsSlowed = false;
        }
        if (itemsFast && currentTime >= itemsFastEndTime) {
            itemsFast = false;
        }
        // Deactivate Double Double points effect if time is up
        if (doubleDoublePointsActive && currentTime >= doubleDoublePointsEndTime) {
            doubleDoublePointsActive = false;
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
            
            // Handle special effects for Easter Eggs and Time Plus
            if (item.type.isEasterEgg || item.type.name === timePlusItem.name) {
                // Handle Easter Egg effects
                if (item.type.name === gretaItem.name) {
                    timeLeft += gretaItem.addTime;
                    createPointsAnimation(item.x + ITEM_SIZE / 2, item.y, `+${gretaItem.addTime} seconds`);
                    soundManager.playSound(gretaItem.sound);
                } else if (item.type.name === trumpItem.name) {
                    score = trumpItem.setScore;
                    createPointsAnimation(item.x + ITEM_SIZE / 2, item.y, `Score set to ${trumpItem.setScore}`);
                    soundManager.playSound(trumpItem.sound);
                } else if (item.type.name === grandmaItem.name) {
                    itemsSlowed = true;
                    itemsSlowedEndTime = Date.now() + 5000; // Slow for 5 seconds
                    createPointsAnimation(item.x + ITEM_SIZE / 2, item.y, 'Items slowed!');
                    soundManager.playSound(grandmaItem.sound);
                } else if (item.type.name === bearItem.name) {
                    itemsFast = true;
                    itemsFastEndTime = Date.now() + 5000; // Fast for 5 seconds
                    createPointsAnimation(item.x + ITEM_SIZE / 2, item.y, 'Items faster!');
                    soundManager.playSound(bearItem.sound);
                } else if (item.type.name === janitorItem.name) {
                    cartSlowed = true;
                    cartSlowedEndTime = Date.now() + 5000; // Slow cart for 5 seconds
                    createPointsAnimation(item.x + ITEM_SIZE / 2, item.y, 'Cart slowed!');
                    soundManager.playSound(janitorItem.sound);
                } else if (item.type.name === doubleDoubleItem.name) {
                    // Activate Double Double effects
                    doubleDoublePointsActive = true;
                    doubleDoublePointsEndTime = Date.now() + 5000; // 5 seconds duration
                    doubleDoubleSpeedActive = true;
                    doubleDoubleSpeedEndTime = Date.now() + 5000; // 5 seconds duration
                    createPointsAnimation(item.x + ITEM_SIZE / 2, item.y, 'Double Double!');
                    soundManager.playSound(doubleDoubleItem.sound);
                }
                // Handle Time Plus effect
                else if (item.type.name === timePlusItem.name) {
                    timeLeft += timePlusItem.addTime;
                    createPointsAnimation(item.x + ITEM_SIZE / 2, item.y, `+${timePlusItem.addTime} seconds`);
                    soundManager.playSound(timePlusItem.sound);
                }
                // Add to collected items (still store the base type for these)
                collectedItems.push(item.type);
            } else {
                // Regular item collection
                let points = item.type.points;
                let wasDoubled = false;
                // Apply Double Points effect if active
                if (doubleDoublePointsActive && Date.now() < doubleDoublePointsEndTime) {
                    points *= 2;
                    wasDoubled = true;
                }
                score += points;
                createPointsAnimation(item.x + ITEM_SIZE / 2, item.y, points);

                // Add to collected items with doubled status
                collectedItems.push({ 
                    ...item.type, // Copy base item properties
                    collectedDuringDouble: wasDoubled // Add the flag
                });
            }
            
            // Update score display immediately after any score change
            updateScore();
            
            // Check if this item is part of the challenge (using the base item name)
            checkChallengeItem(item.type); // Pass the original item.type for name checking
            
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
            animation.y -= 50 * deltaTime;
        }
    }
}

// Check collision between item and cart
function checkCollision(item) {
    // If this item has already been counted, don't count it again
    if (item.counted) {
        return false;
    }

    // Item should generally be moving downwards to be collected.
    // This check helps prevent collecting items if they somehow move upwards through the cart.
    // A small tolerance (e.g., 0.5 pixels) can account for minor floating point inaccuracies if needed.
    if (item.y < item.previousY - 0.5) { // item.previousY is updated each frame before item.y
        return false;
    }

    // Item properties (assuming item.x, item.y are top-left corner)
    const itemLeft = item.x;
    const itemRight = item.x + ITEM_SIZE; // ITEM_SIZE is the width of the item
    const itemTop = item.y;
    const itemBottom = item.y + ITEM_SIZE; // ITEM_SIZE is the height of the item

    // Cart properties with collision padding
    const cartEffectiveLeft = cartX + CART_COLLISION_HORIZONTAL_PADDING;
    const cartEffectiveRight = cartX + CART_WIDTH - CART_COLLISION_HORIZONTAL_PADDING;
    const cartTopSurfaceY = cartY; // Y-coordinate of the cart's top surface
    const cartCollisionZoneBottomY = cartY + CART_COLLISION_SURFACE_HEIGHT; // Lower Y-limit of the top collision zone

    // 1. Precise horizontal collision check with padding:
    const horizontalMatch = itemRight > cartEffectiveLeft && itemLeft < cartEffectiveRight;

    // 2. Vertical collision check on the cart's top surface:
    const verticalMatchOnTopSurface = itemBottom >= cartTopSurfaceY &&
                                      itemBottom <= cartCollisionZoneBottomY &&
                                      itemTop < cartCollisionZoneBottomY;

    const isColliding = horizontalMatch && verticalMatchOnTopSurface;

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
    // Check if the item image is loaded
    if (itemImages[item.type.name] && itemImages[item.type.name].complete) {
        // Save the current context state
        ctx.save();
        
        // Apply glow effect based on item type
        if (item.type.isEasterEgg) {
            // Purple glow for Easter Eggs
            ctx.shadowColor = 'rgba(156, 39, 176, 0.7)'; // Purple color (#9C27B0)
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        } else {
            // Determine glow color based on whether it's a green item or not
            if (item.isGreen) {
                // Green glow for green items
                ctx.shadowColor = 'rgba(0, 255, 0, 0.7)';
            } else {
                // Red glow for non-green items
                ctx.shadowColor = 'rgba(255, 0, 0, 0.7)';
            }
            
            // Apply shadow blur for the glow effect
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }
        
        // Draw the image with glow effect (if applied)
        ctx.drawImage(itemImages[item.type.name], item.x, item.y, ITEM_SIZE, ITEM_SIZE);
        
        // Restore the context to remove the glow effect for the next item
        ctx.restore();
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
            // Use custom color if provided, otherwise determine based on content
            const color = animation.color || (animation.points.includes('+') ? '#4CAF50' : '#F44336'); // Green for positive, red for negative
            
            // Set color with opacity for fade-out effect
            ctx.fillStyle = `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${animation.opacity})`;
            
            // Draw the text message
            ctx.fillText(animation.points, animation.x, animation.y);
        } else {
            // For regular point animations
            // Determine color based on points value
            const color = animation.points >= 0 ? '#4CAF50' : '#F44336'; // Green for positive, red for negative
            
            // Set color with opacity for fade-out effect
            ctx.fillStyle = `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${animation.opacity})`;
            
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
        isGreen: itemType.isGreen !== undefined ? itemType.isGreen : (itemType.points > 0), // Use explicit isGreen if available, otherwise determine from points
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
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
        
        // Load common sounds
        loadSound('sound.wav');
        loadSound('bonus.wav');
        loadSound('malus.wav');
        loadSound('greenwashing.wav');
        loadSound('ny.wav');
        loadSound('greta.wav');
        loadSound('trump.wav');
        loadSound('grandma.wav');
        loadSound('bear.mp3');
        loadSound('coin.wav');
        loadSound('wizard.wav');
        loadSound('double.wav'); // Added double.wav
        loadSound('score.wav');
        loadSound('countdown.wav');
        loadSound('5sec.wav');
        
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
        } else if (item.type.name === climateChangeItem.name) {
            soundFile = 'ny.wav';
        } else if (item.type.name === gretaItem.name) {
            soundFile = 'greta.wav';
        } else if (item.type.name === trumpItem.name) {
            soundFile = 'trump.wav';
        } else if (item.type.name === grandmaItem.name) {
            soundFile = 'grandma.wav';
        } else if (item.type.name === bearItem.name) {
            soundFile = 'bear.mp3';
        } else if (item.type.name === timePlusItem.name) {
            soundFile = '5sec.wav';
        } else if (item.type.name === doubleDoubleItem.name) {
            soundFile = 'double.wav';
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

// Show shopping list screen
function showFactsScreen() {
    // Update the title of the facts screen to "Shopping List"
    const factsTitle = factsScreenElement.querySelector('h2');
    factsTitle.textContent = 'Shopping List';

    // Get the facts container
    const factsContainer = factsScreenElement.querySelector('.facts-container');

    // Clear existing content
    factsContainer.innerHTML = '';

    // Create and display the shopping list
    displayShoppingList(factsContainer);

    // Hide all screens and show the facts screen
    // document.querySelectorAll('.app-screen').forEach(screen => {
    //     screen.style.display = 'none';
    // });
    // factsScreenElement.style.display = 'block'; // <<< COMMENTED OUT THIS LINE

    // Scroll to top to ensure proper positioning
    // setTimeout(() => {
    //     factsScreenElement.scrollTop = 0;

    //     // Enter fullscreen mode on mobile devices
    //     if (isMobileDevice() && isFullscreenAvailable() && !isInFullScreen) {
    //         enterFullscreen();
    //     }
    // }, 100); // <<< COMMENTED OUT THIS BLOCK
}

// Hide shopping list screen and return to welcome screen
function hideFactsScreen() {
    // Hide all screens and show the welcome screen
    // document.querySelectorAll('.app-screen').forEach(screen => {
    //     screen.style.display = 'none';
    // });
    // startScreenElement.style.display = 'block'; // <<< COMMENTED OUT THIS LINE
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
    
    // Add Garden Gnome and Time Plus to bonus section
    addItemToShoppingList(bonusSection, bonusItem);
    addItemToShoppingList(bonusSection, timePlusItem);
    
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
    
    // Add Pollutant, Greenwashing, and Climate Change to malus section
    addItemToShoppingList(malusSection, malusItem);
    addItemToShoppingList(malusSection, greenwashingItem);
    addItemToShoppingList(malusSection, climateChangeItem);
    
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
    addItemToShoppingList(easterEggsSection, janitorItem);
    addItemToShoppingList(easterEggsSection, doubleDoubleItem);
    
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
        pointsElement.className = 'collected-item-points';
        pointsElement.style.color = '#9C27B0';
        // Add specific text for Freezing Janitor
        if (item.name === janitorItem.name) {
            pointsElement.textContent = 'Slow cart for 5 seconds';
        } else {
            pointsElement.textContent = item.points; // Keep original text for other Easter Eggs
        }
    } else if (item.name === 'Time Plus') {
        // Special handling for Time Plus in shopping list
        pointsElement.className = 'collected-item-points positive';
        pointsElement.textContent = item.points;
    } else {
        // Regular items use the standard positive/negative classes
        pointsElement.className = `collected-item-points ${item.points > 0 ? 'positive' : 'negative'}`;
        pointsElement.textContent = `${item.points > 0 ? '+' : ''}${item.points}`;
    }
    
    // Add elements to item
    itemElement.appendChild(nameElement);
    itemElement.appendChild(pointsElement);

    // Aggiungi l'elemento alla riga della lista della spesa
    rowContainer.appendChild(itemElement);
    
    // Add row container to the main container
    container.appendChild(rowContainer);
}

// Display collected items in the shopping cart list
function displayCollectedItems() {
    const collectedItemsList = document.getElementById('collectedItemsList');
    collectedItemsList.innerHTML = '';

    if (collectedItems.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'collected-item';
        emptyMessage.textContent = 'Your cart is empty!';
        collectedItemsList.appendChild(emptyMessage);
        return;
    }

    const itemCounts = {};
    const behaviorCounts = {};
    let carbonCreditItem = null;

    collectedItems.forEach(item => {
        if (item.isCarbonCredit) {
            carbonCreditItem = item;
        } else if (item.isBehavior) {
            // Behaviors don't get doubled, group normally
            const key = item.name;
            if (!behaviorCounts[key]) {
                behaviorCounts[key] = { ...item, count: 1 };
            } else {
                behaviorCounts[key].count++;
            }
        } else {
            // Regular items: group by name AND doubled status
            // Use collectedDuringDouble flag which is now added when collecting
            const key = item.name + (item.collectedDuringDouble ? '_doubled' : '_normal');
            if (!itemCounts[key]) {
                // Store the item data along with count and doubled status
                itemCounts[key] = { 
                    ...item, // Includes base points, image, name, isGreen, and collectedDuringDouble
                    count: 1, 
                    wasDoubled: item.collectedDuringDouble // Store the flag explicitly for easier access in addItemToList
                }; 
            } else {
                itemCounts[key].count++;
            }
        }
    });

    // Add Carbon Credit section (remains the same)
    if (carbonCreditItem) {
        const carbonCreditHeader = document.createElement('div');
        carbonCreditHeader.className = 'collected-items-header';
        carbonCreditHeader.textContent = 'Achievement';
        carbonCreditHeader.style.backgroundColor = '#FFD700'; // Gold color
        carbonCreditHeader.style.color = '#000';
        collectedItemsList.appendChild(carbonCreditHeader);
        
        const carbonCreditElement = document.createElement('div');
        carbonCreditElement.className = 'collected-item';
        carbonCreditElement.style.backgroundColor = '#FFD70033'; 
        carbonCreditElement.style.border = '2px solid #FFD700';
        
        const nameElement = document.createElement('div');
        nameElement.className = 'collected-item-name';
        
        const imageElement = document.createElement('img');
        imageElement.className = 'collected-item-image';
        imageElement.src = `assets/images/${carbonCreditItem.image}`;
        imageElement.alt = carbonCreditItem.name;
        nameElement.appendChild(imageElement);
        
        const nameText = document.createElement('span');
        nameText.textContent = `${carbonCreditItem.name} (Special Challenge Complete!)`;
        nameText.style.fontWeight = 'bold';
        nameElement.appendChild(nameText);
        
        const pointsElement = document.createElement('div');
        pointsElement.className = 'collected-item-points positive';
        pointsElement.textContent = `+${carbonCreditItem.points}`;
        pointsElement.style.fontWeight = 'bold';
        
        carbonCreditElement.appendChild(nameElement);
        carbonCreditElement.appendChild(pointsElement);
        collectedItemsList.appendChild(carbonCreditElement);
    }

    // Add behaviors section (remains mostly the same, uses behaviorCounts)
    const positiveBehaviorNames = Object.keys(behaviorCounts).filter(name => behaviorCounts[name].isGreen);
    const negativeBehaviorNames = Object.keys(behaviorCounts).filter(name => !behaviorCounts[name].isGreen);

    if (positiveBehaviorNames.length > 0 || negativeBehaviorNames.length > 0) {
        const behaviorsHeader = document.createElement('div');
        behaviorsHeader.className = 'collected-items-header';
        behaviorsHeader.textContent = 'Behaviors';
        collectedItemsList.appendChild(behaviorsHeader);
        
        positiveBehaviorNames.sort((a, b) => behaviorCounts[b].points - behaviorCounts[a].points);
        positiveBehaviorNames.forEach(behaviorName => {
            // Pass the behavior name and the grouped data
            addItemToList(collectedItemsList, behaviorName, behaviorCounts[behaviorName]); 
        });
        
        negativeBehaviorNames.sort((a, b) => behaviorCounts[a].points - behaviorCounts[b].points);
        negativeBehaviorNames.forEach(behaviorName => {
             // Pass the behavior name and the grouped data
            addItemToList(collectedItemsList, behaviorName, behaviorCounts[behaviorName]);
        });
    }

    // Add items section (uses itemCounts)
    if (Object.keys(itemCounts).length > 0) {
        const itemsHeader = document.createElement('div');
        itemsHeader.className = 'collected-items-header';
        itemsHeader.textContent = 'Items';
        collectedItemsList.appendChild(itemsHeader);
        
        // Sort items: first by base points (desc), then by name, then put doubled items after normal ones
        const sortedItemKeys = Object.keys(itemCounts).sort((a, b) => {
            const itemA = itemCounts[a];
            const itemB = itemCounts[b];
            
            // Primary sort: base points descending
            if (itemA.points !== itemB.points) {
                return itemB.points - itemA.points;
            }
            // Secondary sort: item name ascending
            if (itemA.name !== itemB.name) {
                 return itemA.name.localeCompare(itemB.name);
            }
            // Tertiary sort: normal before doubled
            return itemA.wasDoubled ? 1 : -1; 
        });
        
        // Add items using the grouped data
        sortedItemKeys.forEach(itemKey => {
            // Pass the base item name and the grouped data (which includes 'wasDoubled' flag)
            addItemToList(collectedItemsList, itemCounts[itemKey].name, itemCounts[itemKey]); 
        });
    }
}

// Helper function to add an item to the collected items list
// Now receives the base itemName and the full itemData object from the counts
function addItemToList(parentElement, itemName, itemData) {
    const itemElement = document.createElement('div');
    itemElement.className = 'collected-item';

    const nameElement = document.createElement('div');
    nameElement.className = 'collected-item-name';

    const imageElement = document.createElement('img');
    imageElement.className = 'collected-item-image';
    imageElement.src = `assets/images/${itemData.image}`;
    imageElement.alt = itemName;
    nameElement.appendChild(imageElement);

    const nameText = document.createElement('span');
    // Add "(Double)" if the item was collected during the effect (using wasDoubled flag)
    nameText.textContent = `${itemName} ${itemData.wasDoubled ? '(Double)' : ''} ${itemData.count > 1 ? `(x${itemData.count})` : ''}`;
    nameElement.appendChild(nameText);

    const pointsElement = document.createElement('div');
    const basePoints = itemData.points; // Base points from the item type
    const pointsAwarded = itemData.wasDoubled ? basePoints * 2 : basePoints; // Points actually awarded per item
    const totalPoints = pointsAwarded * itemData.count; // Total points for this group

    // Check for Easter Eggs (which are stored directly in collectedItems, not itemCounts/behaviorCounts usually)
    // This part might need adjustment if Easter eggs were also meant to be doubled (currently they are not)
    if (itemData.isEasterEgg) { 
        pointsElement.className = 'collected-item-points';
        pointsElement.style.color = '#9C27B0';
        // Display the specific effect text
        if (itemName === 'Tiny Greta') pointsElement.textContent = '+10 seconds';
        else if (itemName === 'Mr Trump') pointsElement.textContent = 'Sets score at -20';
        else if (itemName === 'Grandma\'s Recipes') pointsElement.textContent = 'Items slower for 5 seconds';
        else if (itemName === 'Polar Bear') pointsElement.textContent = 'Items faster for 5 seconds';
        else if (itemName === 'Freezing Janitor') pointsElement.textContent = 'Slow the cart for 5 seconds';
        else if (itemName === 'Double Double') pointsElement.textContent = 'Double points & speed (5s)';
        else pointsElement.textContent = itemData.points; // Fallback for any other case
    } else if (itemName === 'Time Plus') {
        pointsElement.className = 'collected-item-points positive';
        pointsElement.textContent = `+ 5 seconds`; // Time Plus doesn't have points doubled
    } else if (itemData.isBehavior) {
         // Behaviors (points are not doubled)
        pointsElement.className = `collected-item-points ${basePoints > 0 ? 'positive' : 'negative'}`;
        pointsElement.textContent = `${basePoints > 0 ? '+' : ''}${basePoints} × ${itemData.count} = ${basePoints * itemData.count}`;
    }
     else {
        // Regular items (handle doubled points display)
        pointsElement.className = `collected-item-points ${basePoints > 0 ? 'positive' : 'negative'}`;
        if (itemData.wasDoubled) {
            pointsElement.style.fontWeight = 'bold'; // Highlight doubled items
            if (itemData.count > 1) {
                // Show base points, multiplier, count, and total points
                pointsElement.textContent = `${basePoints > 0 ? '+' : ''}${basePoints}×2 ×${itemData.count} = ${totalPoints}`;
            } else {
                // Show base points, multiplier, and points awarded for a single item
                pointsElement.textContent = `${basePoints > 0 ? '+' : ''}${basePoints}×2 = ${pointsAwarded}`;
            }
        } else {
            // Show base points, count, and total for the group
            pointsElement.textContent = `${basePoints > 0 ? '+' : ''}${basePoints} × ${itemData.count} = ${totalPoints}`;
        }
    }

    itemElement.appendChild(nameElement);
    itemElement.appendChild(pointsElement);
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
    
    // --- Stop Countdown Sound ---
    // Check if countdownAudio exists and is playing, then stop and reset it
    if (countdownAudio && !countdownAudio.ended) {
        countdownAudio.pause();
        countdownAudio.currentTime = 0; // Reset the sound
        countdownAudio = null; // Clear the reference
        console.log("Countdown sound stopped on game end.");
    }
    // --- End Stop Countdown Sound ---

    // Hide mobile controls when game ends
    const mobileControls = document.getElementById('mobileControls');
    if (mobileControls) {
        mobileControls.style.display = 'none';
    }

    // Play game over sound using sound manager
    // For mobile devices, we need to handle audio differently
    if (isMobileDevice()) {
        // Play the sound with a slight delay to ensure audio context is ready
        setTimeout(() => {
            soundManager.playSound('score.wav', { volume: 1.0, forcePlay: true });
        }, 300);
    } else {
        // On desktop, just play the sound directly
        soundManager.playSound('score.wav', { volume: 1.0, forcePlay: true });
    }
        
    // Update final score
    finalScoreElement.textContent = score;

    // Get medal image element
    const medalImage = document.getElementById('medalImage');

    // Set feedback message and medal image based on score
    let feedback;
    let medalSrc;

    // Remove any existing wizard title from previous games
    const existingWizardTitle = document.querySelector('.wizard-title');
    if (existingWizardTitle) {
        existingWizardTitle.remove();
    }

    // Remove wizard medal class if it exists from previous games
    medalImage.classList.remove('wizard-medal');

    if (score >= 350) { // Changed from 330 to 350
        // Create and add the Mysterious Wizard title
        const wizardTitle = document.createElement('h3');
        wizardTitle.textContent = "Mysterious Wizard";
        wizardTitle.className = "wizard-title";
        document.querySelector('.result-container').prepend(wizardTitle);
        
        feedback = "A rare shopper indeed… may your footprint vanish like vegetable peels in the soil.";
        medalSrc = "assets/images/wizard.png";
        
        // Make the medal larger
        setTimeout(() => {
            medalImage.classList.add('wizard-medal');
        }, 10);
        
        // Play the special wizard sound
        soundManager.playSound('wizard.wav', { volume: 1.0, forcePlay: true });
    } else if (score >= 180) {
        feedback = "Eco-Warrior! Your cart is greener than a forest!";
        medalSrc = "assets/images/medal_1.png";
    } else if (score >= 130) {
        feedback = "Green Star! You are shopping sustainably";
        medalSrc = "assets/images/medal_2.png";
    } else if (score >= 80) {
        feedback = "Eco-Apprentice! Almost there, keep it up!";
        medalSrc = "assets/images/medal_3.png";
    } else if (score >= 30) {
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

    // Hide game screen and show game over screen
    document.querySelectorAll('.app-screen').forEach(screen => {
        screen.style.display = 'none';
    });
    // MODIFICATO: Usa 'flex' per attivare gli stili di centratura Flexbox
    document.getElementById('gameOver').style.display = 'flex'; 
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
    scoreChartModal.style.display = 'flex'; // <<< MODIFICATO: Usa 'flex' per centrare
}

// Hide score chart
function hideScoreChart() {
    scoreChartModal.style.display = 'none';
}

// Back to menu from game over screen
function backToMenu() {
    // Hide all screens and show the welcome screen
    document.querySelectorAll('.app-screen').forEach(screen => {
        screen.style.display = 'none';
    });
    startScreenElement.style.display = 'block';
}

// Function to display the game over screen
function displayGameOver() {
    console.log("Displaying Game Over Screen");
    stopTimer(); // Stop the timer
    gameRunning = false; // Set game state to not running

    // Hide game screen and show game over screen
    gameScreenElement.style.display = 'none';
    gameOverScreenElement.style.display = 'flex'; // Use flex for centering

    // Display final score
    finalScoreElement.textContent = score;

    // Populate the collected items list in the game over screen
    populateCollectedItemsList();

    // Provide feedback based on score and challenge completion
    updateFeedbackAndMedal();

    // Save the score
    saveScore(score);

    // Play game over sound effect
    playSoundEffect('gameOver'); // Assuming you have a sound effect function
}

// Function to populate the collected items list in the game over screen
function populateCollectedItemsList() {
    const listElement = document.getElementById('collectedItemsList');
    if (!listElement) {
        console.error("Element with ID 'collectedItemsList' not found.");
        return;
    }

    listElement.innerHTML = ''; // Clear previous list

    // Check if collectedItems is empty or not an object
    if (!collectedItems || typeof collectedItems !== 'object' || Object.keys(collectedItems).length === 0) {
        const emptyItem = document.createElement('div');
        emptyItem.textContent = 'No items collected.';
        emptyItem.style.textAlign = 'center'; // Center the text
        emptyItem.style.padding = '10px';
        listElement.appendChild(emptyItem);
        return;
    }

    // Iterate over collected items and display them
    for (const itemName in collectedItems) {
        if (Object.hasOwnProperty.call(collectedItems, itemName)) {
            const item = collectedItems[itemName];
            if (!item || !item.image) continue; // Skip if item data or image is missing

            const listItem = document.createElement('div');
            listItem.classList.add('collected-item');

            const img = document.createElement('img');
            img.src = item.image;
            img.alt = item.name;
            img.classList.add('collected-item-image'); // Added this line

            const nameSpan = document.createElement('span');
            nameSpan.classList.add('collected-item-name');
            nameSpan.textContent = item.name;

            const pointsSpan = document.createElement('span');
            pointsSpan.classList.add('collected-item-points');
            pointsSpan.textContent = `${item.points >= 0 ? '+' : ''}${item.points} pts`;
            pointsSpan.classList.add(item.points >= 0 ? 'positive' : 'negative');

            listItem.appendChild(img);
            listItem.appendChild(nameSpan);
            listItem.appendChild(pointsSpan);

            listElement.appendChild(listItem);
        }
    }
}
