package com.gastromatch.dto;

import com.gastromatch.entity.enums.TipoDica;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DicaRequest(
        @NotNull(message = "Informe o tipo (DICA ou ERRO_COMUM)")
        TipoDica tipo,

        @NotBlank(message = "Informe o conteúdo")
        @Size(max = 1000, message = "O conteúdo deve ter no máximo 1000 caracteres")
        String conteudo
) {
}
