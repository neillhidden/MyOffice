export const BUSINESS_SUBCATEGORIES: Record<string, string[]> = {
  Games: ['Jogos', 'Consoles', 'Comandos e acessórios'],
  'Casa & Cozinha': ['Utensílios', 'Eletrodomésticos', 'Decoração', 'Limpeza'],
  Moda: ['Roupa', 'Calçado', 'Acessórios'],
  Eletrónicos: ['Telemóveis', 'Computadores', 'Áudio', 'Cabos e carregadores'],
  Animais: ['Alimentação', 'Higiene', 'Brinquedos e acessórios'],
};
export const HOME_SUBCATEGORIES: Record<string, string[]> = {
  Habitação: ['Renda', 'Manutenção', 'Mobiliário'],
  Alimentação: ['Mercearia', 'Frutas e legumes', 'Refeições'],
  Transporte: ['Combustível', 'Transportes públicos', 'Manutenção'],
  Saúde: ['Medicamentos', 'Consultas', 'Higiene'],
  Educação: ['Mensalidades', 'Material escolar', 'Cursos'],
  Serviços: ['Água', 'Energia', 'Internet'],
  Lazer: ['Passeios', 'Férias'],
  Outros: [],
  Games: ['Jogos', 'Consoles', 'Comandos e acessórios'],
};
export function categoryChildren(
  tree: Record<string, string[]>,
  category: string,
): string[] {
  return Object.prototype.hasOwnProperty.call(tree, category)
    ? tree[category]
    : [];
}
export function validateCategoryTree(
  value: unknown,
): asserts value is Record<string, string[]> {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).length > 500
  )
    throw new Error('Subcategorias inválidas.');
  for (const [parent, children] of Object.entries(value)) {
    if (
      !parent.trim() ||
      parent.length > 300 ||
      !Array.isArray(children) ||
      children.length > 500 ||
      children.some(
        (c) => typeof c !== 'string' || !c.trim() || c.length > 300,
      ) ||
      new Set(children.map((c) => c.trim().toLocaleLowerCase())).size !==
        children.length
    )
      throw new Error('Subcategorias inválidas ou repetidas.');
  }
}
