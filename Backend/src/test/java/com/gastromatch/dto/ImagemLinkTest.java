package com.gastromatch.dto;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

/** O campo foto do comentário aceita link http(s) ou o caminho de uma imagem enviada, e nada além. */
class ImagemLinkTest {

    private static ValidatorFactory fabrica;
    private static Validator validador;

    @BeforeAll
    static void criar() {
        fabrica = Validation.buildDefaultValidatorFactory();
        validador = fabrica.getValidator();
    }

    @AfterAll
    static void fechar() {
        fabrica.close();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "https://images.unsplash.com/photo-1.jpg",
            "http://exemplo.com/a.png",
            "/imagens/0123456789abcdef0123456789abcdef.png",
            "/imagens/0123456789abcdef0123456789abcdef.jpg",
            "/imagens/0123456789abcdef0123456789abcdef.webp"
    })
    void aceita(String foto) {
        assertTrue(validador.validate(new ComentarioRequest("Bom", 5f, foto)).isEmpty(), foto);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "javascript:alert(1)",
            "ftp://exemplo.com/a.png",
            "/imagens/../../etc/passwd",
            "/imagens/curto.png",
            "/imagens/0123456789abcdef0123456789abcdef.gif",
            "/outra/0123456789abcdef0123456789abcdef.png",
            "https://exemplo.com/com espaco.png"
    })
    void rejeita(String foto) {
        assertEquals(1, validador.validate(new ComentarioRequest("Bom", 5f, foto)).size(), foto);
    }

    @ParameterizedTest
    @ValueSource(strings = {"/imagens/0123456789abcdef0123456789abcdef.png", "https://exemplo.com/a.png"})
    void receitaEEtapaUsamAMesmaRegra(String imagem) {
        var etapa = new EtapaRequest(null, "Passo", "Misture bem", null, imagem);
        assertTrue(validador.validate(etapa).isEmpty(), imagem);
    }
}
