package com.gastromatch.controller;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

/** Monta o PageRequest das listagens públicas, com teto no tamanho para ninguém pedir a tabela inteira. */
final class Paginacao {

    static final int TAMANHO_MAXIMO = 50;

    private Paginacao() {
    }

    static PageRequest de(int pagina, int tamanho, Sort ordem) {
        return PageRequest.of(Math.max(pagina, 0), Math.min(Math.max(tamanho, 1), TAMANHO_MAXIMO), ordem);
    }
}
