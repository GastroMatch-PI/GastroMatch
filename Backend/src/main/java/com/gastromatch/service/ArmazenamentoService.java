package com.gastromatch.service;

import java.util.Optional;
import java.util.regex.Pattern;

import org.springframework.core.io.Resource;

/**
 * Onde as imagens enviadas ficam guardadas. Hoje é o disco local ({@link ArmazenamentoLocal});
 * para usar um serviço na nuvem basta outra implementação desta interface.
 */
public interface ArmazenamentoService {

    /** Nome que o arquivo gravado pode ter: 32 caracteres aleatórios e a extensão. Nada mais passa. */
    Pattern NOME_VALIDO = Pattern.compile("[0-9a-f]{32}\\.(jpg|png|webp)");

    /** Grava o conteúdo com um nome aleatório e devolve esse nome (ex.: "a1b2...c3.png"). */
    String salvar(byte[] conteudo, String extensao);

    /** Abre o arquivo pelo nome; vazio se o nome é inválido ou o arquivo não existe. */
    Optional<Resource> abrir(String nome);
}
