package com.gastromatch.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Campos básicos editáveis pelo próprio usuário. A foto usa a coluna já existente `capa`. */
public record AtualizarPerfilUsuarioRequest(
        @NotBlank(message = "O nome é obrigatório")
        @Size(min = 3, max = 50, message = "O nome deve ter entre 3 e 50 caracteres")
        String username,

        @Size(max = 500, message = "A imagem deve ter no máximo 500 caracteres")
        @Pattern(regexp = ImagemLink.REGEX, message = ImagemLink.MENSAGEM)
        String capa
) {
}
