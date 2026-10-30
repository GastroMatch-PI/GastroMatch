package com.gastromatch.service;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gastromatch.dto.DicaRequest;
import com.gastromatch.dto.DicaResponse;
import com.gastromatch.dto.EtapaRequest;
import com.gastromatch.dto.EtapaResponse;
import com.gastromatch.dto.IngredienteReceitaRequest;
import com.gastromatch.dto.ReceitaDetalheResponse;
import com.gastromatch.dto.ReceitaRequest;
import com.gastromatch.entity.Chef;
import com.gastromatch.entity.Dica;
import com.gastromatch.entity.EtapaReceita;
import com.gastromatch.entity.Ingrediente;
import com.gastromatch.entity.IngredienteReceita;
import com.gastromatch.entity.Receita;
import com.gastromatch.exception.AcessoNegadoException;
import com.gastromatch.exception.DicaNaoEncontradaException;
import com.gastromatch.exception.EtapaNaoEncontradaException;
import com.gastromatch.exception.ReceitaNaoEncontradaException;
import com.gastromatch.exception.RequisicaoInvalidaException;
import com.gastromatch.repository.DicaRepository;
import com.gastromatch.repository.EtapaReceitaRepository;
import com.gastromatch.repository.IngredienteReceitaRepository;
import com.gastromatch.repository.IngredienteRepository;
import com.gastromatch.repository.ReceitaRepository;

/**
 * Escrita de receitas, etapas e dicas. Toda operação passa por receitaDoChef(): só o
 * chef dono (receita.id_chef igual ao chef da conta logada) pode alterar.
 */
@Service
public class ReceitaChefService {

    private final ChefService chefService;
    private final ReceitaService receitaService;
    private final ReceitaRepository receitaRepository;
    private final EtapaReceitaRepository etapaRepository;
    private final DicaRepository dicaRepository;
    private final IngredienteRepository ingredienteRepository;
    private final IngredienteReceitaRepository ingredienteReceitaRepository;

    public ReceitaChefService(ChefService chefService,
                              ReceitaService receitaService,
                              ReceitaRepository receitaRepository,
                              EtapaReceitaRepository etapaRepository,
                              DicaRepository dicaRepository,
                              IngredienteRepository ingredienteRepository,
                              IngredienteReceitaRepository ingredienteReceitaRepository) {
        this.chefService = chefService;
        this.receitaService = receitaService;
        this.receitaRepository = receitaRepository;
        this.etapaRepository = etapaRepository;
        this.dicaRepository = dicaRepository;
        this.ingredienteRepository = ingredienteRepository;
        this.ingredienteReceitaRepository = ingredienteReceitaRepository;
    }

    // ---------------------------------------------------------------- receita

    @Transactional
    public ReceitaDetalheResponse criar(Integer usuarioId, ReceitaRequest request) {
        Chef chef = chefService.chefDoUsuario(usuarioId);
        Map<Integer, Ingrediente> catalogo = ingredientesDoCatalogo(request.ingredientes());

        Receita receita = new Receita();
        receita.setChef(chef);
        aplicar(receita, request);
        receita = receitaRepository.save(receita);

        salvarIngredientes(receita, request.ingredientes(), catalogo);
        return receitaService.detalhar(receita.getId());
    }

    /** Substitui os dados e a lista de ingredientes. Etapas e dicas não são tocadas. */
    @Transactional
    public ReceitaDetalheResponse atualizar(Integer usuarioId, Integer idReceita, ReceitaRequest request) {
        Receita receita = receitaDoChef(usuarioId, idReceita);
        Map<Integer, Ingrediente> catalogo = ingredientesDoCatalogo(request.ingredientes());

        aplicar(receita, request);
        receitaRepository.saveAndFlush(receita);

        ingredienteReceitaRepository.apagarPorReceita(idReceita);
        salvarIngredientes(receitaRepository.getReferenceById(idReceita), request.ingredientes(), catalogo);
        return receitaService.detalhar(idReceita);
    }

    /** Etapas, dicas, ingredientes, comentários e favoritos saem junto (ON DELETE CASCADE no banco). */
    @Transactional
    public void excluir(Integer usuarioId, Integer idReceita) {
        receitaRepository.delete(receitaDoChef(usuarioId, idReceita));
    }

    // ----------------------------------------------------------------- etapa

    @Transactional
    public EtapaResponse criarEtapa(Integer usuarioId, Integer idReceita, EtapaRequest request) {
        Receita receita = receitaDoChef(usuarioId, idReceita);

        EtapaReceita etapa = new EtapaReceita();
        etapa.setReceita(receita);
        // Sem ordem informada, a etapa vai para o fim.
        etapa.setOrdem(request.ordem() != null ? request.ordem() : etapaRepository.maiorOrdem(idReceita) + 1);
        aplicar(etapa, request);
        return EtapaResponse.de(etapaRepository.save(etapa), List.of());
    }

    @Transactional
    public EtapaResponse atualizarEtapa(Integer usuarioId, Integer idReceita, Integer idEtapa, EtapaRequest request) {
        receitaDoChef(usuarioId, idReceita);
        EtapaReceita etapa = etapaDaReceita(idReceita, idEtapa);

        if (request.ordem() != null) {
            etapa.setOrdem(request.ordem());
        }
        aplicar(etapa, request);
        List<DicaResponse> dicas = dicaRepository.buscarPorReceita(idReceita).stream()
                .filter(d -> d.getEtapaReceita().getId().equals(idEtapa))
                .map(DicaResponse::de).toList();
        return EtapaResponse.de(etapa, dicas);
    }

    /** As dicas da etapa saem junto (ON DELETE CASCADE no banco). */
    @Transactional
    public void excluirEtapa(Integer usuarioId, Integer idReceita, Integer idEtapa) {
        receitaDoChef(usuarioId, idReceita);
        etapaRepository.delete(etapaDaReceita(idReceita, idEtapa));
    }

    // ------------------------------------------------------------------ dica

    @Transactional
    public DicaResponse criarDica(Integer usuarioId, Integer idReceita, Integer idEtapa, DicaRequest request) {
        Receita receita = receitaDoChef(usuarioId, idReceita);
        EtapaReceita etapa = etapaDaReceita(idReceita, idEtapa);

        Dica dica = new Dica();
        dica.setEtapaReceita(etapa);
        // O autor é o chef dono da receita (o mesmo que passou na checagem).
        dica.setChef(receita.getChef());
        dica.setTipo(request.tipo());
        dica.setConteudo(request.conteudo().trim());
        return DicaResponse.de(dicaRepository.save(dica));
    }

    @Transactional
    public DicaResponse atualizarDica(Integer usuarioId, Integer idReceita, Integer idEtapa,
                                      Integer idDica, DicaRequest request) {
        receitaDoChef(usuarioId, idReceita);
        etapaDaReceita(idReceita, idEtapa);
        Dica dica = dicaDaEtapa(idEtapa, idDica);

        dica.setTipo(request.tipo());
        dica.setConteudo(request.conteudo().trim());
        return DicaResponse.de(dica);
    }

    @Transactional
    public void excluirDica(Integer usuarioId, Integer idReceita, Integer idEtapa, Integer idDica) {
        receitaDoChef(usuarioId, idReceita);
        etapaDaReceita(idReceita, idEtapa);
        dicaRepository.delete(dicaDaEtapa(idEtapa, idDica));
    }

    // --------------------------------------------------------------- apoio

    // 404 se a receita não existe; 403 se existe mas é de outro chef.
    private Receita receitaDoChef(Integer usuarioId, Integer idReceita) {
        Chef chef = chefService.chefDoUsuario(usuarioId);
        Receita receita = receitaRepository.findById(idReceita)
                .orElseThrow(ReceitaNaoEncontradaException::new);
        if (!receita.getChef().getId().equals(chef.getId())) {
            throw new AcessoNegadoException("Você só pode alterar as suas próprias receitas");
        }
        return receita;
    }

    // A etapa precisa ser desta receita: impede mexer na etapa de outra receita pela rota da sua.
    private EtapaReceita etapaDaReceita(Integer idReceita, Integer idEtapa) {
        return etapaRepository.findById(idEtapa)
                .filter(e -> e.getReceita().getId().equals(idReceita))
                .orElseThrow(EtapaNaoEncontradaException::new);
    }

    private Dica dicaDaEtapa(Integer idEtapa, Integer idDica) {
        return dicaRepository.findById(idDica)
                .filter(d -> d.getEtapaReceita().getId().equals(idEtapa))
                .orElseThrow(DicaNaoEncontradaException::new);
    }

    private static void aplicar(Receita receita, ReceitaRequest r) {
        receita.setNome(r.nome().trim());
        receita.setDescricao(vazioParaNulo(r.descricao()));
        receita.setImagem(vazioParaNulo(r.imagem()));
        receita.setVideoUrl(vazioParaNulo(r.videoUrl()));
        receita.setNPorcoes(r.nPorcoes());
        receita.setDificuldade(r.dificuldade());
        receita.setTipo(r.tipo());
        receita.setMetodoPreparo(r.metodoPreparo());
        receita.setOcasiao(r.ocasiao());
        receita.setTempoPreparo(r.tempoPreparo());
        receita.setPerfil(r.perfil());
    }

    private static void aplicar(EtapaReceita etapa, EtapaRequest r) {
        etapa.setTitulo(r.titulo().trim());
        etapa.setInstrucao(r.instrucao().trim());
        etapa.setTimestampVideo(r.timestampVideo());
        etapa.setImagem(vazioParaNulo(r.imagem()));
    }

    // Garante que os ingredientes existem e que nenhum se repete. Roda ANTES de gravar.
    private Map<Integer, Ingrediente> ingredientesDoCatalogo(List<IngredienteReceitaRequest> pedidos) {
        Set<Integer> vistos = new HashSet<>();
        for (IngredienteReceitaRequest p : pedidos) {
            if (!vistos.add(p.idIngrediente())) {
                throw new RequisicaoInvalidaException("Ingrediente repetido na receita: " + p.idIngrediente());
            }
        }
        Map<Integer, Ingrediente> encontrados = ingredienteRepository.findAllById(vistos).stream()
                .collect(Collectors.toMap(Ingrediente::getId, Function.identity()));
        for (Integer id : vistos) {
            if (!encontrados.containsKey(id)) {
                throw new RequisicaoInvalidaException("Ingrediente não encontrado: " + id);
            }
        }
        return encontrados;
    }

    private void salvarIngredientes(Receita receita, List<IngredienteReceitaRequest> pedidos,
                                    Map<Integer, Ingrediente> catalogo) {
        List<IngredienteReceita> linhas = pedidos.stream()
                .map(p -> new IngredienteReceita(
                        receita, catalogo.get(p.idIngrediente()), p.quantidade(), p.unidadeMedida()))
                .toList();
        ingredienteReceitaRepository.saveAll(linhas);
    }

    private static String vazioParaNulo(String texto) {
        return (texto == null || texto.isBlank()) ? null : texto.trim();
    }
}
