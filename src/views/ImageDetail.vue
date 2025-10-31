<template>
  <div class="container py-4">
    <div class="row">
      <!-- Image Section -->
      <div class="col-md-8">
        <div class="image-container">
          <div
            v-if="loading"
            class="loading-overlay d-flex align-items-center justify-content-center"
          >
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          <img
            v-if="image"
            :src="image.imageUrl"
            :alt="image.title"
            class="img-fluid rounded"
            @load="loading = false"
          />
        </div>
      </div>

      <!-- Metadata Section -->
      <div class="col-md-4">
        <h1 class="h3 mb-4">{{ image?.title || "Loading..." }}</h1>

        <!-- Basic Info -->
        <div class="metadata-section">
          <h2 class="h5 mb-3">Information</h2>
          <dl class="row">
            <dt class="col-sm-4">Author</dt>
            <dd class="col-sm-8">{{ image?.author || "Unknown" }}</dd>

            <dt class="col-sm-4">Date</dt>
            <dd class="col-sm-8">{{ image?.date || "-" }}</dd>

            <dt class="col-sm-4">Location</dt>
            <dd class="col-sm-8">{{ image?.location || "-" }}</dd>
          </dl>
        </div>

        <!-- Description -->
        <div class="metadata-section">
          <h2 class="h5 mb-3">Description</h2>
          <p class="text-muted">
            {{ image?.description || "No description available." }}
          </p>
        </div>

        <!-- Tags -->
        <div class="metadata-section" v-if="image?.tags?.length">
          <h2 class="h5 mb-3">Tags</h2>
          <div class="tags">
            <span
              v-for="tag in image.tags"
              :key="tag"
              class="badge bg-light text-dark me-2 mb-2"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="metadata-section">
          <h2 class="h5 mb-3">Actions</h2>
          <div class="d-grid gap-2 d-md-block">
            <button class="btn btn-outline-primary me-2">
              <i class="bi bi-download me-2"></i>Download
            </button>
            <button class="btn btn-outline-primary">
              <i class="bi bi-share me-2"></i>Share
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Comments and Suggestions Tabs -->
    <div class="row mt-4">
      <div class="col-12">
        <ul class="nav nav-tabs">
          <li class="nav-item">
            <button
              class="nav-link"
              :class="{ active: activeTab === 'comments' }"
              @click="activeTab = 'comments'"
            >
              Comentários
            </button>
          </li>
          <li class="nav-item">
            <button
              class="nav-link"
              :class="{ active: activeTab === 'suggestions' }"
              @click="activeTab = 'suggestions'"
            >
              Sugestões
            </button>
          </li>
        </ul>

        <div class="tab-content mt-4">
          <!-- Comments Tab -->
          <div v-if="activeTab === 'comments'" class="tab-pane active">
            <div v-if="loadingComments" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
            <div v-else>
              <div
                v-for="comment in comments"
                :key="comment.id"
                class="comment mb-4"
              >
                <div class="d-flex align-items-start">
                  <img
                    :src="comment.avatarUrl"
                    class="rounded-circle me-3"
                    alt="Avatar"
                  />
                  <div>
                    <h6 class="mb-1">{{ comment.author }}</h6>
                    <p class="mb-1">{{ comment.content }}</p>
                    <small class="text-muted">{{
                      new Date(comment.date).toLocaleDateString()
                    }}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Suggestions Tab -->
          <div v-if="activeTab === 'suggestions'" class="tab-pane active">
            <div v-if="loadingSuggestions" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
            <div v-else>
              <div
                v-for="suggestion in suggestions"
                :key="suggestion.id"
                class="suggestion mb-4"
              >
                <div class="d-flex align-items-start">
                  <img
                    :src="suggestion.avatarUrl"
                    class="rounded-circle me-3"
                    alt="Avatar"
                  />
                  <div class="flex-grow-1">
                    <h6 class="mb-1">{{ suggestion.author }}</h6>
                    <div class="suggestion-content p-3 rounded">
                      <p class="mb-2">
                        <strong>Campo:</strong> {{ suggestion.field }}
                      </p>
                      <p class="mb-2">
                        <strong>Valor atual:</strong>
                        {{ suggestion.currentValue }}
                      </p>
                      <p class="mb-2">
                        <strong>Sugestão:</strong>
                        {{ suggestion.suggestedValue }}
                      </p>
                      <p class="mb-2">
                        <strong>Justificativa:</strong> {{ suggestion.reason }}
                      </p>
                      <small class="text-muted">{{
                        new Date(suggestion.date).toLocaleDateString()
                      }}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";

// Mock API services
const fetchImageDetails = async (id) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    id,
    title: `Image ${id}`,
    imageUrl: `https://www.arquigrafia.org.br/arquigrafia-images/${id}_view.jpg`,
    author: "John Doe",
    date: "2024-03-20",
    location: "São Paulo, Brazil",
    description:
      "A beautiful architectural photograph showcasing modern design elements.",
    tags: ["architecture", "modern", "brazil"],
  };
};

const fetchComments = async (imageId) => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return [
    {
      id: 1,
      author: "Maria Silva",
      avatarUrl: "https://i.pravatar.cc/40?u=maria",
      content:
        "Excelente registro da arquitetura modernista brasileira! A composição destaca muito bem os elementos geométricos.",
      date: "2025-06-01T14:30:00Z",
    },
  ];
};

const fetchSuggestions = async (imageId) => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return [
    {
      id: 1,
      author: "Carlos Santos",
      avatarUrl: "https://i.pravatar.cc/40?u=carlos",
      field: "date",
      currentValue: "2024-03-20",
      suggestedValue: "1968",
      reason:
        "Esta obra foi construída em 1968, conforme registros históricos do IAB-SP.",
      date: "2025-06-01T15:45:00Z",
      status: "pending",
    },
  ];
};

export default {
  name: "ImageDetail",
  setup() {
    const route = useRoute();
    const image = ref(null);
    const loading = ref(true);
    const activeTab = ref("comments");
    const comments = ref([]);
    const suggestions = ref([]);
    const loadingComments = ref(false);
    const loadingSuggestions = ref(false);

    const loadComments = async (imageId) => {
      loadingComments.value = true;
      try {
        comments.value = await fetchComments(imageId);
      } catch (error) {
        console.error("Error loading comments:", error);
      } finally {
        loadingComments.value = false;
      }
    };

    const loadSuggestions = async (imageId) => {
      loadingSuggestions.value = true;
      try {
        suggestions.value = await fetchSuggestions(imageId);
      } catch (error) {
        console.error("Error loading suggestions:", error);
      } finally {
        loadingSuggestions.value = false;
      }
    };

    onMounted(async () => {
      try {
        const imageId = route.params.id;
        image.value = await fetchImageDetails(imageId);
        await Promise.all([loadComments(imageId), loadSuggestions(imageId)]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        loading.value = false;
      }
    });

    return {
      image,
      loading,
      activeTab,
      comments,
      suggestions,
      loadingComments,
      loadingSuggestions,
    };
  },
};
</script>

<style scoped>
.image-container {
  position: relative;
  min-height: 300px;
  background-color: #f8f9fa;
  border-radius: 0.375rem;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 1;
}

.metadata-section {
  padding: 1.5rem 0;
  border-bottom: 1px solid #dee2e6;
}

.metadata-section:last-child {
  border-bottom: none;
}

.tags {
  display: flex;
  flex-wrap: wrap;
}

.badge {
  font-weight: 500;
  padding: 0.5rem 1rem;
}

dt {
  font-weight: 500;
  color: #6c757d;
}

@media (max-width: 767.98px) {
  .col-md-4 {
    margin-top: 2rem;
  }
}

.nav-tabs {
  border-bottom: 1px solid #dee2e6;
}

.nav-link {
  color: #6c757d;
  border: none;
  padding: 1rem 1.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: #212529;
}

.nav-link.active {
  color: #aa4f28 !important;
  font-weight: 600;
  border: none;
  border-bottom: 2px solid #aa4f28;
}

.comment,
.suggestion {
  background-color: #fff;
  transition: all 0.2s ease;
}

.suggestion-content {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
}
</style>
