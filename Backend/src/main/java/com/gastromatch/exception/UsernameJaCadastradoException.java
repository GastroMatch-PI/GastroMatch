package com.gastromatch.exception;

public class UsernameJaCadastradoException extends RuntimeException {
    public UsernameJaCadastradoException() {
        super("Username já cadastrado");
    }
}
