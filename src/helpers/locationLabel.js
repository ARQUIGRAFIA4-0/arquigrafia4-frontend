// Monta o rótulo de endereço a partir dos campos estruturados da Nominatim
// (objeto `address`), em vez de usar o `display_name` pronto.
//
// O `display_name` inclui o POI mais próximo do ponto e a hierarquia
// administrativa inteira.
// Para o acervo interessa o logradouro, o bairro e a cidade; nomes de
// estabelecimento não entram.

// A Nominatim varia a chave conforme o tipo de localidade, daí as listas.
const CITY_KEYS = ["city", "town", "village", "municipality", "hamlet"];
const DISTRICT_KEYS = ["suburb", "neighbourhood", "city_district", "borough"];

const firstOf = (address, keys) => {
  for (const key of keys) {
    const value = address?.[key]?.trim?.();
    if (value) return value;
  }
  return "";
};

// Sigla do estado quando disponível ("SP"); senão o nome por extenso.
const stateOf = (address) => {
  const code = address?.["ISO3166-2-lvl4"];
  if (typeof code === "string" && code.includes("-")) {
    return code.split("-").pop();
  }
  return address?.state?.trim() || "";
};

/**
 * @param {object} address objeto `address` devolvido pela Nominatim
 * @returns {string} rótulo composto, ou "" se não houver dado utilizável
 */
export function buildLocationLabel(address) {
  if (!address) return "";

  const road = address.road?.trim() || "";
  const houseNumber = address.house_number?.trim() || "";
  const district = firstOf(address, DISTRICT_KEYS);
  const city = firstOf(address, CITY_KEYS);
  const state = stateOf(address);

  // "Avenida Paulista, 100"
  const street = road && houseNumber ? `${road}, ${houseNumber}` : road;

  // "São Paulo - SP"
  const cityState = city && state ? `${city} - ${state}` : city || state;

  // "Avenida Paulista, 100 — Jardim Paulista, São Paulo - SP"
  const tail = [district, cityState].filter(Boolean).join(", ");
  if (street && tail) return `${street} — ${tail}`;
  return street || tail;
}

/**
 * Rótulo de um resultado da Nominatim, com as quedas de qualidade em ordem:
 * campos estruturados → display_name → coordenadas.
 */
export function labelFromResult(result, coords = null) {
  const composed = buildLocationLabel(result?.address);
  if (composed) return composed;

  const displayName = result?.display_name?.trim();
  if (displayName) return displayName;

  const lat = coords?.lat ?? result?.lat;
  const lon = coords?.lng ?? result?.lon;
  if (lat != null && lon != null) {
    return `Ponto sem endereço conhecido — ${Number(lat).toFixed(5)}, ${Number(lon).toFixed(5)}`;
  }
  return "";
}
