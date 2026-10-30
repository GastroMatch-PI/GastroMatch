package com.gastromatch.entity;

import com.gastromatch.entity.enums.RoleProfissional;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Tabela mãe de chef, nutricionista e restaurante. O "role" diz qual tabela
 * filha existe para este profissional; o banco não garante isso, então quem
 * cadastra (o service) é que mantém os dois coerentes.
 */
@Entity
@Table(name = "profissional")
public class Profissional extends EntidadeComDatas {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(length = 500)
    private String bio;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleProfissional role;

    @Column(length = 500)
    private String comprovanteProfissao;

    public Profissional() {
    }

    public Profissional(RoleProfissional role, String bio) {
        this.role = role;
        this.bio = bio;
    }

    public Integer getId() {
        return id;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public RoleProfissional getRole() {
        return role;
    }

    public String getComprovanteProfissao() {
        return comprovanteProfissao;
    }

    public void setComprovanteProfissao(String comprovanteProfissao) {
        this.comprovanteProfissao = comprovanteProfissao;
    }
}
