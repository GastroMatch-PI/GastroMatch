package com.gastromatch.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.gastromatch.dto.AuthResponse;
import com.gastromatch.dto.LoginRequest;
import com.gastromatch.entity.RefreshToken;
import com.gastromatch.entity.Usuario;
import com.gastromatch.exception.CredenciaisInvalidasException;
import com.gastromatch.exception.TokenInvalidoException;
import com.gastromatch.repository.RefreshTokenRepository;
import com.gastromatch.repository.UsuarioRepository;
import com.gastromatch.security.JwtService;

/**
 * Repositórios mockados e um JwtService de verdade (é leve e determinístico: mesmo segredo,
 * mesmo resultado). Não existe bloqueio de conta (rate limit/lockout) no AuthService hoje,
 * por isso não há teste para esse cenário aqui.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final String SEGREDO = "segredo-de-teste-com-mais-de-32-caracteres-ok";
    private static final int USUARIO_ID = 42;

    @Mock UsuarioRepository usuarioRepository;
    @Mock RefreshTokenRepository refreshTokenRepository;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final JwtService jwtService = new JwtService(SEGREDO, 15);

    private AuthService service;
    private Usuario usuario;

    @BeforeEach
    void montar() {
        service = new AuthService(usuarioRepository, refreshTokenRepository, passwordEncoder, jwtService, 7);
        usuario = new Usuario();
        ReflectionTestUtils.setField(usuario, "id", USUARIO_ID);
        usuario.setEmail("maria@gastro.local");
        usuario.setUsername("mariachef");
        usuario.setPassword(passwordEncoder.encode("Senha#Correta123"));
    }

    // --------------------------------------------------------------------- login

    @Test
    void loginComCredenciaisValidasEmiteTokens() {
        when(usuarioRepository.findByEmail("maria@gastro.local")).thenReturn(Optional.of(usuario));

        AuthResponse resposta = service.login(new LoginRequest("maria@gastro.local", "Senha#Correta123"));

        assertNotNull(resposta.accessToken());
        assertNotNull(resposta.refreshToken());
        assertEquals("Bearer", resposta.tokenType());
        assertTrue(resposta.expiresIn() > 0);
        assertEquals(USUARIO_ID, resposta.usuario().id());
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void loginNormalizaEmailParaMinusculoESemEspacos() {
        when(usuarioRepository.findByEmail("maria@gastro.local")).thenReturn(Optional.of(usuario));

        service.login(new LoginRequest("  Maria@Gastro.Local  ", "Senha#Correta123"));

        verify(usuarioRepository).findByEmail("maria@gastro.local");
    }

    @Test
    void loginComEmailInexistenteLancaCredenciaisInvalidas() {
        when(usuarioRepository.findByEmail(any())).thenReturn(Optional.empty());

        assertThrows(CredenciaisInvalidasException.class, () ->
                service.login(new LoginRequest("ninguem@gastro.local", "qualquer-coisa")));
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void loginComSenhaErradaLancaCredenciaisInvalidas() {
        when(usuarioRepository.findByEmail("maria@gastro.local")).thenReturn(Optional.of(usuario));

        assertThrows(CredenciaisInvalidasException.class, () ->
                service.login(new LoginRequest("maria@gastro.local", "senha-errada")));
        verify(refreshTokenRepository, never()).save(any());
    }

    // ------------------------------------------------------------------- refresh

    @Test
    void refreshComTokenValidoRotacionaERevogaOAntigo() {
        RefreshToken antigo = new RefreshToken("hash-qualquer", usuario, Instant.now().plusSeconds(60));
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(antigo));

        AuthResponse resposta = service.refresh("token-bruto-do-cliente");

        assertTrue(antigo.isRevogado());
        assertNotNull(resposta.refreshToken());
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void refreshComTokenDesconhecidoLancaInvalido() {
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.empty());

        assertThrows(TokenInvalidoException.class, () -> service.refresh("token-nunca-emitido"));
    }

    @Test
    void refreshComTokenExpiradoLancaInvalido() {
        RefreshToken expirado = new RefreshToken("hash-qualquer", usuario, Instant.now().minusSeconds(1));
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(expirado));

        assertThrows(TokenInvalidoException.class, () -> service.refresh("token-vencido"));
    }

    @Test
    void refreshComTokenJaRevogadoRevogaTodasAsSessoesErejeita() {
        RefreshToken reusado = new RefreshToken("hash-qualquer", usuario, Instant.now().plusSeconds(60));
        reusado.setRevogado(true);
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(reusado));

        assertThrows(TokenInvalidoException.class, () -> service.refresh("token-ja-usado"));
        verify(refreshTokenRepository).revogarTodosDoUsuario(usuario);
        verify(refreshTokenRepository, never()).save(any());
    }

    // -------------------------------------------------------------------- logout

    @Test
    void logoutComTokenConhecidoRevoga() {
        RefreshToken token = new RefreshToken("hash-qualquer", usuario, Instant.now().plusSeconds(60));
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(token));

        service.logout("token-da-sessao");

        assertTrue(token.isRevogado());
    }

    @Test
    void logoutComTokenDesconhecidoEhIdempotente() {
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> service.logout("token-que-nunca-existiu"));
    }
}
