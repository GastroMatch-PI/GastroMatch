package com.gastromatch.validation;

import java.util.Locale;

import com.gastromatch.exception.RequisicaoInvalidaException;

/**
 * Parte da política de senha forte (B26) que precisa da conta logada (e-mail e username),
 * por isso não dá para ser uma anotação de Bean Validation no DTO: quem chama é o service,
 * depois que já sabe a quem a senha pertence (cadastro, troca de senha e redefinição).
 */
public final class PoliticaSenha {

    private PoliticaSenha() {
    }

    public static void garantirSemCredenciais(String senha, String email, String username) {
        String senhaMinuscula = senha.toLowerCase(Locale.ROOT);

        String parteLocalDoEmail = parteLocal(email).toLowerCase(Locale.ROOT);
        if (parteLocalDoEmail.length() >= 3 && senhaMinuscula.contains(parteLocalDoEmail)) {
            throw new RequisicaoInvalidaException("A senha não pode conter o e-mail");
        }

        String usernameMinusculo = username.toLowerCase(Locale.ROOT);
        if (usernameMinusculo.length() >= 3 && senhaMinuscula.contains(usernameMinusculo)) {
            throw new RequisicaoInvalidaException("A senha não pode conter o nome de usuário");
        }
    }

    private static String parteLocal(String email) {
        int arroba = email.indexOf('@');
        return arroba < 0 ? email : email.substring(0, arroba);
    }
}
