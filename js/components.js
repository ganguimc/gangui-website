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
// 2. INITIALISATION DES COMPOSANTS
// -----------------------------------------------------

/**
 * Fonction principale d'initialisation des composants
 * Appelle toutes les sous-fonctions d'initialisation
 */
function initComponents() {
    // Chargement des préférences utilisateur (principalement la langue ici, le thème est géré par common.js)
    initSavedPreferences();
    
    // Initialisation des contrôleurs d'interface
    initThemeToggle(); // S'assure que le bouton du header (chargé dynamiquement) fonctionne
    initLanguageSelector();
    initBackToTopButton();
}

// -----------------------------------------------------
// 3. GESTION DES PRÉFÉRENCES UTILISATEUR
// -----------------------------------------------------

/**
 * Initialise les préférences sauvegardées (principalement la langue)
 * Le thème est initialisé par js/common.js
 */
function initSavedPreferences() {
    // La partie thème est maintenant gérée par SiteManager.theme.init() dans js/common.js
    // qui s'exécute déjà sur DOMContentLoaded.
    
    // Initialiser la langue sauvegardée
    const savedLang = localStorage.getItem('language');
    if (savedLang) {
        // Assurez-vous que la fonction updateLanguage est bien définie et fonctionnelle.
        // Cette version de updateLanguage est un stub dans le code fourni de components.js
        // Sa véritable implémentation pourrait être dans translations.js ou common.js/main.js
        if (typeof updateLanguage === "function") {
            updateLanguage(savedLang);
        } else if (SiteManager && SiteManager.language && typeof SiteManager.language.update === "function") {
            SiteManager.language.update(savedLang); // Si géré par common.js
        } else if (typeof mainUpdateLanguage === "function") { // Placeholder si c'est dans main.js
            mainUpdateLanguage(savedLang);
        } else {
            console.warn('La fonction updateLanguage n\'est pas trouvée pour initSavedPreferences.');
        }
    } else {
        // Langue par défaut
        if (typeof updateLanguage === "function") {
            updateLanguage('en');
        } else if (SiteManager && SiteManager.language && typeof SiteManager.language.update === "function") {
            SiteManager.language.update('en');
        } else if (typeof mainUpdateLanguage === "function") {
            mainUpdateLanguage('en');
        } else {
            console.warn('La fonction updateLanguage n\'est pas trouvée pour la langue par défaut.');
        }
    }
}

// -----------------------------------------------------
// 4. CONTRÔLEURS D'INTERFACE
// -----------------------------------------------------

/**
 * Initialise le bouton de changement de thème.
 * Le bouton est dans le header chargé dynamiquement.
 * Cette fonction RELIE le bouton à la logique de toggle de js/common.js.
 */
function initThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            // Appelle la fonction centralisée de js/common.js
            if (SiteManager && SiteManager.theme && typeof SiteManager.theme.toggle === "function") {
                SiteManager.theme.toggle();
            } else {
                console.error('SiteManager.theme.toggle non trouvée. Assurez-vous que common.js est chargé avant et correctement.');
            }
        });
    } else {
        console.warn('Bouton theme-toggle non trouvé après chargement des composants.');
    }
}

/**
 * Initialise le sélecteur de langue
 */
function initLanguageSelector() {
    const langDropdownBtn = document.getElementById('langDropdownBtn');
    const langDropdownMenu = document.getElementById('langDropdownMenu');
    const langOptions = document.querySelectorAll('.lang-option');
    const langCurrentSpan = langDropdownBtn ? langDropdownBtn.querySelector('.lang-current') : null;

    if (langDropdownBtn && langDropdownMenu) {
        // Ouvrir/fermer le menu déroulant
        langDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Minor toggle logic for visibility of dropdown itself might conflict if main.js also targets this.
            // Assuming this is the primary controller for this specific dropdown.
            const parentDropdown = langDropdownBtn.closest('.lang-dropdown');
            if (parentDropdown) {
                parentDropdown.classList.toggle('open');
            } else {
                 langDropdownMenu.classList.toggle('show'); // Fallback si structure un peu différente
            }
        });
        
        // Fermer le menu quand on clique ailleurs
        document.addEventListener('click', (e) => {
            const parentDropdown = langDropdownBtn.closest('.lang-dropdown');
            let isClickInside = false;
            if (parentDropdown) {
                isClickInside = parentDropdown.contains(e.target);
            } else {
                // Fallback if structure is simpler
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
        
        // Gestion du changement de langue
        langOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const lang = option.getAttribute('data-lang');
                
                // Appeler la fonction de mise à jour de langue appropriée
                if (typeof updateLanguage === "function") {
                    updateLanguage(lang);
                } else if (SiteManager && SiteManager.language && typeof SiteManager.language.update === "function") {
                    SiteManager.language.update(lang);
                } else if (typeof mainUpdateLanguage === "function") { // Placeholder
                     mainUpdateLanguage(lang);
                } else {
                    console.warn('Fonction updateLanguage non trouvée pour le changement de langue.');
                }

                if (langCurrentSpan) {
                    langCurrentSpan.textContent = option.textContent;
                }
                
                const parentDropdown = langDropdownBtn.closest('.lang-dropdown');
                if (parentDropdown) {
                    parentDropdown.classList.remove('open');
                } else {
                    langDropdownMenu.classList.remove('show');
                }
            });
        });
    }
}

/**
 * Initialise le bouton "Retour en haut"
 */
function initBackToTopButton() {
    const backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
        // Afficher/masquer selon la position de défilement
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });
        
        // Action de défilement vers le haut
        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// -----------------------------------------------------
// 5. UTILITAIRES
// -----------------------------------------------------

/**
 * Met à jour la langue de l'interface
 * @param {string} lang - Code de langue (ex: 'fr', 'en')
 */
function updateLanguage(lang) {
    // Note: Cette fonction est appelée mais non définie dans le code original
    // Implémentation à compléter selon les besoins
    
    // Sauvegarde de la préférence
    localStorage.setItem('language', lang);
    
    // La logique pour changer le contenu selon la langue devrait être ajoutée ici
    console.log(`Langue changée pour: ${lang}`);
}