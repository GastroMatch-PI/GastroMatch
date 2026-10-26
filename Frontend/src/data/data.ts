// Fotos do Unsplash (licença livre). Guardamos só o id e montamos a URL no tamanho que cada tela precisa.
export const photoUrl = (id: string, width = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=75`

export type Ingredient = {
  name: string
  note?: string
  qty?: number
  unit?: string
  plural?: string
}

export type Step = {
  title: string
  text: string
  timer?: { label: string; seconds: number }
}

export type Tip = { kind: 'erro' | 'dica'; title: string; text: string }

export type Recipe = {
  id: string
  title: string
  photos: string[]
  minutes: number
  difficulty: 'Fácil' | 'Médio'
  servings: number
  author: { name: string; role: 'Chef' | 'Nutricionista' }
  rating: number
  reviews: number
  saves: string
  collections: string[]
  pantry: string[]
  nutrition: { kcal: number; carbs: number; protein: number; fat: number; fiber: number; sodium: number }
  ingredients: Ingredient[]
  steps: Step[]
  tips: Tip[]
}

export const recipes: Recipe[] = [
  {
    id: 'risoto-de-cogumelos',
    title: 'Risoto de cogumelos frescos com azeite trufado',
    photos: [
      '1791409287925-61c6b27c91e3',
      '1723476662512-6abc972f1167',
      '1791409287840-f56f8611bc84',
      '1680420574628-225def8eea0a',
    ],
    minutes: 45,
    difficulty: 'Médio',
    servings: 4,
    author: { name: 'Henrique Faria', role: 'Chef' },
    rating: 4.9,
    reviews: 182,
    saves: '1,4 mil',
    collections: ['Prato principal', 'Vegetariano'],
    pantry: ['Arroz', 'Cogumelos', 'Queijo', 'Cebola', 'Azeite'],
    nutrition: { kcal: 420, carbs: 58, protein: 12, fat: 14, fiber: 3.5, sodium: 410 },
    ingredients: [
      { name: 'Arroz arbóreo', qty: 320, unit: 'g' },
      { name: 'Cogumelos paris e shimeji', note: 'limpos e fatiados', qty: 400, unit: 'g' },
      { name: 'Caldo de legumes', note: 'bem quente', qty: 1.2, unit: 'L' },
      { name: 'Parmesão', note: 'ralado na hora', qty: 80, unit: 'g' },
      { name: 'Vinho branco seco', qty: 120, unit: 'ml' },
      { name: 'Manteiga sem sal', note: 'gelada, em cubos', qty: 40, unit: 'g' },
      { name: 'Cebola pequena', note: 'picada', qty: 1, unit: 'unid.' },
      { name: 'Azeite extra virgem', qty: 40, unit: 'ml' },
      { name: 'Azeite trufado', note: 'para finalizar', qty: 10, unit: 'ml' },
      { name: 'Tomilho fresco', qty: 1, unit: 'maço', plural: 'maços' },
      { name: 'Sal' },
    ],
    steps: [
      {
        title: 'Doure os cogumelos',
        text: 'Aqueça metade do azeite em uma frigideira larga, em fogo alto. Junte os cogumelos sem amontoar e não mexa nos primeiros 2 minutos, para dourarem. Acrescente as folhas de tomilho e uma pitada de sal.',
        timer: { label: 'Cogumelos em fogo alto', seconds: 360 },
      },
      {
        title: 'Toste o arroz e deglaceie com o vinho',
        text: 'Em uma panela, refogue a cebola no restante do azeite. Junte o arroz seco e toste por 3 minutos, até as bordas ficarem translúcidas. Despeje o vinho gelado e mexa até o álcool evaporar.',
        timer: { label: 'Tostar o arroz', seconds: 180 },
      },
      {
        title: 'Cozinhe com o caldo, aos poucos',
        text: 'Vá juntando o caldo quente, uma concha de cada vez, mexendo sempre para soltar o amido. Mantenha o fogo médio. Leva de 16 a 18 minutos até o grão ficar al dente.',
        timer: { label: 'Cozimento com caldo', seconds: 960 },
      },
      {
        title: 'Finalize com manteiga e parmesão',
        text: 'Desligue o fogo. Misture os cogumelos (guarde algumas pontas para enfeitar), a manteiga gelada e o parmesão. Mexa com vigor até ficar cremoso, finalize com o azeite trufado e deixe descansar tampado.',
        timer: { label: 'Descanso', seconds: 120 },
      },
    ],
    tips: [
      {
        kind: 'erro',
        title: 'Não use caldo frio',
        text: 'Caldo gelado ou em temperatura ambiente interrompe a liberação do amido e deixa o grão empapado por fora e cru por dentro. Mantenha o caldo fervendo em uma panela ao lado.',
      },
      {
        kind: 'dica',
        title: 'O ponto da mantecatura',
        text: "Desligue o fogo um minuto antes de o grão ficar al dente. A manteiga precisa estar bem gelada para emulsionar com o amido e deixar o risoto cremoso, no ponto all'onda.",
      },
    ],
  },
  {
    id: 'shakshuka-rustica',
    title: 'Shakshuka rústica com ovos e queijo de cabra',
    photos: ['1757972367524-5272633a75df', '1780704664094-1595bf7c9a46', '1590412200988-a436970781fa'],
    minutes: 25,
    difficulty: 'Fácil',
    servings: 4,
    author: { name: 'Helena Prado', role: 'Chef' },
    rating: 4.8,
    reviews: 96,
    saves: '860',
    collections: ['Rápido', 'Prato principal', 'Vegetariano', 'Econômica'],
    pantry: ['Ovos', 'Tomate', 'Cebola', 'Alho', 'Azeite', 'Queijo'],
    nutrition: { kcal: 380, carbs: 22, protein: 24, fat: 21, fiber: 5, sodium: 520 },
    ingredients: [
      { name: 'Azeite de oliva', qty: 30, unit: 'ml' },
      { name: 'Cebola grande', note: 'picada', qty: 1, unit: 'unid.' },
      { name: 'Pimentão vermelho', note: 'em tiras', qty: 1, unit: 'unid.' },
      { name: 'Alho', note: 'picado', qty: 3, unit: 'dente', plural: 'dentes' },
      { name: 'Tomates pelados', qty: 800, unit: 'g' },
      { name: 'Páprica defumada', qty: 2, unit: 'col. (chá)' },
      { name: 'Cominho em pó', qty: 1, unit: 'col. (chá)' },
      { name: 'Ovos', qty: 4, unit: 'unid.' },
      { name: 'Queijo de cabra', qty: 100, unit: 'g' },
      { name: 'Coentro ou salsinha' },
      { name: 'Sal e pimenta-do-reino' },
    ],
    steps: [
      {
        title: 'Refogue a base',
        text: 'Aqueça o azeite em uma frigideira larga e refogue a cebola e o pimentão por 5 minutos, até amolecerem. Junte o alho, a páprica e o cominho e mexa por 30 segundos.',
        timer: { label: 'Refogar', seconds: 300 },
      },
      {
        title: 'Cozinhe o molho',
        text: 'Adicione os tomates, amassando com a colher, e tempere com sal e pimenta. Cozinhe em fogo médio por 10 minutos, até o molho engrossar.',
        timer: { label: 'Molho em fogo médio', seconds: 600 },
      },
      {
        title: 'Junte os ovos',
        text: 'Faça quatro covinhas no molho e quebre um ovo em cada uma. Tampe e cozinhe em fogo baixo até as claras firmarem e as gemas ficarem macias.',
        timer: { label: 'Ovos tampados', seconds: 330 },
      },
      {
        title: 'Finalize e sirva',
        text: 'Espalhe o queijo de cabra esfarelado e as ervas picadas. Sirva na própria frigideira, com pão para molhar.',
      },
    ],
    tips: [
      {
        kind: 'erro',
        title: 'Não mexa depois dos ovos',
        text: 'Com os ovos na panela, evite mexer o molho: assim as claras ficam inteiras e as gemas não passam do ponto.',
      },
      {
        kind: 'dica',
        title: 'Tomate muito ácido?',
        text: 'Uma pitada de açúcar no molho corrige a acidez sem deixar o prato doce.',
      },
    ],
  },
  {
    id: 'risoto-de-abobora',
    title: 'Risoto cremoso de abóbora cabotiá com sálvia',
    photos: ['1631651576049-5ffeefb88088', '1476124369491-e7addf5db371', '1736796311838-048d94ccc591'],
    minutes: 35,
    difficulty: 'Médio',
    servings: 2,
    author: { name: 'Camila Alencar', role: 'Nutricionista' },
    rating: 4.7,
    reviews: 74,
    saves: '540',
    collections: ['Prato principal', 'Vegetariano'],
    pantry: ['Arroz', 'Abóbora', 'Cebola', 'Queijo', 'Azeite'],
    nutrition: { kcal: 420, carbs: 62, protein: 11, fat: 13, fiber: 4.2, sodium: 280 },
    ingredients: [
      { name: 'Abóbora cabotiá', qty: 300, unit: 'g' },
      { name: 'Arroz arbóreo', qty: 160, unit: 'g' },
      { name: 'Cebola pequena', note: 'picada', qty: 1, unit: 'unid.' },
      { name: 'Caldo de legumes', note: 'quente, sem sal', qty: 700, unit: 'ml' },
      { name: 'Azeite de oliva', qty: 20, unit: 'ml' },
      { name: 'Manteiga', qty: 15, unit: 'g' },
      { name: 'Parmesão', note: 'ralado', qty: 30, unit: 'g' },
      { name: 'Folhas de sálvia', qty: 8, unit: 'unid.' },
      { name: 'Sal' },
    ],
    steps: [
      {
        title: 'Cozinhe a abóbora',
        text: 'Cozinhe metade da abóbora no vapor até ficar macia e amasse com um garfo. Corte o restante em cubos de 1,5 cm e reserve.',
        timer: { label: 'Abóbora no vapor', seconds: 720 },
      },
      {
        title: 'Refogue e toste o arroz',
        text: 'Refogue a cebola no azeite, junte o arroz e toste por 2 minutos, mexendo sempre.',
        timer: { label: 'Tostar o arroz', seconds: 120 },
      },
      {
        title: 'Cozinhe com o caldo',
        text: 'Junte a abóbora amassada e vá acrescentando o caldo quente aos poucos, mexendo. Coloque os cubos de abóbora nos últimos 8 minutos, para não desmancharem.',
        timer: { label: 'Cozimento', seconds: 1080 },
      },
      {
        title: 'Doure a sálvia e finalize',
        text: 'Frite as folhas de sálvia na manteiga até ficarem crocantes. Desligue o fogo, misture o parmesão ao risoto e sirva com a sálvia por cima.',
      },
    ],
    tips: [
      {
        kind: 'dica',
        title: 'Menos sal, mais sabor',
        text: 'O parmesão e a sálvia já temperam bastante. Use caldo sem sal e ajuste só no final.',
      },
      {
        kind: 'erro',
        title: 'Abóbora que desmancha',
        text: 'Cubos pequenos demais se desfazem no cozimento. Corte em pedaços maiores e junte-os no fim.',
      },
    ],
  },
  {
    id: 'massa-tomates-confitados',
    title: 'Massa fresca com tomates confitados e alho negro',
    photos: ['1778850620699-79ba3ff60bf0', '1698688332650-8724293b2ad8', '1784969565640-040562044eca'],
    minutes: 18,
    difficulty: 'Fácil',
    servings: 3,
    author: { name: 'Marco Vianna', role: 'Chef' },
    rating: 4.8,
    reviews: 61,
    saves: '720',
    collections: ['Rápido', 'Prato principal', 'Econômica', 'Vegetariano'],
    pantry: ['Massa', 'Tomate', 'Alho', 'Manjericão', 'Azeite'],
    nutrition: { kcal: 460, carbs: 68, protein: 14, fat: 15, fiber: 5, sodium: 350 },
    ingredients: [
      { name: 'Massa fresca', note: 'talharim ou ravióli', qty: 300, unit: 'g' },
      { name: 'Tomate-cereja', qty: 300, unit: 'g' },
      { name: 'Alho negro', qty: 3, unit: 'dente', plural: 'dentes' },
      { name: 'Alho', note: 'laminado', qty: 2, unit: 'dente', plural: 'dentes' },
      { name: 'Azeite de oliva', qty: 60, unit: 'ml' },
      { name: 'Manjericão fresco', qty: 1, unit: 'maço', plural: 'maços' },
      { name: 'Parmesão', note: 'ralado', qty: 40, unit: 'g' },
      { name: 'Sal e pimenta-do-reino' },
    ],
    steps: [
      {
        title: 'Confite os tomates',
        text: 'Em uma frigideira, aqueça o azeite com o alho laminado em fogo baixo. Junte os tomates inteiros e cozinhe até estourarem e soltarem o caldo.',
        timer: { label: 'Tomates em fogo baixo', seconds: 600 },
      },
      {
        title: 'Cozinhe a massa',
        text: 'Cozinhe a massa fresca em bastante água fervente com sal. Antes de escorrer, reserve uma xícara da água do cozimento.',
        timer: { label: 'Massa fresca', seconds: 150 },
      },
      {
        title: 'Junte tudo',
        text: 'Passe a massa para a frigideira, acrescente o alho negro amassado e um pouco da água do cozimento. Mexa até o molho envolver a massa.',
        timer: { label: 'Finalizar na frigideira', seconds: 60 },
      },
      {
        title: 'Sirva',
        text: 'Finalize com o manjericão rasgado, o parmesão e um fio de azeite.',
      },
    ],
    tips: [
      {
        kind: 'dica',
        title: 'Guarde a água do cozimento',
        text: 'O amido da água ajuda o molho a grudar na massa. Vá juntando aos poucos até chegar na textura que você gosta.',
      },
      {
        kind: 'erro',
        title: 'Alho queimado amarga',
        text: 'Mantenha o fogo baixo e coloque o tomate assim que o alho começar a dourar.',
      },
    ],
  },
  {
    id: 'salmao-com-pure-de-ervilha',
    title: 'Salmão crocante com purê de ervilha fresca',
    photos: ['1676300185165-3f543c1fcb72', '1712334562767-5d366d0c40d9', '1676300184021-96fa00e1a987'],
    minutes: 22,
    difficulty: 'Médio',
    servings: 2,
    author: { name: 'Paula Rezende', role: 'Nutricionista' },
    rating: 4.9,
    reviews: 58,
    saves: '430',
    collections: ['Rápido', 'Prato principal', 'Low carb'],
    pantry: ['Salmão', 'Azeite', 'Alho'],
    nutrition: { kcal: 510, carbs: 14, protein: 38, fat: 32, fiber: 6, sodium: 390 },
    ingredients: [
      { name: 'Filé de salmão com pele', qty: 300, unit: 'g' },
      { name: 'Ervilha fresca', note: 'ou congelada', qty: 300, unit: 'g' },
      { name: 'Manteiga', qty: 20, unit: 'g' },
      { name: 'Azeite de oliva', qty: 20, unit: 'ml' },
      { name: 'Hortelã fresca', qty: 6, unit: 'folha', plural: 'folhas' },
      { name: 'Limão-siciliano', qty: 1, unit: 'unid.' },
      { name: 'Sal e pimenta-do-reino' },
    ],
    steps: [
      {
        title: 'Prepare o purê',
        text: 'Cozinhe as ervilhas em água fervente com sal e escorra. Bata no processador com a manteiga, a hortelã e um pouco da água do cozimento, até ficar liso.',
        timer: { label: 'Ervilhas na água fervente', seconds: 240 },
      },
      {
        title: 'Sele o salmão',
        text: 'Seque bem os filés e tempere com sal. Em uma frigideira bem quente com azeite, coloque o salmão com a pele para baixo e pressione por 10 segundos. Deixe cozinhar sem mexer.',
        timer: { label: 'Lado da pele', seconds: 270 },
      },
      {
        title: 'Vire e finalize',
        text: 'Vire o filé, cozinhe por mais 1 minuto e desligue o fogo. Sirva sobre o purê com raspas e algumas gotas de limão.',
        timer: { label: 'Lado da carne', seconds: 60 },
      },
    ],
    tips: [
      {
        kind: 'erro',
        title: 'Pele úmida não fica crocante',
        text: 'Seque o salmão com papel toalha antes de levar à frigideira.',
      },
      {
        kind: 'dica',
        title: 'O ponto do salmão',
        text: 'Tire do fogo quando o centro ainda estiver rosado: ele termina de cozinhar com o calor da própria peça.',
      },
    ],
  },
]

export const featured = recipes[0]

export const collections = ['Todos', 'Rápido', 'Prato principal', 'Vegetariano', 'Low carb', 'Econômica']

export const fridgeItems = [
  'Tomate',
  'Ovos',
  'Alho',
  'Cebola',
  'Azeite',
  'Queijo',
  'Manjericão',
  'Arroz',
  'Cogumelos',
  'Abóbora',
  'Salmão',
  'Massa',
]

export type Pro = {
  id: string
  name: string
  kind: 'Chef particular' | 'Nutricionista' | 'Restaurante'
  headline: string
  specialty: string
  place: string
  distance: string
  badge: string
  bio: string
  tags: string[]
  services: string[]
  rating: string
  cover: string
  kit: { title: string; price: string; detail: string }
  footer: string
  cta: string
  contact: { instagram: string; whatsapp: string }
}

export const pros: Pro[] = [
  {
    id: 'bernardo-rossi',
    name: 'Bernardo Rossi',
    kind: 'Chef particular',
    headline: 'Chef particular e consultor gastronômico',
    specialty: 'Alta gastronomia',
    place: 'Jardins',
    distance: '2,4 km',
    badge: 'Perfil verificado',
    bio: 'Formado pelo Institut Paul Bocuse, trabalha com risotos, reduções lentas e harmonização com vinhos biodinâmicos. Atende menus degustação em casa, para 4 a 12 pessoas.',
    tags: ['Alta gastronomia', 'Cozinha italiana autoral', 'Harmonização'],
    services: ['Entrega de kits', 'Atendimento domiciliar', 'Menu degustação'],
    rating: '4,9 · 64 jantares',
    cover: '1600565193348-f74bd3c7ccdf',
    kit: {
      title: 'Kit risoto de açafrão e ossobuco',
      price: 'R$ 120',
      detail: 'Ingredientes porcionados, caldo de 24 horas e vídeo com o passo a passo.',
    },
    footer: 'Agenda com 48 horas de antecedência',
    cta: 'Ver contato',
    contact: { instagram: '@bernardorossi.chef', whatsapp: '(11) 90000-0001' },
  },
  {
    id: 'camila-vasconcelos',
    name: 'Camila Vasconcelos',
    kind: 'Nutricionista',
    headline: 'Nutrição funcional e gastronomia terapêutica',
    specialty: 'Nutrição funcional',
    place: 'Pinheiros',
    distance: '1,1 km',
    badge: 'CRN-3 48910 validado',
    bio: 'Atua com saúde intestinal, redução de inflamação e reeducação alimentar sem perder o sabor. Monta planos de refeições a partir do que você já tem em casa e das feiras orgânicas do bairro.',
    tags: ['Nutrição funcional', 'Cardápios anti-inflamatórios', 'Presencial e online'],
    services: ['Entrega de kits'],
    rating: '5,0 · 92 consultas',
    cover: '1512621776951-a57141f2eefd',
    kit: {
      title: 'Caixa de fermentados vivos',
      price: 'R$ 95',
      detail: 'Kombucha artesanal, crackers de sementes ativadas e guia de preparo.',
    },
    footer: 'Teleconsulta disponível',
    cta: 'Ver contato',
    contact: { instagram: '@camilavasconcelos.nutri', whatsapp: '(11) 90000-0002' },
  },
  {
    id: 'farina-e-fuoco',
    name: 'Atelier Pastifício Farina & Fuoco',
    kind: 'Restaurante',
    headline: 'Restaurante intimista e fábrica de massas frescas',
    specialty: 'Massas artesanais',
    place: 'Vila Madalena',
    distance: '3,2 km',
    badge: 'Cozinha auditada',
    bio: 'Farinhas italianas moídas em pedra, gemas caipiras e fermentação de 72 horas nos pães. Almoço executivo no balcão e caixas de massa fresca para finalizar em casa em 3 minutos.',
    tags: ['Massas artesanais', 'Vinhos naturais', 'Salão e takeaway'],
    services: ['Entrega de kits'],
    rating: '4,8 · 180 avaliações',
    cover: '1538334421852-687c439c92f4',
    kit: {
      title: 'Box ravióli de pato ao molho de laranja',
      price: 'R$ 88',
      detail: 'Serve duas pessoas, com pecorino para ralar na hora.',
    },
    footer: 'Terça a domingo, das 12h às 23h',
    cta: 'Ver contato',
    contact: { instagram: '@farinaefuoco', whatsapp: '(11) 90000-0003' },
  },
]

export const reels = [
  { id: 'faca', views: '48 mil', topic: 'Técnica de faca', title: 'Corte julienne em legumes', by: '@chef_bernardo', photo: '1622021142947-da7dedc7c39a' },
  { id: 'molho', views: '32 mil', topic: 'Molhos clássicos', title: 'Emulsão que não desanda', by: '@atelier_farina', photo: '1577219492769-b63a779fac28' },
  { id: 'prato', views: '89 mil', topic: 'Empratamento', title: 'Pinça e pontos de purê', by: '@gastro_master', photo: '1577106263724-2c8e03bfe9cf' },
  { id: 'pao', views: '61 mil', topic: 'Panificação', title: 'Fermentação natural na focaccia', by: '@dra_camila', photo: '1621792955638-dd918b78b4ae' },
]

export const trending = [
  { name: 'Rogério Bittencourt', sub: 'Bistrô Alquimia, São Paulo', stat: '32 receitas' },
  { name: 'Luciana Ferraz', sub: 'Panificação e fermentação natural', stat: '19 receitas' },
  { name: 'Camila Alencar', sub: 'Nutrição clínica e gastronomia', stat: '45 receitas' },
  { name: 'Restaurante Raízes', sub: 'Cozinha da terra, Rio de Janeiro', stat: 'Cardápio da estação' },
]

export const seedComments = [
  {
    id: 1,
    recipeId: 'risoto-de-cogumelos',
    name: 'Beatriz Valença',
    where: 'São Paulo, SP',
    when: 'há 2 dias',
    text: 'O aviso sobre o caldo frio salvou meu jantar! Eu sempre errava a textura do risoto e hoje ficou cremoso como o dos restaurantes italianos.',
    rating: 5,
    useful: 34,
  },
  {
    id: 2,
    recipeId: 'risoto-de-cogumelos',
    name: 'Rodrigo Nogueira',
    where: 'Belo Horizonte, MG',
    when: 'há 5 dias',
    text: 'Troquei o vinho por caldo com um pouco de limão e funcionou bem. O cronômetro em cada passo ajuda muito.',
    rating: 5,
    useful: 12,
  },
  {
    id: 3,
    recipeId: 'shakshuka-rustica',
    name: 'Marina Costa',
    where: 'Curitiba, PR',
    when: 'há 1 semana',
    text: 'Rápida e barata. Usei feta no lugar do queijo de cabra e ficou ótima.',
    rating: 4,
    useful: 8,
  },
]
