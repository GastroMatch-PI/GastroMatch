package com.gastromatch.service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;

/** Guarda as imagens numa pasta do servidor (app.uploads.dir). No Render, o disco some a cada deploy. */
public class ArmazenamentoLocal implements ArmazenamentoService {

    public static final String PREFIXO_URL = "/imagens/";

    private final Path pasta;

    public ArmazenamentoLocal(@Value("${app.uploads.dir:uploads}") String pasta) {
        this.pasta = Path.of(pasta).toAbsolutePath().normalize();
    }

    @Override
    public String salvar(byte[] conteudo, String extensao) {
        String nome = UUID.randomUUID().toString().replace("-", "") + "." + extensao;
        try {
            Files.createDirectories(pasta);
            Files.write(pasta.resolve(nome), conteudo, StandardOpenOption.CREATE_NEW);
        } catch (IOException e) {
            throw new UncheckedIOException("Não foi possível gravar a imagem", e);
        }
        return PREFIXO_URL + nome;
    }

    @Override
    public Optional<Resource> abrir(String nome) {
        if (nome == null || !NOME_VALIDO.matcher(nome).matches()) {
            return Optional.empty();
        }
        Path arquivo = pasta.resolve(nome).normalize();
        if (!arquivo.startsWith(pasta) || !Files.isRegularFile(arquivo)) {
            return Optional.empty();
        }
        return Optional.of(new FileSystemResource(arquivo));
    }
}
