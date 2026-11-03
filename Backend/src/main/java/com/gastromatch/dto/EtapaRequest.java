package com.gastromatch.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EtapaRequest(
        // Opcional: sem ordem, a etapa entra no fim da receita.
        @Min(value = 1, message = "A ordem começa em 1")
        Integer ordem,

        @NotBlank(message = "Informe o título")
        @Size(max = 150, message = "O título deve ter no máximo 150 caracteres")
        String titulo,

        @NotBlank(message = "Informe a instrução")
        @Size(max = 2000, message = "A instrução deve ter no máximo 2000 caracteres")
        String instrucao,

        // Segundo do vídeo da receita em que esta etapa começa.
        @Min(value = 0, message = "O momento do vídeo não pode ser negativo")
        Integer timestampVideo,

        @Size(max = 500, message = "O link da imagem deve ter no máximo 500 caracteres")
        @Pattern(regexp = "^https?://\\S+$", message = "A imagem deve ser um link http ou https")
        String imagem
) {
}
