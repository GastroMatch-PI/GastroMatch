package com.gastromatch.service;

import java.time.Duration;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.gastromatch.repository.RefreshTokenRepository;

/**
 * Limpeza diária dos refresh tokens expirados há mais de app.cleanup.retencao-dias (B25).
 * Só existe a tabela refresh_token hoje: password_reset_token e email_verification_token
 * (citadas na issue original) ainda não existem no esquema, então não entram aqui.
 */
@Component
public class LimpezaTokensExpiradosJob {

    private static final Logger LOG = LoggerFactory.getLogger(LimpezaTokensExpiradosJob.class);

    // Lotes pequenos para não travar a tabela com um DELETE gigante de uma vez.
    static final int TAMANHO_DO_LOTE = 500;

    private final RefreshTokenRepository refreshTokenRepository;
    private final Duration retencao;
    private final boolean habilitado;

    public LimpezaTokensExpiradosJob(RefreshTokenRepository refreshTokenRepository,
                                     @Value("${app.cleanup.retencao-dias:7}") long retencaoDias,
                                     @Value("${app.cleanup.enabled:true}") boolean habilitado) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.retencao = Duration.ofDays(retencaoDias);
        this.habilitado = habilitado;
    }

    // Horário fixo de madrugada por padrão; configurável para quem preferir outro.
    @Scheduled(cron = "${app.cleanup.cron:0 0 3 * * *}")
    public void limpar() {
        if (!habilitado) {
            return;
        }
        int totalRemovido = removerExpirados(Instant.now().minus(retencao));
        if (totalRemovido > 0) {
            // Só a quantidade: nada que identifique usuário ou token vai para o log.
            LOG.info("Limpeza de refresh tokens expirados: {} removido(s)", totalRemovido);
        }
    }

    @Transactional
    int removerExpirados(Instant limite) {
        int totalRemovido = 0;
        int removidoNesteLote;
        do {
            removidoNesteLote = refreshTokenRepository.apagarLoteExpiradosAntesDe(limite, TAMANHO_DO_LOTE);
            totalRemovido += removidoNesteLote;
        } while (removidoNesteLote == TAMANHO_DO_LOTE);
        return totalRemovido;
    }
}
