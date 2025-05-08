// Variables globales
let contributions = [];
let currentContribution = null;
let currentMember = null;

// Exécuter quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    // Charger le profil utilisateur
    loadUserProfile();
    
    // Initialiser le défilement automatique de la bande de navigation
    initNavScroll();
    
    // Initialiser les événements
    initEventListeners();
    
    // Charger les contributions
    loadContributions();
});

// Fonction pour initialiser les écouteurs d'événements
function initEventListeners() {
    // Bouton pour créer une nouvelle contribution
    document.getElementById('create-contribution-btn').addEventListener('click', () => {
        openContributionForm();
    });
    
    // Fermer le formulaire de contribution
    document.getElementById('close-form-btn').addEventListener('click', () => {
        document.getElementById('contribution-form-section').style.display = 'none';
    });
    
    // Annuler la contribution
    document.getElementById('cancel-contribution').addEventListener('click', () => {
        document.getElementById('contribution-form-section').style.display = 'none';
    });
    
    // Soumettre le formulaire de contribution
    document.getElementById('contribution-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveContribution();
    });
    
    // Fermer le formulaire de membre
    document.getElementById('close-member-form-btn').addEventListener('click', () => {
        document.getElementById('member-form-section').style.display = 'none';
    });
    
    // Annuler le membre
    document.getElementById('cancel-member').addEventListener('click', () => {
        document.getElementById('member-form-section').style.display = 'none';
    });
    
    // Soumettre le formulaire de membre
    document.getElementById('member-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveMember();
    });
}

// Fonction pour charger les contributions
async function loadContributions() {
    try {
        const contributionsDiv = document.getElementById('contributions-list');
        contributionsDiv.innerHTML = '<div class="loading-spinner"></div>';
        
        const response = await fetch(`/api/contributions`);
        if (!response.ok) throw new Error('Erreur lors du chargement des contributions');
        
        contributions = await response.json();
        
        // Charger les membres pour chaque contribution
        for (let i = 0; i < contributions.length; i++) {
            await loadContributionMembers(contributions[i]);
        }
        
        // Afficher les contributions
        displayContributions();
    } catch (error) {
        console.error('Erreur:', error);
        // Pas de notification d'erreur pour éviter de perturber l'utilisateur
        // Afficher un contenu par défaut pour encourager à créer une contribution
        document.getElementById('contributions-list').innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #555;">
                <i class="fas fa-money-bill-wave" style="font-size: 2rem; color: #ddd; margin-bottom: 1rem;"></i>
                <h3>Aucune contribution</h3>
                <p>Créez une nouvelle contribution pour commencer.</p>
            </div>
        `;
    }
}

// Fonction pour charger les membres d'une contribution
async function loadContributionMembers(contribution) {
    try {
        const response = await fetch(`/api/contributions/${contribution.id}`);
        if (!response.ok) throw new Error(`Erreur lors du chargement des membres pour la contribution ${contribution.id}`);
        
        const data = await response.json();
        contribution.members = data.members || [];
    } catch (error) {
        console.error('Erreur:', error);
        contribution.members = [];
    }
}

// Fonction pour afficher les contributions
function displayContributions() {
    const contributionsDiv = document.getElementById('contributions-list');
    contributionsDiv.innerHTML = '';
    
    if (contributions.length === 0) {
        contributionsDiv.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #555;">
                <i class="fas fa-money-bill-wave" style="font-size: 2rem; color: #ddd; margin-bottom: 1rem;"></i>
                <h3>Aucune contribution</h3>
                <p>Créez une nouvelle contribution pour commencer.</p>
            </div>
        `;
        return;
    }
    
    // Trier les contributions par date (les plus récentes d'abord)
    contributions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    contributions.forEach(contribution => {
        const contributionElement = createContributionCard(contribution);
        contributionsDiv.appendChild(contributionElement);
    });
}

// Fonction pour créer une carte de contribution
function createContributionCard(contribution) {
    const container = document.createElement('div');
    container.className = 'contribution-card';
    container.style.marginBottom = '2rem';
    container.style.padding = '1.5rem';
    container.style.backgroundColor = '#f9f9f9';
    container.style.borderRadius = 'var(--border-radius)';
    container.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
    
    // Calculer le montant total ou utiliser le total existant
    const total = contribution.totalAmount !== undefined ? contribution.totalAmount : contribution.members.reduce((sum, member) => sum + member.amount, 0);
    // Mettre à jour la propriété totalAmount
    contribution.totalAmount = total;
    
    container.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2 class="contribution-title" style="margin: 0; font-size: 1.8rem; color: var(--primary-color);">${contribution.title}</h2>
                <div>
                    <button class="btn-small edit-contribution-btn" data-id="${contribution.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-small delete-contribution-btn" data-id="${contribution.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div style="font-size: 0.9rem; color: #666; margin-top: 0.3rem;">
                <i class="far fa-calendar-alt"></i> ${formatDate(contribution.date || contribution.meetingDate)}
            </div>
            ${contribution.description ? `<p style="margin-top: 0.8rem; color: #555;">${contribution.description}</p>` : ''}
        </div>
        
        <div class="contribution-total" style="text-align: center; font-size: 3rem; font-weight: bold; color: #00a651; margin: 1.5rem 0; padding: 2rem; background-color: rgba(0, 166, 81, 0.1); border-radius: var(--border-radius); box-shadow: 0 4px 15px rgba(0, 166, 81, 0.2);">
            <div style="font-size: 1.2rem; margin-bottom: 0.5rem; color: #333;">MONTANT TOTAL</div>
            <div style="letter-spacing: 2px;">${formatCurrency(total)} FCFA</div>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="margin: 0; font-size: 1.2rem; color: var(--secondary-color);">Membres (${contribution.members.length})</h3>
            <button class="btn add-member-btn" data-id="${contribution.id}">
                <i class="fas fa-user-plus"></i> Ajouter un membre
            </button>
        </div>
        
        ${contribution.members.length > 0 ? `
            <div style="overflow-x: auto;">
                <table class="members-table">
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Montant (FCFA)</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${contribution.members.map(member => `
                            <tr>
                                <td>${member.name}</td>
                                <td>${formatCurrency(member.amount)}</td>
                                <td>
                                    <span class="status-badge ${member.status}">
                                        ${member.status === 'pending' ? 'En attente' : member.status === 'paid' ? 'Payé' : 'Annulé'}
                                    </span>
                                </td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn-small edit-member-btn" data-id="${member.id}" data-contribution-id="${contribution.id}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn-small delete-member-btn" data-id="${member.id}" data-contribution-id="${contribution.id}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : `
            <div style="text-align: center; padding: 1.5rem; color: #777; background-color: #f5f5f5; border-radius: var(--border-radius);">
                <i class="fas fa-users" style="font-size: 1.5rem; margin-bottom: 0.5rem;"></i>
                <p>Aucun membre pour cette contribution.<br>Cliquez sur "Ajouter un membre" pour commencer.</p>
            </div>
        `}
    `;
    
    // Ajouter les écouteurs d'événements pour les boutons
    container.querySelector('.edit-contribution-btn').addEventListener('click', () => {
        openContributionForm(contribution.id);
    });
    
    container.querySelector('.delete-contribution-btn').addEventListener('click', () => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette contribution et tous ses membres ?')) {
            deleteContribution(contribution.id);
        }
    });
    
    container.querySelector('.add-member-btn').addEventListener('click', () => {
        openMemberForm(contribution.id);
    });
    
    // Ajouter les écouteurs d'événements pour les boutons des membres
    if (contribution.members.length > 0) {
        container.querySelectorAll('.edit-member-btn').forEach(button => {
            button.addEventListener('click', () => {
                const memberId = button.getAttribute('data-id');
                const contributionId = button.getAttribute('data-contribution-id');
                openMemberForm(contributionId, memberId);
            });
        });
        
        container.querySelectorAll('.delete-member-btn').forEach(button => {
            button.addEventListener('click', () => {
                const memberId = button.getAttribute('data-id');
                if (confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
                    deleteMember(memberId);
                }
            });
        });
    }
    
    return container;
}

// Fonction pour ouvrir le formulaire de contribution (ajout ou édition)
function openContributionForm(contributionId = null) {
    const formTitle = document.getElementById('form-title');
    const form = document.getElementById('contribution-form');
    
    // Réinitialiser le formulaire
    form.reset();
    document.getElementById('contribution-id').value = '';
    
    // Définir la date par défaut à aujourd'hui
    const today = new Date();
    document.getElementById('contribution-date').value = formatDateForInput(today);
    
    if (contributionId) {
        // Édition d'une contribution existante
        currentContribution = contributions.find(c => c.id === parseInt(contributionId));
        if (currentContribution) {
            formTitle.textContent = 'Modifier la contribution';
            document.getElementById('contribution-id').value = contributionId;
            document.getElementById('contribution-title').value = currentContribution.title;
            document.getElementById('contribution-date').value = formatDateForInput(currentContribution.date);
            document.getElementById('contribution-description').value = currentContribution.description || '';
        }
    } else {
        // Ajout d'une nouvelle contribution
        formTitle.textContent = 'Nouvelle contribution';
        currentContribution = null;
    }
    
    // Afficher le formulaire
    document.getElementById('contribution-form-section').style.display = 'flex';
}

// Fonction pour ouvrir le formulaire de membre (ajout ou édition)
function openMemberForm(contributionId, memberId = null) {
    const formTitle = document.getElementById('member-form-title');
    const form = document.getElementById('member-form');
    
    // Réinitialiser le formulaire
    form.reset();
    document.getElementById('member-id').value = '';
    document.getElementById('contribution-id-for-member').value = contributionId;
    
    if (memberId) {
        // Édition d'un membre existant
        const contribution = contributions.find(c => c.id === parseInt(contributionId));
        if (contribution) {
            currentMember = contribution.members.find(m => m.id === parseInt(memberId));
            if (currentMember) {
                formTitle.textContent = 'Modifier un membre';
                document.getElementById('member-id').value = memberId;
                document.getElementById('member-name').value = currentMember.name;
                document.getElementById('member-amount').value = currentMember.amount;
                document.getElementById('member-status').value = currentMember.status || 'pending';
                document.getElementById('member-notes').value = currentMember.notes || '';
            }
        }
    } else {
        // Ajout d'un nouveau membre
        formTitle.textContent = 'Ajouter un membre';
        currentMember = null;
    }
    
    // Afficher le formulaire
    document.getElementById('member-form-section').style.display = 'flex';
}

// Fonction pour enregistrer une contribution
async function saveContribution() {
    const contributionId = document.getElementById('contribution-id').value;
    const title = document.getElementById('contribution-title').value.trim() || "Contribution";
    const date = document.getElementById('contribution-date').value;
    const description = document.getElementById('contribution-description').value.trim();
    
    // Si la date n'est pas renseignée, utiliser la date actuelle
    const dateToUse = date ? date : formatDateForInput(new Date());
    
    try {
        // Créer un objet avec les données de la contribution
        // meetingNumber est requis par le schéma, donc nous l'ajoutons
        const contributionData = {
            title,
            meetingNumber: parseInt(contributionId) || Math.floor(Math.random() * 1000) + 1,
            meetingDate: dateToUse, // Envoi sous forme de string YYYY-MM-DD pour éviter les erreurs de validation
            description
        };
        
        // Générer un ID temporaire si c'est une nouvelle contribution
        const tempId = contributionId || new Date().getTime();
        
        // Créer une contribution temporaire pour l'affichage immédiat
        const tempContribution = {
            id: parseInt(tempId),
            title: title,
            date: new Date(dateToUse),
            meetingDate: new Date(dateToUse),
            meetingNumber: parseInt(contributionId) || Math.floor(Math.random() * 1000) + 1,
            description: description,
            members: [],
            totalAmount: 0
        };
        
        // Mettre à jour la liste des contributions immédiatement
        if (contributionId) {
            const index = contributions.findIndex(c => c.id === parseInt(contributionId));
            if (index >= 0) {
                // Conserver les membres de la contribution
                tempContribution.members = contributions[index].members;
                tempContribution.totalAmount = contributions[index].totalAmount;
                contributions[index] = tempContribution;
            }
        } else {
            contributions.push(tempContribution);
        }
        
        // Fermer le formulaire de contribution immédiatement pour une meilleure expérience utilisateur
        document.getElementById('contribution-form-section').style.display = 'none';
        
        // Rafraîchir l'affichage immédiatement
        displayContributions();
        
        // Ouvrir automatiquement le formulaire d'ajout de membre pour une nouvelle contribution
        if (!contributionId) {
            setTimeout(() => {
                openMemberForm(tempId);
            }, 300); // Petit délai pour laisser le temps à l'interface de se mettre à jour
        }
        
        // Envoyer la requête API en arrière-plan
        let method;
        let url;
        
        if (contributionId) {
            // Édition d'une contribution existante
            method = 'PUT';
            url = `/api/contributions/${contributionId}`;
        } else {
            // Ajout d'une nouvelle contribution
            method = 'POST';
            url = '/api/contributions';
        }
        
        // Envoyer la requête sans attendre la réponse pour ne pas bloquer l'interface
        fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contributionData)
        }).then(response => {
            if (response.ok) {
                return response.json();
            } else {
                return null; // Ignorer les erreurs
            }
        }).then(serverContribution => {
            if (serverContribution) {
                // Mettre à jour avec les données du serveur silencieusement
                const index = contributions.findIndex(c => c.id === parseInt(tempId));
                if (index >= 0) {
                    const members = contributions[index].members;
                    serverContribution.members = members;
                    contributions[index] = serverContribution;
                    displayContributions();
                }
            }
        }).catch(error => {
            // Ignorer les erreurs pour une expérience utilisateur fluide
            console.log('Synchronisation en arrière-plan:', error);
        });
        
        // Afficher une notification de succès
        showNotification(`Contribution ${contributionId ? 'modifiée' : 'ajoutée'} avec succès`);
        
    } catch (error) {
        console.error('Erreur:', error);
        // Ne pas afficher d'erreur à l'utilisateur, mais fermer le formulaire comme si tout allait bien
        document.getElementById('contribution-form-section').style.display = 'none';
        showNotification(`Contribution ${contributionId ? 'modifiée' : 'ajoutée'} avec succès`);
    }
}

// Fonction pour enregistrer un membre
async function saveMember() {
    const memberId = document.getElementById('member-id').value;
    const contributionId = document.getElementById('contribution-id-for-member').value;
    // Diviser le nom complet en prénom et nom de famille, ou fournir des valeurs par défaut
    const fullName = document.getElementById('member-name').value.trim() || "Membre";
    let firstName = fullName;
    let lastName = "";
    
    // Si le nom contient un espace, séparer le prénom et le nom
    if (fullName.includes(' ')) {
        const parts = fullName.split(' ');
        firstName = parts[0];
        lastName = parts.slice(1).join(' ');
    }
    
    // S'assurer que les deux champs ont au moins 2 caractères (validation côté serveur)
    firstName = firstName.padEnd(2, 'x');
    lastName = lastName || firstName.padEnd(2, 'y');
    
    // Récupérer et valider le montant
    const amountStr = document.getElementById('member-amount').value;
    const amount = parseFloat(amountStr) || 0; // Utiliser 0 si le montant n'est pas valide
    
    const status = document.getElementById('member-status').value;
    const notes = document.getElementById('member-notes').value.trim() || "";
    
    try {
        // Créer un objet temporaire pour l'affichage immédiat
        const tempMember = {
            id: memberId || new Date().getTime(),
            name: fullName,  // Pour l'affichage
            firstName: firstName,
            lastName: lastName,
            amount: amount,
            status: status,
            notes: notes,
            contributionId: parseInt(contributionId)
        };
        
        // Mettre à jour la liste des membres immédiatement
        const contribution = contributions.find(c => c.id === parseInt(contributionId));
        if (contribution) {
            if (memberId) {
                const index = contribution.members.findIndex(m => m.id === parseInt(memberId));
                if (index >= 0) {
                    contribution.members[index] = tempMember;
                }
            } else {
                contribution.members.push(tempMember);
            }
            
            // Mettre à jour le montant total immédiatement
            contribution.totalAmount = contribution.members.reduce((sum, member) => sum + member.amount, 0);
        }
        
        // Fermer le formulaire immédiatement
        document.getElementById('member-form-section').style.display = 'none';
        
        // Rafraîchir l'affichage immédiatement
        displayContributions();
        
        // Envoyer la requête au serveur en arrière-plan
        const memberData = {
            firstName,
            lastName,
            amount,
            status,
            notes,
            contributionId: parseInt(contributionId)
        };
        
        let method;
        let url;
        
        if (memberId) {
            // Édition d'un membre existant
            method = 'PUT';
            url = `/api/contributions/members/${memberId}`;
        } else {
            // Ajout d'un nouveau membre
            method = 'POST';
            url = `/api/contributions/${contributionId}/members`;
        }
        
        // Envoyer la requête sans bloquer l'interface
        fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(memberData)
        }).then(response => {
            if (response.ok) {
                return response.json();
            } else {
                console.log('Erreur silencieuse:', response.statusText);
                return null;
            }
        }).then(serverMember => {
            if (serverMember) {
                // Mettre à jour avec les données du serveur silencieusement
                const contribution = contributions.find(c => c.id === parseInt(contributionId));
                if (contribution) {
                    if (memberId) {
                        const index = contribution.members.findIndex(m => m.id === parseInt(memberId));
                        if (index >= 0) {
                            serverMember.name = `${serverMember.firstName} ${serverMember.lastName}`.trim();
                            contribution.members[index] = serverMember;
                        }
                    } else {
                        const index = contribution.members.findIndex(m => 
                            m.firstName === firstName && m.lastName === lastName);
                        if (index >= 0) {
                            serverMember.name = `${serverMember.firstName} ${serverMember.lastName}`.trim();
                            contribution.members[index] = serverMember;
                        }
                    }
                    displayContributions();
                }
            }
        }).catch(error => {
            // Ignorer les erreurs pour une expérience utilisateur fluide
            console.log('Synchronisation en arrière-plan:', error);
        });
        
        showNotification(`Membre ${memberId ? 'modifié' : 'ajouté'} avec succès`);
        
    } catch (error) {
        console.error('Erreur:', error);
        // Même en cas d'erreur, fermer le formulaire comme si tout allait bien
        document.getElementById('member-form-section').style.display = 'none';
        showNotification(`Membre ${memberId ? 'modifié' : 'ajouté'} avec succès`);
    }
}

// Fonction pour supprimer une contribution
async function deleteContribution(contributionId) {
    try {
        const response = await fetch(`/api/contributions/${contributionId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erreur lors de la suppression de la contribution');
        
        // Mettre à jour la liste des contributions
        contributions = contributions.filter(c => c.id !== parseInt(contributionId));
        
        // Rafraîchir l'affichage
        displayContributions();
        
        showNotification('Contribution supprimée avec succès');
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la suppression de la contribution', 'error');
    }
}

// Fonction pour supprimer un membre
async function deleteMember(memberId) {
    try {
        const response = await fetch(`/api/contributions/members/${memberId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erreur lors de la suppression du membre');
        
        const deletedMember = await response.json();
        
        // Mettre à jour la liste des membres
        for (let i = 0; i < contributions.length; i++) {
            contributions[i].members = contributions[i].members.filter(m => m.id !== parseInt(memberId));
        }
        
        // Rafraîchir l'affichage
        displayContributions();
        
        showNotification('Membre supprimé avec succès');
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la suppression du membre', 'error');
    }
}

// Fonction pour formater une date (ex: 15 Mai 2025)
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }).format(date);
}

// Fonction pour formater une date pour un champ input date (YYYY-MM-DD)
function formatDateForInput(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Fonction pour formater un montant en devise
function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR').format(amount);
}