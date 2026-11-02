package com.gastromatch.dto;

import java.util.List;

/**
 * Tabela nutricional calculada a partir dos ingredientes da receita.
 *
 * Só entram ingredientes em gramas (G) ou mililitros (ML), porque a porção base do
 * catálogo é em g/ml. Ingredientes em UNIDADE ou XICARA não têm como ser convertidos
 * (não sabemos quanto pesa uma xícara de cada coisa): ficam em "naoCalculados" e
 * "completa" vira false. O front deve avisar que o valor é aproximado.
 *
 * @param total      valores da receita inteira, para o número de porções pedido
 * @param porPorcao  valores de uma porção (não muda quando se ajustam as porções)
 */
public record NutricaoResponse(
        ValoresNutricionais total,
        ValoresNutricionais porPorcao,
        boolean completa,
        List<String> naoCalculados
) {
}
