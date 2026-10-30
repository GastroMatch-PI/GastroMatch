package com.gastromatch.exception;

public class ComentarioNaoEncontradoException extends RecursoNaoEncontradoException {

    public ComentarioNaoEncontradoException() {
        super("Comentário não encontrado");
    }
}
