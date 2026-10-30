package com.gastromatch.service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gastromatch.dto.DicaResponse;
import com.gastromatch.dto.EtapaResponse;
import com.gastromatch.dto.IngredienteDaReceitaResponse;
import com.gastromatch.dto.PaginaResponse;
import com.gastromatch.dto.ReceitaDetalheResponse;
import com.gastromatch.dto.ReceitaFiltro;
import com.gastromatch.dto.ReceitaResumoResponse;
import com.gastromatch.entity.Dica;
import com.gastromatch.entity.EtapaReceita;
import com.gastromatch.entity.Receita;
import com.gastromatch.entity.Usuario;
import com.gastromatch.exception.ReceitaNaoEncontradaException;
import com.gastromatch.repository.DicaRepository;
import com.gastromatch.repository.EtapaReceitaRepository;
import com.gastromatch.repository.IngredienteReceitaRepository;
import com.gastromatch.repository.ReceitaRepository;
import com.gastromatch.repository.ReceitaSpecs;
import com.gastromatch.repository.UsuarioRepository;

/** Leitura de receitas (rotas públicas). A escrita, só para chefs, fica no ReceitaChefService. */
@Service
public class ReceitaService {

    private final ReceitaRepository receitaRepository;
    private final EtapaReceitaRepository etapaRepository;
    private final DicaRepository dicaRepository;
    private final IngredienteReceitaRepository ingredienteReceitaRepository;
    private final UsuarioRepository usuarioRepository;

    public ReceitaService(ReceitaRepository receitaRepository,
                          EtapaReceitaRepository etapaRepository,
                          DicaRepository dicaRepository,
                          IngredienteReceitaRepository ingredienteReceitaRepository,
                          UsuarioRepository usuarioRepository) {
        this.receitaRepository = receitaRepository;
        this.etapaRepository = etapaRepository;
        this.dicaRepository = dicaRepository;
        this.ingredienteReceitaRepository = ingredienteReceitaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public PaginaResponse<ReceitaResumoResponse> listar(ReceitaFiltro filtro, Pageable pageable) {
        Page<Receita> pagina = receitaRepository.findAll(ReceitaSpecs.comFiltros(filtro), pageable);
        return PaginaResponse.de(resumir(pagina));
    }

    /** Converte uma página de receitas em resumos, buscando os usernames dos chefs de uma vez. */
    @Transactional(readOnly = true)
    public Page<ReceitaResumoResponse> resumir(Page<Receita> pagina) {
        Map<Integer, String> usernames = usernamesDosChefs(pagina.getContent());
        return pagina.map(r -> ReceitaResumoResponse.de(
                r, usernames.get(r.getChef().getProfissional().getId())));
    }

    @Transactional(readOnly = true)
    public ReceitaDetalheResponse detalhar(Integer id) {
        Receita receita = receitaRepository.buscarComChef(id)
                .orElseThrow(ReceitaNaoEncontradaException::new);

        // Três consultas fixas, não importa quantas etapas a receita tenha.
        List<IngredienteDaReceitaResponse> ingredientes =
                ingredienteReceitaRepository.buscarPorReceita(id).stream()
                        .map(IngredienteDaReceitaResponse::de).toList();

        Map<Integer, List<DicaResponse>> dicasPorEtapa = new HashMap<>();
        for (Dica dica : dicaRepository.buscarPorReceita(id)) {
            dicasPorEtapa.computeIfAbsent(dica.getEtapaReceita().getId(), k -> new ArrayList<>())
                    .add(DicaResponse.de(dica));
        }

        List<EtapaResponse> etapas = etapaRepository.findByReceitaIdOrderByOrdemAscIdAsc(id).stream()
                .map((EtapaReceita e) -> EtapaResponse.de(e, dicasPorEtapa.getOrDefault(e.getId(), List.of())))
                .toList();

        String username = usernamesDosChefs(List.of(receita)).get(receita.getChef().getProfissional().getId());
        return ReceitaDetalheResponse.de(receita, username, ingredientes, etapas);
    }

    // idProfissional -> username da conta ligada a ele.
    private Map<Integer, String> usernamesDosChefs(Collection<Receita> receitas) {
        List<Integer> idsProfissional = receitas.stream()
                .map(r -> r.getChef().getProfissional().getId())
                .distinct().toList();
        Map<Integer, String> usernames = new HashMap<>();
        if (!idsProfissional.isEmpty()) {
            for (Usuario u : usuarioRepository.findByIdProfissionalIn(idsProfissional)) {
                usernames.put(u.getIdProfissional(), u.getUsername());
            }
        }
        return usernames;
    }
}
