package com.gastromatch.repository;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import com.gastromatch.entity.Restaurante;

import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;

/** Monta a consulta do diretório de restaurantes. Todos os filtros são opcionais e se combinam (E). */
public final class RestauranteSpecs {

    private RestauranteSpecs() {
    }

    /**
     * @param texto  trecho do nome ou da bio
     * @param cidade trecho do nome da cidade
     * @param bairro trecho do nome do bairro
     * @param estado trecho do nome ou sigla do estado
     */
    public static Specification<Restaurante> comFiltros(String texto, String cidade, String bairro, String estado) {
        return (root, query, cb) -> {
            List<Predicate> condicoes = new ArrayList<>();

            if (preenchido(texto)) {
                String padrao = BuscaTexto.padraoContem(texto);
                condicoes.add(cb.or(
                        cb.like(semAcento(cb, root.<String>get("nome")), padrao, '\\'),
                        cb.like(semAcento(cb, root.<String>get("bio")), padrao, '\\')));
            }
            if (preenchido(cidade)) {
                condicoes.add(cb.like(semAcento(cb, root.<String>get("cidade")),
                        BuscaTexto.padraoContem(cidade), '\\'));
            }
            if (preenchido(bairro)) {
                condicoes.add(cb.like(semAcento(cb, root.<String>get("bairro")),
                        BuscaTexto.padraoContem(bairro), '\\'));
            }
            if (preenchido(estado)) {
                condicoes.add(cb.like(semAcento(cb, root.<String>get("estado")),
                        BuscaTexto.padraoContem(estado), '\\'));
            }
            return cb.and(condicoes.toArray(new Predicate[0]));
        };
    }

    private static boolean preenchido(String valor) {
        return valor != null && !valor.isBlank();
    }

    // Mesmo tratamento do BuscaTexto: minúsculo e sem acento, pela extensão unaccent do PostgreSQL.
    private static Expression<String> semAcento(jakarta.persistence.criteria.CriteriaBuilder cb,
                                                Expression<String> coluna) {
        return cb.function("unaccent", String.class, cb.lower(coluna));
    }
}
