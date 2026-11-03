package com.gastromatch.dto;

import com.gastromatch.entity.Chef;
import com.gastromatch.entity.enums.Especializacao;

public record ChefResponse(
        Integer id,
        Integer idProfissional,
        String bio,
        Especializacao especializacao
) {
    public static ChefResponse de(Chef chef) {
        return new ChefResponse(
                chef.getId(), chef.getProfissional().getId(),
                chef.getProfissional().getBio(), chef.getEspecializacao());
    }
}
