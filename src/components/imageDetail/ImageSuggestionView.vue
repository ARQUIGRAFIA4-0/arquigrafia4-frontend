<template>
  <div class="py-4">

    <!-- Loading -->
    <div v-if="loading" class="d-flex flex-column gap-3">
      <div v-for="i in 3" :key="i" class="bg-off-white p-3 rounded shadow-sm">
        <div class="d-flex align-items-center gap-3 mb-2">
          <div class="skeleton rounded-circle" style="width: 36px; height: 36px; flex-shrink: 0" />
          <div class="flex-grow-1">
            <div class="skeleton mb-1" style="height: 14px; width: 55%" />
            <div class="skeleton" style="height: 12px; width: 25%" />
          </div>
        </div>
        <div class="skeleton" style="height: 60px; width: 100%" />
      </div>
    </div>

    <template v-else>
      <!-- Lista de sugestões -->
      <div v-if="suggestions.length > 0" class="d-flex flex-column gap-2 mb-4">
        <div v-for="suggestion in suggestions" :key="suggestion.id"
          class="bg-off-white rounded shadow-sm overflow-hidden">
          <!-- Cabeçalho -->
          <div class="d-flex align-items-center justify-content-between p-3 cursor-pointer" role="button"
            @click="toggle(suggestion.id)">
            <div class="d-flex align-items-center gap-2 flex-grow-1 min-w-0">
              <!-- Avatar -->
              <div v-if="suggestion.user?.avatar" class="rounded-circle overflow-hidden flex-shrink-0"
                style="width: 36px; height: 36px">
                <img :src="suggestion.user.avatar" alt="" class="w-100 h-100 object-fit-cover" />
              </div>
              <div v-else
                class="rounded-circle bg-black text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0 small"
                style="width: 36px; height: 36px">
                {{ initials(suggestion.user) }}
              </div>

              <!-- Texto -->
              <span class="text-muted small text-truncate">
                <strong class="text-dark">{{ suggestion.user?.name ?? "Usuário" }}</strong>
                {{ suggestionLabel(suggestion) }}
              </span>
            </div>

            <div class="d-flex align-items-center gap-2 flex-shrink-0 ms-2">
              <i class="bi transition-transform"
                :class="open.includes(suggestion.id) ? 'bi-chevron-up' : 'bi-chevron-down'" />
            </div>
          </div>

          <!-- Conteúdo expandido -->
          <div v-if="open.includes(suggestion.id)" class="px-3 pb-3">
            <!-- Timestamp -->
            <p class="text-end text-muted small mb-2">{{ timeAgo(suggestion.created_at) }}</p>

            <!-- Campos do payload -->
            <div class="d-flex flex-column gap-3 mb-3">

              <div v-if="suggestion.payload?.title">
                <label class="form-label text-muted small mb-1">Título sugerido</label>
                <input type="text" class="form-control form-control-sm" :value="suggestion.payload.title" readonly />
              </div>

              <div v-if="suggestion.payload?.description">
                <label class="form-label text-muted small mb-1">Descrição sugerida</label>
                <textarea class="form-control form-control-sm" :value="suggestion.payload.description" rows="3"
                  readonly />
              </div>

              <div v-if="suggestion.payload?.subjects?.length">
                <label class="form-label text-muted small mb-1">Tags sugeridas</label>
                <div class="d-flex flex-wrap gap-2">
                  <span v-for="subject in suggestion.payload.subjects" :key="subject"
                    class="badge bg-secondary fw-normal">{{ subject }}</span>
                </div>
              </div>

              <div v-if="suggestion.payload?.location_label">
                <label class="form-label text-muted small mb-1">Localização sugerida</label>
                <input type="text" class="form-control form-control-sm" :value="suggestion.payload.location_label"
                  readonly />
              </div>

              <div v-if="suggestion.payload?.earliest_date">
                <label class="form-label text-muted small mb-1">Data sugerida</label>
                <input type="text" class="form-control form-control-sm" :value="formatDateRange(suggestion.payload)"
                  readonly />
              </div>

              <div v-if="suggestion.payload?.reason">
                <label class="form-label text-muted small mb-1">Motivo</label>
                <p class="text-muted small fst-italic mb-0 p-2 border rounded bg-white">
                  {{ suggestion.payload.reason }}
                </p>
              </div>
            </div>

            <!-- Status -->
            <div class="text-end">
              <span v-if="suggestion.status === 'accepted'" class="small text-success">
                A sugestão foi aceita pelo autor
              </span>
              <span v-else-if="suggestion.status === 'partially_accepted'" class="small text-warning">
                Sugestão parcialmente aceita pelo autor
              </span>
              <span v-else-if="suggestion.status === 'rejected'" class="small text-danger">
                Sugestão recusada
              </span>
              <span v-else class="small text-muted fst-italic">
                Aguardando revisão do autor
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Vazio -->
      <div v-else class="text-center py-4 text-muted small mb-4">
        <i class="bi bi-chat-square-text fs-2 d-block mb-2 opacity-40" />
        Nenhuma sugestão enviada ainda para esta imagem.
      </div>

      <!-- Botão enviar sugestão (somente logado) -->
      <button v-if="isLoggedIn" class="btn btn-dark w-100 mb-4" @click="goToSuggest">
        Enviar sugestão
      </button>

      <!-- Bloco informativo (sempre visível) -->
      <div class="d-flex align-items-start gap-3 p-3 border rounded bg-off-white">
        <i class="bi bi-question-circle text-muted fs-5 flex-shrink-0 mt-1" />
        <p class="text-muted small mb-0">
          O ARQUIGRAFIA convida o usuário a registrar impressões sobre fotos de arquitetura
          usando pares de opostos. As respostas geram um gráfico com médias e permitem
          comparar imagens com percepções parecidas entre os usuários.
        </p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import axios from "@/axios";
import { useAuthStore } from "@/store/auth";
import { storeToRefs } from "pinia";

defineOptions({ name: "ImageSuggestionView" });

const props = defineProps({
  image: { type: Object, default: null },
});

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { loggedUser } = storeToRefs(authStore);

const isLoggedIn = computed(() => !!loggedUser.value);

const loading = ref(true);
const suggestions = ref([]);
const open = ref([]);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const initials = (user) => {
  if (!user?.name) return "?";
  return user.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
};

const suggestionLabel = (suggestion) => {
  const fields = Object.keys(suggestion.payload || {}).filter((k) => k !== "reason");
  const map = {
    title: "sugeriu um novo título",
    description: "sugeriu uma nova descrição",
    subjects: "sugeriu novas tags",
    location_label: "sugeriu uma nova localização",
    earliest_date: "sugeriu uma nova data",
    photographer: "sugeriu um novo fotógrafo",
  };
  if (fields.length === 1 && map[fields[0]]) return map[fields[0]];
  return "sugeriu novas edições";
};

const formatDateRange = (payload) => {
  const start = payload.earliest_date
    ? new Date(payload.earliest_date).getUTCFullYear()
    : null;
  const end = payload.latest_date
    ? new Date(payload.latest_date).getUTCFullYear()
    : null;
  if (start && end && start !== end) return `${start} – ${end}`;
  return start ? String(start) : "";
};

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} minuto(s)`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} hora(s)`;
  return `há ${Math.floor(diff / 86400)} dia(s)`;
};

// ─── Toggle accordion ─────────────────────────────────────────────────────────
const toggle = (id) => {
  const idx = open.value.indexOf(id);
  if (idx === -1) open.value.push(id);
  else open.value.splice(idx, 1);
};

// ─── Fetch (todas as sugestões, sem filtro de status) ─────────────────────────
const fetchSuggestions = async () => {
  if (!props.image?.id) return;
  loading.value = true;
  try {
    const { data } = await axios.get("/api/image-suggestions", {
      params: { image_id: props.image.id },
      headers: authStore.authHeader ? { Authorization: authStore.authHeader } : {},
    });
    suggestions.value = data.suggestions?.data ?? data.suggestions ?? [];
  } catch (e) {
    console.error("Erro ao carregar sugestões:", e);
  } finally {
    loading.value = false;
  }
};

// ─── Ir para formulário de sugestão ───────────────────────────────────────────
const goToSuggest = () => {
  router.push({
    name: "image-detail-sugestoes",
    params: { id: props.image.id },
    query: { suggest: "true" },
  });
};

onMounted(fetchSuggestions);
</script>
