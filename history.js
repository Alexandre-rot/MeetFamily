// Variables globales
let historyEvents = [];
let historyContent = '';

// Exécuter quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    // Initialiser les événements
    initEventListeners();
    
    // Charger les événements et le contenu d'histoire
    loadHistoryEvents();
    loadHistoryContent();
});

// Fonction pour initialiser les écouteurs d'événements
function initEventListeners() {
    // Bouton pour ajouter un événement
    document.getElementById('new-event-btn').addEventListener('click', () => {
        openEventForm();
    });
    
    // Fermer le formulaire d'événement
    document.getElementById('close-event-form').addEventListener('click', () => {
        document.getElementById('event-form-section').style.display = 'none';
    });
    
    // Annuler l'événement
    document.getElementById('cancel-event').addEventListener('click', () => {
        document.getElementById('event-form-section').style.display = 'none';
    });
    
    // Soumettre le formulaire d'événement
    document.getElementById('event-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveEvent();
    });
    
    // Prévisualisation de l'image sélectionnée
    document.getElementById('event-image').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('image-preview').innerHTML = `<img src="${event.target.result}" alt="Aperçu de l'image">`;
            };
            reader.readAsDataURL(file);
        } else {
            document.getElementById('image-preview').innerHTML = '';
        }
    });
    
    // Enregistrer le contenu de l'histoire
    document.getElementById('save-history-btn').addEventListener('click', () => {
        saveHistoryContent();
    });
}

// Fonction pour charger les événements de l'histoire
async function loadHistoryEvents() {
    try {
        const response = await fetch(`${API_URL}/family-history/events`);
        if (!response.ok) throw new Error('Erreur lors du chargement des événements');
        
        historyEvents = await response.json();
        
        // Afficher les événements
        displayHistoryEvents();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors du chargement des événements', 'error');
    }
}

// Fonction pour charger le contenu de l'histoire
async function loadHistoryContent() {
    try {
        const response = await fetch(`${API_URL}/family-history/content`);
        if (!response.ok) throw new Error('Erreur lors du chargement du contenu');
        
        const data = await response.json();
        historyContent = data.content || '';
        
        // Afficher le contenu dans l'éditeur
        document.getElementById('history-content').value = historyContent;
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors du chargement du contenu', 'error');
    }
}

// Fonction pour afficher les événements dans la chronologie
function displayHistoryEvents() {
    const timelineEvents = document.getElementById('timeline-events');
    timelineEvents.innerHTML = '';
    
    if (historyEvents.length === 0) {
        timelineEvents.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #555;">
                <i class="fas fa-info-circle" style="font-size: 2rem; color: #ddd; margin-bottom: 1rem;"></i>
                <h3>Aucun événement</h3>
                <p>Ajoutez des événements pour commencer votre chronologie familiale.</p>
            </div>
        `;
        return;
    }
    
    // Trier les événements par date (les plus anciens d'abord)
    historyEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    historyEvents.forEach((event, index) => {
        const eventElement = document.createElement('div');
        eventElement.className = 'timeline-event';
        
        eventElement.innerHTML = `
            <div class="timeline-content">
                <div class="timeline-date">${formatDate(event.date)}</div>
                <h3 class="timeline-title">${event.title}</h3>
                <p class="timeline-description">${event.description}</p>
                ${event.imageUrl ? `<img src="${event.imageUrl}" alt="${event.title}" class="timeline-image">` : ''}
                <div class="timeline-actions">
                    <button class="timeline-action-btn edit-event" data-id="${event.id}">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="timeline-action-btn delete-event" data-id="${event.id}">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </div>
        `;
        
        timelineEvents.appendChild(eventElement);
    });
    
    // Ajouter les événements de clic pour modifier/supprimer
    document.querySelectorAll('.edit-event').forEach(button => {
        button.addEventListener('click', (e) => {
            const eventId = e.currentTarget.getAttribute('data-id');
            openEventForm(eventId);
        });
    });
    
    document.querySelectorAll('.delete-event').forEach(button => {
        button.addEventListener('click', (e) => {
            const eventId = e.currentTarget.getAttribute('data-id');
            if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
                deleteEvent(eventId);
            }
        });
    });
}

// Fonction pour ouvrir le formulaire d'événement (ajout ou édition)
function openEventForm(eventId = null) {
    const form = document.getElementById('event-form');
    
    // Réinitialiser le formulaire
    form.reset();
    document.getElementById('event-id').value = '';
    document.getElementById('image-preview').innerHTML = '';
    
    if (eventId) {
        // Édition d'un événement existant
        const event = historyEvents.find(e => e.id === parseInt(eventId));
        if (event) {
            document.getElementById('event-form-title').textContent = 'Modifier l\'événement';
            document.getElementById('event-id').value = eventId;
            document.getElementById('event-title').value = event.title;
            document.getElementById('event-date').value = formatDateForInput(event.date);
            document.getElementById('event-description').value = event.description;
            
            // Si l'événement contient une image, l'afficher
            if (event.imageUrl) {
                document.getElementById('image-preview').innerHTML = `<img src="${event.imageUrl}" alt="Aperçu de l'image">`;
            }
        }
    } else {
        // Ajout d'un nouvel événement
        document.getElementById('event-form-title').textContent = 'Ajouter un événement';
        document.getElementById('event-date').value = formatDateForInput(new Date());
    }
    
    // Afficher le formulaire
    document.getElementById('event-form-section').style.display = 'flex';
}

// Fonction pour sauvegarder un événement
async function saveEvent() {
    const eventId = document.getElementById('event-id').value;
    const title = document.getElementById('event-title').value;
    const date = document.getElementById('event-date').value;
    const description = document.getElementById('event-description').value;
    const imageFile = document.getElementById('event-image').files[0];
    
    try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('date', date);
        formData.append('description', description);
        
        if (imageFile) {
            formData.append('image', imageFile);
        }
        
        let url = `${API_URL}/family-history/events`;
        let method = 'POST';
        
        if (eventId) {
            url = `${API_URL}/family-history/events/${eventId}`;
            method = 'PUT';
            
            // Si l'ID existe, on est en mode édition
            formData.append('id', eventId);
        }
        
        const response = await fetch(url, {
            method,
            body: formData
        });
        
        if (!response.ok) throw new Error('Erreur lors de l\'enregistrement de l\'\u00e9vénement');
        
        const result = await response.json();
        
        // Mettre à jour la liste des événements
        if (eventId) {
            historyEvents = historyEvents.map(e => e.id === parseInt(eventId) ? result : e);
        } else {
            historyEvents.push(result);
        }
        
        // Mettre à jour l'affichage
        displayHistoryEvents();
        
        // Fermer le formulaire
        document.getElementById('event-form-section').style.display = 'none';
        
        showNotification(`Événement ${eventId ? 'modifié' : 'ajouté'} avec succès`);
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de l\'enregistrement de l\'\u00e9vénement', 'error');
    }
}

// Fonction pour supprimer un événement
async function deleteEvent(eventId) {
    try {
        const response = await fetch(`${API_URL}/family-history/events/${eventId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erreur lors de la suppression de l\'\u00e9vénement');
        
        // Mettre à jour la liste des événements
        historyEvents = historyEvents.filter(e => e.id !== parseInt(eventId));
        
        // Mettre à jour l'affichage
        displayHistoryEvents();
        
        showNotification('Événement supprimé avec succès');
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la suppression de l\'\u00e9vénement', 'error');
    }
}

// Fonction pour sauvegarder le contenu de l'histoire
async function saveHistoryContent() {
    const content = document.getElementById('history-content').value;
    
    try {
        const response = await fetch(`${API_URL}/family-history/content`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });
        
        if (!response.ok) throw new Error('Erreur lors de l\'enregistrement du contenu');
        
        historyContent = content;
        showNotification('Histoire enregistrée avec succès');
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de l\'enregistrement de l\'histoire', 'error');
    }
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

// Fonction pour formater une date pour un champ input date
function formatDateForInput(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}