// ... existing global variables ...

// --- NUOVO: Suono per i click sui pulsanti ---
const keyboardSound = new Audio('assets/audio/keyboard.wav');
keyboardSound.volume = 0.8; // Regola il volume se necessario

// NUOVO: Suono per Game Over
const gameOverSound = document.getElementById('gameOverSound');
if (gameOverSound) {
    gameOverSound.volume = 0.5; // Imposta il volume desiderato
}
// --- FINE NUOVO ---

// Funzione helper per riprodurre il suono dei tasti
window.playKeyboardSound = function() { // Aggiunto a window per accessibilità globale
    console.log("playKeyboardSound called. ReadyState:", keyboardSound.readyState); // <-- DEBUG
    if (keyboardSound.readyState >= 2) { // Assicura che sia caricato (HTMLMediaElement.HAVE_CURRENT_DATA o superiore)
        console.log("ReadyState >= 2, attempting to play..."); // <-- DEBUG
        keyboardSound.currentTime = 0; // Resetta per riprodurre dall'inizio
        keyboardSound.play().then(() => {
            console.log("Playback started successfully."); // <-- DEBUG
        }).catch(e => {
            console.error("Error playing keyboard sound:", e); // <-- DEBUG
        });
    } else {
        console.warn("Keyboard sound not ready yet. State:", keyboardSound.readyState); // <-- DEBUG
        // Tentativo di caricamento esplicito se non pronto (opzionale)
        // keyboardSound.load();
    }
}
// --- FINE NUOVO ---


// --- FUNZIONI SPOSTATE DA MENU.JS ---

// Funzione per generare la descrizione dell'effetto
function getItemEffect(item) {
    if (!item) return ''; // Aggiunto controllo null
    if (item.points && typeof item.points === 'number') {
        return `${item.points > 0 ? '+' : ''}${item.points} pts`;
    } else if (item.addTime) {
        return `+${item.addTime} sec`;
    } else if (item.setScore) {
        return `Score = ${item.setScore}`;
    } else if (item.slowItems) {
        return 'Slow items (5s)';
    } else if (item.fastItems) {
        return 'Fast items (5s)';
    } else if (typeof janitorItem !== 'undefined' && item.name === janitorItem.name) { // Aggiunto controllo undefined
        return 'Slow cart (5s)';
    } else if (typeof doubleDoubleItem !== 'undefined' && item.name === doubleDoubleItem.name) { // Aggiunto controllo undefined
        return '2x Points & Speed (5s)';
    } else if (item.points && typeof item.points === 'string') {
        // Per casi come 'Double points & speed (5s)' già definiti
        return item.points;
    }
    return 'Special Effect'; // Fallback
}

// Funzione per creare la modale della Shopping List (leggermente modificata per usare ID esistente se possibile)
function createShoppingListModal() {
    console.log('Creating or updating shopping list modal...');
    // Rimuovi modal esistente se presente per ricrearla (assicura aggiornamento)
    const existingModal = document.getElementById('shoppingListModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Raccogli tutti gli item da game.js (assicurati che siano accessibili globalmente o passati come argomenti)
    // Assicurati che queste variabili siano definite PRIMA di chiamare createShoppingListModal
    const allItems = {
        green: typeof greenItems !== 'undefined' ? greenItems : [],
        nonGreen: typeof nonGreenItems !== 'undefined' ? nonGreenItems : [],
        positiveBehaviours: typeof positiveBehaviors !== 'undefined' ? positiveBehaviors : [], // Corretto nome variabile
        negativeBehaviours: typeof negativeBehaviors !== 'undefined' ? negativeBehaviors : [], // Corretto nome variabile
        special: [
            typeof bonusItem !== 'undefined' ? bonusItem : null,
            typeof malusItem !== 'undefined' ? malusItem : null,
            typeof timePlusItem !== 'undefined' ? timePlusItem : null,
            typeof greenwashingItem !== 'undefined' ? greenwashingItem : null,
            typeof climateChangeItem !== 'undefined' ? climateChangeItem : null, // Assumendo esista
            typeof janitorItem !== 'undefined' ? janitorItem : null,
            typeof doubleDoubleItem !== 'undefined' ? doubleDoubleItem : null,
        ].filter(item => item !== null),
        easterEggs: [
            typeof gretaItem !== 'undefined' ? gretaItem : null,
            typeof trumpItem !== 'undefined' ? trumpItem : null,
            typeof grandmaItem !== 'undefined' ? grandmaItem : null,
            typeof bearItem !== 'undefined' ? bearItem : null,
            // Aggiungi altri easter egg se necessario
        ].filter(item => item !== null),
    };

     // Verifica se ci sono dati da mostrare
    let hasData = false;
    for (const category in allItems) {
        if (allItems[category].length > 0) {
            hasData = true;
            break;
        }
    }

    if (!hasData) {
        console.warn("Nessun dato item trovato per la Shopping List. Assicurati che game.js sia caricato e le variabili (greenItems, etc.) siano globali e popolate.");
        // Potresti mostrare un messaggio all'utente o non creare la modale
        // alert("Item data is not available yet.");
        // return; // Non crea la modale se non ci sono dati
    }


    // Crea overlay/sfondo modal
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'shoppingListModal'; // ID fisso per riferimento
    modalOverlay.classList.add('modal'); // Usa classe generica 'modal'
    modalOverlay.style.display = 'flex'; // Mostra subito

    // Crea contenitore modal
    const modalContainer = document.createElement('div');
    // Applica stili simili a quelli esistenti se necessario, es:
    modalContainer.classList.add('modal-content'); // Usa classe generica
    modalContainer.style.maxWidth = '600px'; // Esempio stile

    // Crea pulsante chiusura
    const closeButton = document.createElement('span'); // Usa span come in altre modali
    closeButton.classList.add('close-button');
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => {
        playKeyboardSound();
        modalOverlay.style.display = 'none'; // Nasconde invece di rimuovere
    };
    modalContainer.appendChild(closeButton);

    // Crea titolo modal
    const modalTitle = document.createElement('h2');
    // modalTitle.classList.add('shopping-list-title'); // Classe opzionale
    modalTitle.textContent = 'Game Items & Effects';
    modalContainer.appendChild(modalTitle);

    // Crea contenuto scrollabile
    const modalContent = document.createElement('div');
    modalContent.classList.add('facts-container'); // <<< AGGIUNTA CLASSE CORRETTA

     if (!hasData) {
        const noDataMessage = document.createElement('p');
        noDataMessage.textContent = "Item data is loading or not available.";
        noDataMessage.style.textAlign = 'center';
        modalContent.appendChild(noDataMessage);
    } else {
        // Mappa titoli sezioni
        const sectionTitles = {
            green: "Green Items",
            nonGreen: "Non-Green Items",
            positiveBehaviours: "Positive Behaviours",
            negativeBehaviours: "Negative Behaviours",
            special: "Special Items",
            easterEggs: "Easter Eggs"
        };

        // Popola con le sezioni e gli item
        for (const category in allItems) {
            const items = allItems[category];
            if (items.length > 0) {
                const sectionTitle = document.createElement('h3');
                sectionTitle.textContent = sectionTitles[category] || category;
                modalContent.appendChild(sectionTitle);

                const list = document.createElement('ul');
                list.style.listStyle = 'none'; // Rimuovi pallini
                list.style.padding = '0';

                items.forEach(item => {
                    if (!item || !item.name || !item.image) {
                        console.warn('Item non valido nella shopping list:', item);
                        return;
                    }

                    const listItem = document.createElement('li');
                    listItem.classList.add('fact-item'); // <<< ASSICURATA CLASSE 'fact-item'

                    // Immagine
                    const img = document.createElement('img');
                    img.src = `assets/images/${item.image}`;
                    img.alt = item.name;
                    img.style.width = '30px'; // Dimensione immagine
                    img.style.height = '30px';
                    img.style.marginRight = '10px';
                    img.onerror = () => { img.style.display = 'none'; }; // Nasconde se l'immagine non carica

                    // Nome
                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = item.name;
                    nameSpan.style.flexGrow = '1'; // Occupa spazio disponibile
                    nameSpan.style.marginRight = '10px';
                    nameSpan.style.color = '#00ffcc'; // Imposta il colore del testo a verde
                    nameSpan.style.textAlign = 'left'; // AGGIUNTO: Allinea il testo a sinistra

                    // Effetto
                    const effectSpan = document.createElement('span');
                    effectSpan.textContent = getItemEffect(item);
                    effectSpan.style.fontWeight = 'bold'; // Evidenzia effetto
                    effectSpan.style.whiteSpace = 'nowrap'; // Evita che l'effetto vada a capo

                    listItem.appendChild(img);
                    listItem.appendChild(nameSpan);
                    listItem.appendChild(effectSpan);
                    list.appendChild(listItem);
                });
                modalContent.appendChild(list);
            }
        }
    }

    modalContainer.appendChild(modalContent);
    modalOverlay.appendChild(modalContainer);

    // Aggiungi event listener per chiudere cliccando sull'overlay
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            playKeyboardSound();
            modalOverlay.style.display = 'none'; // Nasconde
        }
    });

    // Aggiungi modal al body
    document.body.appendChild(modalOverlay);
}

// Funzione per popolare la shopping list (ora chiama solo createShoppingListModal)
// La logica di raccolta dati è stata spostata dentro createShoppingListModal
function populateShoppingList() {
    console.warn('populateShoppingList è deprecata, usa createShoppingListModal direttamente.');
    createShoppingListModal();
}

// --- FINE FUNZIONI SPOSTATE DA MENU.JS ---


document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired."); // DEBUG Iniziale

    // --- INIZIO LOGICA DI PRECARICAMENTO ---

    const ALL_IMAGE_ASSETS = [
        // Immagini Comuni / Gioco Principale
        'assets/images/loading.png', // AGGIUNTO
        'assets/images/coin.png', 'assets/images/cart.png', 'assets/images/background.png', 'assets/images/shelf.png',
        'assets/images/apple.png', 'assets/images/organic_carrot.png', 'assets/images/bread.png', 'assets/images/croissant.png',
        'assets/images/conveyor.png', 'assets/images/scanner.png', 'assets/images/sparkle.png', 'assets/images/bronze.png',
        'assets/images/silver.png', 'assets/images/gold.png', 'assets/images/platinum.png', 'assets/images/diamond.png',
        // Immagini Items (da game.js - ITEM_PROPERTIES) - Questa è una lista rappresentativa, va completata con TUTTI gli item
        'assets/images/apple.png', 'assets/images/banana.png', 'assets/images/bread.png', 'assets/images/carrot.png', 'assets/images/chicken.png',
        'assets/images/egg.png', 'assets/images/fish.png', 'assets/images/milk.png', 'assets/images/pasta.png', 'assets/images/potato.png',
        'assets/images/rice.png', 'assets/images/tomato.png', 'assets/images/water.png', 'assets/images/cheese.png', 'assets/images/chocolate.png',
        'assets/images/coffee.png', 'assets/images/lamb.png', 'assets/images/beef.png', 'assets/images/avocado.png', 'assets/images/almonds.png',
        'assets/images/asparagus.png', 'assets/images/berries.png', 'assets/images/broccoli.png', 'assets/images/cereal.png', 'assets/images/corn.png',
        'assets/images/grapes.png', 'assets/images/lettuce.png', 'assets/images/mushrooms.png', 'assets/images/oats.png', 'assets/images/onions.png',
        'assets/images/oranges.png', 'assets/images/pears.png', 'assets/images/peas.png', 'assets/images/peppers.png', 'assets/images/pork.png',
        'assets/images/shrimp.png', 'assets/images/spinach.png', 'assets/images/strawberries.png', 'assets/images/sugar.png', 'assets/images/tea.png',
        'assets/images/tofu.png', 'assets/images/yogurt.png', 'assets/images/wine.png', 'assets/images/soda.png', 'assets/images/chips.png',
        'assets/images/cookies.png', 'assets/images/icecream.png', 'assets/images/pizza.png', 'assets/images/burger.png', 'assets/images/hotdog.png',
        'assets/images/butter.png', 'assets/images/salmon.png', 'assets/images/tuna.png', 'assets/images/lentils.png', 'assets/images/beans.png',
        'assets/images/oliveoil.png', 'assets/images/honey.png', 'assets/images/jam.png', 'assets/images/ketchup.png', 'assets/images/mayo.png',
        'assets/images/mustard.png', 'assets/images/salt.png', 'assets/images/pepper.png', 'assets/images/flour.png', 'assets/images/ricecakes.png',
        'assets/images/nuts.png', 'assets/images/popcorn.png', 'assets/images/pretzels.png', 'assets/images/cannedtuna.png', 'assets/images/cannedbeans.png',
        'assets/images/cannedcorn.png', 'assets/images/cannedpeas.png', 'assets/images/cannedtomatoes.png', 'assets/images/frozenpizza.png',
        'assets/images/frozenfries.png', 'assets/images/frozenvegetables.png', 'assets/images/frozenfruit.png', 'assets/images/orangejuice.png',
        'assets/images/applejuice.png', 'assets/images/grapejuice.png', 'assets/images/lemonade.png', 'assets/images/icetea.png',
        'assets/images/energydrink.png', 'assets/images/beer.png', 'assets/images/cider.png', 'assets/images/soyamilk.png', 'assets/images/almondmilk.png',
        'assets/images/oatmilk.png', 'assets/images/coconutmilk.png', 'assets/images/plantbasedmeat.png', 'assets/images/plantbasedcheese.png',
        'assets/images/plantbasedyogurt.png', 'assets/images/quinoa.png', 'assets/images/brownrice.png', 'assets/images/wholewheatbread.png',
        'assets/images/wholewheatpasta.png', 'assets/images/darkchocolate.png', 'assets/images/greentea.png', 'assets/images/blackcoffee.png',
        'assets/images/sparklingwater.png', 'assets/images/herbaltea.png',
        // Easter egg / Special Items images from game.js
        'assets/images/bonus.png', 'assets/images/malus.png', 'assets/images/5sec.png', 'assets/images/greenwashing.png',
        'assets/images/overconsumption.png', 'assets/images/janitor.png', 'assets/images/double.png', 'assets/images/greta.png',
        'assets/images/trump.png', 'assets/images/grandma.png', 'assets/images/bear.png', 'assets/images/charity.png', 'assets/images/farmer.png',
        'assets/images/alien.png', 'assets/images/wizard.png', 'assets/images/refill.png', 'assets/images/refrigerator.png', 'assets/images/lost.png',
        'assets/images/ny.png', 'assets/images/sound.png', // Assuming sound.png is for a "sound on/off" visual
        // Immagini Interstellar Mode
        'assets/images/interstellar_bg.png', 'assets/images/cart2.png', 'assets/images/cart3.png', // include both cart2 and cart3 if used
        'assets/images/asteroid.png', 'assets/images/asteroid2.png', 'assets/images/asteroid3.png',
        'assets/images/explosion.png', 'assets/images/debris.png', 'assets/images/gravity.png', 'assets/images/larva.png',
        'assets/images/brain.png', 'assets/images/shield.png', 'assets/images/xenomorph.png', 'assets/images/laser.png',
        'assets/images/laser2.png', 'assets/images/splat.png', 'assets/images/planet.png',
        // Immagini Carburanti (da interstellar.js - FUEL_TYPES)
        'assets/images/biofuel.png', 'assets/images/solar.png', 'assets/images/algae.png', 'assets/images/hydrogen.png', 'assets/images/fusion.png'
    ];

    const ALL_AUDIO_ASSETS = [
        // Audio Comuni / Gioco Principale
        'assets/audio/keyboard.wav', // Per i click sui pulsanti (definito globalmente)
        'assets/audio/music.mp3',    // Musica di sottofondo (da index.html)
        'assets/audio/over.wav',     // Suono Game Over (da index.html)
        'assets/audio/click.wav',    // Suono generico per click (usato in game.js)
        'assets/audio/start.wav',    // Suono avvio gioco
        'assets/audio/win.wav',      // Suono vittoria sfida
        'assets/audio/collect.wav',  // Suono raccolta oggetto (game.js)
        'assets/audio/wrong.wav',    // Suono oggetto sbagliato (game.js)
        'assets/audio/challenge.wav',// Suono nuova sfida (game.js)
        'assets/audio/coin.wav',     // Suono animazione moneta (game.js)
        // Audio per specifici item/eventi da game.js (basati sui nomi dei file audio usati)
        'assets/audio/bonus.wav', 'assets/audio/malus.wav', 'assets/audio/5sec.wav', 'assets/audio/greenwashing.wav',
        'assets/audio/overconsumption.wav', 'assets/audio/janitor.wav', 'assets/audio/double.wav', 'assets/audio/greta.wav',
        'assets/audio/trump.wav', 'assets/audio/grandma.wav', 'assets/audio/bear.mp3', // o .wav se è quello corretto
        'assets/audio/charity.wav', 'assets/audio/farmer.wav', 'assets/audio/alien.wav', // o xenomorph.wav se alien.wav è per altro
        'assets/audio/wizard.wav', 'assets/audio/refill.wav', 'assets/audio/refrigerator.wav', 'assets/audio/ny.wav',
        // Audio Interstellar Mode
        'assets/audio/interstellar.mp3', 'assets/audio/explosion.wav', 'assets/audio/recharge.wav', // recharge per fuel
        'assets/audio/gravity.wav', 'assets/audio/larva.wav', 'assets/audio/brain.wav', // brain per telepathic core
        'assets/audio/shield.wav', 'assets/audio/xenomorph.wav', 'assets/audio/laser.wav',
        'assets/audio/loading.wav', 'assets/audio/debris.wav',
        'assets/audio/interstellar_over.wav', // Assumendo esista
        'assets/audio/interstellar_win.wav'  // Assumendo esista
    ];

    function preloadAsset(src) {
        return new Promise((resolve, reject) => {
            if (src.match(/\.(jpeg|jpg|gif|png|webp)$/) != null) {
                const img = new Image();
                img.onload = () => resolve({ src, status: 'loaded' });
                img.onerror = (err) => reject({ src, status: 'error', error: new Error(`Failed to load image: ${src}. Details: ${err}`) });
                img.src = src;
            } else if (src.match(/\.(mp3|wav|ogg)$/) != null) {
                const audio = new Audio();
                audio.oncanplaythrough = () => resolve({ src, status: 'loaded' });
                audio.onerror = (err) => reject({ src, status: 'error', error: new Error(`Failed to load audio: ${src}. Details: ${err}`) });
                audio.src = src;
                audio.load(); // Importante per avviare il caricamento
            } else {
                reject({ src, status: 'error', error: new Error(`Unknown asset type: ${src}`) });
            }
        });
    }

    // Riferimenti ai pulsanti del menu (devono essere definiti prima di disable/enableMenuButtons)
    const shoppingListButtonPreload = document.getElementById('shopping-list-btn');
    const startShopButtonPreload = document.getElementById('start-shop-btn');
    const interstellarButtonPreload = document.getElementById('interstellar-btn');

    function disableMenuButtons() {
        if (shoppingListButtonPreload) shoppingListButtonPreload.disabled = true;
        if (startShopButtonPreload) startShopButtonPreload.disabled = true;
        if (interstellarButtonPreload) interstellarButtonPreload.disabled = true;
        console.log("Menu buttons disabled for preloading.");
    }

    function enableMenuButtons() {
        if (shoppingListButtonPreload) shoppingListButtonPreload.disabled = false;
        if (startShopButtonPreload) startShopButtonPreload.disabled = false;
        if (interstellarButtonPreload) interstellarButtonPreload.disabled = false;
        console.log("Menu buttons enabled after preloading.");
    }

    async function preloadAllAssets() {
        const assetPromises = [];
        ALL_IMAGE_ASSETS.forEach(src => assetPromises.push(preloadAsset(src)));
        ALL_AUDIO_ASSETS.forEach(src => assetPromises.push(preloadAsset(src)));

        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loadingOverlay'; // Assicurati che l'ID corrisponda a quello usato in style.css
        loadingOverlay.style.position = 'fixed';
        loadingOverlay.style.top = '0';
        loadingOverlay.style.left = '0';
        loadingOverlay.style.width = '100%';
        loadingOverlay.style.height = '100%';
        loadingOverlay.style.backgroundColor = 'rgba(0,0,0,0.95)';
        loadingOverlay.style.color = '#a8ff60';
        loadingOverlay.style.display = 'flex';
        loadingOverlay.style.flexDirection = 'column';
        loadingOverlay.style.justifyContent = 'center';
        loadingOverlay.style.alignItems = 'center';
        loadingOverlay.style.zIndex = '10001'; // Assicurati che sia sopra altri elementi se necessario
        loadingOverlay.style.fontFamily = "'Press Start 2P', cursive";
        // AGGIUNTO: Immagine di caricamento e aggiustamenti HTML per coerenza con style.css
        loadingOverlay.innerHTML = `
            <img id="loading-image" src="assets/images/loading.png" alt="Loading..." style="width: 100px; height: 100px; margin-bottom: 20px; image-rendering: pixelated;">
            <h2 style="margin-bottom: 20px; font-size: 1.5em;">LOADING ASSETS</h2>
            <div id="loadingProgressContainer" style="width: 80%; max-width: 400px; background-color: #333; border: 2px solid #a8ff60; margin-bottom: 15px;">
                <div id="loadingProgressBar" style="width: 0%; height: 30px; background-color: #a8ff60; text-align: center; line-height: 30px; color: #000;">
                    <span id="loadingProgressText" style="font-weight: bold;">0%</span>
                </div>
            </div>
            <p id="loadingStatus" style="font-size: 0.8em; margin-top: 10px; color: #fff;">Initializing...</p>
            <p id="currentAsset" style="font-size: 0.6em; margin-top: 5px; color: #ccc; max-width: 90%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"></p>
        `;
        document.body.appendChild(loadingOverlay);

        const progressBar = document.getElementById('loadingProgressBar');
        const progressText = document.getElementById('loadingProgressText');
        const statusP = document.getElementById('loadingStatus');
        const currentAssetP = document.getElementById('currentAsset');
        let loadedCount = 0;
        const totalAssets = assetPromises.length;

        function updateProgress(assetSrc, statusType) {
            loadedCount++;
            const percentage = Math.round((loadedCount / totalAssets) * 100);
            if (progressBar) progressBar.style.width = percentage + '%';
            if (progressText) progressText.textContent = percentage + '%';
            const fileName = assetSrc.split('/').pop();
            if (statusP) statusP.textContent = `${statusType === 'error' ? 'Error loading' : 'Loaded'}: ${fileName}`;
            if (currentAssetP) currentAssetP.textContent = `(${loadedCount}/${totalAssets}) ${assetSrc}`;
            console.log(`Asset ${statusType}: ${assetSrc} (${loadedCount}/${totalAssets})`);
        }

        const wrappedPromises = assetPromises.map(promise =>
            promise
                .then(result => {
                    updateProgress(result.src, 'loaded');
                    return result;
                })
                .catch(errorResult => {
                    updateProgress(errorResult.src, 'error');
                    console.error(errorResult.error ? errorResult.error.message : `Failed to load ${errorResult.src}`);
                    // Non bloccare Promise.all, ma logga l'errore
                    return errorResult; // Restituisci l'oggetto errore per permettere a Promise.all di continuare
                })
        );

        try {
            await Promise.all(wrappedPromises);
            console.log("All assets preloading attempted.");
            if (statusP) statusP.textContent = "All assets ready!";
            if (currentAssetP) currentAssetP.textContent = "Launching game...";
            setTimeout(() => {
                if (loadingOverlay) loadingOverlay.remove();
                enableMenuButtons();
                // NON AVVIARE LA MUSICA QUI
                // const backgroundMusic = document.getElementById('backgroundMusic');
                // if (backgroundMusic) {
                //     backgroundMusic.play().catch(e => console.warn("Autoplay for background music might be blocked by the browser.", e));
                // }
                if (window.showStartScreen) {
                    console.log("Preloading complete. Showing Start Screen...");
                    window.showStartScreen();
                } else {
                    console.error("window.showStartScreen is not defined after preload!");
                }
                console.log("Event listeners attached and initial screen shown after preload.");
            }, 800); // Breve ritardo per mostrare il messaggio "All assets ready!"
        } catch (error) { // Questo catch è per errori catastrofici in Promise.all, meno probabile con la gestione individuale
            console.error("Critical error during asset preloading phase:", error);
            if (loadingOverlay) {
                loadingOverlay.innerHTML = '<h2>Error loading critical assets. Please refresh.</h2>';
            }
        }
    }

    // Inizia il precaricamento
    disableMenuButtons();
    preloadAllAssets(); // Questa è una funzione async, ma non usiamo await qui per non bloccare DOMContentLoaded.
                        // La logica di sblocco UI è dentro preloadAllAssets.

    // --- FINE LOGICA DI PRECARICAMENTO ---


    // --- OTTIENI RIFERIMENTI A TUTTI GLI ELEMENTI NECESSARI ---
    // Schermate
    const startScreen = document.getElementById('startScreen');
    const gameScreen = document.getElementById('gameScreen');
    const gameOverScreen = document.getElementById('gameOver'); // Corretto ID
    const ecoLogScreen = document.getElementById('ecoLogScreen'); // Assumendo esista
    const settingsScreen = document.getElementById('settingsScreen'); // Assumendo esista

    // Pulsanti Menu Principale / Start Screen
    const shoppingListButton = document.getElementById('shopping-list-btn');
    const startShopButton = document.getElementById('start-shop-btn');
    const interstellarButton = document.getElementById('interstellar-btn'); // Corretto ID da HTML

    // Modale "Ready to Shop?"
    const readyToShopWindow = document.getElementById('shop-now-window');
    const confirmShopButton = document.getElementById('confirm-shop-btn');
    const closeShopWindowButton = document.getElementById('close-shop-window-btn');

    // Modale "Interstellar"
    const interstellarWindow = document.getElementById('interstellar-window');
    const confirmTakeoffButton = document.getElementById('confirm-takeoff-btn');
    const ecoLogButtonInModal = document.getElementById('eco-log-btn'); // Pulsante Eco Log nella modale Interstellar
    const closeInterstellarWindowButton = document.getElementById('close-interstellar-window-btn');

    // Modale "Eco Log" (quella separata, definita in HTML)
    const ecoLogModal = document.getElementById('ecoLogModal');
    const closeEcoLogButton = ecoLogModal ? ecoLogModal.querySelector('.close-button') : null;

    // Modale "Shopping List" (creata dinamicamente, non serve riferimento qui)

    // Schermata Game Over
    const restartButton = document.getElementById('restartButton');
    const backToMenuButton = document.getElementById('backToMenuButton');
    const scoreChartButton = document.getElementById('scoreChartButton');
    const finalScoreElement = document.getElementById('finalScore'); // Per visualizzazione punteggio

    // Modale "Score Chart"
    const scoreChartModal = document.getElementById('scoreChartModal');
    const closeScoreChartButton = scoreChartModal ? scoreChartModal.querySelector('.close-button') : null;
    const scoreChartList = document.getElementById('scoreChartList'); // Per popolare la lista

    // Elementi UI Gioco (se servono qui per funzioni come showStartScreen)
    const scoreElement = document.getElementById('score');
    const timerElement = document.getElementById('timer');

    // Audio (riferimento a backgroundMusic spostato dentro preloadAllAssets per coerenza)
    // const backgroundMusic = document.getElementById('backgroundMusic');


    // Verifica elementi principali
    if (!startScreen) console.error("Elemento 'startScreen' non trovato!");
    if (!gameScreen) console.error("Elemento 'gameScreen' non trovato!");
    // Aggiungi altre verifiche se necessario


    // --- FUNZIONI DI VISUALIZZAZIONE SCHERMATE (Definite qui per chiarezza) ---
    function showScreen(screenToShow) {
        console.log("Showing screen:", screenToShow.id); // Log per debug
        // Nascondi tutte le schermate
        document.querySelectorAll('.app-screen').forEach(screen => {
            screen.style.display = 'none';
        });

        // Mostra la schermata richiesta
        if (screenToShow) {
            // Usa 'flex' per i contenitori principali, altrimenti 'block'
            const displayStyle = screenToShow.classList.contains('retro-container') ||
                                 screenToShow.id === 'gameScreen' || // Aggiunto gameScreen
                                 screenToShow.id === 'gameOver' || // Aggiunto gameOver
                                 screenToShow.id === 'factsScreen' // Aggiunto factsScreen
                                 ? 'flex' : 'block';
            screenToShow.style.display = displayStyle;
            console.log(`Set display of ${screenToShow.id} to ${displayStyle}`); // Log

            // --- RIPRISTINA LOGICA ORIGINALE SFONDO BODY ---
            if (screenToShow.id === 'gameScreen') {
                document.body.style.backgroundColor = '#000000'; // Sfondo NERO per il gioco
                console.log("Body background set to BLACK for gameScreen"); // Log
            } else {
                document.body.style.backgroundColor = '#0f380f'; // Sfondo VERDE per le altre schermate
                console.log("Body background set to GREEN"); // Log
            }
            // --- FINE RIPRISTINO ---

        } else {
            console.error("showScreen called with null or undefined screen");
        }

        // Ferma la musica di sottofondo se si esce dalla schermata iniziale
        // e non si entra nella schermata di gioco (es. si va a gameOver da game)
        if (screenToShow && screenToShow.id !== 'startScreen' && screenToShow.id !== 'gameScreen') {
            // backgroundMusic.pause(); // Commentato o rimosso se la musica deve continuare
        } else if (screenToShow && screenToShow.id === 'startScreen') {
            // backgroundMusic.play().catch(e => console.log("Autoplay prevented:", e)); // Riattiva la musica nel menu se necessario
        }
    }

    // Rendi globali le funzioni chiamate da altri script o da HTML inline (se ce ne fossero rimasti)
    window.showStartScreen = function() {
        console.log("Showing Start Screen (called by window.showStartScreen)");
        showScreen(startScreen);

        // INTERROMPI LA MUSICA DI SOTTOFONDO SE IN ESECUZIONE (quando si torna al menu)
        const backgroundMusic = document.getElementById('backgroundMusic');
        if (backgroundMusic && !backgroundMusic.paused) {
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0; // Resetta per la prossima volta
            console.log("Background music stopped on returning to start screen.");
        }

        if (typeof stopGame === 'function') stopGame(); // Ferma gioco se attivo
        if (typeof stopInterstellar === 'function') stopInterstellar(); // Ferma interstellar se attivo
    }

    // Aggiungi funzioni show per altre schermate se necessario
    window.showGameScreen = function() {
        console.log("Showing Game Screen");
        showScreen(gameScreen);
    }

    window.showGameOverScreen = function(score, collectedItems, feedback, medalImageSrc) {
        console.log("Mostra schermata Game Over. Punteggio:", score);
        const backgroundMusic = document.getElementById('backgroundMusic'); // Ottieni riferimento qui
        // Interrompi musica di sottofondo se in esecuzione
        if (backgroundMusic && !backgroundMusic.paused) {
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0; // Resetta per la prossima partita
            console.log("Background music stopped for Game Over.");
        }

        // NUOVO: Riproduci suono Game Over
        if (gameOverSound) {
            gameOverSound.play().catch(e => console.error("Errore nella riproduzione del suono di game over:", e));
        }
        // --- FINE NUOVO ---

        showScreen(gameOverScreen);
        // Qui potresti popolare finalScore, medalImage, collectedItemsList etc.
        // usando i dati passati da game.js
    }

     window.showEcoLogScreen = function() { // Funzione per mostrare la schermata Eco Log (se esiste come .app-screen)
        console.log("Showing Eco Log Screen");
        if (ecoLogScreen) {
            showScreen(ecoLogScreen);
        } else {
            console.error("Eco Log Screen element not found.");
            // Fallback: mostra la modale se la schermata non esiste?
            // const ecoLogModalElement = document.getElementById('ecoLogModal');
            // if (ecoLogModalElement) ecoLogModalElement.style.display = 'flex';
        }
    }

    // --- EVENT LISTENERS CENTRALIZZATI ---
    console.log("Attaching event listeners (will be active after preload)..."); // DEBUG

    // --- Listener Menu Principale ---

    // Pulsante "Shopping List"
    if (shoppingListButton) { // Questa variabile 'shoppingListButton' si riferisce a quella dichiarata all'inizio del blocco DOMContentLoaded.
        shoppingListButton.addEventListener('click', () => {
            console.log("Shopping List button clicked"); // DEBUG
            playKeyboardSound();
            createShoppingListModal(); // Usa la funzione definita sopra
        });
    } else {
        console.error('Elemento con ID "shopping-list-btn" non trovato.');
    }

    // Pulsante "Shop Now" (apre la modale "Ready to Shop?")
    if (startShopButton) {
        startShopButton.addEventListener('click', () => {
             console.log("Start Shop button clicked"); // DEBUG
            playKeyboardSound();
            if (readyToShopWindow) {
                readyToShopWindow.style.display = 'flex'; // Mostra modale Shop
            } else {
                console.error('Elemento con ID "shop-now-window" non trovato.');
            }
        });
    } else {
        console.error('Elemento con ID "start-shop-btn" non trovato.');
    }

    // Pulsante "Interstellar Mode" (apre la modale Interstellar)
    if (interstellarButton) { // Usa la variabile corretta
        interstellarButton.addEventListener('click', () => { // Correggi l'apostrofo mancante
             console.log("Interstellar button clicked"); // DEBUG
            playKeyboardSound();
            if (interstellarWindow) {
                interstellarWindow.style.display = 'flex'; // Mostra modale Interstellar
            } else {
                console.error('Elemento con ID "interstellar-window" non trovato.');
            }
        });
    } else {
        console.error('Elemento con ID "interstellar-btn" non trovato.'); // Aggiorna messaggio errore
    }

    // --- Listener Modale "Ready to Shop?" ---

    // Pulsante "Shop Now" (CONFERMA avvio gioco)
    if (confirmShopButton) {
        confirmShopButton.addEventListener('click', () => {
             console.log("Confirm Shop button clicked"); // DEBUG
            playKeyboardSound();
            if (readyToShopWindow) {
                readyToShopWindow.style.display = 'none'; // Nasconde modale Shop
            }

            // AVVIA LA MUSICA DI SOTTOFONDO QUI
            const backgroundMusic = document.getElementById('backgroundMusic');
            if (backgroundMusic) {
                backgroundMusic.currentTime = 0; // Assicura che parta dall'inizio
                backgroundMusic.play().catch(e => console.error("Error playing background music for shop mode:", e));
                console.log("Background music started for shop mode.");
            }

            // Assicurati che startGame sia definita e accessibile (potrebbe essere in game.js)
            if (typeof window.startGame === 'function') { // Controlla su window se non è locale
                console.log("Avvio gioco principale...");
                window.startGame(); // Chiama startGame
            } else {
                console.error('La funzione startGame() non è stata trovata o non è globale.');
            }
        });
    } else {
        console.error('Elemento con ID "confirm-shop-btn" non trovato.');
    }

    // Pulsante "X" (chiude modale Shop)
    if (closeShopWindowButton) {
        closeShopWindowButton.addEventListener('click', () => {
             console.log("Close Shop Window button clicked"); // DEBUG
            playKeyboardSound();
            if (readyToShopWindow) {
                readyToShopWindow.style.display = 'none'; // Nasconde modale Shop
            }
        });
    } else {
        console.error('Elemento con ID "close-shop-window-btn" non trovato.');
    }

    // --- Listener Modale "Interstellar" ---

    // Pulsante "Take Off!" (avvia modalità Interstellar)
    if (confirmTakeoffButton) {
        confirmTakeoffButton.addEventListener('click', () => {
             console.log("Confirm Takeoff button clicked"); // DEBUG
            playKeyboardSound();
            if (interstellarWindow) {
                interstellarWindow.style.display = 'none'; // Nasconde modale Interstellar
            }
            // Assicurati che startInterstellarMode sia definita e accessibile (in interstellar.js)
            if (typeof window.startInterstellarMode === 'function') { // Controlla su window
                console.log("Avvio modalità Interstellar...");
                window.startInterstellarMode(); // Chiama startInterstellarMode
            } else {
                console.error('La funzione startInterstellarMode() non è stata trovata o non è globale.');
            }
        });
    } else {
        console.error('Elemento con ID "confirm-takeoff-btn" non trovato.');
    }

    // Pulsante "Eco Log" (nella modale Interstellar, apre modale Eco Log HTML)
    if (ecoLogButtonInModal) {
        ecoLogButtonInModal.addEventListener('click', () => {
             console.log("Eco Log button (in Interstellar modal) clicked"); // DEBUG
            playKeyboardSound();
            if (ecoLogModal) { // Usa la modale definita in HTML
                ecoLogModal.style.display = 'flex'; // Mostra la modale Eco Log
            } else {
                console.error('Elemento con ID "ecoLogModal" (modale HTML) non trovato.');
            }
        });
    } else {
        console.error('Elemento con ID "eco-log-btn" (nella modale Interstellar) non trovato.');
    }

    // Pulsante "X" (chiude modale Interstellar)
    if (closeInterstellarWindowButton) {
        closeInterstellarWindowButton.addEventListener('click', () => {
             console.log("Close Interstellar Window button clicked"); // DEBUG
            playKeyboardSound();
            if (interstellarWindow) {
                interstellarWindow.style.display = 'none'; // Nasconde modale Interstellar
            }
        });
    } else {
        console.error('Elemento con ID "close-interstellar-window-btn" non trovato.');
    }

    // --- Listener Modale "Eco Log" (quella definita in HTML) ---
    if (closeEcoLogButton) {
        closeEcoLogButton.addEventListener('click', () => {
             console.log("Close Eco Log Modal button clicked"); // DEBUG
            playKeyboardSound();
            if (ecoLogModal) {
                ecoLogModal.style.display = 'none'; // Nasconde la modale Eco Log
            }
        });
    } else {
         console.warn('Pulsante di chiusura per Eco Log Modal (HTML) non trovato o modale non definita.');
    }

    // Chiudi modale Eco Log cliccando fuori
    if (ecoLogModal) {
        ecoLogModal.addEventListener('click', (event) => {
            if (event.target === ecoLogModal) {
                 console.log("Clicked outside Eco Log Modal content"); // DEBUG
                playKeyboardSound(); // Opzionale qui
                ecoLogModal.style.display = 'none';
            }
        });
    }

    // --- Listener Schermata Game Over ---
    // Questi listener potrebbero dover essere aggiunti quando la schermata diventa visibile
    // se gli elementi non esistono al caricamento iniziale. Ma proviamo a metterli qui.
    if (restartButton) {
        restartButton.addEventListener('click', () => {
             console.log("Restart button clicked"); // DEBUG
            playKeyboardSound();
             // Assicurati che restartGame sia definita e accessibile (in game.js)
            if (typeof window.restartGame === 'function') { // Controlla su window
                console.log("Riavvio gioco principale...");
                window.restartGame(); // Chiama restartGame
            } else {
                console.error('Funzione restartGame() non trovata o non è globale.');
            }
        });
    } else {
        console.warn('Elemento con ID "restartButton" non trovato al caricamento iniziale.');
    }

    if (backToMenuButton) {
        backToMenuButton.addEventListener('click', () => {
             console.log("Back To Menu button clicked"); // DEBUG
            playKeyboardSound();
            console.log("Torno al menu principale...");
            window.showStartScreen(); // Usa la funzione helper globale
        });
    } else {
        console.warn('Elemento con ID "backToMenuButton" non trovato al caricamento iniziale.');
    }

    // --- Listener per Score Chart Modal ---
    if (scoreChartButton) {
        scoreChartButton.addEventListener('click', () => {
             console.log("Score Chart button clicked"); // DEBUG
            playKeyboardSound();
            if (scoreChartModal) {
                 // Assicurati che displayScoreChart sia definita e accessibile (potrebbe essere in game.js)
                if (typeof window.displayScoreChart === 'function') { // Controlla su window
                    console.log("Mostro Score Chart...");
                    window.displayScoreChart(); // Chiama funzione per popolare la lista
                } else {
                    console.warn('Funzione displayScoreChart() non trovata. La modale potrebbe essere vuota.');
                    if(scoreChartList) scoreChartList.innerHTML = '<li>No scores available or function missing.</li>'; // Messaggio fallback
                }
                scoreChartModal.style.display = 'flex'; // Mostra la modale
            } else {
                console.error('Elemento con ID "scoreChartModal" non trovato.');
            }
        });
    } else {
        console.warn('Elemento con ID "scoreChartButton" non trovato al caricamento iniziale.');
    }

    if (closeScoreChartButton) {
        closeScoreChartButton.addEventListener('click', () => {
             console.log("Close Score Chart Modal button clicked"); // DEBUG
            playKeyboardSound();
            if (scoreChartModal) {
                scoreChartModal.style.display = 'none'; // Nasconde la modale
            }
        });
    } else {
        console.warn('Pulsante di chiusura per Score Chart Modal non trovato o modale non definita.');
    }

    // Chiudi modale Score Chart cliccando fuori
    if (scoreChartModal) {
        scoreChartModal.addEventListener('click', (event) => {
            if (event.target === scoreChartModal) {
                 console.log("Clicked outside Score Chart Modal content"); // DEBUG
                playKeyboardSound(); // Opzionale qui
                scoreChartModal.style.display = 'none';
            }
        });
    }

    // --- INIZIALIZZAZIONE (SPOSTATA DENTRO IL COMPLETAMENTO DI preloadAllAssets) ---
    // console.log("Attempting to preload keyboard sound..."); // DEBUG -> Ora parte di ALL_AUDIO_ASSETS
    // keyboardSound.load(); 
    // if (gameOverSound) { 
    //     console.log("Attempting to preload game over sound..."); // DEBUG -> Ora parte di ALL_AUDIO_ASSETS
    //     gameOverSound.load();
    // } 
    // console.log("Initial setup: Showing Start Screen..."); // DEBUG -> Spostato
    // window.showStartScreen(); // Mostra la schermata iniziale al caricamento -> Spostato
    // console.log("Event listeners attached and initial screen shown."); // DEBUG Finale -> Spostato

});
