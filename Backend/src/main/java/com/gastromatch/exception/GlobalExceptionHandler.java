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
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

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

    // 409: o banco recusou por conflito (UNIQUE, cadastros simultâneos). Não dá para saber qual campo,
    // então a mensagem é neutra; as duplicidades conhecidas (e-mail, CNPJ, CRN...) têm erro próprio.
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErroResponse> handleIntegridade(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErroResponse(409, "Já existe um registro com esses dados"));
    }

    // 401: login errado ou refresh token inválido
    @ExceptionHandler({CredenciaisInvalidasException.class, TokenInvalidoException.class})
    public ResponseEntity<ErroResponse> handleNaoAutorizado(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErroResponse(401, ex.getMessage()));
    }

    // 400: dados válidos no formato, mas que quebram uma regra de negócio
    @ExceptionHandler(RequisicaoInvalidaException.class)
    public ResponseEntity<ErroResponse> handleRequisicaoInvalida(RequisicaoInvalidaException ex) {
        return ResponseEntity.badRequest().body(new ErroResponse(400, ex.getMessage()));
    }

    // 403: logado, mas sem permissão para este recurso
    @ExceptionHandler(AcessoNegadoException.class)
    public ResponseEntity<ErroResponse> handleAcessoNegado(AcessoNegadoException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErroResponse(403, ex.getMessage()));
    }

    // 409: conflito com o estado atual
    @ExceptionHandler(ConflitoException.class)
    public ResponseEntity<ErroResponse> handleConflitoDeEstado(ConflitoException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErroResponse(409, ex.getMessage()));
    }

    // 400: parâmetro com tipo errado (ex.: dificuldade=XYZ, id=abc)
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErroResponse> handleParametroInvalido(MethodArgumentTypeMismatchException ex) {
        return ResponseEntity.badRequest()
                .body(new ErroResponse(400, "Valor inválido para o parâmetro '" + ex.getName() + "'"));
    }

    // 413: arquivo maior que o limite do upload (spring.servlet.multipart)
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErroResponse> handleArquivoGrande(MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(new ErroResponse(413, "A imagem deve ter no máximo 5 MB"));
    }

    // 400: upload sem o campo "arquivo"
    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<ErroResponse> handleArquivoAusente(MissingServletRequestPartException ex) {
        return ResponseEntity.badRequest()
                .body(new ErroResponse(400, "Envie o arquivo no campo '" + ex.getRequestPartName() + "'"));
    }

    // 404
    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ResponseEntity<ErroResponse> handleNaoEncontrado(RecursoNaoEncontradoException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErroResponse(404, ex.getMessage()));
    }
}
