package com.gastromatch.service;

import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gastromatch.dto.CadastroUsuarioRequest;
import com.gastromatch.dto.UsuarioResponse;
import com.gastromatch.entity.Usuario;
import com.gastromatch.exception.EmailJaCadastradoException;
import com.gastromatch.exception.UsernameJaCadastradoException;
import com.gastromatch.exception.UsuarioNaoEncontradoException;
import com.gastromatch.repository.UsuarioRepository;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    // Injeção por construtor: o Spring entrega as dependências sozinho.
    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
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
        if (usuarioRepository.existsByUsername(username)) {
            throw new UsernameJaCadastradoException();
        }

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
}
