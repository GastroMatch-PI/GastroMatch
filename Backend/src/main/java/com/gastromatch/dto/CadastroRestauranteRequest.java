package com.gastromatch.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/** Cadastro de restaurante. Latitude e longitude são opcionais, mas vêm juntas (ver RestauranteService). */
public record CadastroRestauranteRequest(
        @NotBlank(message = "Informe o nome do restaurante")
        @Size(max = 150, message = "O nome deve ter no máximo 150 caracteres")
        String nome,

        @Size(max = 500, message = "A bio deve ter no máximo 500 caracteres")
        String bio,

        @NotBlank(message = "Informe o CNPJ")
        @Size(max = 18, message = "O CNPJ deve ter no máximo 18 caracteres")
        String cnpj,

        @Positive(message = "O número deve ser maior que zero")
        Integer numero,

        @Size(max = 150, message = "A rua deve ter no máximo 150 caracteres")
        String rua,

        @Pattern(regexp = "^(\\d{5}-?\\d{3})?$", message = "CEP inválido (use 00000-000)")
        String cep,

        @Size(max = 100, message = "O bairro deve ter no máximo 100 caracteres")
        String bairro,

        @Size(max = 100, message = "A cidade deve ter no máximo 100 caracteres")
        String cidade,

        @Size(max = 50, message = "O estado deve ter no máximo 50 caracteres")
        String estado,

        @DecimalMin(value = "-90.0", message = "A latitude vai de -90 a 90")
        @DecimalMax(value = "90.0", message = "A latitude vai de -90 a 90")
        Double latitude,

        @DecimalMin(value = "-180.0", message = "A longitude vai de -180 a 180")
        @DecimalMax(value = "180.0", message = "A longitude vai de -180 a 180")
        Double longitude
) {
}
