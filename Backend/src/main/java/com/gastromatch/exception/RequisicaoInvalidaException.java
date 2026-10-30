package com.gastromatch.exception;

/** Regra de negócio violada pelos dados enviados (ex.: ingrediente que não existe). Vira 400. */
public class RequisicaoInvalidaException extends RuntimeException {

    public RequisicaoInvalidaException(String mensagem) {
        super(mensagem);
    }
}
