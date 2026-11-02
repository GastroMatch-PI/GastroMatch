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

    /** Cria o perfil. Nasce PENDENTE: só a equipe aprova, direto no banco, e só então a pessoa aparece no diretório. */
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

    /** Perfil da própria pessoa, inclusive enquanto a verificação está pendente. */
    @Transactional(readOnly = true)
    public NutricionistaResponse meuPerfil(Integer usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId).orElseThrow(UsuarioNaoEncontradoException::new);
        if (usuario.getIdProfissional() == null) {
            throw new RecursoNaoEncontradoException(SEM_PERFIL);
        }
        return nutricionistaRepository.findByProfissionalId(usuario.getIdProfissional())
                .map(NutricionistaResponse::de)
                .orElseThrow(() -> new RecursoNaoEncontradoException(SEM_PERFIL));
    }

    /** Diretório público: só nutricionistas com a verificação aprovada. */
    @Transactional(readOnly = true)
    public PaginaResponse<NutricionistaResumoResponse> listar(Pageable pageable) {
        Page<Nutricionista> pagina =
                nutricionistaRepository.findByStatusVerificacao(StatusVerificacao.APROVADO, pageable);
        List<Integer> ids = pagina.getContent().stream().map(n -> n.getProfissional().getId()).toList();
        Map<Integer, String> usernames = UsernamesPorProfissional.buscar(usuarioRepository, ids);
        return PaginaResponse.de(pagina.map(n ->
                NutricionistaResumoResponse.de(n, usernames.get(n.getProfissional().getId()))));
    }

    /** Perfil público. Quem ainda não foi aprovado responde 404, como se não existisse. */
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
