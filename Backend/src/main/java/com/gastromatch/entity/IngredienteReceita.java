package com.gastromatch.entity;

import com.gastromatch.entity.enums.UnidadeMedida;

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

/** Liga uma receita a um ingrediente, com a quantidade usada. */
@Entity
@Table(name = "ingrediente_receita")
public class IngredienteReceita extends EntidadeComDatas {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private float quantidade;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UnidadeMedida unidadeMedida;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_receita", nullable = false)
    private Receita receita;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_ingrediente", nullable = false)
    private Ingrediente ingrediente;

    public IngredienteReceita() {
    }

    public IngredienteReceita(Receita receita, Ingrediente ingrediente, float quantidade,
                              UnidadeMedida unidadeMedida) {
        this.receita = receita;
        this.ingrediente = ingrediente;
        this.quantidade = quantidade;
        this.unidadeMedida = unidadeMedida;
    }

    public Integer getId() {
        return id;
    }

    public float getQuantidade() {
        return quantidade;
    }

    public UnidadeMedida getUnidadeMedida() {
        return unidadeMedida;
    }

    public Receita getReceita() {
        return receita;
    }

    public Ingrediente getIngrediente() {
        return ingrediente;
    }
}
