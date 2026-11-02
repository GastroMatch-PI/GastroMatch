package com.gastromatch.service;

import java.util.Locale;

import com.gastromatch.exception.RequisicaoInvalidaException;

/** Normalização e conferência dos documentos que os profissionais informam no cadastro. */
public final class Documentos {

    private static final int[] PESOS_DV1 = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
    private static final int[] PESOS_DV2 = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};

    private Documentos() {
    }

    /**
     * Confere o CNPJ (14 dígitos e dígitos verificadores) e devolve no formato 00.000.000/0000-00.
     * Assim "11222333000181" e "11.222.333/0001-81" são o mesmo CNPJ na hora de checar duplicidade.
     */
    public static String normalizarCnpj(String cnpj) {
        String digitos = (cnpj == null) ? "" : cnpj.replaceAll("\\D", "");
        if (digitos.length() != 14 || digitos.chars().distinct().count() == 1
                || !digitosVerificadoresConferem(digitos)) {
            throw new RequisicaoInvalidaException("CNPJ inválido");
        }
        return digitos.substring(0, 2) + "." + digitos.substring(2, 5) + "." + digitos.substring(5, 8)
                + "/" + digitos.substring(8, 12) + "-" + digitos.substring(12);
    }

    /** CRN em maiúsculas e sem espaços repetidos. O formato varia por regional, então só exige um número. */
    public static String normalizarCrn(String crn) {
        String limpo = (crn == null) ? "" : crn.trim().replaceAll("\\s+", " ").toUpperCase(Locale.ROOT);
        if (limpo.length() < 3 || limpo.length() > 20 || limpo.chars().noneMatch(Character::isDigit)) {
            throw new RequisicaoInvalidaException("CRN inválido");
        }
        return limpo;
    }

    /** CEP no formato 00000-000; em branco vira null. */
    public static String normalizarCep(String cep) {
        if (cep == null || cep.isBlank()) {
            return null;
        }
        String digitos = cep.replaceAll("\\D", "");
        if (digitos.length() != 8) {
            throw new RequisicaoInvalidaException("CEP inválido");
        }
        return digitos.substring(0, 5) + "-" + digitos.substring(5);
    }

    private static boolean digitosVerificadoresConferem(String d) {
        return digito(d, PESOS_DV1) == d.charAt(12) - '0' && digito(d, PESOS_DV2) == d.charAt(13) - '0';
    }

    private static int digito(String d, int[] pesos) {
        int soma = 0;
        for (int i = 0; i < pesos.length; i++) {
            soma += (d.charAt(i) - '0') * pesos[i];
        }
        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }
}
