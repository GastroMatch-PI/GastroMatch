package com.gastromatch.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ComentarioRequest(
        @NotBlank(message = "Escreva o comentário")
        @Size(max = 2000, message = "O comentário deve ter no máximo 2000 caracteres")
        String texto,

        // Opcional. De 0 a 5.
        @DecimalMin(value = "0.0", message = "A nota mínima é 0")
        @DecimalMax(value = "5.0", message = "A nota máxima é 5")
        Float nota,

        // Opcional. Link http(s) ou o caminho devolvido por POST /imagens.
        @Size(max = 500, message = "O link da foto deve ter no máximo 500 caracteres")
        @Pattern(regexp = ImagemLink.REGEX, message = ImagemLink.MENSAGEM)
        String foto
) {
}
