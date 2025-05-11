/**
 * components.js - Gestion des composants header, footer & backtotop btn
 * Fichier responsable du chargement dynamique des composants et des fonctionnalités partagées
 */

// -----------------------------------------------------
// 1. CHARGEMENT INITIAL DES COMPOSANTS
// -----------------------------------------------------

document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Chargement du header
        const headerResponse = await fetch('components/header.html');
        const headerData = await headerResponse.text();
        document.querySelector('body').insertAdjacentHTML('afterbegin', headerData);
        
        // Chargement du footer
        const footerResponse = await fetch('components/footer.html');
        const footerData = await footerResponse.text();
        document.querySelector('body').insertAdjacentHTML('beforeend', footerData);
        
        // Initialiser les composants une fois que tout est chargé
        initComponents();
    } catch (error) {
        console.error('Erreur lors du chargement des composants:', error);
    }
});

// -----------------------------------------------------
// 2. INITIALISATION DES COMPOSANTS (après chargement dynamique)
// -----------------------------------------------------

/**
 * Fonction principale d'initialisation des fonctionnalités des composants (header, footer).
 */
function initComponents() {
    // Le thème est initialisé par js/common.js (SiteManager.theme.init)
    // La langue est initialisée par js/main.js (initLanguageSystem)
    // initSavedPreferences ici ne devrait pas toucher ni au thème ni à la langue initiale.

    // Attacher les listeners pour les éléments des composants chargés dynamiquement
    initThemeToggle();      // Pour le bouton de thème dans le header
    initLanguageSelector(); // Pour le sélecteur de langue dans le header
    initBackToTopButton();  // Pour le bouton back-to-top (peut-être dans le footer ou global)
}

// -----------------------------------------------------
// 3. GESTION DES PRÉFÉRENCES UTILISATEUR (Vide ou pour d_autres préférences)
// -----------------------------------------------------

/**
 * Initialise les préférences sauvegardées spécifiques aux composants (s'il y en a).
 * Thème et Langue sont gérés globalement par common.js et main.js respectivement.
 */
function initSavedPreferences() {
    // Vide pour l_instant, car thème et langue sont gérés ailleurs.
    // Si vous aviez d_autres préférences spécifiques aux composants, elles iraient ici.
    // console.log("initSavedPreferences dans components.js - ne fait rien pour thème/langue");
}

// -----------------------------------------------------
// 4. CONTRÔLEURS D'INTERFACE DES COMPOSANTS
// -----------------------------------------------------

/**
 * Initialise le bouton de changement de thème (dans le header dynamique).
 * Il appelle SiteManager.theme.toggle() de js/common.js.
 */
function initThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle'); // Devrait exister après chargement du header
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            if (typeof SiteManager !== 'undefined' && SiteManager.theme && SiteManager.theme.toggle) {
                SiteManager.theme.toggle();
            } else {
                console.error('SiteManager.theme.toggle non trouvée. Assurez-vous que common.js est chargé.');
            }
        });
    } else {
        // Ce message peut apparaître si initComponents est appelé avant que le header soit réellement dans le DOM.
        // console.warn('Bouton .theme-toggle non trouvé lors de initComponents.');
    }
}

/**
 * Initialise le sélecteur de langue (dans le header dynamique).
 * Appelle la fonction globale updateLanguage(lang) de js/main.js.
 */
function initLanguageSelector() {
    const langDropdownBtn = document.getElementById('langDropdownBtn');
    const langDropdownMenu = document.getElementById('langDropdownMenu'); // Le conteneur des options
    
    if (langDropdownBtn && langDropdownMenu) {
        const langOptions = langDropdownMenu.querySelectorAll('.lang-option'); // Sélectionner les options À L'INTÉRIEUR du menu
        // const langCurrentSpan = langDropdownBtn.querySelector('.lang-current'); // updateLanguage dans main.js s_en occupe

        langDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const parentDropdown = langDropdownBtn.closest('.lang-dropdown');
            if (parentDropdown) {
                parentDropdown.classList.toggle('open');
            } else { // Fallback si la structure HTML change
                langDropdownMenu.classList.toggle('show');
            }
        });
        
        document.addEventListener('click', (e) => {
            const parentDropdown = langDropdownBtn.closest('.lang-dropdown');
            let isClickInside = false;
            if (parentDropdown) {
                isClickInside = parentDropdown.contains(e.target);
            } else {
                isClickInside = langDropdownBtn.contains(e.target) || langDropdownMenu.contains(e.target);
            }

            if (!isClickInside) {
                if (parentDropdown) {
                    parentDropdown.classList.remove('open');
                } else {
                    langDropdownMenu.classList.remove('show');
                }
            }
        });
        
        langOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const lang = option.getAttribute('data-lang');
                
                if (typeof updateLanguage === "function") { // Appelle la fonction globale de main.js
                    updateLanguage(lang); // updateLanguage s_occupe de la sauvegarde et de la mise à jour du span .lang-current
                } else {
                    console.error('Fonction globale updateLanguage(lang) non trouvée (devrait être dans main.js).');
                }
                
                const parentDropdown = langDropdownBtn.closest('.lang-dropdown');
                 if (parentDropdown) {
                    parentDropdown.classList.remove('open');
                } else {
                    langDropdownMenu.classList.remove('show');
                }
            });
        });
    } else {
        // console.warn("Sélecteur de langue (#langDropdownBtn ou #langDropdownMenu) non trouvé.");
    }
}

/**
 * Initialise le bouton "Retour en haut" (dans le footer dynamique ou global).
 */
function initBackToTopButton() {
    const backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            backToTop.classList.toggle('visible', window.scrollY > 300);
        });
        
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// -----------------------------------------------------
// 5. UTILITAIRES (La fonction updateLanguage globale est dans main.js)
// -----------------------------------------------------
// Stub de updateLanguage supprimé car la fonction globale est maintenant dans main.js