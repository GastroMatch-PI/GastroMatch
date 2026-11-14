package com.gastromatch.service;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gastromatch.dto.CadastroChefRequest;
import com.gastromatch.dto.ChefPerfilResponse;
import com.gastromatch.dto.ChefResponse;
import com.gastromatch.dto.PaginaResponse;
import com.gastromatch.entity.Chef;
import com.gastromatch.entity.Profissional;
import com.gastromatch.entity.Restaurante;
import com.gastromatch.entity.Usuario;
import com.gastromatch.entity.enums.Especializacao;
import com.gastromatch.entity.enums.RoleProfissional;
import com.gastromatch.exception.AcessoNegadoException;
import com.gastromatch.exception.ConflitoException;
import com.gastromatch.exception.RecursoNaoEncontradoException;
import com.gastromatch.exception.RequisicaoInvalidaException;
import com.gastromatch.exception.UsuarioNaoEncontradoException;
import com.gastromatch.repository.ChefRepository;
import com.gastromatch.repository.ProfissionalRepository;
import com.gastromatch.repository.RestauranteRepository;
import com.gastromatch.repository.UsuarioRepository;

/** Perfil de chef: criação e consulta do chef da conta logada. */
@Service
public class ChefService {

    static final String SEM_PERFIL_DE_CHEF = "Apenas chefs podem fazer isto. Crie seu perfil de chef primeiro";

    private final UsuarioRepository usuarioRepository;
    private final ProfissionalRepository profissionalRepository;
    private final ChefRepository chefRepository;
    private final RestauranteRepository restauranteRepository;

    public ChefService(UsuarioRepository usuarioRepository,
                       ProfissionalRepository profissionalRepository,
                       ChefRepository chefRepository,
                       RestauranteRepository restauranteRepository) {
        this.usuarioRepository = usuarioRepository;
        this.profissionalRepository = profissionalRepository;
        this.chefRepository = chefRepository;
        this.restauranteRepository = restauranteRepository;
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

        // Confere o restaurante antes de gravar qualquer coisa.
        Restaurante restaurante = restauranteOuNulo(request.idRestaurante());
        String bio = (request.bio() == null || request.bio().isBlank()) ? null : request.bio().trim();
        Profissional profissional = profissionalRepository.save(new Profissional(RoleProfissional.CHEF, bio));
        Chef novo = new Chef(profissional, request.especializacao());
        novo.setRestaurante(restaurante);
        Chef chef = chefRepository.save(novo);
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

    /** Diretório público de chefs, com filtro opcional por especialização. */
    @Transactional(readOnly = true)
    public PaginaResponse<ChefPerfilResponse> listar(Especializacao especializacao, Pageable pageable) {
        Page<Chef> pagina = (especializacao == null)
                ? chefRepository.findAll(pageable)
                : chefRepository.findByEspecializacao(especializacao, pageable);
        Map<Integer, String> usernames = UsernamesPorProfissional.buscar(usuarioRepository,
                pagina.getContent().stream().map(c -> c.getProfissional().getId()).toList());
        return PaginaResponse.de(pagina.map(c ->
                ChefPerfilResponse.de(c, usernames.get(c.getProfissional().getId()))));
    }

    /** Perfil público de um chef. */
    @Transactional(readOnly = true)
    public ChefPerfilResponse perfilPublico(Integer id) {
        Chef chef = chefRepository.buscarComPerfil(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Chef não encontrado"));
        String username = UsernamesPorProfissional
                .buscar(usuarioRepository, List.of(chef.getProfissional().getId()))
                .get(chef.getProfissional().getId());
        return ChefPerfilResponse.de(chef, username);
    }

    /** Atualiza perfil de um chef */
    @Transactional
    public ChefResponse atualizarPerfil(Integer usuarioId, CadastroChefRequest request){
        Chef chef = chefDoUsuario(usuarioId);
        chef.getProfissional().setBio(request.bio() == null || request.bio().isBlank() ? null : request.bio().trim());
        chef.setEspecializacao(request.especializacao());
        chef.setRestaurante(restauranteOuNulo(request.idRestaurante()));
        return ChefResponse.de(chef);
    }

    // Sem id, o chef não trabalha em restaurante nenhum. Com id que não existe, 400.
    private Restaurante restauranteOuNulo(Integer idRestaurante) {
        if (idRestaurante == null) {
            return null;
        }
        return restauranteRepository.findById(idRestaurante)
                .orElseThrow(() -> new RequisicaoInvalidaException("Restaurante não encontrado"));
    }
}
