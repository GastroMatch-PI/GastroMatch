package com.gastromatch.validation;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class SenhaForteValidator implements ConstraintValidator<SenhaForte, String> {

    static final int TAMANHO_MINIMO = 10;
    // O BCrypt só considera os primeiros 72 bytes da senha; acima disso o excedente é ignorado.
    static final int TAMANHO_MAXIMO = 72;
    private static final int TIPOS_DE_CARACTERE_EXIGIDOS = 3;

    private static final Set<String> SENHAS_PROIBIDAS = carregarSenhasProibidas();

    @Override
    public boolean isValid(String senha, ConstraintValidatorContext contexto) {
        // Ausência é responsabilidade do @NotBlank no próprio campo.
        if (senha == null || senha.isEmpty()) {
            return true;
        }

        String motivo = encontrarViolacao(senha);
        if (motivo == null) {
            return true;
        }

        contexto.disableDefaultConstraintViolation();
        contexto.buildConstraintViolationWithTemplate(motivo).addConstraintViolation();
        return false;
    }

    private static String encontrarViolacao(String senha) {
        if (senha.length() < TAMANHO_MINIMO || senha.length() > TAMANHO_MAXIMO) {
            return "A senha deve ter entre " + TAMANHO_MINIMO + " e " + TAMANHO_MAXIMO + " caracteres";
        }
        if (tiposDeCaractere(senha) < TIPOS_DE_CARACTERE_EXIGIDOS) {
            return "A senha deve combinar pelo menos " + TIPOS_DE_CARACTERE_EXIGIDOS
                    + " destes 4 tipos: letra minúscula, letra maiúscula, número e símbolo";
        }
        if (SENHAS_PROIBIDAS.contains(senha.toLowerCase(Locale.ROOT))) {
            return "Essa senha é muito comum; escolha outra";
        }
        return null;
    }

    private static int tiposDeCaractere(String senha) {
        boolean minuscula = senha.chars().anyMatch(Character::isLowerCase);
        boolean maiuscula = senha.chars().anyMatch(Character::isUpperCase);
        boolean digito = senha.chars().anyMatch(Character::isDigit);
        boolean simbolo = senha.chars().anyMatch(c -> !Character.isLetterOrDigit(c));
        return (minuscula ? 1 : 0) + (maiuscula ? 1 : 0) + (digito ? 1 : 0) + (simbolo ? 1 : 0);
    }

    // Lista carregada uma vez (classe é reutilizada pelo Bean Validation a cada validação).
    private static Set<String> carregarSenhasProibidas() {
        try (InputStream entrada = SenhaForteValidator.class.getResourceAsStream("/senhas-proibidas.txt")) {
            if (entrada == null) {
                return Set.of();
            }
            try (BufferedReader leitor = new BufferedReader(new InputStreamReader(entrada, StandardCharsets.UTF_8))) {
                return leitor.lines()
                        .map(String::trim)
                        .filter(linha -> !linha.isBlank() && !linha.startsWith("#"))
                        .map(linha -> linha.toLowerCase(Locale.ROOT))
                        .collect(Collectors.toUnmodifiableSet());
            }
        } catch (IOException e) {
            throw new IllegalStateException("Não foi possível carregar a lista de senhas proibidas", e);
        }
    }
}
