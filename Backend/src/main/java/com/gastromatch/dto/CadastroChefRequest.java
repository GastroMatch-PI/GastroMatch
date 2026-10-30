package com.gastromatch.dto;

import com.gastromatch.entity.enums.Especializacao;

import jakarta.validation.constraints.Size;

/**
 * Cria o perfil de chef da conta logada. Não tem "role" nem status de verificação:
 * o backend decide os dois (role = CHEF; chef publica sem aprovação).
 */
public record CadastroChefRequest(
        @Size(max = 500, message = "A bio deve ter no máximo 500 caracteres")
        String bio,

        Especializacao especializacao
) {
}
