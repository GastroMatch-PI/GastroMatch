package com.gastromatch.dto;

import com.gastromatch.entity.Restaurante;

/** Restaurante visto pelo próprio dono (inclui o CNPJ, que não aparece no diretório público). */
public record RestauranteResponse(
        Integer id,
        Integer idProfissional,
        String cnpj,
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
    public static RestauranteResponse de(Restaurante r) {
        return new RestauranteResponse(
                r.getId(), r.getProfissional().getId(), r.getCnpj(), r.getNome(), r.getBio(),
                r.getNumero(), r.getRua(), r.getCep(), r.getBairro(), r.getCidade(), r.getEstado(),
                r.getLatitude(), r.getLongitude());
    }
}
