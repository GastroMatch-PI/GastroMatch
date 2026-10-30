package com.gastromatch.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gastromatch.dto.PaginaResponse;
import com.gastromatch.dto.ReceitaResumoResponse;
import com.gastromatch.entity.Favorito;
import com.gastromatch.exception.ReceitaNaoEncontradaException;
import com.gastromatch.repository.FavoritoRepository;
import com.gastromatch.repository.ReceitaRepository;
import com.gastromatch.repository.UsuarioRepository;

@Service
public class FavoritoService {

    private final FavoritoRepository favoritoRepository;
    private final ReceitaRepository receitaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ReceitaService receitaService;

    public FavoritoService(FavoritoRepository favoritoRepository,
                           ReceitaRepository receitaRepository,
                           UsuarioRepository usuarioRepository,
                           ReceitaService receitaService) {
        this.favoritoRepository = favoritoRepository;
        this.receitaRepository = receitaRepository;
        this.usuarioRepository = usuarioRepository;
        this.receitaService = receitaService;
    }

    /**
     * Idempotente: favoritar de novo não dá erro. De propósito SEM @Transactional: se dois
     * pedidos simultâneos passarem da checagem, o UNIQUE do banco recusa o segundo e aqui
     * ele é tratado como "já estava favoritado". Dentro de uma transação, essa exceção
     * condenaria o commit.
     */
    public void favoritar(Integer usuarioId, Integer idReceita) {
        var receita = receitaRepository.findById(idReceita).orElseThrow(ReceitaNaoEncontradaException::new);
        if (favoritoRepository.existsByUsuarioIdAndReceitaId(usuarioId, idReceita)) {
            return;
        }
        try {
            favoritoRepository.save(new Favorito(usuarioRepository.getReferenceById(usuarioId), receita));
        } catch (DataIntegrityViolationException jaFavoritada) {
            // Outra requisição favoritou primeiro: o resultado desejado já existe.
        }
    }

    /** Idempotente: desfavoritar o que não está favoritado não dá erro. */
    @Transactional
    public void desfavoritar(Integer usuarioId, Integer idReceita) {
        favoritoRepository.deleteByUsuarioIdAndReceitaId(usuarioId, idReceita);
    }

    @Transactional(readOnly = true)
    public PaginaResponse<ReceitaResumoResponse> listar(Integer usuarioId, Pageable pageable) {
        return PaginaResponse.de(receitaService.resumir(favoritoRepository.receitasFavoritas(usuarioId, pageable)));
    }
}
