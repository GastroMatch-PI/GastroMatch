package com.gastromatch.exception;

/** A pessoa está logada, mas não pode fazer isto (ex.: mexer na receita de outro chef). Vira 403. */
public class AcessoNegadoException extends RuntimeException {

    public AcessoNegadoException(String mensagem) {
        super(mensagem);
    }
}
