package com.gastromatch.dto;

import java.util.List;

import com.gastromatch.entity.enums.Dificuldade;
import com.gastromatch.entity.enums.MetodoPreparo;
import com.gastromatch.entity.enums.Ocasiao;
import com.gastromatch.entity.enums.PerfilAlimentar;
import com.gastromatch.entity.enums.TipoRefeicao;

/**
 * Filtros da listagem de receitas. Todos opcionais; os informados se combinam (E).
 *
 * @param texto        trecho do nome ou da descrição
 * @param tempoMax     tempo de preparo máximo, em minutos
 * @param ingredientes ids dos ingredientes que a pessoa TEM: só voltam receitas
 *                     feitas inteiramente com eles
 */
public record ReceitaFiltro(
        String texto,
        Integer tempoMax,
        Dificuldade dificuldade,
        TipoRefeicao tipo,
        Ocasiao ocasiao,
        PerfilAlimentar perfil,
        MetodoPreparo metodo,
        List<Integer> ingredientes
) {
}
