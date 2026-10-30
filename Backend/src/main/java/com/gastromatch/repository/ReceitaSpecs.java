package com.gastromatch.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.data.jpa.domain.Specification;

import com.gastromatch.dto.ReceitaFiltro;
import com.gastromatch.entity.IngredienteReceita;
import com.gastromatch.entity.Receita;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;

/** Monta a consulta da listagem de receitas a partir dos filtros informados. */
public final class ReceitaSpecs {

    private ReceitaSpecs() {
    }

    public static Specification<Receita> comFiltros(ReceitaFiltro f) {
        return (root, query, cb) -> {
            List<Predicate> condicoes = new ArrayList<>();

            if (f.texto() != null && !f.texto().isBlank()) {
                String padrao = "%" + escaparLike(f.texto().trim().toLowerCase(Locale.ROOT)) + "%";
                condicoes.add(cb.or(
                        cb.like(cb.lower(root.<String>get("nome")), padrao, '\\'),
                        cb.like(cb.lower(root.<String>get("descricao")), padrao, '\\')));
            }
            if (f.tempoMax() != null) {
                condicoes.add(cb.lessThanOrEqualTo(root.<Integer>get("tempoPreparo"), f.tempoMax()));
            }
            if (f.dificuldade() != null) {
                condicoes.add(cb.equal(root.get("dificuldade"), f.dificuldade()));
            }
            if (f.tipo() != null) {
                condicoes.add(cb.equal(root.get("tipo"), f.tipo()));
            }
            if (f.ocasiao() != null) {
                condicoes.add(cb.equal(root.get("ocasiao"), f.ocasiao()));
            }
            if (f.perfil() != null) {
                condicoes.add(cb.equal(root.get("perfil"), f.perfil()));
            }
            if (f.metodo() != null) {
                condicoes.add(cb.equal(root.get("metodoPreparo"), f.metodo()));
            }

            // "Ingredientes que tenho": a receita precisa ter ao menos um ingrediente
            // e NENHUM que esteja fora da lista informada.
            if (f.ingredientes() != null && !f.ingredientes().isEmpty()) {
                Subquery<Integer> temIngrediente = query.subquery(Integer.class);
                Root<IngredienteReceita> ir1 = temIngrediente.from(IngredienteReceita.class);
                temIngrediente.select(ir1.<Integer>get("id"))
                        .where(cb.equal(ir1.get("receita"), root));

                Subquery<Integer> faltando = query.subquery(Integer.class);
                Root<IngredienteReceita> ir2 = faltando.from(IngredienteReceita.class);
                faltando.select(ir2.<Integer>get("id"))
                        .where(cb.equal(ir2.get("receita"), root),
                                cb.not(ir2.get("ingrediente").<Integer>get("id").in(f.ingredientes())));

                condicoes.add(cb.exists(temIngrediente));
                condicoes.add(cb.not(cb.exists(faltando)));
            }

            return cb.and(condicoes.toArray(new Predicate[0]));
        };
    }

    // % e _ digitados pela pessoa devem valer como texto comum, não como curinga.
    private static String escaparLike(String texto) {
        return texto.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}