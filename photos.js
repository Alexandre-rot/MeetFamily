// Variables globales
// Définir l'API_URL
const API_URL = '/api';

// Utiliser var au lieu de let/const pour permettre la redéclaration
var photos = [];
var currentPhotoIndex = 0;

// Exécuter quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    // Initialiser les événements
    initEventListeners();
    
    // Charger les photos
    loadPhotos();
    
    // Note: loadUserProfile() est appelé dans main.js pour toutes les pages
});

// La fonction loadUserProfile est maintenant fournie par main.js

// Fonction pour initialiser les écouteurs d'événements
function initEventListeners() {
    // Bouton d'upload
    const uploadBtn = document.getElementById('upload-btn');
    const photoInput = document.getElementById('photo-input');
    
    uploadBtn.addEventListener('click', () => {
        photoInput.click();
    });
    
    // Sélection de fichiers
    photoInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            // Afficher les photos immédiatement dans une prévisualisation
            const files = Array.from(e.target.files);
            const imageFiles = files.filter(file => file.type.startsWith('image/'));
            
            if (imageFiles.length === 0) {
                showNotification('Veuillez sélectionner des fichiers image', 'error');
                return;
            }
            
            // Montrer une prévisualisation immédiate avant l'upload
            showPhotoPreview(imageFiles);
            
            // Puis les uploader sur le serveur
            uploadPhotos(imageFiles);
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
            // Afficher les photos immédiatement dans une prévisualisation
            const files = Array.from(e.dataTransfer.files);
            const imageFiles = files.filter(file => file.type.startsWith('image/'));
            
            if (imageFiles.length === 0) {
                showNotification('Veuillez sélectionner des fichiers image', 'error');
                return;
            }
            
            // Montrer une prévisualisation immédiate avant l'upload
            showPhotoPreview(imageFiles);
            
            // Puis les uploader sur le serveur
            uploadPhotos(imageFiles);
        }
    });
    
    // Modal
    const modal = document.getElementById('photo-modal');
    const modalClose = document.getElementById('modal-close');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    modalClose.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    prevBtn.addEventListener('click', showPreviousPhoto);
    nextBtn.addEventListener('click', showNextPhoto);
    
    // Navigation avec les touches du clavier
    document.addEventListener('keydown', (e) => {
        if (modal.style.display === 'block') {
            if (e.key === 'ArrowLeft') {
                showPreviousPhoto();
            } else if (e.key === 'ArrowRight') {
                showNextPhoto();
            } else if (e.key === 'Escape') {
                modal.style.display = 'none';
            }
        }
    });
}

// Fonction pour charger les photos
async function loadPhotos() {
    try {
        const response = await fetch(`${API_URL}/photos`);
        if (!response.ok) throw new Error('Erreur lors du chargement des photos');
        
        photos = await response.json();
        
        // Afficher les photos
        displayPhotos();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors du chargement des photos', 'error');
    }
}

// Fonction pour afficher les photos
function displayPhotos() {
    const photosGrid = document.getElementById('photos-grid');
    photosGrid.innerHTML = '';
    
    if (photos.length === 0) {
        photosGrid.innerHTML = `
            <div class="no-photos">
                <i class="fas fa-images"></i>
                <h3>Aucune photo</h3>
                <p>Ajoutez des photos pour commencer votre galerie.</p>
            </div>
        `;
        return;
    }
    
    // Trier les photos par date (les plus récentes d'abord)
    photos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    photos.forEach((photo, index) => {
        const photoCard = document.createElement('div');
        photoCard.className = 'photo-card';
        photoCard.innerHTML = `
            <img src="${photo.url}" alt="Photo de famille" loading="lazy">
            <div class="photo-overlay">
                <div class="photo-date">${formatDate(photo.createdAt)}</div>
                <div class="photo-actions">
                    <button class="photo-action-btn" title="Supprimer" data-id="${photo.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Ajouter un événement de clic pour ouvrir le modal
        photoCard.addEventListener('click', (e) => {
            // Ne pas ouvrir le modal si on a cliqué sur le bouton de suppression
            if (e.target.closest('.photo-action-btn')) return;
            
            openPhotoModal(index);
        });
        
        // Ajouter un événement de double-clic pour supprimer la photo
        photoCard.addEventListener('dblclick', () => {
            const photoId = photo.id;
            if (confirm('Voulez-vous vraiment supprimer cette photo ?')) {
                deletePhoto(photoId);
            }
        });
        
        // Ajouter un événement de clic droit (contextmenu) pour supprimer la photo
        photoCard.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Empêcher le menu contextuel par défaut
            const photoId = photo.id;
            if (confirm('Voulez-vous vraiment supprimer cette photo ?')) {
                deletePhoto(photoId);
            }
        });
        
        // Ajouter un événement de clic pour le bouton de suppression
        const deleteBtn = photoCard.querySelector('.photo-action-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Empêcher la propagation pour ne pas déclencher l'ouverture du modal
            const photoId = deleteBtn.getAttribute('data-id');
            if (confirm('Voulez-vous vraiment supprimer cette photo ?')) {
                deletePhoto(photoId);
            }
        });
        
        photosGrid.appendChild(photoCard);
    });
}

// Fonction pour télécharger des photos
async function uploadPhotos(files) {
    // Vérifier que les fichiers sont des images
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        showNotification('Veuillez sélectionner des fichiers image', 'error');
        return;
    }
    
    try {
        // Créer un FormData pour chaque image et les télécharger en parallèle
        const uploadPromises = imageFiles.map(async (file) => {
            const formData = new FormData();
            formData.append('photo', file);
            
            const response = await fetch(`${API_URL}/photos`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) throw new Error(`Erreur lors de l'upload de ${file.name}`);
            
            return await response.json();
        });
        
        const results = await Promise.all(uploadPromises);
        
        // Ajouter les nouvelles photos à notre liste
        photos = [...photos, ...results];
        
        // Mettre à jour l'affichage
        displayPhotos();
        
        // Notification discrète pour ne pas interrompre l'expérience utilisateur
        // showNotification(`${results.length} photo(s) ajoutée(s) avec succès`);
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors du téléchargement des photos', 'error');
    }
}

// Fonction pour supprimer une photo
async function deletePhoto(photoId) {
    try {
        const response = await fetch(`${API_URL}/photos/${photoId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erreur lors de la suppression de la photo');
        
        // Supprimer la photo de notre liste
        photos = photos.filter(photo => photo.id !== parseInt(photoId));
        
        // Mettre à jour l'affichage
        displayPhotos();
        
        showNotification('Photo supprimée avec succès');
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la suppression de la photo', 'error');
    }
}

// Fonction pour ouvrir le modal avec une photo spécifique
function openPhotoModal(index) {
    currentPhotoIndex = index;
    const modal = document.getElementById('photo-modal');
    const modalImage = document.getElementById('modal-image');
    
    modalImage.src = photos[index].url;
    modal.style.display = 'block';
}

// Fonction pour afficher la photo précédente
function showPreviousPhoto() {
    if (photos.length <= 1) return;
    
    currentPhotoIndex = (currentPhotoIndex === 0) ? photos.length - 1 : currentPhotoIndex - 1;
    const modalImage = document.getElementById('modal-image');
    modalImage.src = photos[currentPhotoIndex].url;
}

// Fonction pour afficher la photo suivante
function showNextPhoto() {
    if (photos.length <= 1) return;
    
    currentPhotoIndex = (currentPhotoIndex === photos.length - 1) ? 0 : currentPhotoIndex + 1;
    const modalImage = document.getElementById('modal-image');
    modalImage.src = photos[currentPhotoIndex].url;
}

// Fonction pour afficher une prévisualisation des photos avant l'upload
function showPhotoPreview(files) {
    const photosGrid = document.getElementById('photos-grid');
    
    // Garder les photos existantes s'il y en a
    if (photos.length === 0) {
        photosGrid.innerHTML = '';
    }
    
    // Ajouter les nouvelles photos en prévisualisation
    files.forEach((file) => {
        // Créer un URL temporaire pour la prévisualisation
        const photoUrl = URL.createObjectURL(file);
        
        // Créer une carte de photo temporaire
        const photoCard = document.createElement('div');
        photoCard.className = 'photo-card preview-card';
        photoCard.setAttribute('data-filename', file.name); // Stocker le nom du fichier
        
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
        
        photoCard.innerHTML = `
            <img src="${photoUrl}" alt="Prévisualisation" loading="lazy">
            <div class="photo-overlay">
                <div class="photo-date">${dateFormatted}</div>
                <div class="photo-actions">
                    <button class="photo-action-btn" title="Supprimer" onclick="removePreviewPhoto(this)">
                        <i class="fas fa-trash"></i>
                    </button>
                    <a href="${photoUrl}" download="${file.name}" class="photo-action-btn" title="Télécharger">
                        <i class="fas fa-download"></i>
                    </a>
                </div>
            </div>
        `;
        
        // Ajouter au début de la grille
        if (photosGrid.firstChild) {
            photosGrid.insertBefore(photoCard, photosGrid.firstChild);
        } else {
            photosGrid.appendChild(photoCard);
        }
    });
}

// Fonction pour supprimer une photo de la prévisualisation
function removePreviewPhoto(button) {
    // Trouver la carte parent
    const photoCard = button.closest('.photo-card');
    if (photoCard) {
        // Récupérer le nom du fichier pour l'afficher dans le message de confirmation
        const fileName = photoCard.getAttribute('data-filename');
        
        // Demander confirmation avant de supprimer
        if (confirm(`Voulez-vous vraiment supprimer la photo "${fileName || 'sans nom'}" ?`)) {
            // Supprimer la carte
            photoCard.remove();
            showNotification('Photo supprimée de la prévisualisation');
        }
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