package com.gastromatch.exception;

public class EtapaNaoEncontradaException extends RecursoNaoEncontradoException {

    public EtapaNaoEncontradaException() {
        super("Etapa não encontrada");
    }
}
