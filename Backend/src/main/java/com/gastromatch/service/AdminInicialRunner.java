package com.gastromatch.service;

import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.gastromatch.entity.Usuario;
import com.gastromatch.entity.enums.RoleUsuario;
import com.gastromatch.repository.UsuarioRepository;

/**
 * Cria o administrador inicial (B35), se ADMIN_EMAIL/ADMIN_USERNAME/ADMIN_PASSWORD estiverem
 * definidas (nunca fixo no código). Sem as três, não faz nada. Idempotente: se já existe uma
 * conta com esse e-mail (admin ou não), não cria nem promove ninguém — evita elevar uma conta
 * qualquer sem querer. Não reaplica a política de senha forte (B26): quem define a variável
 * de ambiente já controla essa senha diretamente.
 */
@Component
public class AdminInicialRunner implements ApplicationRunner {

    private static final Logger LOG = LoggerFactory.getLogger(AdminInicialRunner.class);

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String username;
    private final String senha;

    public AdminInicialRunner(UsuarioRepository usuarioRepository,
                              PasswordEncoder passwordEncoder,
                              @Value("${app.admin.email:}") String email,
                              @Value("${app.admin.username:}") String username,
                              @Value("${app.admin.password:}") String senha) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email;
        this.username = username;
        this.senha = senha;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (email.isBlank() || username.isBlank() || senha.isBlank()) {
            return;
        }
        String emailNormalizado = email.trim().toLowerCase(Locale.ROOT);
        String usernameNormalizado = username.trim();
        if (usuarioRepository.existsByEmail(emailNormalizado)) {
            LOG.info("Administrador inicial não criado: já existe uma conta com este e-mail");
            return;
        }

        Usuario admin = new Usuario();
        admin.setEmail(emailNormalizado);
        admin.setUsername(usernameNormalizado);
        admin.setPassword(passwordEncoder.encode(senha));
        admin.setRole(RoleUsuario.ADMIN);
        usuarioRepository.save(admin);
        LOG.info("Administrador inicial criado: {}", emailNormalizado);
    }
}
