package com.gastromatch.dto;

import com.gastromatch.validation.SenhaForte;

import jakarta.validation.constraints.NotBlank;

/** Dados da troca de senha autenticada (POST /usuarios/me/senha). */
public record TrocaSenhaRequest(
        @NotBlank(message = "Informe a senha atual")
        String senhaAtual,

        @NotBlank(message = "Informe a nova senha")
        @SenhaForte
        String novaSenha
) {
    // Evita que qualquer uma das senhas em texto puro vá parar em logs.
    @Override
    public String toString() {
        return "TrocaSenhaRequest[senhaAtual=***, novaSenha=***]";
    }
}
