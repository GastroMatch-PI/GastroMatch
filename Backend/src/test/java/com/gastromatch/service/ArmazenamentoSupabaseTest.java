package com.gastromatch.service;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.sun.net.httpserver.HttpServer;

/** Fala com um "Supabase de mentira" (servidor local) para conferir o que a API envia. */
class ArmazenamentoSupabaseTest {

    private HttpServer servidor;
    private String url;
    private int status;
    private final AtomicReference<String> metodo = new AtomicReference<>();
    private final AtomicReference<String> caminho = new AtomicReference<>();
    private final AtomicReference<String> apikey = new AtomicReference<>();
    private final AtomicReference<String> autorizacao = new AtomicReference<>();
    private final AtomicReference<String> tipo = new AtomicReference<>();
    private final AtomicReference<byte[]> corpo = new AtomicReference<>();

    @BeforeEach
    void subir() throws IOException {
        status = 200;
        servidor = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        servidor.createContext("/", troca -> {
            metodo.set(troca.getRequestMethod());
            caminho.set(troca.getRequestURI().getPath());
            apikey.set(troca.getRequestHeaders().getFirst("apikey"));
            autorizacao.set(troca.getRequestHeaders().getFirst("Authorization"));
            tipo.set(troca.getRequestHeaders().getFirst("Content-Type"));
            corpo.set(troca.getRequestBody().readAllBytes());
            troca.sendResponseHeaders(status, -1);
            troca.close();
        });
        servidor.start();
        url = "http://localhost:" + servidor.getAddress().getPort();
    }

    @AfterEach
    void parar() {
        servidor.stop(0);
    }

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3};

    @Test
    void enviaOArquivoParaOBucketEDevolveOLinkPublico() {
        var armazenamento = new ArmazenamentoSupabase(url, "sb_secret_teste", "imagens");

        String link = armazenamento.salvar(PNG, "png");

        assertEquals("POST", metodo.get());
        assertTrue(caminho.get().matches("/storage/v1/object/imagens/[0-9a-f]{32}\\.png"), caminho.get());
        assertEquals("image/png", tipo.get());
        assertArrayEquals(PNG, corpo.get());
        String nome = caminho.get().substring(caminho.get().lastIndexOf('/') + 1);
        assertEquals(url + "/storage/v1/object/public/imagens/" + nome, link);
        assertTrue(ArmazenamentoService.NOME_VALIDO.matcher(nome).matches());
    }

    @Test
    void chaveNovaVaiSoNoApikey() {
        new ArmazenamentoSupabase(url, "sb_secret_teste", "imagens").salvar(PNG, "png");
        assertEquals("sb_secret_teste", apikey.get());
        assertNull(autorizacao.get());
    }

    @Test
    void chaveAntigaJwtTambemVaiNoAuthorization() {
        new ArmazenamentoSupabase(url, "eyJhbGciOi.payload.assinatura", "imagens").salvar(PNG, "png");
        assertEquals("eyJhbGciOi.payload.assinatura", apikey.get());
        assertEquals("Bearer eyJhbGciOi.payload.assinatura", autorizacao.get());
    }

    @Test
    void ignoraBarraNoFinalDoEndereco() {
        String link = new ArmazenamentoSupabase(url + "/", "sb_secret_teste", "imagens").salvar(PNG, "webp");
        assertTrue(caminho.get().startsWith("/storage/v1/object/imagens/"), caminho.get());
        assertTrue(link.startsWith(url + "/storage/v1/object/public/imagens/"), link);
    }

    @Test
    void falhaDoSupabaseViraErroSemVazarAChave() {
        status = 403;
        var armazenamento = new ArmazenamentoSupabase(url, "sb_secret_segredo", "imagens");
        var erro = assertThrows(IllegalStateException.class, () -> armazenamento.salvar(PNG, "png"));
        assertTrue(erro.getMessage().contains("403"));
        assertTrue(!erro.getMessage().contains("sb_secret_segredo"));
    }

    @Test
    void naoServeArquivosPorAqui() {
        assertTrue(new ArmazenamentoSupabase(url, "k", "imagens").abrir("0123456789abcdef0123456789abcdef.png").isEmpty());
    }
}
