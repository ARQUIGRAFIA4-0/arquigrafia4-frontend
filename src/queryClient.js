import { QueryClient } from "@tanstack/vue-query";

// Instância única, compartilhada entre o plugin (main.js) e os stores Pinia,
// que rodam fora do setup de componentes e não podem usar useQueryClient().
export const queryClient = new QueryClient();
