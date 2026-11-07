package com.gastromatch.security;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import com.gastromatch.config.CorsConfig;
import com.gastromatch.controller.ImagemController;
import com.gastromatch.exception.GlobalExceptionHandler;
import com.gastromatch.exception.RecursoNaoEncontradoException;
import com.gastromatch.repository.UsuarioRepository;
import com.gastromatch.service.ImagemService;

/** Ver imagem é público; enviar exige login. */
@WebMvcTest(ImagemController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, JwtService.class, CorsConfig.class,
        GlobalExceptionHandler.class})
@TestPropertySource(properties = {
        "app.jwt.secret=segredo-de-teste-com-mais-de-32-caracteres-ok",
        "app.cors.allowed-origins=http://localhost:5173"
})
class ImagensRotasTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ImagemService imagemService;

    @MockBean
    private UsuarioRepository usuarioRepository;

    @Test
    void visitanteNaoEnviaImagem() throws Exception {
        var arquivo = new MockMultipartFile("arquivo", "a.png", "image/png", new byte[] {1});
        mockMvc.perform(multipart("/imagens").file(arquivo)).andExpect(status().isUnauthorized());
    }

    @Test
    void visitanteVeImagemQueNaoExisteEDa404SemPedirLogin() throws Exception {
        when(imagemService.abrir(any())).thenThrow(new RecursoNaoEncontradoException("Imagem não encontrada"));
        mockMvc.perform(get("/imagens/0123456789abcdef0123456789abcdef.png")).andExpect(status().isNotFound());
    }
}
