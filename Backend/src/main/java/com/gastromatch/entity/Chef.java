package com.gastromatch.entity;

import com.gastromatch.entity.enums.Especializacao;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

/** Perfil de chef. É quem publica receitas e dicas. */
@Entity
@Table(name = "chef")
public class Chef extends EntidadeComDatas {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_profissional", nullable = false)
    private Profissional profissional;

    @Enumerated(EnumType.STRING)
    private Especializacao especializacao;

    // Opcional: o chef pode não trabalhar em um restaurante cadastrado.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_restaurante")
    private Restaurante restaurante;

    public Chef() {
    }

    public Chef(Profissional profissional, Especializacao especializacao) {
        this.profissional = profissional;
        this.especializacao = especializacao;
    }

    public Integer getId() {
        return id;
    }

    public Profissional getProfissional() {
        return profissional;
    }

    public Especializacao getEspecializacao() {
        return especializacao;
    }

    public void setEspecializacao(Especializacao especializacao) {
        this.especializacao = especializacao;
    }

    public Restaurante getRestaurante() {
        return restaurante;
    }

    public void setRestaurante(Restaurante restaurante) {
        this.restaurante = restaurante;
    }
}
