package com.gastromatch.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.gastromatch.dto.ComentarioRequest;
import com.gastromatch.entity.Comentario;
import com.gastromatch.entity.Usuario;
import com.gastromatch.exception.AcessoNegadoException;
import com.gastromatch.exception.ComentarioNaoEncontradoException;
import com.gastromatch.exception.ReceitaNaoEncontradaException;
import com.gastromatch.repository.ComentarioRepository;
import com.gastromatch.repository.ReceitaRepository;
import com.gastromatch.repository.UsuarioRepository;

import jakarta.persistence.EntityManager;

@ExtendWith(MockitoExtension.class)
class ComentarioServiceTest {

    private static final int AUTOR = 10;
    private static final int OUTRA_PESSOA = 11;

    @Mock ComentarioRepository comentarioRepository;
    @Mock ReceitaRepository receitaRepository;
    @Mock UsuarioRepository usuarioRepository;
    @Mock EntityManager entityManager;

    private ComentarioService service;
    private Comentario comentario;

    @BeforeEach
    void montar() {
        service = new ComentarioService(comentarioRepository, receitaRepository, usuarioRepository, entityManager);
        Usuario autor = new Usuario();
        ReflectionTestUtils.setField(autor, "id", AUTOR);
        comentario = new Comentario(null, autor, "Gostei", 4f);
    }

    @Test
    void outraPessoaNaoEditaOComentario() {
        when(comentarioRepository.findById(1)).thenReturn(Optional.of(comentario));

        assertThrows(AcessoNegadoException.class,
                () -> service.atualizar(OUTRA_PESSOA, 1, new ComentarioRequest("Troquei", 1f)));
        verify(comentarioRepository, never()).save(any());
    }

    @Test
    void outraPessoaNaoApagaOComentario() {
        when(comentarioRepository.findById(1)).thenReturn(Optional.of(comentario));

        assertThrows(AcessoNegadoException.class, () -> service.excluir(OUTRA_PESSOA, 1));
        verify(comentarioRepository, never()).delete(any());
    }

    @Test
    void autorApagaOProprioComentario() {
        when(comentarioRepository.findById(1)).thenReturn(Optional.of(comentario));

        service.excluir(AUTOR, 1);

        verify(comentarioRepository).delete(comentario);
    }

    @Test
    void comentarioInexistenteDa404() {
        when(comentarioRepository.findById(9)).thenReturn(Optional.empty());

        assertThrows(ComentarioNaoEncontradoException.class, () -> service.excluir(AUTOR, 9));
    }

    @Test
    void naoComentaReceitaInexistente() {
        when(receitaRepository.findById(9)).thenReturn(Optional.empty());

        assertThrows(ReceitaNaoEncontradaException.class,
                () -> service.criar(AUTOR, 9, new ComentarioRequest("Oi", null)));
        verify(comentarioRepository, never()).save(any());
    }
}
