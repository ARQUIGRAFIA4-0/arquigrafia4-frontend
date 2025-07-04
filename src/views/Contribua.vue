<template>
  <div class="container-fluid p-4">
    <!-- Tabs -->
    <ul class="nav nav-tabs mb-4">
      <li class="nav-item" v-for="(tab, index) in tabs" :key="index">
        <button 
          class="nav-link" 
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </li>
    </ul>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Envie imagens -->
      <div v-if="activeTab === 'images'" class="tab-pane active">
        <div 
          class="dropzone"
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
          :class="{ 'dropzone-active': isDragging }"
        >
          <div class="dropzone-content text-center">
            <i class="bi bi-plus-circle-dotted"></i>
            <p class="mt-3">Adicione novas imagens ao nosso acervo</p>
            <input
              type="file"
              ref="fileInput"
              multiple
              accept="image/*"
              class="d-none"
              @change="handleFileSelect"
            >
            <button class="btn btn-outline-secondary mt-2" @click="$refs.fileInput.click()">
              Selecionar arquivos
            </button>
          </div>
        </div>
      </div>

      <!-- Other tabs (empty for now) -->
      <div v-else-if="activeTab === 'works'" class="tab-pane active">
        <!-- Cadastre obras content will go here -->
      </div>
      <div v-else-if="activeTab === 'routes'" class="tab-pane active">
        <!-- Crie percursos content will go here -->
      </div>
      <div v-else-if="activeTab === 'evaluate'" class="tab-pane active">
        <!-- Avalie imagens content will go here -->
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      activeTab: 'images',
      isDragging: false,
      tabs: [
        { id: 'images', label: 'Envie imagens' },
        { id: 'works', label: 'Cadastre obras' },
        { id: 'routes', label: 'Crie percursos' },
        { id: 'evaluate', label: 'Avalie imagens' }
      ]
    }
  },
  methods: {
    handleDragOver() {
      this.isDragging = true
    },
    handleDragLeave() {
      this.isDragging = false
    },
    handleDrop(e) {
      this.isDragging = false
      const files = [...e.dataTransfer.files]
      this.handleFiles(files)
    },
    handleFileSelect(e) {
      const files = [...e.target.files]
      this.handleFiles(files)
    },
    handleFiles(files) {
      // Filter for images only
      const imageFiles = files.filter(file => file.type.startsWith('image/'))
      if (imageFiles.length) {
        console.log('Received images:', imageFiles)
        // TODO: Handle file upload
      }
    }
  }
}
</script>

<style scoped>
.nav-tabs {
  border-bottom: 1px solid #dee2e6;
}

.nav-link {
  color: #6c757d;
  border: none;
  padding: 1rem 1.5rem;
  font-weight: 500;
  font-size: 20px;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: #212529;
}

.nav-link.active {
  color: #AA4F28 !important;
  font-weight: 600;
  border: none;
  border-bottom: 2px solid #AA4F28;
}

.dropzone {
  background-color: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 1rem;
  padding: 3rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.dropzone-active {
  background-color: #e9ecef;
  border-color: #AA4F28;
}

.dropzone-content {
  max-width: 400px;
  margin: 0 auto;
}

.dropzone i {
  font-size: 3rem;
  color: #6c757d;
}

.dropzone p {
  color: #6c757d;
  font-size: 1.1rem;
  margin-bottom: 0;
}

.dropzone:hover {
  background-color: #e9ecef;
}
</style>