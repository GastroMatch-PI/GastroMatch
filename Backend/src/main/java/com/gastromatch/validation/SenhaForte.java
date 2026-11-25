package com.gastromatch.validation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/**
 * Política única de senha forte (B26), usada no cadastro e na troca de senha:
 * 10 a 72 caracteres (limite do BCrypt), mistura de pelo menos 3 dos 4 tipos de
 * caractere (minúscula, maiúscula, número, símbolo) e fora da lista de senhas comuns.
 * Não confere se a senha contém o e-mail ou o username: isso depende da conta logada
 * e fica em PoliticaSenha.garantirSemCredenciais, chamado pelo service.
 */
@Documented
@Constraint(validatedBy = SenhaForteValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface SenhaForte {

    String message() default "Senha inválida";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
