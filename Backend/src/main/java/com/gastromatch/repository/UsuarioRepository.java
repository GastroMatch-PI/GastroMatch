package com.gastromatch.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gastromatch.entity.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    // Para fazer o login irá precisar buscar o email, username e password
    Optional<Usuario> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);

    // Contas ligadas a perfis profissionais (para mostrar o username do chef nas receitas).
    List<Usuario> findByIdProfissionalIn(Collection<Integer> idsProfissional);
}
