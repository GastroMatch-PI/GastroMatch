package com.gastromatch.service;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gastromatch.dto.AtualizarUsuarioRequest;
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

    // O mesmo caminho que POST /imagens devolve (ImagemLink), sempre aceito como capa.
    private static final Pattern CAMINHO_DE_UPLOAD =
            Pattern.compile("^/imagens/[0-9a-f]{32}\\.(jpg|png|webp)$");

    private final UsuarioRepository usuarioRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final Set<String> dominiosDeCapaPermitidos;

    // Injeção por construtor: o Spring entrega as dependências sozinho.
    public UsuarioService(UsuarioRepository usuarioRepository,
                          RefreshTokenRepository refreshTokenRepository,
                          PasswordEncoder passwordEncoder,
                          @Value("${app.capa.allowed-hosts:}") String dominiosDeCapaPermitidosCsv) {
        this.usuarioRepository = usuarioRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.dominiosDeCapaPermitidos = separarDominios(dominiosDeCapaPermitidosCsv);
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

    /**
     * Edita username e/ou capa da conta logada. Cada campo omitido ou em branco não é
     * alterado; e-mail e senha não entram aqui de propósito (B18/B19). atualizado_em é
     * mantido pelo gatilho do banco, não precisa ser tocado aqui.
     */
    @Transactional
    public UsuarioResponse atualizar(Integer usuarioId, AtualizarUsuarioRequest request) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(UsuarioNaoEncontradoException::new);

        if (request.username() != null && !request.username().isBlank()) {
            usuario.setUsername(novoUsername(usuario, request.username().trim()));
        }
        if (request.capa() != null && !request.capa().isBlank()) {
            String capa = request.capa().trim();
            validarCapa(capa);
            usuario.setCapa(capa);
        }
        return UsuarioResponse.de(usuario);
    }

    private String novoUsername(Usuario usuario, String pretendido) {
        if (pretendido.length() < 3 || pretendido.length() > 50) {
            throw new RequisicaoInvalidaException("Username deve ter entre 3 e 50 caracteres");
        }
        boolean emUsoPorOutraConta = !pretendido.equalsIgnoreCase(usuario.getUsername())
                && usuarioRepository.existsByUsernameIgnoreCase(pretendido);
        if (emUsoPorOutraConta) {
            throw new UsernameJaCadastradoException();
        }
        return pretendido;
    }

    private void validarCapa(String capa) {
        if (CAMINHO_DE_UPLOAD.matcher(capa).matches()) {
            return;
        }
        URI uri;
        try {
            uri = new URI(capa);
        } catch (URISyntaxException e) {
            throw new RequisicaoInvalidaException("URL da capa inválida");
        }
        String host = uri.getHost();
        if (!"https".equals(uri.getScheme()) || host == null) {
            throw new RequisicaoInvalidaException(
                    "A capa deve ser https ou uma imagem enviada por POST /imagens");
        }
        if (!dominiosDeCapaPermitidos.contains(host.toLowerCase(Locale.ROOT))) {
            throw new RequisicaoInvalidaException("Domínio da capa não permitido: " + host);
        }
    }

    private static Set<String> separarDominios(String csv) {
        if (csv == null || csv.isBlank()) {
            return Set.of();
        }
        List<String> dominios = Arrays.asList(csv.split(","));
        return dominios.stream()
                .map(String::trim)
                .filter(d -> !d.isBlank())
                .map(d -> d.toLowerCase(Locale.ROOT))
                .collect(Collectors.toUnmodifiableSet());
    }
}
