package com.gastromatch.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.gastromatch.entity.Receita;
import com.gastromatch.exception.ReceitaNaoEncontradaException;
import com.gastromatch.exception.RequisicaoInvalidaException;
import com.gastromatch.repository.DicaRepository;
import com.gastromatch.repository.EtapaReceitaRepository;
import com.gastromatch.repository.IngredienteReceitaRepository;
import com.gastromatch.repository.ReceitaRepository;
import com.gastromatch.repository.UsuarioRepository;

/** Validação do parâmetro ?porcoes= (as contas em si estão no CalculoReceitaTest). */
@ExtendWith(MockitoExtension.class)
class ReceitaServicePorcoesTest {

    @Mock ReceitaRepository receitaRepository;
    @Mock EtapaReceitaRepository etapaRepository;
    @Mock DicaRepository dicaRepository;
    @Mock IngredienteReceitaRepository ingredienteReceitaRepository;
    @Mock UsuarioRepository usuarioRepository;

    @InjectMocks ReceitaService service;

    @BeforeEach
    void receitaDeDuasPorcoes() {
        Receita receita = new Receita();
        receita.setNPorcoes(2);
        // lenient: o teste do 404 usa outro id e não precisa deste.
        lenient().when(receitaRepository.buscarComChef(1)).thenReturn(Optional.of(receita));
    }

    @Test
    void zeroPorcoesEInvalido() {
        assertThrows(RequisicaoInvalidaException.class, () -> service.detalhar(1, 0));
    }

    @Test
    void porcoesNegativasSaoInvalidas() {
        assertThrows(RequisicaoInvalidaException.class, () -> service.detalhar(1, -3));
    }

    @Test
    void acimaDoTetoEInvalido() {
        assertThrows(RequisicaoInvalidaException.class,
                () -> service.detalhar(1, ReceitaService.PORCOES_MAXIMAS + 1));
    }

    @Test
    void receitaInexistenteContinuaDando404() {
        when(receitaRepository.buscarComChef(2)).thenReturn(Optional.empty());
        assertThrows(ReceitaNaoEncontradaException.class, () -> service.detalhar(2, 4));
    }
}
