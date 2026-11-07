package com.gastromatch.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.gastromatch.entity.Usuario;
import com.gastromatch.entity.enums.RoleUsuario;
import com.gastromatch.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class AdminInicialRunnerTest {

    @Mock UsuarioRepository usuarioRepository;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Test
    void criaOAdminQuandoAsTresVariaveisEstaoPreenchidas() {
        when(usuarioRepository.existsByEmail("admin@gastro.local")).thenReturn(false);
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(i -> i.getArgument(0));
        var runner = new AdminInicialRunner(usuarioRepository, passwordEncoder,
                "admin@gastro.local", "admingastro", "Abacaxi#2025");

        runner.run(null);

        ArgumentCaptor<Usuario> salvo = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(salvo.capture());
        assertEquals(RoleUsuario.ADMIN, salvo.getValue().getRole());
        assertEquals("admin@gastro.local", salvo.getValue().getEmail());
    }

    @Test
    void naoFazNadaSeFaltarQualquerUmaDasTresVariaveis() {
        new AdminInicialRunner(usuarioRepository, passwordEncoder, "", "admingastro", "Abacaxi#2025").run(null);
        new AdminInicialRunner(usuarioRepository, passwordEncoder, "admin@gastro.local", "", "Abacaxi#2025").run(null);
        new AdminInicialRunner(usuarioRepository, passwordEncoder, "admin@gastro.local", "admingastro", "").run(null);

        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void naoCriaNiPromoveSeJaExisteContaComEsseEmail() {
        when(usuarioRepository.existsByEmail("admin@gastro.local")).thenReturn(true);
        var runner = new AdminInicialRunner(usuarioRepository, passwordEncoder,
                "admin@gastro.local", "admingastro", "Abacaxi#2025");

        runner.run(null);

        verify(usuarioRepository, never()).save(any());
    }
}
