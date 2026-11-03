package com.gastromatch.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Catálogo de ingredientes com os valores nutricionais de uma porção base
 * (ex.: 100 g). O total de uma receita é (quantidade / porcaoBase) x valor.
 */
@Entity
@Table(name = "ingrediente")
public class Ingrediente extends EntidadeComDatas {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 100)
    private String nome;

    @Column(nullable = false)
    private float porcaoBase;

    @Column(nullable = false)
    private float calorias;

    @Column(nullable = false)
    private float gordura;

    @Column(nullable = false)
    private float proteina;

    @Column(nullable = false)
    private float carboidrato;

    public Ingrediente() {
    }

    public Integer getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public float getPorcaoBase() {
        return porcaoBase;
    }

    public void setPorcaoBase(float porcaoBase) {
        this.porcaoBase = porcaoBase;
    }

    public float getCalorias() {
        return calorias;
    }

    public void setCalorias(float calorias) {
        this.calorias = calorias;
    }

    public float getGordura() {
        return gordura;
    }

    public void setGordura(float gordura) {
        this.gordura = gordura;
    }

    public float getProteina() {
        return proteina;
    }

    public void setProteina(float proteina) {
        this.proteina = proteina;
    }

    public float getCarboidrato() {
        return carboidrato;
    }

    public void setCarboidrato(float carboidrato) {
        this.carboidrato = carboidrato;
    }
}
