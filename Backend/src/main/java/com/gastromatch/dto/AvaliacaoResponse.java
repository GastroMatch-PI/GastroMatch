package com.gastromatch.dto;

/**
 * Agregado dos comentários de uma receita: média das notas (ignora comentário sem nota) e
 * quantas notas entraram nela. media vem null quando nenhum comentário tem nota.
 */
public record AvaliacaoResponse(
        Float media,
        long quantidade
) {
    public static final AvaliacaoResponse SEM_AVALIACOES = new AvaliacaoResponse(null, 0);
}
