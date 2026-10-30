package com.gastromatch.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.gastromatch.entity.Usuario;

import jakarta.persistence.LockModeType;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    // Para fazer o login irá precisar buscar o email, username e password
    Optional<Usuario> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);

    // Trava a linha até o fim da transação: duas requisições simultâneas não criam
    // dois perfis profissionais para a mesma conta.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from Usuario u where u.id = :id")
    Optional<Usuario> buscarComBloqueio(@Param("id") Integer id);

    // Contas ligadas a perfis profissionais (para mostrar o username do chef nas receitas).
    List<Usuario> findByIdProfissionalIn(Collection<Integer> idsProfissional);
}
