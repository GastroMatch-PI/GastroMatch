package com.gastromatch.exception;

public class UsuarioNaoEncontradoException extends RecursoNaoEncontradoException {

    public UsuarioNaoEncontradoException() {
        super("Usuário não encontrado");
    }
}
