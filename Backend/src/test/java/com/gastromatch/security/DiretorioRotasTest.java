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
import com.gastromatch.controller.ChefController;
import com.gastromatch.controller.NutricionistaController;
import com.gastromatch.controller.RestauranteController;
import com.gastromatch.dto.PaginaResponse;
import com.gastromatch.exception.GlobalExceptionHandler;
import com.gastromatch.exception.RecursoNaoEncontradoException;
import com.gastromatch.repository.UsuarioRepository;
import com.gastromatch.service.ChefService;
import com.gastromatch.service.NutricionistaService;
import com.gastromatch.service.RestauranteService;

/**
 * Contrato de acesso do diretório: ler chefs, nutricionistas e restaurantes é público (só GET),
 * mas o perfil da própria conta ("/me") e qualquer escrita exigem login.
 */
@WebMvcTest({ChefController.class, NutricionistaController.class, RestauranteController.class})
@Import({SecurityConfig.class, JwtAuthFilter.class, JwtService.class, CorsConfig.class,
        GlobalExceptionHandler.class})
@TestPropertySource(properties = {
        "app.jwt.secret=segredo-de-teste-com-mais-de-32-caracteres-ok",
        "app.cors.allowed-origins=http://localhost:5173"
})
class DiretorioRotasTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ChefService chefService;

    @MockBean
    private NutricionistaService nutricionistaService;

    @MockBean
    private RestauranteService restauranteService;

    @MockBean
    private UsuarioRepository usuarioRepository;

    private static <T> PaginaResponse<T> paginaVazia() {
        return new PaginaResponse<>(List.of(), 0, 20, 0, 0);
    }

    @Test
    void listagensPublicasSemTokenDevemRetornar200() throws Exception {
        when(chefService.listar(any(), any())).thenReturn(paginaVazia());
        when(nutricionistaService.listar(any())).thenReturn(paginaVazia());
        when(restauranteService.listar(any(), any(), any(), any(), any())).thenReturn(paginaVazia());

        mockMvc.perform(get("/chefs")).andExpect(status().isOk());
        mockMvc.perform(get("/nutricionistas")).andExpect(status().isOk());
        mockMvc.perform(get("/restaurantes")).andExpect(status().isOk());
        mockMvc.perform(get("/restaurantes?cidade=Sao Paulo&texto=massa")).andExpect(status().isOk());
    }

    @Test
    void perfilInexistenteSemTokenDeveRetornar404() throws Exception {
        when(chefService.perfilPublico(99)).thenThrow(new RecursoNaoEncontradoException("Chef não encontrado"));
        when(nutricionistaService.buscar(99)).thenThrow(new RecursoNaoEncontradoException("não achou"));
        when(restauranteService.detalhar(99)).thenThrow(new RecursoNaoEncontradoException("não achou"));

        mockMvc.perform(get("/chefs/99")).andExpect(status().isNotFound());
        mockMvc.perform(get("/nutricionistas/99")).andExpect(status().isNotFound());
        mockMvc.perform(get("/restaurantes/99")).andExpect(status().isNotFound());
    }

    @Test
    void perfilDaPropriaContaExigeLogin() throws Exception {
        // "/me" não pode cair na rota pública "/chefs/{id}".
        mockMvc.perform(get("/chefs/me")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/nutricionistas/me")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/restaurantes/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void cadastrosEOutrasEscritasExigemLogin() throws Exception {
        mockMvc.perform(post("/chefs").contentType("application/json").content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/nutricionistas").contentType("application/json").content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/restaurantes").contentType("application/json").content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(put("/restaurantes/1").contentType("application/json").content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(put("/nutricionistas/me").contentType("application/json").content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(put("/restaurantes/me").contentType("application/json").content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/nutricionistas/1")).andExpect(status().isUnauthorized());
    }

    @Test
    void idQueNaoEhNumeroDeveRetornar400() throws Exception {
        mockMvc.perform(get("/restaurantes/abc")).andExpect(status().isBadRequest());
    }
}
