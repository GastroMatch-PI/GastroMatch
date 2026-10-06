package com.gastromatch.exception;

import org.springframework.http.HttpStatus;

/**
 * Base de todas as exceções de negócio da API. Carrega o status HTTP que
 * deve ser devolvido, para que o GlobalExceptionHandler trate todas
 * com um único método.
 */
public abstract class ApiException extends RuntimeException {

    private final HttpStatus status;

    // protected: só as subclasses chamam. Ninguém cria "uma ApiException" solta.
    protected ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}