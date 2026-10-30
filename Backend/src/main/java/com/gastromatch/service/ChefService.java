package com.gastromatch.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gastromatch.dto.CadastroChefRequest;
import com.gastromatch.dto.ChefResponse;
import com.gastromatch.entity.Chef;
import com.gastromatch.entity.Profissional;
import com.gastromatch.entity.Usuario;
import com.gastromatch.entity.enums.RoleProfissional;
import com.gastromatch.exception.AcessoNegadoException;
import com.gastromatch.exception.ConflitoException;
import com.gastromatch.exception.UsuarioNaoEncontradoException;
import com.gastromatch.repository.ChefRepository;
import com.gastromatch.repository.ProfissionalRepository;
import com.gastromatch.repository.UsuarioRepository;

/** Perfil de chef: criação e consulta do chef da conta logada. */
@Service
public class ChefService {

    static final String SEM_PERFIL_DE_CHEF = "Apenas chefs podem fazer isto. Crie seu perfil de chef primeiro";

    private final UsuarioRepository usuarioRepository;
    private final ProfissionalRepository profissionalRepository;
    private final ChefRepository chefRepository;

    public ChefService(UsuarioRepository usuarioRepository,
                       ProfissionalRepository profissionalRepository,
                       ChefRepository chefRepository) {
        this.usuarioRepository = usuarioRepository;
        this.profissionalRepository = profissionalRepository;
        this.chefRepository = chefRepository;
    }

    /**
     * Cria o profissional (role CHEF) e o chef, e liga a conta a eles. O role é sempre
     * CHEF aqui, então profissional e tabela filha ficam coerentes (o banco não garante).
     * Chef publica sem aprovação: não existe status de verificação para ele.
     */
    @Transactional
    public ChefResponse criarPerfil(Integer usuarioId, CadastroChefRequest request) {
        Usuario usuario = usuarioRepository.buscarComBloqueio(usuarioId)
                .orElseThrow(UsuarioNaoEncontradoException::new);
        if (usuario.getIdProfissional() != null) {
            throw new ConflitoException("Esta conta já possui um perfil profissional");
        }

        String bio = (request.bio() == null || request.bio().isBlank()) ? null : request.bio().trim();
        Profissional profissional = profissionalRepository.save(new Profissional(RoleProfissional.CHEF, bio));
        Chef chef = chefRepository.save(new Chef(profissional, request.especializacao()));
        usuario.setIdProfissional(profissional.getId());

        return ChefResponse.de(chef);
    }

    @Transactional(readOnly = true)
    public ChefResponse meuPerfil(Integer usuarioId) {
        return ChefResponse.de(chefDoUsuario(usuarioId));
    }

    /** Chef da conta logada; 403 se a conta não tem perfil de chef. */
    @Transactional(readOnly = true)
    public Chef chefDoUsuario(Integer usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(UsuarioNaoEncontradoException::new);
        if (usuario.getIdProfissional() == null) {
            throw new AcessoNegadoException(SEM_PERFIL_DE_CHEF);
        }
        Chef chef = chefRepository.findByProfissionalId(usuario.getIdProfissional())
                .orElseThrow(() -> new AcessoNegadoException(SEM_PERFIL_DE_CHEF));
        // Confere o discriminador: o banco não impede um role diferente de CHEF aqui.
        if (chef.getProfissional().getRole() != RoleProfissional.CHEF) {
            throw new AcessoNegadoException(SEM_PERFIL_DE_CHEF);
        }
        return chef;
    }
}
