# GastroMatch

Plataforma gastronômica que conecta usuários, receitas, chefs, restaurantes e nutricionistas — pesquisa, descoberta, modo de preparo guiado, comunidade e diretório de profissionais, tudo acessível sem necessidade de cadastro inicial.

## Visão do Produto

O GastroMatch permite que qualquer visitante, sem login, possa:

- Pesquisar, filtrar e descobrir receitas
- Assistir vídeos de preparo
- Seguir o passo a passo da receita ("modo cozinhar")
- Montar listas de compras e cardápios
- Encontrar restaurantes e profissionais (chefs e nutricionistas) próximos
- Consultar informações nutricionais calculadas
- Participar da comunidade (leitura de comentários e fórum)

Profissionais (chefs, restaurantes e nutricionistas) têm áreas próprias, com cadastro e verificação manual, para publicar receitas, divulgar seus serviços e construir reputação na plataforma.

## Funcionalidades

### Usuário visitante (sem cadastro)
- Busca de receitas por texto, ingredientes disponíveis ("o que eu tenho na geladeira"), tempo de preparo, dificuldade, tipo de dieta, ocasião, tipo de refeição e método de preparo
- Página da receita com passo a passo estruturado, imagens por etapa, vídeo de preparo e dicas de chefs da comunidade
- Ajuste automático de porções, recalculando ingredientes proporcionalmente
- Listas locais (compras, cardápio da semana, favoritos), com opção de criar conta para sincronizar entre dispositivos
- Diretório de restaurantes e profissionais, com mini mapa gastronômico
- Tabela nutricional calculada automaticamente a partir de uma base de ingredientes confiável
- Comunidade: leitura de comentários, avaliações e fórum de discussão (publicação exige conta)

### Profissional (chef / restaurante / nutricionista)
- Cadastro com verificação manual e página de onboarding dedicada
- Publicação de receitas e vídeos (armazenados na própria infraestrutura da plataforma)
- Vídeos de perfil exibidos em formato de feed/reels na comunidade
- Dicas e alertas de erros comuns associados a qualquer receita (relação muitos-para-muitos entre chefs e receitas)
- Divulgação de restaurante, aulas e eventos (fase posterior ao básico)
- Kits ilustrativos ("caixa surpresa") exibidos no perfil, sem compra ou checkout pela plataforma
- Contato com o usuário sempre por fora, via redes sociais do profissional (a plataforma atua como vitrine, não como intermediária)

## Escopo do MVP

**Incluso:**
- Busca e descoberta de receitas sem login
- CRUD de receitas estruturado por etapas
- Ajuste automático de porções
- Página da receita / modo cozinhar, com dicas de chef e comentários (mockados nesta fase)
- Vídeo de receitas (upload próprio, sem embed externo)
- Listas locais
- Descoberta simples de restaurantes e profissionais, com mini mapa
- Feed da comunidade em modo visualização
- Cadastro e verificação manual de profissionais
- Kits ilustrativos

**Fora do MVP (fases futuras):**
- Publicação de conteúdo pela comunidade (exige conta)
- Página completa de restaurante (cardápio, história, bastidores)
- Mapa gastronômico completo
- Busca por perfil nutricional
- Marketplace de chef particular e consulta com nutricionista dentro da plataforma
- Compra real de kits (estoque, logística, pagamento)
- Leitura automática (text-to-speech) e recursos de IA/visão computacional

## Arquitetura

- **Frontend:** React + Vite — interface, navegação, filtros, página de receita/modo cozinha, mapas, perfis, feed, área profissional.
- **Backend:** Java + Spring Boot — API REST, autenticação, regras de negócio, buscas e integrações externas.
- **Armazenamento de mídia:** vídeos e imagens hospedados na própria infraestrutura (upload → backend → object storage → CDN), sem depender de players ou plataformas externas.
- **Área administrativa:** aprovação de profissionais, moderação reativa por denúncia (sem fila de revisão prévia), gestão de conteúdo e usuários.

> Este README não detalha o modelo de dados/banco — a modelagem está documentada separadamente.

## Status do Projeto

Em desenvolvimento — fase de definição de escopo e modelagem das funcionalidades do MVP.

## Como Contribuir

_(seção a ser preenchida conforme o fluxo de contribuição do time for definido — padrão de commits, setup do ambiente local, etc.)_