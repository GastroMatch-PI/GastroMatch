package com.gastromatch.dto;

import com.gastromatch.entity.Ingrediente;

/** Item do catálogo, com os valores nutricionais da porção base. */
public record IngredienteResponse(
        Integer id,
        String nome,
        float porcaoBase,
        float calorias,
        float gordura,
        float proteina,
        float carboidrato
) {
    public static IngredienteResponse de(Ingrediente i) {
        return new IngredienteResponse(
                i.getId(), i.getNome(), i.getPorcaoBase(), i.getCalorias(),
                i.getGordura(), i.getProteina(), i.getCarboidrato());
    }
}
