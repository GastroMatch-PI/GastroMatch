package com.gastromatch.dto;

import com.gastromatch.entity.Nutricionista;

/** Nutricionista no diretório público. */
public record NutricionistaResumoResponse(
        Integer id,
        String username,
        String bio,
        String crn
) {
    public static NutricionistaResumoResponse de(Nutricionista n, String username) {
        return new NutricionistaResumoResponse(
                n.getId(), username, n.getProfissional().getBio(), n.getCrn());
    }
}
