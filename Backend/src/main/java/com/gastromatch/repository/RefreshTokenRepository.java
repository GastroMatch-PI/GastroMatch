package com.gastromatch.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.gastromatch.entity.RefreshToken;
import com.gastromatch.entity.Usuario;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Integer> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    // Usado na detecção de reuso: revoga todas as sessões do usuário.
    @Modifying
    @Query("update RefreshToken r set r.revogado = true where r.usuario = :usuario and r.revogado = false")
    int revogarTodosDoUsuario(@Param("usuario") Usuario usuario);
}
