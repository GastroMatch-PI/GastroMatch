package com.gastromatch.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
    void cadastroNasceComoPendenteECrnNormalizado() {
        when(vinculo.criar(eq(USUARIO), eq(RoleProfissional.NUTRICIONISTA), any())).thenReturn(profissional(7));
        when(nutricionistaRepository.save(any(Nutricionista.class))).thenAnswer(i -> i.getArgument(0));

        NutricionistaResponse resposta = service.criarPerfil(USUARIO,
                new CadastroNutricionistaRequest("bio", "  crn-3/12345 "));

        ArgumentCaptor<Nutricionista> salva = ArgumentCaptor.forClass(Nutricionista.class);
        verify(nutricionistaRepository).save(salva.capture());
        assertEquals("CRN-3/12345", salva.getValue().getCrn());
        // A verificação nunca vem do cliente: começa pendente.
        assertEquals(StatusVerificacao.PENDENTE, salva.getValue().getStatusVerificacao());
        assertEquals(StatusVerificacao.PENDENTE, resposta.statusVerificacao());
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
    void perfilPendenteNaoApareceNoDiretorioPublico() {
        when(nutricionistaRepository.findByIdAndStatusVerificacao(3, StatusVerificacao.APROVADO))
                .thenReturn(Optional.empty());

        assertThrows(RecursoNaoEncontradoException.class, () -> service.buscar(3));
    }

    @Test
    void contaSemPerfilNaoTemMeuPerfil() {
        Usuario usuario = new Usuario();
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));

        assertThrows(RecursoNaoEncontradoException.class, () -> service.meuPerfil(USUARIO));
    }
}
