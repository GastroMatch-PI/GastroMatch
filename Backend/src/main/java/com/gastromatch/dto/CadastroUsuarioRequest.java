package com.gastromatch.dto;

import com.gastromatch.validation.SenhaForte;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Dados recebidos no cadastro. Não tem id nem capa: o id é gerado pelo banco
 * e a capa não faz parte do cadastro inicial.
 */
public record CadastroUsuarioRequest(
        @NotBlank(message = "Email é obrigatório")
        @Email(message = "Email inválido")
        @Size(max = 255, message = "Email deve ter no máximo 255 caracteres")
        String email,

        @NotBlank(message = "Username é obrigatório")
        @Size(min = 3, max = 50, message = "Username deve ter entre 3 e 50 caracteres")
        String username,

        // Tamanho, mistura de caracteres e lista de senhas comuns: tudo em @SenhaForte (B26).
        @NotBlank(message = "Senha é obrigatória")
        @SenhaForte
        String password
) {
    // Evita que a senha em texto puro vá parar em logs.
    @Override
    public String toString() {
        return "CadastroUsuarioRequest[email=" + email
                + ", username=" + username + ", password=***]";
    }
}