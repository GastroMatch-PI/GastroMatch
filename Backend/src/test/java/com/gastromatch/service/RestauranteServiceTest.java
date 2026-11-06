package com.gastromatch.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.gastromatch.dto.CadastroRestauranteRequest;
import com.gastromatch.dto.RestauranteResponse;
import com.gastromatch.entity.Profissional;
import com.gastromatch.entity.Restaurante;
import com.gastromatch.entity.Usuario;
import com.gastromatch.entity.enums.RoleProfissional;
import com.gastromatch.exception.ConflitoException;
import com.gastromatch.exception.RecursoNaoEncontradoException;
import com.gastromatch.exception.RequisicaoInvalidaException;
import com.gastromatch.repository.ChefRepository;
import com.gastromatch.repository.RestauranteRepository;
import com.gastromatch.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class RestauranteServiceTest {

    private static final int USUARIO = 10;
    private static final String CNPJ_VALIDO = "11222333000181";

    @Mock RestauranteRepository restauranteRepository;
    @Mock ChefRepository chefRepository;
    @Mock UsuarioRepository usuarioRepository;
    @Mock VinculoProfissional vinculo;

    private RestauranteService service;

    @BeforeEach
    void montar() {
        service = new RestauranteService(restauranteRepository, chefRepository, usuarioRepository, vinculo);
    }

    private static CadastroRestauranteRequest pedido(String cnpj, Double lat, Double lng) {
        return new CadastroRestauranteRequest("  Cantina  ", "bio", cnpj, 100, "Rua A", "01310100",
                "Bela Vista", "São Paulo", "SP", lat, lng);
    }

    @Test
    void cadastroNormalizaOsDadosELigaOProfissional() {
        Profissional p = new Profissional(RoleProfissional.RESTAURANTE, "bio");
        ReflectionTestUtils.setField(p, "id", 7);
        when(vinculo.criar(eq(USUARIO), eq(RoleProfissional.RESTAURANTE), any())).thenReturn(p);
        when(restauranteRepository.save(any(Restaurante.class))).thenAnswer(i -> i.getArgument(0));

        RestauranteResponse resposta = service.criarPerfil(USUARIO, pedido(CNPJ_VALIDO, -23.56, -46.65));

        ArgumentCaptor<Restaurante> salvo = ArgumentCaptor.forClass(Restaurante.class);
        verify(restauranteRepository).save(salvo.capture());
        assertEquals("11.222.333/0001-81", salvo.getValue().getCnpj());
        assertEquals("Cantina", salvo.getValue().getNome());
        assertEquals("01310-100", salvo.getValue().getCep());
        assertEquals(-23.56, salvo.getValue().getLatitude());
        assertEquals(-46.65, salvo.getValue().getLongitude());
        assertEquals(7, resposta.idProfissional());
    }

    @Test
    void cadastroSemCoordenadasEPermitido() {
        Profissional p = new Profissional(RoleProfissional.RESTAURANTE, null);
        ReflectionTestUtils.setField(p, "id", 7);
        when(vinculo.criar(eq(USUARIO), eq(RoleProfissional.RESTAURANTE), any())).thenReturn(p);
        when(restauranteRepository.save(any(Restaurante.class))).thenAnswer(i -> i.getArgument(0));

        RestauranteResponse resposta = service.criarPerfil(USUARIO, pedido(CNPJ_VALIDO, null, null));

        assertNull(resposta.latitude());
        assertNull(resposta.longitude());
    }

    @Test
    void soLatitudeOuSoLongitudeNaoEhAceito() {
        assertThrows(RequisicaoInvalidaException.class,
                () -> service.criarPerfil(USUARIO, pedido(CNPJ_VALIDO, -23.56, null)));
        assertThrows(RequisicaoInvalidaException.class,
                () -> service.criarPerfil(USUARIO, pedido(CNPJ_VALIDO, null, -46.65)));
        verify(vinculo, never()).criar(any(), any(), any());
    }

    @Test
    void cnpjInvalidoNaoCriaPerfil() {
        assertThrows(RequisicaoInvalidaException.class,
                () -> service.criarPerfil(USUARIO, pedido("11222333000182", null, null)));
        verify(vinculo, never()).criar(any(), any(), any());
    }

    private Restaurante restauranteDaConta() {
        Usuario usuario = new Usuario();
        usuario.setIdProfissional(7);
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));
        Profissional p = new Profissional(RoleProfissional.RESTAURANTE, "bio antiga");
        ReflectionTestUtils.setField(p, "id", 7);
        Restaurante r = new Restaurante();
        r.setProfissional(p);
        r.setCnpj("11.222.333/0001-81");
        r.setNome("Antigo");
        r.setBio("bio antiga");
        r.setPosicao(1.0, 2.0);
        when(restauranteRepository.findByProfissionalId(7)).thenReturn(Optional.of(r));
        return r;
    }

    @Test
    void atualizacaoTrocaTodosOsDadosEMantemAsBiosIguais() {
        Restaurante r = restauranteDaConta();

        RestauranteResponse resposta = service.atualizarPerfil(USUARIO, pedido(CNPJ_VALIDO, -23.56, -46.65));

        assertEquals("Cantina", r.getNome());
        assertEquals("bio", r.getBio());
        assertEquals("bio", r.getProfissional().getBio());
        assertEquals("01310-100", r.getCep());
        assertEquals(-23.56, r.getLatitude());
        assertEquals("Cantina", resposta.nome());
    }

    @Test
    void atualizacaoSemCoordenadasLimpaAPosicao() {
        Restaurante r = restauranteDaConta();

        service.atualizarPerfil(USUARIO, pedido(CNPJ_VALIDO, null, null));

        assertNull(r.getLatitude());
        assertNull(r.getLongitude());
    }

    @Test
    void atualizacaoMantendoOMesmoCnpjNaoConsultaDuplicidade() {
        restauranteDaConta();

        service.atualizarPerfil(USUARIO, pedido(CNPJ_VALIDO, null, null));

        verify(restauranteRepository, never()).existsByCnpj(any());
    }

    @Test
    void atualizacaoComCnpjDeOutroRestauranteDaConflito() {
        Restaurante r = restauranteDaConta();
        // Outro CNPJ válido (dígitos verificadores corretos).
        String outro = "11444777000161";
        when(restauranteRepository.existsByCnpj("11.444.777/0001-61")).thenReturn(true);

        assertThrows(ConflitoException.class, () -> service.atualizarPerfil(USUARIO, pedido(outro, null, null)));
        assertEquals("11.222.333/0001-81", r.getCnpj());
    }

    @Test
    void atualizacaoComSoUmaCoordenadaNaoEhAceita() {
        Restaurante r = restauranteDaConta();

        assertThrows(RequisicaoInvalidaException.class,
                () -> service.atualizarPerfil(USUARIO, pedido(CNPJ_VALIDO, -23.56, null)));
        assertEquals("Antigo", r.getNome());
    }

    @Test
    void contaSemPerfilDeRestauranteNaoAtualiza() {
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(new Usuario()));

        assertThrows(RecursoNaoEncontradoException.class,
                () -> service.atualizarPerfil(USUARIO, pedido(CNPJ_VALIDO, null, null)));
    }

    @Test
    void cnpjJaCadastradoNaoCriaPerfil() {
        when(restauranteRepository.existsByCnpj("11.222.333/0001-81")).thenReturn(true);

        assertThrows(ConflitoException.class,
                () -> service.criarPerfil(USUARIO, pedido(CNPJ_VALIDO, null, null)));
        verify(vinculo, never()).criar(any(), any(), any());
    }
}
