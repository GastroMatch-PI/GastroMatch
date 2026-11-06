export const ENUMS = {
  dificuldade: { FACIL: 'Fácil', MEDIO: 'Médio', DIFICIL: 'Difícil' },
  tipo: { CAFE_DA_MANHA: 'Café da manhã', ALMOCO: 'Almoço', JANTAR: 'Jantar', LANCHE: 'Lanche', SOBREMESA: 'Sobremesa' },
  metodo: { FORNO: 'Forno', AIR_FRYER: 'Air fryer', GRELHA: 'Grelha', FOGAO: 'Fogão' },
  ocasiao: { ANIVERSARIO: 'Aniversário', CHURRASCO: 'Churrasco', NATAL: 'Natal', DIA_A_DIA: 'Dia a dia' },
  perfil: { VEGANO: 'Vegano', VEGETARIANO: 'Vegetariano', LOW_CARB: 'Low carb', SEM_GLUTEN: 'Sem glúten', SEM_LACTOSE: 'Sem lactose' },
  unidade: { G: 'g', ML: 'ml', UNIDADE: 'unidade', XICARA: 'xícara' },
  especializacao: { CONFEITARIA: 'Confeitaria', PANIFICACAO: 'Panificação', CARNES: 'Carnes', MASSAS: 'Massas', COZINHA_VEGETARIANA: 'Cozinha vegetariana' },
} as const

// Catálogo ilustrativo (valores por 100 g/ml, estimativas).
export type CatItem = { id: string; nome: string; kcal: number; prot: number; carb: number; gord: number }
export const catalogo: CatItem[] = [
  { id: 'ovo', nome: 'Ovos', kcal: 143, prot: 13, carb: 1, gord: 10 },
  { id: 'tomate', nome: 'Tomate', kcal: 18, prot: 0.9, carb: 3.9, gord: 0.2 },
  { id: 'cebola', nome: 'Cebola Roxa', kcal: 40, prot: 1.1, carb: 9, gord: 0.1 },
  { id: 'alho', nome: 'Alho', kcal: 149, prot: 6.4, carb: 33, gord: 0.5 },
  { id: 'azeite', nome: 'Azeite de Oliva', kcal: 884, prot: 0, carb: 0, gord: 100 },
  { id: 'queijo', nome: 'Queijo', kcal: 350, prot: 25, carb: 1.3, gord: 27 },
  { id: 'massa', nome: 'Massa Curta', kcal: 371, prot: 13, carb: 75, gord: 1.5 },
  { id: 'manjericao', nome: 'Manjericão', kcal: 23, prot: 3.2, carb: 2.7, gord: 0.6 },
  { id: 'cogumelo', nome: 'Cogumelos Paris', kcal: 22, prot: 3.1, carb: 3.3, gord: 0.3 },
  { id: 'arroz', nome: 'Arroz Arbóreo', kcal: 350, prot: 7, carb: 78, gord: 0.6 },
  { id: 'manteiga', nome: 'Manteiga', kcal: 717, prot: 0.9, carb: 0.1, gord: 81 },
  { id: 'vinho', nome: 'Vinho branco seco', kcal: 82, prot: 0.1, carb: 2.6, gord: 0 },
  { id: 'caldo', nome: 'Caldo de legumes', kcal: 5, prot: 0.2, carb: 0.8, gord: 0.1 },
  { id: 'abobora', nome: 'Abóbora Cabotiá', kcal: 40, prot: 1, carb: 10, gord: 0.1 },
  { id: 'salmao', nome: 'Salmão', kcal: 208, prot: 20, carb: 0, gord: 13 },
  { id: 'ervilha', nome: 'Ervilha fresca', kcal: 81, prot: 5.4, carb: 14, gord: 0.4 },
  { id: 'farinha', nome: 'Farinha de trigo', kcal: 364, prot: 10, carb: 76, gord: 1 },
  { id: 'acucar', nome: 'Açúcar', kcal: 387, prot: 0, carb: 100, gord: 0 },
  { id: 'leite', nome: 'Leite', kcal: 61, prot: 3.2, carb: 4.8, gord: 3.3 },
  { id: 'frango', nome: 'Peito de frango', kcal: 165, prot: 31, carb: 0, gord: 3.6 },
  { id: 'batata', nome: 'Batata', kcal: 77, prot: 2, carb: 17, gord: 0.1 },
  { id: 'cenoura', nome: 'Cenoura', kcal: 41, prot: 0.9, carb: 10, gord: 0.2 },
  { id: 'limao', nome: 'Limão', kcal: 29, prot: 1.1, carb: 9, gord: 0.3 },
  { id: 'sal', nome: 'Sal', kcal: 0, prot: 0, carb: 0, gord: 0 },
]
