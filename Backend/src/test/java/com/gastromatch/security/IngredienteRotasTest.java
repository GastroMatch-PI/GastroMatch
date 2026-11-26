package com.gastromatch.security;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
import com.gastromatch.controller.IngredienteController;
import com.gastromatch.dto.IngredienteResponse;
import com.gastromatch.entity.Usuario;
import com.gastromatch.entity.enums.RoleUsuario;
import com.gastromatch.repository.UsuarioRepository;
import com.gastromatch.service.IngredienteService;

/** POST/PUT/DELETE /ingredientes (B39) só para ROLE_ADMIN; GET já é coberto por RotasPublicasTest. */
@WebMvcTest(IngredienteController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, JwtService.class, CorsConfig.class})
@TestPropertySource(properties = {
        "app.jwt.secret=segredo-de-teste-com-mais-de-32-caracteres-ok",
        "app.cors.allowed-origins=http://localhost:5173"
})
class IngredienteRotasTest {

    private static final String CORPO_VALIDO =
            "{\"nome\":\"Maçã\",\"porcaoBase\":100,\"calorias\":52,\"gordura\":0.2,\"proteina\":0.3,\"carboidrato\":14}";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @MockBean
    private IngredienteService ingredienteService;

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
    void escritaSemTokenDeveRetornar401() throws Exception {
        mockMvc.perform(post("/ingredientes").contentType("application/json").content(CORPO_VALIDO))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void escritaComUsuarioComumDeveRetornar403() throws Exception {
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuarioComum));
        String bearer = "Bearer " + jwtService.gerarAccessToken(usuarioComum);

        mockMvc.perform(post("/ingredientes").header("Authorization", bearer)
                        .contentType("application/json").content(CORPO_VALIDO))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/ingredientes/1").header("Authorization", bearer)
                        .contentType("application/json").content(CORPO_VALIDO))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/ingredientes/1").header("Authorization", bearer))
                .andExpect(status().isForbidden());
    }

    @Test
    void escritaComAdminEhAceita() throws Exception {
        when(usuarioRepository.findById(2)).thenReturn(Optional.of(admin));
        when(ingredienteService.criar(any())).thenReturn(
                new IngredienteResponse(1, "Maçã", 100f, 52f, 0.2f, 0.3f, 14f));
        String bearer = "Bearer " + jwtService.gerarAccessToken(admin);

        mockMvc.perform(post("/ingredientes").header("Authorization", bearer)
                        .contentType("application/json").content(CORPO_VALIDO))
                .andExpect(status().isCreated());
        mockMvc.perform(delete("/ingredientes/1").header("Authorization", bearer))
                .andExpect(status().isNoContent());
    }
}
