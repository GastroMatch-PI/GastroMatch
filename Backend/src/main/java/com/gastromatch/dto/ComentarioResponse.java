package com.gastromatch.dto;

import java.time.Instant;

import com.gastromatch.entity.Comentario;

public record ComentarioResponse(
        Integer id,
        Integer idReceita,
        Integer idUsuario,
        String username,
        // Capa (avatar) do autor do comentário, não da receita.
        String capaAutor,
        String texto,
        Float nota,
        String foto,
        Instant criadoEm,
        Instant atualizadoEm
) {
    public static ComentarioResponse de(Comentario c) {
        return new ComentarioResponse(
                c.getId(), c.getReceita().getId(), c.getUsuario().getId(), c.getUsuario().getUsername(),
                c.getUsuario().getCapa(), c.getTexto(), c.getNota(), c.getFoto(),
                c.getCriadoEm(), c.getAtualizadoEm());
    }
}
