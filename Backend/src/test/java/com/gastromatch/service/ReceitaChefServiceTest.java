package com.gastromatch.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.gastromatch.dto.EtapaRequest;
import com.gastromatch.dto.IngredienteReceitaRequest;
import com.gastromatch.dto.ReceitaRequest;
import com.gastromatch.entity.Chef;
import com.gastromatch.entity.EtapaReceita;
import com.gastromatch.entity.Receita;
import com.gastromatch.entity.enums.Dificuldade;
import com.gastromatch.entity.enums.TipoRefeicao;
import com.gastromatch.entity.enums.UnidadeMedida;
import com.gastromatch.exception.AcessoNegadoException;
import com.gastromatch.exception.EtapaNaoEncontradaException;
import com.gastromatch.exception.ReceitaNaoEncontradaException;
import com.gastromatch.exception.RequisicaoInvalidaException;
import com.gastromatch.repository.DicaRepository;
import com.gastromatch.repository.EtapaReceitaRepository;
import com.gastromatch.repository.IngredienteReceitaRepository;
import com.gastromatch.repository.IngredienteRepository;
import com.gastromatch.repository.ReceitaRepository;

/** A regra central do bloco: só o chef dono mexe na receita. Sem banco (tudo falso). */
@ExtendWith(MockitoExtension.class)
class ReceitaChefServiceTest {

    private static final int USUARIO = 10;

    @Mock ChefService chefService;
    @Mock ReceitaService receitaService;
    @Mock ReceitaRepository receitaRepository;
    @Mock EtapaReceitaRepository etapaRepository;
    @Mock DicaRepository dicaRepository;
    @Mock IngredienteRepository ingredienteRepository;
    @Mock IngredienteReceitaRepository ingredienteReceitaRepository;

    private ReceitaChefService service;
    private Chef chefLogado;
    private Chef outroChef;

    @BeforeEach
    void montar() {
        service = new ReceitaChefService(chefService, receitaService, receitaRepository, etapaRepository,
                dicaRepository, ingredienteRepository, ingredienteReceitaRepository);
        chefLogado = chefComId(1);
        outroChef = chefComId(2);
    }

    @Test
    void naoDonoNaoAtualizaReceita() {
        receitaDoChef(outroChef, 5);
        when(chefService.chefDoUsuario(USUARIO)).thenReturn(chefLogado);

        assertThrows(AcessoNegadoException.class, () -> service.atualizar(USUARIO, 5, receitaValida()));
        verify(receitaRepository, never()).saveAndFlush(any());
        verify(ingredienteReceitaRepository, never()).apagarPorReceita(any());
    }

    @Test
    void naoDonoNaoExcluiReceita() {
        receitaDoChef(outroChef, 5);
        when(chefService.chefDoUsuario(USUARIO)).thenReturn(chefLogado);

        assertThrows(AcessoNegadoException.class, () -> service.excluir(USUARIO, 5));
        verify(receitaRepository, never()).delete(any(Receita.class));
    }

    @Test
    void naoDonoNaoCriaEtapa() {
        receitaDoChef(outroChef, 5);
        when(chefService.chefDoUsuario(USUARIO)).thenReturn(chefLogado);

        assertThrows(AcessoNegadoException.class,
                () -> service.criarEtapa(USUARIO, 5, new EtapaRequest(null, "t", "i", null, null)));
        verify(etapaRepository, never()).save(any());
    }

    @Test
    void donoExcluiAPropriaReceita() {
        Receita receita = receitaDoChef(chefLogado, 5);
        when(chefService.chefDoUsuario(USUARIO)).thenReturn(chefLogado);

        service.excluir(USUARIO, 5);

        verify(receitaRepository).delete(receita);
    }

    @Test
    void receitaInexistenteDa404() {
        when(chefService.chefDoUsuario(USUARIO)).thenReturn(chefLogado);
        when(receitaRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(ReceitaNaoEncontradaException.class, () -> service.excluir(USUARIO, 99));
    }

    @Test
    void contaSemPerfilDeChefNaoCriaReceita() {
        when(chefService.chefDoUsuario(USUARIO)).thenThrow(new AcessoNegadoException("sem perfil"));

        assertThrows(AcessoNegadoException.class, () -> service.criar(USUARIO, receitaValida()));
        verify(receitaRepository, never()).save(any());
    }

    @Test
    void ingredienteRepetidoEhRecusadoAntesDeGravar() {
        when(chefService.chefDoUsuario(USUARIO)).thenReturn(chefLogado);
        var repetidos = List.of(
                new IngredienteReceitaRequest(3, 1f, UnidadeMedida.G),
                new IngredienteReceitaRequest(3, 2f, UnidadeMedida.G));
        var request = new ReceitaRequest("Bolo", null, null, null, 2, Dificuldade.FACIL, TipoRefeicao.LANCHE,
                null, null, 10, null, repetidos);

        assertThrows(RequisicaoInvalidaException.class, () -> service.criar(USUARIO, request));
        verify(receitaRepository, never()).save(any());
    }

    @Test
    void ingredienteInexistenteEhRecusado() {
        when(chefService.chefDoUsuario(USUARIO)).thenReturn(chefLogado);
        when(ingredienteRepository.findAllById(any())).thenReturn(List.of());

        assertThrows(RequisicaoInvalidaException.class, () -> service.criar(USUARIO, receitaValida()));
        verify(receitaRepository, never()).save(any());
    }

    @Test
    void etapaDeOutraReceitaNaoEhAcessivelPelaRotaDaMinha() {
        receitaDoChef(chefLogado, 5);
        when(chefService.chefDoUsuario(USUARIO)).thenReturn(chefLogado);
        Receita outraReceita = receitaDoChef(chefLogado, 6);
        EtapaReceita etapa = new EtapaReceita();
        etapa.setReceita(outraReceita);
        when(etapaRepository.findById(7)).thenReturn(Optional.of(etapa));

        assertThrows(EtapaNaoEncontradaException.class, () -> service.excluirEtapa(USUARIO, 5, 7));
        verify(etapaRepository, never()).delete(any());
    }

    // ----------------------------------------------------------- apoio

    private static Chef chefComId(int id) {
        Chef chef = new Chef();
        ReflectionTestUtils.setField(chef, "id", id);
        return chef;
    }

    private Receita receitaDoChef(Chef dono, int idReceita) {
        Receita receita = new Receita();
        ReflectionTestUtils.setField(receita, "id", idReceita);
        receita.setChef(dono);
        // lenient: nem todo teste chega a buscar a receita (ex.: o de ingrediente repetido).
        org.mockito.Mockito.lenient().when(receitaRepository.findById(idReceita)).thenReturn(Optional.of(receita));
        return receita;
    }

    private static ReceitaRequest receitaValida() {
        return new ReceitaRequest("Bolo", null, null, null, 2, Dificuldade.FACIL, TipoRefeicao.LANCHE,
                null, null, 10, null, List.of(new IngredienteReceitaRequest(3, 1f, UnidadeMedida.G)));
    }
}
