package com.gastromatch.entity;

import com.gastromatch.entity.enums.TipoDica;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** Dica de chef ou erro comum, ligada a uma etapa. O autor fica na dica (id_chef). */
@Entity
@Table(name = "dica")
public class Dica extends EntidadeComDatas {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 1000)
    private String conteudo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoDica tipo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_etapa_receita", nullable = false)
    private EtapaReceita etapaReceita;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_chef", nullable = false)
    private Chef chef;

    public Dica() {
    }

    public Integer getId() {
        return id;
    }

    public String getConteudo() {
        return conteudo;
    }

    public void setConteudo(String conteudo) {
        this.conteudo = conteudo;
    }

    public TipoDica getTipo() {
        return tipo;
    }

    public void setTipo(TipoDica tipo) {
        this.tipo = tipo;
    }

    public EtapaReceita getEtapaReceita() {
        return etapaReceita;
    }

    public void setEtapaReceita(EtapaReceita etapaReceita) {
        this.etapaReceita = etapaReceita;
    }

    public Chef getChef() {
        return chef;
    }

    public void setChef(Chef chef) {
        this.chef = chef;
    }
}
