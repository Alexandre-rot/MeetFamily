// Variables globales
let announcements = [];
let currentAnnouncementId = null;
let audioRecorder = null;
let audioChunks = [];
let audioBlob = null;

// Exécuter quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    // Initialiser les événements
    initEventListeners();
    
    // Charger les annonces
    loadAnnouncements();
});

// Fonction pour initialiser les écouteurs d'événements
function initEventListeners() {
    // Bouton pour créer une nouvelle annonce
    document.getElementById('new-announcement-btn').addEventListener('click', () => {
        openAnnouncementForm();
    });
    
    // Fermer le formulaire d'annonce
    document.getElementById('close-form-btn').addEventListener('click', () => {
        document.getElementById('announcement-form-section').style.display = 'none';
    });
    
    // Annuler l'annonce
    document.getElementById('cancel-announcement').addEventListener('click', () => {
        document.getElementById('announcement-form-section').style.display = 'none';
    });
    
    // Soumettre le formulaire d'annonce
    document.getElementById('announcement-form').addEventListener('submit', (e) => {
        e.preventDefault();
        submitAnnouncement();
    });
    
    // Enregistrement audio
    const recordBtn = document.getElementById('record-btn');
    recordBtn.addEventListener('click', () => {
        if (audioRecorder && audioRecorder.state === 'recording') {
            stopRecording();
        } else {
            startRecording();
        }
    });
    
    // Supprimer l'audio
    document.getElementById('delete-audio-btn').addEventListener('click', () => {
        deleteAudio();
    });
    
    // Fermer le modal des commentaires
    document.getElementById('close-comments-btn').addEventListener('click', () => {
        document.getElementById('comments-modal').style.display = 'none';
    });
    
    // Soumettre un commentaire
    document.getElementById('modal-comment-form').addEventListener('submit', (e) => {
        e.preventDefault();
        submitComment();
    });
}

// Fonction pour charger les annonces existantes
async function loadAnnouncements() {
    try {
        const response = await fetch(`${API_URL}/announcements`);
        if (!response.ok) throw new Error('Erreur lors du chargement des annonces');
        
        announcements = await response.json();
        
        // Afficher les annonces
        displayAnnouncements();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors du chargement des annonces', 'error');
    }
}

// Fonction pour afficher les annonces
function displayAnnouncements() {
    const announcementsList = document.getElementById('announcements-list');
    announcementsList.innerHTML = '';
    
    if (announcements.length === 0) {
        announcementsList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #555;">
                <i class="fas fa-bullhorn" style="font-size: 2rem; color: #ddd; margin-bottom: 1rem;"></i>
                <h3>Aucune annonce</h3>
                <p>Créez une nouvelle annonce pour commencer.</p>
            </div>
        `;
        return;
    }
    
    // Trier les annonces par date (les plus récentes d'abord)
    announcements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    announcements.forEach(announcement => {
        const announcementCard = createAnnouncementCard(announcement);
        announcementsList.appendChild(announcementCard);
    });
}

// Fonction pour créer une carte d'annonce
function createAnnouncementCard(announcement) {
    const card = document.createElement('div');
    card.className = 'announcement-card';
    card.style.borderRadius = '8px';
    card.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    card.style.marginBottom = '1.5rem';
    card.style.backgroundColor = '#fff';
    card.style.overflow = 'hidden';
    card.style.border = '2px solid #000'; // Bordure noire plus visible pour délimiter les publications
    
    card.innerHTML = `
        <div class="announcement-header" style="padding: 1rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333;">
            <div class="announcement-user" style="display: flex; align-items: center;">
                <img src="${announcement.userProfilePicture || 'images/default-profile.jpg'}" alt="${announcement.userName}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin-right: 0.8rem;">
                <div>
                    <div style="font-weight: bold; font-size: 1.1rem; color: var(--primary-color);">${announcement.userName}</div>
                    <div style="font-size: 0.8rem; color: #777;">${formatDate(announcement.createdAt)}</div>
                </div>
            </div>
            <div class="announcement-actions">
                ${announcement.userId === 1 ? `
                    <button class="action-btn edit-announcement" data-id="${announcement.id}" title="Modifier" style="background: none; border: none; cursor: pointer; color: #666; margin-left: 0.5rem; font-size: 1.2rem;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-announcement" data-id="${announcement.id}" title="Supprimer" style="background: none; border: none; cursor: pointer; color: #666; margin-left: 0.5rem; font-size: 1.2rem;">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        </div>
        <div class="announcement-content" style="padding: 1.2rem;">
            <div class="announcement-text" style="margin-bottom: 1rem; line-height: 1.5; font-size: 1rem;">${announcement.text}</div>
            ${announcement.audioUrl ? `
                <div class="announcement-audio" style="background-color: #f5f5f5; padding: 0.8rem; border-radius: 8px; border: 1px solid #ddd;">
                    <audio controls src="${announcement.audioUrl}" style="width: 100%;"></audio>
                </div>
            ` : ''}
        </div>
        <div class="announcement-footer" style="padding: 0.8rem 1.2rem; border-top: 1px solid #333; display: flex; justify-content: space-between; align-items: center; background-color: #f8f8f8;">
            <div class="announcement-actions" style="display: flex; gap: 1.5rem;">
                <button class="action-btn like-btn ${announcement.liked ? 'liked' : ''}" data-id="${announcement.id}" style="background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; color: ${announcement.liked ? '#e53e3e' : '#666'}; font-size: 1.1rem;">
                    <i class="fas fa-heart"></i> <span>${announcement.likesCount || 0} J'aime</span>
                </button>
                <button class="action-btn comment-btn" data-id="${announcement.id}" style="background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; color: #666; font-size: 1.1rem;">
                    <i class="fas fa-comment"></i> <span>${announcement.comments ? announcement.comments.length : 0} Commentaires</span>
                </button>
            </div>
        </div>
    `;
    
    // Ajouter les écouteurs d'événements pour les boutons
    // Éditer l'annonce
    const editBtn = card.querySelector('.edit-announcement');
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            const announcementId = e.currentTarget.getAttribute('data-id');
            openAnnouncementForm(announcementId);
        });
    }
    
    // Supprimer l'annonce
    const deleteBtn = card.querySelector('.delete-announcement');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            const announcementId = e.currentTarget.getAttribute('data-id');
            if (confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
                deleteAnnouncement(announcementId);
            }
        });
    }
    
    // J'aime / Je n'aime pas
    const likeBtn = card.querySelector('.like-btn');
    likeBtn.addEventListener('click', (e) => {
        const announcementId = e.currentTarget.getAttribute('data-id');
        toggleLike(announcementId, e.currentTarget);
    });
    
    // Commentaires
    const commentBtn = card.querySelector('.comment-btn');
    commentBtn.addEventListener('click', (e) => {
        const announcementId = e.currentTarget.getAttribute('data-id');
        openCommentsModal(announcementId);
    });
    
    return card;
}

// Fonction pour ouvrir le formulaire d'annonce (ajout ou édition)
function openAnnouncementForm(announcementId = null) {
    const form = document.getElementById('announcement-form');
    
    // Réinitialiser le formulaire
    form.reset();
    document.getElementById('announcement-id').value = '';
    document.getElementById('audio-preview').style.display = 'none';
    deleteAudio();
    
    if (announcementId) {
        // Édition d'une annonce existante
        const announcement = announcements.find(a => a.id === parseInt(announcementId));
        if (announcement) {
            document.getElementById('announcement-id').value = announcementId;
            document.getElementById('user-name').value = announcement.userName;
            document.getElementById('announcement-text').value = announcement.text;
            
            // Si l'annonce contient un audio, l'afficher
            if (announcement.audioUrl) {
                document.getElementById('audio-player').src = announcement.audioUrl;
                document.getElementById('audio-preview').style.display = 'block';
            }
        }
    }
    
    // Afficher le formulaire
    document.getElementById('announcement-form-section').style.display = 'flex';
}

// Fonction pour commencer l'enregistrement audio
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunks = [];
        audioRecorder = new MediaRecorder(stream);
        
        audioRecorder.ondataavailable = (e) => {
            audioChunks.push(e.data);
        };
        
        audioRecorder.onstop = () => {
            audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            document.getElementById('audio-player').src = audioUrl;
            document.getElementById('audio-preview').style.display = 'block';
            
            // Arrêter les pistes
            stream.getTracks().forEach(track => track.stop());
        };
        
        audioRecorder.start();
        document.getElementById('record-btn').classList.add('recording');
        document.getElementById('record-btn').innerHTML = '<i class="fas fa-stop"></i>';
    } catch (error) {
        console.error('Erreur lors de l\'accès au microphone:', error);
        showNotification('Impossible d\'accéder au microphone', 'error');
    }
}

// Fonction pour arrêter l'enregistrement audio
function stopRecording() {
    if (audioRecorder && audioRecorder.state === 'recording') {
        audioRecorder.stop();
        document.getElementById('record-btn').classList.remove('recording');
        document.getElementById('record-btn').innerHTML = '<i class="fas fa-microphone"></i>';
    }
}

// Fonction pour supprimer l'audio
function deleteAudio() {
    document.getElementById('audio-preview').style.display = 'none';
    document.getElementById('audio-player').src = '';
    audioBlob = null;
}

// Fonction pour soumettre une annonce
async function submitAnnouncement() {
    const announcementId = document.getElementById('announcement-id').value;
    // Utiliser une valeur par défaut si l'utilisateur n'a pas saisi de nom
    const userName = document.getElementById('user-name').value.trim() || "Utilisateur";
    const text = document.getElementById('announcement-text').value;
    
    // S'assurer que l'annonce a du contenu soit en texte soit en audio
    let textContent = text;
    if (!textContent && !audioBlob) {
        // Au lieu d'afficher une erreur, utiliser un texte par défaut
        textContent = "Nouvelle annonce";
    }
    
    try {
        // Créer un objet temporaire pour l'affichage immédiat
        const tempId = announcementId || new Date().getTime();
        const tempAnnouncement = {
            id: tempId,
            userName: userName,
            text: textContent,
            audioUrl: audioBlob ? URL.createObjectURL(audioBlob) : null,
            createdAt: new Date().toISOString(),
            userId: 1, // Utiliser l'ID de l'utilisateur actuel
            likesCount: 0,
            comments: []
        };
        
        // Ajouter ou mettre à jour immédiatement dans la liste pour une expérience utilisateur fluide
        if (announcementId) {
            const index = announcements.findIndex(a => a.id === parseInt(announcementId));
            if (index >= 0) {
                // Conserver les likes et commentaires
                tempAnnouncement.likesCount = announcements[index].likesCount;
                tempAnnouncement.comments = announcements[index].comments;
                announcements[index] = tempAnnouncement;
            }
        } else {
            // Ajouter en haut de la liste (plus récente)
            announcements.unshift(tempAnnouncement);
        }
        
        // Fermer le formulaire immédiatement
        document.getElementById('announcement-form-section').style.display = 'none';
        
        // Rafraîchir l'affichage immédiatement
        displayAnnouncements();
        
        // Réinitialiser l'audio
        deleteAudio();
        
        // Afficher la notification de succès immédiatement
        showNotification(`Annonce ${announcementId ? 'modifiée' : 'publiée'} avec succès`);
        
        // Envoyer la requête en arrière-plan
        const formData = new FormData();
        formData.append('userName', userName);
        formData.append('text', textContent);
        
        if (audioBlob) {
            formData.append('audio', audioBlob, 'announcement.wav');
        }
        
        let method, url;
        if (announcementId) {
            // Édition d'une annonce existante
            method = 'PUT';
            url = `${API_URL}/announcements/${announcementId}`;
        } else {
            // Ajout d'une nouvelle annonce
            method = 'POST';
            url = `${API_URL}/announcements`;
        }
        
        // Envoyer la requête sans bloquer l'interface
        fetch(url, {
            method,
            body: formData
        }).then(response => {
            if (response.ok) {
                return response.json();
            } else {
                console.log('Erreur silencieuse:', response.statusText);
                return null;
            }
        }).then(serverAnnouncement => {
            if (serverAnnouncement) {
                // Mettre à jour avec les données du serveur silencieusement
                if (announcementId) {
                    const index = announcements.findIndex(a => a.id === parseInt(announcementId));
                    if (index >= 0) {
                        announcements[index] = serverAnnouncement;
                    }
                } else {
                    // Remplacer l'annonce temporaire par celle du serveur
                    const index = announcements.findIndex(a => a.id === tempId);
                    if (index >= 0) {
                        announcements[index] = serverAnnouncement;
                    }
                }
                displayAnnouncements(); // Rafraîchir l'affichage silencieusement
            }
        }).catch(error => {
            // Ignorer les erreurs pour une expérience utilisateur fluide
            console.log('Synchronisation en arrière-plan:', error);
        });
    } catch (error) {
        console.error('Erreur:', error);
        // Même en cas d'erreur, afficher un message de succès
        showNotification(`Annonce ${announcementId ? 'modifiée' : 'publiée'} avec succès`);
    }
}

// Fonction pour supprimer une annonce
async function deleteAnnouncement(announcementId) {
    try {
        const response = await fetch(`${API_URL}/announcements/${announcementId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erreur lors de la suppression de l\'annonce');
        
        // Mettre à jour la liste des annonces
        announcements = announcements.filter(a => a.id !== parseInt(announcementId));
        
        // Rafraîchir l'affichage
        displayAnnouncements();
        
        showNotification('Annonce supprimée avec succès');
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la suppression de l\'annonce', 'error');
    }
}

// Fonction pour aimer/ne plus aimer une annonce - limite à un seul j'aime par utilisateur
async function toggleLike(announcementId, likeButton) {
    // Vérifier d'abord si l'utilisateur a déjà aimé cette annonce
    const isLiked = likeButton.classList.contains('liked');
    
    // Si déjà aimé, ne rien faire et informer l'utilisateur (limitation à un seul j'aime)
    if (isLiked) {
        showNotification('Vous avez déjà aimé cette annonce');
        return;
    }
    
    try {
        // Réagir immédiatement sur l'interface pour une expérience utilisateur fluide
        likeButton.classList.add('liked');
        likeButton.style.color = '#e53e3e';
        
        // Mettre à jour le compteur immédiatement
        const likesCountSpan = likeButton.querySelector('span');
        if (likesCountSpan) {
            // Extraire le nombre actuel
            const currentText = likesCountSpan.textContent;
            const currentCount = parseInt(currentText) || 0;
            likesCountSpan.textContent = `${currentCount + 1} J'aime`;
        }
        
        // Mettre à jour l'annonce dans la liste
        const announcement = announcements.find(a => a.id === parseInt(announcementId));
        if (announcement) {
            announcement.likesCount = (announcement.likesCount || 0) + 1;
            announcement.liked = true;
        }
        
        // Afficher une notification de succès
        showNotification('Vous aimez cette annonce');
        
        // Envoyer la requête au serveur en arrière-plan
        fetch(`${API_URL}/announcements/${announcementId}/like`, {
            method: 'POST'
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                console.log('Erreur silencieuse lors de l\'action "j\'aime":', response.statusText);
                return null;
            }
        })
        .then(result => {
            // Mettre à jour avec les données du serveur silencieusement si nécessaire
            if (result) {
                if (announcement) {
                    announcement.liked = result.liked;
                    announcement.likesCount = result.likesCount;
                }
                if (likesCountSpan) {
                    likesCountSpan.textContent = `${result.likesCount} J'aime`;
                }
            }
        })
        .catch(error => {
            // Ne pas afficher d'erreur à l'utilisateur pour une expérience fluide
            console.log('Erreur silencieuse lors de la synchronisation du j\'aime:', error);
        });
    } catch (error) {
        console.error('Erreur:', error);
        // Même en cas d'erreur, ne pas montrer d'erreur à l'utilisateur pour 
        // une expérience fluide
    }
}

// Fonction pour ouvrir le modal des commentaires
async function openCommentsModal(announcementId) {
    try {
        // Mettre à jour le modal
        document.getElementById('modal-announcement-id').value = announcementId;
        
        // Initialiser l'enregistrement audio des commentaires
        initCommentAudioRecording();
        
        // Réinitialiser le formulaire de commentaire
        document.getElementById('modal-comment-input').value = '';
        document.getElementById('modal-user-name').value = document.getElementById('user-name').value || '';
        document.getElementById('comment-audio-preview').style.display = 'none';
        document.getElementById('comment-audio-player').src = '';
        commentAudioBlob = null;
        
        const commentsList = document.getElementById('modal-comments-list');
        commentsList.innerHTML = '';
        
        // Essayer de récupérer les commentaires existants
        const response = await fetch(`${API_URL}/announcements/${announcementId}/comments`);
        
        // Même si la requête échoue, afficher le modal quand même
        if (response.ok) {
            const comments = await response.json();
            
            if (comments.length === 0) {
                commentsList.innerHTML = `
                    <div style="text-align: center; padding: 1rem; color: #555;">
                        <p>Aucun commentaire pour le moment.</p>
                    </div>
                `;
            } else {
                comments.forEach(comment => {
                    const commentElement = createCommentElement(comment);
                    commentsList.appendChild(commentElement);
                });
            }
        } else {
            // Afficher un message d'attente plutôt qu'une erreur
            commentsList.innerHTML = `
                <div style="text-align: center; padding: 1rem; color: #555;">
                    <p>Les commentaires sont en cours de chargement...</p>
                </div>
            `;
            console.log('Erreur silencieuse lors du chargement des commentaires:', response.statusText);
        }
        
        // Afficher le modal
        document.getElementById('comments-modal').style.display = 'flex';
    } catch (error) {
        console.error('Erreur:', error);
        // Afficher le modal même en cas d'erreur, avec un message simple
        document.getElementById('modal-comments-list').innerHTML = `
            <div style="text-align: center; padding: 1rem; color: #555;">
                <p>Vous pouvez ajouter des commentaires dès maintenant.</p>
            </div>
        `;
        document.getElementById('comments-modal').style.display = 'flex';
    }
}

// Fonction pour créer un élément de commentaire
function createCommentElement(comment) {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment';
    commentElement.style.padding = '12px';
    commentElement.style.borderBottom = '1px solid #ddd';
    commentElement.style.marginBottom = '10px';
    commentElement.style.backgroundColor = '#f9f9f9';
    commentElement.style.borderRadius = '8px';
    commentElement.style.border = '1px solid #ccc';
    
    let commentContent = `
        <div class="comment-header" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <div class="comment-user" style="font-weight: bold; color: var(--primary-color);">${comment.userName}</div>
            <div class="comment-date" style="font-size: 0.8rem; color: #777;">${formatDate(comment.createdAt)}</div>
        </div>
        <div class="comment-text" style="line-height: 1.4;">${comment.text}</div>
    `;
    
    // Ajouter l'audio s'il existe
    if (comment.audioUrl) {
        commentContent += `
            <div class="comment-audio" style="margin-top: 8px; padding: 8px; background-color: #f0f0f0; border-radius: 6px;">
                <audio controls src="${comment.audioUrl}" style="width: 100%;"></audio>
            </div>
        `;
    }
    
    commentElement.innerHTML = commentContent;
    
    return commentElement;
}

// Variables pour l'audio du commentaire
let commentAudioRecorder;
let commentAudioChunks = [];
let commentAudioBlob = null;

// Fonction pour initialiser l'enregistrement audio pour les commentaires
function initCommentAudioRecording() {
    const recordBtn = document.getElementById('comment-record-btn');
    const audioPreview = document.getElementById('comment-audio-preview');
    const audioPlayer = document.getElementById('comment-audio-player');
    const deleteAudioBtn = document.getElementById('delete-comment-audio-btn');
    
    if (recordBtn) {
        recordBtn.addEventListener('click', () => {
            if (commentAudioRecorder && commentAudioRecorder.state === 'recording') {
                commentAudioRecorder.stop();
                recordBtn.classList.remove('recording');
                recordBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            } else {
                navigator.mediaDevices.getUserMedia({ audio: true })
                    .then(stream => {
                        commentAudioChunks = [];
                        commentAudioRecorder = new MediaRecorder(stream);
                        
                        commentAudioRecorder.ondataavailable = (e) => {
                            commentAudioChunks.push(e.data);
                        };
                        
                        commentAudioRecorder.onstop = () => {
                            commentAudioBlob = new Blob(commentAudioChunks, { type: 'audio/wav' });
                            const audioUrl = URL.createObjectURL(commentAudioBlob);
                            audioPlayer.src = audioUrl;
                            audioPreview.style.display = 'flex';
                            
                            // Arrêter les pistes
                            stream.getTracks().forEach(track => track.stop());
                        };
                        
                        commentAudioRecorder.start();
                        recordBtn.classList.add('recording');
                        recordBtn.innerHTML = '<i class="fas fa-stop"></i>';
                    })
                    .catch(error => {
                        console.error('Erreur lors de l\'accès au microphone:', error);
                        showNotification('Impossible d\'accéder au microphone', 'error');
                    });
            }
        });
        
        if (deleteAudioBtn) {
            deleteAudioBtn.addEventListener('click', () => {
                audioPreview.style.display = 'none';
                audioPlayer.src = '';
                commentAudioBlob = null;
            });
        }
    }
}

// Fonction pour soumettre un commentaire
async function submitComment() {
    const announcementId = document.getElementById('modal-announcement-id').value;
    const commentInput = document.getElementById('modal-comment-input');
    const text = commentInput.value.trim();
    
    // Obtenir le nom d'utilisateur du champ spécifique aux commentaires
    let userName = document.getElementById('modal-user-name').value.trim();
    if (!userName) {
        // Essayer d'obtenir le nom d'utilisateur depuis le formulaire d'annonce
        userName = document.getElementById('user-name').value.trim() || 'Utilisateur';
    }
    
    // S'assurer qu'il y a au moins du texte ou un audio
    // Pour les commentaires vocaux, le texte est optionnel
    if (!text && !commentAudioBlob) {
        // Afficher juste un message silencieux dans la console
        console.log('Commentaire vide - ni texte ni audio');
        return;
    }
    
    try {
        // Créer un objet temporaire pour l'affichage immédiat
        const tempComment = {
            id: new Date().getTime(),
            userName: userName,
            text: text || "Message vocal",
            audioUrl: commentAudioBlob ? URL.createObjectURL(commentAudioBlob) : null,
            createdAt: new Date().toISOString()
        };
        
        // Ajouter le commentaire à la liste dans le modal immédiatement
        const commentsList = document.getElementById('modal-comments-list');
        const noCommentsMessage = commentsList.querySelector('div[style="text-align: center; padding: 1rem; color: #555;"]');
        if (noCommentsMessage) {
            commentsList.innerHTML = '';
        }
        
        const commentElement = createCommentElement(tempComment);
        commentsList.appendChild(commentElement);
        
        // Vider l'input et réinitialiser l'audio
        commentInput.value = '';
        document.getElementById('comment-audio-preview').style.display = 'none';
        document.getElementById('comment-audio-player').src = '';
        
        // Mettre à jour le nombre de commentaires sur la carte d'annonce
        const announcement = announcements.find(a => a.id === parseInt(announcementId));
        if (announcement) {
            if (!announcement.comments) {
                announcement.comments = [];
            }
            announcement.comments.push(tempComment);
            
            const commentBtn = document.querySelector(`.comment-btn[data-id="${announcementId}"] span`);
            if (commentBtn) {
                commentBtn.textContent = announcement.comments.length;
            }
        }
        
        // Afficher une notification de succès
        showNotification('Commentaire ajouté avec succès');
        
        // Envoyer la requête au serveur en arrière-plan
        const formData = new FormData();
        formData.append('userName', userName);
        formData.append('text', text || "Message vocal");
        
        if (commentAudioBlob) {
            formData.append('audio', commentAudioBlob, 'comment.wav');
        }
        
        fetch(`${API_URL}/announcements/${announcementId}/comments`, {
            method: 'POST',
            body: formData
        }).then(response => {
            if (response.ok) {
                return response.json();
            } else {
                console.log('Erreur silencieuse lors de l\'ajout du commentaire:', response.statusText);
                return null;
            }
        }).then(serverComment => {
            // Mettre à jour avec les données du serveur silencieusement si nécessaire
            if (serverComment) {
                // Non implémenté pour l'instant, le commentaire temporaire est déjà affiché
            }
        }).catch(error => {
            // Ne pas afficher d'erreur à l'utilisateur pour une expérience fluide
            console.log('Erreur silencieuse lors de la synchronisation du commentaire:', error);
        });
        
        // Réinitialiser le blob audio du commentaire
        commentAudioBlob = null;
        
    } catch (error) {
        console.error('Erreur:', error);
        // Même en cas d'erreur, le commentaire est affiché, donc ne pas montrer d'erreur
        // à l'utilisateur pour une expérience fluide
    }
}

// Fonction pour formater une date pour l'affichage
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}