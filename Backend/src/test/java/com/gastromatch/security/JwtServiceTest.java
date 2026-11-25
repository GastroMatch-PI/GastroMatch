package com.gastromatch.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

import javax.crypto.SecretKey;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.gastromatch.entity.Usuario;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/**
 * Em vez de esperar o tempo real passar, cada teste de expiração constrói o próprio JWT
 * com um instante fixo (issuedAt/expiration explícitos), assinado com a mesma chave que o
 * JwtService usaria para o mesmo segredo — é o "relógio fixo" sem precisar de Thread.sleep
 * nem de injetar um java.time.Clock que mais nenhuma outra classe do projeto usa.
 */
class JwtServiceTest {

    private static final String SEGREDO = "segredo-de-teste-com-mais-de-32-caracteres-ok";

    private final JwtService jwtService = new JwtService(SEGREDO, 15);

    private static Usuario usuarioComId(int id) {
        Usuario usuario = new Usuario();
        ReflectionTestUtils.setField(usuario, "id", id);
        usuario.setEmail("maria@gastro.local");
        return usuario;
    }

    @Test
    void segredoComMenosDe32CaracteresNaoInicializa() {
        assertThrows(IllegalStateException.class, () -> new JwtService("curto-demais", 15));
    }

    @Test
    void geraTokenQueValidaDeVoltaParaOMesmoUsuario() {
        Usuario usuario = usuarioComId(7);
        String token = jwtService.gerarAccessToken(usuario);

        Optional<JwtService.TokenValido> valido = jwtService.validar(token);

        assertTrue(valido.isPresent());
        assertEquals(7, valido.get().usuarioId());
    }

    @Test
    void tokenComAssinaturaDeOutroSegredoNaoValida() {
        JwtService outroServico = new JwtService("outro-segredo-com-mais-de-32-caracteres!!", 15);
        String token = outroServico.gerarAccessToken(usuarioComId(7));

        assertTrue(jwtService.validar(token).isEmpty());
    }

    @Test
    void tokenComLixoNaoValida() {
        assertTrue(jwtService.validar("isto-nao-eh-um-jwt").isEmpty());
    }

    @Test
    void tokenExpiradoNaoValida() {
        String expirado = construirToken(5, Instant.now().minusSeconds(3600), Instant.now().minusSeconds(1));

        assertTrue(jwtService.validar(expirado).isEmpty());
    }

    @Test
    void tokenSemIssuedAtNaoValida() {
        SecretKey key = Keys.hmacShaKeyFor(SEGREDO.getBytes(StandardCharsets.UTF_8));
        String semIssuedAt = Jwts.builder()
                .subject("5")
                .expiration(Date.from(Instant.now().plusSeconds(3600)))
                .signWith(key)
                .compact();

        assertTrue(jwtService.validar(semIssuedAt).isEmpty());
    }

    @Test
    void getAccessExpirationSecondsRefleteOValorConfigurado() {
        JwtService servicoDeDezMinutos = new JwtService(SEGREDO, 10);
        assertEquals(600, servicoDeDezMinutos.getAccessExpirationSeconds());
    }

    // Monta um JWT manualmente (mesma chave que o segredo geraria) com instantes fixos,
    // para testar expiração sem depender do relógio real.
    private static String construirToken(int usuarioId, Instant issuedAt, Instant expiration) {
        SecretKey key = Keys.hmacShaKeyFor(SEGREDO.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .subject(String.valueOf(usuarioId))
                .issuedAt(Date.from(issuedAt))
                .expiration(Date.from(expiration))
                .signWith(key)
                .compact();
    }
}
