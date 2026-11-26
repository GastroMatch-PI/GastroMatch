package com.gastromatch.security;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import com.gastromatch.config.CorsConfig;
import com.gastromatch.controller.IngredienteController;
import com.gastromatch.dto.IngredienteResponse;
import com.gastromatch.repository.UsuarioRepository;
import com.gastromatch.service.IngredienteService;

/**
 * Confere que o CorsConfig só libera a(s) origem(ns) configurada(s) em
 * app.cors.allowed-origins. Uma rota pública (sem exigir login) é suficiente:
 * o CorsFilter roda antes da autenticação e rejeita origem desconhecida mesmo assim.
 */
@WebMvcTest(IngredienteController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, JwtService.class, CorsConfig.class})
@TestPropertySource(properties = {
        "app.jwt.secret=segredo-de-teste-com-mais-de-32-caracteres-ok",
        "app.cors.allowed-origins=http://localhost:5173"
})
class CorsRotasTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private IngredienteService ingredienteService;

    @MockBean
    private UsuarioRepository usuarioRepository;

    @Test
    void origemPermitidaRecebeOCabecalhoDeLiberacao() throws Exception {
        when(ingredienteService.listar(any())).thenReturn(List.<IngredienteResponse>of());

        mockMvc.perform(get("/ingredientes").header("Origin", "http://localhost:5173"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test
    void origemNaoPermitidaDeveRetornar403() throws Exception {
        mockMvc.perform(get("/ingredientes").header("Origin", "http://site-malicioso.example"))
                .andExpect(status().isForbidden());
    }
}
