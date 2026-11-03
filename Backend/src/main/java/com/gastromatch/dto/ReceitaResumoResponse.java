package com.gastromatch.dto;

import com.gastromatch.entity.Receita;
import com.gastromatch.entity.enums.Dificuldade;
import com.gastromatch.entity.enums.MetodoPreparo;
import com.gastromatch.entity.enums.Ocasiao;
import com.gastromatch.entity.enums.PerfilAlimentar;
import com.gastromatch.entity.enums.TipoRefeicao;

/** Receita nas listagens: o suficiente para montar um card. */
public record ReceitaResumoResponse(
        Integer id,
        String nome,
        String descricao,
        String imagem,
        int tempoPreparo,
        int nPorcoes,
        Dificuldade dificuldade,
        TipoRefeicao tipo,
        MetodoPreparo metodoPreparo,
        Ocasiao ocasiao,
        PerfilAlimentar perfil,
        ChefResumoResponse chef
) {
    public static ReceitaResumoResponse de(Receita r, String usernameDoChef) {
        return new ReceitaResumoResponse(
                r.getId(), r.getNome(), r.getDescricao(), r.getImagem(),
                r.getTempoPreparo(), r.getNPorcoes(), r.getDificuldade(), r.getTipo(),
                r.getMetodoPreparo(), r.getOcasiao(), r.getPerfil(),
                ChefResumoResponse.de(r.getChef(), usernameDoChef));
    }
}
