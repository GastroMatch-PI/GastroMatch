package com.gastromatch.dto;

/** O que os campos imagem/foto aceitam: um link http(s) ou o caminho devolvido por POST /imagens. */
public final class ImagemLink {

    public static final String REGEX =
            "^(https?://\\S+|/imagens/[0-9a-f]{32}\\.(jpg|png|webp))$";

    public static final String MENSAGEM =
            "A imagem deve ser um link http(s) ou uma imagem enviada pela API";

    private ImagemLink() {
    }
}
