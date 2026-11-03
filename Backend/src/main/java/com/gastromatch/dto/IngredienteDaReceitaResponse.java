package com.gastromatch.dto;

import com.gastromatch.entity.IngredienteReceita;
import com.gastromatch.entity.enums.UnidadeMedida;

/** Ingrediente dentro de uma receita: qual é e quanto leva. */
public record IngredienteDaReceitaResponse(
        Integer idIngrediente,
        String nome,
        float quantidade,
        UnidadeMedida unidadeMedida
) {
    /** "quantidade" já vem ajustada ao número de porções pedido. */
    public static IngredienteDaReceitaResponse de(IngredienteReceita ir, float quantidade) {
        return new IngredienteDaReceitaResponse(
                ir.getIngrediente().getId(), ir.getIngrediente().getNome(),
                quantidade, ir.getUnidadeMedida());
    }
}
