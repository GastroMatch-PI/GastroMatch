package com.gastromatch.dto;

import com.gastromatch.entity.Chef;
import com.gastromatch.entity.enums.Especializacao;

/** Autor da receita. "username" é o da conta ligada ao perfil (pode faltar em dados de exemplo). */
public record ChefResumoResponse(
        Integer id,
        String username,
        Especializacao especializacao
) {
    public static ChefResumoResponse de(Chef chef, String username) {
        return new ChefResumoResponse(chef.getId(), username, chef.getEspecializacao());
    }
}
