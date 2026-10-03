package com.gastromatch.dto;

/**
 * Dados devolvidos ao cliente. Não tem password: é isso que impede o hash
 * de sair na resposta. Sem anotações de validação, porque é saída.
 */
public record UsuarioResponse(
        Long id,
        String email,
        String username,
        String capa
) { }