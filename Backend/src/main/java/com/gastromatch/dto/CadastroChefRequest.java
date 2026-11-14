package com.gastromatch.dto;

import com.gastromatch.entity.enums.Especializacao;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * Cria ou edita o perfil de chef da conta logada. Não tem "role" nem status de verificação:
 * o backend decide os dois (role = CHEF; chef publica sem aprovação).
 */
public record CadastroChefRequest(
        @Size(max = 500, message = "A bio deve ter no máximo 500 caracteres")
        String bio,
        Especializacao especializacao,
        // Opcional: id do restaurante onde o chef trabalha. No PUT, sem ele o chef sai do restaurante.
        @Positive(message = "O restaurante deve ser um id válido")
        Integer idRestaurante
) {
}
