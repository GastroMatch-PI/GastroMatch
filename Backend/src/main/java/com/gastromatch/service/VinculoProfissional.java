package com.gastromatch.service;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.gastromatch.entity.Profissional;
import com.gastromatch.entity.Usuario;
import com.gastromatch.entity.enums.RoleProfissional;
import com.gastromatch.exception.ConflitoException;
import com.gastromatch.exception.UsuarioNaoEncontradoException;
import com.gastromatch.repository.ProfissionalRepository;
import com.gastromatch.repository.UsuarioRepository;

/**
 * Cria o perfil profissional de uma conta e liga os dois. É o passo comum do cadastro de
 * nutricionista e de restaurante (o chef faz o mesmo no ChefService).
 */
@Component
public class VinculoProfissional {

    private final UsuarioRepository usuarioRepository;
    private final ProfissionalRepository profissionalRepository;

    public VinculoProfissional(UsuarioRepository usuarioRepository,
                               ProfissionalRepository profissionalRepository) {
        this.usuarioRepository = usuarioRepository;
        this.profissionalRepository = profissionalRepository;
    }

    /**
     * Uma conta tem no máximo um perfil profissional. A linha do usuário fica travada até o fim da
     * transação, para dois pedidos simultâneos não criarem dois perfis. O role vem do código, nunca
     * da requisição.
     */
    @Transactional
    public Profissional criar(Integer usuarioId, RoleProfissional role, String bio) {
        Usuario usuario = usuarioRepository.buscarComBloqueio(usuarioId)
                .orElseThrow(UsuarioNaoEncontradoException::new);
        if (usuario.getIdProfissional() != null) {
            throw new ConflitoException("Esta conta já possui um perfil profissional");
        }
        Profissional profissional = profissionalRepository.save(new Profissional(role, textoOuNulo(bio)));
        usuario.setIdProfissional(profissional.getId());
        return profissional;
    }

    /** Texto aparado; em branco vira null. */
    static String textoOuNulo(String texto) {
        return (texto == null || texto.isBlank()) ? null : texto.trim();
    }
}
