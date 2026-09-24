/**
 * Roteamento via OSRM (OpenStreetMap).
 * Aconselhado usar o endereço https://router.project-osrm.org só para desenvolvimento. Em produção é melhor usar um servidor próprio
 * e defina VITE_OSRM_URL (ex.: https://seu-osrm.example.com).
 *
 * @param {Array<[number, number]>} coordinates - [[lng, lat], ...]
 * @param {{ profile?: "walking" | "driving" | "cycling", signal?: AbortSignal }} [options]
 * @returns {Promise<{ coordinates: Array<[number, number]>, distanceMeters: number, durationSeconds: number } | null>}
 */
export async function fetchOsrmRoute(coordinates, options = {}) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null; // Verifica se as coordenadas são um array e tem pelo menos 2 pontos

  const profile = options.profile ?? "walking"; // walking, driving, cycling
  const base = import.meta.env.VITE_OSRM_URL || "https://router.project-osrm.org"; // *IMPORTANTE: URL do servidor OSRM

  const path = coordinates.map(([lng, lat]) => `${lng},${lat}`).join(";"); // Converte as coordenadas para o formato esperado pelo OSRM
  const url =  `${base.replace(/\/$/, "")}/route/v1/${profile}/${path}` + `?overview=full&geometries=geojson`; // Monta a URL da requisição

  const res = await fetch(url, { signal: options.signal }); // Faz a requisição ao servidor OSRM
  if (!res.ok) return null; // Verifica se a requisição foi bem-sucedida

  const data = await res.json(); // Converte a resposta para JSON
  if (data.code !== "Ok" || !data.routes?.[0]) return null; // Verifica se a resposta contém um caminho válido

  const route = data.routes[0]; // Pega o primeiro caminho da resposta
  const coords = route.geometry?.coordinates; // Pega as coordenadas do caminho
  if (!Array.isArray(coords) || coords.length < 2) return null; // Verifica se as coordenadas são um array e tem pelo menos 2 pontos

  /**
   * Aqui ele retorna pro mapa: as coordenadas do caminho, a distância em metros e o tempo em segundos
   * 
   * {
   *   coordinates: coords,
   *   distanceMeters: Number(route.distance) || 0,
   *   durationSeconds: Number(route.duration) || 0,
   * }
   */
  return {
    coordinates: coords,
    distanceMeters: Number(route.distance) || 0,
    durationSeconds: Number(route.duration) || 0,
  };
}

/**
 * UTILS - Funções auxiliares para formatar a distância e o tempo de rota
 */

// Formata a distância de rota em metros e quilômetros
export function formatRouteDistance(meters) {
  if (!meters || meters < 0) return "";
  if (meters < 1000) return `${Math.round(meters)} m`;

  return `${(meters / 1000).toFixed(1)} km`;

}

// Formata o tempo de rota em minutos e horas
export function formatRouteDuration(seconds) {
  if (!seconds || seconds < 0) return "";

  const min = Math.round(seconds / 60);

  if (min < 60) return `${min} min`;

  const h = Math.floor(min / 60);
  const m = min % 60;

  return m ? `${h} h ${m} min` : `${h} h`;

}

/*
 * ---------------------------------------------------------------------------
 * TUTORIAL — hospedar um OSRM próprio (grátis)
 * ---------------------------------------------------------------------------
 *
 * O MapLibre só DESENHA a linha. Quem calcula a rota nas ruas é o OSRM.
 * Você hospeda APENAS o serviço OSRM + um arquivo de mapa OSM processado.
 * Não precisa hospedar tiles nem o OpenStreetMap inteiro.
 *
 * Software: open source, sem licença paga.
 *
 * 1) Pré-requisitos
 *    - Docker instalado
 *    - Disco + RAM suficientes (Grande SP: leve; Brasil inteiro: bem pesado)
 *
 * 2) Baixar dados OSM (Geofabrik)
 *    mkdir -p ~/osrm-data && cd ~/osrm-data
 *    # Ex.: estado de SP (ajuste a URL se preferir só uma cidade/região)
 *    wget https://download.geofabrik.de/south-america/brazil/sudeste-latest.osm.pbf
 *    # Recortes menores: https://download.geofabrik.de/south-america/brazil.html
 *
 * 3) Extrair o grafo (perfil a pé = foot.lua > profile "walking" na URL)
 *    # Imagem oficial: ghcr.io/project-osrm/osrm-backend
 *    docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend \
 *      osrm-extract -p /opt/foot.lua /data/sudeste-latest.osm.pbf
 *
 *    # Se o .lua foot não existir na imagem, liste: docker run --rm ... ls /opt
 *    # Alternativa comum: car.lua (aí use profile "driving" no PathMap).
 *
 * 4) Partition + customize (algoritmo MLD)
 *    docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend \
 *      osrm-partition /data/sudeste-latest.osrm
 *    docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend \
 *      osrm-customize /data/sudeste-latest.osrm
 *
 * 5) Subir a API (porta 5000)
 *    docker run -d --name osrm -p 5000:5000 -v "${PWD}:/data" \
 *      ghcr.io/project-osrm/osrm-backend \
 *      osrm-routed --algorithm mld /data/sudeste-latest.osrm
 *
 * 6) Testar no navegador / curl
 *    curl "http://localhost:5000/route/v1/walking/-46.63,-23.55;-46.65,-23.56?overview=full&geometries=geojson"
 *    # Resposta com code:"Ok" e routes[0].geometry = linha nas ruas.
 *
 * 7) Ligar no Arquigrafia
 *    No .env.local (ou .env de produção):
 *      VITE_OSRM_URL=http://localhost:5000
 *    Em produção (com HTTPS + domínio):
 *      VITE_OSRM_URL=https://osrm.seudominio.org
 *    Reinicie o Vite após mudar o .env.
 *
 * 8) Produção — boas práticas
 *    - Não use https://router.project-osrm.org (demo instável, só dev).
 *    - Prefira proxy no backend (ex.: GET /api/route → OSRM interno) para
 *      esconder o serviço, evitar CORS e limitar abuso.
 *    - Atualize o .osm.pbf de tempos em tempos e rode extract/partition/customize
 *      de novo quando quiser ruas mais atuais.
 *    - CORS: se o browser chamar o OSRM direto, configure o reverse proxy
 *      (nginx/Caddy) com Access-Control-Allow-Origin do frontend.
 *
 * Docs oficiais: https://project-osrm.org/
 * Backend Docker: https://github.com/Project-OSRM/osrm-backend
 * ---------------------------------------------------------------------------
 */
