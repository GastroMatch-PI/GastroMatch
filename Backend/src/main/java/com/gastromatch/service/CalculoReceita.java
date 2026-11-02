package com.gastromatch.service;

import java.util.ArrayList;
import java.util.List;

import com.gastromatch.dto.NutricaoResponse;
import com.gastromatch.dto.ValoresNutricionais;
import com.gastromatch.entity.IngredienteReceita;
import com.gastromatch.entity.enums.UnidadeMedida;

/** Contas da receita: ajuste de porções e tabela nutricional. Sem banco, só matemática. */
public final class CalculoReceita {

    private CalculoReceita() {
    }

    /** Recalcula a quantidade para outro número de porções, proporcionalmente (2 casas). */
    public static float ajustarQuantidade(float quantidade, int porcoesDaReceita, int porcoesDesejadas) {
        double ajustada = (double) quantidade * porcoesDesejadas / porcoesDaReceita;
        return arredondar(ajustada, 2);
    }

    /**
     * Valores nutricionais: para cada ingrediente, (quantidade / porcaoBase) x valor da porção base.
     * O total vale para "porcoesDesejadas"; o valor por porção é o mesmo em qualquer número de porções.
     */
    public static NutricaoResponse nutricao(List<IngredienteReceita> itens, int porcoesDaReceita,
                                            int porcoesDesejadas) {
        double calorias = 0, gordura = 0, proteina = 0, carboidrato = 0;
        List<String> naoCalculados = new ArrayList<>();

        for (IngredienteReceita item : itens) {
            UnidadeMedida unidade = item.getUnidadeMedida();
            if (unidade != UnidadeMedida.G && unidade != UnidadeMedida.ML) {
                naoCalculados.add(item.getIngrediente().getNome());
                continue;
            }
            double fator = (double) item.getQuantidade() / item.getIngrediente().getPorcaoBase();
            calorias += fator * item.getIngrediente().getCalorias();
            gordura += fator * item.getIngrediente().getGordura();
            proteina += fator * item.getIngrediente().getProteina();
            carboidrato += fator * item.getIngrediente().getCarboidrato();
        }

        // Somamos a receita na quantidade original; dividir pelas porções dela dá o valor de UMA porção.
        ValoresNutricionais porPorcao = valores(
                calorias / porcoesDaReceita, gordura / porcoesDaReceita,
                proteina / porcoesDaReceita, carboidrato / porcoesDaReceita);
        ValoresNutricionais total = valores(
                calorias / porcoesDaReceita * porcoesDesejadas, gordura / porcoesDaReceita * porcoesDesejadas,
                proteina / porcoesDaReceita * porcoesDesejadas, carboidrato / porcoesDaReceita * porcoesDesejadas);

        return new NutricaoResponse(total, porPorcao, naoCalculados.isEmpty(), naoCalculados);
    }

    private static ValoresNutricionais valores(double calorias, double gordura, double proteina, double carboidrato) {
        return new ValoresNutricionais(
                arredondar(calorias, 1), arredondar(gordura, 1),
                arredondar(proteina, 1), arredondar(carboidrato, 1));
    }

    private static float arredondar(double valor, int casas) {
        double escala = Math.pow(10, casas);
        return (float) (Math.round(valor * escala) / escala);
    }
}
