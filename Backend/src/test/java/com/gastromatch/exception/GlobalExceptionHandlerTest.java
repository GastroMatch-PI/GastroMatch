package com.gastromatch.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Set;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.gastromatch.dto.CadastroUsuarioRequest;
import com.gastromatch.dto.ErroResponse;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

/**
 * Testa os handlers que não dependem de subir o contexto web (@WebMvcTest já cobre
 * MethodArgumentTypeMismatchException via DiretorioRotasTest.idQueNaoEhNumeroDeveRetornar400).
 */
class GlobalExceptionHandlerTest {

    private static ValidatorFactory fabrica;
    private static Validator validador;

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @BeforeAll
    static void criarValidador() {
        fabrica = Validation.buildDefaultValidatorFactory();
        validador = fabrica.getValidator();
    }

    @AfterAll
    static void fecharFabrica() {
        fabrica.close();
    }

    @Test
    void constraintViolationExceptionDevolve400ComMapaDeErrosPorCampo() {
        // Gera violações reais (não um mock) validando um DTO existente com dados inválidos.
        Set<ConstraintViolation<CadastroUsuarioRequest>> violacoes =
                validador.validate(new CadastroUsuarioRequest("", "ab", "123"));
        assertFalse(violacoes.isEmpty());

        ResponseEntity<ErroResponse> resposta =
                handler.handleViolacaoDeRestricao(new ConstraintViolationException(violacoes));

        assertEquals(HttpStatus.BAD_REQUEST, resposta.getStatusCode());
        assertEquals(400, resposta.getBody().status());
        assertTrue(resposta.getBody().erros().containsKey("email"));
        assertTrue(resposta.getBody().erros().containsKey("username"));
        assertTrue(resposta.getBody().erros().containsKey("password"));
    }

    @Test
    void constraintViolationExceptionSemViolacoesDevolveMapaVazio() {
        ResponseEntity<ErroResponse> resposta =
                handler.handleViolacaoDeRestricao(new ConstraintViolationException(Set.of()));

        assertEquals(HttpStatus.BAD_REQUEST, resposta.getStatusCode());
        assertTrue(resposta.getBody().erros().isEmpty());
    }
}
