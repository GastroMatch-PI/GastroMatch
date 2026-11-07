package com.gastromatch.service;

import java.util.Optional;
import java.util.regex.Pattern;

import org.springframework.core.io.Resource;

/**
 * Onde as imagens enviadas ficam guardadas: no disco do servidor ({@link ArmazenamentoLocal}) ou no
 * Supabase Storage ({@link ArmazenamentoSupabase}). Quem decide é o {@code ArmazenamentoConfig}.
 */
public interface ArmazenamentoService {

    /** Nome que o arquivo gravado pode ter: 32 caracteres aleatórios e a extensão. Nada mais passa. */
    Pattern NOME_VALIDO = Pattern.compile("[0-9a-f]{32}\\.(jpg|png|webp)");

    /**
     * Grava o conteúdo com um nome aleatório e devolve o endereço para guardar no campo imagem/foto:
     * um caminho da própria API ("/imagens/a1b2...c3.png") ou o link completo da imagem na nuvem.
     */
    String salvar(byte[] conteudo, String extensao);

    /** Abre o arquivo pelo nome (só no disco local); vazio se o nome é inválido ou o arquivo não existe. */
    Optional<Resource> abrir(String nome);
}
