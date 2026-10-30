package com.gastromatch.exception;

/** Base das exceções "não existe": o GlobalExceptionHandler devolve 404 para todas. */
public class RecursoNaoEncontradoException extends RuntimeException {

    public RecursoNaoEncontradoException(String mensagem) {
        super(mensagem);
    }
}
