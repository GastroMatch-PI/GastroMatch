package com.gastromatch.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gastromatch.entity.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // Para fazer o login irá precisar buscar o email, username e password
    Optional<Usuario> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
}
