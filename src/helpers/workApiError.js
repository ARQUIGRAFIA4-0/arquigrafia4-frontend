// Traduz erros da API de obras. A mesma falha muda de chave conforme o endpoint
// ("payload.descriptions.0", "descriptions.0"), então traduzimos pelo campo.

const FIELD_LABELS = {
  agents: "autoria",
  dates: "datas",
  materials: "materiais",
  techniques: "técnicas",
  style_periods: "aspectos estéticos",
  cultural_contexts: "contexto cultural",
  work_types: "tipologia",
  subjects: "assuntos",
  location_id: "localização",
};

const FIELD_MESSAGES = {
  descriptions: "A descrição não foi encontrada; tente enviar de novo.",
  titles: "A obra precisa de exatamente um título principal.",
  text: "A descrição não pode ficar vazia.",
  payload: "Não há alterações válidas para enviar.",
};

const fieldFromKey = (key) => key.replace(/^payload\./, "").replace(/\.\d+$/, "");

/**
 * Devolve `{ message, existingWork }`. A `message` do backend só é usada quando
 * não há `errors`: nas validações ela pode trazer o nome cru do campo.
 */
export const workApiError = (error, fallback) => {
  const data = error?.response?.data;
  const existingWork = data?.existing_work ?? null;

  const fields = Object.keys(data?.errors ?? {}).map(fieldFromKey);
  for (const field of fields) {
    if (FIELD_MESSAGES[field]) return { message: FIELD_MESSAGES[field], existingWork };
  }
  const labeled = fields.find((field) => FIELD_LABELS[field]);
  if (labeled) {
    return {
      message: `Um item de ${FIELD_LABELS[labeled]} não existe mais. Revise e envie de novo.`,
      existingWork,
    };
  }

  return { message: data?.message || fallback, existingWork };
};

export default workApiError;
