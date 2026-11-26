package com.gastromatch.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gastromatch.dto.IngredienteRequest;
import com.gastromatch.dto.IngredienteResponse;
import com.gastromatch.entity.Ingrediente;
import com.gastromatch.exception.ConflitoException;
import com.gastromatch.exception.RecursoNaoEncontradoException;
import com.gastromatch.repository.IngredienteReceitaRepository;
import com.gastromatch.repository.IngredienteRepository;

/** Catálogo de ingredientes: leitura pública, escrita restrita a ADMIN (ver SecurityConfig). */
@Service
public class IngredienteService {

    private final IngredienteRepository ingredienteRepository;
    private final IngredienteReceitaRepository ingredienteReceitaRepository;

    public IngredienteService(IngredienteRepository ingredienteRepository,
                              IngredienteReceitaRepository ingredienteReceitaRepository) {
        this.ingredienteRepository = ingredienteRepository;
        this.ingredienteReceitaRepository = ingredienteReceitaRepository;
    }

    /** Catálogo em ordem alfabética; "nome" opcional filtra por trecho (sem diferenciar maiúscula nem acento). */
    @Transactional(readOnly = true)
    public List<IngredienteResponse> listar(String nome) {
        var ingredientes = (nome == null || nome.isBlank())
                ? ingredienteRepository.findAll(Sort.by("nome"))
                : ingredienteRepository.buscarPorNome(nome);
        return ingredientes.stream().map(IngredienteResponse::de).toList();
    }

    @Transactional
    public IngredienteResponse criar(IngredienteRequest request) {
        String nome = request.nome().trim();
        garantirNomeDisponivel(nome, null);

        Ingrediente novo = new Ingrediente();
        aplicar(novo, request, nome);
        return IngredienteResponse.de(ingredienteRepository.save(novo));
    }

    @Transactional
    public IngredienteResponse atualizar(Integer id, IngredienteRequest request) {
        Ingrediente ingrediente = buscarOu404(id);
        String nome = request.nome().trim();
        garantirNomeDisponivel(nome, id);

        aplicar(ingrediente, request, nome);
        return IngredienteResponse.de(ingrediente);
    }

    /** 409 amigável se o ingrediente estiver em uso (a FK também recusaria, mas sem mensagem clara). */
    @Transactional
    public void excluir(Integer id) {
        buscarOu404(id);
        if (ingredienteReceitaRepository.existsByIngredienteId(id)) {
            throw new ConflitoException("Este ingrediente está em uso em receitas e não pode ser excluído");
        }
        ingredienteRepository.deleteById(id);
    }

    private Ingrediente buscarOu404(Integer id) {
        return ingredienteRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Ingrediente não encontrado"));
    }

    private void garantirNomeDisponivel(String nome, Integer idExcluido) {
        if (ingredienteRepository.existeOutroComMesmoNome(nome, idExcluido)) {
            throw new ConflitoException("Já existe um ingrediente com esse nome");
        }
    }

    private static void aplicar(Ingrediente ingrediente, IngredienteRequest request, String nome) {
        ingrediente.setNome(nome);
        ingrediente.setPorcaoBase(request.porcaoBase());
        ingrediente.setCalorias(request.calorias());
        ingrediente.setGordura(request.gordura());
        ingrediente.setProteina(request.proteina());
        ingrediente.setCarboidrato(request.carboidrato());
    }
}
