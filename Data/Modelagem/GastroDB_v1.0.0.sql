-- =====================================================================
-- GastroMatch - Schema MySQL (v2)
-- Fonte: "Documentação Técnica do Banco de Dados" (DER de 28/09/2026)
-- Alvo: MySQL 8.0.16 ou superior (antes disso, CHECK é aceito mas ignorado)
--
-- PADRÃO DE NOMES (v2)
--   Tabelas ...... minúsculas, snake_case, SINGULAR      (etapa_receita)
--   Colunas ...... minúsculas, snake_case, sem acento    (porcao_base)
--   Chave estrangeira: id_<tabela referenciada>          (id_receita)
--   Datas ........ criado_em / atualizado_em / <evento>_em
--   Constraints .. pk implícita; uq_<tabela>_<coluna>; fk_<tabela>_<ref>;
--                  chk_<tabela>_<regra>; idx_<tabela>_<colunas>
--   Valores de ENUM: MAIÚSCULAS_COM_UNDERSCORE, sem acento
--   Por que snake_case minúsculo: o Spring Boot/Hibernate converte
--   `idProfissional` em `id_profissional` por padrão (entidade sem @Column
--   em cada campo), e o MySQL no Linux diferencia maiúsculas em nomes de tabela.
--
-- DATAS
--   criado_em     DATETIME, preenchido pelo banco na inserção
--   atualizado_em DATETIME, atualizado pelo banco a cada UPDATE
--   Fuso: DATETIME não converte fuso. Padronizar o servidor MySQL e a
--   aplicação (hibernate.jdbc.time_zone) em UTC.
--
-- LEGENDA DOS COMENTÁRIOS
--   [DOC]       fiel à documentação
--   [PROPOSTA]  a documentação não define; valor sugerido, a CONFIRMAR
--   [AJUSTE]    diverge da documentação por motivo técnico
--   [ADIÇÃO]    coluna ou constraint que a documentação não lista
--
-- ATENÇÃO: revisar com o responsável pelo banco antes de rodar em
-- ambiente compartilhado. Este script NÃO apaga nada (usa IF NOT EXISTS).
-- =====================================================================

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `gastromatch`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `gastromatch`;

-- ---------------------------------------------------------------------
-- 1. profissional (tabela mãe: chef, nutricionista, restaurante)
-- ---------------------------------------------------------------------
-- `role` é o DISCRIMINADOR do tipo de perfil. Não tem relação com permissões
-- de acesso (o sistema não terá autorização por papéis).
-- Débito assumido pelo time [DOC]: o banco NÃO garante que `role` bate com a
-- tabela filha existente. Essa validação é do backend, no cadastro.
CREATE TABLE IF NOT EXISTS `profissional` (
  `id`                    INT          NOT NULL AUTO_INCREMENT,
  `bio`                   VARCHAR(500) NULL,                      -- [PROPOSTA] tamanho
  `role`                  ENUM('CHEF','NUTRICIONISTA','RESTAURANTE') NOT NULL,  -- [DOC]
  `comprovante_profissao` VARCHAR(500) NULL,                      -- [PROPOSTA] tamanho (URL/caminho)
  `criado_em`             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. usuario
-- ---------------------------------------------------------------------
-- Tamanhos de email, password, username e capa iguais aos da entidade Java
-- (Usuario.java), para o Hibernate não divergir do banco.
CREATE TABLE IF NOT EXISTS `usuario` (
  `id`                  INT          NOT NULL AUTO_INCREMENT,
  `email`               VARCHAR(255) NOT NULL,
  `password`            VARCHAR(100) NOT NULL,                    -- hash BCrypt (60 caracteres)
  `username`            VARCHAR(50)  NOT NULL,
  `capa`                VARCHAR(500) NULL,
  `id_profissional`     INT          NULL,
  -- [ADIÇÃO] momento da última troca de senha. Permite recusar tokens emitidos
  -- ANTES da troca (JWT com data de emissão menor que este valor).
  `senha_alterada_em`   DATETIME     NULL,
  -- [ADIÇÃO] NULL = email ainda não verificado (verificação planejada).
  `email_verificado_em` DATETIME     NULL,
  `criado_em`           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuario_email`        (`email`),
  UNIQUE KEY `uq_usuario_username`     (`username`),
  -- [ADIÇÃO] UNIQUE garante a relação 0..1: um profissional tem no máximo um usuário
  UNIQUE KEY `uq_usuario_profissional` (`id_profissional`),
  CONSTRAINT `fk_usuario_profissional`
    FOREIGN KEY (`id_profissional`) REFERENCES `profissional` (`id`)
    ON DELETE SET NULL                                            -- [PROPOSTA] a conta sobrevive ao perfil
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. restaurante
-- ---------------------------------------------------------------------
-- [AJUSTE] A documentação define a relação restaurante (1,1) - (1,1) profissional,
-- mas não lista a coluna que a implementa. Adicionada `id_profissional`.
-- A regra "todo restaurante exige ao menos 1 chef" é do backend: o banco
-- não consegue impor mínimo de linhas na tabela filha.
CREATE TABLE IF NOT EXISTS `restaurante` (
  `id`              INT          NOT NULL AUTO_INCREMENT,
  `cnpj`            VARCHAR(18)  NOT NULL,                        -- [PROPOSTA] cabe com máscara
  `nome`            VARCHAR(150) NOT NULL,
  `bio`             VARCHAR(500) NULL,
  `numero`          INT          NULL,                            -- era `number` na documentação
  `rua`             VARCHAR(150) NULL,
  `cep`             VARCHAR(9)   NULL,
  `bairro`          VARCHAR(100) NULL,
  `cidade`          VARCHAR(100) NULL,
  `estado`          VARCHAR(50)  NULL,
  `id_profissional` INT          NOT NULL,                        -- [AJUSTE] ver nota acima
  `criado_em`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_restaurante_cnpj`         (`cnpj`),
  UNIQUE KEY `uq_restaurante_profissional` (`id_profissional`),
  CONSTRAINT `fk_restaurante_profissional`
    FOREIGN KEY (`id_profissional`) REFERENCES `profissional` (`id`)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. chef
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chef` (
  `id`              INT NOT NULL AUTO_INCREMENT,
  `id_profissional` INT NOT NULL,
  -- [PROPOSTA] valores de exemplo; a documentação só diz "área de especialidade"
  `especializacao`  ENUM('CONFEITARIA','PANIFICACAO','CARNES','MASSAS','COZINHA_VEGETARIANA') NULL,
  `id_restaurante`  INT NULL,
  `criado_em`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  -- [ADIÇÃO] no máximo um chef por profissional (a nota da documentação pede isso do backend)
  UNIQUE KEY `uq_chef_profissional` (`id_profissional`),
  CONSTRAINT `fk_chef_profissional`
    FOREIGN KEY (`id_profissional`) REFERENCES `profissional` (`id`)
    ON DELETE RESTRICT,
  CONSTRAINT `fk_chef_restaurante`
    FOREIGN KEY (`id_restaurante`) REFERENCES `restaurante` (`id`)
    ON DELETE SET NULL                                            -- [PROPOSTA]
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. nutricionista
-- ---------------------------------------------------------------------
-- Sem perfil de administrador, a verificação é feita diretamente no banco pela
-- equipe. `status_verificacao` NUNCA deve ser aceito de entrada da API.
CREATE TABLE IF NOT EXISTS `nutricionista` (
  `id`                 INT         NOT NULL AUTO_INCREMENT,
  `crn`                VARCHAR(20) NOT NULL,                      -- [PROPOSTA] tamanho
  `id_profissional`    INT         NOT NULL,
  -- [PROPOSTA] valores e DEFAULT; a documentação só diz "status da verificação manual"
  `status_verificacao` ENUM('PENDENTE','APROVADO','REJEITADO') NOT NULL DEFAULT 'PENDENTE',
  -- [ADIÇÃO] quando a verificação foi concluída (NULL enquanto pendente)
  `verificado_em`      DATETIME    NULL,
  `criado_em`          DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em`      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_nutricionista_crn`          (`crn`),
  UNIQUE KEY `uq_nutricionista_profissional` (`id_profissional`),  -- [ADIÇÃO]
  CONSTRAINT `fk_nutricionista_profissional`
    FOREIGN KEY (`id_profissional`) REFERENCES `profissional` (`id`)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. receita
-- ---------------------------------------------------------------------
-- Os valores dos ENUMs abaixo são [PROPOSTA]: a documentação cita só exemplos
-- ("café da manhã, almoço, etc."). Novo valor exige ALTER TABLE (débito já
-- registrado na documentação).
CREATE TABLE IF NOT EXISTS `receita` (
  `id`             INT           NOT NULL AUTO_INCREMENT,
  `nome`           VARCHAR(150)  NOT NULL,
  `descricao`      VARCHAR(1000) NULL,
  `imagem`         VARCHAR(500)  NULL,
  `n_porcoes`      INT           NOT NULL,
  `dificuldade`    ENUM('FACIL','MEDIO','DIFICIL') NOT NULL,
  `tipo`           ENUM('CAFE_DA_MANHA','ALMOCO','JANTAR','LANCHE','SOBREMESA') NOT NULL,
  `metodo_preparo` ENUM('FORNO','AIR_FRYER','GRELHA','FOGAO') NULL,
  `ocasiao`        ENUM('ANIVERSARIO','CHURRASCO','NATAL','DIA_A_DIA') NULL,
  `tempo_preparo`  INT           NOT NULL,                        -- em minutos
  `perfil`         ENUM('VEGANO','VEGETARIANO','LOW_CARB','SEM_GLUTEN','SEM_LACTOSE') NULL,
  `id_chef`        INT           NOT NULL,
  `criado_em`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  -- [ADIÇÃO] evita divisão por zero no ajuste automático de porções
  CONSTRAINT `chk_receita_n_porcoes` CHECK (`n_porcoes` > 0),
  CONSTRAINT `fk_receita_chef`
    FOREIGN KEY (`id_chef`) REFERENCES `chef` (`id`)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. etapa_receita
-- ---------------------------------------------------------------------
-- [AJUSTE] A documentação define chave composta (idReceita, id), mas `dica`
-- referencia apenas `etapa_receita.id`. Uma FK para parte de uma chave
-- composta é ambígua. Solução adotada: PK simples em `id`, `id_receita` como
-- FK comum e índice (id_receita, ordem) para listar as etapas na ordem.
-- Validar com o responsável pelo banco.
CREATE TABLE IF NOT EXISTS `etapa_receita` (
  `id`              INT           NOT NULL AUTO_INCREMENT,
  `id_receita`      INT           NOT NULL,
  `ordem`           INT           NOT NULL,
  `titulo`          VARCHAR(150)  NOT NULL,
  `instrucao`       VARCHAR(2000) NOT NULL,                       -- [PROPOSTA] tamanho
  `timestamp_video` INT           NULL,                           -- segundo do vídeo (era `timestampvídeo`)
  `imagem`          VARCHAR(500)  NULL,                           -- era `img` na documentação
  `criado_em`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_etapa_receita_ordem` (`id_receita`, `ordem`),
  CONSTRAINT `fk_etapa_receita_receita`
    FOREIGN KEY (`id_receita`) REFERENCES `receita` (`id`)
    ON DELETE CASCADE                                             -- [PROPOSTA] etapa não existe sem a receita
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. dica (dica de chef ou erro comum, vinculada a uma etapa)
-- ---------------------------------------------------------------------
-- [DOC] A FK do autor fica em `dica` (id_chef), e não em `chef`: um chef
-- publica várias dicas em várias receitas.
CREATE TABLE IF NOT EXISTS `dica` (
  `id`               INT           NOT NULL AUTO_INCREMENT,
  `conteudo`         VARCHAR(1000) NOT NULL,                      -- [PROPOSTA] tamanho
  `tipo`             ENUM('DICA','ERRO_COMUM') NOT NULL,
  `id_etapa_receita` INT           NOT NULL,
  `id_chef`          INT           NOT NULL,
  `criado_em`        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_dica_etapa_receita`
    FOREIGN KEY (`id_etapa_receita`) REFERENCES `etapa_receita` (`id`)
    ON DELETE CASCADE,                                            -- [PROPOSTA]
  CONSTRAINT `fk_dica_chef`
    FOREIGN KEY (`id_chef`) REFERENCES `chef` (`id`)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 9. ingrediente (catálogo com dados nutricionais por porcao_base)
-- ---------------------------------------------------------------------
-- Cálculo no backend: (quantidade / porcao_base) x valor nutricional.
-- FLOAT mantido conforme a documentação. Observação: FLOAT é aproximado
-- (0.1 pode voltar como 0.10000000149); DECIMAL seria mais exato.
CREATE TABLE IF NOT EXISTS `ingrediente` (
  `id`            INT          NOT NULL AUTO_INCREMENT,
  `nome`          VARCHAR(100) NOT NULL,                          -- era `Ingrediente` na documentação
  `porcao_base`   FLOAT        NOT NULL,
  `calorias`      FLOAT        NOT NULL,
  `gordura`       FLOAT        NOT NULL,
  `proteina`      FLOAT        NOT NULL,
  `carboidrato`   FLOAT        NOT NULL,
  `criado_em`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ingrediente_nome` (`nome`),
  -- [ADIÇÃO] porcao_base é divisor na fórmula; zero quebraria o cálculo
  CONSTRAINT `chk_ingrediente_porcao_base` CHECK (`porcao_base` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 10. ingrediente_receita (associativa receita x ingrediente)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ingrediente_receita` (
  `id`             INT   NOT NULL AUTO_INCREMENT,
  `quantidade`     FLOAT NOT NULL,
  -- [PROPOSTA] valores de exemplo ("g, ml, unidade, xícara, etc.")
  `unidade_medida` ENUM('G','ML','UNIDADE','XICARA') NOT NULL,
  `id_receita`     INT   NOT NULL,
  `id_ingrediente` INT   NOT NULL,
  `criado_em`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `chk_ingrediente_receita_quantidade` CHECK (`quantidade` > 0),  -- [ADIÇÃO]
  CONSTRAINT `fk_ingrediente_receita_receita`
    FOREIGN KEY (`id_receita`) REFERENCES `receita` (`id`)
    ON DELETE CASCADE,                                            -- [PROPOSTA]
  CONSTRAINT `fk_ingrediente_receita_ingrediente`
    FOREIGN KEY (`id_ingrediente`) REFERENCES `ingrediente` (`id`)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 11. comentario (comentário e nota na mesma linha)
-- ---------------------------------------------------------------------
-- `criado_em` permite ordenar por data; `atualizado_em` mostra se foi editado.
CREATE TABLE IF NOT EXISTS `comentario` (
  `id`            INT           NOT NULL AUTO_INCREMENT,
  `id_receita`    INT           NOT NULL,
  `id_usuario`    INT           NOT NULL,
  `texto`         VARCHAR(2000) NOT NULL,                         -- era `comentario` na documentação
  `nota`          FLOAT         NULL,
  `foto`          VARCHAR(500)  NULL,
  `criado_em`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_comentario_receita_data` (`id_receita`, `criado_em`),
  CONSTRAINT `fk_comentario_receita`
    FOREIGN KEY (`id_receita`) REFERENCES `receita` (`id`)
    ON DELETE CASCADE,                                            -- [PROPOSTA]
  CONSTRAINT `fk_comentario_usuario`
    FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id`)
    ON DELETE CASCADE                                             -- [PROPOSTA] apagar conta apaga comentários
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 12. favorito (associativa usuario x receita)
-- ---------------------------------------------------------------------
-- Só `criado_em`: a linha nunca é alterada (favoritar e desfavoritar são
-- INSERT e DELETE), então `atualizado_em` não teria o que registrar.
CREATE TABLE IF NOT EXISTS `favorito` (
  `id`         INT      NOT NULL AUTO_INCREMENT,
  `id_usuario` INT      NOT NULL,
  `id_receita` INT      NOT NULL,
  `criado_em`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  -- [ADIÇÃO] favoritar duas vezes a mesma receita não faz sentido
  UNIQUE KEY `uq_favorito_usuario_receita` (`id_usuario`, `id_receita`),
  CONSTRAINT `fk_favorito_usuario`
    FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_favorito_receita`
    FOREIGN KEY (`id_receita`) REFERENCES `receita` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- RESET DE DESENVOLVIMENTO (comentado de propósito)
-- APAGA TODAS AS TABELAS E DADOS. Usar apenas em banco local.
-- =====================================================================
-- SET FOREIGN_KEY_CHECKS = 0;
-- DROP TABLE IF EXISTS `favorito`, `comentario`, `ingrediente_receita`,
--   `ingrediente`, `dica`, `etapa_receita`, `receita`, `nutricionista`,
--   `chef`, `restaurante`, `usuario`, `profissional`;
-- SET FOREIGN_KEY_CHECKS = 1;


SELECT VERSION();
SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'gastromatch';
SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = 'gastromatch';