// Multi-language support for EU Voting App
const translations = {
    en: {
        'app.title': 'EU Voting App',
        'intro.title': 'Official European Union Voting Platform',
        'intro.description': 'Secure, transparent, and accessible voting for EU citizens. Participate in democratic processes with confidence.',
        'tabs.vote': 'Vote',
        'tabs.results': 'Results',
        'tabs.admin': 'Admin',
        'vote.title': 'Active Polls',
        'vote.loading': 'Loading polls...',
        'vote.voterId': 'Voter ID (optional):',
        'vote.submit': 'Submit Vote',
        'vote.success': 'Vote submitted successfully!',
        'vote.error': 'Error submitting vote. Please try again.',
        'vote.already': 'You have already voted in this poll.',
        'results.title': 'Poll Results',
        'results.loading': 'Loading results...',
        'results.totalVotes': 'Total Votes:',
        'admin.title': 'Create New Poll',
        'admin.question': 'Question:',
        'admin.options': 'Options:',
        'admin.addOption': 'Add Option',
        'admin.create': 'Create Poll',
        'admin.success': 'Poll created successfully!',
        'admin.error': 'Error creating poll. Please try again.',
        'footer.text': '© 2024 European Union Voting Platform. Committed to democracy, transparency, and accessibility.',
        'footer.privacy': 'Privacy Policy',
        'footer.accessibility': 'Accessibility',
        'footer.support': 'Support'
    },
    de: {
        'app.title': 'EU Abstimmungs-App',
        'intro.title': 'Offizielle Abstimmungsplattform der Europäischen Union',
        'intro.description': 'Sichere, transparente und zugängliche Abstimmungen für EU-Bürger. Nehmen Sie mit Vertrauen an demokratischen Prozessen teil.',
        'tabs.vote': 'Abstimmen',
        'tabs.results': 'Ergebnisse',
        'tabs.admin': 'Admin',
        'vote.title': 'Aktive Umfragen',
        'vote.loading': 'Lade Umfragen...',
        'vote.voterId': 'Wähler-ID (optional):',
        'vote.submit': 'Stimme abgeben',
        'vote.success': 'Stimme erfolgreich abgegeben!',
        'vote.error': 'Fehler beim Abgeben der Stimme. Bitte versuchen Sie es erneut.',
        'vote.already': 'Sie haben bereits in dieser Umfrage abgestimmt.',
        'results.title': 'Umfrageergebnisse',
        'results.loading': 'Lade Ergebnisse...',
        'results.totalVotes': 'Gesamtstimmen:',
        'admin.title': 'Neue Umfrage erstellen',
        'admin.question': 'Frage:',
        'admin.options': 'Optionen:',
        'admin.addOption': 'Option hinzufügen',
        'admin.create': 'Umfrage erstellen',
        'admin.success': 'Umfrage erfolgreich erstellt!',
        'admin.error': 'Fehler beim Erstellen der Umfrage. Bitte versuchen Sie es erneut.',
        'footer.text': '© 2024 Abstimmungsplattform der Europäischen Union. Verpflichtet zu Demokratie, Transparenz und Zugänglichkeit.',
        'footer.privacy': 'Datenschutzrichtlinie',
        'footer.accessibility': 'Barrierefreiheit',
        'footer.support': 'Support'
    },
    fr: {
        'app.title': 'App de Vote UE',
        'intro.title': 'Plateforme de Vote Officielle de l\'Union Européenne',
        'intro.description': 'Vote sécurisé, transparent et accessible pour les citoyens de l\'UE. Participez aux processus démocratiques en toute confiance.',
        'tabs.vote': 'Voter',
        'tabs.results': 'Résultats',
        'tabs.admin': 'Admin',
        'vote.title': 'Sondages Actifs',
        'vote.loading': 'Chargement des sondages...',
        'vote.voterId': 'ID de votant (optionnel):',
        'vote.submit': 'Soumettre le Vote',
        'vote.success': 'Vote soumis avec succès!',
        'vote.error': 'Erreur lors de la soumission du vote. Veuillez réessayer.',
        'vote.already': 'Vous avez déjà voté dans ce sondage.',
        'results.title': 'Résultats des Sondages',
        'results.loading': 'Chargement des résultats...',
        'results.totalVotes': 'Total des Votes:',
        'admin.title': 'Créer un Nouveau Sondage',
        'admin.question': 'Question:',
        'admin.options': 'Options:',
        'admin.addOption': 'Ajouter une Option',
        'admin.create': 'Créer le Sondage',
        'admin.success': 'Sondage créé avec succès!',
        'admin.error': 'Erreur lors de la création du sondage. Veuillez réessayer.',
        'footer.text': '© 2024 Plateforme de Vote de l\'Union Européenne. Engagée pour la démocratie, la transparence et l\'accessibilité.',
        'footer.privacy': 'Politique de Confidentialité',
        'footer.accessibility': 'Accessibilité',
        'footer.support': 'Support'
    }
};

let currentLanguage = 'en';

function changeLanguage(lang) {
    currentLanguage = lang;
    document.documentElement.lang = lang;
    
    // Update all elements with data-translate attribute
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    
    // Update placeholders
    updatePlaceholders(lang);
    
    // Save language preference
    localStorage.setItem('preferredLanguage', lang);
}

function updatePlaceholders(lang) {
    const placeholders = {
        en: {
            'pollQuestion': 'Enter your poll question',
            'option': 'Option',
            'voterId': 'Enter your voter ID'
        },
        de: {
            'pollQuestion': 'Geben Sie Ihre Umfragefrage ein',
            'option': 'Option',
            'voterId': 'Geben Sie Ihre Wähler-ID ein'
        },
        fr: {
            'pollQuestion': 'Entrez votre question de sondage',
            'option': 'Option',
            'voterId': 'Entrez votre ID de votant'
        }
    };
    
    if (placeholders[lang]) {
        const pollQuestion = document.getElementById('pollQuestion');
        if (pollQuestion) {
            pollQuestion.placeholder = placeholders[lang]['pollQuestion'];
        }
        
        const voterIdInput = document.getElementById('voterId');
        if (voterIdInput) {
            voterIdInput.placeholder = placeholders[lang]['voterId'];
        }
        
        document.querySelectorAll('input[name="option"]').forEach((input, index) => {
            input.placeholder = `${placeholders[lang]['option']} ${index + 1}`;
        });
    }
}

function getTranslation(key, lang = currentLanguage) {
    return translations[lang] && translations[lang][key] ? translations[lang][key] : key;
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedLanguage = localStorage.getItem('preferredLanguage') || 'en';
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = savedLanguage;
        changeLanguage(savedLanguage);
    }
});