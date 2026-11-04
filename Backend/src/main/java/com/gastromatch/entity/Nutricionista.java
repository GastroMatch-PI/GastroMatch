package com.gastromatch.entity;

import java.time.Instant;

import com.gastromatch.entity.enums.StatusVerificacao;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

/**
 * Perfil de nutricionista. Não há aprovação: quem se cadastra já nasce APROVADO e aparece
 * no diretório. O status fica só para a equipe esconder alguém, mexendo direto no banco
 * (REJEITADO): por isso ele NÃO tem setter e nunca deve vir de uma requisição.
 */
@Entity
@Table(name = "nutricionista")
public class Nutricionista extends EntidadeComDatas {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 20)
    private String crn;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_profissional", nullable = false)
    private Profissional profissional;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusVerificacao statusVerificacao = StatusVerificacao.APROVADO;

    private Instant verificadoEm;

    public Nutricionista() {
    }

    public Nutricionista(Profissional profissional, String crn) {
        this.profissional = profissional;
        this.crn = crn;
    }

    public Integer getId() {
        return id;
    }

    public String getCrn() {
        return crn;
    }

    public Profissional getProfissional() {
        return profissional;
    }

    public StatusVerificacao getStatusVerificacao() {
        return statusVerificacao;
    }

    public Instant getVerificadoEm() {
        return verificadoEm;
    }
}
