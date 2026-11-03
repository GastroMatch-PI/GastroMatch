package com.gastromatch.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.gastromatch.entity.Usuario;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/** Gera e valida o access token (JWT assinado com HS256). */
@Service
public class JwtService {

    private final SecretKey key;
    private final long accessExpirationSeconds;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-expiration-minutes:15}") long accessExpirationMinutes) {

        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("app.jwt.secret deve ter pelo menos 32 caracteres");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.accessExpirationSeconds = accessExpirationMinutes * 60;
    }

    public String gerarAccessToken(Usuario usuario) {
        Instant agora = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(usuario.getId()))
                .claim("email", usuario.getEmail())
                .issuedAt(Date.from(agora))
                .expiration(Date.from(agora.plusSeconds(accessExpirationSeconds)))
                .signWith(key)
                .compact();
    }

    /** Dados lidos de um token válido: de quem é e quando foi emitido. */
    public record TokenValido(Integer usuarioId, Instant emitidoEm) {
    }

    /** Devolve os dados do token se ele for válido (assinatura e validade); senão, vazio. */
    public Optional<TokenValido> validar(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            // Todo token emitido por nós tem data de emissão; sem ela, não é confiável.
            Date emitidoEm = claims.getIssuedAt();
            if (emitidoEm == null) {
                return Optional.empty();
            }
            return Optional.of(new TokenValido(
                    Integer.valueOf(claims.getSubject()), emitidoEm.toInstant()));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public long getAccessExpirationSeconds() {
        return accessExpirationSeconds;
    }
}
