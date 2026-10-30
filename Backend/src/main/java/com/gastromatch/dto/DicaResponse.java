package com.gastromatch.dto;

import com.gastromatch.entity.Dica;
import com.gastromatch.entity.enums.TipoDica;

public record DicaResponse(
        Integer id,
        TipoDica tipo,
        String conteudo,
        Integer idChef
) {
    public static DicaResponse de(Dica d) {
        return new DicaResponse(d.getId(), d.getTipo(), d.getConteudo(), d.getChef().getId());
    }
}
