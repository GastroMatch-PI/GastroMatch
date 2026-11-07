package com.gastromatch.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import com.gastromatch.entity.RefreshToken;
import com.gastromatch.entity.Usuario;

/**
 * Único teste do projeto que precisa de um Postgres de verdade além do ApplicationTests
 * (não dá para simular LIMIT dentro de uma subconsulta com mocks). Replace.NONE porque o
 * projeto não tem (nem precisa de) um banco embarcado: usa o mesmo Postgres configurado
 * em DB_URL/DB_USERNAME/DB_PASSWORD (local via Docker ou o serviço do CI).
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class RefreshTokenRepositoryTest {

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    private Usuario usuario;

    @BeforeEach
    void criarUsuario() {
        String sufixo = UUID.randomUUID().toString().substring(0, 8);
        Usuario novo = new Usuario();
        novo.setEmail("limpeza-" + sufixo + "@gastro.local");
        novo.setUsername("limpeza" + sufixo);
        novo.setPassword("hash-qualquer");
        usuario = usuarioRepository.save(novo);
    }

    @Test
    void apagaSoTokensExpiradosAntesDoLimite() {
        Instant agora = Instant.now();
        RefreshToken vencidoHaMuito = salvar("hash-vencido-muito-" + UUID.randomUUID(), agora.minus(Duration.ofDays(10)));
        RefreshToken vencidoRecente = salvar("hash-vencido-recente-" + UUID.randomUUID(), agora.minus(Duration.ofDays(2)));
        RefreshToken aindaValido = salvar("hash-valido-" + UUID.randomUUID(), agora.plus(Duration.ofDays(3)));

        int removidos = refreshTokenRepository.apagarLoteExpiradosAntesDe(
                agora.minus(Duration.ofDays(7)), 500);

        assertEquals(1, removidos);
        assertTrue(refreshTokenRepository.findById(vencidoHaMuito.getId()).isEmpty());
        assertTrue(refreshTokenRepository.findById(vencidoRecente.getId()).isPresent());
        assertTrue(refreshTokenRepository.findById(aindaValido.getId()).isPresent());
    }

    @Test
    void respeitaOTamanhoDoLotePedido() {
        Instant vencidoDesde = Instant.now().minus(Duration.ofDays(10));
        for (int i = 0; i < 5; i++) {
            salvar("hash-lote-" + i + "-" + UUID.randomUUID(), vencidoDesde);
        }

        int removidos = refreshTokenRepository.apagarLoteExpiradosAntesDe(vencidoDesde.plusSeconds(1), 3);

        assertEquals(3, removidos);
    }

    private RefreshToken salvar(String tokenHash, Instant expiraEm) {
        return refreshTokenRepository.save(new RefreshToken(tokenHash, usuario, expiraEm));
    }
}
