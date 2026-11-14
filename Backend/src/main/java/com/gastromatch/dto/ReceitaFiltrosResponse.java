package com.gastromatch.dto;

import java.util.List;

import com.gastromatch.entity.enums.Dificuldade;
import com.gastromatch.entity.enums.MetodoPreparo;
import com.gastromatch.entity.enums.Ocasiao;
import com.gastromatch.entity.enums.PerfilAlimentar;
import com.gastromatch.entity.enums.TipoRefeicao;

public record ReceitaFiltrosResponse(
        List<TipoRefeicao> tipos,
        List<MetodoPreparo> metodos,
        List<Ocasiao> ocasioes,
        List<PerfilAlimentar> perfis,
        List<Dificuldade> dificuldades,
        Integer tempoMinimo,
        Integer tempoMaximo
) {}