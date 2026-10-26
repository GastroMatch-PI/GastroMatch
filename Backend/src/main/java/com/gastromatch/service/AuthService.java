package com.gastromatch.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gastromatch.dto.AuthResponse;
import com.gastromatch.dto.LoginRequest;
import com.gastromatch.dto.UsuarioResponse;
import com.gastromatch.entity.RefreshToken;
import com.gastromatch.entity.Usuario;
import com.gastromatch.exception.CredenciaisInvalidasException;
import com.gastromatch.exception.TokenInvalidoException;
import com.gastromatch.repository.RefreshTokenRepository;
import com.gastromatch.repository.UsuarioRepository;
import com.gastromatch.security.JwtService;

@Service
public class AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UsuarioRepository usuarioRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final Duration refreshDuracao;

    // Hash falso usado quando o email não existe, para o tempo de resposta
    // ser parecido com o de um email existente (evita descobrir emails por tempo).
    private final String hashFalso;

    public AuthService(UsuarioRepository usuarioRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       @Value("${app.jwt.refresh-expiration-days:7}") long refreshDias) {
        this.usuarioRepository = usuarioRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshDuracao = Duration.ofDays(refreshDias);
        this.hashFalso = passwordEncoder.encode("senha-falsa-para-igualar-tempo");
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);
        String hash = (usuario != null) ? usuario.getPassword() : hashFalso;
        boolean senhaConfere = passwordEncoder.matches(request.password(), hash);

        if (usuario == null || !senhaConfere) {
            throw new CredenciaisInvalidasException();
        }
        return emitirTokens(usuario);
    }

    // noRollbackFor: na detecção de reuso precisamos que a revogação seja
    // confirmada (commit) mesmo lançando a exceção.
    @Transactional(noRollbackFor = TokenInvalidoException.class)
    public AuthResponse refresh(String refreshToken) {
        RefreshToken atual = refreshTokenRepository.findByTokenHash(hash(refreshToken))
                .orElseThrow(TokenInvalidoException::new);

        // Token já usado/revogado sendo apresentado de novo: possível roubo.
        // Revoga todas as sessões do usuário.
        if (atual.isRevogado()) {
            refreshTokenRepository.revogarTodosDoUsuario(atual.getUsuario());
            throw new TokenInvalidoException();
        }
        if (atual.getExpiraEm().isBefore(Instant.now())) {
            throw new TokenInvalidoException();
        }

        // Rotação: o token usado é invalidado e um novo par é emitido.
        atual.setRevogado(true);
        return emitirTokens(atual.getUsuario());
    }

    @Transactional
    public void logout(String refreshToken) {
        // Idempotente: token desconhecido não gera erro.
        refreshTokenRepository.findByTokenHash(hash(refreshToken))
                .ifPresent(t -> t.setRevogado(true));
    }

    private AuthResponse emitirTokens(Usuario usuario) {
        // Refresh token opaco: 32 bytes aleatórios. O cliente recebe o valor puro;
        // o banco guarda só o hash.
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String refreshPuro = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        refreshTokenRepository.save(
                new RefreshToken(hash(refreshPuro), usuario, Instant.now().plus(refreshDuracao)));

        return new AuthResponse(
                jwtService.gerarAccessToken(usuario),
                refreshPuro,
                "Bearer",
                jwtService.getAccessExpirationSeconds(),
                UsuarioResponse.de(usuario));
    }

    private static String hash(String valor) {
        try {
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(sha.digest(valor.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
