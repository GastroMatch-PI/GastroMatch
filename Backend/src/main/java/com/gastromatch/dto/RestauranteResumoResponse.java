package com.gastromatch.dto;

import com.gastromatch.entity.Restaurante;

/** Restaurante no diretório e no mapa: endereço e coordenadas, sem o CNPJ. */
public record RestauranteResumoResponse(
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
        Double longitude
) {
    public static RestauranteResumoResponse de(Restaurante r) {
        return new RestauranteResumoResponse(
                r.getId(), r.getNome(), r.getBio(), r.getNumero(), r.getRua(), r.getCep(),
                r.getBairro(), r.getCidade(), r.getEstado(), r.getLatitude(), r.getLongitude());
    }
}
