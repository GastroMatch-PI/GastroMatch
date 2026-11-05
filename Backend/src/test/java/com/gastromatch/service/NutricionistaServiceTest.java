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

import com.gastromatch.dto.CadastroNutricionistaRequest;
import com.gastromatch.dto.NutricionistaResponse;
import com.gastromatch.entity.Nutricionista;
import com.gastromatch.entity.Profissional;
import com.gastromatch.entity.Usuario;
import com.gastromatch.entity.enums.RoleProfissional;
import com.gastromatch.entity.enums.StatusVerificacao;
import com.gastromatch.exception.ConflitoException;
import com.gastromatch.exception.RecursoNaoEncontradoException;
import com.gastromatch.exception.RequisicaoInvalidaException;
import com.gastromatch.repository.NutricionistaRepository;
import com.gastromatch.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class NutricionistaServiceTest {

    private static final int USUARIO = 10;

    @Mock NutricionistaRepository nutricionistaRepository;
    @Mock UsuarioRepository usuarioRepository;
    @Mock VinculoProfissional vinculo;

    private NutricionistaService service;

    @BeforeEach
    void montar() {
        service = new NutricionistaService(nutricionistaRepository, usuarioRepository, vinculo);
    }

    private static Profissional profissional(int id) {
        Profissional p = new Profissional(RoleProfissional.NUTRICIONISTA, "bio");
        ReflectionTestUtils.setField(p, "id", id);
        return p;
    }

    @Test
    void cadastroNasceAprovadoECrnNormalizado() {
        when(vinculo.criar(eq(USUARIO), eq(RoleProfissional.NUTRICIONISTA), any())).thenReturn(profissional(7));
        when(nutricionistaRepository.save(any(Nutricionista.class))).thenAnswer(i -> i.getArgument(0));

        NutricionistaResponse resposta = service.criarPerfil(USUARIO,
                new CadastroNutricionistaRequest("bio", "  crn-3/12345 "));

        ArgumentCaptor<Nutricionista> salva = ArgumentCaptor.forClass(Nutricionista.class);
        verify(nutricionistaRepository).save(salva.capture());
        assertEquals("CRN-3/12345", salva.getValue().getCrn());
        // O status nunca vem do cliente: não há aprovação, então já nasce aprovada.
        assertEquals(StatusVerificacao.APROVADO, salva.getValue().getStatusVerificacao());
        assertEquals(StatusVerificacao.APROVADO, resposta.statusVerificacao());
    }

    @Test
    void crnJaCadastradoNaoCriaPerfil() {
        when(nutricionistaRepository.existsByCrn("CRN-3/12345")).thenReturn(true);

        assertThrows(ConflitoException.class,
                () -> service.criarPerfil(USUARIO, new CadastroNutricionistaRequest(null, "CRN-3/12345")));
        verify(vinculo, never()).criar(any(), any(), any());
    }

    @Test
    void crnInvalidoNaoCriaPerfil() {
        assertThrows(RequisicaoInvalidaException.class,
                () -> service.criarPerfil(USUARIO, new CadastroNutricionistaRequest(null, "CRN")));
        verify(vinculo, never()).criar(any(), any(), any());
    }

    @Test
    void perfilEscondidoPelaEquipeNaoApareceNoDiretorioPublico() {
        when(nutricionistaRepository.findByIdAndStatusVerificacao(3, StatusVerificacao.APROVADO))
                .thenReturn(Optional.empty());

        assertThrows(RecursoNaoEncontradoException.class, () -> service.buscar(3));
    }

    private Nutricionista perfilDaConta() {
        Usuario usuario = new Usuario();
        usuario.setIdProfissional(7);
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));
        Nutricionista n = new Nutricionista(profissional(7), "CRN-3/11111");
        when(nutricionistaRepository.findByProfissionalId(7)).thenReturn(Optional.of(n));
        return n;
    }

    @Test
    void atualizacaoTrocaBioECrnENaoMexeNoStatus() {
        Nutricionista n = perfilDaConta();
        when(nutricionistaRepository.existsByCrn("CRN-3/22222")).thenReturn(false);

        NutricionistaResponse resposta = service.atualizarPerfil(USUARIO,
                new CadastroNutricionistaRequest("  Bio nova  ", " crn-3/22222 "));

        assertEquals("CRN-3/22222", n.getCrn());
        assertEquals("Bio nova", n.getProfissional().getBio());
        assertEquals("CRN-3/22222", resposta.crn());
        assertEquals(StatusVerificacao.APROVADO, n.getStatusVerificacao());
    }

    @Test
    void atualizacaoMantendoOMesmoCrnNaoDaConflito() {
        Nutricionista n = perfilDaConta();

        service.atualizarPerfil(USUARIO, new CadastroNutricionistaRequest("   ", "CRN-3/11111"));

        // Não consulta duplicidade: o CRN é o da própria pessoa. Bio em branco vira nula.
        verify(nutricionistaRepository, never()).existsByCrn(any());
        assertNull(n.getProfissional().getBio());
    }

    @Test
    void atualizacaoComCrnDeOutraPessoaDaConflito() {
        Nutricionista n = perfilDaConta();
        when(nutricionistaRepository.existsByCrn("CRN-3/22222")).thenReturn(true);

        assertThrows(ConflitoException.class,
                () -> service.atualizarPerfil(USUARIO, new CadastroNutricionistaRequest("bio", "CRN-3/22222")));
        assertEquals("CRN-3/11111", n.getCrn());
    }

    @Test
    void contaSemPerfilNaoAtualiza() {
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(new Usuario()));

        assertThrows(RecursoNaoEncontradoException.class,
                () -> service.atualizarPerfil(USUARIO, new CadastroNutricionistaRequest("bio", "CRN-3/22222")));
    }

    @Test
    void contaSemPerfilNaoTemMeuPerfil() {
        Usuario usuario = new Usuario();
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));

        assertThrows(RecursoNaoEncontradoException.class, () -> service.meuPerfil(USUARIO));
    }
}
