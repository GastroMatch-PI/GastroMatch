package com.gastromatch.dto;

/** Calorias (kcal) e macronutrientes (g) de uma quantidade de comida. */
public record ValoresNutricionais(
        float calorias,
        float gordura,
        float proteina,
        float carboidrato
) {
}
