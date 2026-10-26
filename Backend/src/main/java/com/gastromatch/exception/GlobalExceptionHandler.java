package com.gastromatch.exception;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.gastromatch.dto.ErroResponse;

/** Converte exceções em respostas HTTP padronizadas, em um único lugar. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 400: falha nas anotações @Valid dos DTOs
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroResponse> handleValidacao(MethodArgumentNotValidException ex) {
        Map<String, String> erros = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> erros.putIfAbsent(e.getField(), e.getDefaultMessage()));
        return ResponseEntity.badRequest()
                .body(new ErroResponse(400, "Dados inválidos", erros));
    }

    // 400: JSON malformado ou corpo ausente
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErroResponse> handleCorpoInvalido(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest()
                .body(new ErroResponse(400, "Corpo da requisição inválido"));
    }

    // 409: duplicidade detectada pelo service
    @ExceptionHandler({EmailJaCadastradoException.class, UsernameJaCadastradoException.class})
    public ResponseEntity<ErroResponse> handleConflito(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErroResponse(409, ex.getMessage()));
    }

    // 409: duplicidade detectada pela constraint UNIQUE (cadastros simultâneos)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErroResponse> handleIntegridade(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErroResponse(409, "Email ou username já cadastrado"));
    }

    // 401: login errado ou refresh token inválido
    @ExceptionHandler({CredenciaisInvalidasException.class, TokenInvalidoException.class})
    public ResponseEntity<ErroResponse> handleNaoAutorizado(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErroResponse(401, ex.getMessage()));
    }

    // 404
    @ExceptionHandler(UsuarioNaoEncontradoException.class)
    public ResponseEntity<ErroResponse> handleNaoEncontrado(UsuarioNaoEncontradoException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErroResponse(404, ex.getMessage()));
    }
}
