// ... existing global variables ...

// --- NUOVO: Suono per i click sui pulsanti ---
const keyboardSound = new Audio('assets/audio/keyboard.wav');
keyboardSound.volume = 0.8; // Regola il volume se necessario

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
    // modalContent.classList.add('shopping-list-content'); // Classe opzionale
    modalContent.style.maxHeight = '60vh'; // Stile inline per scroll
    modalContent.style.overflowY = 'auto';
    modalContent.style.textAlign = 'left'; // Allinea testo a sinistra
    modalContent.style.paddingRight = '15px'; // Aggiungi padding per la scrollbar

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
                sectionTitle.style.marginTop = '15px'; // Spaziatura
                modalContent.appendChild(sectionTitle);

                const list = document.createElement('ul');
                // list.classList.add('shopping-list'); // Classe opzionale
                list.style.listStyle = 'none'; // Rimuovi pallini
                list.style.padding = '0';

                items.forEach(item => {
                    if (!item || !item.name || !item.image) {
                        console.warn('Item non valido nella shopping list:', item);
                        return;
                    }

                    const listItem = document.createElement('li');
                    // listItem.classList.add('shopping-list-item'); // Classe opzionale
                    listItem.style.display = 'flex'; // Usa flex per allineare
                    listItem.style.alignItems = 'center';
                    listItem.style.marginBottom = '10px'; // Spaziatura

                    // Immagine
                    const img = document.createElement('img');
                    img.src = `assets/images/${item.image}`;
                    img.alt = item.name;
                    // img.classList.add('item-image'); // Classe opzionale
                    img.style.width = '30px'; // Dimensione immagine
                    img.style.height = '30px';
                    img.style.marginRight = '10px';
                    img.onerror = () => { img.style.display = 'none'; }; // Nasconde se l'immagine non carica

                    // Nome
                    const nameSpan = document.createElement('span');
                    // nameSpan.classList.add('item-name'); // Classe opzionale
                    nameSpan.textContent = item.name;
                    nameSpan.style.flexGrow = '1'; // Occupa spazio disponibile
                    nameSpan.style.marginRight = '10px';
                    nameSpan.style.color = '#00ffcc'; // Imposta il colore del testo a verde

                    // Effetto
                    const effectSpan = document.createElement('span');
                    // effectSpan.classList.add('item-effect'); // Classe opzionale
                    effectSpan.textContent = getItemEffect(item);
                    effectSpan.style.fontWeight = 'bold'; // Evidenzia effetto
                    effectSpan.style.whiteSpace = 'nowrap'; // Evita che l'effetto vada a capo

                    listItem.appendChild(img);
                    listItem.appendChild(nameSpan);
                    listItem.appendChild(effectSpan);
                    list.appendChild(listItem);
                });
                modalContent.appendChild(list);
                // Aggiungi separatore
                 const hr = document.createElement('hr');
                 hr.style.border = 'none';
                 hr.style.borderTop = '1px dashed #ccc';
                 hr.style.margin = '15px 0';
                 modalContent.appendChild(hr);
            }
        }
         // Rimuovi l'ultimo separatore se esiste
        if (modalContent.lastChild && modalContent.lastChild.tagName === 'HR') {
            modalContent.removeChild(modalContent.lastChild);
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

    // Audio (se servono controlli globali qui)
    const backgroundMusic = document.getElementById('backgroundMusic');
    const gameOverSound = document.getElementById('gameOverSound');
    // ... altri suoni se necessario ...

    // Verifica elementi principali
    if (!startScreen) console.error("Elemento 'startScreen' non trovato!");
    if (!gameScreen) console.error("Elemento 'gameScreen' non trovato!");
    // Aggiungi altre verifiche se necessario


    // --- FUNZIONI DI VISUALIZZAZIONE SCHERMATE (Definite qui per chiarezza) ---
    function showScreen(screenToShow) {
        console.log(`Attempting to show screen: ${screenToShow ? screenToShow.id : 'null'}`); // DEBUG
        // Nascondi tutte le schermate principali
        document.querySelectorAll('.app-screen').forEach(screen => {
             if (screen) screen.style.display = 'none';
        });
        // Nascondi tutte le finestre modali (quelle non definite come .app-screen)
        document.querySelectorAll('.retro-window, .modal').forEach(modal => {
            if (modal && modal.id !== 'loadingScreen') { // Non nascondere il loading se presente
                 modal.style.display = 'none';
            }
        });

        if (screenToShow) {
            // Determina display corretto (flex per container principali, block per altri?)
            const displayStyle = (screenToShow.classList.contains('retro-container') || screenToShow.classList.contains('app-screen')) ? 'flex' : 'block';
            screenToShow.style.display = displayStyle;
             console.log(`Screen ${screenToShow.id} display set to ${displayStyle}`); // DEBUG
        } else {
            console.error("Tentativo di mostrare una schermata nulla o non trovata.");
        }
    }

    // Rendi globali le funzioni chiamate da altri script o da HTML inline (se ce ne fossero rimasti)
    window.showStartScreen = function() {
        console.log("Showing Start Screen");
        showScreen(startScreen);
        // Potrebbe essere necessario fermare/resettare stati di gioco qui
        // stopGameMusic(); // Esempio
        // playMenuMusic(); // Esempio
        if (typeof stopGame === 'function') stopGame(); // Ferma gioco se attivo
        if (typeof stopInterstellar === 'function') stopInterstellar(); // Ferma interstellar se attivo
    }

    // Aggiungi funzioni show per altre schermate se necessario
    window.showGameScreen = function() {
        console.log("Showing Game Screen");
        showScreen(gameScreen);
    }

    window.showGameOverScreen = function() {
        console.log("Showing Game Over Screen");
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
    console.log("Attaching event listeners..."); // DEBUG

    // --- Listener Menu Principale ---

    // Pulsante "Shopping List"
    if (shoppingListButton) {
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
    // CORREZIONE: L'ID corretto in index.html è 'interstellar-btn'
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

    // --- INIZIALIZZAZIONE ---
    console.log("Attempting to preload keyboard sound..."); // DEBUG
    keyboardSound.load(); // Tentativo di pre-caricamento
    console.log("Initial setup: Showing Start Screen..."); // DEBUG
    window.showStartScreen(); // Mostra la schermata iniziale al caricamento
    console.log("Event listeners attached and initial screen shown."); // DEBUG Finale

});

// ... eventuali altre funzioni globali definite in script.js ...
// Assicurati che funzioni come startGame, restartGame, startInterstellarMode, displayScoreChart
// siano definite NEI LORO RISPETTIVI FILE (game.js, interstellar.js) e rese globali
// assegnandole a 'window', ad esempio: window.startGame = function() { ... };
