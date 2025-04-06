<template>
  <div class="search-pair component-container rounded shadow gradient-background">
    <h3>Search Pair</h3>
    <div class="search-input-container">
      <input
        type="text"
        v-model="searchPair"
        @input="handleSearch"
        placeholder="Enter pair (e.g., BTCUSDT)"
      />
      <ul v-if="suggestions.length > 0" class="suggestions-list">
        <li v-for="suggestion in displayedSuggestions" :key="suggestion" @click="selectSuggestion(suggestion)">
          {{ suggestion }}
        </li>
      </ul>
    </div>
    <button @click="setPair">Set Pair</button>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';

const searchPair = ref('');
const suggestions = ref([]);
const allPairs = ref([]); // Stocke toutes les paires disponibles
const maxSuggestions = 4; // Limite le nombre de suggestions à 4

// Fonction pour récupérer toutes les paires disponibles
const fetchAllPairs = async () => {
  try {
    const response = await fetch('http://localhost:8080/api/all-pairs'); // Use the new route
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.allPairs) {
      allPairs.value = data.allPairs;
    } else {
      console.warn('SearchPair: No pairs found in response.');
    }
  } catch (error) {
    console.error('SearchPair: Error fetching all pairs:', error);
  }
};

// Fonction pour filtrer les suggestions
const filterSuggestions = (query) => {
  if (!query) {
    suggestions.value = [];
    return;
  }
  const normalizedQuery = query.toUpperCase();
  suggestions.value = allPairs.value.filter((pair) =>
    pair.includes(normalizedQuery)
  );
};

// Gère la recherche
const handleSearch = (event) => {
  searchPair.value = event.target.value;
};

// Sélectionne une suggestion
const selectSuggestion = (suggestion) => {
  searchPair.value = suggestion;
  // Remove the selected suggestion from the list
  suggestions.value = suggestions.value.filter(s => s !== suggestion);
};

// Définit la paire
const setPair = async () => {
  if (!searchPair.value) {
    console.error('SearchPair: Pair is empty.');
    return;
  }
  try {
    const response = await fetch('http://localhost:8080/api/set-pair', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pair: searchPair.value }),
    });

    if (!response.ok) {
      const result = await response.json();
      console.error('SearchPair: Failed to set pair:', result.error || `HTTP error! status: ${response.status}`);
      return;
    }

    const result = await response.json();
    console.log('SearchPair: Pair set successfully:', result.pair);
    // suggestions.value = []; // Efface les suggestions après la validation (removed)
  } catch (error) {
    console.error('SearchPair: Error setting pair:', error);
  }
};

// Surveille les changements dans searchPair pour filtrer les suggestions
watch(searchPair, (newQuery) => {
  filterSuggestions(newQuery);
});

// Récupère toutes les paires au montage du composant
onMounted(() => {
  fetchAllPairs();
});

// Affiche uniquement les 4 premières suggestions
const displayedSuggestions = computed(() => {
  return suggestions.value.slice(0, maxSuggestions);
});
</script>

<style scoped>
.search-pair {
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative; /* Pour positionner la liste des suggestions */
}

.search-pair input {
  background-color: var(--dark-background);
}

.suggestions-list {
  position: absolute;
  top: 100%; /* Place la liste sous l'input */
  left: 0;
  width: 100%;
  background-color: var(--dark-background);
  border: 1px solid var(--dark-border);
  list-style: none;
  padding: 0;
  margin: 0;
  z-index: 10; /* Pour que la liste soit au-dessus des autres éléments */
}

.suggestions-list li {
  padding: 5px;
  cursor: pointer;
}

.suggestions-list li:hover {
  background-color: var(--dark-border);
}
.search-input-container {
  position: relative;
}
</style>
