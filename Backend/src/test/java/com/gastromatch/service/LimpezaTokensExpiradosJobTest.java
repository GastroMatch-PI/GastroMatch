package com.gastromatch.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.gastromatch.repository.RefreshTokenRepository;

/**
 * Sem banco: RefreshTokenRepository é mock. O que se testa aqui é a orquestração (laço de
 * lotes, acumulado, flag de habilitado); a consulta nativa em si (apagarLoteExpiradosAntesDe)
 * só dá para provar com um Postgres de verdade — ver RefreshTokenRepositoryTest.
 */
@ExtendWith(MockitoExtension.class)
class LimpezaTokensExpiradosJobTest {

    @Mock RefreshTokenRepository refreshTokenRepository;

    @Test
    void paraDeApagarQuandoUmLoteVemMenorQueOTamanhoMaximo() {
        LimpezaTokensExpiradosJob job = new LimpezaTokensExpiradosJob(refreshTokenRepository, 7, true);
        when(refreshTokenRepository.apagarLoteExpiradosAntesDe(any(), anyInt()))
                .thenReturn(LimpezaTokensExpiradosJob.TAMANHO_DO_LOTE, LimpezaTokensExpiradosJob.TAMANHO_DO_LOTE, 37);

        int total = job.removerExpirados(Instant.now());

        assertEquals(2 * LimpezaTokensExpiradosJob.TAMANHO_DO_LOTE + 37, total);
        verify(refreshTokenRepository, times(3)).apagarLoteExpiradosAntesDe(any(), anyInt());
    }

    @Test
    void semTokensExpiradosApagaZeroEParaNaPrimeiraVolta() {
        LimpezaTokensExpiradosJob job = new LimpezaTokensExpiradosJob(refreshTokenRepository, 7, true);
        when(refreshTokenRepository.apagarLoteExpiradosAntesDe(any(), anyInt())).thenReturn(0);

        int total = job.removerExpirados(Instant.now());

        assertEquals(0, total);
        verify(refreshTokenRepository, times(1)).apagarLoteExpiradosAntesDe(any(), anyInt());
    }

    @Test
    void jobDesligadoNaoChamaORepositorio() {
        LimpezaTokensExpiradosJob job = new LimpezaTokensExpiradosJob(refreshTokenRepository, 7, false);

        job.limpar();

        verify(refreshTokenRepository, never()).apagarLoteExpiradosAntesDe(any(), anyInt());
    }

    @Test
    void jobLigadoChamaORepositorioComOLimiteCorreto() {
        LimpezaTokensExpiradosJob job = new LimpezaTokensExpiradosJob(refreshTokenRepository, 7, true);
        when(refreshTokenRepository.apagarLoteExpiradosAntesDe(any(), anyInt())).thenReturn(0);

        Instant antes = Instant.now().minusSeconds(7 * 24 * 3600 + 5);
        job.limpar();

        verify(refreshTokenRepository).apagarLoteExpiradosAntesDe(
                argThat((Instant limite) -> limite.isAfter(antes)), eq(LimpezaTokensExpiradosJob.TAMANHO_DO_LOTE));
    }
}
