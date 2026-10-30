package com.gastromatch.controller;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gastromatch.dto.PaginaResponse;
import com.gastromatch.dto.ReceitaDetalheResponse;
import com.gastromatch.dto.ReceitaFiltro;
import com.gastromatch.dto.ReceitaResumoResponse;
import com.gastromatch.entity.enums.Dificuldade;
import com.gastromatch.entity.enums.MetodoPreparo;
import com.gastromatch.entity.enums.Ocasiao;
import com.gastromatch.entity.enums.PerfilAlimentar;
import com.gastromatch.entity.enums.TipoRefeicao;
import com.gastromatch.service.ReceitaService;

/** Leitura pública de receitas (não exige login). */
@RestController
@RequestMapping("/receitas")
public class ReceitaController {

    static final int TAMANHO_MAXIMO = 50;

    private final ReceitaService receitaService;

    public ReceitaController(ReceitaService receitaService) {
        this.receitaService = receitaService;
    }

    @GetMapping
    public ResponseEntity<PaginaResponse<ReceitaResumoResponse>> listar(
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) Integer tempoMax,
            @RequestParam(required = false) Dificuldade dificuldade,
            @RequestParam(required = false) TipoRefeicao tipo,
            @RequestParam(required = false) Ocasiao ocasiao,
            @RequestParam(required = false) PerfilAlimentar perfil,
            @RequestParam(required = false) MetodoPreparo metodo,
            @RequestParam(required = false) List<Integer> ingredientes,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {

        ReceitaFiltro filtro = new ReceitaFiltro(
                texto, tempoMax, dificuldade, tipo, ocasiao, perfil, metodo, ingredientes);
        // Limita o tamanho da página para ninguém pedir a tabela inteira de uma vez.
        var pageable = PageRequest.of(
                Math.max(pagina, 0), Math.min(Math.max(tamanho, 1), TAMANHO_MAXIMO),
                Sort.by(Sort.Direction.DESC, "criadoEm", "id"));
        return ResponseEntity.ok(receitaService.listar(filtro, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReceitaDetalheResponse> detalhar(@PathVariable Integer id) {
        return ResponseEntity.ok(receitaService.detalhar(id));
    }
}
