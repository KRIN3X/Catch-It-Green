console.log('Modulo interstellar.js caricato correttamente.');

// Wrap everything in an IIFE to avoid global scope pollution
(function() {
    // Game constants with INTERSTELLAR_ prefix to avoid conflicts with game.js
    const INTERSTELLAR_GAME_DURATION = 90; // Game duration in seconds (1:30 minutes)
    const INTERSTELLAR_CART_SPEED = 1200; // Base cart speed (pixels per second)
    const INTERSTELLAR_ITEM_SPEED = 360; // Base item speed (pixels per second)
    const INTERSTELLAR_SPAWN_RATE = 500; // Reduced from 1000 to make items appear more frequently
    const INTERSTELLAR_CART_WIDTH = 160; // Doubled from 80
    const INTERSTELLAR_CART_HEIGHT = 100; // Doubled from 50
    const INTERSTELLAR_ITEM_SIZE = 100; // Doubled from 50
    const INTERSTELLAR_TARGET_FPS = 60; // Target frames per second for delta time normalization
    const FUEL_MAX_LEVEL = 10; // Maximum fuel level (increased from 5 to 10)
    const FUEL_DECREASE_INTERVAL = 1000; // 1 second in milliseconds (decreased from 2 seconds)
    
    // Define constants for small asteroids
    const INTERSTELLAR_SMALL_ASTEROID_SIZE = 60; // Smaller size for small asteroids
    const INTERSTELLAR_SMALL_ASTEROID_SPEED = 450; // Faster speed for small asteroids

    // Define constants for the diagonal asteroid
    const DIAGONAL_ASTEROID_IMAGE = 'assets/images/wobble.png';
    const DIAGONAL_ASTEROID_SPEED = 400; // Speed for diagonal movement

    // Define constants for the Gravity Shifter
    const GRAVITY_SHIFTER_IMAGE = 'assets/images/gravity.png';
    const GRAVITY_SHIFTER_AUDIO = 'assets/audio/gravity.wav';
    const GRAVITY_SHIFTER_DURATION = 3000; // 3 seconds

    // Define constants for the Alien Larva
    const ALIEN_LARVA_IMAGE = 'assets/images/larva.png';
    const ALIEN_LARVA_AUDIO = 'assets/audio/larva.wav';
    const ALIEN_LARVA_DURATION = 3000; // 3 seconds
    const ALIEN_LARVA_SPEED = 500; // Adjusted speed for Alien Larva

    // Define constants for the Telepathic Core
    const TELEPATHIC_CORE_IMAGE = 'assets/images/brain.png';
    const TELEPATHIC_CORE_AUDIO = 'assets/audio/brain.wav';
    const TELEPATHIC_CORE_DURATION = 3000; // 3 seconds

    // Define constants for the Protective Shield
    const PROTECTIVE_SHIELD_IMAGE = 'assets/images/shield.png';
    const PROTECTIVE_SHIELD_AUDIO = 'assets/audio/shield.wav';
    const PROTECTIVE_SHIELD_DURATION = 5000; // 5 seconds

    // Define constants for the Xenomorph
    const XENOMORPH_IMAGE = 'assets/images/xenomorph.png';
    const XENOMORPH_AUDIO = 'assets/audio/xenomorph.wav';
    const XENOMORPH_DURATION = 3000; // 3 seconds for speed reduction
    const XENOMORPH_SPEED = 500; // Adjusted speed for Xenomorph
    const XENOMORPH_BLUR_INTENSITY = '15px'; // Increased blur intensity for Xenomorph
    const XENOMORPH_BLUR_DURATION = 5000; // Duration for the Xenomorph blur effect

    // Define constants for the Laser Gun
    const LASER_GUN_IMAGE_PATH = 'assets/images/laser.png';
    const LASER_EFFECT_IMAGE_PATH = 'assets/images/laser2.png';
    const LASER_AUDIO_PATH = 'assets/audio/laser.wav';
    const LASER_FLASH_DURATION = 200; // ms for red flash
    const LASER_ASTEROID_EFFECT_DURATION = 300; // ms for laser2.png on asteroid
    const SPLAT_IMAGE_PATH = 'assets/images/splat.png'; // NUOVA IMMAGINE PER XENO/LARVA
    const SPLAT_EFFECT_DURATION = 300; // Durata effetto splat

    // Fuel types with their properties
    const FUEL_TYPES = [
        { name: 'Biofuel Capsule', fuelValue: 8, chance: 0.20, image: 'biofuel.png' },
        { name: 'Solar Cell', fuelValue: 4, chance: 0.30, image: 'solar.png' },
        { name: 'Algae Extract', fuelValue: 6, chance: 0.25, image: 'algae.png' },
        { name: 'Hydrogen Bubble', fuelValue: 2, chance: 0.20, image: 'hydrogen.png' },
        { name: 'Fusion Drop', fuelValue: 10, chance: 0.05, image: 'fusion.png' }
    ];

    // Simple string constants for game over reasons
    const REASON_COLLISION = 'collision';
    const REASON_FUEL_DEPLETED = 'fuel_depleted';
    const REASON_TIME_UP = 'time_up';

    // Store the restart and exit functions directly
    let restartInterstellarGameFunction = null;
    let exitInterstellarModeFunction = null;

    // Make the restart and exit functions globally available
    window.interstellarRestartGame = function() {
        console.log("Restart button clicked");
        if (restartInterstellarGameFunction) {
            restartInterstellarGameFunction();
        } else {
            console.error("Restart function not available");
        }
    };

    window.interstellarExitGame = function() {
        console.log("Exit button clicked");
        if (exitInterstellarModeFunction) {
            exitInterstellarModeFunction();
        } else {
            console.error("Exit function not available");
        }
    };

    // Add a global variable to track spawn trajectories
    let spawnTrajectories = []; // Array to store trajectory positions and expiration times

    // Add a global array to track fuel points for fading effect
    let fuelPointsToDisplay = []; // Array to store fuel points for fading effect

    // Load the welcome audio
    const welcomeAudio = new Audio('assets/audio/welcome.wav');

    // Load the propulsion audio
    const propulsionAudio = new Audio('assets/audio/propulsion.wav');
    propulsionAudio.loop = false; // Ensure it doesn't loop
    propulsionAudio.volume = 0.5; // Set volume to 50%

    // Add a global variable to track special item spawn interval
    let specialItemSpawnInterval = null; // Track the special item spawn interval

    // Ensure cart speed modification is handled safely
    let originalCartSpeed = INTERSTELLAR_CART_SPEED; // Store the original speed globally

    // Refactor cart speed handling to ensure smooth game loop
    let cartSpeedModifier = 1; // Multiplier for cart speed

    // Add a global variable to track game start time
    let gameStartTime = 0; // Variabile globale per tracciare il tempo di inizio del gioco

    // Game variables for Laser Gun
    let hasLaserGun = false;
    let laserGunIconElement = null;
    let laserGunImage = new Image();
    let laserEffectImage = new Image();
    let laserAudio = new Audio();
    let laserGunCollectAudio = new Audio(); // NUOVA VARIABILE PER IL SUONO DI RACCOLTA
    let splatImage = new Image(); // NUOVA VARIABILE IMMAGINE SPLAT

    let isFirstSpecialItemSpawnThisGame = true; // NUOVA VARIABILE: true per forzare il primo spawn del laser

    // Load the planet image
    const planetImage = new Image();
    planetImage.src = 'assets/images/planet.png';

    // Make the function globally available
    window.startInterstellarMode = function() {
        console.log('startInterstellarMode function called');
        console.log('Modalità Interstellar avviata!');

        // Create a completely new container for interstellar mode
        const interstellarContainer = document.createElement('div');
        interstellarContainer.id = 'interstellarContainer';
        interstellarContainer.style.position = 'fixed';
        interstellarContainer.style.top = '0';
        interstellarContainer.style.left = '0';
        interstellarContainer.style.width = '100vw';
        interstellarContainer.style.height = '100vh';
        interstellarContainer.style.zIndex = '9999'; // Ensure it's on top of everything
        interstellarContainer.style.backgroundColor = 'black';
        interstellarContainer.style.overflow = 'hidden';
        interstellarContainer.style.display = 'flex';
        interstellarContainer.style.justifyContent = 'center';
        interstellarContainer.style.alignItems = 'center';
        
        // Add the interstellar content with canvas and styled header (same structure as main game)
        interstellarContainer.innerHTML = `
            <div id="interstellarScreen" class="interstellar-screen" style="position: relative; width: 800px; height: 650px; display: flex; flex-direction: column; align-items: center;">
                <!-- Game header with fuel and timer -->
                <div class="game-header" style="display: flex; justify-content: space-between; width: 80%; max-width: 600px; margin: 0 auto 10px; padding: 10px; background-color: rgba(0, 0, 0, 0.8); border-radius: 5px; font-size: 18px; border: 1px solid #FFFFFF; align-items: center;">
                    <div class="fuel-container" style="padding: 5px 10px; color: #FFFFFF; font-weight: bold; display: flex; align-items: center;">
                        Fuel: 
                        <div class="fuel-bar" style="margin-left: 10px; display: flex; height: 15px;">
                            <div class="fuel-segment" style="width: 15px; height: 100%; background-color: #4CAF50; margin-right: 2px;"></div>
                            <div class="fuel-segment" style="width: 15px; height: 100%; background-color: #4CAF50; margin-right: 2px;"></div>
                            <div class="fuel-segment" style="width: 15px; height: 100%; background-color: #4CAF50; margin-right: 2px;"></div>
                            <div class="fuel-segment" style="width: 15px; height: 100%; background-color: #4CAF50; margin-right: 2px;"></div>
                            <div class="fuel-segment" style="width: 15px; height: 100%; background-color: #4CAF50; margin-right: 2px;"></div>
                            <div class="fuel-segment" style="width: 15px; height: 100%; background-color: #4CAF50; margin-right: 2px;"></div>
                            <div class="fuel-segment" style="width: 15px; height: 100%; background-color: #4CAF50; margin-right: 2px;"></div>
                            <div class="fuel-segment" style="width: 15px; height: 100%; background-color: #4CAF50; margin-right: 2px;"></div>
                            <div class="fuel-segment" style="width: 15px; height: 100%; background-color: #4CAF50; margin-right: 2px;"></div>
                            <div class="fuel-segment" style="width: 15px; height: 100%; background-color: #4CAF50;"></div>
                        </div>
                    </div>
                    <div id="laserGunIconContainer" style="width: 40px; height: 40px; display: none; margin: 0 10px;">
                        <img id="laserGunIcon" src="${LASER_GUN_IMAGE_PATH}" style="width: 100%; height: 100%;" alt="Laser Gun">
                    </div>
                    <div class="timer-container" style="padding: 5px 10px; color: #FFFFFF; font-weight: bold;">
                        <span style="color: #32CD32; margin-right: 10px;">Arrival Time:</span> <!-- MODIFICATO: Aggiunto stile colore verde -->
                        <span id="interstellarTimer">1:30</span>
                    </div>
                </div>
                
                <!-- Game canvas -->
                <canvas id="interstellarCanvas" width="800" height="600" style="background-color: black; border: 4px solid #FFFFFF; border-radius: 5px;"></canvas>
                
                <!-- Audio controls -->
                <audio id="interstellarMusic" autoplay loop>
                    <source src="./assets/audio/interstellar.mp3" type="audio/mp3">
                    Your browser does not support the audio element.
                </audio>
                
                <!-- Explosion sound -->
                <audio id="explosionSound">
                    <source src="./assets/audio/explosion.wav" type="audio/wav">
                    Your browser does not support the audio element.
                </audio>
            </div>
        `;
        
        // Add the container to the body
        document.body.appendChild(interstellarContainer);

        // Game Over Screen with separate content and buttons
        // Apply the main game's game over screen class
        const interstellarGameOverScreen = document.createElement('div');
        interstellarGameOverScreen.id = 'interstellarGameOver';
        interstellarGameOverScreen.className = 'game-over-screen'; // Use the class from style.css
        interstellarGameOverScreen.style.display = 'none'; // Keep hidden initially

        // Content container - Apply the main game's content class
        const gameOverContent = document.createElement('div');
        gameOverContent.id = 'interstellarGameOverContent';
        gameOverContent.className = 'game-over-content'; // Use the class from style.css

        // Image container (optional, adjust as needed or integrate into game-over-content)
        const imageContainer = document.createElement('div');
        imageContainer.id = 'interstellarGameOverImage';
        imageContainer.style.marginBottom = '20px'; // Keep or adjust spacing
        imageContainer.style.display = 'none'; // Initially hidden

        // Title
        const titleElement = document.createElement('h2'); // Use h2 like in main game over
        titleElement.id = 'interstellarGameOverTitle';

        // Message
        const messageElement = document.createElement('p'); // Use p like in main game over
        messageElement.id = 'interstellarGameOverMessage';

        // Sub Message
        const subMessageElement = document.createElement('p'); // Use p like in main game over
        subMessageElement.id = 'interstellarGameOverSubMessage';

        gameOverContent.appendChild(imageContainer); // Add image container first if needed
        gameOverContent.appendChild(titleElement);
        gameOverContent.appendChild(messageElement);
        gameOverContent.appendChild(subMessageElement);

        // Buttons container - Apply the main game's button container class
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'game-over-buttons'; // Use the class from style.css

        // Restart Button - Apply the retro-button class
        const restartButton = document.createElement('button');
        restartButton.id = 'interstellarRestartButton';
        restartButton.className = 'retro-button'; // Use the class from style.css
        restartButton.textContent = 'Play Again';
        restartButton.onclick = () => {
            window.playKeyboardSound(); // <-- AGGIUNTO
            console.log("Interstellar Restart button clicked");
            if (typeof restartInterstellarGameFunction === 'function') {
                restartInterstellarGameFunction();
            } else {
                console.error('restartInterstellarGameFunction is not defined');
            }
        };

        // Back to Menu Button - Apply the retro-button class
        const backToMenuButton = document.createElement('button');
        backToMenuButton.id = 'interstellarBackToMenuButton';
        backToMenuButton.className = 'retro-button'; // Use the class from style.css
        backToMenuButton.textContent = 'Back to Menu';
        backToMenuButton.onclick = () => {
            window.playKeyboardSound(); // <-- AGGIUNTO
            console.log("Interstellar Back to Menu button clicked");
            const interstellarContainerElement = document.getElementById('interstellarContainer');
            if (interstellarContainerElement) {
                interstellarContainerElement.remove();
            }
            const startScreen = document.getElementById('startScreen');
            if (startScreen) {
                startScreen.style.display = 'flex';
            }
            const music = document.getElementById('interstellarMusic');
            if (music) {
                music.pause();
                music.currentTime = 0;
            }
            // RIMOSSO/COMMENTATO: Logica che avvia la musica del menu principale
            /*
            const mainMenuMusic = document.getElementById('backgroundMusic');
            if (mainMenuMusic && mainMenuMusic.paused) {
                 mainMenuMusic.play().catch(e => console.error("Error playing main menu music:", e));
            }
            */
        };

        buttonContainer.appendChild(restartButton);
        buttonContainer.appendChild(backToMenuButton);

        interstellarGameOverScreen.appendChild(gameOverContent); // Add content first
        interstellarGameOverScreen.appendChild(buttonContainer); // Add buttons after content

        // Append the game over screen to the interstellar container
        interstellarContainer.appendChild(interstellarGameOverScreen);

        // Get canvas and context
        const canvas = document.getElementById('interstellarCanvas');
        const ctx = canvas.getContext('2d');
        
        // Set volume for the interstellar music
        const interstellarMusic = document.getElementById('interstellarMusic');
        interstellarMusic.volume = 0.7; // 70% volume
        
        // Load images
        const cartImage = new Image();
        cartImage.src = 'assets/images/cart3.png';

        const explosionImage = new Image();
        explosionImage.src = 'assets/images/explosion.png';

        const asteroidImage = new Image();
        asteroidImage.src = 'assets/images/asteroid.png';

        // Load the small asteroid image
        const smallAsteroidImage = new Image();
        smallAsteroidImage.src = 'assets/images/asteroid2.png';
        
        // Load the diagonal asteroid image
        const diagonalAsteroidImage = new Image();
        diagonalAsteroidImage.src = DIAGONAL_ASTEROID_IMAGE;

        // Load background image
        const backgroundImage = new Image();
        backgroundImage.src = 'assets/images/background2.png';
        
        // Load lost in space image
        const lostImage = new Image();
        lostImage.src = 'assets/images/lost.png';
        
        // Load zero planet image
        const zeroImage = new Image();
        zeroImage.src = 'assets/images/zero.png';
        
        // Load fuel type images
        const fuelImages = {};
        FUEL_TYPES.forEach(fuelType => {
            fuelImages[fuelType.name] = new Image();
            fuelImages[fuelType.name].src = `assets/images/${fuelType.image}`;
        });

        // Load the Gravity Shifter image and audio
        const gravityShifterImage = new Image();
        gravityShifterImage.src = GRAVITY_SHIFTER_IMAGE;

        const gravityShifterAudio = new Audio(GRAVITY_SHIFTER_AUDIO);

        // Load the Alien Larva image and audio
        const alienLarvaImage = new Image();
        alienLarvaImage.src = ALIEN_LARVA_IMAGE;

        const alienLarvaAudio = new Audio(ALIEN_LARVA_AUDIO);

        // Load the Telepathic Core image and audio
        const telepathicCoreImage = new Image();
        telepathicCoreImage.src = TELEPATHIC_CORE_IMAGE;

        const telepathicCoreAudio = new Audio(TELEPATHIC_CORE_AUDIO);

        // Load the Protective Shield image and audio
        const protectiveShieldImage = new Image();
        protectiveShieldImage.src = PROTECTIVE_SHIELD_IMAGE;

        const protectiveShieldAudio = new Audio(PROTECTIVE_SHIELD_AUDIO);

        // Load the Xenomorph image and audio
        const xenomorphImage = new Image();
        xenomorphImage.src = XENOMORPH_IMAGE;

        const xenomorphAudio = new Audio(XENOMORPH_AUDIO);

        // Load Laser Gun assets
        laserGunImage.src = LASER_GUN_IMAGE_PATH;
        laserEffectImage.src = LASER_EFFECT_IMAGE_PATH;
        laserAudio.src = LASER_AUDIO_PATH;
        laserGunCollectAudio.src = 'assets/audio/loading.wav'; // CARICA IL NUOVO AUDIO
        splatImage.src = SPLAT_IMAGE_PATH; // CARICA IMMAGINE SPLAT
        laserGunIconElement = document.getElementById('laserGunIconContainer');

        // Load debris image and sound
        const debrisImage = new Image();
        debrisImage.src = 'assets/images/debris.png';
        const debrisSound = new Audio('assets/audio/debris.wav');
        debrisSound.volume = 1.0; // Set volume to 100%

        // Get the explosion sound element
        const explosionSound = document.getElementById('explosionSound');
        explosionSound.volume = 1.0; // Set volume to 100%

        // Create propulsion sound object directly in JS
        const propulsionSound = new Audio('assets/audio/propulsion.wav');
        propulsionSound.loop = false; // Do not loop
        propulsionSound.volume = 0.5; // Set volume to 50%
        
        // Create recharge sound element
        const rechargeSound = new Audio('assets/audio/recharge.wav');
        rechargeSound.volume = 1.0; // Set volume to 100%
        
        // Create game over sound element
        const gameOverSound = new Audio('assets/audio/over.wav');
        gameOverSound.volume = 1.0; // Set volume to 100%

        // Animation frame tracking
        let animationFrameId = null;

        // Game variables
        let gameRunning = true;
        let gameItems = [];
        let cartX = canvas.width / 2 - INTERSTELLAR_CART_WIDTH / 2;
        const cartY = canvas.height - INTERSTELLAR_CART_HEIGHT - 20; // Position cart near bottom
        let keysPressed = {};
        let lastFrameTime = 0;
        let deltaTime = 0;
        
        // Explosion state variables
        let isExploding = false;
        let explosionTimer = 0;
        const EXPLOSION_DURATION = 1000; // 1 second in milliseconds
        
        // Fuel and timer variables
        let fuelLevel = FUEL_MAX_LEVEL;
        let gameTimeLeft = INTERSTELLAR_GAME_DURATION;
        let fuelDecreaseTimer = 0;
        
        // Game over reason tracking
        let gameOverReason = null;
        
        // Interval tracking
        let asteroidSpawnInterval = null;
        let fuelSpawnInterval = null;
        let spawnRateAdjustInterval = null;

        // Array for debris effects
        let debrisEffects = [];

        // Spawn rate variables
        let asteroidSpawnRate = 2300; // Slightly increased spawn rate for normal asteroids
        let fuelSpawnRate = 1500; // Initial spawn rate for fuel

        // Gravity reversal state
        let gravityReversed = false;

        // Introduce a gravity multiplier to control gravity direction
        let gravityMultiplier = 1; // 1 for normal gravity, -1 for reversed gravity

        // Shield activation state
        let shieldActive = false; // Track if the shield is active
        
        // Recharge sound cooldown
        let rechargeSoundCooldown = false;

        isFirstSpecialItemSpawnThisGame = true; // Inizializza per la prima partita

        // Update the fuel display
        function updateFuelDisplay() {
            const fuelSegments = document.querySelectorAll('.fuel-segment');
            fuelSegments.forEach((segment, index) => {
                if (index < fuelLevel) {
                    segment.style.backgroundColor = '#4CAF50'; // Green for active fuel
                } else {
                    segment.style.backgroundColor = '#555555'; // Gray for depleted fuel
                }
            });
        }
        
        // Decrease fuel level
        function decreaseFuel() {
            if (fuelLevel > 0) {
                fuelLevel--;
                updateFuelDisplay();
                
                // End game if fuel is empty
                if (fuelLevel === 0) {
                    console.log("Fuel depleted, ending game");
                    gameOverReason = REASON_FUEL_DEPLETED;
                    endInterstellarGame();
                }
            }
        }
        
        // Format and display the timer
        function updateTimerDisplay() {
            const minutes = Math.floor(gameTimeLeft / 60);
            const seconds = Math.floor(gameTimeLeft % 60);
            const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            document.getElementById('interstellarTimer').textContent = formattedTime;
        }

        // Add event listeners for keyboard
        function handleKeyDown(e) {
            keysPressed[e.key] = true;
            if (e.key === 'ArrowUp' && hasLaserGun && gameRunning) {
                fireLaser();
            }
        }
        
        function handleKeyUp(e) {
            keysPressed[e.key] = false;
        }
        
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        // No back button anymore
        
        // Function to exit interstellar mode
        function exitInterstellarMode() {
            console.log("Exiting interstellar mode");
            // Stop the game
            gameRunning = false;
            
            // Cancel animation frame
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            
            // Clear all intervals
            if (asteroidSpawnInterval) {
                clearInterval(asteroidSpawnInterval);
                asteroidSpawnInterval = null;
            }

            if (fuelSpawnInterval) {
                clearInterval(fuelSpawnInterval);
                fuelSpawnInterval = null;
            }

            if (specialItemSpawnInterval) {
                clearInterval(specialItemSpawnInterval);
                specialItemSpawnInterval = null;
            }
            
            if (spawnRateAdjustInterval) {
                clearInterval(spawnRateAdjustInterval);
                spawnRateAdjustInterval = null;
            }
            
            // Remove the interstellar container
            document.body.removeChild(interstellarContainer);
            
            // Remove event listeners to prevent memory leaks
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        }
        
        // Make the exit function available
        exitInterstellarModeFunction = exitInterstellarMode;

        // Select a random fuel type based on chance
        function selectRandomFuelType() {
            const weightedFuelTypes = [];

            // Add fuel types to the weighted array based on their fuel value
            FUEL_TYPES.forEach(fuelType => {
                const weight = Math.max(1, 15 - fuelType.fuelValue); // Higher weight for lower fuel values
                for (let i = 0; i < weight; i++) {
                    weightedFuelTypes.push(fuelType);
                }
            });

            // Select a random fuel type from the weighted array
            const randomIndex = Math.floor(Math.random() * weightedFuelTypes.length);
            return weightedFuelTypes[randomIndex];
        }
        
        // Spawn a fuel item
        function spawnFuelItem() {
            if (!gameRunning) return;
            
            const fuelType = selectRandomFuelType();
            
            const fuelItem = {
                x: Math.random() * (canvas.width - INTERSTELLAR_ITEM_SIZE),
                y: -INTERSTELLAR_ITEM_SIZE,
                previousY: -INTERSTELLAR_ITEM_SIZE,
                type: fuelType,
                isFuel: true,
                counted: false
            };
            
            gameItems.push(fuelItem);
            console.log(`Spawned fuel item: ${fuelType.name}`);
        }
        
        // Spawn a new asteroid
        function spawnAsteroid() {
            if (!gameRunning) return;

            const randomChance = Math.random();

            // Reduce the probability of spawning diagonal asteroids and maintain the 20-second delay
            if (randomChance < 1 / 10 && performance.now() - gameStartTime > 20000) { // 10% chance after 20 seconds
                console.log('Spawning Diagonal Asteroid');
                spawnDiagonalAsteroid();
            } else {
                const isSmallAsteroid = Math.random() < 0.5;

                const asteroid = {
                    x: Math.random() * (canvas.width - (isSmallAsteroid ? INTERSTELLAR_SMALL_ASTEROID_SIZE : INTERSTELLAR_ITEM_SIZE)),
                    y: -INTERSTELLAR_ITEM_SIZE,
                    previousY: -INTERSTELLAR_ITEM_SIZE,
                    isAsteroid: true,
                    isSmall: isSmallAsteroid
                };

                console.log(`Spawning Regular Asteroid - Small: ${isSmallAsteroid}`);
                gameItems.push(asteroid);
            }
        }

        // Add a function to spawn diagonal asteroids
        function spawnDiagonalAsteroid() {
            const startX = Math.random() * (canvas.width - INTERSTELLAR_ITEM_SIZE * 2) + INTERSTELLAR_ITEM_SIZE; // Evita i bordi
            const startY = -INTERSTELLAR_ITEM_SIZE;

            // Calcola il vettore di direzione verso il carrello
            const targetX = cartX + INTERSTELLAR_CART_WIDTH / 2; // Centro del carrello
            const targetY = canvas.height - INTERSTELLAR_CART_HEIGHT; // Posizione verticale del carrello
            const deltaX = targetX - startX;
            const deltaY = targetY - startY;
            const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            const diagonalAsteroid = {
                x: startX,
                y: startY,
                previousY: startY,
                isDiagonalAsteroid: true,
                directionX: deltaX / magnitude, // Normalizza il vettore
                directionY: deltaY / magnitude  // Normalizza il vettore
            };

            gameItems.push(diagonalAsteroid);
            console.log(`Spawned Diagonal Asteroid - Start X: ${startX}, Start Y: ${startY}, DirectionX: ${diagonalAsteroid.directionX}, DirectionY: ${diagonalAsteroid.directionY}`);
        }

        // Add a function to spawn the Gravity Shifter
        function spawnGravityShifter() {
            const gravityShifter = {
                x: Math.random() * (canvas.width - INTERSTELLAR_ITEM_SIZE),
                y: -INTERSTELLAR_ITEM_SIZE,
                previousY: -INTERSTELLAR_ITEM_SIZE,
                isGravityShifter: true
            };

            gameItems.push(gravityShifter);
            console.log('Spawned Gravity Shifter!');
        }

        function spawnAlienLarva() {
            const alienLarva = {
                x: Math.random() * (canvas.width - INTERSTELLAR_ITEM_SIZE),
                y: -INTERSTELLAR_ITEM_SIZE, // Modificato da specialItemYStart
                previousY: -INTERSTELLAR_ITEM_SIZE, // Modificato da specialItemYStart
                isAlienLarva: true
            };

            gameItems.push(alienLarva);
            console.log('Spawned Alien Larva!');
        }

        function spawnTelepathicCore() {
            const telepathicCore = {
                x: Math.random() * (canvas.width - INTERSTELLAR_ITEM_SIZE),
                y: -INTERSTELLAR_ITEM_SIZE,
                previousY: -INTERSTELLAR_ITEM_SIZE,
                isTelepathicCore: true
            };

            gameItems.push(telepathicCore);
            console.log('Spawned Telepathic Core!');
        }

        // Add a function to spawn the Protective Shield
        function spawnProtectiveShield() {
            const protectiveShield = {
                x: Math.random() * (canvas.width - INTERSTELLAR_ITEM_SIZE),
                y: -INTERSTELLAR_ITEM_SIZE,
                previousY: -INTERSTELLAR_ITEM_SIZE,
                isProtectiveShield: true
            };

            gameItems.push(protectiveShield);
            console.log('Spawned Protective Shield!');
        }

        function spawnLaserGun() {
            const laserGunItem = {
                x: Math.random() * (canvas.width - INTERSTELLAR_ITEM_SIZE),
                y: -INTERSTELLAR_ITEM_SIZE,
                previousY: -INTERSTELLAR_ITEM_SIZE,
                isLaserGun: true
            };
            gameItems.push(laserGunItem);
            console.log('Spawned Laser Gun!');
        }

        function spawnXenomorph() {
            const xenomorph = {
                x: Math.random() * (canvas.width - INTERSTELLAR_ITEM_SIZE),
                y: -INTERSTELLAR_ITEM_SIZE, // Modificato da specialItemYStart
                previousY: -INTERSTELLAR_ITEM_SIZE, // Modificato da specialItemYStart
                isXenomorph: true
            };

            gameItems.push(xenomorph);
            console.log('Spawned Xenomorph!');
        }

        // Add a function to spawn special items
        function spawnSpecialItem() {
            if (!gameRunning) return;

            if (isFirstSpecialItemSpawnThisGame) {
                console.log('Prima generazione speciale della partita: Laser Gun (garantito)');
                spawnLaserGun();
                isFirstSpecialItemSpawnThisGame = false;
            } else {
                // Logica di spawn probabilistica con probabilità aggiustate
                const specialItemRoll = Math.random();
                // Probabilità normalizzate:
                // GS: ~11.5%
                // AL: ~23.1% (raddoppiata rispetto a GS)
                // TC: ~11.5%
                // PS: ~11.5%
                // XN: ~23.1% (raddoppiata rispetto a GS)
                // LG: ~7.7%
                // NO: ~11.6%
                if (specialItemRoll < 0.115) { // Era 0.15 per Gravity Shifter
                    console.log('Generazione: Gravity Shifter');
                    spawnGravityShifter();
                } else if (specialItemRoll < 0.346) { // Era 0.30 per Alien Larva (0.115 + 0.231)
                    console.log('Generazione: Alien Larva');
                    spawnAlienLarva();
                } else if (specialItemRoll < 0.461) { // Era 0.45 per Telepathic Core (0.346 + 0.115)
                    console.log('Generazione: Telepathic Core');
                    spawnTelepathicCore();
                } else if (specialItemRoll < 0.576) { // Era 0.60 per Protective Shield (0.461 + 0.115)
                    console.log('Generazione: Protective Shield');
                    spawnProtectiveShield();
                } else if (specialItemRoll < 0.807) { // Era 0.75 per Xenomorph (0.576 + 0.231)
                    console.log('Generazione: Xenomorph');
                    spawnXenomorph();
                } else if (specialItemRoll < 0.884) { // Era 0.85 per Laser Gun (0.807 + 0.077)
                    console.log('Generazione: Laser Gun (probabilistico)');
                    spawnLaserGun();
                } else {
                    // Il resto (~11.6%) è la probabilità che non spawni nulla di speciale
                    console.log('Nessun oggetto speciale generato in questo ciclo (probabilistico).');
                }
            }
            console.log('spawnSpecialItem() chiamata');
        }

        // Check collision between asteroid and cart
        function checkCollision(item) {
            console.log('Verifica collisione:', {
                shieldActive,
                itemType: item.isAsteroid ? 'Asteroid' : item.isFuel ? 'Fuel' : 'Other',
                itemPosition: { x: item.x, y: item.y }
            });

            const asteroidRadius = item.isSmall ? INTERSTELLAR_SMALL_ASTEROID_SIZE / 2.5 : INTERSTELLAR_ITEM_SIZE / 2.5;
            const asteroidCenterX = item.x + (item.isSmall ? INTERSTELLAR_SMALL_ASTEROID_SIZE : INTERSTELLAR_ITEM_SIZE) / 2;
            const asteroidCenterY = item.y + (item.isSmall ? INTERSTELLAR_SMALL_ASTEROID_SIZE : INTERSTELLAR_ITEM_SIZE) / 2;

            const cartHitboxOffsetX = INTERSTELLAR_CART_WIDTH * 0.1;
            const cartHitboxOffsetY = INTERSTELLAR_CART_HEIGHT * 0.2;
            const cartHitboxWidth = INTERSTELLAR_CART_WIDTH * 0.8;
            const cartHitboxHeight = INTERSTELLAR_CART_HEIGHT * 0.7;

            const cartHitboxLeft = cartX + cartHitboxOffsetX;
            const cartHitboxRight = cartHitboxLeft + cartHitboxWidth;
            const cartHitboxTop = cartY + cartHitboxOffsetY;
            const cartHitboxBottom = cartHitboxTop + cartHitboxHeight;

            const closestX = Math.max(cartHitboxLeft, Math.min(asteroidCenterX, cartHitboxRight));
            const closestY = Math.max(cartHitboxTop, Math.min(asteroidCenterY, cartHitboxBottom));

            const distanceX = asteroidCenterX - closestX;
            const distanceY = asteroidCenterY - closestY;
            const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

            if (distanceSquared <= (asteroidRadius * asteroidRadius)) {
                // Handle asteroid collision with active shield (NEW LOGIC)
                if ((item.isAsteroid || item.isDiagonalAsteroid) && shieldActive) {
                    console.log('Shield active: Asteroid collision converted to debris.');
                    debrisSound.currentTime = 0;
                    debrisSound.play().catch(e => console.error('Error playing debris sound:', e));

                    // Create a temporary debris effect at the item's location
                    debrisEffects.push({
                        x: item.x,
                        y: item.y,
                        image: debrisImage,
                        size: item.isSmall ? INTERSTELLAR_SMALL_ASTEROID_SIZE : INTERSTELLAR_ITEM_SIZE, // Use original asteroid size
                        expiration: performance.now() + 500 // Show debris for 0.5 seconds
                    });

                    // Remove the original asteroid by returning true, but don't trigger game over
                    return true;
                }

                // Handle asteroid collision without shield (ORIGINAL EXPLOSION LOGIC, now conditional)
                if ((item.isDiagonalAsteroid || item.isAsteroid) && !shieldActive) {
                    playExplosionEffect();
                    return true; // Collision detected, trigger game over sequence
                }

                // Handle fuel collection
                if (item.isFuel && !item.counted) {
                    console.log(`Collected fuel item: ${item.type.name}, value: ${item.type.fuelValue}`);
                    increaseFuel(item.type.fuelValue, item.type.name); // Pass the fuel type name
                    item.counted = true;

                    // Add fuel points to display
                    fuelPointsToDisplay.push({
                        x: item.x + INTERSTELLAR_ITEM_SIZE / 2,
                        y: item.y,
                        value: `+${item.type.fuelValue}`,
                        opacity: 1, // Start fully visible
                        expiration: performance.now() + 1000 // Fade out over 1 second
                    });

                    return true; // Fuel collected, remove item
                }

                // Handle special item collections
                else if (item.isGravityShifter) {
                    console.log('Gravity Shifter collected!');
                    gravityShifterAudio.currentTime = 0;
                    gravityShifterAudio.play().catch(e => console.error('Error playing Gravity Shifter sound:', e));

                    reverseGravity();

                    return true; // Item collected, remove it
                } else if (item.isAlienLarva) {
                    console.log('Alien Larva collected!');
                    alienLarvaAudio.currentTime = 0;
                    alienLarvaAudio.play().catch(e => console.error('Error playing Alien Larva sound:', e));

                    blurScreen();

                    return true; // Item collected, remove it
                } else if (item.isTelepathicCore) {
                    console.log('Telepathic Core collected!');
                    telepathicCoreAudio.currentTime = 0;
                    telepathicCoreAudio.play().catch(e => console.error('Error playing Telepathic Core sound:', e));

                    showSpawnTrajectories();

                    return true; // Item collected, remove it
                } else if (item.isProtectiveShield) {
                    console.log('Protective Shield collected!');
                    protectiveShieldAudio.currentTime = 0;
                    protectiveShieldAudio.play().catch(e => console.error('Error playing Protective Shield sound:', e));

                    activateShield();

                    return true; // Item collected, remove it
                } else if (item.isXenomorph) {
                    console.log('Xenomorph collected!');
                    xenomorphAudio.currentTime = 0;
                    xenomorphAudio.play().catch(e => console.error('Error playing Xenomorph sound:', e));

                    // Apply Xenomorph specific blur
                    console.log(`Applying Xenomorph blur effect: ${XENOMORPH_BLUR_INTENSITY} for ${XENOMORPH_BLUR_DURATION}ms`);
                    canvas.style.filter = `blur(${XENOMORPH_BLUR_INTENSITY})`;
                    setTimeout(() => {
                        console.log('Xenomorph blur effect removed!');
                        // Only remove the blur if it's still the Xenomorph blur.
                        // This prevents overriding another blur effect that might have started.
                        if (canvas.style.filter === `blur(${XENOMORPH_BLUR_INTENSITY})`) {
                           canvas.style.filter = 'none';
                        }
                    }, XENOMORPH_BLUR_DURATION);

                    // Apply speed reduction safely
                    if (cartSpeedModifier === 1) {
                        cartSpeedModifier = 0.25; // Reduce speed to 25% (era 0.5)

                        setTimeout(() => {
                            console.log('Cart speed restored!');
                            cartSpeedModifier = 1; // Restore original speed
                        }, XENOMORPH_DURATION); // Speed reduction duration
                    }

                    return true; // Item collected, remove it
                } else if (item.isLaserGun) {
                    console.log('Laser Gun collected!');
                    laserGunCollectAudio.currentTime = 0; // Riproduci dall'inizio
                    laserGunCollectAudio.play().catch(e => console.error('Error playing laser collect sound:', e)); // RIPRODUCI IL SUONO
                    hasLaserGun = true;
                    if (laserGunIconElement) laserGunIconElement.style.display = 'block'; // Show icon in HUD
                    return true; // Item collected
                }
            }

            return false; // No collision
        }

        // Increase fuel level when collecting a fuel item
        function increaseFuel(fuelValue, fuelTypeName) {
            // Aggiungiamo un log per debugging
            console.log(`[increaseFuel] Called. Type: "${fuelTypeName}", Value: ${fuelValue}, Current fuelLevel: ${fuelLevel}, FUEL_MAX_LEVEL: ${FUEL_MAX_LEVEL}`);
            
            if (fuelTypeName === 'Fusion Drop') {
                fuelLevel = FUEL_MAX_LEVEL; // Imposta il carburante al massimo definito (10)
                console.log(`[increaseFuel] Fusion Drop collected! fuelLevel set to MAX: ${fuelLevel}`);
            } else {
                fuelLevel = Math.min(fuelLevel + fuelValue, FUEL_MAX_LEVEL);
                console.log(`[increaseFuel] Other fuel type. New fuelLevel: ${fuelLevel}`);
            }

            updateFuelDisplay(); // Aggiorna la barra del carburante

            // Play recharge sound with cooldown
            if (!rechargeSoundCooldown) {
                try {
                    rechargeSound.pause(); // Pause the sound if it's already playing
                    rechargeSound.currentTime = 0; // Reset sound to the beginning
                    rechargeSound.play().then(() => {
                        console.log("Recharge sound played successfully");
                    }).catch(e => {
                        console.error("Error playing recharge sound:", e);
                    });
                } catch (e) {
                    console.error("Error resetting or playing recharge sound:", e);
                }

                rechargeSoundCooldown = true;
                setTimeout(() => {
                    rechargeSoundCooldown = false;
                }, 200); // 200ms cooldown
            }
        }
        
        // Update the reverseGravity function to toggle the gravity multiplier
        function reverseGravity() {
            if (gravityReversed) return; // Prevent overlapping effects

            console.log('Gravity reversed!');
            gravityReversed = true;
            gravityMultiplier = -1; // Reverse gravity

            setTimeout(() => {
                console.log('Gravity restored!');
                gravityMultiplier = 1; // Restore normal gravity
                gravityReversed = false;
            }, GRAVITY_SHIFTER_DURATION);
        }

        // Modify blurScreen to ensure it does not disrupt the game loop
        function blurScreen() {
            console.log('Screen blurred!');
            canvas.style.filter = 'blur(5px)'; // Apply blur effect

            // Ensure the game loop continues running
            const blurTimeout = setTimeout(() => {
                console.log('Screen blur removed!');
                canvas.style.filter = 'none'; // Remove blur effect
                clearTimeout(blurTimeout); // Clear the timeout to avoid memory leaks
            }, ALIEN_LARVA_DURATION);
        }

        // Update the showSpawnTrajectories function to store trajectory data
        function showSpawnTrajectories() {
            console.log('Showing spawn trajectories for the next 3 items!');

            // Clear any existing trajectories
            spawnTrajectories = [];

            // Generate positions for the next 3 items
            for (let i = 0; i < 3; i++) {
                const x = Math.random() * (canvas.width - INTERSTELLAR_ITEM_SIZE);
                const y = -INTERSTELLAR_ITEM_SIZE;

                // Store the position and expiration time
                spawnTrajectories.push({
                    x,
                    y,
                    expiration: performance.now() + TELEPATHIC_CORE_DURATION // Expire after 3 seconds
                });
            }
        }

        // Implement the shield activation logic
        function activateShield() {
            console.log('Shield activated!');
            shieldActive = true;

            // Aggiungi log per monitorare lo stato dello scudo
            console.log('Shield state changed:', shieldActive);

            // Visual indicator for the shield (optional) - Changed to blue and made thicker
            canvas.style.boxShadow = '0 0 30px 15px rgba(0, 0, 255, 0.8)'; // Increased blur and spread radius

            setTimeout(() => {
                console.log('Shield deactivated!');
                
                // Aggiungi un controllo per evitare che lo scudo venga disattivato prematuramente
                if (!shieldActive) {
                    console.warn('Tentativo di disattivare lo scudo quando non è attivo.');
                    return;
                }

                shieldActive = false;

                // Aggiungi log per monitorare lo stato dello scudo
                console.log('Shield state changed:', shieldActive);

                // Remove visual indicator
                canvas.style.boxShadow = 'none';
            }, PROTECTIVE_SHIELD_DURATION);
        }

        function fireLaser() {
            if (!hasLaserGun || !gameRunning) return;

            console.log("Firing Laser!");
            hasLaserGun = false;
            if (laserGunIconElement) laserGunIconElement.style.display = 'none'; // Hide icon

            laserAudio.currentTime = 0;
            laserAudio.play().catch(e => console.error('Error playing laser sound:', e));

            // Red flash effect
            const flashOverlay = document.createElement('div');
            flashOverlay.style.position = 'absolute';
            
            // Posiziona flashOverlay esattamente sopra il canvas
            // canvas.offsetTop e canvas.offsetLeft danno la posizione del canvas
            // relativa al suo offsetParent (interstellarScreen in questo caso, dato che ha position: relative)
            flashOverlay.style.top = canvas.offsetTop + 'px';
            flashOverlay.style.left = canvas.offsetLeft + 'px';
            flashOverlay.style.width = canvas.width + 'px';
            flashOverlay.style.height = canvas.height + 'px';
            flashOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
            flashOverlay.style.zIndex = '1000'; // Ensure it's on top
            flashOverlay.style.pointerEvents = 'none'; // Allow clicks through
            
            const interstellarScreen = document.getElementById('interstellarScreen');
            if (interstellarScreen) {
                interstellarScreen.appendChild(flashOverlay);
            } else {
                console.error("interstellarScreen element not found for flash overlay");
                // Fallback: se interstellarScreen non è trovato, questo posizionamento potrebbe non essere corretto.
                // Considera di aggiungere flashOverlay a interstellarContainer o direttamente al body
                // se interstellarScreen non è affidabile, ma questo potrebbe richiedere aggiustamenti di posizionamento.
                // Per ora, lo lascio così, ma è un punto da tenere d'occhio se si verificano problemi.
                document.body.appendChild(flashOverlay); // Fallback a document.body se interstellarScreen non è trovato
            }


            setTimeout(() => {
                flashOverlay.remove();
            }, LASER_FLASH_DURATION);

            // Mark items to be affected by laser
            gameItems.forEach(item => {
                if (item.isAsteroid || item.isDiagonalAsteroid) {
                    item.isBeingLasered = true;
                    item.laserEffectExpiry = performance.now() + LASER_ASTEROID_EFFECT_DURATION;
                } else if (item.isXenomorph || item.isAlienLarva) {
                    item.isBeingSplat = true; // NUOVO STATO PER XENO/LARVA
                    item.splatEffectExpiry = performance.now() + SPLAT_EFFECT_DURATION; // NUOVA SCADENZA
                }
            });
        }

        // Update items and check collisions
        function updateItems() {
            for (let i = gameItems.length - 1; i >= 0; i--) {
                const item = gameItems[i];

                // Store previous y position for collision detection
                item.previousY = item.y;

                // Calculate speed based on item type and gravity
                let currentSpeed = INTERSTELLAR_ITEM_SPEED;
                if (item.isSmall) {
                    currentSpeed = INTERSTELLAR_SMALL_ASTEROID_SPEED;
                } else if (item.isDiagonalAsteroid) {
                    currentSpeed = DIAGONAL_ASTEROID_SPEED;
                } else if (item.isAlienLarva) {
                    currentSpeed = ALIEN_LARVA_SPEED;
                } else if (item.isXenomorph) {
                    currentSpeed = XENOMORPH_SPEED;
                }

                // DEBUG: Log position before update
                console.log(`[Update Start] Item ${i} (${item.isAsteroid ? 'Asteroid' : item.isFuel ? 'Fuel' : 'Other'}) - y: ${item.y.toFixed(2)}`);

                // Update position based on gravity and direction
                if (item.isDiagonalAsteroid) {
                    item.x += item.directionX * currentSpeed * deltaTime * (1 / INTERSTELLAR_TARGET_FPS);
                    // Applica il gravityMultiplier anche alla componente y del movimento degli asteroidi diagonali
                    item.y += item.directionY * currentSpeed * deltaTime * (1 / INTERSTELLAR_TARGET_FPS) * gravityMultiplier;
                } else {
                    // Apply gravity multiplier for vertical movement
                    item.y += currentSpeed * gravityMultiplier * deltaTime * (1 / INTERSTELLAR_TARGET_FPS);
                }

                // DEBUG: Log position after update
                console.log(`[Update End]   Item ${i} - new y: ${item.y.toFixed(2)}`);

                // Check collision with cart
                if (!isExploding && checkCollision(item)) {
                    // Collision logic is handled within checkCollision
                    // If it returns true and it's an asteroid/diagonal asteroid without shield, explosion starts
                    // If it's fuel or special item, effect is applied
                    // If it's asteroid with shield, debris effect is played
                    
                    // If the item was collected (fuel/special) or destroyed (asteroid+shield), remove it
                    if (item.isFuel || item.isGravityShifter || item.isAlienLarva || item.isTelepathicCore || item.isProtectiveShield || item.isXenomorph || ((item.isAsteroid || item.isDiagonalAsteroid) && shieldActive) || item.isLaserGun) {
                        gameItems.splice(i, 1);
                        console.log(`[Collision/Collection] Item ${i} removed.`);
                        continue; // Skip off-screen check for this item
                    }
                }

                // Remove items that go off-screen
                // Use a buffer (e.g., item size) to ensure they are fully off-screen
                const offScreenBuffer = INTERSTELLAR_ITEM_SIZE * 2; // Double buffer for safety
                if (item.y > canvas.height + offScreenBuffer || item.y < -offScreenBuffer || item.x < -offScreenBuffer || item.x > canvas.width + offScreenBuffer) {
                    // DEBUG: Log removal
                    console.log(`[Off-Screen] Item ${i} removed at y: ${item.y.toFixed(2)}`);
                    gameItems.splice(i, 1);
                }
            }
            // After updating positions and checking collisions, handle lasered items
            for (let i = gameItems.length - 1; i >= 0; i--) {
                const item = gameItems[i];
                if ((item.isBeingLasered && performance.now() > item.laserEffectExpiry) ||
                    (item.isBeingSplat && performance.now() > item.splatEffectExpiry)) { // AGGIUNTA CONDIZIONE PER SPLAT
                    gameItems.splice(i, 1); // Remove lasered/splatted item
                    console.log(`[Laser/Splat] Item ${i} removed after effect.`);
                    // Add points or other effects for destroying asteroid with laser (optional)
                }
            }
        }

        // Play explosion effect
        function playExplosionEffect() {
            console.log("Collision detected, playing explosion effect");
            // Play the explosion sound
            explosionSound.play().catch(e => console.error("Error playing explosion sound:", e));
            
            // Set explosion state
            isExploding = true;
            explosionTimer = 0;
            
            // Set game over reason
            gameOverReason = REASON_COLLISION;
            
            // End the game after the explosion animation
            setTimeout(() => {
                endInterstellarGame();
            }, EXPLOSION_DURATION);
        }
        
        // Update game over screen content based on reason
        function updateGameOverContent() {
            console.log("Updating game over content, reason:", gameOverReason, "fuel level:", fuelLevel);

            // Use the correct IDs for the Interstellar game over screen elements
            const titleElement = document.getElementById('interstellarGameOverTitle');
            const messageElement = document.getElementById('interstellarGameOverMessage');
            const subMessageElement = document.getElementById('interstellarGameOverSubMessage');
            const imageContainer = document.getElementById('interstellarGameOverImage'); // Corrected ID

            // Ensure elements exist before trying to modify them
            if (!titleElement || !messageElement || !subMessageElement || !imageContainer) {
                console.error("Game Over screen elements not found!");
                return;
            }

            // Clear previous content
            imageContainer.innerHTML = '';
            imageContainer.style.display = 'none'; // Hide image container by default

            if (gameOverReason === REASON_TIME_UP && fuelLevel > 0) {
                // Game won - Reached destination
                titleElement.textContent = 'Destination Reached!'; // Or 'Planet Z-E.R.O. Contact'?
                // CORRETTO: Messaggio di vittoria Z-E.R.O.
                messageElement.textContent = 'Planet Z-E.R.O. salutes you. You’ve achieved the impossible — guilt-free groceries.';
                subMessageElement.textContent = 'In my world, you’d be royalty. In yours… you’re just ahead of your time.';
                imageContainer.style.display = 'block';
                // CORRETTO: Immagine di vittoria Z-E.R.O.
                const img = zeroImage.cloneNode(); // Use the preloaded zeroImage
                img.alt = "Planet Z-E.R.O."; // Alt text più descrittivo
                imageContainer.appendChild(img);
                // Play welcome sound
                if (welcomeAudio) { // Check if audio element exists
                    welcomeAudio.currentTime = 0;
                    welcomeAudio.play().catch(e => console.error("Error playing welcome sound:", e));
                }
            } else {
                // Game lost
                imageContainer.style.display = 'block';
                let imgToAppend = null;
                if (gameOverReason === REASON_COLLISION) {
                    titleElement.textContent = 'Kaboom!';
                    messageElement.textContent = 'Your eco-cart is space dust.';
                    subMessageElement.textContent = 'Better fuel up and dodge harder next time!';
                    imgToAppend = explosionImage.cloneNode(); // Show explosion image
                } else if (gameOverReason === REASON_FUEL_DEPLETED) {
                    titleElement.textContent = 'Fuel Depleted';
                    messageElement.textContent = 'Your cart floats endlessly between stars';
                    subMessageElement.textContent = '— a silent tribute to unsustainable logistics.';
                    imgToAppend = lostImage.cloneNode(); // Show lost image
                } else { // Default Game Over (e.g., time up but no fuel)
                    titleElement.textContent = 'Mission Failed';
                    messageElement.textContent = 'You didn\'t reach the destination in time.';
                    subMessageElement.textContent = 'The cosmos waits for no one.';
                    // Consider if zeroImage is appropriate here or another default fail image
                    imgToAppend = lostImage.cloneNode(); // Using lostImage as default fail for now
                }
                if (imgToAppend) {
                    imageContainer.appendChild(imgToAppend);
                }
                 // Play game over sound for all loss conditions
                 if (gameOverSound) { // Check if audio element exists
                    gameOverSound.currentTime = 0;
                    gameOverSound.play().catch(e => console.error("Error playing game over sound:", e));
                 }
            }
        }

        // End the interstellar game
        function endInterstellarGame() {
            // Prevent multiple calls if the game is already ended
            if (!gameRunning) {
                console.log("Game already ended, skipping endInterstellarGame logic.");
                return;
            }
            
            console.log("Ending interstellar game, reason:", gameOverReason);
            gameRunning = false;

            // Remove shield visual effect immediately
            canvas.style.boxShadow = 'none';
            
            //
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            
            // Clear all intervals
            if (asteroidSpawnInterval) {
                clearInterval(asteroidSpawnInterval);
                asteroidSpawnInterval = null;
            }

            if (fuelSpawnInterval) {
                clearInterval(fuelSpawnInterval);
                fuelSpawnInterval = null;
            }

            if (specialItemSpawnInterval) {
                clearInterval(specialItemSpawnInterval);
                specialItemSpawnInterval = null;
            }
            
            if (spawnRateAdjustInterval) {
                clearInterval(spawnRateAdjustInterval);
                spawnRateAdjustInterval = null;
            }
            
            // Stop the interstellar music
            const interstellarMusic = document.getElementById('interstellarMusic');
            interstellarMusic.pause();
            interstellarMusic.currentTime = 0;

            // Stop the propulsion sound
            if (propulsionSound) {
                propulsionSound.pause();
                propulsionSound.currentTime = 0;
            }
            
            // Play game over sound or welcome sound based on the reason
            if (gameOverReason === REASON_TIME_UP && fuelLevel > 0) {
                console.log("Victory! Playing welcome sound.");
                welcomeAudio.currentTime = 0;
                welcomeAudio.play().catch(e => console.error("Error playing welcome sound:", e));
            } else {
                gameOverSound.currentTime = 0;
                gameOverSound.play().catch(e => console.error("Error playing game over sound:", e));
            }
            
            // Update the game over content based on the reason
            updateGameOverContent();
            
            // Hide the game screen
            const interstellarScreen = document.getElementById('interstellarScreen');
            if (interstellarScreen) {
                interstellarScreen.style.display = 'none';
            }

            // Show the Game Over screen
            document.getElementById('interstellarGameOver').style.display = 'flex';
            
            // Add event listeners for the buttons
            document.getElementById('interstellarRestartButton').addEventListener('click', restartInterstellarGame);
            document.getElementById('interstellarBackToMenuButton').addEventListener('click', exitInterstellarMode);
        }
        
        // Restart the interstellar game
        function restartInterstellarGame() {
            console.log("Restarting interstellar game");

            // Stop any ongoing game over or welcome sound
            gameOverSound.pause();
            gameOverSound.currentTime = 0;
            welcomeAudio.pause(); // Also stop welcome sound if it was playing
            welcomeAudio.currentTime = 0;
            
            // Cancel any existing animation frame
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            
            // Clear existing intervals
            if (asteroidSpawnInterval) {
                clearInterval(asteroidSpawnInterval);
                asteroidSpawnInterval = null;
            }

            if (fuelSpawnInterval) {
                clearInterval(fuelSpawnInterval);
                fuelSpawnInterval = null;
            }

            if (specialItemSpawnInterval) {
                clearInterval(specialItemSpawnInterval);
                specialItemSpawnInterval = null;
            }
            
            if (spawnRateAdjustInterval) {
                clearInterval(spawnRateAdjustInterval);
                spawnRateAdjustInterval = null;
            }
            
            // Hide the Game Over screen
            document.getElementById('interstellarGameOver').style.display = 'none';

            // Show the game screen
            const interstellarScreen = document.getElementById('interstellarScreen');
            if (interstellarScreen) {
                interstellarScreen.style.display = 'flex';
            }

            // Reset shield visual effect
            canvas.style.boxShadow = 'none';
            // Reset any blur effect on the canvas
            canvas.style.filter = 'none'; // <--- AGGIUNTO: Rimuove l'effetto blur
            
            // Reset game variables
            gameRunning = true;
            gameItems = [];
            cartX = canvas.width / 2 - INTERSTELLAR_CART_WIDTH / 2;
            lastFrameTime = 0;
            deltaTime = 0;
            isExploding = false;
            explosionTimer = 0;
            
            // Reset fuel and timer variables
            fuelLevel = FUEL_MAX_LEVEL;
            gameTimeLeft = INTERSTELLAR_GAME_DURATION;
            fuelDecreaseTimer = 0;
            
            // Reset game over reason
            gameOverReason = null;

            // Reset gravity reversal state
            gravityReversed = false;
            gravityMultiplier = 1; // Restore normal gravity

            // Reset shield state
            shieldActive = false;

            // Reset fuel points display
            fuelPointsToDisplay = [];

            // Reset debris effects display
            debrisEffects = [];

            // Reset the 20-second delay
            gameStartTime = performance.now();

            // Reset laser gun status
            hasLaserGun = false;
            if (laserGunIconElement) laserGunIconElement.style.display = 'none';
            isFirstSpecialItemSpawnThisGame = true; // RESETTA LA VARIABILE PER LA NUOVA PARTITA

            // Update displays
            updateFuelDisplay();
            updateTimerDisplay();
            
            // Stop the propulsion sound
            if (propulsionSound) {
                propulsionSound.pause();
                propulsionSound.currentTime = 0;
            }
            
            // Restart the interstellar music
            const interstellarMusic = document.getElementById('interstellarMusic');
            interstellarMusic.play().catch(e => console.error("Error playing interstellar music:", e));
            
            // Start spawning intervals
            asteroidSpawnInterval = setInterval(spawnAsteroid, asteroidSpawnRate);
            fuelSpawnInterval = setInterval(spawnFuelItem, fuelSpawnRate);
            specialItemSpawnInterval = setInterval(spawnSpecialItem, 10000); // Restart special item spawning
            console.log('Intervallo specialItemSpawnInterval avviato ogni 10 secondi');
            spawnRateAdjustInterval = setInterval(adjustSpawnRates, 30000);
            
            // Restart the game loop
            animationFrameId = requestAnimationFrame(gameLoop);
        }
        
        // Make the restart function available
        restartInterstellarGameFunction = restartInterstellarGame;

        // Update the drawGame function to render spawn trajectories
        function drawGame() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw background
            if (backgroundImage && backgroundImage.complete) {
                ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
            } else {
                ctx.fillStyle = '#000033';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // Draw cart or explosion based on state
            if (isExploding) {
                ctx.drawImage(explosionImage, cartX, cartY, INTERSTELLAR_CART_WIDTH, INTERSTELLAR_CART_HEIGHT);
            } else {
                ctx.drawImage(cartImage, cartX, cartY, INTERSTELLAR_CART_WIDTH, INTERSTELLAR_CART_HEIGHT);
            }

            // Draw the planet image if time left is <= 1.5 seconds
            if (gameTimeLeft <= 1.5) {
                const planetWidth = 200; // Set the width of the planet image
                const planetHeight = 200; // Set the height of the planet image
                const planetX = (canvas.width - planetWidth) / 2; // Center horizontally
                const planetY = (canvas.height - planetHeight) / 2; // Center vertically
                ctx.drawImage(planetImage, planetX, planetY, planetWidth, planetHeight);
            }

            // Draw spawn trajectories
            const currentTime = performance.now();
            spawnTrajectories = spawnTrajectories.filter(trajectory => trajectory.expiration > currentTime); // Remove expired trajectories
            spawnTrajectories.forEach(trajectory => {
                ctx.beginPath();
                ctx.arc(trajectory.x + INTERSTELLAR_ITEM_SIZE / 2, canvas.height / 2, 10, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.closePath();
            });

            // Draw fuel points
            fuelPointsToDisplay = fuelPointsToDisplay.filter(point => point.expiration > currentTime); // Remove expired points
            fuelPointsToDisplay.forEach(point => {
                const timeLeft = point.expiration - currentTime;
                point.opacity = timeLeft / 1000; // Fade out over 1 second

                ctx.font = 'bold 22px Arial'; // Make the font bolder and slightly larger
                ctx.fillStyle = `rgba(0, 255, 0, ${point.opacity})`; // Green color with fading effect
                ctx.textAlign = 'center';
                ctx.fillText(point.value, point.x, point.y);
            });

            // Draw debris effects
            const currentTimeForDebris = performance.now(); // Use a distinct name if currentTime is already defined above
            debrisEffects = debrisEffects.filter(effect => effect.expiration > currentTimeForDebris); // Remove expired effects
            debrisEffects.forEach(effect => {
                const timeRemaining = effect.expiration - currentTimeForDebris;
                const opacity = Math.max(0, timeRemaining / 500); // Fade out effect over 0.5 seconds
                ctx.globalAlpha = opacity;
                // Draw debris using its specific image and stored size
                ctx.drawImage(effect.image, effect.x, effect.y, effect.size, effect.size);
                ctx.globalAlpha = 1.0; // Reset global alpha
            });

            // Draw items
            gameItems.forEach((item, index) => {
                let itemImageToDraw = null;
                let itemSizeToDraw = INTERSTELLAR_ITEM_SIZE;

                if (item.isAsteroid || item.isDiagonalAsteroid) {
                    if (item.isBeingLasered && laserEffectImage.complete) {
                        itemImageToDraw = laserEffectImage;
                    } else {
                        itemImageToDraw = item.isSmall ? smallAsteroidImage : (item.isDiagonalAsteroid ? diagonalAsteroidImage : asteroidImage);
                    }
                    itemSizeToDraw = item.isSmall ? INTERSTELLAR_SMALL_ASTEROID_SIZE : INTERSTELLAR_ITEM_SIZE;
                } else if (item.isXenomorph || item.isAlienLarva) { // GESTIONE XENO E LARVA
                    if (item.isBeingSplat && splatImage.complete) { // MOSTRA SPLAT SE ATTIVO
                        itemImageToDraw = splatImage;
                    } else if (item.isXenomorph && xenomorphImage.complete) {
                        itemImageToDraw = xenomorphImage;
                    } else if (item.isAlienLarva && alienLarvaImage.complete) {
                        itemImageToDraw = alienLarvaImage;
                    }
                } else if (item.isFuel) {
                    itemImageToDraw = fuelImages[item.type.name];
                } else if (item.isGravityShifter) {
                    itemImageToDraw = gravityShifterImage;
                } else if (item.isTelepathicCore) {
                    itemImageToDraw = telepathicCoreImage;
                } else if (item.isProtectiveShield) {
                    itemImageToDraw = protectiveShieldImage;
                } else if (item.isLaserGun) {
                    itemImageToDraw = laserGunImage;
                }

                if (itemImageToDraw && itemImageToDraw.complete) {
                    ctx.drawImage(itemImageToDraw, item.x, item.y, itemSizeToDraw, itemSizeToDraw);
                } else {
                    // Fallback drawing if image not loaded (optional)
                    ctx.fillStyle = 'red';
                    ctx.fillRect(item.x, item.y, itemSizeToDraw, itemSizeToDraw);
                }
            });
        }

        // Adjust spawn rates dynamically
        function adjustSpawnRates() {
            if (asteroidSpawnRate > 700) { // Ensure the minimum spawn rate is slightly higher
                asteroidSpawnRate = Math.max(700, asteroidSpawnRate - 500); // Reduce by 500 ms
                console.log(`Adjusted asteroid spawn rate: ${asteroidSpawnRate}ms`);
            }

            // Restart the spawn interval with the new rate
            clearInterval(asteroidSpawnInterval);
            asteroidSpawnInterval = setInterval(spawnAsteroid, asteroidSpawnRate);
        }

        // Game loop
        function gameLoop(timestamp) {
            if (!gameRunning) return; // Exit if game is not running

            // Calculate delta time
            if (lastFrameTime) {
                // Normalize delta time based on target FPS
                deltaTime = (timestamp - lastFrameTime) / (1000 / INTERSTELLAR_TARGET_FPS);
                // Clamp delta time to prevent large jumps (e.g., when tab is inactive)
                deltaTime = Math.min(deltaTime, 2); 
            }
            lastFrameTime = timestamp;

            // Update game time left
            // Use deltaTime normalized to seconds (deltaTime * (1 / INTERSTELLAR_TARGET_FPS))
            gameTimeLeft -= deltaTime * (1 / INTERSTELLAR_TARGET_FPS); 
            if (gameTimeLeft <= 0 && gameRunning) { // Check gameRunning flag
                gameTimeLeft = 0; // Ensure timer doesn't go negative
                gameOverReason = REASON_TIME_UP;
                endInterstellarGame();
                return; // Exit loop early as game ended
            }

            // Update fuel decrease timer
            // Use deltaTime normalized to milliseconds (deltaTime * (1000 / INTERSTELLAR_TARGET_FPS))
            fuelDecreaseTimer += deltaTime * (1000 / INTERSTELLAR_TARGET_FPS); 
            if (fuelDecreaseTimer >= FUEL_DECREASE_INTERVAL) {
                decreaseFuel();
                updateFuelDisplay(); // Update display immediately after decrease
                fuelDecreaseTimer = 0; // Reset timer
                
                // *** ADDED FUEL DEPLETION CHECK HERE ***
                if (fuelLevel <= 0 && gameRunning) { // Check gameRunning flag
                    console.log("Fuel depleted, ending game.");
                    gameOverReason = REASON_FUEL_DEPLETED;
                    endInterstellarGame();
                    return; // Exit loop early as game ended
                }
            }

            // Update cart position based on key presses
            let isMoving = false; // Track if cart is moving this frame
            if (!isExploding) {
                const currentCartSpeed = originalCartSpeed * cartSpeedModifier; // Use the modifier
                if (keysPressed['ArrowLeft'] || keysPressed['a']) {
                    cartX -= currentCartSpeed * deltaTime * (1 / INTERSTELLAR_TARGET_FPS); // Normalize speed with deltaTime
                    isMoving = true;
                }
                if (keysPressed['ArrowRight'] || keysPressed['d']) {
                    cartX += currentCartSpeed * deltaTime * (1 / INTERSTELLAR_TARGET_FPS); // Normalize speed with deltaTime
                    isMoving = true;
                }
                // Keep cart within bounds
                cartX = Math.max(0, Math.min(canvas.width - INTERSTELLAR_CART_WIDTH, cartX));
            }

            // Handle propulsion sound based on old logic (play every frame if moving)
            if (isMoving) {
                // Check if ready to play (avoids errors if called too rapidly before loaded)
                if (propulsionSound.readyState >= 2) { // HAVE_CURRENT_DATA or more
                   propulsionSound.currentTime = 0; // Reset sound to beginning
                   propulsionSound.play().catch(e => console.error("Error playing propulsion sound:", e));
                }
            }

            // Update timer display
            updateTimerDisplay();

            // Update items
            updateItems();

            // Draw the game
            drawGame();

            // Request next frame
            animationFrameId = requestAnimationFrame(gameLoop);
        }

        // Imposta il gioco come in esecuzione
        gameRunning = true;

        // Aggiorna il display iniziale
        updateFuelDisplay();
        updateTimerDisplay();

        // Spawn initial fuel and asteroid
        spawnFuelItem(); // Spawn only one fuel item
        spawnAsteroid();

        // Rimuovi il ritardo di 5 secondi per aumentare subito il tasso di spawn
        asteroidSpawnRate = Math.max(500, asteroidSpawnRate - 500); // Riduci il tasso di spawn
        clearInterval(asteroidSpawnInterval);
        asteroidSpawnInterval = setInterval(spawnAsteroid, asteroidSpawnRate);

        // Registra il tempo di inizio del gioco
        gameStartTime = performance.now();

        // Avvia il loop di gioco
        animationFrameId = requestAnimationFrame(gameLoop);

        // Avvia gli intervalli per lo spawn e l'aggiustamento della frequenza
        asteroidSpawnInterval = setInterval(spawnAsteroid, asteroidSpawnRate);
        fuelSpawnInterval = setInterval(spawnFuelItem, fuelSpawnRate);
        specialItemSpawnInterval = setInterval(spawnSpecialItem, 10000); // Spawn special items every 10 seconds
        console.log('Intervallo specialItemSpawnInterval avviato ogni 10 secondi');
        spawnRateAdjustInterval = setInterval(adjustSpawnRates, 30000);
    };

})();
