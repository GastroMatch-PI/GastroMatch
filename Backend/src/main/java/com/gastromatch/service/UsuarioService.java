package com.gastromatch.service;

import java.time.Instant;
import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gastromatch.dto.CadastroUsuarioRequest;
import com.gastromatch.dto.TrocaSenhaRequest;
import com.gastromatch.dto.UsuarioResponse;
import com.gastromatch.entity.Usuario;
import com.gastromatch.exception.EmailJaCadastradoException;
import com.gastromatch.exception.RequisicaoInvalidaException;
import com.gastromatch.exception.UsernameJaCadastradoException;
import com.gastromatch.exception.UsuarioNaoEncontradoException;
import com.gastromatch.repository.RefreshTokenRepository;
import com.gastromatch.repository.UsuarioRepository;
import com.gastromatch.validation.PoliticaSenha;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    // Injeção por construtor: o Spring entrega as dependências sozinho.
    public UsuarioService(UsuarioRepository usuarioRepository,
                          RefreshTokenRepository refreshTokenRepository,
                          PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UsuarioResponse cadastrar(CadastroUsuarioRequest request) {
        // Normalizar antes de checar: "A@x.com" e "a@x.com" são a mesma conta.
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String username = request.username().trim();

        // Checagem amigável. A garantia real é a constraint UNIQUE do banco
        // (violação vira 409 no GlobalExceptionHandler).
        if (usuarioRepository.existsByEmail(email)) {
            throw new EmailJaCadastradoException();
        }
        if (usuarioRepository.existsByUsernameIgnoreCase(username)) {
            throw new UsernameJaCadastradoException();
        }
        PoliticaSenha.garantirSemCredenciais(request.password(), email, username);

        Usuario usuario = new Usuario();
        usuario.setEmail(email);
        usuario.setUsername(username);
        // Só o HASH é guardado. A senha pura nunca chega à entidade.
        usuario.setPassword(passwordEncoder.encode(request.password()));

        Usuario salvo = usuarioRepository.save(usuario);
        return UsuarioResponse.de(salvo);
    }

    @Transactional(readOnly = true)
    public UsuarioResponse buscarPorId(Integer id) {
        return usuarioRepository.findById(id)
                .map(UsuarioResponse::de)
                .orElseThrow(UsuarioNaoEncontradoException::new);
    }

    /**
     * Troca a senha do usuário logado. Confere a senha atual, aplica a política de senha
     * forte na nova e revoga os refresh tokens de outras sessões (a senha nova também não
     * pode repetir a atual). O JwtAuthFilter já recusa, pela data de senhaAlteradaEm, access
     * tokens emitidos antes da troca.
     */
    @Transactional
    public void trocarSenha(Integer usuarioId, TrocaSenhaRequest request) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(UsuarioNaoEncontradoException::new);

        // Mensagem genérica: não revela se a conta existe ou qual regra falhou.
        if (!passwordEncoder.matches(request.senhaAtual(), usuario.getPassword())) {
            throw new RequisicaoInvalidaException("Senha atual incorreta");
        }
        if (passwordEncoder.matches(request.novaSenha(), usuario.getPassword())) {
            throw new RequisicaoInvalidaException("A nova senha deve ser diferente da atual");
        }
        PoliticaSenha.garantirSemCredenciais(request.novaSenha(), usuario.getEmail(), usuario.getUsername());

        usuario.setPassword(passwordEncoder.encode(request.novaSenha()));
        usuario.setSenhaAlteradaEm(Instant.now());
        refreshTokenRepository.revogarTodosDoUsuario(usuario);
    }
}
