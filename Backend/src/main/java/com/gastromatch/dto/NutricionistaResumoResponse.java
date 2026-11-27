package com.gastromatch.dto;

import com.gastromatch.entity.Nutricionista;
import com.gastromatch.entity.Usuario;

/** Nutricionista no diretório público. */
public record NutricionistaResumoResponse(
        Integer id,
        String username,
        String foto,
        String bio,
        String crn
) {
    /** {@code usuario} é a conta ligada ao perfil; pode ser nula (dados de exemplo sem conta). */
    public static NutricionistaResumoResponse de(Nutricionista n, Usuario usuario) {
        return new NutricionistaResumoResponse(
                n.getId(),
                usuario == null ? null : usuario.getUsername(),
                usuario == null ? null : usuario.getCapa(),
                n.getProfissional().getBio(), n.getCrn());
    }
}
