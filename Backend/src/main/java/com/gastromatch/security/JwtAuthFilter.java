package com.gastromatch.security;

import java.io.IOException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.gastromatch.entity.Usuario;
import com.gastromatch.repository.UsuarioRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Roda uma vez por requisição. Se houver "Authorization: Bearer <jwt>" válido,
 * autentica o usuário (principal = id). Se não houver ou for inválido, segue sem
 * autenticar e o SecurityFilterChain decide (401 nas rotas protegidas).
 *
 * Além da assinatura e da validade, consulta o banco: o token só vale se o usuário
 * ainda existe e se a senha não foi trocada depois que o token foi emitido.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String PREFIXO = "Bearer ";

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    public JwtAuthFilter(JwtService jwtService, UsuarioRepository usuarioRepository) {
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith(PREFIXO)
                && SecurityContextHolder.getContext().getAuthentication() == null) {

            String token = header.substring(PREFIXO.length()).trim();
            jwtService.validar(token).filter(this::aindaVale).ifPresent(valido -> {
                var auth = new UsernamePasswordAuthenticationToken(valido.usuarioId(), null, List.of());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            });
        }

        chain.doFilter(request, response);
    }

    // Token com assinatura boa ainda pode ser de alguém que não existe mais
    // ou de antes de uma troca de senha.
    private boolean aindaVale(JwtService.TokenValido token) {
        return usuarioRepository.findById(token.usuarioId())
                .map(usuario -> semTrocaDeSenhaDepois(usuario, token.emitidoEm()))
                .orElse(false);
    }

    private static boolean semTrocaDeSenhaDepois(Usuario usuario, Instant emitidoEm) {
        Instant trocaDeSenha = usuario.getSenhaAlteradaEm();
        // O JWT guarda a data em segundos inteiros, então compara na mesma precisão.
        return trocaDeSenha == null
                || !emitidoEm.isBefore(trocaDeSenha.truncatedTo(ChronoUnit.SECONDS));
    }
}
