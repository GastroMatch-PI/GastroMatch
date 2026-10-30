package com.gastromatch.entity;

import com.gastromatch.entity.enums.Dificuldade;
import com.gastromatch.entity.enums.MetodoPreparo;
import com.gastromatch.entity.enums.Ocasiao;
import com.gastromatch.entity.enums.PerfilAlimentar;
import com.gastromatch.entity.enums.TipoRefeicao;

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

/**
 * Receita publicada por um chef. Etapas, dicas e ingredientes apontam para ela
 * (e são apagados pelo banco junto com ela: ON DELETE CASCADE).
 */
@Entity
@Table(name = "receita")
public class Receita extends EntidadeComDatas {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(length = 1000)
    private String descricao;

    @Column(length = 500)
    private String imagem;

    // Link do YouTube. O front monta o iframe; o backend só aceita URL do YouTube.
    @Column(length = 500)
    private String videoUrl;

    @Column(nullable = false)
    private int nPorcoes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Dificuldade dificuldade;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoRefeicao tipo;

    @Enumerated(EnumType.STRING)
    private MetodoPreparo metodoPreparo;

    @Enumerated(EnumType.STRING)
    private Ocasiao ocasiao;

    // Em minutos.
    @Column(nullable = false)
    private int tempoPreparo;

    @Enumerated(EnumType.STRING)
    private PerfilAlimentar perfil;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_chef", nullable = false)
    private Chef chef;

    public Receita() {
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

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public String getImagem() {
        return imagem;
    }

    public void setImagem(String imagem) {
        this.imagem = imagem;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }

    public int getNPorcoes() {
        return nPorcoes;
    }

    public void setNPorcoes(int nPorcoes) {
        this.nPorcoes = nPorcoes;
    }

    public Dificuldade getDificuldade() {
        return dificuldade;
    }

    public void setDificuldade(Dificuldade dificuldade) {
        this.dificuldade = dificuldade;
    }

    public TipoRefeicao getTipo() {
        return tipo;
    }

    public void setTipo(TipoRefeicao tipo) {
        this.tipo = tipo;
    }

    public MetodoPreparo getMetodoPreparo() {
        return metodoPreparo;
    }

    public void setMetodoPreparo(MetodoPreparo metodoPreparo) {
        this.metodoPreparo = metodoPreparo;
    }

    public Ocasiao getOcasiao() {
        return ocasiao;
    }

    public void setOcasiao(Ocasiao ocasiao) {
        this.ocasiao = ocasiao;
    }

    public int getTempoPreparo() {
        return tempoPreparo;
    }

    public void setTempoPreparo(int tempoPreparo) {
        this.tempoPreparo = tempoPreparo;
    }

    public PerfilAlimentar getPerfil() {
        return perfil;
    }

    public void setPerfil(PerfilAlimentar perfil) {
        this.perfil = perfil;
    }

    public Chef getChef() {
        return chef;
    }

    public void setChef(Chef chef) {
        this.chef = chef;
    }
}
