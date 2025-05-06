// Vérification du localStorage
function checkLocalStorage() {
    try {
        const testKey = 'test_storage';
        localStorage.setItem(testKey, 'test');
        const value = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        return value === 'test';
    } catch (e) {
        console.error('localStorage non disponible:', e);
        return false;
    }
}

// Gestion du thème
function initTheme() {
    const themeToggle = document.querySelector('.theme-toggle');
    const html = document.documentElement;
    
    // Récupérer le thème sauvegardé ou utiliser dark par défaut
    const savedTheme = localStorage.getItem('theme');
    const theme = savedTheme || 'dark';
    console.log('Thème chargé:', theme);
    html.setAttribute('data-theme', theme);
    
    // Gérer le toggle du thème
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            console.log('Changement de thème:', newTheme);
            html.setAttribute('data-theme', newTheme);
            try {
                localStorage.setItem('theme', newTheme);
                console.log('Thème sauvegardé:', newTheme);
            } catch (e) {
                console.error('Erreur lors de la sauvegarde du thème:', e);
            }
        });
    }
}

// Gestion de la langue
function initLanguage() {
    try {
        const savedLang = localStorage.getItem('language');
        const defaultLang = 'en';
        const lang = savedLang && translations[savedLang] ? savedLang : defaultLang;
        
        // Vérifier si la langue existe dans les traductions
        if (!translations[lang]) {
            console.error(`La langue ${lang} n'est pas supportée`);
            return;
        }

        // Mettre à jour le texte de l'interface
        updateLanguage(lang);

        // Mettre à jour le sélecteur de langue
        const langSelect = document.getElementById('langSelect');
        if (langSelect) {
            langSelect.textContent = lang === 'en' ? 'English' : 'Français';
        }

        // Ajouter les écouteurs d'événements pour le changement de langue
        const langOptions = document.querySelectorAll('.lang-option');
        langOptions.forEach(option => {
            option.addEventListener('click', () => {
                const newLang = option.getAttribute('data-lang');
                if (translations[newLang]) {
                    updateLanguage(newLang);
                    if (langSelect) {
                        langSelect.textContent = newLang === 'en' ? 'English' : 'Français';
                    }
                }
            });
        });

        console.log(`Langue initialisée: ${lang}`);
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de la langue:', error);
    }
}

// Mettre à jour la langue
function updateLanguage(lang) {
    try {
        if (!translations[lang]) {
            console.error(`La langue ${lang} n'est pas supportée`);
            return;
        }

        // Mettre à jour tous les éléments avec des attributs data-translate
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(element => {
            const key = element.getAttribute('data-translate');
            if (translations[lang][key]) {
                element.textContent = translations[lang][key];
            }
        });

        // Sauvegarder la préférence de langue
        localStorage.setItem('language', lang);
        console.log(`Langue mise à jour: ${lang}`);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la langue:', error);
    }
}

// Initialiser les fonctionnalités communes
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initialisation des fonctionnalités communes');
    if (checkLocalStorage()) {
        initTheme();
        initLanguage();
    } else {
        console.error('Impossible d\'utiliser le localStorage');
    }
}); 