package com.gastromatch.dto;

import java.util.List;

import com.gastromatch.entity.Receita;
import com.gastromatch.entity.enums.Dificuldade;
import com.gastromatch.entity.enums.MetodoPreparo;
import com.gastromatch.entity.enums.Ocasiao;
import com.gastromatch.entity.enums.PerfilAlimentar;
import com.gastromatch.entity.enums.TipoRefeicao;

/** Receita completa: ingredientes, etapas e as dicas de cada etapa. */
public record ReceitaDetalheResponse(
        Integer id,
        String nome,
        String descricao,
        String imagem,
        String videoUrl,
        int tempoPreparo,
        int nPorcoes,
        Dificuldade dificuldade,
        TipoRefeicao tipo,
        MetodoPreparo metodoPreparo,
        Ocasiao ocasiao,
        PerfilAlimentar perfil,
        ChefResumoResponse chef,
        List<IngredienteDaReceitaResponse> ingredientes,
        List<EtapaResponse> etapas
) {
    public static ReceitaDetalheResponse de(Receita r, String usernameDoChef,
                                            List<IngredienteDaReceitaResponse> ingredientes,
                                            List<EtapaResponse> etapas) {
        return new ReceitaDetalheResponse(
                r.getId(), r.getNome(), r.getDescricao(), r.getImagem(), r.getVideoUrl(),
                r.getTempoPreparo(), r.getNPorcoes(), r.getDificuldade(), r.getTipo(),
                r.getMetodoPreparo(), r.getOcasiao(), r.getPerfil(),
                ChefResumoResponse.de(r.getChef(), usernameDoChef), ingredientes, etapas);
    }
}
