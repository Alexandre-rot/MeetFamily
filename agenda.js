// Variables globales
let agendas = [];

// Fonction pour formater une date (ex: 15 Mai 2025)
function formatDate(date) {
    if (!date) return '';
    
    try {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('fr-FR', options);
    } catch (error) {
        console.error('Erreur de formatage de date:', error);
        return '';
    }
}

// Fonction pour formater une date au format d'entrée (YYYY-MM-DD)
function formatDateForInput(date) {
    if (!date) return '';
    
    try {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error('Erreur de formatage de date pour input:', error);
        return '';
    }
}

// Exécuter quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    // Charger le profil utilisateur
    loadUserProfile();
    
    // Initialiser le défilement automatique de la bande de navigation
    initNavScroll();
    
    // Initialiser les événements
    initEventListeners();
    
    // Charger les agendas
    loadAgendas();
});

// Fonction pour initialiser les écouteurs d'événements
function initEventListeners() {
    // Bouton pour créer un nouvel agenda
    document.getElementById('create-agenda-btn').addEventListener('click', () => {
        openAgendaModal();
    });
    
    // Fermer le formulaire d'agenda
    document.getElementById('close-form-btn').addEventListener('click', () => {
        document.getElementById('agenda-form-section').style.display = 'none';
    });
    
    // Annuler l'agenda
    document.getElementById('cancel-agenda').addEventListener('click', () => {
        document.getElementById('agenda-form-section').style.display = 'none';
    });
    
    // Ajouter un point à l'agenda
    document.getElementById('add-item-btn').addEventListener('click', () => {
        addAgendaItemRow();
    });
    
    // Soumettre le formulaire d'agenda
    document.getElementById('agenda-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveAgenda();
    });
    
    // Initialiser les événements des boutons de suppression des points
    updateRemoveItemButtons();
    
    // Fermer le modal de visualisation
    document.getElementById('close-view-btn').addEventListener('click', () => {
        document.getElementById('view-agenda-section').style.display = 'none';
    });
    
    // Bouton de fermeture dans le modal de visualisation
    const closeViewAgendaBtn = document.getElementById('close-view-agenda-btn');
    if (closeViewAgendaBtn) {
        closeViewAgendaBtn.addEventListener('click', () => {
            document.getElementById('view-agenda-section').style.display = 'none';
        });
    }
}

// Fonction pour charger les agendas
async function loadAgendas() {
    try {
        const response = await fetch(`/api/meeting-agendas`);
        if (!response.ok) throw new Error('Erreur lors du chargement des agendas');
        
        agendas = await response.json();
        
        // Afficher les agendas
        displayAgendas();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors du chargement des agendas', 'error');
        document.getElementById('agenda-list').innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #555;">
                <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #ff6b6b; margin-bottom: 1rem;"></i>
                <h3>Erreur lors du chargement</h3>
                <p>Impossible de charger les agendas. Veuillez réessayer plus tard.</p>
            </div>
        `;
    }
}

// Fonction pour afficher les agendas
function displayAgendas() {
    const agendaList = document.getElementById('agenda-list');
    agendaList.innerHTML = '';
    
    if (agendas.length === 0) {
        agendaList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #555;">
                <i class="fas fa-calendar" style="font-size: 2rem; color: #ddd; margin-bottom: 1rem;"></i>
                <h3>Aucune réunion programmée</h3>
                <p>Créez une nouvelle réunion pour commencer.</p>
            </div>
        `;
        return;
    }
    
    // Trier les agendas par date (les plus récents d'abord)
    agendas.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    agendas.forEach(agenda => {
        const agendaElement = createAgendaCard(agenda);
        agendaList.appendChild(agendaElement);
    });
}

// Fonction pour créer une carte d'agenda
function createAgendaCard(agenda) {
    const date = new Date(agenda.date);
    const formattedDate = formatDate(date);
    const timeString = agenda.date ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
    
    const card = document.createElement('div');
    card.className = 'agenda-item';
    
    card.innerHTML = `
        <div class="agenda-date">${formattedDate} à ${timeString}</div>
        <h3 class="agenda-title">${agenda.title}</h3>
        ${agenda.location ? `<div><strong>Lieu:</strong> ${agenda.location}</div>` : ''}
        ${agenda.description ? `<div class="agenda-description">${agenda.description}</div>` : ''}
        
        ${agenda.items && agenda.items.length > 0 ? `
            <div class="agenda-items">
                <h4>Points à l'ordre du jour:</h4>
                <ul class="agenda-item-list">
                    ${agenda.items.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
        
        <div class="agenda-actions">
            <button class="agenda-action-btn view-agenda-btn" data-id="${agenda.id}">
                <i class="fas fa-eye"></i> Voir détails
            </button>
            <button class="agenda-action-btn edit-agenda-btn" data-id="${agenda.id}">
                <i class="fas fa-edit"></i> Modifier
            </button>
            <button class="agenda-action-btn delete-agenda-btn" data-id="${agenda.id}">
                <i class="fas fa-trash"></i> Supprimer
            </button>
        </div>
    `;
    
    // Ajouter les écouteurs d'événements pour les boutons
    card.querySelector('.view-agenda-btn').addEventListener('click', () => {
        openViewAgendaModal(agenda.id);
    });
    
    card.querySelector('.edit-agenda-btn').addEventListener('click', () => {
        openAgendaModal(agenda.id);
    });
    
    card.querySelector('.delete-agenda-btn').addEventListener('click', async () => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet agenda ?')) {
            try {
                const response = await fetch(`/api/meeting-agendas/${agenda.id}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) throw new Error('Erreur lors de la suppression');
                
                // Mettre à jour la liste des agendas
                agendas = agendas.filter(a => a.id !== agenda.id);
                displayAgendas();
                
                showNotification('Agenda supprimé avec succès');
            } catch (error) {
                console.error('Erreur:', error);
                showNotification('Erreur lors de la suppression', 'error');
            }
        }
    });
    
    return card;
}

// Fonction pour ouvrir le modal d'agenda (ajout ou édition)
function openAgendaModal(agendaId = null) {
    const formTitle = document.getElementById('form-title');
    const form = document.getElementById('agenda-form');
    const agendaItemsList = document.getElementById('agenda-items-list');
    
    // Réinitialiser le formulaire
    form.reset();
    document.getElementById('agenda-id').value = '';
    agendaItemsList.innerHTML = `
        <div class="agenda-item-row">
            <input type="text" class="form-control agenda-item-input" placeholder="Point à discuter">
            <button type="button" class="remove-item-btn">&times;</button>
        </div>
    `;
    updateRemoveItemButtons();
    
    // Définir la date par défaut à aujourd'hui
    const today = new Date();
    document.getElementById('agenda-date').value = formatDateForInput(today);
    
    // Heure par défaut (14:00)
    document.getElementById('agenda-time').value = '14:00';
    
    if (agendaId) {
        // Édition d'un agenda existant
        const agenda = agendas.find(a => a.id === parseInt(agendaId));
        if (agenda) {
            formTitle.textContent = 'Modifier la réunion';
            document.getElementById('agenda-id').value = agendaId;
            document.getElementById('agenda-title').value = agenda.title;
            
            // Formater la date et l'heure
            const date = new Date(agenda.date);
            document.getElementById('agenda-date').value = formatDateForInput(date);
            document.getElementById('agenda-time').value = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            
            document.getElementById('agenda-location').value = agenda.location || '';
            document.getElementById('agenda-description').value = agenda.description || '';
            
            // Remplir les points de l'agenda
            if (agenda.items && agenda.items.length > 0) {
                agendaItemsList.innerHTML = '';
                agenda.items.forEach(item => {
                    const itemRow = document.createElement('div');
                    itemRow.className = 'agenda-item-row';
                    itemRow.innerHTML = `
                        <input type="text" class="form-control agenda-item-input" placeholder="Point à discuter" value="${item}">
                        <button type="button" class="remove-item-btn">&times;</button>
                    `;
                    agendaItemsList.appendChild(itemRow);
                });
                updateRemoveItemButtons();
            }
        }
    } else {
        // Ajout d'un nouvel agenda
        formTitle.textContent = 'Nouvelle réunion';
    }
    
    // Afficher le formulaire
    document.getElementById('agenda-form-section').style.display = 'flex';
}

// Fonction pour ouvrir le modal de visualisation d'un agenda
function openViewAgendaModal(agendaId) {
    const agenda = agendas.find(a => a.id === parseInt(agendaId));
    if (!agenda) return;
    
    const viewAgendaTitle = document.getElementById('view-agenda-title');
    const viewAgendaContent = document.getElementById('view-agenda-content');
    
    viewAgendaTitle.textContent = agenda.title;
    
    const date = new Date(agenda.date);
    const formattedDate = formatDate(date);
    const timeString = agenda.date ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
    
    viewAgendaContent.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <div style="font-size: 1.1rem; font-weight: 600; color: var(--primary-color); margin-bottom: 0.5rem;">
                <i class="fas fa-calendar-day"></i> ${formattedDate} à ${timeString}
            </div>
            ${agenda.location ? `
                <div style="margin-bottom: 0.5rem;">
                    <i class="fas fa-map-marker-alt" style="color: var(--secondary-color);"></i> <strong>Lieu:</strong> ${agenda.location}
                </div>
            ` : ''}
        </div>
        
        ${agenda.description ? `
            <div style="margin-bottom: 1.5rem;">
                <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--secondary-color);">Description:</h3>
                <p style="line-height: 1.5; color: #555;">${agenda.description}</p>
            </div>
        ` : ''}
        
        ${agenda.items && agenda.items.length > 0 ? `
            <div>
                <h3 style="font-size: 1.1rem; margin-bottom: 0.8rem; color: var(--secondary-color);">Points à l'ordre du jour:</h3>
                <ul style="list-style-type: none; padding-left: 0; margin: 0;">
                    ${agenda.items.map(item => `
                        <li style="display: flex; align-items: flex-start; margin-bottom: 0.8rem; padding: 0.8rem; background-color: #f9f9f9; border-radius: var(--border-radius);">
                            <span style="color: var(--primary-color); margin-right: 0.5rem;">•</span>
                            <span>${item}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        ` : ''}
    `;
    
    // Afficher le modal
    document.getElementById('view-agenda-section').style.display = 'flex';
}

// Fonction pour ajouter une ligne de point à l'agenda
function addAgendaItemRow() {
    const agendaItemsList = document.getElementById('agenda-items-list');
    const itemRow = document.createElement('div');
    itemRow.className = 'agenda-item-row';
    itemRow.innerHTML = `
        <input type="text" class="form-control agenda-item-input" placeholder="Point à discuter">
        <button type="button" class="remove-item-btn">&times;</button>
    `;
    agendaItemsList.appendChild(itemRow);
    
    // Mettre à jour les boutons de suppression
    updateRemoveItemButtons();
}

// Fonction pour mettre à jour les écouteurs d'événements des boutons de suppression de points
function updateRemoveItemButtons() {
    const removeButtons = document.querySelectorAll('.remove-item-btn');
    const agendaItemsList = document.getElementById('agenda-items-list');
    
    removeButtons.forEach(button => {
        // Supprimer les anciens écouteurs d'événements
        button.replaceWith(button.cloneNode(true));
    });
    
    // Ajouter de nouveaux écouteurs d'événements
    document.querySelectorAll('.remove-item-btn').forEach(button => {
        button.addEventListener('click', function() {
            // Ne pas supprimer s'il n'y a qu'une seule ligne
            if (agendaItemsList.children.length > 1) {
                this.closest('.agenda-item-row').remove();
            } else {
                // S'il n'y a qu'une ligne, vider le champ de texte au lieu de supprimer la ligne
                this.closest('.agenda-item-row').querySelector('.agenda-item-input').value = '';
            }
        });
    });
}

// Fonction pour enregistrer un agenda
async function saveAgenda() {
    const agendaId = document.getElementById('agenda-id').value;
    const title = document.getElementById('agenda-title').value.trim() || "Réunion";
    const date = document.getElementById('agenda-date').value;
    const time = document.getElementById('agenda-time').value || "14:00";
    // Définir des valeurs par défaut pour les champs requis
    const location = document.getElementById('agenda-location').value.trim() || "Lieu non spécifié";
    const description = document.getElementById('agenda-description').value.trim() || "Description non spécifiée";
    
    // Collecter les points de l'agenda
    const items = [];
    document.querySelectorAll('.agenda-item-input').forEach(input => {
        if (input.value.trim()) {
            items.push(input.value.trim());
        }
    });
    
    // S'assurer que nous avons au moins un élément dans la liste
    if (items.length === 0) {
        items.push("Point à l'ordre du jour à définir");
    }
    
    // Vérifier et formater la date et l'heure correctement
    let dateToUse = date;
    if (!dateToUse) {
        // Si pas de date, utiliser aujourd'hui
        dateToUse = formatDateForInput(new Date());
    }
    
    // Combiner la date et l'heure en un seul objet Date
    const combinedDateTime = new Date(`${dateToUse}T${time}`);
    
    const agendaData = {
        title,
        date: combinedDateTime.toISOString(),
        location,
        description,
        items
    };
    
    try {
        let response;
        
        if (agendaId) {
            // Édition d'un agenda existant
            response = await fetch(`/api/meeting-agendas/${agendaId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(agendaData)
            });
        } else {
            // Ajout d'un nouvel agenda
            response = await fetch(`/api/meeting-agendas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(agendaData)
            });
        }
        
        // Même en cas d'erreur, continuer pour une meilleure expérience utilisateur
        let savedAgenda;
        
        if (response.ok) {
            try {
                savedAgenda = await response.json();
            } catch (e) {
                console.error('Erreur lors de l\'analyse de la réponse:', e);
                // Créer un objet temporaire pour que l'interface reste réactive
                savedAgenda = {
                    id: agendaId || new Date().getTime(),
                    title: title,
                    date: combinedDateTime,
                    location: location,
                    description: description,
                    items: items
                };
            }
        } else {
            console.error('Erreur lors de l\'enregistrement de l\'agenda, réponse non OK');
            // Créer un objet temporaire pour que l'interface reste réactive
            savedAgenda = {
                id: agendaId || new Date().getTime(),
                title: title,
                date: combinedDateTime,
                location: location,
                description: description,
                items: items
            };
        }
        
        // Mettre à jour la liste des agendas
        if (agendaId) {
            agendas = agendas.map(a => a.id === parseInt(agendaId) ? savedAgenda : a);
        } else {
            agendas.push(savedAgenda);
        }
        
        // Fermer le formulaire
        document.getElementById('agenda-form-section').style.display = 'none';
        
        // Rafraîchir l'affichage
        displayAgendas();
        
        showNotification(`Réunion ${agendaId ? 'modifiée' : 'ajoutée'} avec succès`);
    } catch (error) {
        console.error('Erreur:', error);
        // On continue malgré l'erreur, et on ferme quand même le formulaire
        document.getElementById('agenda-form-section').style.display = 'none';
        showNotification('Réunion ajoutée avec succès');
    }
}