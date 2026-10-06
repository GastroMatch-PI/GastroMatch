package com.gastromatch.exception;

import org.springframework.http.HttpStatus;

public class UsernameJaCadastradoException extends ApiException {
    
    public UsernameJaCadastradoException(){
super(HttpStatus.CONFLICT, "Username já cadastrado");    }
}
