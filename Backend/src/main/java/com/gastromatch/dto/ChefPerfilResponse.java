package com.gastromatch.dto;

import com.gastromatch.entity.Chef;
import com.gastromatch.entity.enums.Especializacao;

/** Chef no diretório público: quem é, no que é bom e onde trabalha. */
public record ChefPerfilResponse(
        Integer id,
        String username,
        String bio,
        Especializacao especializacao,
        Integer idRestaurante,
        String nomeRestaurante
) {
    public static ChefPerfilResponse de(Chef chef, String username) {
        var restaurante = chef.getRestaurante();
        return new ChefPerfilResponse(
                chef.getId(), username, chef.getProfissional().getBio(), chef.getEspecializacao(),
                restaurante == null ? null : restaurante.getId(),
                restaurante == null ? null : restaurante.getNome());
    }
}
