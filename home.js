/**
 * MeetFamily - Script pour la page d'accueil
 */

// Fonction pour charger les activités récentes
async function loadRecentActivities() {
    const activityFeed = document.getElementById('activity-feed');
    
    if (!activityFeed) return;
    
    activityFeed.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        // Simuler un délai de chargement (retirer en production)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Charger les données depuis l'API
        const [announcements, agendas, photos, videos] = await Promise.all([
            fetch(`${API_URL}/announcements`).then(res => res.json()),
            fetch(`${API_URL}/meeting-agendas`).then(res => res.json()),
            fetch(`${API_URL}/photos`).then(res => res.json()),
            fetch(`${API_URL}/videos`).then(res => res.json())
        ]);
        
        // Combiner et trier les activités par date (les plus récentes d'abord)
        const activities = [
            ...announcements.map(item => ({ type: 'announcement', data: item, date: new Date(item.createdAt) })),
            ...agendas.map(item => ({ type: 'agenda', data: item, date: new Date(item.createdAt) })),
            ...photos.map(item => ({ type: 'photo', data: item, date: new Date(item.createdAt) })),
            ...videos.map(item => ({ type: 'video', data: item, date: new Date(item.createdAt) }))
        ].sort((a, b) => b.date - a.date).slice(0, 10); // Limiter aux 10 plus récentes
        
        if (activities.length === 0) {
            activityFeed.innerHTML = `
                <div class="activity-placeholder">
                    <p>Aucune activité récente pour le moment.</p>
                    <p>Commencez à utiliser MeetFamily pour voir les activités ici.</p>
                </div>
            `;
            return;
        }
        
        // Afficher les activités dans le feed
        activityFeed.innerHTML = '';
        activities.forEach((activity, index) => {
            const activityItem = createActivityItem(activity);
            activityItem.style.animationDelay = `${index * 0.1}s`;
            activityFeed.appendChild(activityItem);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des activités:', error);
        activityFeed.innerHTML = `
            <div class="activity-placeholder">
                <p>Impossible de charger les activités récentes.</p>
                <button class="btn btn-sm" onclick="loadRecentActivities()">Réessayer</button>
            </div>
        `;
    }
}

// Fonction pour créer un élément d'activité
function createActivityItem(activity) {
    const item = document.createElement('div');
    item.className = 'activity-item fade-in';
    
    let icon, title, description;
    
    switch (activity.type) {
        case 'announcement':
            icon = 'fa-bullhorn';
            title = 'Nouvelle annonce';
            description = activity.data.content.length > 80 ? 
                activity.data.content.substring(0, 80) + '...' : 
                activity.data.content;
            break;
        case 'agenda':
            icon = 'fa-calendar-alt';
            title = 'Nouvel agenda de réunion';
            description = activity.data.title;
            break;
        case 'photo':
            icon = 'fa-image';
            title = 'Nouvelle photo ajoutée';
            description = activity.data.title || 'Photo sans titre';
            break;
        case 'video':
            icon = 'fa-video';
            title = 'Nouvelle vidéo ajoutée';
            description = activity.data.title || 'Vidéo sans titre';
            break;
        default:
            icon = 'fa-bell';
            title = 'Activité';
            description = 'Nouvelle activité';
    }
    
    item.innerHTML = `
        <div class="activity-icon">
            <i class="fas ${icon}"></i>
        </div>
        <div class="activity-content">
            <h4>${title}</h4>
            <p>${description}</p>
            <div class="activity-time">${formatDate(activity.date)}</div>
        </div>
    `;
    
    // Ajouter un événement de clic pour naviguer vers l'activité
    item.addEventListener('click', () => {
        let url;
        switch (activity.type) {
            case 'announcement':
                url = 'announcements.html';
                break;
            case 'agenda':
                url = 'agenda.html';
                break;
            case 'photo':
                url = 'photos.html';
                break;
            case 'video':
                url = 'videos.html';
                break;
        }
        if (url) window.location.href = url;
    });
    
    return item;
}

// Charger les activités récentes lorsque la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    loadRecentActivities();
});
