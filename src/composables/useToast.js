import { ref, onScopeDispose } from "vue";

let counter = 0;

/**
 * Gerencia uma pilha de toasts. Cada toast tem seu próprio id e timer de
 * auto-dismiss, aparece com show() e some sozinho após a duração — mantendo
 * o botão X. O timer de cada toast pode ser pausado no hover (pause/resume).
 * Novos toasts entram no topo; ao exceder `max`, o mais antigo é removido.
 *
 * @param {Object} [options]
 * @param {number} [options.duration=5000]      Duração para o tipo "success".
 * @param {number} [options.errorDuration=8000] Duração para o tipo "error".
 * @param {number} [options.max=3]              Máximo de toasts visíveis.
 */
export function useToast({ duration = 5000, errorDuration = 8000, max = 3 } = {}) {
  const toasts = ref([]); // [{ id, message, type }]
  const timers = new Map(); // id -> { timeoutId, deadline, remaining }

  const durationFor = (type) =>
    type === "success" ? duration : errorDuration;

  const clearTimer = (id) => {
    const timer = timers.get(id);
    if (timer?.timeoutId != null) clearTimeout(timer.timeoutId);
  };

  const remove = (id) => {
    clearTimer(id);
    timers.delete(id);
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };

  const schedule = (id, ms) => {
    clearTimer(id);
    const timeoutId = setTimeout(() => remove(id), ms);
    timers.set(id, { timeoutId, deadline: Date.now() + ms, remaining: 0 });
  };

  const show = (message, type = "error", durationOverride) => {
    const id = ++counter;
    // Novos toasts entram no topo da pilha.
    toasts.value = [{ id, message, type }, ...toasts.value];
    // Respeita o máximo visível descartando o mais antigo (fim da lista).
    while (toasts.value.length > max) {
      remove(toasts.value[toasts.value.length - 1].id);
    }
    schedule(id, durationOverride ?? durationFor(type));
    return id;
  };

  const hide = (id) => remove(id);

  const pause = (id) => {
    const timer = timers.get(id);
    if (!timer || timer.timeoutId == null) return;
    clearTimeout(timer.timeoutId);
    timer.remaining = Math.max(0, timer.deadline - Date.now());
    timer.timeoutId = null;
  };

  const resume = (id) => {
    const timer = timers.get(id);
    if (!timer || timer.timeoutId != null) return;
    const item = toasts.value.find((t) => t.id === id);
    schedule(id, timer.remaining > 0 ? timer.remaining : durationFor(item?.type));
  };

  onScopeDispose(() => {
    timers.forEach((timer) => {
      if (timer.timeoutId != null) clearTimeout(timer.timeoutId);
    });
    timers.clear();
  });

  return { toasts, show, hide, pause, resume };
}
