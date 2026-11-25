package com.gastromatch.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.gastromatch.dto.CadastroChefRequest;
import com.gastromatch.dto.ChefResponse;
import com.gastromatch.dto.PaginaResponse;
import com.gastromatch.dto.ReceitaResumoResponse;
import com.gastromatch.entity.Chef;
import com.gastromatch.entity.Profissional;
import com.gastromatch.entity.Receita;
import com.gastromatch.entity.Restaurante;
import com.gastromatch.entity.Usuario;
import com.gastromatch.entity.enums.Especializacao;
import com.gastromatch.entity.enums.RoleProfissional;
import com.gastromatch.exception.AcessoNegadoException;
import com.gastromatch.exception.ConflitoException;
import com.gastromatch.exception.RecursoNaoEncontradoException;
import com.gastromatch.exception.RequisicaoInvalidaException;
import com.gastromatch.repository.ChefRepository;
import com.gastromatch.repository.ProfissionalRepository;
import com.gastromatch.repository.ReceitaRepository;
import com.gastromatch.repository.RestauranteRepository;
import com.gastromatch.repository.UsuarioRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

@ExtendWith(MockitoExtension.class)
class ChefServiceTest {

    private static final int USUARIO = 10;

    @Mock UsuarioRepository usuarioRepository;
    @Mock ProfissionalRepository profissionalRepository;
    @Mock ChefRepository chefRepository;
    @Mock RestauranteRepository restauranteRepository;
    @Mock ReceitaRepository receitaRepository;
    @Mock ReceitaService receitaService;

    private ChefService service;
    private Usuario usuario;

    @BeforeEach
    void montar() {
        service = new ChefService(usuarioRepository, profissionalRepository, chefRepository,
                restauranteRepository, receitaRepository, receitaService);
        usuario = new Usuario();
        ReflectionTestUtils.setField(usuario, "id", USUARIO);
    }

    // ---- receitas do chef (GET /chefs/{id}/receitas) ----

    @Test
    void listaReceitasDoChef() {
        when(chefRepository.existsById(5)).thenReturn(true);
        var pageable = PageRequest.of(0, 20);
        Page<Receita> paginaDeReceitas = new PageImpl<>(List.of(new Receita()), pageable, 1);
        when(receitaRepository.findByChefId(5, pageable)).thenReturn(paginaDeReceitas);
        Page<ReceitaResumoResponse> paginaDeResumos =
                new PageImpl<>(List.of(), pageable, 1);
        when(receitaService.resumir(paginaDeReceitas)).thenReturn(paginaDeResumos);

        PaginaResponse<ReceitaResumoResponse> resposta = service.listarReceitas(5, pageable);

        assertEquals(1, resposta.totalElementos());
    }

    @Test
    void receitasDeChefInexistenteDa404() {
        when(chefRepository.existsById(99)).thenReturn(false);

        assertThrows(RecursoNaoEncontradoException.class,
                () -> service.listarReceitas(99, PageRequest.of(0, 20)));
        verify(receitaRepository, never()).findByChefId(any(), any());
    }

    @Test
    void criaProfissionalComRoleChefELigaAConta() {
        when(usuarioRepository.buscarComBloqueio(USUARIO)).thenReturn(Optional.of(usuario));
        when(profissionalRepository.save(any(Profissional.class))).thenAnswer(i -> {
            Profissional p = i.getArgument(0);
            ReflectionTestUtils.setField(p, "id", 7);
            return p;
        });
        when(chefRepository.save(any(Chef.class))).thenAnswer(i -> i.getArgument(0));

        ChefResponse resposta = service.criarPerfil(USUARIO,
                new CadastroChefRequest("  Cozinheiro  ", Especializacao.MASSAS, null));

        ArgumentCaptor<Profissional> salvo = ArgumentCaptor.forClass(Profissional.class);
        verify(profissionalRepository).save(salvo.capture());
        // O role não vem da requisição: é sempre CHEF.
        assertEquals(RoleProfissional.CHEF, salvo.getValue().getRole());
        assertEquals("Cozinheiro", salvo.getValue().getBio());
        assertEquals(7, usuario.getIdProfissional());
        assertEquals(7, resposta.idProfissional());
    }

    @Test
    void contaQueJaTemPerfilNaoCriaOutro() {
        usuario.setIdProfissional(3);
        when(usuarioRepository.buscarComBloqueio(USUARIO)).thenReturn(Optional.of(usuario));

        assertThrows(ConflitoException.class,
                () -> service.criarPerfil(USUARIO, new CadastroChefRequest(null, null, null)));
        verify(profissionalRepository, never()).save(any());
    }

    @Test
    void contaSemPerfilNaoEChef() {
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));

        assertThrows(AcessoNegadoException.class, () -> service.chefDoUsuario(USUARIO));
    }

    @Test
    void profissionalComRoleDiferenteDeChefNaoEChef() {
        usuario.setIdProfissional(3);
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));
        Chef chef = new Chef(new Profissional(RoleProfissional.NUTRICIONISTA, null), null);
        when(chefRepository.findByProfissionalId(3)).thenReturn(Optional.of(chef));

        assertThrows(AcessoNegadoException.class, () -> service.chefDoUsuario(USUARIO));
    }

    @Test
    void chefValidoEDevolvido() {
        usuario.setIdProfissional(3);
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));
        Chef chef = new Chef(new Profissional(RoleProfissional.CHEF, null), null);
        when(chefRepository.findByProfissionalId(3)).thenReturn(Optional.of(chef));

        assertEquals(chef, service.chefDoUsuario(USUARIO));
    }

    @Test
    void atualizaBioEEspecializacaoDoChef() {
        usuario.setIdProfissional(3);
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));
        Chef chef = new Chef(new Profissional(RoleProfissional.CHEF, "Bio antiga"), Especializacao.CARNES);
        when(chefRepository.findByProfissionalId(3)).thenReturn(Optional.of(chef));

        ChefResponse resposta = service.atualizarPerfil(USUARIO,
                new CadastroChefRequest("  Bio nova  ", Especializacao.MASSAS, null));

        // A bio sai sem espaços nas pontas, como no cadastro.
        assertEquals("Bio nova", resposta.bio());
        assertEquals(Especializacao.MASSAS, resposta.especializacao());
        assertEquals("Bio nova", chef.getProfissional().getBio());
        assertEquals(Especializacao.MASSAS, chef.getEspecializacao());
    }

    @Test
    void bioEmBrancoNaAtualizacaoViraNula() {
        usuario.setIdProfissional(3);
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));
        Chef chef = new Chef(new Profissional(RoleProfissional.CHEF, "Bio antiga"), Especializacao.CARNES);
        when(chefRepository.findByProfissionalId(3)).thenReturn(Optional.of(chef));

        ChefResponse resposta = service.atualizarPerfil(USUARIO, new CadastroChefRequest("   ", null, null));

        assertNull(resposta.bio());
        assertNull(resposta.especializacao());
    }

    @Test
    void contaSemPerfilDeChefNaoAtualiza() {
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));

        assertThrows(AcessoNegadoException.class,
                () -> service.atualizarPerfil(USUARIO, new CadastroChefRequest("bio", Especializacao.MASSAS, null)));
    }

    // ---- vínculo com o restaurante ----

    private Restaurante restaurante(int id) {
        Restaurante r = new Restaurante();
        ReflectionTestUtils.setField(r, "id", id);
        return r;
    }

    @Test
    void criaChefJaVinculadoAoRestaurante() {
        when(usuarioRepository.buscarComBloqueio(USUARIO)).thenReturn(Optional.of(usuario));
        when(restauranteRepository.findById(5)).thenReturn(Optional.of(restaurante(5)));
        when(profissionalRepository.save(any(Profissional.class))).thenAnswer(i -> i.getArgument(0));
        when(chefRepository.save(any(Chef.class))).thenAnswer(i -> i.getArgument(0));

        ChefResponse resposta = service.criarPerfil(USUARIO,
                new CadastroChefRequest("bio", Especializacao.MASSAS, 5));

        assertEquals(5, resposta.idRestaurante());
    }

    @Test
    void restauranteQueNaoExisteNaoCriaNada() {
        when(usuarioRepository.buscarComBloqueio(USUARIO)).thenReturn(Optional.of(usuario));
        when(restauranteRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(RequisicaoInvalidaException.class,
                () -> service.criarPerfil(USUARIO, new CadastroChefRequest("bio", null, 99)));
        verify(profissionalRepository, never()).save(any());
        verify(chefRepository, never()).save(any());
    }

    @Test
    void semRestauranteOChefNaoTemVinculo() {
        when(usuarioRepository.buscarComBloqueio(USUARIO)).thenReturn(Optional.of(usuario));
        when(profissionalRepository.save(any(Profissional.class))).thenAnswer(i -> i.getArgument(0));
        when(chefRepository.save(any(Chef.class))).thenAnswer(i -> i.getArgument(0));

        ChefResponse resposta = service.criarPerfil(USUARIO, new CadastroChefRequest("bio", null, null));

        assertNull(resposta.idRestaurante());
        verify(restauranteRepository, never()).findById(any());
    }

    @Test
    void atualizaORestauranteDoChef() {
        usuario.setIdProfissional(3);
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));
        Chef chef = new Chef(new Profissional(RoleProfissional.CHEF, "bio"), Especializacao.CARNES);
        when(chefRepository.findByProfissionalId(3)).thenReturn(Optional.of(chef));
        when(restauranteRepository.findById(8)).thenReturn(Optional.of(restaurante(8)));

        ChefResponse resposta = service.atualizarPerfil(USUARIO,
                new CadastroChefRequest("bio", Especializacao.CARNES, 8));

        assertEquals(8, resposta.idRestaurante());
        assertEquals(8, chef.getRestaurante().getId());
    }

    @Test
    void putSemRestauranteTiraOChefDoRestaurante() {
        usuario.setIdProfissional(3);
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));
        Chef chef = new Chef(new Profissional(RoleProfissional.CHEF, "bio"), Especializacao.CARNES);
        chef.setRestaurante(restaurante(8));
        when(chefRepository.findByProfissionalId(3)).thenReturn(Optional.of(chef));

        ChefResponse resposta = service.atualizarPerfil(USUARIO,
                new CadastroChefRequest("bio", Especializacao.CARNES, null));

        assertNull(resposta.idRestaurante());
        assertNull(chef.getRestaurante());
    }

    @Test
    void restauranteInexistenteNaAtualizacaoNaoMudaONada() {
        usuario.setIdProfissional(3);
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));
        Chef chef = new Chef(new Profissional(RoleProfissional.CHEF, "bio"), Especializacao.CARNES);
        chef.setRestaurante(restaurante(8));
        when(chefRepository.findByProfissionalId(3)).thenReturn(Optional.of(chef));
        when(restauranteRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(RequisicaoInvalidaException.class,
                () -> service.atualizarPerfil(USUARIO, new CadastroChefRequest("bio", Especializacao.CARNES, 99)));
    }
}
