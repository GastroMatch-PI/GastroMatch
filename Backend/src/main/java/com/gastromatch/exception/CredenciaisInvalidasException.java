package com.gastromatch.exception;

public class CredenciaisInvalidasException extends RuntimeException {
    // Mensagem única para email inexistente e senha errada: não revela quais emails existem.
    public CredenciaisInvalidasException() {
        super("Email ou senha inválidos");
    }
}
