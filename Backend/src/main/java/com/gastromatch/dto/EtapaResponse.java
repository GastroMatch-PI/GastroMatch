package com.gastromatch.dto;

import java.util.List;

import com.gastromatch.entity.EtapaReceita;

public record EtapaResponse(
        Integer id,
        int ordem,
        String titulo,
        String instrucao,
        Integer timestampVideo,
        String imagem,
        List<DicaResponse> dicas
) {
    public static EtapaResponse de(EtapaReceita e, List<DicaResponse> dicas) {
        return new EtapaResponse(
                e.getId(), e.getOrdem(), e.getTitulo(), e.getInstrucao(),
                e.getTimestampVideo(), e.getImagem(), dicas);
    }
}
