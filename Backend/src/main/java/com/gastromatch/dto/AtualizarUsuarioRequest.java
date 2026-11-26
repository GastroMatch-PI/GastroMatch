package com.gastromatch.dto;

/**
 * Dados aceitos por PUT /usuarios/me. Os dois campos são opcionais: null ou em branco
 * significa "não alterar" (e-mail e senha não entram aqui de propósito). Como "em branco"
 * é um valor válido (significa "não alterar"), o tamanho de cada campo só é conferido no
 * UsuarioService quando ele de fato vem preenchido; @Size aqui rejeitaria o branco antes
 * de chegar lá.
 */
public record AtualizarUsuarioRequest(
        String username,
        String capa
) {
}
