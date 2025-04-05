<template>
  <div class="search-pair-container">
    <label for="pairInput">Changer de Paire via API :</label>
    <div class="search-controls">
      <input
        id="pairInput"
        type="text"
        v-model="searchInput"
        placeholder="Ex: ETHUSDT, BTCUSDT..."
        @keyup.enter="submitNewPairViaApi"
        :disabled="isLoading"
      />
      <button @click="submitNewPairViaApi" :disabled="!canSubmit || isLoading">
        {{ isLoading ? 'Chargement...' : 'Suivre' }}
      </button>
    </div>
    <div v-if="searchStatusMessage" :class="statusClass">
      {{ searchStatusMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const searchInput = ref('');
const searchStatusMessage = ref(null); // Pour succès ou erreur
const isLoading = ref(false);
const isError = ref(false); // Pour le style du message

// Calculer si le bouton doit être actif
const canSubmit = computed(() => searchInput.value.trim() !== '');

// Classe CSS dynamique pour le message de statut
const statusClass = computed(() => ({
    'status-message': true,
    'success': !isError.value,
    'error': isError.value
}));


const submitNewPairViaApi = async () => {
  const pair = searchInput.value.toUpperCase().trim();

  searchStatusMessage.value = null; // Réinitialiser
  isError.value = false;

  if (!pair) {
    searchStatusMessage.value = "Veuillez entrer un symbole de paire.";
    isError.value = true;
    return;
  }

  // Validation simple du format (peut être affinée)
  if (!/^[A-Z]{3,}[A-Z]{3,}$/.test(pair)) {
    searchStatusMessage.value = "Format invalide (ex: BTCUSDT).";
    isError.value = true;
    return;
  }

  isLoading.value = true; // Indiquer le chargement

  try {
    // URL de l'API backend
    const apiUrl = 'http://localhost:8080/api/set-pair'; // Assurez-vous que le port est correct

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pair: pair }) // Envoyer la paire dans le corps
    });

    const result = await response.json(); // Toujours essayer de lire le JSON

    if (!response.ok) {
      // Si le statut HTTP n'est pas 2xx, c'est une erreur gérée par le backend
      throw new Error(result.error || `Erreur HTTP ${response.status}`);
    }

    // Succès ! Le backend a accepté la demande.
    console.log('SearchPair: Requête API réussie:', result);
    searchStatusMessage.value = result.message || `Paire ${pair} suivie.`; // Afficher le message du backend
    isError.value = false;
    searchInput.value = ''; // Vider le champ en cas de succès

  } catch (error) {
    console.error('SearchPair: Erreur lors de l\'appel API:', error);
    // Afficher l'erreur (venant du backend via throw ou erreur réseau)
    searchStatusMessage.value = error.message || 'Une erreur réseau est survenue.';
    isError.value = true;
  } finally {
    isLoading.value = false; // Fin du chargement dans tous les cas
  }
};
</script>

<style scoped>
/* Styles existants pour .search-pair-container, .search-controls, input, button */
/* Assurez-vous qu'ils sont toujours là */
.search-pair-container {
  font-family: sans-serif;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fdfdfd;
  margin-bottom: 20px;
  max-width: 400px; /* Limiter la largeur */
}

label {
    display: block;
    margin-bottom: 8px;
    font-weight: bold;
    color: #555;
}

.search-controls {
    display: flex;
    gap: 10px;
}

.search-controls input[type="text"] {
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    flex-grow: 1; /* Prend l'espace */
    font-size: 1em;
}

.search-controls button {
    padding: 10px 18px;
    border: none;
    background-color: #007bff; /* Bleu */
    color: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1em;
    transition: background-color 0.2s ease;
    white-space: nowrap; /* Empêcher le texte du bouton de passer à la ligne */
}

.search-controls button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

.search-controls button:hover:not(:disabled) {
    background-color: #0056b3;
}

/* Nouveau style pour le message de statut */
.status-message {
    font-size: 0.9em;
    margin-top: 10px;
    padding: 8px;
    border-radius: 4px;
    text-align: center;
}
.status-message.success {
    color: #155724; /* Vert Bootstrap */
    background-color: #d4edda; /* Vert clair Bootstrap */
    border: 1px solid #c3e6cb;
}
.status-message.error {
    color: #721c24; /* Rouge Bootstrap */
    background-color: #f8d7da; /* Rouge clair Bootstrap */
    border: 1px solid #f5c6cb;
}
</style>
