package com.gastromatch.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;

/**
 * Colunas criado_em e atualizado_em, comuns a quase todas as tabelas.
 * São preenchidas pelo próprio banco (DEFAULT CURRENT_TIMESTAMP e ON UPDATE),
 * por isso o Hibernate só lê: não envia esses campos no INSERT nem no UPDATE.
 */
@MappedSuperclass
public abstract class EntidadeComDatas {

    @Column(insertable = false, updatable = false)
    private Instant criadoEm;

    @Column(insertable = false, updatable = false)
    private Instant atualizadoEm;

    public Instant getCriadoEm() {
        return criadoEm;
    }

    public Instant getAtualizadoEm() {
        return atualizadoEm;
    }
}
