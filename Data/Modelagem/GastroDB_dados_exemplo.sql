-- =====================================================================
-- GastroMatch - Dados de exemplo (apenas DESENVOLVIMENTO)
-- Rodar DEPOIS do GastroDB_v1.0.0.sql. Pode ser executado mais de uma vez
-- (INSERT IGNORE com ids fixos: não duplica nem apaga nada).
--
-- Contém: 1 chef de exemplo, 18 ingredientes e 5 receitas completas
-- (ingredientes, etapas e dicas).
--
-- O chef de exemplo NÃO tem usuário vinculado, então ninguém consegue logar
-- como ele: serve só como "dono" das receitas para testar as rotas públicas.
-- Valores nutricionais aproximados (por 100 g ou 100 ml), só para demonstração.
-- =====================================================================

SET NAMES utf8mb4;
USE `gastromatch`;

-- ---------------------------------------------------------------------
-- Chef de exemplo
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `profissional` (`id`, `bio`, `role`)
VALUES (1, 'Chef de exemplo para testes. Dados de demonstração.', 'CHEF');

INSERT IGNORE INTO `chef` (`id`, `id_profissional`, `especializacao`)
VALUES (1, 1, 'MASSAS');

-- ---------------------------------------------------------------------
-- Ingredientes (porcao_base = 100; calorias, gordura, proteina, carboidrato)
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `ingrediente`
  (`id`, `nome`, `porcao_base`, `calorias`, `gordura`, `proteina`, `carboidrato`) VALUES
  (1,  'Farinha de trigo',       100, 360,  1.4,  9.8, 75.0),
  (2,  'Açúcar refinado',        100, 387,  0.0,  0.0, 99.5),
  (3,  'Ovo',                    100, 143,  9.5, 13.0,  1.6),
  (4,  'Leite integral',         100,  61,  3.3,  3.2,  4.7),
  (5,  'Manteiga',               100, 717, 81.0,  0.9,  0.1),
  (6,  'Fermento químico em pó', 100,  53,  0.0,  0.0, 27.7),
  (7,  'Arroz branco cru',       100, 360,  0.6,  7.0, 79.0),
  (8,  'Feijão carioca cozido',  100,  76,  0.5,  4.8, 13.6),
  (9,  'Alho',                   100, 149,  0.5,  6.4, 33.1),
  (10, 'Cebola',                 100,  40,  0.1,  1.1,  9.3),
  (11, 'Óleo de soja',           100, 884, 100.0, 0.0,  0.0),
  (12, 'Sal',                    100,   0,  0.0,  0.0,  0.0),
  (13, 'Peito de frango cru',    100, 120,  2.6, 22.5,  0.0),
  (14, 'Abobrinha',              100,  17,  0.3,  1.2,  3.1),
  (15, 'Azeite de oliva',        100, 884, 100.0, 0.0,  0.0),
  (16, 'Queijo mussarela',       100, 300, 22.4, 22.2,  2.2),
  (17, 'Macarrão espaguete cru', 100, 371,  1.5, 13.0, 75.0),
  (18, 'Pimenta-do-reino',       100, 251,  3.3, 10.0, 64.0);

-- ---------------------------------------------------------------------
-- Receitas (todas do chef 1)
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `receita`
  (`id`, `nome`, `descricao`, `n_porcoes`, `dificuldade`, `tipo`, `metodo_preparo`,
   `ocasiao`, `tempo_preparo`, `perfil`, `id_chef`) VALUES
  (1, 'Bolo simples de leite',
      'Bolo fofinho de forma, perfeito para o café da tarde.',
      10, 'FACIL', 'SOBREMESA', 'FORNO', 'ANIVERSARIO', 60, NULL, 1),
  (2, 'Arroz e feijão do dia a dia',
      'O clássico brasileiro, sem carne, feito na panela.',
      4, 'FACIL', 'ALMOCO', 'FOGAO', 'DIA_A_DIA', 45, 'VEGANO', 1),
  (3, 'Frango grelhado com abobrinha',
      'Refeição leve e rica em proteína, pronta em meia hora.',
      2, 'FACIL', 'JANTAR', 'GRELHA', 'DIA_A_DIA', 30, 'LOW_CARB', 1),
  (4, 'Omelete de queijo',
      'Café da manhã rápido, com poucos ingredientes.',
      1, 'FACIL', 'CAFE_DA_MANHA', 'FOGAO', 'DIA_A_DIA', 10, 'LOW_CARB', 1),
  (5, 'Macarrão ao alho e óleo',
      'Prato simples e saboroso, feito com o que tem na despensa.',
      2, 'MEDIO', 'ALMOCO', 'FOGAO', 'DIA_A_DIA', 25, 'VEGETARIANO', 1);

-- ---------------------------------------------------------------------
-- Ingredientes de cada receita (receita, ingrediente, quantidade, unidade)
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `ingrediente_receita`
  (`id`, `id_receita`, `id_ingrediente`, `quantidade`, `unidade_medida`) VALUES
  (1,  1, 1,  300, 'G'),
  (2,  1, 2,  200, 'G'),
  (3,  1, 3,  150, 'G'),
  (4,  1, 4,  200, 'ML'),
  (5,  1, 5,  100, 'G'),
  (6,  1, 6,   10, 'G'),
  (7,  2, 7,  200, 'G'),
  (8,  2, 8,  300, 'G'),
  (9,  2, 9,   10, 'G'),
  (10, 2, 10,  50, 'G'),
  (11, 2, 11,  20, 'ML'),
  (12, 2, 12,   5, 'G'),
  (13, 3, 13, 300, 'G'),
  (14, 3, 14, 200, 'G'),
  (15, 3, 15,  15, 'ML'),
  (16, 3, 12,   3, 'G'),
  (17, 4, 3,  150, 'G'),
  (18, 4, 16,  40, 'G'),
  (19, 4, 5,    5, 'G'),
  (20, 4, 12,   1, 'G'),
  (21, 5, 17, 250, 'G'),
  (22, 5, 9,   20, 'G'),
  (23, 5, 15,  40, 'ML'),
  (24, 5, 12,   5, 'G'),
  (25, 5, 18,   1, 'G');

-- ---------------------------------------------------------------------
-- Etapas (ordem começa em 1 dentro de cada receita)
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `etapa_receita`
  (`id`, `id_receita`, `ordem`, `titulo`, `instrucao`) VALUES
  (1,  1, 1, 'Preparar a forma',   'Unte uma forma de 22 cm com manteiga e farinha e ligue o forno a 180 °C.'),
  (2,  1, 2, 'Misturar a massa',   'Bata os ovos, o açúcar, a manteiga e o leite até ficar homogêneo.'),
  (3,  1, 3, 'Juntar os secos',    'Acrescente a farinha aos poucos e, por último, o fermento, mexendo sem bater demais.'),
  (4,  1, 4, 'Assar',              'Despeje na forma e asse por 40 minutos, até um palito sair limpo.'),
  (5,  2, 1, 'Cozinhar o arroz',   'Refogue o alho e a cebola no óleo, junte o arroz lavado e cubra com água quente e sal.'),
  (6,  2, 2, 'Aquecer o feijão',   'Aqueça o feijão cozido em outra panela e ajuste o sal.'),
  (7,  3, 1, 'Temperar o frango',  'Tempere o peito de frango com sal e deixe descansar por 10 minutos.'),
  (8,  3, 2, 'Grelhar',            'Grelhe o frango e a abobrinha fatiada com azeite, virando até dourar.'),
  (9,  4, 1, 'Bater os ovos',      'Bata os ovos com uma pitada de sal.'),
  (10, 4, 2, 'Fazer a omelete',    'Derreta a manteiga na frigideira, despeje os ovos, coloque o queijo e dobre ao meio.'),
  (11, 5, 1, 'Cozinhar a massa',   'Cozinhe o espaguete em água fervente com sal até ficar al dente.'),
  (12, 5, 2, 'Fazer o molho',      'Doure o alho fatiado no azeite em fogo baixo, sem deixar queimar.'),
  (13, 5, 3, 'Finalizar',          'Misture a massa escorrida ao azeite com alho e tempere com pimenta.');

-- ---------------------------------------------------------------------
-- Dicas e erros comuns (ligados a uma etapa, autor = chef 1)
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `dica` (`id`, `conteudo`, `tipo`, `id_etapa_receita`, `id_chef`) VALUES
  (1, 'Deixe os ovos e o leite fora da geladeira por 15 minutos antes de misturar.', 'DICA', 2, 1),
  (2, 'Não abra o forno antes dos 30 minutos: o bolo pode murchar.', 'ERRO_COMUM', 4, 1),
  (3, 'Lave o arroz até a água sair quase transparente para ele ficar soltinho.', 'DICA', 5, 1),
  (4, 'Alho queimado amarga o prato todo: se escurecer demais, recomece.', 'ERRO_COMUM', 12, 1);
