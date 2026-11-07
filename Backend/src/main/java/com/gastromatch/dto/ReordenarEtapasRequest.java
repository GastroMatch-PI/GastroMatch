package com.gastromatch.dto;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;

/** Nova sequência de etapas: a posição na lista define a nova ordem (1, 2, 3...). */
public record ReordenarEtapasRequest(
        @NotEmpty(message = "Informe a nova sequência de etapas")
        List<Integer> idsEtapas
) {
}
