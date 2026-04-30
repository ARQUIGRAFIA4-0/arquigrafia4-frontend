<template>
  <div class="image-comments">
    <CommentList v-if="comments.length" :comments="comments" :image-url="props.imageUrl" class="image-comments__list"
      @delete="handleDelete" @report="handleReport" />
    <p v-else-if="!loading" class="image-comments__empty">
      Ainda não há comentários.
    </p>

    <p v-if="loading" class="image-comments__loading">Carregando...</p>
    <p v-if="error" class="image-comments__error">{{ error }}</p>

    <div v-if="!isLoggedIn" class="image-comments__auth-banner">
      Você ainda não acessou sua conta. Faça seu
      <RouterLink :to="{ name: 'login' }">login</RouterLink>
      e participe da conversa.
    </div>

    <CommentForm :submitting="submitting" :disabled="!isLoggedIn" class="image-comments__form" @submit="handleSubmit" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCommentStore } from '@/store/commentStore'
import { useAuthStore } from '@/store/auth'
import CommentList from './comments/CommentList.vue'
import CommentForm from './comments/CommentForm.vue'

const route = useRoute()
const imageId = route.params.id

const authStore = useAuthStore()
const authHeader = computed(() => authStore.authHeader)
const commentStore = useCommentStore()
const isLoggedIn = computed(() => authStore.isLoggedIn)

const comments = ref([])
const loading = ref(false)
const submitting = ref(false)
const error = ref(null)

const props = defineProps({
  imageUrl: {
    type: String,
    default: '',
  },
})

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    const data = await commentStore.fetchComments(imageId)
    comments.value = data.data
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})

async function handleSubmit(content) {
  submitting.value = true
  error.value = null
  try {
    const data = await commentStore.postComment(authHeader.value, imageId, content)
    comments.value.unshift(data.data)
  } catch (err) {
    error.value = err.message
  } finally {
    submitting.value = false
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}

async function handleDelete(commentId) {
  const index = comments.value.findIndex(c => c.id === commentId)
  if (index !== -1) {
    if (comments.value[index].replies_count > 0) {
      comments.value[index].is_deleted = true
    } else {
      comments.value.splice(index, 1)
    }
  }
}

function handleReport({ commentId, type, description }) {
  // TODO: chamar a API de denúncia
  console.log('report', commentId, type, description)
}
</script>

<style lang="scss" scoped>
.image-comments {
  &__list {
    margin-bottom: 2rem;
  }

  &__empty,
  &__loading {
    color: var(--Cinza_M);
    font-size: 0.9rem;
    padding: 1rem 0;
  }

  &__error {
    color: var(--bs-danger);
    font-size: 0.9rem;
  }

  &__form {
    margin-top: 1.5rem;
  }

  &__auth-banner {
    background-color: #fff3e0;
    border: 1px solid var(--Laranja_E, #ff7f00);
    border-radius: 0.5rem;
    color: var(--Laranja_E, #ff7f00);
    font-size: 0.875rem;
    font-weight: 600;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    text-align: center;

    a {
      color: var(--Laranja_E, #ff7f00);
      font-weight: 700;
    }
  }
}
</style>