package com.gastromatch.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Refresh token guardado no banco. Só o HASH (SHA-256) é persistido:
 * se o banco vazar, os tokens não podem ser usados.
 */
@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // SHA-256 em hexadecimal = 64 caracteres. unique também cria o índice de busca.
    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false)
    private Instant expiraEm;

    @Column(nullable = false)
    private boolean revogado = false;

    public RefreshToken() {
    }

    public RefreshToken(String tokenHash, Usuario usuario, Instant expiraEm) {
        this.tokenHash = tokenHash;
        this.usuario = usuario;
        this.expiraEm = expiraEm;
    }

    public Long getId() { return id; }
    public String getTokenHash() { return tokenHash; }
    public Usuario getUsuario() { return usuario; }
    public Instant getExpiraEm() { return expiraEm; }
    public boolean isRevogado() { return revogado; }
    public void setRevogado(boolean revogado) { this.revogado = revogado; }
}
