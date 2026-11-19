package com.gastromatch.security;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import com.gastromatch.entity.Usuario;
import com.gastromatch.entity.enums.RoleUsuario;
import com.gastromatch.repository.UsuarioRepository;
import com.gastromatch.service.UsuarioService;

/**
 * "/admin/**" é só ROLE_ADMIN (B35). Nenhum controller mapeia essa rota ainda; mesmo assim o
 * SecurityFilterChain decide 401/403 antes do DispatcherServlet procurar um handler — um admin
 * de verdade chega até o "não achei rota" (404), o que já prova que a autorização deixou passar.
 */
@WebMvcTest(UsuarioController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, JwtService.class, CorsConfig.class})
@TestPropertySource(properties = {
        "app.jwt.secret=segredo-de-teste-com-mais-de-32-caracteres-ok",
        "app.cors.allowed-origins=http://localhost:5173"
})
class AdminRotasTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @MockBean
    private UsuarioService usuarioService;

    @MockBean
    private UsuarioRepository usuarioRepository;

    private Usuario usuarioComum;
    private Usuario admin;

    @BeforeEach
    void criarUsuarios() {
        usuarioComum = new Usuario();
        ReflectionTestUtils.setField(usuarioComum, "id", 1);
        usuarioComum.setEmail("comum@gastro.local");
        usuarioComum.setRole(RoleUsuario.USER);

        admin = new Usuario();
        ReflectionTestUtils.setField(admin, "id", 2);
        admin.setEmail("admin@gastro.local");
        admin.setRole(RoleUsuario.ADMIN);
    }

    @Test
    void rotaAdminSemTokenDeveRetornar401() throws Exception {
        mockMvc.perform(get("/admin/qualquer-coisa")).andExpect(status().isUnauthorized());
    }

    @Test
    void rotaAdminComUsuarioComumDeveRetornar403() throws Exception {
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuarioComum));

        mockMvc.perform(get("/admin/qualquer-coisa").header("Authorization", bearer(usuarioComum)))
                .andExpect(status().isForbidden());
    }

    @Test
    void rotaAdminComAdminPassaPelaAutorizacao() throws Exception {
        when(usuarioRepository.findById(2)).thenReturn(Optional.of(admin));

        // Passou da autorização (não é 401 nem 403); só não existe handler para esse caminho.
        mockMvc.perform(get("/admin/qualquer-coisa").header("Authorization", bearer(admin)))
                .andExpect(status().isNotFound());
    }

    @Test
    void alterarUmCaractereDoTokenNuncaElevaPrivilegio() throws Exception {
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuarioComum));
        String tokenValido = jwtService.gerarAccessToken(usuarioComum);
        // Troca o último caractere: a assinatura deixa de bater (não é mais uma questão de role).
        char ultimo = tokenValido.charAt(tokenValido.length() - 1);
        char trocado = (ultimo == 'a') ? 'b' : 'a';
        String tokenAdulterado = tokenValido.substring(0, tokenValido.length() - 1) + trocado;

        mockMvc.perform(get("/admin/qualquer-coisa").header("Authorization", "Bearer " + tokenAdulterado))
                .andExpect(status().isUnauthorized());
    }

    private String bearer(Usuario usuario) {
        return "Bearer " + jwtService.gerarAccessToken(usuario);
    }
}
