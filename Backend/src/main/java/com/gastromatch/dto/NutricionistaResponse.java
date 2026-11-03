package com.gastromatch.dto;

import com.gastromatch.entity.Nutricionista;
import com.gastromatch.entity.enums.StatusVerificacao;

/** Perfil de nutricionista visto pela própria pessoa, com o andamento da verificação. */
public record NutricionistaResponse(
        Integer id,
        Integer idProfissional,
        String bio,
        String crn,
        StatusVerificacao statusVerificacao
) {
    public static NutricionistaResponse de(Nutricionista n) {
        return new NutricionistaResponse(
                n.getId(), n.getProfissional().getId(), n.getProfissional().getBio(),
                n.getCrn(), n.getStatusVerificacao());
    }
}
