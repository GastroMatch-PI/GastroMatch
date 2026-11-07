package com.gastromatch.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import com.gastromatch.exception.RecursoNaoEncontradoException;
import com.gastromatch.exception.RequisicaoInvalidaException;

/** Upload de imagens: só JPG, PNG e WEBP (pelo conteúdo), até 5 MB, com nome aleatório. */
class ImagemServiceTest {

    @TempDir
    Path pasta;

    private ImagemService service;

    @BeforeEach
    void preparar() {
        service = new ImagemService(new ArmazenamentoLocal(pasta.toString()));
    }

    private static byte[] png() {
        return new byte[] {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0};
    }

    private static byte[] jpg() {
        return new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0};
    }

    private static byte[] webp() {
        return new byte[] {'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P', 0};
    }

    @Test
    void aceitaPngJpgEWebpPelaAssinaturaDoArquivo() {
        assertTrue(service.enviar(png()).endsWith(".png"));
        assertTrue(service.enviar(jpg()).endsWith(".jpg"));
        assertTrue(service.enviar(webp()).endsWith(".webp"));
    }

    @Test
    void devolveCaminhoPublicoComNomeAleatorioQueRespeitaOPadrao() {
        String url = service.enviar(png());
        assertTrue(url.startsWith("/imagens/"));
        String nome = url.substring("/imagens/".length());
        assertTrue(ArmazenamentoService.NOME_VALIDO.matcher(nome).matches());
        assertFalse(service.enviar(png()).equals(url), "dois envios iguais não podem ter o mesmo nome");
    }

    @Test
    void gravaOArquivoEPermiteLerDeVolta() throws Exception {
        String url = service.enviar(png());
        String nome = url.substring("/imagens/".length());
        assertTrue(Files.exists(pasta.resolve(nome)));
        assertEquals(png().length, service.abrir(nome).contentLength());
    }

    @Test
    void rejeitaArquivoQueNaoEImagemMesmoComNomeDeImagem() {
        byte[] texto = "<script>alert(1)</script>".getBytes(StandardCharsets.UTF_8);
        assertThrows(RequisicaoInvalidaException.class, () -> service.enviar(texto));
        // GIF e PDF também não entram.
        assertThrows(RequisicaoInvalidaException.class, () -> service.enviar("GIF89a....".getBytes(StandardCharsets.UTF_8)));
        assertThrows(RequisicaoInvalidaException.class, () -> service.enviar("%PDF-1.7....".getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    void rejeitaVazioENulo() {
        assertThrows(RequisicaoInvalidaException.class, () -> service.enviar(new byte[0]));
        assertThrows(RequisicaoInvalidaException.class, () -> service.enviar(null));
    }

    @Test
    void rejeitaArquivoMaiorQue5Mb() {
        byte[] grande = Arrays.copyOf(png(), ImagemService.TAMANHO_MAXIMO + 1);
        assertThrows(RequisicaoInvalidaException.class, () -> service.enviar(grande));
        // No limite exato ainda passa.
        assertTrue(service.enviar(Arrays.copyOf(png(), ImagemService.TAMANHO_MAXIMO)).endsWith(".png"));
    }

    @Test
    void naoAbreNomeForaDoPadraoNemSaiDaPasta() throws Exception {
        Files.writeString(pasta.getParent().resolve("segredo.txt"), "x");
        for (String nome : new String[] {"../segredo.txt", "..%2Fsegredo.txt", "segredo.txt", "ABC.png", ""}) {
            assertThrows(RecursoNaoEncontradoException.class, () -> service.abrir(nome), nome);
        }
    }

    @Test
    void imagemQueNaoExisteDa404() {
        assertThrows(RecursoNaoEncontradoException.class,
                () -> service.abrir("0123456789abcdef0123456789abcdef.png"));
    }

    @Test
    void tipoMimeSegueAExtensao() {
        assertEquals("image/jpeg", ImagemService.tipoMime("a.jpg"));
        assertEquals("image/png", ImagemService.tipoMime("a.png"));
        assertEquals("image/webp", ImagemService.tipoMime("a.webp"));
    }
}
