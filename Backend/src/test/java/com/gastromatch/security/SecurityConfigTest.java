package com.gastromatch.security;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import com.gastromatch.config.CorsConfig;
import com.gastromatch.controller.UsuarioController;
import com.gastromatch.dto.UsuarioResponse;
import com.gastromatch.entity.Usuario;
import com.gastromatch.repository.UsuarioRepository;
import com.gastromatch.service.UsuarioService;

/**
 * Testa só a camada web + segurança (sem banco). O UsuarioService e o UsuarioRepository
 * são falsos (@MockBean), porque aqui o que importa é: quem pode ou não chegar no controller.
 */
@WebMvcTest(UsuarioController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, JwtService.class, CorsConfig.class})
@TestPropertySource(properties = {
        "app.jwt.secret=segredo-de-teste-com-mais-de-32-caracteres-ok",
        "app.cors.allowed-origins=http://localhost:5173"
})
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @MockBean
    private UsuarioService usuarioService;

    @MockBean
    private UsuarioRepository usuarioRepository;

    private Usuario usuario;

    @BeforeEach
    void criarUsuario() {
        usuario = new Usuario();
        usuario.setEmail("teste@gastro.local");
        // O id é gerado pelo banco e a entidade não tem setter; aqui simulamos.
        ReflectionTestUtils.setField(usuario, "id", 1);

        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario));
        when(usuarioService.buscarPorId(1))
                .thenReturn(new UsuarioResponse(1, "teste@gastro.local", "teste", null));
    }

    @Test
    void rotaProtegidaSemTokenDeveRetornar401() throws Exception {
        mockMvc.perform(get("/usuarios/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rotaProtegidaComTokenInvalidoDeveRetornar401() throws Exception {
        mockMvc.perform(get("/usuarios/me").header("Authorization", "Bearer token-falso"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tokenValidoDeUsuarioExistenteDeveRetornar200() throws Exception {
        mockMvc.perform(get("/usuarios/me").header("Authorization", bearer()))
                .andExpect(status().isOk());
    }

    @Test
    void tokenValidoDeUsuarioQueNaoExisteMaisDeveRetornar401() throws Exception {
        String token = bearer();
        when(usuarioRepository.findById(1)).thenReturn(Optional.empty());

        mockMvc.perform(get("/usuarios/me").header("Authorization", token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tokenEmitidoAntesDaTrocaDeSenhaDeveRetornar401() throws Exception {
        String token = bearer();
        usuario.setSenhaAlteradaEm(Instant.now().plusSeconds(60));

        mockMvc.perform(get("/usuarios/me").header("Authorization", token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tokenEmitidoDepoisDaTrocaDeSenhaDeveRetornar200() throws Exception {
        usuario.setSenhaAlteradaEm(Instant.now().minusSeconds(60));

        mockMvc.perform(get("/usuarios/me").header("Authorization", bearer()))
                .andExpect(status().isOk());
    }

    private String bearer() {
        return "Bearer " + jwtService.gerarAccessToken(usuario);
    }
}
