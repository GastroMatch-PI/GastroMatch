package com.gastromatch.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.gastromatch.dto.NutricaoResponse;
import com.gastromatch.entity.Ingrediente;
import com.gastromatch.entity.IngredienteReceita;
import com.gastromatch.entity.enums.UnidadeMedida;

class CalculoReceitaTest {

    // Valores por 100 g, como no catálogo: farinha de trigo.
    private static Ingrediente farinha() {
        Ingrediente i = new Ingrediente();
        i.setNome("Farinha de trigo");
        i.setPorcaoBase(100);
        i.setCalorias(360);
        i.setGordura(1.4f);
        i.setProteina(9.8f);
        i.setCarboidrato(75);
        return i;
    }

    private static IngredienteReceita item(Ingrediente ingrediente, float quantidade, UnidadeMedida unidade) {
        return new IngredienteReceita(null, ingrediente, quantidade, unidade);
    }

    @Test
    void ajustaQuantidadeProporcionalmente() {
        assertEquals(400f, CalculoReceita.ajustarQuantidade(200, 2, 4));
        assertEquals(100f, CalculoReceita.ajustarQuantidade(200, 2, 1));
        assertEquals(200f, CalculoReceita.ajustarQuantidade(200, 2, 2));
    }

    @Test
    void arredondaQuantidadeEmDuasCasas() {
        assertEquals(33.33f, CalculoReceita.ajustarQuantidade(100, 3, 1));
    }

    @Test
    void calculaNutricaoPelaPorcaoBase() {
        // 200 g de farinha = 2 x a porção base. Receita de 2 porções, pedida com 2.
        NutricaoResponse n = CalculoReceita.nutricao(
                List.of(item(farinha(), 200, UnidadeMedida.G)), 2, 2);

        assertEquals(720f, n.total().calorias());
        assertEquals(2.8f, n.total().gordura());
        assertEquals(19.6f, n.total().proteina());
        assertEquals(150f, n.total().carboidrato());
        assertEquals(360f, n.porPorcao().calorias());
        assertEquals(75f, n.porPorcao().carboidrato());
        assertTrue(n.completa());
        assertTrue(n.naoCalculados().isEmpty());
    }

    @Test
    void totalAcompanhaAsPorcoesEPorPorcaoNaoMuda() {
        NutricaoResponse n = CalculoReceita.nutricao(
                List.of(item(farinha(), 200, UnidadeMedida.G)), 2, 4);

        assertEquals(1440f, n.total().calorias());
        assertEquals(360f, n.porPorcao().calorias());
    }

    @Test
    void mililitrosTambemEntramNaConta() {
        NutricaoResponse n = CalculoReceita.nutricao(
                List.of(item(farinha(), 100, UnidadeMedida.ML)), 1, 1);

        assertEquals(360f, n.total().calorias());
        assertTrue(n.completa());
    }

    @Test
    void ingredienteEmXicaraOuUnidadeNaoEntraEViraAviso() {
        Ingrediente ovo = new Ingrediente();
        ovo.setNome("Ovo");
        ovo.setPorcaoBase(100);
        ovo.setCalorias(143);

        NutricaoResponse n = CalculoReceita.nutricao(
                List.of(item(farinha(), 100, UnidadeMedida.G), item(ovo, 2, UnidadeMedida.UNIDADE)), 1, 1);

        assertFalse(n.completa());
        assertEquals(List.of("Ovo"), n.naoCalculados());
        assertEquals(360f, n.total().calorias());
    }
}
