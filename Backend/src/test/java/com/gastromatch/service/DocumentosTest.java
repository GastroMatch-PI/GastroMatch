package com.gastromatch.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

import com.gastromatch.exception.RequisicaoInvalidaException;

class DocumentosTest {

    @Test
    void cnpjSemMascaraFicaComMascara() {
        assertEquals("11.222.333/0001-81", Documentos.normalizarCnpj("11222333000181"));
    }

    @Test
    void cnpjComMascaraContinuaIgual() {
        assertEquals("11.222.333/0001-81", Documentos.normalizarCnpj(" 11.222.333/0001-81 "));
    }

    @Test
    void cnpjComDigitoVerificadorErradoEInvalido() {
        assertThrows(RequisicaoInvalidaException.class, () -> Documentos.normalizarCnpj("11222333000182"));
        assertThrows(RequisicaoInvalidaException.class, () -> Documentos.normalizarCnpj("11222333000191"));
    }

    @Test
    void cnpjComTamanhoErradoOuRepetidoEInvalido() {
        assertThrows(RequisicaoInvalidaException.class, () -> Documentos.normalizarCnpj("1122233300018"));
        assertThrows(RequisicaoInvalidaException.class, () -> Documentos.normalizarCnpj("11111111111111"));
        assertThrows(RequisicaoInvalidaException.class, () -> Documentos.normalizarCnpj("abc"));
        assertThrows(RequisicaoInvalidaException.class, () -> Documentos.normalizarCnpj(null));
    }

    @Test
    void crnFicaEmMaiusculasESemEspacosRepetidos() {
        assertEquals("CRN-3/12345", Documentos.normalizarCrn("  crn-3/12345 "));
        assertEquals("CRN 3 12345", Documentos.normalizarCrn("crn   3  12345"));
    }

    @Test
    void crnSemNumeroOuCurtoDemaisEInvalido() {
        assertThrows(RequisicaoInvalidaException.class, () -> Documentos.normalizarCrn("CRN"));
        assertThrows(RequisicaoInvalidaException.class, () -> Documentos.normalizarCrn("ab"));
        assertThrows(RequisicaoInvalidaException.class, () -> Documentos.normalizarCrn(null));
    }

    @Test
    void cepGanhaTracoEBrancoViraNulo() {
        assertEquals("01310-100", Documentos.normalizarCep("01310100"));
        assertEquals("01310-100", Documentos.normalizarCep("01310-100"));
        assertNull(Documentos.normalizarCep("  "));
        assertNull(Documentos.normalizarCep(null));
    }

    @Test
    void cepInvalidoEhRecusado() {
        assertThrows(RequisicaoInvalidaException.class, () -> Documentos.normalizarCep("1234"));
    }
}
