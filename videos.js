// Variables globales
// Définir l'API_URL
const API_URL = '/api';

// Utiliser var au lieu de let/const pour permettre la redéclaration
var videos = [];

// Exécuter quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    // Initialiser les événements
    initEventListeners();
    
    // Charger les vidéos
    loadVideos();
    
    // Note: loadUserProfile() est appelé dans main.js pour toutes les pages
});

// La fonction loadUserProfile est maintenant fournie par main.js

// Fonction pour initialiser les écouteurs d'événements
function initEventListeners() {
    // Bouton d'upload
    const uploadBtn = document.getElementById('upload-btn');
    const videoInput = document.getElementById('video-input');
    
    uploadBtn.addEventListener('click', () => {
        videoInput.click();
    });
    
    // Sélection de fichiers
    videoInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            // Afficher les vidéos immédiatement en prévisualisation
            const files = Array.from(e.target.files);
            const videoFiles = files.filter(file => file.type.startsWith('video/'));
            
            if (videoFiles.length === 0) {
                showNotification('Veuillez sélectionner des fichiers vidéo', 'error');
                return;
            }
            
            // Montrer une prévisualisation immédiate avant l'upload
            showVideoPreview(videoFiles);
            
            // Puis les uploader sur le serveur
            uploadVideos(videoFiles);
            e.target.value = ''; // Réinitialiser pour permettre la sélection des mêmes fichiers
        }
    });
    
    // Glisser-déposer sur la zone d'upload
    const uploadArea = document.querySelector('.upload-area');
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = "#4CAF50";
        uploadArea.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = "#673AB7";
        uploadArea.style.backgroundColor = 'rgba(103, 58, 183, 0.05)';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = "#673AB7";
        uploadArea.style.backgroundColor = 'rgba(103, 58, 183, 0.05)';
        
        if (e.dataTransfer.files.length > 0) {
            // Afficher les vidéos immédiatement en prévisualisation
            const files = Array.from(e.dataTransfer.files);
            const videoFiles = files.filter(file => file.type.startsWith('video/'));
            
            if (videoFiles.length === 0) {
                showNotification('Veuillez sélectionner des fichiers vidéo', 'error');
                return;
            }
            
            // Montrer une prévisualisation immédiate avant l'upload
            showVideoPreview(videoFiles);
            
            // Puis les uploader sur le serveur
            uploadVideos(videoFiles);
        }
    });
    
    // Modal
    const modal = document.getElementById('video-modal');
    const modalClose = document.getElementById('modal-close');
    
    modalClose.addEventListener('click', () => {
        document.getElementById('modal-video').pause();
        modal.style.display = 'none';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.getElementById('modal-video').pause();
            modal.style.display = 'none';
        }
    });
    
    // Fermer avec Echap
    document.addEventListener('keydown', (e) => {
        if (modal.style.display === 'block' && e.key === 'Escape') {
            document.getElementById('modal-video').pause();
            modal.style.display = 'none';
        }
    });
}

// Fonction pour charger les vidéos
async function loadVideos() {
    try {
        const response = await fetch(`${API_URL}/videos`);
        if (!response.ok) throw new Error('Erreur lors du chargement des vidéos');
        
        videos = await response.json();
        
        // Afficher les vidéos
        displayVideos();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors du chargement des vidéos', 'error');
    }
}

// Fonction pour afficher les vidéos
function displayVideos() {
    const videosGrid = document.getElementById('videos-grid');
    videosGrid.innerHTML = '';
    
    if (videos.length === 0) {
        videosGrid.innerHTML = `
            <div class="no-videos">
                <i class="fas fa-video"></i>
                <h3>Aucune vidéo</h3>
                <p>Ajoutez des vidéos pour commencer votre galerie.</p>
            </div>
        `;
        return;
    }
    
    // Trier les vidéos par date (les plus récentes d'abord)
    videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    videos.forEach((video) => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        
        // Utiliser soit la miniature générée, soit une image par défaut
        const thumbnailUrl = video.thumbnailUrl || 'images/video-placeholder.jpg';
        
        videoCard.innerHTML = `
            <div class="video-thumbnail" data-url="${video.url}">
                <img src="${thumbnailUrl}" alt="Miniature vidéo">
                <div class="video-play-button">
                    <i class="fas fa-play"></i>
                </div>
            </div>
            <div class="video-info">
                <h3 class="video-title">${video.title || 'Vidéo sans titre'}</h3>
                <div class="video-details">
                    <span class="video-duration">
                        <i class="fas fa-clock"></i> ${video.duration || '00:00'}
                    </span>
                    <span class="video-date">
                        <i class="fas fa-calendar-day"></i> ${formatDate(video.createdAt)}
                    </span>
                </div>
                <div class="video-actions">
                    <a href="${video.url}" download class="video-action-btn download-btn" title="Télécharger">
                        <i class="fas fa-download"></i> Télécharger
                    </a>
                    <button class="video-action-btn delete-btn" data-id="${video.id}" title="Supprimer">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </div>
        `;
        
        // Ajouter un événement de clic pour lire la vidéo directement dans la carte
        const thumbnail = videoCard.querySelector('.video-thumbnail');
        thumbnail.addEventListener('click', (e) => {
            e.preventDefault();
            const videoUrl = thumbnail.getAttribute('data-url');
            const thumbnailImg = thumbnail.querySelector('img');
            const playButton = thumbnail.querySelector('.video-play-button');
            
            // Créer une vidéo pour remplacer la miniature
            const videoElement = document.createElement('video');
            videoElement.src = videoUrl;
            videoElement.controls = true;
            videoElement.autoplay = true;
            videoElement.style.width = '100%';
            videoElement.style.height = '100%';
            videoElement.style.objectFit = 'cover';
            videoElement.style.borderRadius = '8px';
            
            // Remplacer la miniature par la vidéo
            if (thumbnailImg) thumbnailImg.style.display = 'none';
            if (playButton) playButton.style.display = 'none';
            thumbnail.appendChild(videoElement);
            
            // Ajouter des événements pour rétablir la miniature lorsque la vidéo se termine
            videoElement.addEventListener('ended', () => {
                if (thumbnailImg) thumbnailImg.style.display = '';
                if (playButton) playButton.style.display = '';
                videoElement.remove();
            });
        });
        
        // Empêcher la propagation du clic sur le bouton de téléchargement
        const downloadBtn = videoCard.querySelector('.download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Éviter de déclencher l'événement de clic de la miniature
            });
        }
        
        // Ajouter un événement de clic pour le bouton de suppression
        const deleteBtn = videoCard.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Éviter de déclencher l'événement de clic de la miniature
                const videoId = deleteBtn.getAttribute('data-id');
                if (confirm('Voulez-vous vraiment supprimer cette vidéo ?')) {
                    deleteVideo(videoId);
                }
            });
        }
        
        videosGrid.appendChild(videoCard);
    });
}

// Fonction pour télécharger des vidéos avec le maximum de parallélisme
async function uploadVideos(files) {
    // Vérifier que les fichiers sont des vidéos
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    
    if (videoFiles.length === 0) {
        showNotification('Veuillez sélectionner des fichiers vidéo', 'error');
        return;
    }
    
    try {
        // Créer un tableau pour stocker les promesses pour chaque fichier
        const uploadTasks = [];
        
        // Lancer tous les uploads en parallèle
        for (const file of videoFiles) {
            const uploadTask = async () => {
                try {
                    // Générer une miniature pour la vidéo en arrière-plan
                    const thumbnailPromise = generateThumbnail(file);
                    const durationPromise = getVideoDuration(file);
                    
                    // Attendre que les métadonnées soient générées
                    const [thumbnailUrl, duration] = await Promise.all([thumbnailPromise, durationPromise]);
                    
                    // Créer et envoyer le formulaire
                    const formData = new FormData();
                    formData.append('video', file);
                    formData.append('thumbnailUrl', thumbnailUrl);
                    formData.append('duration', duration);
                    formData.append('title', file.name.replace(/\.[^/.]+$/, '')); // Nom du fichier sans extension
                    
                    const response = await fetch(`${API_URL}/videos`, {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (!response.ok) throw new Error(`Erreur lors de l'upload de ${file.name}`);
                    
                    const result = await response.json();
                    
                    // Ajouter la nouvelle vidéo à notre liste et mettre à jour l'affichage
                    videos.push(result);
                    displayVideos();
                    
                    return result;
                } catch (error) {
                    console.error(`Erreur lors de l'upload de ${file.name}:`, error);
                    return null;
                }
            };
            
            uploadTasks.push(uploadTask());
        }
        
        // Attendre que tous les uploads soient terminés
        await Promise.all(uploadTasks);
        
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors du téléchargement des vidéos', 'error');
    }
}

// Fonction pour obtenir la durée d'une vidéo
function getVideoDuration(videoFile) {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = () => {
            // Formatage de la durée (secondes -> MM:SS)
            const minutes = Math.floor(video.duration / 60);
            const seconds = Math.floor(video.duration % 60);
            const formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            resolve(formattedDuration);
            
            // Libérer les ressources
            URL.revokeObjectURL(video.src);
        };
        
        video.onerror = () => {
            resolve('00:00'); // Durée par défaut en cas d'erreur
            URL.revokeObjectURL(video.src);
        };
        
        video.src = URL.createObjectURL(videoFile);
    });
}

// Fonction pour générer une miniature pour une vidéo
function generateThumbnail(videoFile) {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        video.preload = 'metadata';
        
        video.onloadedmetadata = () => {
            // Définir le temps de la miniature (par exemple, 1 seconde)
            video.currentTime = 1;
        };
        
        video.onseeked = () => {
            // Capturer une image à partir de la vidéo
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convertir le canvas en URL de données (base64)
            const thumbnailUrl = canvas.toDataURL('image/jpeg');
            resolve(thumbnailUrl);
            
            // Libérer les ressources
            URL.revokeObjectURL(video.src);
        };
        
        video.onerror = () => {
            resolve('images/video-placeholder.jpg'); // Image par défaut en cas d'erreur
            URL.revokeObjectURL(video.src);
        };
        
        video.src = URL.createObjectURL(videoFile);
    });
}

// Fonction pour supprimer une vidéo
async function deleteVideo(videoId) {
    try {
        const response = await fetch(`${API_URL}/videos/${videoId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erreur lors de la suppression de la vidéo');
        
        // Supprimer la vidéo de notre liste
        videos = videos.filter(video => video.id !== parseInt(videoId));
        
        // Mettre à jour l'affichage
        displayVideos();
        
        showNotification('Vidéo supprimée avec succès');
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la suppression de la vidéo', 'error');
    }
}

// Fonction pour ouvrir le modal avec une vidéo spécifique
function openVideoModal(videoUrl) {
    const modal = document.getElementById('video-modal');
    const modalVideo = document.getElementById('modal-video');
    
    modalVideo.src = videoUrl;
    modal.style.display = 'block';
    modalVideo.play();
}

// Fonction pour afficher une prévisualisation des vidéos avant l'upload
function showVideoPreview(files) {
    const videosGrid = document.getElementById('videos-grid');
    
    // Garder les vidéos existantes s'il y en a
    if (videos.length === 0) {
        videosGrid.innerHTML = '';
    }
    
    // Ajouter les nouvelles vidéos en prévisualisation
    files.forEach(async (file) => {
        try {
            // Générer une miniature pour la vidéo
            const thumbnailUrl = await generateThumbnail(file);
            const duration = await getVideoDuration(file);
            
            // Créer une carte de vidéo temporaire
            const videoCard = document.createElement('div');
            videoCard.className = 'video-card preview-card';
            videoCard.setAttribute('data-filename', file.name); // Stocker le nom du fichier
            
            // Créer un URL temporaire pour la prévisualisation
            const videoUrl = URL.createObjectURL(file);
            
            // Date et heure actuelles formatées (avec heures et minutes)
            const now = new Date();
            const dateFormatted = new Intl.DateTimeFormat('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }).format(now);
            
            videoCard.innerHTML = `
                <div class="video-thumbnail" data-url="${videoUrl}">
                    <img src="${thumbnailUrl}" alt="Miniature vidéo">
                    <div class="video-play-button">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
                <div class="video-info">
                    <h3 class="video-title">${file.name.replace(/\.[^/.]+$/, '')}</h3>
                    <div class="video-details">
                        <span class="video-duration">
                            <i class="fas fa-clock"></i> ${duration || '00:00'}
                        </span>
                        <span class="video-date">
                            <i class="fas fa-calendar-alt"></i> ${dateFormatted}
                        </span>
                    </div>
                    <div class="video-actions" style="display: flex; gap: 10px; margin-top: 10px;">
                        <a href="${videoUrl}" download="${file.name}" class="btn btn-secondary" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">
                            <i class="fas fa-download"></i> Télécharger
                        </a>
                        <button class="btn" style="background-color: #f44336; font-size: 0.8rem; padding: 0.4rem 0.8rem;" onclick="removePreviewVideo(this)">
                            <i class="fas fa-trash"></i> Supprimer
                        </button>
                    </div>
                </div>
            `;
            
            // Ajouter un événement de clic pour lire la vidéo directement dans la carte
            const thumbnail = videoCard.querySelector('.video-thumbnail');
            thumbnail.addEventListener('click', (e) => {
                e.preventDefault();
                const url = thumbnail.getAttribute('data-url');
                const thumbnailImg = thumbnail.querySelector('img');
                const playButton = thumbnail.querySelector('.video-play-button');
                
                // Créer une vidéo pour remplacer la miniature
                const videoElement = document.createElement('video');
                videoElement.src = url;
                videoElement.controls = true;
                videoElement.autoplay = true;
                videoElement.style.width = '100%';
                videoElement.style.height = '100%';
                videoElement.style.objectFit = 'cover';
                videoElement.style.borderRadius = '8px';
                
                // Remplacer la miniature par la vidéo
                if (thumbnailImg) thumbnailImg.style.display = 'none';
                if (playButton) playButton.style.display = 'none';
                thumbnail.appendChild(videoElement);
                
                // Ajouter des événements pour rétablir la miniature lorsque la vidéo se termine
                videoElement.addEventListener('ended', () => {
                    if (thumbnailImg) thumbnailImg.style.display = '';
                    if (playButton) playButton.style.display = '';
                    videoElement.remove();
                });
            });
            
            // Ajouter au début de la grille
            if (videosGrid.firstChild) {
                videosGrid.insertBefore(videoCard, videosGrid.firstChild);
            } else {
                videosGrid.appendChild(videoCard);
            }
        } catch (error) {
            console.error('Erreur lors de la génération de la prévisualisation:', error);
        }
    });
}

// Fonction pour supprimer une vidéo de la prévisualisation
function removePreviewVideo(button) {
    // Trouver la carte parent
    const videoCard = button.closest('.video-card');
    if (videoCard) {
        // Récupérer le nom du fichier pour l'afficher dans le message de confirmation
        const fileName = videoCard.getAttribute('data-filename');
        
        // Demander confirmation avant de supprimer
        if (confirm(`Voulez-vous vraiment supprimer la vidéo "${fileName || 'sans nom'}" ?`)) {
            // Supprimer la carte
            videoCard.remove();
            showNotification('Vidéo supprimée de la prévisualisation');
        }
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