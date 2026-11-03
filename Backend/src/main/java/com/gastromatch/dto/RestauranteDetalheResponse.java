package com.gastromatch.dto;

import java.util.List;

/** Página pública do restaurante: dados do resumo mais os chefs que trabalham nele. */
public record RestauranteDetalheResponse(
        Integer id,
        String nome,
        String bio,
        Integer numero,
        String rua,
        String cep,
        String bairro,
        String cidade,
        String estado,
        Double latitude,
        Double longitude,
        List<ChefResumoResponse> chefs
) {
    public static RestauranteDetalheResponse de(RestauranteResumoResponse r, List<ChefResumoResponse> chefs) {
        return new RestauranteDetalheResponse(
                r.id(), r.nome(), r.bio(), r.numero(), r.rua(), r.cep(), r.bairro(), r.cidade(),
                r.estado(), r.latitude(), r.longitude(), chefs);
    }
}
