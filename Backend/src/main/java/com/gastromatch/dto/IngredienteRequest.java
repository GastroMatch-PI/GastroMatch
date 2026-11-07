package com.gastromatch.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** Dados do catálogo de ingredientes (criação e edição; ADMIN). Os valores são por porcaoBase. */
public record IngredienteRequest(
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
        String nome,

        @Positive(message = "Porção base deve ser maior que zero")
        float porcaoBase,

        @PositiveOrZero(message = "Calorias não pode ser negativo")
        float calorias,

        @PositiveOrZero(message = "Gordura não pode ser negativo")
        float gordura,

        @PositiveOrZero(message = "Proteína não pode ser negativo")
        float proteina,

        @PositiveOrZero(message = "Carboidrato não pode ser negativo")
        float carboidrato
) {
}
