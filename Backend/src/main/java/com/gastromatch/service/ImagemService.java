package com.gastromatch.service;

import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import com.gastromatch.exception.RecursoNaoEncontradoException;
import com.gastromatch.exception.RequisicaoInvalidaException;

/** Valida a imagem enviada (tipo pelo conteúdo e tamanho) e entrega para o armazenamento. */
@Service
public class ImagemService {

    public static final int TAMANHO_MAXIMO = 5 * 1024 * 1024; // 5 MB
    public static final String PREFIXO_URL = "/imagens/";

    private final ArmazenamentoService armazenamento;

    public ImagemService(ArmazenamentoService armazenamento) {
        this.armazenamento = armazenamento;
    }

    /** Grava a imagem e devolve o caminho público dela (ex.: "/imagens/a1b2...c3.png"). */
    public String enviar(byte[] conteudo) {
        if (conteudo == null || conteudo.length == 0) {
            throw new RequisicaoInvalidaException("Envie um arquivo de imagem");
        }
        if (conteudo.length > TAMANHO_MAXIMO) {
            throw new RequisicaoInvalidaException("A imagem deve ter no máximo 5 MB");
        }
        String extensao = extensaoPeloConteudo(conteudo);
        return PREFIXO_URL + armazenamento.salvar(conteudo, extensao);
    }

    public Resource abrir(String nome) {
        return armazenamento.abrir(nome)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Imagem não encontrada"));
    }

    /**
     * Descobre o tipo olhando os primeiros bytes do arquivo (a "assinatura"), nunca o nome nem o
     * Content-Type, que quem envia pode forjar. Só JPEG, PNG e WEBP passam.
     */
    static String extensaoPeloConteudo(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return "jpg";
        }
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) {
            return "png";
        }
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return "webp";
        }
        throw new RequisicaoInvalidaException("Formato de imagem não aceito. Use JPG, PNG ou WEBP");
    }

    /** Tipo para o cabeçalho Content-Type, pela extensão que nós mesmos gravamos. */
    public static String tipoMime(String nome) {
        String ext = nome.substring(nome.lastIndexOf('.') + 1);
        return switch (ext) {
            case "jpg" -> "image/jpeg";
            case "png" -> "image/png";
            default -> "image/webp";
        };
    }
}
