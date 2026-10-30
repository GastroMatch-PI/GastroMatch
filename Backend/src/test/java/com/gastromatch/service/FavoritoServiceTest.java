package com.gastromatch.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
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
import org.springframework.dao.DataIntegrityViolationException;

import com.gastromatch.entity.Favorito;
import com.gastromatch.entity.Receita;
import com.gastromatch.entity.Usuario;
import com.gastromatch.exception.ReceitaNaoEncontradaException;
import com.gastromatch.repository.FavoritoRepository;
import com.gastromatch.repository.ReceitaRepository;
import com.gastromatch.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class FavoritoServiceTest {

    @Mock FavoritoRepository favoritoRepository;
    @Mock ReceitaRepository receitaRepository;
    @Mock UsuarioRepository usuarioRepository;
    @Mock ReceitaService receitaService;

    private FavoritoService service;

    @BeforeEach
    void montar() {
        service = new FavoritoService(favoritoRepository, receitaRepository, usuarioRepository, receitaService);
    }

    @Test
    void favoritaUmaVez() {
        when(receitaRepository.findById(5)).thenReturn(Optional.of(new Receita()));
        when(favoritoRepository.existsByUsuarioIdAndReceitaId(1, 5)).thenReturn(false);
        when(usuarioRepository.getReferenceById(1)).thenReturn(new Usuario());

        service.favoritar(1, 5);

        verify(favoritoRepository).save(any(Favorito.class));
    }

    @Test
    void favoritarDeNovoNaoFazNadaENaoDaErro() {
        when(receitaRepository.findById(5)).thenReturn(Optional.of(new Receita()));
        when(favoritoRepository.existsByUsuarioIdAndReceitaId(1, 5)).thenReturn(true);

        assertDoesNotThrow(() -> service.favoritar(1, 5));
        verify(favoritoRepository, never()).save(any());
    }

    @Test
    void pedidoSimultaneoRecusadoPeloBancoContaComoJaFavoritado() {
        when(receitaRepository.findById(5)).thenReturn(Optional.of(new Receita()));
        when(favoritoRepository.existsByUsuarioIdAndReceitaId(1, 5)).thenReturn(false);
        when(usuarioRepository.getReferenceById(1)).thenReturn(new Usuario());
        when(favoritoRepository.save(any(Favorito.class))).thenThrow(new DataIntegrityViolationException("duplicado"));

        assertDoesNotThrow(() -> service.favoritar(1, 5));
    }

    @Test
    void naoFavoritaReceitaInexistente() {
        when(receitaRepository.findById(9)).thenReturn(Optional.empty());

        assertThrows(ReceitaNaoEncontradaException.class, () -> service.favoritar(1, 9));
        verify(favoritoRepository, never()).save(any());
    }

    @Test
    void desfavoritarRemoveSoDaPropriaConta() {
        service.desfavoritar(1, 5);

        verify(favoritoRepository).deleteByUsuarioIdAndReceitaId(1, 5);
    }
}
