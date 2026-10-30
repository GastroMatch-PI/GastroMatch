package com.gastromatch.controller;

import java.net.URI;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gastromatch.dto.DicaRequest;
import com.gastromatch.dto.DicaResponse;
import com.gastromatch.dto.EtapaRequest;
import com.gastromatch.dto.EtapaResponse;
import com.gastromatch.dto.ReceitaDetalheResponse;
import com.gastromatch.dto.ReceitaRequest;
import com.gastromatch.service.ReceitaChefService;

import jakarta.validation.Valid;

/**
 * Escrita de receitas, etapas e dicas. Exige login e perfil de chef; só o chef dono
 * altera (a checagem fica no service). A leitura pública está no ReceitaController.
 */
@RestController
@RequestMapping("/receitas")
public class ReceitaChefController {

    private final ReceitaChefService service;

    public ReceitaChefController(ReceitaChefService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ReceitaDetalheResponse> criar(@AuthenticationPrincipal Integer usuarioId,
                                                        @Valid @RequestBody ReceitaRequest request) {
        ReceitaDetalheResponse criada = service.criar(usuarioId, request);
        return ResponseEntity.created(URI.create("/receitas/" + criada.id())).body(criada);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReceitaDetalheResponse> atualizar(@AuthenticationPrincipal Integer usuarioId,
                                                            @PathVariable Integer id,
                                                            @Valid @RequestBody ReceitaRequest request) {
        return ResponseEntity.ok(service.atualizar(usuarioId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@AuthenticationPrincipal Integer usuarioId, @PathVariable Integer id) {
        service.excluir(usuarioId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/etapas")
    public ResponseEntity<EtapaResponse> criarEtapa(@AuthenticationPrincipal Integer usuarioId,
                                                    @PathVariable Integer id,
                                                    @Valid @RequestBody EtapaRequest request) {
        EtapaResponse criada = service.criarEtapa(usuarioId, id, request);
        return ResponseEntity.created(URI.create("/receitas/" + id)).body(criada);
    }

    @PutMapping("/{id}/etapas/{idEtapa}")
    public ResponseEntity<EtapaResponse> atualizarEtapa(@AuthenticationPrincipal Integer usuarioId,
                                                        @PathVariable Integer id,
                                                        @PathVariable Integer idEtapa,
                                                        @Valid @RequestBody EtapaRequest request) {
        return ResponseEntity.ok(service.atualizarEtapa(usuarioId, id, idEtapa, request));
    }

    @DeleteMapping("/{id}/etapas/{idEtapa}")
    public ResponseEntity<Void> excluirEtapa(@AuthenticationPrincipal Integer usuarioId,
                                             @PathVariable Integer id, @PathVariable Integer idEtapa) {
        service.excluirEtapa(usuarioId, id, idEtapa);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/etapas/{idEtapa}/dicas")
    public ResponseEntity<DicaResponse> criarDica(@AuthenticationPrincipal Integer usuarioId,
                                                  @PathVariable Integer id, @PathVariable Integer idEtapa,
                                                  @Valid @RequestBody DicaRequest request) {
        DicaResponse criada = service.criarDica(usuarioId, id, idEtapa, request);
        return ResponseEntity.created(URI.create("/receitas/" + id)).body(criada);
    }

    @PutMapping("/{id}/etapas/{idEtapa}/dicas/{idDica}")
    public ResponseEntity<DicaResponse> atualizarDica(@AuthenticationPrincipal Integer usuarioId,
                                                      @PathVariable Integer id, @PathVariable Integer idEtapa,
                                                      @PathVariable Integer idDica,
                                                      @Valid @RequestBody DicaRequest request) {
        return ResponseEntity.ok(service.atualizarDica(usuarioId, id, idEtapa, idDica, request));
    }

    @DeleteMapping("/{id}/etapas/{idEtapa}/dicas/{idDica}")
    public ResponseEntity<Void> excluirDica(@AuthenticationPrincipal Integer usuarioId,
                                            @PathVariable Integer id, @PathVariable Integer idEtapa,
                                            @PathVariable Integer idDica) {
        service.excluirDica(usuarioId, id, idEtapa, idDica);
        return ResponseEntity.noContent().build();
    }
}
