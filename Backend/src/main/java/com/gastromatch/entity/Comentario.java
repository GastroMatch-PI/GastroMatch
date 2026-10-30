package com.gastromatch.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** Comentário e nota de um usuário sobre uma receita, na mesma linha. */
@Entity
@Table(name = "comentario")
public class Comentario extends EntidadeComDatas {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_receita", nullable = false)
    private Receita receita;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @Column(nullable = false, length = 2000)
    private String texto;

    private Float nota;

    // Reservado para o upload de fotos, que ainda não existe: fica sempre nulo.
    @Column(length = 500)
    private String foto;

    public Comentario() {
    }

    public Comentario(Receita receita, Usuario usuario, String texto, Float nota) {
        this.receita = receita;
        this.usuario = usuario;
        this.texto = texto;
        this.nota = nota;
    }

    public Integer getId() {
        return id;
    }

    public Receita getReceita() {
        return receita;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public String getTexto() {
        return texto;
    }

    public void setTexto(String texto) {
        this.texto = texto;
    }

    public Float getNota() {
        return nota;
    }

    public void setNota(Float nota) {
        this.nota = nota;
    }

    public String getFoto() {
        return foto;
    }
}
