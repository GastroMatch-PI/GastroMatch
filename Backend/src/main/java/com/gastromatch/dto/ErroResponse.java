package com.gastromatch.dto;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Formato padrão de erro da API. "erros" só aparece em falhas de validação. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErroResponse(
        int status,
        String mensagem,
        Map<String, String> erros
) {
    public ErroResponse(int status, String mensagem) {
        this(status, mensagem, null);
    }
}
