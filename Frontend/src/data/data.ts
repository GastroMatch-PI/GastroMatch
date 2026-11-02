export type Recipe = {
  id: string
  title: string
  emoji: string
  seed: number
  minutes: number
  difficulty: 'Fácil' | 'Médio'
  servings: number
  author: string
  role: 'Chef' | 'Nutricionista'
  collections: string[]
  ingredients: string[]
  nutrition: string
}

export const recipes: Recipe[] = [
  {
    id: 'shakshuka',
    title: 'Shakshuka Rústica com Ovos Caipiras e Queijo de Cabra',
    emoji: '🍳',
    seed: 1,
    minutes: 25,
    difficulty: 'Fácil',
    servings: 4,
    author: 'Chef Helena Prado',
    role: 'Chef',
    collections: ['Rápido (<30min)', 'Prato Principal'],
    ingredients: ['Ovos', 'Tomate', 'Cebola Roxa', 'Alho', 'Azeite de Oliva', 'Queijo'],
    nutrition: '380 kcal • 24g Proteína',
  },
  {
    id: 'risotto-abobora',
    title: 'Risotto Cremoso de Abóbora Cabotiá com Sálvia Dourada',
    emoji: '🍚',
    seed: 3,
    minutes: 35,
    difficulty: 'Médio',
    servings: 2,
    author: 'Dra. Camila Alencar',
    role: 'Nutricionista',
    collections: ['Vegetariano', 'Prato Principal'],
    ingredients: ['Cebola Roxa', 'Alho', 'Azeite de Oliva', 'Queijo'],
    nutrition: '420 kcal • Baixo Sódio',
  },
  {
    id: 'massa-alho-negro',
    title: 'Massa Fresca Rápida com Tomates Confitados e Alho Negro',
    emoji: '🍝',
    seed: 0,
    minutes: 18,
    difficulty: 'Fácil',
    servings: 3,
    author: 'Chef Marco Vianna',
    role: 'Chef',
    collections: ['Rápido (<30min)', 'Econômica'],
    ingredients: ['Massa Curta', 'Tomate', 'Alho', 'Azeite de Oliva', 'Manjericão'],
    nutrition: '460 kcal • Fibras Altas',
  },
  {
    id: 'salmao-mousseline',
    title: 'Salmão Crocante com Mousseline de Ervilhas Frescas',
    emoji: '🐟',
    seed: 2,
    minutes: 22,
    difficulty: 'Médio',
    servings: 2,
    author: 'Paula Rezende',
    role: 'Nutricionista',
    collections: ['Low Carb', 'Rápido (<30min)', 'Prato Principal'],
    ingredients: ['Alho', 'Azeite de Oliva'],
    nutrition: '510 kcal • 38g Proteína',
  },
]

export const collections = [
  'Todos',
  'Rápido (<30min)',
  'Low Carb',
  'Vegetariano',
  'Confeitaria',
  'Prato Principal',
  'Econômica',
]

export const fridgeItems = [
  'Tomate',
  'Queijo',
  'Manjericão',
  'Ovos',
  'Alho',
  'Cebola Roxa',
  'Azeite de Oliva',
  'Massa Curta',
  'Cogumelos Paris',
]

export type Pro = {
  id: string
  name: string
  area: string
  place: string
  kind: 'Chef Particular' | 'Nutricionista' | 'Restaurante'
  badge: string
  bio: string
  tags: string[]
  kit: { label: string; title: string; price: string; detail: string }
  rating: string
  emoji: string
  seed: number
  footer: string
  cta: string
}

export const pros: Pro[] = [
  {
    id: 'bernardo',
    name: 'Chef Bernardo Rossi',
    area: 'Chef Particular & Consultor Gastronômico (ex-Fasano)',
    place: 'Jardins (2.4 km)',
    kind: 'Chef Particular',
    badge: 'Verificado GastroMatch',
    bio: 'Formado pelo Institut Paul Bocuse, especializado em risotos de precisão, reduções lentas e harmonizações com vinhos biodinâmicos. Atende menus degustação privativos de 4 a 12 pessoas.',
    tags: ['Alta Gastronomia', 'Cozinha Autoral Italiana', 'Harmonização Sommelier'],
    kit: {
      label: 'Kit autoral & caixa surpresa',
      title: 'Kit Risoto Autoral de Açafrão & Ossobuco',
      price: 'R$ 120',
      detail: 'Ingredientes pré-porcionados com caldos de 24h e instrução em vídeo',
    },
    rating: '4.9 (64 jantares)',
    emoji: '👨‍🍳',
    seed: 1,
    footer: '48h antecedência • Entrega própria de kits',
    cta: 'Conversar',
  },
  {
    id: 'camila',
    name: 'Dra. Camila Vasconcelos',
    area: 'Nutrição Funcional & Gastronomia Terapêutica',
    place: 'Pinheiros (1.1 km)',
    kind: 'Nutricionista',
    badge: 'CRN-3 48.910 Validado',
    bio: 'Especialista em saúde intestinal, redução inflamatória e reeducação alimentar sem perda de sabor. Desenvolve planos de refeições sincronizados diretamente com seu armário e feiras orgânicas locais.',
    tags: ['Nutrição Funcional', 'Cardápios Anti-inflamatórios', 'Atendimento Presencial & Online'],
    kit: {
      label: 'Kit funcional semanal',
      title: 'Caixa Desintoxicação & Fermentados Vivos',
      price: 'R$ 95',
      detail: 'Kombucha artesanal, crackers de sementes ativadas & guia de preparo',
    },
    rating: '5.0 (92 consultas)',
    emoji: '🥗',
    seed: 2,
    footer: 'Teleconsulta disponível',
    cta: 'Agendar Consulta',
  },
  {
    id: 'farina',
    name: 'Atelier Pastifício Farina & Fuoco',
    area: 'Restaurante Intimista & Fábrica de Massas Frescas',
    place: 'Vila Madalena (3.2 km)',
    kind: 'Restaurante',
    badge: 'Cozinha Auditada GastroMatch',
    bio: 'Farinhas italianas moídas em pedra, gemas caipiras e fermentação de 72 horas para pães rústicos. Almoço executivo no balcão e caixas de massas frescas prontas para finalizar em 3 minutos em casa.',
    tags: ['Massas Artesanais', 'Vinhos Naturais', 'Takeaway & Salão'],
    kit: {
      label: 'Caixa surpresa do chef',
      title: 'Box Ravioli de Pato ao Molho de Laranja',
      price: 'R$ 88',
      detail: 'Serve 2 pessoas com queijo pecorino ralado na hora',
    },
    rating: '4.8 (180 avaliações)',
    emoji: '🍝',
    seed: 0,
    footer: 'Terça a Domingo • 12h às 23h',
    cta: 'Reservar Mesa',
  },
]

export const reels = [
  { views: '48k', topic: 'Técnica de faca', title: 'Corte Julienne Impecável em Legumes', by: '@chef_bernardo', emoji: '🔪', seed: 4 },
  { views: '32.6k', topic: 'Molhos clássicos', title: 'Segredo da Emulsão que Nunca Desanda', by: '@atelier_farina', emoji: '🥣', seed: 1 },
  { views: '89.1k', topic: 'Fine dining', title: 'Empratamento com Pinça & Pontos de Purê', by: '@gastro_master', emoji: '🍽️', seed: 2 },
  { views: '61.4k', topic: 'Panificação viva', title: 'Bolhas de Fermentação Natural na Focaccia', by: '@dra_camila', emoji: '🍞', seed: 3 },
]

export const trending = [
  { name: 'Rogério Bittencourt', sub: 'Bistrô Alquimia • SP', stat: '32 fichas publicadas', emoji: '👨‍🍳' },
  { name: 'Luciana Ferraz', sub: 'Panificação & Fermentação Natural', stat: '19 fichas publicadas', emoji: '👩‍🍳' },
  { name: 'Dra. Camila Alencar', sub: 'Nutrição Clínica & Gastronomia', stat: '45 fichas auditadas', emoji: '🥗' },
  { name: 'Restaurante Raízes', sub: 'Cozinha da Terra • RJ', stat: 'Cardápio da Estação', emoji: '🍽️' },
]

export const steps = [
  {
    title: 'Refogado dourado dos cogumelos com tomilho',
    text: 'Aqueça metade do azeite em frigideira larga em fogo bem alto. Adicione os cogumelos cortados sem amontoar. Não mexa nos primeiros 2 minutos para caramelizar. Adicione as folhas de tomilho-limão e flor de sal.',
    timer: 'Refogar cogumelos em fogo alto por 6 minutos',
    seconds: 360,
    emoji: '🍄',
    seed: 4,
  },
  {
    title: 'Tostagem do arroz (Tostatura) e deglace com vinho branco',
    text: 'Na panela principal, sue a echalota picada no azeite. Adicione o arroz arbóreo a seco e toste por 3 minutos até as bordas ficarem translúcidas e os grãos quentes ao toque. Despeje o vinho branco gelado e mexa vigorosamente até evaporar o álcool.',
    timer: 'Tostatura e evaporação do álcool por 3 minutos',
    seconds: 180,
    emoji: '🍷',
    seed: 3,
  },
  {
    title: 'Cozimento ritmado com conchas de caldo fervente',
    text: 'Vá incorporando o caldo vegetal fervente concha por concha, mexendo em movimentos de oito para desprender o amido. Mantenha fogo médio constante. O processo deve durar cerca de 16 a 18 minutos até o grão atingir resistência ideal al dente.',
    timer: 'Ciclo de cozimento com caldo: 16 minutos',
    seconds: 960,
    emoji: '🥘',
    seed: 1,
  },
  {
    title: 'Mantecatura, azeite trufado e descanso final',
    text: 'Apague a chama. Incorpore os cogumelos refogados (reserve algumas pontas para guarnição), a manteiga gelada e o queijo parmesão ralado fino. Bata a panela ritmicamente até formar ondas cremosas. Finalize com fio generoso de azeite trufado. Deixe descansar tampado por 2 minutos.',
    timer: 'Repouso de mantecare por 2 minutos',
    seconds: 120,
    emoji: '🍚',
    seed: 0,
  },
]

export const baseIngredients: { name: string; qty: number; unit: string }[] = [
  { name: 'Arroz Arbóreo especial para risoto', qty: 320, unit: 'g' },
  { name: 'Cogumelos Paris e Shimeji frescos limpos', qty: 400, unit: 'g' },
  { name: 'Caldo artesanal de legumes aquecido', qty: 1.2, unit: 'L' },
  { name: 'Queijo Parmigiano Reggiano ralado na hora', qty: 80, unit: 'g' },
  { name: 'Vinho branco seco de boa acidez', qty: 120, unit: 'ml' },
  { name: 'Manteiga sem sal gelada em cubos', qty: 40, unit: 'g' },
  { name: 'Azeite extra virgem trufado', qty: 20, unit: 'ml' },
  { name: 'Ramos de tomilho-limão fresco e flor de sal', qty: 1, unit: 'maço' },
]

export const comments = [
  {
    name: 'Beatriz Valença',
    where: 'São Paulo, SP',
    when: 'Há 2 dias',
    text: 'O alerta sobre não colocar caldo frio salvou o meu jantar! Sempre errava a textura do risoto e hoje ficou perfeitamente aveludado, bem como nos restaurantes italianos.',
    useful: 34,
  },
  {
    name: 'Rodrigo Nogueira',
    where: 'Belo Horizonte, MG',
    when: 'Há 5 dias',
    text: 'Substituí o vinho por caldo de legumes com limão e funcionou muito bem. O timer integrado ajuda demais.',
    useful: 12,
  },
]
