package com.gastromatch.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.gastromatch.service.ArmazenamentoLocal;
import com.gastromatch.service.ArmazenamentoService;
import com.gastromatch.service.ArmazenamentoSupabase;

/** Escolhe onde as imagens ficam: Supabase Storage se SUPABASE_URL estiver definida, senão o disco. */
@Configuration
public class ArmazenamentoConfig {

    @Bean
    public ArmazenamentoService armazenamento(
            @Value("${app.supabase.url:}") String supabaseUrl,
            @Value("${app.supabase.key:}") String supabaseChave,
            @Value("${app.supabase.bucket:imagens}") String bucket,
            @Value("${app.uploads.dir:uploads}") String pasta) {
        if (supabaseUrl.isBlank()) {
            return new ArmazenamentoLocal(pasta);
        }
        if (supabaseChave.isBlank()) {
            throw new IllegalStateException("SUPABASE_URL está definida, mas falta a SUPABASE_SERVICE_KEY");
        }
        return new ArmazenamentoSupabase(supabaseUrl, supabaseChave, bucket);
    }
}
