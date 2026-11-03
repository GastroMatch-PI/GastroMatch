package com.gastromatch.repository;

import java.text.Normalizer;
import java.util.Locale;

/**
 * Prepara o texto digitado pela pessoa para a busca "contém", sem diferenciar
 * maiúscula nem acento ("acucar" acha "Açúcar").
 *
 * O lado do banco aplica unaccent(lower(coluna)) (extensão unaccent do PostgreSQL,
 * criada no SQL do projeto). Aqui preparamos o outro lado da comparação.
 */
public final class BuscaTexto {

    private BuscaTexto() {
    }

    /** Padrão para LIKE com escape '\': minúsculo, sem acento, e % _ \ valendo como texto comum. */
    public static String padraoContem(String texto) {
        String limpo = semAcento(texto.trim().toLowerCase(Locale.ROOT));
        String escapado = limpo.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return "%" + escapado + "%";
    }

    // "ç" vira "c" e "é" vira "e": separa a letra do acento (NFD) e descarta o acento.
    private static String semAcento(String texto) {
        return Normalizer.normalize(texto, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    }
}
