package com.gastromatch.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Não tem foto: ela só entra quando existir o upload de imagens. */
public record ComentarioRequest(
        @NotBlank(message = "Escreva o comentário")
        @Size(max = 2000, message = "O comentário deve ter no máximo 2000 caracteres")
        String texto,

        // Opcional. De 0 a 5.
        @DecimalMin(value = "0.0", message = "A nota mínima é 0")
        @DecimalMax(value = "5.0", message = "A nota máxima é 5")
        Float nota
) {
}
