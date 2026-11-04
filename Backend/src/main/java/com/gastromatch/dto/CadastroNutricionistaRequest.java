package com.gastromatch.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Cadastro de nutricionista. O status NÃO vem daqui: o backend decide (nasce APROVADO).
 */
public record CadastroNutricionistaRequest(
        @Size(max = 500, message = "A bio deve ter no máximo 500 caracteres")
        String bio,

        @NotBlank(message = "Informe o CRN")
        @Size(max = 20, message = "O CRN deve ter no máximo 20 caracteres")
        String crn
) {
}
