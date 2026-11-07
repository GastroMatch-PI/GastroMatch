package com.gastromatch.repository;

import java.time.Instant;
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

    /**
     * Apaga um lote de tokens cuja expiração já passou de "limite" (usado pela limpeza
     * agendada, B25). Um só token válido ou revogado há pouco tempo tem expira_em no
     * futuro ou recente, então nunca entra no WHERE abaixo. Nativa (em vez de JPQL) porque
     * JPQL não tem LIMIT em DELETE; a subconsulta evita apagar mais que o tamanho do lote
     * de uma vez e travar a tabela.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "DELETE FROM refresh_token WHERE id IN "
            + "(SELECT id FROM refresh_token WHERE expira_em < :limite LIMIT :tamanhoDoLote)",
            nativeQuery = true)
    int apagarLoteExpiradosAntesDe(@Param("limite") Instant limite, @Param("tamanhoDoLote") int tamanhoDoLote);
}
