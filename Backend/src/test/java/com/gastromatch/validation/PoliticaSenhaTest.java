package com.gastromatch.validation;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

import com.gastromatch.exception.RequisicaoInvalidaException;

class PoliticaSenhaTest {

    @Test
    void rejeitaSenhaQueContemAParteLocalDoEmail() {
        assertThrows(RequisicaoInvalidaException.class, () ->
                PoliticaSenha.garantirSemCredenciais("Mariasilva#2025", "mariasilva@gastro.local", "outraconta"));
    }

    @Test
    void rejeitaSenhaQueContemOUsername() {
        assertThrows(RequisicaoInvalidaException.class, () ->
                PoliticaSenha.garantirSemCredenciais("Chefpaulo#2025", "paulo@gastro.local", "chefpaulo"));
    }

    @Test
    void rejeitaIgnorandoMaiusculaEMinuscula() {
        assertThrows(RequisicaoInvalidaException.class, () ->
                PoliticaSenha.garantirSemCredenciais("CHEFPAULO#2025", "paulo@gastro.local", "chefpaulo"));
    }

    @Test
    void aceitaSenhaSemRelacaoComEmailOuUsername() {
        assertDoesNotThrow(() ->
                PoliticaSenha.garantirSemCredenciais("Abacaxi#2025", "mariasilva@gastro.local", "chefpaulo"));
    }
}
