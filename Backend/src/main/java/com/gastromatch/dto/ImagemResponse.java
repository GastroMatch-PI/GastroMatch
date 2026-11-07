package com.gastromatch.dto;

/** Resposta do upload: o caminho a guardar no campo imagem/foto (ex.: "/imagens/a1b2...c3.png"). */
public record ImagemResponse(String url) {
}
