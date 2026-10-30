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

/** Um passo do modo de preparo. "ordem" define a sequência dentro da receita. */
@Entity
@Table(name = "etapa_receita")
public class EtapaReceita extends EntidadeComDatas {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_receita", nullable = false)
    private Receita receita;

    @Column(nullable = false)
    private int ordem;

    @Column(nullable = false, length = 150)
    private String titulo;

    @Column(nullable = false, length = 2000)
    private String instrucao;

    // Segundo do vídeo em que esta etapa começa (vira ?start= no embed do YouTube).
    private Integer timestampVideo;

    @Column(length = 500)
    private String imagem;

    public EtapaReceita() {
    }

    public Integer getId() {
        return id;
    }

    public Receita getReceita() {
        return receita;
    }

    public void setReceita(Receita receita) {
        this.receita = receita;
    }

    public int getOrdem() {
        return ordem;
    }

    public void setOrdem(int ordem) {
        this.ordem = ordem;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getInstrucao() {
        return instrucao;
    }

    public void setInstrucao(String instrucao) {
        this.instrucao = instrucao;
    }

    public Integer getTimestampVideo() {
        return timestampVideo;
    }

    public void setTimestampVideo(Integer timestampVideo) {
        this.timestampVideo = timestampVideo;
    }

    public String getImagem() {
        return imagem;
    }

    public void setImagem(String imagem) {
        this.imagem = imagem;
    }
}
