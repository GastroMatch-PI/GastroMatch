package com.gastromatch.exception;

import org.springframework.http.HttpStatus;

public class EmailJaCadastradoException extends ApiException {

    public EmailJaCadastradoException() {
        super(HttpStatus.CONFLICT, "Email já cadastrado");
    }
}