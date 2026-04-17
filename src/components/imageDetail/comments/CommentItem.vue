<template>
  <div class="comment-item">
    <div class="comment-item__layout">
      <img :src="avatarUrl" :alt="`Foto de ${comment.user.name}`" class="comment-item__avatar" />
      <div class="comment-item__body">
        <h6 class="comment-item__author">{{ comment.user.name }}</h6>

        <p v-if="comment.is_deleted" class="comment-item__content comment-item__content--removed">
          Comentário removido.
        </p>
        <p v-else-if="!showEditForm" class="comment-item__content">{{ localComment.content }}</p>

        <div class="comment-item__footer">
          <small class="comment-item__date">
            {{ formattedDate }}
            <span v-if="comment.is_edited" class="comment-item__edited">(editado)</span>
          </small>

          <div class="comment-item__actions">
            <button class="comment-item__action-btn comment-item__action-btn--like"
              :class="{ 'comment-item__action-btn--liked': localComment.liked_by_me }" @click="handleLike">
              <i class="bi bi-heart-fill"></i>
              <span>{{ localComment.likes_count }}</span>
            </button>

            <!-- Responder — só aparece se não for já uma reply -->
            <button v-if="!comment.parent_id && isLoggedIn"
              class="comment-item__action-btn comment-item__action-btn--reply" @click="toggleReplyForm">
              <i class="bi bi-reply"></i>
              <span>Responder</span>
            </button>

            <button v-if="isOwner && !comment.is_deleted"
              class="comment-item__action-btn comment-item__action-btn--delete" @click="$emit('delete', comment.id)">
              <i class="bi bi-trash"></i>
            </button>

            <!-- Botão de edição -->
            <button v-if="isOwner && !comment.is_deleted"
              class="comment-item__action-btn comment-item__action-btn--edit" @click="toggleEditForm">
              <i class="bi bi-pencil"></i>
            </button>

            <button class="comment-item__action-btn comment-item__action-btn--report"
              @click="$emit('report', comment.id)">
              <i class="bi bi-exclamation-circle"></i>
            </button>
          </div>
        </div>

        <!-- Form de resposta inline -->
        <div v-if="showReplyForm" class="comment-item__reply-form">
          <textarea v-model="replyContent" class="form-control comment-item__reply-textarea"
            placeholder="Escreva uma resposta..." rows="2" :disabled="submittingReply"></textarea>
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
          <textarea v-model="editContent" class="form-control comment-item__reply-textarea" rows="2"
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
          <CommentItem v-for="reply in visibleReplies" :key="reply.id" :comment="reply"
            @delete="$emit('delete', $event)" @report="$emit('report', $event)" />

          <!-- Carregar mais replies -->
          <button v-if="hasMoreReplies" class="comment-item__load-replies" :disabled="loadingReplies"
            @click="loadMoreReplies">
            {{ loadingReplies ? 'Carregando...' : `Ver mais respostas` }}
          </button>
        </div>

        <!-- Botão inicial para abrir replies -->
        <button v-else-if="comment.replies_count > 0" class="comment-item__load-replies" @click="loadMoreReplies">
          Ver {{ comment.replies_count }} respostas
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

const API_BASE_URL = import.meta.env.VITE_BASE_REQUEST_URL

const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
})

const localComment = ref({ ...props.comment })

watch(
  () => props.comment,
  (newComment) => {
    localComment.value = { ...newComment }
  },
  { deep: true }
)

defineEmits(['like', 'delete', 'report'])

const authStore = useAuthStore()
const commentStore = useCommentStore()
const authHeader = computed(() => authStore.authHeader)
const isLoggedIn = computed(() => authStore.isLoggedIn)

// ── avatar e data ──────────────────────────────────────────────
const avatarUrl = computed(() => {
  return props.comment.user.avatar_path
    ? `${API_BASE_URL}/storage/${props.comment.user.avatar_path}`
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
  border-bottom: 1px solid var(--Cinza_C, #a6a6a6);

  &:last-child {
    border-bottom: none;
  }

  &__layout {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  &__avatar {
    border-radius: 50%;
    width: 2.5rem;
    height: 2.5rem;
    object-fit: cover;
    flex-shrink: 0;
  }

  &__body {
    flex: 1;
  }

  &__author {
    font-size: 0.95rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
    color: var(--Cinza_E);
  }

  &__content {
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    color: var(--Cinza_E);
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

  &__action-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    background: none;
    border: none;
    padding: 0.25rem;
    cursor: pointer;
    font-size: 0.85rem;
    transition: color 0.15s ease;
    color: var(--Cinza_M);

    &--edit {
      &:hover {
        color: var(--Cinza_E);
      }
    }

    &--like {

      &:hover,
      &.comment-item__action-btn--liked {
        color: var(--Laranja_E, #ff7f00);
      }
    }

    &--reply {
      &:hover {
        color: var(--Cinza_E);
      }
    }

    &--delete {
      &:hover {
        color: var(--bs-danger);
      }
    }

    &--report {
      &:hover {
        color: var(--Cinza_E);
      }
    }
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
    margin-top: 0.75rem;
    padding-left: 1rem;
    border-left: 2px solid var(--Cinza_C, #a6a6a6);
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