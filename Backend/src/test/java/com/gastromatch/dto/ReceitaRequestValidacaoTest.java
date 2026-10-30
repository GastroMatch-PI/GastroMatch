package com.gastromatch.dto;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import com.gastromatch.entity.enums.Dificuldade;
import com.gastromatch.entity.enums.TipoRefeicao;
import com.gastromatch.entity.enums.UnidadeMedida;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

/** Regras de validação do corpo de criação de receita, em especial o link do YouTube. */
class ReceitaRequestValidacaoTest {

    private static ValidatorFactory fabrica;
    private static Validator validador;

    @BeforeAll
    static void criarValidador() {
        fabrica = Validation.buildDefaultValidatorFactory();
        validador = fabrica.getValidator();
    }

    @AfterAll
    static void fecharFabrica() {
        fabrica.close();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "https://youtube.com/watch?v=dQw4w9WgXcQ&t=30s",
            "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
            "https://youtu.be/dQw4w9WgXcQ",
            "https://youtu.be/dQw4w9WgXcQ?t=42",
            "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "https://www.youtube.com/shorts/dQw4w9WgXcQ"
    })
    void aceitaLinksDoYouTube(String url) {
        assertTrue(erros(receitaComVideo(url)).isEmpty(), url);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "http://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "https://youtube.com.golpe.com/watch?v=dQw4w9WgXcQ",
            "https://golpe.com/youtube.com/watch?v=dQw4w9WgXcQ",
            "https://www.youtube.com@golpe.com/watch?v=dQw4w9WgXcQ",
            "https://vimeo.com/123456789",
            "https://www.youtube.com/watch?v=curto",
            "https://www.youtube.com/",
            "javascript:alert(1)",
            "dQw4w9WgXcQ"
    })
    void recusaLinksQueNaoSaoDoYouTube(String url) {
        assertEquals(1, erros(receitaComVideo(url)).size(), url);
    }

    @Test
    void videoEOpcional() {
        assertTrue(erros(receitaComVideo(null)).isEmpty());
    }

    @Test
    void recusaImagemQueNaoSejaLinkHttp() {
        var receita = new ReceitaRequest("Bolo", null, "javascript:alert(1)", null, 2, Dificuldade.FACIL,
                TipoRefeicao.LANCHE, null, null, 10, null, ingredientes());
        assertEquals(1, erros(receita).size());
    }

    @Test
    void exigeCamposObrigatorios() {
        var vazia = new ReceitaRequest(null, null, null, null, null, null, null, null, null, null, null, null);
        // nome, nPorcoes, dificuldade, tipo, tempoPreparo, ingredientes
        assertEquals(6, erros(vazia).size());
    }

    @Test
    void recusaQuantidadeZeroENumeroDePorcoesZero() {
        var ruim = new ReceitaRequest("Bolo", null, null, null, 0, Dificuldade.FACIL, TipoRefeicao.LANCHE,
                null, null, 10, null,
                List.of(new IngredienteReceitaRequest(1, 0f, UnidadeMedida.G)));
        assertEquals(2, erros(ruim).size());
    }

    private static ReceitaRequest receitaComVideo(String url) {
        return new ReceitaRequest("Bolo", null, null, url, 2, Dificuldade.FACIL, TipoRefeicao.LANCHE,
                null, null, 10, null, ingredientes());
    }

    private static List<IngredienteReceitaRequest> ingredientes() {
        return List.of(new IngredienteReceitaRequest(1, 100f, UnidadeMedida.G));
    }

    private static Set<ConstraintViolation<ReceitaRequest>> erros(ReceitaRequest r) {
        return validador.validate(r);
    }
}
