package com.gastromatch.exception;

/** O pedido conflita com o estado atual (ex.: conta que já tem perfil de chef). Vira 409. */
public class ConflitoException extends RuntimeException {

    public ConflitoException(String mensagem) {
        super(mensagem);
    }
}
