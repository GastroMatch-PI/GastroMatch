package com.gastromatch.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.gastromatch.dto.CadastroChefRequest;
import com.gastromatch.dto.ChefResponse;
import com.gastromatch.entity.Chef;
import com.gastromatch.entity.Profissional;
import com.gastromatch.entity.Usuario;
import com.gastromatch.entity.enums.Especializacao;
import com.gastromatch.entity.enums.RoleProfissional;
import com.gastromatch.exception.AcessoNegadoException;
import com.gastromatch.exception.ConflitoException;
import com.gastromatch.repository.ChefRepository;
import com.gastromatch.repository.ProfissionalRepository;
import com.gastromatch.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class ChefServiceTest {

    private static final int USUARIO = 10;

    @Mock UsuarioRepository usuarioRepository;
    @Mock ProfissionalRepository profissionalRepository;
    @Mock ChefRepository chefRepository;

    private ChefService service;
    private Usuario usuario;

    @BeforeEach
    void montar() {
        service = new ChefService(usuarioRepository, profissionalRepository, chefRepository);
        usuario = new Usuario();
        ReflectionTestUtils.setField(usuario, "id", USUARIO);
    }

    @Test
    void criaProfissionalComRoleChefELigaAConta() {
        when(usuarioRepository.buscarComBloqueio(USUARIO)).thenReturn(Optional.of(usuario));
        when(profissionalRepository.save(any(Profissional.class))).thenAnswer(i -> {
            Profissional p = i.getArgument(0);
            ReflectionTestUtils.setField(p, "id", 7);
            return p;
        });
        when(chefRepository.save(any(Chef.class))).thenAnswer(i -> i.getArgument(0));

        ChefResponse resposta = service.criarPerfil(USUARIO,
                new CadastroChefRequest("  Cozinheiro  ", Especializacao.MASSAS));

        ArgumentCaptor<Profissional> salvo = ArgumentCaptor.forClass(Profissional.class);
        verify(profissionalRepository).save(salvo.capture());
        // O role não vem da requisição: é sempre CHEF.
        assertEquals(RoleProfissional.CHEF, salvo.getValue().getRole());
        assertEquals("Cozinheiro", salvo.getValue().getBio());
        assertEquals(7, usuario.getIdProfissional());
        assertEquals(7, resposta.idProfissional());
    }

    @Test
    void contaQueJaTemPerfilNaoCriaOutro() {
        usuario.setIdProfissional(3);
        when(usuarioRepository.buscarComBloqueio(USUARIO)).thenReturn(Optional.of(usuario));

        assertThrows(ConflitoException.class,
                () -> service.criarPerfil(USUARIO, new CadastroChefRequest(null, null)));
        verify(profissionalRepository, never()).save(any());
    }

    @Test
    void contaSemPerfilNaoEChef() {
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));

        assertThrows(AcessoNegadoException.class, () -> service.chefDoUsuario(USUARIO));
    }

    @Test
    void profissionalComRoleDiferenteDeChefNaoEChef() {
        usuario.setIdProfissional(3);
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));
        Chef chef = new Chef(new Profissional(RoleProfissional.NUTRICIONISTA, null), null);
        when(chefRepository.findByProfissionalId(3)).thenReturn(Optional.of(chef));

        assertThrows(AcessoNegadoException.class, () -> service.chefDoUsuario(USUARIO));
    }

    @Test
    void chefValidoEDevolvido() {
        usuario.setIdProfissional(3);
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));
        Chef chef = new Chef(new Profissional(RoleProfissional.CHEF, null), null);
        when(chefRepository.findByProfissionalId(3)).thenReturn(Optional.of(chef));

        assertEquals(chef, service.chefDoUsuario(USUARIO));
    }
}
