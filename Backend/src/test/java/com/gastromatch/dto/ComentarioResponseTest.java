package com.gastromatch.dto;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.gastromatch.entity.Comentario;
import com.gastromatch.entity.Receita;
import com.gastromatch.entity.Usuario;

/** A lista de comentários mostra o autor (B57): username e capa, não só o username. */
class ComentarioResponseTest {

    @Test
    void deTrazUsernameECapaDoAutor() {
        Receita receita = new Receita();
        ReflectionTestUtils.setField(receita, "id", 1);
        Usuario autor = new Usuario();
        ReflectionTestUtils.setField(autor, "id", 7);
        autor.setUsername("mariachef");
        autor.setCapa("/imagens/0123456789abcdef0123456789abcdef.jpg");

        Comentario comentario = new Comentario(receita, autor, "Ficou ótimo!", 5f);

        ComentarioResponse resposta = ComentarioResponse.de(comentario);

        assertEquals("mariachef", resposta.username());
        assertEquals("/imagens/0123456789abcdef0123456789abcdef.jpg", resposta.capaAutor());
    }
}
