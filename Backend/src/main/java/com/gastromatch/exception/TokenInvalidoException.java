package com.gastromatch.exception;

public class TokenInvalidoException extends RuntimeException {
    public TokenInvalidoException() {
        super("Token inválido ou expirado");
    }
}
