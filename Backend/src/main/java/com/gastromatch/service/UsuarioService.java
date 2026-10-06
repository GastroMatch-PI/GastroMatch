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
//import com.gastromatch.exception.EmailJaCadastradoException;
import com.gastromatch.repository.UsuarioRepository;

@Service
public class UsuarioService {

    // importando criptografia de senha e usuarioRepository
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    // Injeção por construtor: o Spring entrega as dependências sozinho.
    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    // Chamando DTO que recebe os campos
    public UsuarioResponse cadastrar(CadastroUsuarioRequest request) {
        // Normalizar antes de checar: "A@x.com" e "a@x.com" são a mesma conta.
        // trim remove espaços vazios no começo e fim
        // toLowerCase(locale.ROOT) converte todos os caracteres da string em minúsculo
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String username = request.username().trim();

        // Checagem amigável. A garantia real é a constraint UNIQUE do banco.
        if (usuarioRepository.existsByEmail(email)) {
            throw new EmailJaCadastradoException();
        }
        if (usuarioRepository.existsByUsername(username)) {
            throw new UsernameJaCadastradoException();
        }
        // cria a entidade vazia, que depois é preenchida pelos setters.
        Usuario usuario = new Usuario();
        // setando email e username no usuario
        usuario.setEmail(email);
        usuario.setUsername(username);
        // Só o HASH é guardado. A senha pura nunca chega à entidade.
        usuario.setPassword(passwordEncoder.encode(request.password()));

        // Como funciona essa parte?
        Usuario salvo = usuarioRepository.save(usuario);
        return toResponse(salvo);
    }

    // Conversão manual: só os campos permitidos saem, sem password.
    private UsuarioResponse toResponse(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getId(), usuario.getEmail(), usuario.getUsername(), usuario.getCapa());
    }
}