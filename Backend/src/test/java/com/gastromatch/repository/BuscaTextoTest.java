package com.gastromatch.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class BuscaTextoTest {

    @Test
    void removeAcentoEMaiuscula() {
        assertEquals("%acucar%", BuscaTexto.padraoContem("Açúcar"));
        assertEquals("%macarrao ao alho%", BuscaTexto.padraoContem("  MACARRÃO ao Alho "));
    }

    @Test
    void textoSemAcentoContinuaIgual() {
        assertEquals("%bolo%", BuscaTexto.padraoContem("bolo"));
    }

    @Test
    void curingasDigitadosValemComoTextoComum() {
        assertEquals("%100\\%%", BuscaTexto.padraoContem("100%"));
        assertEquals("%a\\_b%", BuscaTexto.padraoContem("a_b"));
        assertEquals("%a\\\\b%", BuscaTexto.padraoContem("a\\b"));
    }
}
