export function buildSearchParamsFromAdvancedFilters(filters = {}) {
  const terms = Array.isArray(filters.terms) ? filters.terms : [];
  const tags = Array.isArray(filters.tags) ? filters.tags : [];
  const licenses = Array.isArray(filters.licenses) ? filters.licenses : [];

  const qValues = [];
  const titleValues = [];
  const contributorValues = [];
  const subjectTermValues = [];
  const materialValues = [];
  const techniqueValues = [];
  const aestheticsValues = [];
  const culturalContextValues = [];
  const typologyValues = [];

  terms.forEach((term) => {
    if (!term?.value?.trim?.()) return;
    const v = term.value.trim();
    switch (term.field) {
      case "title": titleValues.push(v); break;
      case "author": contributorValues.push(v); break;
      case "tag": subjectTermValues.push(v); break;
      case 'materials': materialValues.push(v); break;
      case 'techniques': techniqueValues.push(v); break;
      case 'aesthetics': aestheticsValues.push(v); break;
      case 'cultural': culturalContextValues.push(v); break;
      case 'typology': typologyValues.push(v); break;
      case "all": default: qValues.push(v); break;
    }
  });

  const params = {};

  if (qValues.length) params.q = qValues.join(" ");
  if (titleValues.length) params.title = titleValues.join(" ");
  if (contributorValues.length) params.contributor = contributorValues.join(" ");

  const pushArrayParam = (key, values) => {
    if (values.length === 1) params[key] = values[0];
    else if (values.length > 1) params[key] = values;
  };

  pushArrayParam('subject_term[]', subjectTermValues);
  pushArrayParam('material_term[]', materialValues);
  pushArrayParam('technique_term[]', techniqueValues);
  pushArrayParam('aesthetics_term[]', aestheticsValues);
  pushArrayParam('cultural_context_term[]', culturalContextValues);
  pushArrayParam('typology_term[]', typologyValues);

  const subjectIds = tags.filter((id) => typeof id === 'string' && id.length > 0);
  pushArrayParam('subject[]', subjectIds);

  const licenseValues = licenses.filter((l) => typeof l === 'string' && l.length > 0);
  pushArrayParam('license[]', licenseValues);

  if (typeof filters.imageStartYear === "number") params.date_from = `${filters.imageStartYear}-01-01`;
  if (typeof filters.imageEndYear === "number") params.date_to = `${filters.imageEndYear}-12-31`;
  if (typeof filters.workStartYear === "number") params.work_date_from = `${filters.workStartYear}-01-01`;
  if (typeof filters.workEndYear === "number") params.work_date_to = `${filters.workEndYear}-12-31`;

  Object.entries(filters.characteristics || {}).forEach(([key, side]) => {
    if (side === "left" || side === "right") params[`binomial[${key}]`] = side;
  });

  return params;
}