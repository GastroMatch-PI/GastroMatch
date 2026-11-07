package com.gastromatch.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

import com.gastromatch.dto.AvaliacaoResponse;
import com.gastromatch.dto.ComentarioRequest;
import com.gastromatch.dto.ComentariosDaReceitaResponse;
import com.gastromatch.entity.Comentario;
import com.gastromatch.entity.Receita;
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
                () -> service.atualizar(OUTRA_PESSOA, 1, new ComentarioRequest("Troquei", 1f, null)));
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
                () -> service.criar(AUTOR, 9, new ComentarioRequest("Oi", null, null)));
        verify(comentarioRepository, never()).save(any());
    }

    @Test
    void listarDeReceitaInexistenteDa404() {
        when(receitaRepository.existsById(99)).thenReturn(false);

        assertThrows(ReceitaNaoEncontradaException.class,
                () -> service.listar(99, PageRequest.of(0, 20)));
    }

    @Test
    void listarComCemComentariosDevolveAPaginaEAMediaCorretas() {
        when(receitaRepository.existsById(1)).thenReturn(true);

        Receita receita = new Receita();
        ReflectionTestUtils.setField(receita, "id", 1);

        List<Comentario> cem = new ArrayList<>();
        float somaDasNotas = 0;
        int comNota = 0;
        for (int i = 0; i < 100; i++) {
            Usuario autor = new Usuario();
            ReflectionTestUtils.setField(autor, "id", i);
            // 1 em cada 5 comentários não tem nota: a média não pode contar esses.
            Float nota = (i % 5 == 0) ? null : (float) (i % 5);
            Comentario c = new Comentario(receita, autor, "Comentário " + i, nota);
            if (nota != null) {
                somaDasNotas += nota;
                comNota++;
            }
            cem.add(c);
        }
        var pageable = PageRequest.of(0, 20);
        when(comentarioRepository.findByReceitaId(1, pageable))
                .thenReturn(new PageImpl<>(cem.subList(0, 20), pageable, cem.size()));
        final float mediaEsperada = somaDasNotas / comNota;
        final long quantidadeEsperada = comNota;
        when(comentarioRepository.agregarNotas(1)).thenReturn(
                new ComentarioRepository.NotaAgregada() {
                    public Double getMedia() {
                        return (double) mediaEsperada;
                    }

                    public long getQuantidade() {
                        return quantidadeEsperada;
                    }
                });

        ComentariosDaReceitaResponse resposta = service.listar(1, pageable);

        assertEquals(100, resposta.comentarios().totalElementos());
        assertEquals(20, resposta.comentarios().conteudo().size());
        assertEquals(comNota, resposta.avaliacao().quantidade());
        assertEquals(mediaEsperada, resposta.avaliacao().media());
    }

    @Test
    void agregarAvaliacoesSemNenhumaNotaDevolveMediaNula() {
        when(comentarioRepository.agregarNotas(1)).thenReturn(
                new ComentarioRepository.NotaAgregada() {
                    public Double getMedia() {
                        return null;
                    }

                    public long getQuantidade() {
                        return 0;
                    }
                });

        AvaliacaoResponse avaliacao = service.agregarAvaliacoes(1);

        assertNull(avaliacao.media());
        assertEquals(0, avaliacao.quantidade());
    }
}
