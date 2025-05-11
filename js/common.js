/**
 * common.js - Fonctions communes pour le site
 * Stockage des données, thème et langue
 */

// ----------------------------------------------------- //
// 1. CONSTANTES ET VARIABLES GLOBALES
// ----------------------------------------------------- //
const STORAGE_TEST_KEY = 'test_storage';
const DEFAULT_THEME = 'dark';
const DEFAULT_LANGUAGE = 'en';

// Objet contenant les noms d'affichage pour chaque langue supportée
// Ce sera la source unique pour ces noms, accessible via SiteManager.LANGUAGE_NAMES
const APP_LANGUAGE_NAMES = {
    'en': 'English',
    'fr': 'Français',
    'es': 'Español',
    'de': 'Deutsch',
    'ro': 'Română',
    'ru': 'Русский',
    'zh': '中文'
};

// Namespace principal pour les fonctionnalités du site
const SiteManager = {
    storage: {},
    theme: {},
    language: {},
    LANGUAGE_NAMES: APP_LANGUAGE_NAMES // Exposer les noms de langue via SiteManager
};

// ----------------------------------------------------- //
// 2. UTILITAIRES ET GESTION DU STOCKAGE
// ----------------------------------------------------- //

/**
 * Vérifie si localStorage est disponible et fonctionnel
 * @returns {boolean} - true si localStorage fonctionne, false sinon
 */
SiteManager.storage.check = function() {
    try {
        localStorage.setItem(STORAGE_TEST_KEY, 'test');
        const value = localStorage.getItem(STORAGE_TEST_KEY);
        localStorage.removeItem(STORAGE_TEST_KEY);
        return value === 'test';
    } catch (e) {
        console.warn('localStorage non disponible ou désactivé:', e); // Changé en warn, pas une erreur critique
        return false;
    }
};

/**
 * Sauvegarde une valeur dans localStorage avec gestion d'erreur
 * @param {string} key - La clé de stockage
 * @param {string} value - La valeur à stocker
 * @returns {boolean} - true si réussi, false sinon
 */
SiteManager.storage.save = function(key, value) {
    if (!SiteManager.storage.check()) return false; // Ne pas essayer de sauvegarder si storage non dispo
    try {
        localStorage.setItem(key, value);
        // console.log(`Valeur sauvegardée: ${key}=${value}`); // Optionnel : décommenter pour debug
        return true;
    } catch (e) {
        console.error(`Erreur lors de la sauvegarde de ${key}:`, e);
        return false;
    }
};

/**
 * Récupère une valeur depuis localStorage avec valeur par défaut
 * @param {string} key - La clé à récupérer
 * @param {string} defaultValue - Valeur par défaut si non trouvée
 * @returns {string} - La valeur stockée ou la valeur par défaut
 */
SiteManager.storage.get = function(key, defaultValue) {
    if (!SiteManager.storage.check()) return defaultValue; // Retourner défaut si storage non dispo
    try {
        const value = localStorage.getItem(key);
        return value !== null ? value : defaultValue;
    } catch (e) {
        console.error(`Erreur lors de la récupération de ${key}:`, e);
        return defaultValue;
    }
};

// ----------------------------------------------------- //
// 3. GESTION DU THÈME (INCHANGÉ, DÉJÀ CORRECT)
// ----------------------------------------------------- //

/**
 * Initialise le thème depuis localStorage et configure les événements
 */
SiteManager.theme.init = function() {
    const themeToggle = document.querySelector('.theme-toggle');
    const html = document.documentElement;
    
    let savedTheme = SiteManager.storage.get('theme', DEFAULT_THEME);
    // console.log('Thème initial chargé:', savedTheme); // Optionnel : décommenter pour debug

    if (savedTheme !== 'light' && savedTheme !== 'dark') {
        savedTheme = DEFAULT_THEME;
    }

    html.classList.remove('dark-theme', 'light-theme');
    html.classList.add(savedTheme + '-theme');
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            SiteManager.theme.toggle();
        });
    } else {
        // Si le header est chargé dynamiquement, le listener du themeToggle 
        // sera attaché dans js/components.js après le chargement du header.
        // console.warn("Theme toggle button not found on initial DOM. If loaded dynamically, ensure listener is attached later.");
    }
};

/**
 * Bascule entre les thèmes clair et sombre
 */
SiteManager.theme.toggle = function() {
    const html = document.documentElement;
    let newTheme;

    if (html.classList.contains('dark-theme')) {
        newTheme = 'light';
        html.classList.remove('dark-theme');
        html.classList.add('light-theme');
    } else {
        newTheme = 'dark';
        html.classList.remove('light-theme');
        html.classList.add('dark-theme');
    }
    
    // console.log('Changement de thème vers:', newTheme); // Optionnel : décommenter pour debug
    SiteManager.storage.save('theme', newTheme);
    
    document.dispatchEvent(new CustomEvent('themeChanged', { 
        detail: { theme: newTheme } 
    }));
};

// ----------------------------------------------------- //
// 4. GESTION DES LANGUES (VIDÉ CAR GÉRÉ PAR MAIN.JS)
// ----------------------------------------------------- //
// SiteManager.language.init et .update sont maintenant gérées par js/main.js
// pour utiliser `data-lang` et consolider la logique.


// ----------------------------------------------------- //
// 5. INITIALISATION
// ----------------------------------------------------- //

/**
 * Point d'entrée principal - initialise toutes les fonctionnalités communes
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initialisation des fonctionnalités communes (thème depuis common.js)');
    // La vérification localStorage est déjà dans SiteManager.storage.get/save
    SiteManager.theme.init(); 
    // L'initialisation de la langue (initLanguageSystem) est appelée depuis js/main.js
    // car elle dépend de js/translations.js et gère directement le DOM avec data-lang.
});