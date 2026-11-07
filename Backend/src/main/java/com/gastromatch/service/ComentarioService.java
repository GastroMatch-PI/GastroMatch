package com.gastromatch.service;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gastromatch.dto.AvaliacaoResponse;
import com.gastromatch.dto.ComentarioRequest;
import com.gastromatch.dto.ComentarioResponse;
import com.gastromatch.dto.ComentariosDaReceitaResponse;
import com.gastromatch.dto.PaginaResponse;
import com.gastromatch.entity.Comentario;
import com.gastromatch.exception.AcessoNegadoException;
import com.gastromatch.exception.ComentarioNaoEncontradoException;
import com.gastromatch.exception.ReceitaNaoEncontradaException;
import com.gastromatch.exception.UsuarioNaoEncontradoException;
import com.gastromatch.repository.ComentarioRepository;
import com.gastromatch.repository.ReceitaRepository;
import com.gastromatch.repository.UsuarioRepository;

import jakarta.persistence.EntityManager;

/** Comentários e notas: leitura pública, escrita só do próprio autor logado. */
@Service
public class ComentarioService {

    private final ComentarioRepository comentarioRepository;
    private final ReceitaRepository receitaRepository;
    private final UsuarioRepository usuarioRepository;
    private final EntityManager entityManager;

    public ComentarioService(ComentarioRepository comentarioRepository,
                             ReceitaRepository receitaRepository,
                             UsuarioRepository usuarioRepository,
                             EntityManager entityManager) {
        this.comentarioRepository = comentarioRepository;
        this.receitaRepository = receitaRepository;
        this.usuarioRepository = usuarioRepository;
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public ComentariosDaReceitaResponse listar(Integer idReceita, Pageable pageable) {
        if (!receitaRepository.existsById(idReceita)) {
            throw new ReceitaNaoEncontradaException();
        }
        PaginaResponse<ComentarioResponse> pagina = PaginaResponse.de(
                comentarioRepository.findByReceitaId(idReceita, pageable).map(ComentarioResponse::de));
        return new ComentariosDaReceitaResponse(pagina, agregarAvaliacoes(idReceita));
    }

    /** Média (ignora comentário sem nota) e quantidade de notas da receita. */
    @Transactional(readOnly = true)
    public AvaliacaoResponse agregarAvaliacoes(Integer idReceita) {
        ComentarioRepository.NotaAgregada agregado = comentarioRepository.agregarNotas(idReceita);
        if (agregado == null || agregado.getQuantidade() == 0) {
            return AvaliacaoResponse.SEM_AVALIACOES;
        }
        return new AvaliacaoResponse(agregado.getMedia().floatValue(), agregado.getQuantidade());
    }

    @Transactional
    public ComentarioResponse criar(Integer usuarioId, Integer idReceita, ComentarioRequest request) {
        var receita = receitaRepository.findById(idReceita).orElseThrow(ReceitaNaoEncontradaException::new);
        var usuario = usuarioRepository.findById(usuarioId).orElseThrow(UsuarioNaoEncontradoException::new);

        Comentario novo = new Comentario(receita, usuario, request.texto().trim(), request.nota());
        novo.setFoto(fotoOuNulo(request.foto()));
        return comRegistroDoBanco(comentarioRepository.save(novo));
    }

    @Transactional
    public ComentarioResponse atualizar(Integer usuarioId, Integer idComentario, ComentarioRequest request) {
        Comentario comentario = comentarioDoAutor(usuarioId, idComentario);
        comentario.setTexto(request.texto().trim());
        comentario.setNota(request.nota());
        comentario.setFoto(fotoOuNulo(request.foto()));
        return comRegistroDoBanco(comentarioRepository.save(comentario));
    }

    // Foto em branco vira "sem foto".
    private static String fotoOuNulo(String foto) {
        return (foto == null || foto.isBlank()) ? null : foto.trim();
    }

    @Transactional
    public void excluir(Integer usuarioId, Integer idComentario) {
        comentarioRepository.delete(comentarioDoAutor(usuarioId, idComentario));
    }

    // 404 se não existe; 403 se é de outra pessoa.
    private Comentario comentarioDoAutor(Integer usuarioId, Integer idComentario) {
        Comentario comentario = comentarioRepository.findById(idComentario)
                .orElseThrow(ComentarioNaoEncontradoException::new);
        if (!comentario.getUsuario().getId().equals(usuarioId)) {
            throw new AcessoNegadoException("Você só pode alterar os seus próprios comentários");
        }
        return comentario;
    }

    // criado_em e atualizado_em são preenchidos pelo banco: relê a linha para devolvê-los.
    private ComentarioResponse comRegistroDoBanco(Comentario comentario) {
        entityManager.flush();
        entityManager.refresh(comentario);
        return ComentarioResponse.de(comentario);
    }
}
