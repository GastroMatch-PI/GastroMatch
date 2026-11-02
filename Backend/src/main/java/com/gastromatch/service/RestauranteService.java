package com.gastromatch.service;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gastromatch.dto.CadastroRestauranteRequest;
import com.gastromatch.dto.ChefResumoResponse;
import com.gastromatch.dto.PaginaResponse;
import com.gastromatch.dto.RestauranteDetalheResponse;
import com.gastromatch.dto.RestauranteResponse;
import com.gastromatch.dto.RestauranteResumoResponse;
import com.gastromatch.entity.Chef;
import com.gastromatch.entity.Profissional;
import com.gastromatch.entity.Restaurante;
import com.gastromatch.entity.Usuario;
import com.gastromatch.entity.enums.RoleProfissional;
import com.gastromatch.exception.ConflitoException;
import com.gastromatch.exception.RecursoNaoEncontradoException;
import com.gastromatch.exception.RequisicaoInvalidaException;
import com.gastromatch.exception.UsuarioNaoEncontradoException;
import com.gastromatch.repository.ChefRepository;
import com.gastromatch.repository.RestauranteRepository;
import com.gastromatch.repository.RestauranteSpecs;
import com.gastromatch.repository.UsuarioRepository;

@Service
public class RestauranteService {

    static final String NAO_ENCONTRADO = "Restaurante não encontrado";
    static final String SEM_PERFIL = "Você ainda não tem perfil de restaurante";

    private final RestauranteRepository restauranteRepository;
    private final ChefRepository chefRepository;
    private final UsuarioRepository usuarioRepository;
    private final VinculoProfissional vinculo;

    public RestauranteService(RestauranteRepository restauranteRepository,
                              ChefRepository chefRepository,
                              UsuarioRepository usuarioRepository,
                              VinculoProfissional vinculo) {
        this.restauranteRepository = restauranteRepository;
        this.chefRepository = chefRepository;
        this.usuarioRepository = usuarioRepository;
        this.vinculo = vinculo;
    }

    @Transactional
    public RestauranteResponse criarPerfil(Integer usuarioId, CadastroRestauranteRequest request) {
        String cnpj = Documentos.normalizarCnpj(request.cnpj());
        // As duas coordenadas juntas ou nenhuma: uma só não marca ponto nenhum no mapa.
        if ((request.latitude() == null) != (request.longitude() == null)) {
            throw new RequisicaoInvalidaException("Informe latitude e longitude juntas, ou nenhuma das duas");
        }
        if (restauranteRepository.existsByCnpj(cnpj)) {
            throw new ConflitoException("CNPJ já cadastrado");
        }

        Profissional profissional = vinculo.criar(usuarioId, RoleProfissional.RESTAURANTE, request.bio());

        Restaurante restaurante = new Restaurante();
        restaurante.setProfissional(profissional);
        restaurante.setCnpj(cnpj);
        restaurante.setNome(request.nome().trim());
        restaurante.setBio(VinculoProfissional.textoOuNulo(request.bio()));
        restaurante.setNumero(request.numero());
        restaurante.setRua(VinculoProfissional.textoOuNulo(request.rua()));
        restaurante.setCep(Documentos.normalizarCep(request.cep()));
        restaurante.setBairro(VinculoProfissional.textoOuNulo(request.bairro()));
        restaurante.setCidade(VinculoProfissional.textoOuNulo(request.cidade()));
        restaurante.setEstado(VinculoProfissional.textoOuNulo(request.estado()));
        restaurante.setPosicao(request.latitude(), request.longitude());
        return RestauranteResponse.de(restauranteRepository.save(restaurante));
    }

    @Transactional(readOnly = true)
    public RestauranteResponse meuPerfil(Integer usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId).orElseThrow(UsuarioNaoEncontradoException::new);
        if (usuario.getIdProfissional() == null) {
            throw new RecursoNaoEncontradoException(SEM_PERFIL);
        }
        return restauranteRepository.findByProfissionalId(usuario.getIdProfissional())
                .map(RestauranteResponse::de)
                .orElseThrow(() -> new RecursoNaoEncontradoException(SEM_PERFIL));
    }

    /** Diretório e mapa: restaurantes com filtros opcionais (texto, cidade, bairro, estado). */
    @Transactional(readOnly = true)
    public PaginaResponse<RestauranteResumoResponse> listar(String texto, String cidade, String bairro,
                                                            String estado, Pageable pageable) {
        return PaginaResponse.de(restauranteRepository
                .findAll(RestauranteSpecs.comFiltros(texto, cidade, bairro, estado), pageable)
                .map(RestauranteResumoResponse::de));
    }

    /** Página do restaurante com os chefs que trabalham nele. */
    @Transactional(readOnly = true)
    public RestauranteDetalheResponse detalhar(Integer id) {
        Restaurante restaurante = restauranteRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(NAO_ENCONTRADO));

        List<Chef> chefs = chefRepository.findByRestauranteIdOrderByIdAsc(id);
        Map<Integer, String> usernames = UsernamesPorProfissional.buscar(usuarioRepository,
                chefs.stream().map(c -> c.getProfissional().getId()).toList());
        List<ChefResumoResponse> resumos = chefs.stream()
                .map(c -> ChefResumoResponse.de(c, usernames.get(c.getProfissional().getId())))
                .toList();
        return RestauranteDetalheResponse.de(RestauranteResumoResponse.de(restaurante), resumos);
    }
}
