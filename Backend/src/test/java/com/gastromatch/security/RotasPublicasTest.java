package com.gastromatch.security;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
import com.gastromatch.controller.ReceitaController;
import com.gastromatch.dto.PaginaResponse;
import com.gastromatch.exception.GlobalExceptionHandler;
import com.gastromatch.exception.ReceitaNaoEncontradaException;
import com.gastromatch.repository.UsuarioRepository;
import com.gastromatch.service.IngredienteService;
import com.gastromatch.service.ReceitaService;

/**
 * Garante o contrato de acesso: leitura de receitas e ingredientes é pública (só GET),
 * e qualquer outra coisa continua exigindo login.
 */
@WebMvcTest({ReceitaController.class, IngredienteController.class})
@Import({SecurityConfig.class, JwtAuthFilter.class, JwtService.class, CorsConfig.class,
        GlobalExceptionHandler.class})
@TestPropertySource(properties = {
        "app.jwt.secret=segredo-de-teste-com-mais-de-32-caracteres-ok",
        "app.cors.allowed-origins=http://localhost:5173"
})
class RotasPublicasTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ReceitaService receitaService;

    @MockBean
    private IngredienteService ingredienteService;

    @MockBean
    private UsuarioRepository usuarioRepository;

    @Test
    void listarReceitasSemTokenDeveRetornar200() throws Exception {
        when(receitaService.listar(any(), any()))
                .thenReturn(new PaginaResponse<>(List.of(), 0, 20, 0, 0));

        mockMvc.perform(get("/receitas")).andExpect(status().isOk());
    }

    @Test
    void detalharReceitaSemTokenDeveRetornar200() throws Exception {
        mockMvc.perform(get("/receitas/1")).andExpect(status().isOk());
    }

    @Test
    void receitaInexistenteDeveRetornar404() throws Exception {
        when(receitaService.detalhar(99)).thenThrow(new ReceitaNaoEncontradaException());

        mockMvc.perform(get("/receitas/99")).andExpect(status().isNotFound());
    }

    @Test
    void filtroComValorInvalidoDeveRetornar400() throws Exception {
        mockMvc.perform(get("/receitas").param("dificuldade", "IMPOSSIVEL"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listarIngredientesSemTokenDeveRetornar200() throws Exception {
        mockMvc.perform(get("/ingredientes")).andExpect(status().isOk());
    }

    @Test
    void escreverEmReceitasSemTokenDeveRetornar401() throws Exception {
        mockMvc.perform(post("/receitas").contentType("application/json").content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(put("/receitas/1").contentType("application/json").content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/receitas/1")).andExpect(status().isUnauthorized());
    }

    @Test
    void subrotasDeReceitaNaoLiberadasContinuamProtegidas() throws Exception {
        mockMvc.perform(get("/receitas/1/qualquer-coisa")).andExpect(status().isUnauthorized());
    }
}
