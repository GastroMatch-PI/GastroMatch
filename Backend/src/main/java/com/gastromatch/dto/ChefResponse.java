package com.gastromatch.dto;

import com.gastromatch.entity.Chef;
import com.gastromatch.entity.enums.Especializacao;

public record ChefResponse(
        Integer id,
        Integer idProfissional,
        String bio,
        Especializacao especializacao,
        // Restaurante onde o chef trabalha; nulo se não trabalha em nenhum cadastrado.
        Integer idRestaurante
) {
    public static ChefResponse de(Chef chef) {
        var restaurante = chef.getRestaurante();
        return new ChefResponse(
                chef.getId(), chef.getProfissional().getId(),
                chef.getProfissional().getBio(), chef.getEspecializacao(),
                restaurante == null ? null : restaurante.getId());
    }
}
