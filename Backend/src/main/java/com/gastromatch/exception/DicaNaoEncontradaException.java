package com.gastromatch.exception;

public class DicaNaoEncontradaException extends RecursoNaoEncontradoException {

    public DicaNaoEncontradaException() {
        super("Dica não encontrada");
    }
}
