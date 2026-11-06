package com.gastromatch.service;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gastromatch.dto.CadastroNutricionistaRequest;
import com.gastromatch.dto.NutricionistaResponse;
import com.gastromatch.dto.NutricionistaResumoResponse;
import com.gastromatch.dto.PaginaResponse;
import com.gastromatch.entity.Nutricionista;
import com.gastromatch.entity.Profissional;
import com.gastromatch.entity.Usuario;
import com.gastromatch.entity.enums.RoleProfissional;
import com.gastromatch.entity.enums.StatusVerificacao;
import com.gastromatch.exception.ConflitoException;
import com.gastromatch.exception.RecursoNaoEncontradoException;
import com.gastromatch.exception.UsuarioNaoEncontradoException;
import com.gastromatch.repository.NutricionistaRepository;
import com.gastromatch.repository.UsuarioRepository;

@Service
public class NutricionistaService {

    static final String NAO_ENCONTRADA = "Nutricionista não encontrada";
    static final String SEM_PERFIL = "Você ainda não tem perfil de nutricionista";

    private final NutricionistaRepository nutricionistaRepository;
    private final UsuarioRepository usuarioRepository;
    private final VinculoProfissional vinculo;

    public NutricionistaService(NutricionistaRepository nutricionistaRepository,
                                UsuarioRepository usuarioRepository,
                                VinculoProfissional vinculo) {
        this.nutricionistaRepository = nutricionistaRepository;
        this.usuarioRepository = usuarioRepository;
        this.vinculo = vinculo;
    }

    /** Cria o perfil. Não há aprovação: a pessoa já aparece no diretório. */
    @Transactional
    public NutricionistaResponse criarPerfil(Integer usuarioId, CadastroNutricionistaRequest request) {
        String crn = Documentos.normalizarCrn(request.crn());
        if (nutricionistaRepository.existsByCrn(crn)) {
            throw new ConflitoException("CRN já cadastrado");
        }
        Profissional profissional = vinculo.criar(usuarioId, RoleProfissional.NUTRICIONISTA, request.bio());
        Nutricionista nutricionista = nutricionistaRepository.save(new Nutricionista(profissional, crn));
        return NutricionistaResponse.de(nutricionista);
    }

    /** Perfil da própria pessoa, mesmo que a equipe a tenha escondido do diretório. */
    @Transactional(readOnly = true)
    public NutricionistaResponse meuPerfil(Integer usuarioId) {
        return NutricionistaResponse.de(nutricionistaDoUsuario(usuarioId));
    }

    /**
     * Troca bio e CRN do perfil da conta logada. O status de verificação não é tocado: continua
     * só nas mãos da equipe. O CRN novo não pode ser de outra pessoa; manter o mesmo é permitido.
     */
    @Transactional
    public NutricionistaResponse atualizarPerfil(Integer usuarioId, CadastroNutricionistaRequest request) {
        Nutricionista nutricionista = nutricionistaDoUsuario(usuarioId);
        String crn = Documentos.normalizarCrn(request.crn());
        if (!crn.equals(nutricionista.getCrn()) && nutricionistaRepository.existsByCrn(crn)) {
            throw new ConflitoException("CRN já cadastrado");
        }
        nutricionista.setCrn(crn);
        nutricionista.getProfissional().setBio(VinculoProfissional.textoOuNulo(request.bio()));
        return NutricionistaResponse.de(nutricionista);
    }

    private Nutricionista nutricionistaDoUsuario(Integer usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId).orElseThrow(UsuarioNaoEncontradoException::new);
        if (usuario.getIdProfissional() == null) {
            throw new RecursoNaoEncontradoException(SEM_PERFIL);
        }
        return nutricionistaRepository.findByProfissionalId(usuario.getIdProfissional())
                .orElseThrow(() -> new RecursoNaoEncontradoException(SEM_PERFIL));
    }

    /** Diretório público: todas, menos as que a equipe escondeu (status diferente de APROVADO). */
    @Transactional(readOnly = true)
    public PaginaResponse<NutricionistaResumoResponse> listar(Pageable pageable) {
        Page<Nutricionista> pagina =
                nutricionistaRepository.findByStatusVerificacao(StatusVerificacao.APROVADO, pageable);
        List<Integer> ids = pagina.getContent().stream().map(n -> n.getProfissional().getId()).toList();
        Map<Integer, String> usernames = UsernamesPorProfissional.buscar(usuarioRepository, ids);
        return PaginaResponse.de(pagina.map(n ->
                NutricionistaResumoResponse.de(n, usernames.get(n.getProfissional().getId()))));
    }

    /** Perfil público. Quem a equipe escondeu responde 404, como se não existisse. */
    @Transactional(readOnly = true)
    public NutricionistaResumoResponse buscar(Integer id) {
        Nutricionista n = nutricionistaRepository.findByIdAndStatusVerificacao(id, StatusVerificacao.APROVADO)
                .orElseThrow(() -> new RecursoNaoEncontradoException(NAO_ENCONTRADA));
        String username = UsernamesPorProfissional
                .buscar(usuarioRepository, List.of(n.getProfissional().getId()))
                .get(n.getProfissional().getId());
        return NutricionistaResumoResponse.de(n, username);
    }
}
