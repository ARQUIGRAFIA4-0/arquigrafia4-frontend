/**
 * Adiciona ou remove um item de um array (toggle)
 * Se o item existe, remove. Se não existe, adiciona.
 * @param {Array} array - Array a ser modificado (mutação in-place)
 * @param {any} item - Item a ser adicionado ou removido
 * @returns {Array} O mesmo array modificado
 */
export default function toggleArrayItem(array, item) {
  const index = array.indexOf(item);
  if (index >= 0) {
    array.splice(index, 1);
  } else {
    array.push(item);
  }
  return array;
}
