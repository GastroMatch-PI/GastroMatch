package com.gastromatch.dto;

import java.util.List;

import com.gastromatch.entity.enums.Dificuldade;
import com.gastromatch.entity.enums.MetodoPreparo;
import com.gastromatch.entity.enums.Ocasiao;
import com.gastromatch.entity.enums.PerfilAlimentar;
import com.gastromatch.entity.enums.TipoRefeicao;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Dados para criar ou substituir uma receita. Não tem id nem chef: o dono é sempre
 * o chef da conta logada. As etapas e dicas têm rotas próprias.
 */
public record ReceitaRequest(
        @NotBlank(message = "Informe o nome")
        @Size(max = 150, message = "O nome deve ter no máximo 150 caracteres")
        String nome,

        @Size(max = 1000, message = "A descrição deve ter no máximo 1000 caracteres")
        String descricao,

        // Até existir upload de fotos, a imagem é um link http(s).
        @Size(max = 500, message = "O link da imagem deve ter no máximo 500 caracteres")
        @Pattern(regexp = "^https?://\\S+$", message = "A imagem deve ser um link http ou https")
        String imagem,

        // Só YouTube: youtube.com/watch?v=ID, /embed/ID, /shorts/ID ou youtu.be/ID (ID de 11 caracteres).
        // O "/" logo após o domínio impede endereços como youtube.com.golpe.com.
        @Size(max = 500, message = "O link do vídeo deve ter no máximo 500 caracteres")
        @Pattern(regexp = "^https://(www\\.|m\\.)?(youtube\\.com/(watch\\?v=|embed/|shorts/)|youtu\\.be/)[A-Za-z0-9_-]{11}([?&#]\\S*)?$",
                message = "O vídeo deve ser um link do YouTube (youtube.com ou youtu.be)")
        String videoUrl,

        @NotNull(message = "Informe o número de porções")
        @Min(value = 1, message = "O número de porções deve ser pelo menos 1")
        Integer nPorcoes,

        @NotNull(message = "Informe a dificuldade")
        Dificuldade dificuldade,

        @NotNull(message = "Informe o tipo de refeição")
        TipoRefeicao tipo,

        MetodoPreparo metodoPreparo,

        Ocasiao ocasiao,

        @NotNull(message = "Informe o tempo de preparo em minutos")
        @Min(value = 1, message = "O tempo de preparo deve ser pelo menos 1 minuto")
        Integer tempoPreparo,

        PerfilAlimentar perfil,

        @NotEmpty(message = "Informe ao menos um ingrediente")
        @Valid
        List<IngredienteReceitaRequest> ingredientes
) {
}
