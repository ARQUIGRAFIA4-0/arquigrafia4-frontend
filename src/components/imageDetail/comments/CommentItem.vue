<template>
  <div class="comment-item">

    <!-- Modal de confirmação de exclusão -->
    <CommentDeleteModal v-if="showDeleteModal" @cancel="cancelDelete" @confirm="confirmDelete" />

    <CommentReportModal v-if="showReportModal" :image-url="imageUrl" @cancel="showReportModal = false"
      @confirm="handleReport" />

    <div class="comment-item__layout">

      <div class="comment-item__avatar-section">
        <img :src="avatarUrl" :alt="`Foto de ${comment.user.name}`" class="comment-item__avatar" />
        <h3 class="comment-item__author">{{ comment.user.name }}</h3>
      </div>


      <div class="comment-item__body">

        <p v-if="comment.is_deleted" class="comment-item__content comment-item__content--removed">
          Comentário removido.
        </p>

        <p v-else-if="!showEditForm" class="comment-item__content">{{ localComment.content }}</p>

        <div class="comment-item__footer">
          <small class="comment-item__date">
            {{ formattedDate }}
            <span v-if="comment.is_edited" class="comment-item__edited">(editado)</span>
          </small>

          <CommentActions :liked="localComment.liked_by_me" :likes-count="localComment.likes_count"
            :show-reply="!isReply && isLoggedIn" :show-owner-actions="isOwner && !comment.is_deleted" @like="handleLike"
            @reply="toggleReplyForm" @edit="toggleEditForm" @delete="showDeleteModal = true"
            @report="showReportModal = true" />
        </div>

        <!-- Form de resposta inline -->
        <div v-if="showReplyForm" class="comment-item__reply-form">
          <textarea v-model="replyContent" class="form-control comment-item__reply-textarea"
            placeholder="Escreva uma resposta..." rows="2" maxlength="2000" :disabled="submittingReply"></textarea>
          <div class="comment-item__reply-actions">
            <button class="btn btn-link btn-sm comment-item__reply-cancel" @click="cancelReply">
              Cancelar
            </button>
            <button class="btn btn-secondary btn-sm" :disabled="!replyContent.trim() || submittingReply"
              @click="submitReply">
              {{ submittingReply ? 'Enviando...' : 'Responder' }}
            </button>
          </div>
        </div>

        <!-- Form de edição -->
        <div v-if="showEditForm" class="comment-item__reply-form">
          <textarea v-model="editContent" class="form-control comment-item__reply-textarea" rows="2" maxlength="2000"
            :disabled="submittingEdit"></textarea>
          <div class="comment-item__reply-actions">
            <button class="btn btn-link btn-sm comment-item__reply-cancel" @click="cancelEdit">
              Cancelar
            </button>
            <button class="btn btn-secondary btn-sm" :disabled="!editContent.trim() || submittingEdit"
              @click="submitEdit">
              {{ submittingEdit ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </div>

        <!-- Replies -->
        <div v-if="visibleReplies.length" class="comment-item__replies">
          <!-- Preview de replies que vieram no index (limit 3) -->
          <CommentItem v-for="reply in visibleReplies" :key="reply.id" :comment="reply" :is-reply="true"
            :image-url="imageUrl" @delete="handleReplyDelete" @report="$emit('report', $event)" />

          <!-- Carregar mais replies -->
          <button v-if="hasMoreReplies" class="comment-item__load-replies" :disabled="loadingReplies"
            @click="loadMoreReplies">
            {{ loadingReplies ? 'Carregando...' : `Ver mais respostas` }}
          </button>
        </div>

        <!-- Botão inicial para abrir replies -->
        <button v-if="localComment.replies_count > 0" class="comment-item__load-replies" @click="toggleReplies">
          {{ visibleReplies.length ? 'Ocultar respostas' : `Ver ${localComment.replies_count} respostas` }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/store/auth'
import { useCommentStore } from '@/store/commentStore'
import profileImageDefault from '@/assets/profile_image.png'
import CommentActions from './CommentActions.vue'
import CommentDeleteModal from './CommentDeleteModal.vue'
import CommentReportModal from './CommentReportModal.vue'

const API_BASE_URL = import.meta.env.VITE_BASE_REQUEST_URL

const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
  isReply: {
    type: Boolean,
    default: false,
  },
  imageUrl: { type: String, default: '' },
})

const localComment = ref({ ...props.comment })

watch(
  () => props.comment,
  (newComment) => {
    localComment.value = { ...newComment }
  },
  { deep: true }
)

const emit = defineEmits(['like', 'delete', 'report'])

const authStore = useAuthStore()
const commentStore = useCommentStore()
const authHeader = computed(() => authStore.authHeader)
const isLoggedIn = computed(() => authStore.isLoggedIn)
const showDeleteModal = ref(false)
const showReportModal = ref(false)

// função para confirmar exclusão
function cancelDelete() {
  showDeleteModal.value = false
}

async function confirmDelete() {
  showDeleteModal.value = false
  try {
    await commentStore.deleteComment(authHeader.value, props.comment.id)
    emit('delete', props.comment.id) // avisa o pai para remover da lista dele
  } catch (err) {
    console.error(err)
  }
}

// toggle de exibição das replies
function toggleReplies() {
  if (visibleReplies.value.length) {
    visibleReplies.value = []
    nextCursor.value = null
    hasMoreReplies.value = false
    repliesLoaded.value = false
  } else {
    loadMoreReplies()
  }
}

// ── avatar e data ──────────────────────────────────────────────
console.log(props.comment.user.avatar_url);

const avatarUrl = computed(() => {
  return props.comment.user.avatar_url
    ? `${API_BASE_URL}${props.comment.user.avatar_url}`
    : profileImageDefault
})

const formattedDate = computed(() => {
  return new Date(props.comment.created_at).toLocaleDateString('pt-BR')
})

// verifica se o usuário logado é o dono do comentário
const isOwner = computed(() => {
  return authStore.loggedUser?.id === props.comment.user.id
})

// ── edit form ──────────────────────────────────────────────────
const showEditForm = ref(false)
const editContent = ref('')
const submittingEdit = ref(false)

function toggleEditForm() {
  showEditForm.value = !showEditForm.value
  editContent.value = showEditForm.value ? localComment.value.content : ''
}

function cancelEdit() {
  showEditForm.value = false
  editContent.value = ''
}

async function submitEdit() {
  if (!editContent.value.trim()) return
  submittingEdit.value = true
  try {
    const data = await commentStore.updateComment(
      authHeader.value,
      props.comment.id,
      editContent.value.trim()
    )
    localComment.value.content = data.data.content
    localComment.value.is_edited = data.data.is_edited
    localComment.value.edited_at = data.data.edited_at
    cancelEdit()
  } catch (err) {
    console.error(err)
  } finally {
    submittingEdit.value = false
  }
}

// ── reply form ─────────────────────────────────────────────────
const showReplyForm = ref(false)
const replyContent = ref('')
const submittingReply = ref(false)

function toggleReplyForm() {
  showReplyForm.value = !showReplyForm.value
  if (!showReplyForm.value) replyContent.value = ''
}

function cancelReply() {
  showReplyForm.value = false
  replyContent.value = ''
}

async function submitReply() {
  if (!replyContent.value.trim()) return
  submittingReply.value = true
  try {
    const data = await commentStore.postComment(
      authHeader.value,
      props.comment.image_id,
      replyContent.value.trim(),
      props.comment.id  // parent_id
    )
    // adiciona a nova reply na lista local
    visibleReplies.value.unshift(data.data)
    localComment.value.replies_count = (localComment.value.replies_count || 0) + 1
    cancelReply()
  } catch (err) {
    console.error(err)
  } finally {
    submittingReply.value = false
  }
}

// ── replies pagination ─────────────────────────────────────────
const visibleReplies = ref([])
const repliesLoaded = ref(false)
const loadingReplies = ref(false)
const nextCursor = ref(null)
const hasMoreReplies = ref(false)

async function loadMoreReplies() {
  loadingReplies.value = true
  try {
    const data = await commentStore.fetchReplies(props.comment.id, nextCursor.value)
    visibleReplies.value.push(...data.data)
    nextCursor.value = data.meta.next_cursor
    hasMoreReplies.value = !!data.meta.next_cursor
    repliesLoaded.value = true
  } catch (err) {
    console.error(err)
  } finally {
    loadingReplies.value = false
  }
}

// tratando o delete das replies
function handleReplyDelete(replyId) {
  const index = visibleReplies.value.findIndex(r => r.id === replyId)
  if (index !== -1) {
    visibleReplies.value.splice(index, 1)
    localComment.value.replies_count = Math.max(0, localComment.value.replies_count - 1)
  }
}

function handleReport(payload) {
  showReportModal.value = false
  emit('report', { commentId: props.comment.id, ...payload })
}

// toggle like sem depender do pai para atualizar a UI mais rápido
async function handleLike() {
  if (!isLoggedIn.value) return
  try {
    const data = await commentStore.toggleLike(authHeader.value, props.comment.id)
    // atualiza localmente sem depender do pai
    localComment.value.liked_by_me = data.liked
    localComment.value.likes_count = data.likes_count
  } catch (err) {
    console.error(err)
  }
}
</script>

<style lang="scss" scoped>
.comment-item {
  padding: 1rem 0;

  &__layout {
    // display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  &__avatar-section {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-shrink: 0;
  }

  &__avatar {
    border-radius: 50%;
    width: 2.5rem;
    height: 2.5rem;
    object-fit: cover;
    flex-shrink: 0;
  }

  &__author {
    font-size: 1rem;
    font-weight: 500;
    color: var(--Cinza_E);
    margin-bottom: 0;
  }

  &__body {
    flex: 1;
  }

  &__content {
    font-size: 0.875rem;
    margin: 0.5rem 0;
    color: var(--Preto);
    line-height: 1.5;

    &--removed {
      color: var(--Cinza_M);
      font-style: italic;
    }
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__date {
    color: var(--Cinza_M, #636262);
    font-size: 0.8rem;
  }

  &__edited {
    margin-left: 0.25rem;
    font-style: italic;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  // ── reply form ───────────────────────────────────────
  &__reply-form {
    margin-top: 0.75rem;
  }

  &__reply-textarea {
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
    resize: none;
    margin-bottom: 0.5rem;
  }

  &__reply-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 0.5rem;
  }

  &__reply-cancel {
    color: var(--Cinza_M);
    font-size: 0.85rem;
    text-decoration: none;

    &:hover {
      color: var(--Cinza_E);
    }
  }

  // ── replies aninhadas ────────────────────────────────
  &__replies {
    padding: 1rem;
    margin-left: 1.5rem;

    >.comment-item {
      border-top: 0.013rem solid #e4e4e4;
    }
  }


  &__load-replies {
    background: none;
    border: none;
    padding: 0.25rem 0;
    margin-top: 0.5rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--Cinza_E);
    cursor: pointer;
    transition: color 0.15s ease;

    &:hover {
      color: var(--Laranja_E, #ff7f00);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}
</style>