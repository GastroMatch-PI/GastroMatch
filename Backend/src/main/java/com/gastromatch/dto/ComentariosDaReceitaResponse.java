package com.gastromatch.dto;

/** Resposta de GET /receitas/{id}/comentarios: a página pedida e o agregado das notas. */
public record ComentariosDaReceitaResponse(
        PaginaResponse<ComentarioResponse> comentarios,
        AvaliacaoResponse avaliacao
) {
}
