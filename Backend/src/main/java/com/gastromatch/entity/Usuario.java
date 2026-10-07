package com.gastromatch.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Representa um usuário persistido no banco.
 * Esta classe NUNCA deve ser devolvida pela API: ela contém o hash da senha.
 * Quem sai nas respostas é o UsuarioResponse.
 */
@Entity
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // AUTO_INCREMENT do MySQL
    private Long id;

    // unique no banco é a última barreira contra emails duplicados,
    // inclusive em cadastros simultâneos que passariam pela checagem do service.
    @Column(nullable = false, unique = true, length = 255)
    private String email;

    // Guarda o HASH do BCrypt (60 caracteres), nunca a senha pura.
    // O hash é feito no service; esta classe apenas armazena o resultado.
    @Column(nullable = false, length = 100)
    private String password;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    // "capa" é uma URL/caminho de imagem (texto), opcional.
    @Column(length = 500)
    private String capa;

    // O JPA exige construtor sem argumentos para instanciar a entidade.
    public Usuario() {
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getCapa() {
        return capa;
    }

    public void setCapa(String capa) {
        this.capa = capa;
    }
}