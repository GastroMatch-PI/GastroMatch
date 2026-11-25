package com.gastromatch.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
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

import com.gastromatch.dto.IngredienteRequest;
import com.gastromatch.dto.IngredienteResponse;
import com.gastromatch.entity.Ingrediente;
import com.gastromatch.exception.ConflitoException;
import com.gastromatch.exception.RecursoNaoEncontradoException;
import com.gastromatch.repository.IngredienteReceitaRepository;
import com.gastromatch.repository.IngredienteRepository;

@ExtendWith(MockitoExtension.class)
class IngredienteServiceTest {

    @Mock IngredienteRepository ingredienteRepository;
    @Mock IngredienteReceitaRepository ingredienteReceitaRepository;

    private IngredienteService service;

    @BeforeEach
    void montar() {
        service = new IngredienteService(ingredienteRepository, ingredienteReceitaRepository);
    }

    private static IngredienteRequest requestValido(String nome) {
        return new IngredienteRequest(nome, 100f, 52f, 0.2f, 0.3f, 14f);
    }

    @Test
    void criaIngredienteComDadosValidos() {
        when(ingredienteRepository.existeOutroComMesmoNome("Maçã", null)).thenReturn(false);
        when(ingredienteRepository.save(any(Ingrediente.class))).thenAnswer(i -> {
            Ingrediente ing = i.getArgument(0);
            ReflectionTestUtils.setField(ing, "id", 1);
            return ing;
        });

        IngredienteResponse resposta = service.criar(requestValido("Maçã"));

        assertEquals("Maçã", resposta.nome());
        assertEquals(1, resposta.id());
    }

    @Test
    void nomeDuplicadoIgnorandoAcentoEMaiusculaDa409() {
        when(ingredienteRepository.existeOutroComMesmoNome("ACUCAR", null)).thenReturn(true);

        assertThrows(ConflitoException.class, () -> service.criar(requestValido("ACUCAR")));
        verify(ingredienteRepository, never()).save(any());
    }

    @Test
    void atualizaIngredienteExistente() {
        Ingrediente existente = new Ingrediente();
        ReflectionTestUtils.setField(existente, "id", 5);
        existente.setNome("Arroz");
        when(ingredienteRepository.findById(5)).thenReturn(Optional.of(existente));
        when(ingredienteRepository.existeOutroComMesmoNome("Arroz integral", 5)).thenReturn(false);

        IngredienteResponse resposta = service.atualizar(5, requestValido("Arroz integral"));

        assertEquals("Arroz integral", resposta.nome());
        assertEquals("Arroz integral", existente.getNome());
    }

    @Test
    void atualizarComNomeDeOutroIngredienteDa409() {
        Ingrediente existente = new Ingrediente();
        ReflectionTestUtils.setField(existente, "id", 5);
        when(ingredienteRepository.findById(5)).thenReturn(Optional.of(existente));
        when(ingredienteRepository.existeOutroComMesmoNome(eq("Feijão"), eq(5))).thenReturn(true);

        assertThrows(ConflitoException.class, () -> service.atualizar(5, requestValido("Feijão")));
    }

    @Test
    void atualizarIngredienteInexistenteDa404() {
        when(ingredienteRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(RecursoNaoEncontradoException.class, () -> service.atualizar(99, requestValido("Qualquer")));
    }

    @Test
    void excluiIngredienteSemUso() {
        when(ingredienteRepository.findById(5)).thenReturn(Optional.of(new Ingrediente()));
        when(ingredienteReceitaRepository.existsByIngredienteId(5)).thenReturn(false);

        service.excluir(5);

        verify(ingredienteRepository).deleteById(5);
    }

    @Test
    void naoExcluiIngredienteEmUso() {
        when(ingredienteRepository.findById(5)).thenReturn(Optional.of(new Ingrediente()));
        when(ingredienteReceitaRepository.existsByIngredienteId(5)).thenReturn(true);

        assertThrows(ConflitoException.class, () -> service.excluir(5));
        verify(ingredienteRepository, never()).deleteById(any());
    }

    @Test
    void excluirIngredienteInexistenteDa404() {
        when(ingredienteRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(RecursoNaoEncontradoException.class, () -> service.excluir(99));
        verify(ingredienteReceitaRepository, never()).existsByIngredienteId(any());
    }

    @Test
    void criarUsaNullParaIdExcluidoNaChecagemDeNome() {
        when(ingredienteRepository.existeOutroComMesmoNome(any(), isNull())).thenReturn(false);
        when(ingredienteRepository.save(any(Ingrediente.class))).thenAnswer(i -> i.getArgument(0));

        service.criar(requestValido("Ovo"));

        verify(ingredienteRepository).existeOutroComMesmoNome("Ovo", null);
    }
}
