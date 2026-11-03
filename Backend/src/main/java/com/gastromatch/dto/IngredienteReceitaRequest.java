package com.gastromatch.dto;

import com.gastromatch.entity.enums.UnidadeMedida;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record IngredienteReceitaRequest(
        @NotNull(message = "Informe o ingrediente")
        Integer idIngrediente,

        @NotNull(message = "Informe a quantidade")
        @Positive(message = "A quantidade deve ser maior que zero")
        Float quantidade,

        @NotNull(message = "Informe a unidade de medida")
        UnidadeMedida unidadeMedida
) {
}
