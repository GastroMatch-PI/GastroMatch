package com.gastromatch.config;

import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

import com.gastromatch.service.ArmazenamentoLocal;
import com.gastromatch.service.ArmazenamentoSupabase;

/** Sem SUPABASE_URL as imagens ficam no disco; com ela, no Supabase (e a chave passa a ser obrigatória). */
class ArmazenamentoConfigTest {

    private final ArmazenamentoConfig config = new ArmazenamentoConfig();

    @Test
    void semSupabaseUsaODisco() {
        assertInstanceOf(ArmazenamentoLocal.class, config.armazenamento("", "", "imagens", "uploads"));
    }

    @Test
    void comSupabaseUsaOSupabase() {
        assertInstanceOf(ArmazenamentoSupabase.class,
                config.armazenamento("https://x.supabase.co", "sb_secret_k", "imagens", "uploads"));
    }

    @Test
    void urlSemChaveNaoSobe() {
        assertThrows(IllegalStateException.class,
                () -> config.armazenamento("https://x.supabase.co", "", "imagens", "uploads"));
    }
}
