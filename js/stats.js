// js/stats.js

// Références DOM
const searchInput = document.getElementById('player-search-input');
const searchButton = document.getElementById('player-search-button');
const searchMessageEl = document.getElementById('search-message');

const playerStatsDisplaySection = document.getElementById('player-stats-display-section');
const playerProfileLoadingEl = document.getElementById('player-profile-loading');
const playerProfileContentEl = document.getElementById('player-profile-content');

const skinViewerContainer = document.getElementById('player-skin-viewer-container');
const playerUsernameEl = document.getElementById('player-username');
const playerRoleEl = document.getElementById('player-role');
const playerStatusIndicator = document.getElementById('player-status-indicator');
const playerUuidValueEl = document.getElementById('player-uuid-value');
const firstSeenDateEl = document.getElementById('first-seen-date');
const lastSeenDateEl = document.getElementById('last-seen-date');
const playTimeEl = document.getElementById('play-time');

let skinViewer = null;
let currentDisplayedPlayerInfo = null;

// --- Fonctions utilitaires ---
function formatPlayTime(ms) {
    if (ms === 0 && ms !== null) return getTranslation('stats-play-time', "0s");
    if (ms === null || typeof ms === 'undefined') return getTranslation('stats-na', 'N/A');
    let seconds = Math.floor(ms / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    seconds %= 60;
    minutes %= 60;
    let result = "";
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (seconds >= 0) result += `${seconds}s`;
    return result.trim() || getTranslation('stats-na', 'N/A');
}

function formatDate(timestamp) {
    if (!timestamp || timestamp === 0) return getTranslation('stats-na', 'N/A');
    const date = new Date(timestamp);
    const langForDate = (typeof currentLang !== 'undefined' && currentLang) ? currentLang : 'en';
    try {
        return date.toLocaleDateString(langForDate, { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) {
        console.warn("Error formatting date with locale:", e);
        return date.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' });
    }
}

function getTranslation(key, fallbackText = '') {
    if (typeof translations !== 'undefined' && typeof currentLang !== 'undefined' &&
        translations[currentLang] && typeof translations[currentLang][key] !== 'undefined') {
        return translations[currentLang][key];
    }
    return fallbackText || key;
}

function formatUUID(uuid) {
    if (!uuid || uuid.length !== 32) return uuid;
    return `${uuid.substr(0,8)}-${uuid.substr(8,4)}-${uuid.substr(12,4)}-${uuid.substr(16,4)}-${uuid.substr(20,12)}`;
}

function shortUUID(uuid) { // Renommé de UUID pour utiliser des caractères standards
    if (!uuid || uuid.length < 8) return uuid;
    return uuid.substring(0, 8) + "...";
}


// --- API et Logique de Données Joueur ---
async function getProfileFromUsername(username) {
    if (!username) return null;
    const proxy = 'https://corsproxy.io/?';
    const targetUrl = `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`;
    const apiUrl = `${proxy}${targetUrl}`;
    console.log("getProfileFromUsername: Fetching proxied URL:", `${proxy}${targetUrl}`);
    try {
        const response = await fetch(`${proxy}${targetUrl}`);
        console.log("getProfileFromUsername: Response status:", response.status);
        if (response.status === 204 || response.status === 404) {
            console.warn(`Player "${username}" not found via Mojang API (status: ${response.status}). Trying Ashcon fallback...`);
            // Fallback Ashcon
            try {
                const ashconUrl = `https://api.ashcon.app/mojang/v2/user/${encodeURIComponent(username)}`;
                const ashconResp = await fetch(ashconUrl);
                if (ashconResp.ok) {
                    const ashconData = await ashconResp.json();
                    console.log("Ashcon fallback success:", ashconData);
                    return ashconData && ashconData.uuid && ashconData.username ? { uuid: ashconData.uuid.replace(/-/g, ""), name: ashconData.username } : null;
                } else {
                    console.warn(`Ashcon fallback failed for ${username} (status: ${ashconResp.status})`);
                }
            } catch (ashconErr) {
                console.error(`Ashcon fallback error for ${username}:`, ashconErr);
            }
            return null;
        }
        if (!response.ok) {
            console.error(`Mojang API error (username to UUID): Status ${response.status}, StatusText: ${response.statusText}`);
            let errorBody = "Could not read error body";
            try { errorBody = await response.text(); } catch(e){}
            console.error("Mojang API error body:", errorBody);
            throw new Error(`Mojang API error: ${response.status}`);
        }
        const data = await response.json();
        console.log("getProfileFromUsername: Data received:", data);
        return data && data.id ? { uuid: data.id.replace(/-/g, ""), name: data.name } : null;
    } catch (error) {
        console.error(`Error in getProfileFromUsername for "${username}":`, error);
        // Fallback Ashcon même en cas d'erreur réseau Mojang
        try {
            const ashconUrl = `https://api.ashcon.app/mojang/v2/user/${encodeURIComponent(username)}`;
            const ashconResp = await fetch(ashconUrl);
            if (ashconResp.ok) {
                const ashconData = await ashconResp.json();
                console.log("Ashcon fallback success:", ashconData);
                return ashconData && ashconData.uuid && ashconData.username ? { uuid: ashconData.uuid.replace(/-/g, ""), name: ashconData.username } : null;
            } else {
                console.warn(`Ashcon fallback failed for ${username} (status: ${ashconResp.status})`);
            }
        } catch (ashconErr) {
            console.error(`Ashcon fallback error for ${username}:`, ashconErr);
        }
        return null;
    }
}

async function getProfileFromUUID(uuid) {
    if (!uuid) return null;
    const proxy = 'https://corsproxy.io/?';
    const targetUrl = `https://sessionserver.mojang.com/session/minecraft/profile/${uuid.replace(/-/g, "")}`;
    console.log("getProfileFromUUID: Fetching proxied URL:", `${proxy}${targetUrl}`);
    try {
        const response = await fetch(`${proxy}${targetUrl}`);
        console.log("getProfileFromUUID: Response status:", response.status);
        if (response.status === 204 || response.status === 404) {
            console.warn(`Profile for UUID "${uuid}" not found via Mojang session API (status: ${response.status}).`);
            return null;
        }
        if (!response.ok) {
            console.error(`Mojang session API error (UUID to Profile): Status ${response.status}, StatusText: ${response.statusText}`);
            let errorBody = "Could not read error body";
            try { errorBody = await response.text(); } catch(e){}
            console.error("Mojang API error body:", errorBody);
            throw new Error(`Mojang API error: ${response.status}`);
        }
        const data = await response.json();
        console.log("getProfileFromUUID: Data received:", data);
        return (data && data.name) ? { name: data.name } : null;
    } catch (error) {
        console.error(`Error fetching profile for UUID "${uuid}":`, error);
        return null;
    }
}

function getSkinUrlCrafatar(uuid) {
    if (!uuid) return "img/player-skin.png"; // Ou une URL de skin par défaut de Crafatar
    const cleanUUID = uuid.replace(/-/g, "");
    return `https://crafatar.com/skins/${cleanUUID}?default=MHF_Steve`; // Fallback Steve si skin non trouvé
}

const MOCK_PLAYER_DB = {
    "petpn": {
        uuid: "b40d343b9536455096d614d344e05ef4",
        username: "petpn", // La casse que vous voulez dans MOCK_DB
        role: "build",
        isOnline: true,
        firstSeen: new Date("2023-01-15T10:00:00Z").getTime(),
        lastSeen: new Date().getTime(),
        playTime: (350 * 60 * 60 * 1000) + (45 * 60 * 1000),
    },
    "djeel": {
        uuid: "fe9ac36950eb4fe290d6b4de671f4978",
        username: "djeel", // La casse que vous voulez dans MOCK_DB
        role: "admin",
        isOnline: true,
        firstSeen: new Date("2023-01-15T10:00:00Z").getTime(),
        lastSeen: new Date().getTime(),
        playTime: (350 * 60 * 60 * 1000) + (45 * 60 * 1000),
    }
};

async function fetchPlayerData(identifier) {
    await new Promise(resolve => setTimeout(resolve, 200));

    let uuid = null;
    let inputUsername = identifier;
    let officialUsername = identifier; // Sera mis à jour avec la casse correcte

    const cleanedIdentifier = identifier.replace(/-/g, "");

    if (cleanedIdentifier.length >= 30 && /^[0-9a-fA-F]+$/.test(cleanedIdentifier)) { // Accepter UUID avec ou sans tirets, ajuster la longueur si besoin
        uuid = cleanedIdentifier;
        const profileFromUUID = await getProfileFromUUID(uuid);
        if (profileFromUUID && profileFromUUID.name) {
            officialUsername = profileFromUUID.name;
        } else {
            // Si l'API session ne donne pas de nom, on ne peut pas faire mieux que l'input pour l'instant
            // ou utiliser un placeholder si l'input était un UUID.
            officialUsername = (identifier === cleanedIdentifier) ? shortUUID(uuid) : identifier;
        }
    } else {
        const profileFromUser = await getProfileFromUsername(inputUsername);
        if (profileFromUser) {
            uuid = profileFromUser.uuid;
            officialUsername = profileFromUser.name;
        } else {
            // Fallback vers MOCK_DB si l'API Mojang ne trouve pas le pseudo
            const mockKey = inputUsername.toLowerCase();
            if (MOCK_PLAYER_DB[mockKey]) {
                const mockData = MOCK_PLAYER_DB[mockKey];
                console.log("Player found in MOCK_DB by pseudo (Mojang API failed/not found):", mockData.username);
                return {
                    uuid: mockData.uuid.replace(/-/g,""), // Assurer UUID propre
                    username: inputUsername,
                    displayName: mockData.username,
                    skinUrl: getSkinUrlCrafatar(mockData.uuid),
                    role: mockData.role,
                    isOnline: mockData.isOnline,
                    firstSeen: mockData.firstSeen,
                    lastSeen: mockData.lastSeen,
                    playTime: mockData.playTime
                };
            }
            return null; // Joueur non trouvé
        }
    }

    // Vérification de l'UUID valide (32 caractères hexadécimaux)
    if (!uuid || !/^[0-9a-fA-F]{32}$/.test(uuid)) {
        showSearchMessage('stats-player-not-found', 'error', true);
        return null;
    }

    const skinUrl = getSkinUrlCrafatar(uuid);
    let additionalStats = {
        role: "player", isOnline: false, firstSeen: null, lastSeen: null, playTime: null,
    };

    // Chercher dans MOCK_DB par UUID pour les stats supplémentaires
    const mockDataForUuid = Object.values(MOCK_PLAYER_DB).find(p => p.uuid.replace(/-/g,"") === uuid);
    if (mockDataForUuid) {
        additionalStats = {
            role: mockDataForUuid.role || additionalStats.role,
            isOnline: typeof mockDataForUuid.isOnline === 'boolean' ? mockDataForUuid.isOnline : additionalStats.isOnline,
            firstSeen: mockDataForUuid.firstSeen || additionalStats.firstSeen,
            lastSeen: mockDataForUuid.lastSeen || additionalStats.lastSeen,
            playTime: typeof mockDataForUuid.playTime === 'number' ? mockDataForUuid.playTime : additionalStats.playTime,
        };
        // Si MOCK_DB a un nom plus "propre" pour cet UUID, on peut le prendre :
        // Actuellement, officialUsername (de l'API Mojang si dispo) est utilisé pour displayName.
        // Si MOCK_DB a un nom plus "propre" pour cet UUID, on peut le prendre :
        officialUsername = mockDataForUuid.username || officialUsername;
    }

    return {
        uuid: uuid,
        username: inputUsername, // Nom de la recherche
        displayName: officialUsername, // Nom à afficher
        skinUrl: skinUrl,
        ...additionalStats,
    };
}

// --- Logique d'affichage ---
function setupSkinViewer(skinUrl) {
    const container = document.getElementById('player-skin-viewer-container');
    if (!container) return;
    container.innerHTML = '';
    if (typeof skinview3d === 'undefined') {
        container.innerHTML = `<img src="${skinUrl || 'img/player-skin.png'}" alt="Player skin fallback" style="width:100%;height:100%;object-fit:contain;image-rendering:pixelated;">`;
        return;
    }
    if (typeof skinview3d === 'undefined' || !skinview3d || !THREE) {
        console.error("skinview3d library or THREE is not loaded.");
        container.innerHTML = `<p class='error'>Erreur: skinview3d ou THREE non disponible</p>`;
        return;
    }
    while (skinViewerContainer.firstChild) {
        skinViewerContainer.removeChild(skinViewerContainer.firstChild);
    }
    if (skinViewer && typeof skinViewer.dispose === 'function') {
        skinViewer.dispose();
    }
    skinViewer = null;
    try {
        let actualSkinUrl = skinUrl;
        if (!actualSkinUrl || actualSkinUrl.trim() === "") {
            actualSkinUrl = getSkinUrlCrafatar(null); // Steve par défaut
        }
        const containerWidth = skinViewerContainer.offsetWidth || 200;
        const containerHeight = skinViewerContainer.offsetHeight || 300;
        skinViewer = new skinview3d.SkinViewer({
            width: containerWidth,
            height: containerHeight,
            skin: actualSkinUrl,
            zoom: 0.75,
        });
        skinViewerContainer.appendChild(skinViewer.canvas);
        skinViewer.camera.position.set(0, 1.5, 3.5);
        skinViewer.camera.lookAt(new THREE.Vector3(0, 0.9, 0));
        // Nouvelle méthode pour skinview3d v3+
        const idleAnimation = new skinview3d.IdleAnimation();
        skinViewer.animations.add(idleAnimation);
        idleAnimation.play();
        idleAnimation.speed = 0.6;

        skinViewer.controls.enableRotate = true;
        skinViewer.controls.enableZoom = false;
        skinViewer.controls.enablePan = false;
        skinViewer.controls.rotateSpeed = 0.5;
        skinViewer.controls.minPolarAngle = Math.PI / 3;
        skinViewer.controls.maxPolarAngle = Math.PI * (2/3);
        // Lumières custom
        const defaultAmbient = skinViewer.scene.children.find(c => c.isAmbientLight);
        if(defaultAmbient) skinViewer.scene.remove(defaultAmbient);
        const defaultDirectional = skinViewer.scene.children.find(c => c.isDirectionalLight);
        if(defaultDirectional) skinViewer.scene.remove(defaultDirectional);
        const ambient = new THREE.AmbientLight(0xffffff, 0.65);
        skinViewer.scene.add(ambient);
        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.35);
        directionalLight1.position.set(3, 5, 3);
        skinViewer.scene.add(directionalLight1);
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.25);
        directionalLight2.position.set(-3, 5, -3);
        skinViewer.scene.add(directionalLight2);
        // ResizeObserver pour gérer le redimensionnement du conteneur
        const resizeObserver = new ResizeObserver(entries => {
            if (!skinViewer || !entries || !entries.length) return;
            const entry = entries[0];
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0 && (skinViewer.width !== width || skinViewer.height !== height)) {
                skinViewer.setSize(width, height);
            }
        });
        resizeObserver.observe(skinViewerContainer);
    } catch (error) {
        console.error("Erreur lors de l'initialisation de skinview3d:", error);
        skinViewerContainer.innerHTML = `<p class="error search-message error" style="display:block;">${getTranslation('stats-skin-error', 'Error loading skin')}</p>`;
    }
}

function displayPlayerData(playerData) {
    if (!playerData || !playerData.uuid) {
        showSearchMessage('stats-player-not-found', 'error', true); 
        playerStatsDisplaySection.style.display = 'none';
        currentDisplayedPlayerInfo = null;
        if (skinViewerContainer) skinViewerContainer.innerHTML = '';
        return;
    }
    currentDisplayedPlayerInfo = { ...playerData };
    playerProfileContentEl.style.display = 'none';
    playerProfileLoadingEl.style.display = 'flex';
    playerStatsDisplaySection.style.display = 'block';

    let skinDisplayUrl = playerData.skinUrl;
    if (!skinDisplayUrl || typeof skinDisplayUrl !== 'string' || !skinDisplayUrl.includes('crafatar.com')) {
        skinDisplayUrl = getSkinUrlCrafatar(playerData.uuid);
    }
    setupSkinViewer(skinDisplayUrl);

    playerUsernameEl.textContent = playerData.displayName || getTranslation('stats-unknown-player', 'Unknown Player');
    playerUuidValueEl.textContent = playerData.uuid ? formatUUID(playerData.uuid) : 'N/A';

    const roleText = playerData.role ? playerData.role.toLowerCase() : 'player';
    playerRoleEl.textContent = getTranslation(`stats-role-${roleText}`, roleText.toUpperCase());
    playerRoleEl.className = `player-role ${roleText}`;
    playerRoleEl.style.display = playerData.role ? 'inline-flex' : 'none';

    playerStatusIndicator.classList.toggle('online', playerData.isOnline);
    playerStatusIndicator.classList.toggle('offline', !playerData.isOnline);
    playerStatusIndicator.title = playerData.isOnline ? getTranslation('stats-status-online', 'Online') : getTranslation('stats-status-offline', 'Offline');

    firstSeenDateEl.textContent = formatDate(playerData.firstSeen);
    lastSeenDateEl.textContent = formatDate(playerData.lastSeen);
    playTimeEl.textContent = formatPlayTime(playerData.playTime);

    playerProfileLoadingEl.style.display = 'none';
    playerProfileContentEl.style.display = 'flex';
}

function showSearchMessage(messageKeyOrText, type = 'info', isKey = true) {
    const message = isKey ? getTranslation(messageKeyOrText, messageKeyOrText) : messageKeyOrText;
    searchMessageEl.textContent = message;
    searchMessageEl.className = `search-message ${type}`;
    searchMessageEl.style.display = 'block';
    if (isKey) {
        searchMessageEl.dataset.langKey = messageKeyOrText; 
    } else {
        searchMessageEl.removeAttribute('data-lang-key');
    }
    searchMessageEl.dataset.messageType = type;
}

function clearSearchMessage() {
    searchMessageEl.textContent = '';
    searchMessageEl.style.display = 'none';
    searchMessageEl.removeAttribute('data-lang-key');
    searchMessageEl.removeAttribute('data-message-type');
}

async function handlePlayerSearch() {
    const query = searchInput.value.trim();
    if (!query) {
        showSearchMessage('stats-empty-query', 'info', true);
        return;
    }

    clearSearchMessage();
    playerStatsDisplaySection.style.display = 'block';
    playerProfileContentEl.style.display = 'none';
    playerProfileLoadingEl.style.display = 'flex';
    playerProfileLoadingEl.querySelector('p').innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${getTranslation('stats-loading', 'Loading player data...')}`;

    try {
        const playerData = await fetchPlayerData(query);
        if (playerData) {
            displayPlayerData(playerData);
            const url = new URL(window.location);
            url.searchParams.set('player', playerData.displayName || playerData.username); 
            window.history.pushState({ player: playerData.displayName || playerData.username }, '', url);
        } else {
            showSearchMessage('stats-player-not-found', 'error', true);
            playerProfileLoadingEl.style.display = 'none';
            playerStatsDisplaySection.style.display = 'none';
            currentDisplayedPlayerInfo = null;
            if (skinViewerContainer) skinViewerContainer.innerHTML = '';
        }
    } catch (error) {
        console.error("Search error:", error);
        showSearchMessage('stats-search-error', 'error', true);
        playerProfileLoadingEl.style.display = 'none';
        playerStatsDisplaySection.style.display = 'none';
        currentDisplayedPlayerInfo = null;
        if (skinViewerContainer) skinViewerContainer.innerHTML = '';
    }
}

function loadPlayerFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const playerIdentifier = urlParams.get('player');
    if (playerIdentifier) {
        searchInput.value = playerIdentifier;
        handlePlayerSearch();
    } else {
        playerStatsDisplaySection.style.display = 'none';
        showSearchMessage('stats-search-prompt', 'info', true);
        if (skinViewerContainer) skinViewerContainer.innerHTML = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', handlePlayerSearch);
        searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                handlePlayerSearch();
            }
        });
    }
    
    if (typeof updateLanguage === "function" && typeof currentLang !== "undefined") {
        // Cet appel traduit les éléments data-lang statiques sur la page.
        // `loadPlayerFromURL` appellera `handlePlayerSearch` qui appellera `displayPlayerData`
        // et `displayPlayerData` utilise déjà `getTranslation` pour les textes dynamiques.
        updateLanguage(currentLang, false); 
    }

    loadPlayerFromURL();
        
    document.addEventListener('languageChanged', (event) => {
        const newLang = event.detail.language;
        // Retraduire les messages actifs
        if (searchMessageEl.style.display === 'block' && searchMessageEl.dataset.langKey) {
            showSearchMessage(searchMessageEl.dataset.langKey, searchMessageEl.dataset.messageType || 'info', true);
        }
        if(playerProfileLoadingEl.style.display === 'flex' && playerProfileLoadingEl.querySelector('p')){
            playerProfileLoadingEl.querySelector('p').innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${getTranslation('stats-loading', 'Loading player data...')}`;
        }
        // Si un profil est affiché, le remettre à jour pour les traductions dynamiques
        if (currentDisplayedPlayerInfo) {
             displayPlayerData(currentDisplayedPlayerInfo); 
        }
    });
});