package com.gastromatch.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

import org.springframework.core.io.Resource;

/**
 * Guarda as imagens no Supabase Storage (bucket público). A API envia o arquivo com a chave secreta e
 * devolve o link público, que o front usa direto. O disco do servidor não é usado.
 */
public class ArmazenamentoSupabase implements ArmazenamentoService {

    private final HttpClient http;
    private final String base;
    private final String chave;
    private final String bucket;

    public ArmazenamentoSupabase(String url, String chave, String bucket) {
        this(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build(), url, chave, bucket);
    }

    ArmazenamentoSupabase(HttpClient http, String url, String chave, String bucket) {
        this.http = http;
        this.base = url.trim().replaceAll("/+$", "");
        this.chave = chave.trim();
        this.bucket = bucket.trim();
    }

    @Override
    public String salvar(byte[] conteudo, String extensao) {
        String nome = UUID.randomUUID().toString().replace("-", "") + "." + extensao;
        HttpRequest.Builder pedido = HttpRequest.newBuilder(
                        URI.create(base + "/storage/v1/object/" + bucket + "/" + nome))
                .timeout(Duration.ofSeconds(30))
                .header("apikey", chave)
                .header("Content-Type", ImagemService.tipoMime(nome))
                .header("x-upsert", "false")
                .POST(HttpRequest.BodyPublishers.ofByteArray(conteudo));
        // As chaves novas (sb_secret_...) vão só no "apikey"; a chave antiga (service_role) é um JWT
        // e também precisa do Authorization.
        if (chave.startsWith("eyJ")) {
            pedido.header("Authorization", "Bearer " + chave);
        }
        try {
            HttpResponse<Void> resposta = http.send(pedido.build(), HttpResponse.BodyHandlers.discarding());
            if (resposta.statusCode() / 100 != 2) {
                throw new IllegalStateException(
                        "O Supabase Storage recusou o envio da imagem (HTTP " + resposta.statusCode() + ")");
            }
        } catch (IOException e) {
            throw new IllegalStateException("Não foi possível falar com o Supabase Storage", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Envio da imagem interrompido", e);
        }
        return base + "/storage/v1/object/public/" + bucket + "/" + nome;
    }

    /** As imagens são servidas direto pelo Supabase; esta API não entrega arquivo nenhum. */
    @Override
    public Optional<Resource> abrir(String nome) {
        return Optional.empty();
    }
}
