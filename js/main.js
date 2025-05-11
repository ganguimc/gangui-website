/**
 * Fichier main.js
 * Ce fichier contient les fonctionnalités JavaScript pour un site web multilingue
 * et gère la logique principale de traduction du DOM.
 */

// -----------------------------------------------------
// 1. SÉLECTEURS DOM (ceux utilisés par main.js)
// -----------------------------------------------------
const loader = document.querySelector('.loader');
const navLinks = document.querySelectorAll('.nav-menu a');
const backToTop = document.querySelector('.back-to-top');
const copyIpButtons = document.querySelectorAll('.copy-ip');
const header = document.querySelector('.header'); // Pour initThemeHandler

// -----------------------------------------------------
// 2. VARIABLES GLOBALES POUR LA LANGUE
// -----------------------------------------------------
let currentLang = 'en'; // Valeur par défaut, sera mise à jour par initLanguageSystem
const SITE_LANGUAGE_KEY = 'site_language'; // Clé localStorage standardisée
const DEFAULT_SITE_LANG = 'en';

// LANGUAGE_DISPLAY_NAMES sera récupéré depuis SiteManager si common.js est chargé avant,
// sinon, prévoir un fallback ou s_assurer de l_ordre de chargement.

// -----------------------------------------------------
// 3. FONCTIONS UTILITAIRES
// -----------------------------------------------------
/**
 * Copie le texte dans le presse-papier
 * @param {string} text - Texte à copier
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = 'Copied!'; // TODO: Traduire également ce message via translations.js
        document.body.appendChild(tooltip);
        // Idéalement, positionner le tooltip par rapport au bouton cliqué.
        setTimeout(() => tooltip.remove(), 2000);
    }).catch(err => {
        console.error('Erreur lors de la copie dans le presse-papiers:', err);
    });
}

// -----------------------------------------------------
// 4. FONCTION PRINCIPALE DE GESTION DE LANGUE
// -----------------------------------------------------
/**
 * Met à jour la langue de l'interface, sauvegarde la préférence et met à jour l'UI du sélecteur.
 * CECI EST LA FONCTION CENTRALE POUR METTRE À JOUR LA LANGUE.
 * Elle devrait être appelée par le sélecteur de langue dans components.js.
 * @param {string} lang - Code de la langue ('en', 'fr', etc.)
 * @param {boolean} savePreference - Faut-il sauvegarder dans localStorage ? (true par défaut)
 */
function updateLanguage(lang, savePreference = true) {
    if (typeof translations === 'undefined') {
        console.error('L\'objet translations (translations.js) n\'est pas défini ou chargé. Impossible de traduire.');
        return;
    }
    
    const displayNames = (typeof SiteManager !== 'undefined' && SiteManager.LANGUAGE_NAMES)
        ? SiteManager.LANGUAGE_NAMES
        : { 'en': 'English', 'fr': 'Français', 'es': 'Español', 'de': 'Deutsch', 'ro': 'Română', 'ru': 'Русский', 'zh': '中文' }; // Fallback

    if (!translations[lang] || !displayNames[lang]) {
        console.warn(`Traductions ou nom d'affichage non trouvés pour la langue '${lang}'. Utilisation de la langue par défaut '${DEFAULT_SITE_LANG}'.`);
        lang = DEFAULT_SITE_LANG;
    }

    currentLang = lang;
    
    document.querySelectorAll('[data-lang]').forEach(element => {
        const key = element.getAttribute('data-lang');
        if (key === 'current-lang') return; // Géré séparément pour le sélecteur de langue

        if (translations[lang] && typeof translations[lang][key] !== 'undefined') {
            if (element.hasAttribute('data-lang-html')) {
                element.innerHTML = translations[lang][key];
            } else {
                element.textContent = translations[lang][key];
            }
        } else {
            // console.warn(`Clé de traduction manquante pour '${key}' dans la langue '${lang}'.`);
        }
    });

    const langCurrentSpan = document.querySelector('#langDropdownBtn .lang-current');
    if (langCurrentSpan) {
        langCurrentSpan.textContent = displayNames[lang];
         // Mettre aussi à jour l'attribut data-lang du span si vous voulez qu'il soit "traduit" au prochain cycle, mais ce n'est pas nécessaire ici.
        // langCurrentSpan.setAttribute('data-lang', 'current-lang'); // Assure que sa clé est correcte.
    }


    if (savePreference) {
        if (typeof SiteManager !== 'undefined' && SiteManager.storage && SiteManager.storage.save) {
            SiteManager.storage.save(SITE_LANGUAGE_KEY, lang);
        } else {
            try { localStorage.setItem(SITE_LANGUAGE_KEY, lang); } catch (e) { console.error(e); }
        }
    }
    
    // console.log(`Langue appliquée par main.js : ${lang}`);
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
}

/**
 * Initialise le système de gestion des langues au chargement de la page.
 */
function initLanguageSystem() {
    let savedLang = DEFAULT_SITE_LANG;
    if (typeof SiteManager !== 'undefined' && SiteManager.storage && SiteManager.storage.get) {
        savedLang = SiteManager.storage.get(SITE_LANGUAGE_KEY, DEFAULT_SITE_LANG);
    } else {
        try { const langFromStorage = localStorage.getItem(SITE_LANGUAGE_KEY); if (langFromStorage) savedLang = langFromStorage; } catch (e) { console.error(e); }
    }
    
    updateLanguage(savedLang, false); 
}


// -----------------------------------------------------
// 5. FONCTIONS DE LA FAQ
// -----------------------------------------------------
function toggleFAQ(item) {
    const answer = item.querySelector('.faq-answer');
    const isOpen = item.classList.contains('active');
    const allFaqItems = document.querySelectorAll('.faq-item');

    allFaqItems.forEach(otherItem => {
        if (otherItem !== item) {
            otherItem.classList.remove('active');
            const otherAnswer = otherItem.querySelector('.faq-answer');
            if (otherAnswer) {
                otherAnswer.style.maxHeight = null;
            }
        }
    });

    if (!isOpen && answer) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
    } else if (isOpen && answer) {
        item.classList.remove('active');
        answer.style.maxHeight = null;
    }
}

function initFAQ() {
    const allFaqItems = document.querySelectorAll('.faq-item');
    if (allFaqItems.length > 0) {
        allFaqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            if (question) {
                question.addEventListener('click', () => toggleFAQ(item));
            }
        });
    }
}

// -----------------------------------------------------
// 6. FONCTIONS DU CARROUSEL
// -----------------------------------------------------
function initFeaturesCarousel() {
    const carousel = document.querySelector('.features-grid.carousel');
    if (!carousel) return;

    const cardElements = carousel.querySelectorAll('.feature-card');
    if (!cardElements || cardElements.length === 0) return;
    
    const cards = Array.from(cardElements);
    const dotsContainer = document.querySelector('.carousel-dots');
    let currentIndex = 0;
    let resizeTimeout, scrollSyncTimeout;

    carousel.tabIndex = 0;

    function showSlide(index, smooth = true) {
        if (cards.length === 0) return;
        index = (index % cards.length + cards.length) % cards.length;
        currentIndex = index;
        const card = cards[currentIndex];
        if (!card) return;

        const scrollTarget = card.offsetLeft - carousel.offsetLeft;
        carousel.scrollTo({ left: scrollTarget, behavior: smooth ? 'smooth' : 'auto' });

        cards.forEach((c, i) => c.classList.toggle('active', i === currentIndex));

        if (dotsContainer) {
            if (dotsContainer.children.length !== cards.length) {
                dotsContainer.innerHTML = '';
                cards.forEach((_, i) => {
                    const dot = document.createElement('span');
                    dot.className = 'carousel-dot';
                    dot.addEventListener('click', () => showSlide(i));
                    dotsContainer.appendChild(dot);
                });
            }
            Array.from(dotsContainer.children).forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
        }
    }

    let touchStartX = 0;
    carousel.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    carousel.addEventListener('touchend', e => {
        const diff = touchStartX - e.changedTouches[0].screenX;
        if (Math.abs(diff) > 50) showSlide(currentIndex + (diff > 0 ? 1 : -1));
    });

    cards.forEach((card, index) => card.addEventListener('click', () => {
        if (index !== currentIndex) showSlide(index);
    }));

    carousel.addEventListener('scroll', () => {
        clearTimeout(scrollSyncTimeout);
        scrollSyncTimeout = setTimeout(() => {
            const currentScrollLeft = carousel.scrollLeft;
            let newBestIndex = 0;
            let minDiff = Infinity;
            cards.forEach((card, i) => {
                const cardCenter = card.offsetLeft - carousel.offsetLeft + card.offsetWidth / 2;
                const carouselCenter = currentScrollLeft + carousel.offsetWidth / 2;
                const diff = Math.abs(carouselCenter - cardCenter);
                if (diff < minDiff) {
                    minDiff = diff;
                    newBestIndex = i;
                }
            });
            if (newBestIndex !== currentIndex) {
                currentIndex = newBestIndex;
                cards.forEach((c, i) => c.classList.toggle('active', i === currentIndex));
                if (dotsContainer) {
                     Array.from(dotsContainer.children).forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
                }
            }
        }, 150);
    });

    carousel.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); showSlide(currentIndex - 1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); showSlide(currentIndex + 1); }
    });

    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => showSlide(currentIndex, false), 200);
    });

    if (cards.length > 0) showSlide(0, false);
}

// -----------------------------------------------------
// 7. FONCTIONS D'ANIMATION
// -----------------------------------------------------
function cycleHeroTitleText() {
    const titleTexts = document.querySelectorAll('.title-wrapper .title-text');
    if (titleTexts.length === 0) return;
    let currentTextIndex = 0;

    titleTexts.forEach(el => el.classList.remove('active', 'slide-up'));
    if (titleTexts[currentTextIndex]) titleTexts[currentTextIndex].classList.add('active');

    setInterval(() => {
        if (!document.hidden) { 
            if (titleTexts[currentTextIndex]) titleTexts[currentTextIndex].classList.remove('active');
            currentTextIndex = (currentTextIndex + 1) % titleTexts.length;
            if (titleTexts[currentTextIndex]) {
                titleTexts[currentTextIndex].classList.add('slide-up');
                void titleTexts[currentTextIndex].offsetWidth;
                titleTexts[currentTextIndex].classList.add('active');
                setTimeout(() => {
                    if (titleTexts[currentTextIndex]) titleTexts[currentTextIndex].classList.remove('slide-up');
                }, 500);
            }
        }
    }, 2500);
}

function initMouseSpotlight() {
    const spotlight = document.querySelector('.mouse-spotlight');
    if (!spotlight) return;

    let x = 0, y = 0;
    let animationFrameId = null;

    function moveSpotlight() {
        spotlight.style.left = `${x}px`;
        spotlight.style.top = `${y}px`;
        animationFrameId = requestAnimationFrame(moveSpotlight);
    }

    function updateSpotlight(e) {
        x = e.clientX - spotlight.offsetWidth / 2;
        y = e.clientY - spotlight.offsetHeight / 2;
    }

    document.addEventListener('mousemove', (e) => {
        updateSpotlight(e);
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(moveSpotlight);
            document.body.classList.add('spotlight-active');
        }
    });

    document.addEventListener('mouseleave', () => {
        document.body.classList.remove('spotlight-active');
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    });
}



// -----------------------------------------------------
// 8. FONCTIONS D'INITIALISATION SPÉCIFIQUES À MAIN.JS
// -----------------------------------------------------
function initMainPageComponents() {
    if (copyIpButtons.length > 0) {
        copyIpButtons.forEach(button => {
            button.addEventListener('click', () => {
                const ip = button.getAttribute('data-ip');
                if (ip) copyToClipboard(ip);
                else console.warn('data-ip manquant sur le bouton de copie.');
            });
        });
    }
}

function initThemeHandler() { // Cette fonction est appelée par DOMContentLoaded ci-dessous
    const html = document.documentElement;
    function updateHeaderThemeClassBasedOnGlobalTheme() {
        if (!header) return;
        header.classList.toggle('light-theme', html.classList.contains('light-theme'));
    }
    document.addEventListener('themeChanged', updateHeaderThemeClassBasedOnGlobalTheme);
    updateHeaderThemeClassBasedOnGlobalTheme(); 
}

// -----------------------------------------------------
// 9. ÉVÉNEMENT DE CHARGEMENT PRINCIPAL
// -----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    cycleHeroTitleText();
    initMouseSpotlight(); 

    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500); 
        }, 1000); 
    }

    // initTheme est dans common.js et s'exécute sur son propre DOMContentLoaded.
    // initLanguageSystem utilise `updateLanguage` qui est défini dans ce fichier.
    initLanguageSystem(); 
    initThemeHandler();   // Gère la classe du header basée sur le thème global (modifié par common.js)

    initFeaturesCarousel();
    initFAQ();
    initMainPageComponents(); 

    if (header || backToTop) {
        window.addEventListener('scroll', () => {
            if (header) header.classList.toggle('scrolled', window.scrollY > 50);
            if (backToTop) backToTop.classList.toggle('visible', window.scrollY > 300);
        });
    }

    if (navLinks.length > 0) {
        navLinks.forEach(link => {
            link.addEventListener('click', () => { 
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }

    if (backToTop) {
        backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
});
