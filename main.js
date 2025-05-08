// Variables globales
const API_URL = '/api';

// Exécuter quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    // Charger le profil utilisateur (image de profil)
    loadUserProfile();
    
    // Initialiser le défilement automatique de la bande de navigation
    initNavScroll();
    
    // Implémenter la navigation séquentielle
    setupSequentialNavigation();
});

// Fonction pour charger le profil utilisateur
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_URL}/user`);
        if (!response.ok) throw new Error('Erreur lors du chargement du profil');
        
        const user = await response.json();
        const profilePic = document.getElementById('profile-pic');
        
        if (user.profilePicture) {
            profilePic.src = user.profilePicture;
        } else {
            profilePic.src = 'images/default-profile.jpg';
        }
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('profile-pic').src = 'images/default-profile.jpg';
    }
}

// Fonction pour initialiser le défilement automatique de la bande de navigation
function initNavScroll() {
    const navContainer = document.querySelector('.nav-buttons-container');
    let scrollDirection = -1; // -1 vers la gauche, 1 vers la droite
    let scrollInterval;
    let isPaused = false;
    
    // Vérifier si le contenu dépasse la largeur visible
    const needsScrolling = navContainer.scrollWidth > navContainer.clientWidth;
    
    if (!needsScrolling) return;
    
    function startScrolling() {
        scrollInterval = setInterval(() => {
            if (isPaused) return;
            
            navContainer.scrollLeft += scrollDirection;
            
            // Inverser la direction si on atteint les bords
            if (navContainer.scrollLeft <= 0) {
                scrollDirection = 1; // Vers la droite
            } else if (navContainer.scrollLeft + navContainer.clientWidth >= navContainer.scrollWidth) {
                scrollDirection = -1; // Vers la gauche
            }
        }, 20);
    }
    
    // Mettre en pause le défilement au survol
    navContainer.addEventListener('mouseenter', () => {
        isPaused = true;
    });
    
    navContainer.addEventListener('mouseleave', () => {
        isPaused = false;
    });
    
    // Démarrer le défilement
    startScrolling();
}

// Fonction pour afficher une notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type === 'error' ? 'error' : ''}`;
    notification.classList.add('show');
    
    // Masquer la notification après 3 secondes
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Fonction pour créer un spinner de chargement
function createLoadingSpinner() {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    return spinner;
}

// Fonction pour formater une date pour l'affichage
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }).format(date);
}

// Fonction pour formater une date avec l'heure pour l'affichage
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Fonction pour formater une date pour un champ input date
function formatDateForInput(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Fonction pour formater un montant en devise
function formatCurrency(amount) {
    return Number(amount).toLocaleString('fr-FR');
}

// Fonction pour implémenter la navigation séquentielle (pour sortir page par page)
function setupSequentialNavigation() {
    // Pages dans l'ordre de navigation
    const pagesOrder = [
        'index.html',
        'agenda.html',
        'contributions.html',
        'announcements.html',
        'photos.html',
        'videos.html',
        'history.html'
    ];
    
    // Intercepter tous les clics sur les liens de navigation
    const navButtons = document.querySelectorAll('.nav-button');
    navButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Ne pas interférer avec le comportement normal des liens
            // Juste enregistrer la navigation dans l'historique
            const targetHref = this.getAttribute('href');
            
            // Permet de revenir en arrière en séquence grâce à l'historique du navigateur
            if (!targetHref.includes('#')) {
                history.pushState({ page: targetHref }, '', targetHref);
            }
        });
    });
    
    // Gestion du bouton retour du navigateur
    window.addEventListener('popstate', function(e) {
        // Laisser le navigateur gérer le retour avec l'historique séquentiel
        // Aucune action supplémentaire n'est nécessaire car nous utilisons history.pushState 
        // pour créer l'historique séquentiel
    });
}