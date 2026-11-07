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
        // Porções que a receita rende como foi cadastrada.
        int nPorcoes,
        // Porções para as quais as quantidades e a nutrição abaixo foram calculadas
        // (igual a nPorcoes, a não ser que se peça ?porcoes=N).
        int porcoes,
        Dificuldade dificuldade,
        TipoRefeicao tipo,
        MetodoPreparo metodoPreparo,
        Ocasiao ocasiao,
        PerfilAlimentar perfil,
        ChefResumoResponse chef,
        List<IngredienteDaReceitaResponse> ingredientes,
        NutricaoResponse nutricao,
        List<EtapaResponse> etapas,
        // Nota média e quantidade de avaliações, para o cabeçalho da página da receita.
        AvaliacaoResponse avaliacao
) {
    public static ReceitaDetalheResponse de(Receita r, int porcoes, String usernameDoChef,
                                            List<IngredienteDaReceitaResponse> ingredientes,
                                            NutricaoResponse nutricao,
                                            List<EtapaResponse> etapas,
                                            AvaliacaoResponse avaliacao) {
        return new ReceitaDetalheResponse(
                r.getId(), r.getNome(), r.getDescricao(), r.getImagem(), r.getVideoUrl(),
                r.getTempoPreparo(), r.getNPorcoes(), porcoes, r.getDificuldade(), r.getTipo(),
                r.getMetodoPreparo(), r.getOcasiao(), r.getPerfil(),
                ChefResumoResponse.de(r.getChef(), usernameDoChef), ingredientes, nutricao, etapas, avaliacao);
    }
}
