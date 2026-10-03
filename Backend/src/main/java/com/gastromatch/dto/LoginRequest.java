package com.gastromatch.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Dados recebidos no login. No login não impomos tamanho mínimo de senha:
 * quem define as regras de senha é o cadastro. Aqui só verificamos se bate.
 */
public record LoginRequest(
        @NotBlank(message = "Email é obrigatório")
        @Email(message = "Email inválido")
        String email,

        @NotBlank(message = "Senha é obrigatória")
        String password
) {
    // O toString gerado pelo record imprimiria a senha em qualquer log.
    @Override
    public String toString() {
        return "LoginRequest[email=" + email + ", password=***]";
    }
}