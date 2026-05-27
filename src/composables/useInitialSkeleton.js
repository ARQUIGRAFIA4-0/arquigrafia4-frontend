import { ref } from "vue";

const DEFAULT_MIN_MS = 1000;

/** Mantém o skeleton visível por um tempo mínimo na primeira carga. */
export function useInitialSkeleton(minMs = DEFAULT_MIN_MS) {
  const hasLoaded = ref(false);

  async function finishInitialLoad(startedAt = Date.now()) {
    if (hasLoaded.value) return;

    const remaining = minMs - (Date.now() - startedAt);
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }

    hasLoaded.value = true;
  }

  function reset() {
    hasLoaded.value = false;
  }

  return { hasLoaded, finishInitialLoad, reset };
}
