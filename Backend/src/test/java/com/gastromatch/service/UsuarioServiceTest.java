package com.gastromatch.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.gastromatch.dto.AtualizarUsuarioRequest;
import com.gastromatch.dto.TrocaSenhaRequest;
import com.gastromatch.dto.UsuarioResponse;
import com.gastromatch.entity.Usuario;
import com.gastromatch.exception.RequisicaoInvalidaException;
import com.gastromatch.exception.UsernameJaCadastradoException;
import com.gastromatch.exception.UsuarioNaoEncontradoException;
import com.gastromatch.repository.RefreshTokenRepository;
import com.gastromatch.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    private static final int USUARIO = 10;

    @Mock UsuarioRepository usuarioRepository;
    @Mock RefreshTokenRepository refreshTokenRepository;

    // BCrypt real: o service confere o hash de verdade, não um mock de PasswordEncoder.
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private UsuarioService service;
    private Usuario usuario;

    @BeforeEach
    void montar() {
        service = new UsuarioService(usuarioRepository, refreshTokenRepository, passwordEncoder, "cdn.gastromatch.app");
        usuario = new Usuario();
        ReflectionTestUtils.setField(usuario, "id", USUARIO);
        usuario.setEmail("maria@gastro.local");
        usuario.setUsername("mariachef");
        usuario.setPassword(passwordEncoder.encode("SenhaAntiga#2024"));
    }

    @Test
    void trocaASenhaQuandoAAtualConfere() {
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));

        service.trocarSenha(USUARIO, new TrocaSenhaRequest("SenhaAntiga#2024", "SenhaNova#2025"));

        assertTrue(passwordEncoder.matches("SenhaNova#2025", usuario.getPassword()));
        assertNotNull(usuario.getSenhaAlteradaEm());
        verify(refreshTokenRepository).revogarTodosDoUsuario(usuario);
    }

    @Test
    void senhaAtualIncorretaNaoAlteraNadaERetorna400Generico() {
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));
        String hashAntes = usuario.getPassword();

        RequisicaoInvalidaException ex = assertThrows(RequisicaoInvalidaException.class, () ->
                service.trocarSenha(USUARIO, new TrocaSenhaRequest("errada", "SenhaNova#2025")));

        assertEquals("Senha atual incorreta", ex.getMessage());
        assertEquals(hashAntes, usuario.getPassword());
        verify(refreshTokenRepository, never()).revogarTodosDoUsuario(any());
    }

    @Test
    void novaSenhaIgualAAtualEhRejeitada() {
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));

        assertThrows(RequisicaoInvalidaException.class, () ->
                service.trocarSenha(USUARIO, new TrocaSenhaRequest("SenhaAntiga#2024", "SenhaAntiga#2024")));
        verify(refreshTokenRepository, never()).revogarTodosDoUsuario(any());
    }

    @Test
    void novaSenhaComOUsernameEhRejeitada() {
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));

        assertThrows(RequisicaoInvalidaException.class, () ->
                service.trocarSenha(USUARIO, new TrocaSenhaRequest("SenhaAntiga#2024", "Mariachef#2025")));
    }

    @Test
    void usuarioInexistenteLancaNaoEncontrado() {
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.empty());

        assertThrows(UsuarioNaoEncontradoException.class, () ->
                service.trocarSenha(USUARIO, new TrocaSenhaRequest("qualquer", "SenhaNova#2025")));
    }

    @Test
    void trocaSenhaRequestNuncaExpoeAsSenhasNoToString() {
        String texto = new TrocaSenhaRequest("segredo-atual", "segredo-novo").toString();

        assertEquals("TrocaSenhaRequest[senhaAtual=***, novaSenha=***]", texto);
    }

    @Test
    void hashNovoEhGeradoComOBCrypt() {
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));

        service.trocarSenha(USUARIO, new TrocaSenhaRequest("SenhaAntiga#2024", "SenhaNova#2025"));

        assertTrue(usuario.getPassword().startsWith("$2"));
        assertTrue(usuario.getPassword().length() >= 60);
    }

    @Test
    void marcaSenhaAlteradaEmComInstanteAtual() {
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));
        Instant antes = Instant.now().minusSeconds(1);

        service.trocarSenha(USUARIO, new TrocaSenhaRequest("SenhaAntiga#2024", "SenhaNova#2025"));

        assertTrue(usuario.getSenhaAlteradaEm().isAfter(antes));
    }

    // ------------------------------------------------------------- atualizar (PUT /usuarios/me)

    @Test
    void atualizaUsernameQuandoDisponivel() {
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.existsByUsernameIgnoreCase("novachef")).thenReturn(false);

        UsuarioResponse resposta = service.atualizar(USUARIO, new AtualizarUsuarioRequest("novachef", null));

        assertEquals("novachef", usuario.getUsername());
        assertEquals("novachef", resposta.username());
    }

    @Test
    void usernameJaExistenteRetornaConflito() {
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.existsByUsernameIgnoreCase("ocupado")).thenReturn(true);

        assertThrows(UsernameJaCadastradoException.class, () ->
                service.atualizar(USUARIO, new AtualizarUsuarioRequest("ocupado", null)));
    }

    @Test
    void reenviarOProprioUsernameNaoConsultaDuplicidade() {
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));

        service.atualizar(USUARIO, new AtualizarUsuarioRequest("MariaChef", null));

        assertEquals("MariaChef", usuario.getUsername());
        verify(usuarioRepository, never()).existsByUsernameIgnoreCase(any());
    }

    @Test
    void camposOmitidosOuEmBrancoNaoAlteramNada() {
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));

        service.atualizar(USUARIO, new AtualizarUsuarioRequest(null, " "));

        assertEquals("mariachef", usuario.getUsername());
        assertNotNull(usuario); // nada mudou, nenhuma exceção
    }

    @Test
    void emailESenhaNaoSaoAlteradosPorEsteEndpoint() {
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));
        String hashAntes = usuario.getPassword();

        service.atualizar(USUARIO, new AtualizarUsuarioRequest("novachef", null));

        assertEquals("maria@gastro.local", usuario.getEmail());
        assertEquals(hashAntes, usuario.getPassword());
    }

    @Test
    void capaComCaminhoDeUploadDaApiEhAceita() {
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));

        service.atualizar(USUARIO, new AtualizarUsuarioRequest(null, "/imagens/0123456789abcdef0123456789abcdef.jpg"));

        assertEquals("/imagens/0123456789abcdef0123456789abcdef.jpg", usuario.getCapa());
    }

    @Test
    void capaComDominioPermitidoEhAceita() {
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));

        service.atualizar(USUARIO, new AtualizarUsuarioRequest(null, "https://cdn.gastromatch.app/fotos/1.jpg"));

        assertEquals("https://cdn.gastromatch.app/fotos/1.jpg", usuario.getCapa());
    }

    @Test
    void capaComDominioNaoPermitidoEhRejeitada() {
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));

        assertThrows(RequisicaoInvalidaException.class, () -> service.atualizar(
                USUARIO, new AtualizarUsuarioRequest(null, "https://site-qualquer.example/foto.jpg")));
    }

    @Test
    void capaSemHttpsEhRejeitada() {
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));

        assertThrows(RequisicaoInvalidaException.class, () -> service.atualizar(
                USUARIO, new AtualizarUsuarioRequest(null, "http://cdn.gastromatch.app/foto.jpg")));
    }

    @Test
    void usernameMuitoCurtoEhRejeitado() {
        when(usuarioRepository.findById(USUARIO)).thenReturn(Optional.of(usuario));

        assertThrows(RequisicaoInvalidaException.class, () ->
                service.atualizar(USUARIO, new AtualizarUsuarioRequest("ab", null)));
    }
}
