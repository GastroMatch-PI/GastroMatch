package com.gastromatch.exception;

import org.springframework.http.HttpStatus;

public class CredenciaisInvalidasException extends ApiException {
    public CredenciaisInvalidasException() {
        super(HttpStatus.UNAUTHORIZED, "Credenciais inválidas");
    }
}