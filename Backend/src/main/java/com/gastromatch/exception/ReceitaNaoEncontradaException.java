package com.gastromatch.exception;

public class ReceitaNaoEncontradaException extends RecursoNaoEncontradoException {

    public ReceitaNaoEncontradaException() {
        super("Receita não encontrada");
    }
}
