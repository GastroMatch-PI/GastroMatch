package com.gastromatch.validation;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

/** Política de senha forte (B26): tamanho, mistura de tipos de caractere e lista de proibidas. */
class SenhaForteValidatorTest {

    private static ValidatorFactory fabrica;
    private static Validator validador;

    private record SenhaHolder(@SenhaForte String senha) {
    }

    @BeforeAll
    static void criarValidador() {
        fabrica = Validation.buildDefaultValidatorFactory();
        validador = fabrica.getValidator();
    }

    @AfterAll
    static void fecharFabrica() {
        fabrica.close();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "Abc123!",               // curta demais (7 caracteres)
            "abcdefgh12",            // só minúscula e número (2 tipos)
            "ABCDEFGH12",            // só maiúscula e número (2 tipos)
            "abcdefghij",            // só minúscula (1 tipo)
            "123456789!",            // só número e símbolo (2 tipos)
            "11111111111",           // só número (1 tipo), repetido
            "PASSWORD1234",          // só maiúscula e número (2 tipos)
            "!!!!!!!!!!",            // só símbolo (1 tipo)
            "abcdefgh!@",            // só minúscula e símbolo (2 tipos)
            "sequencia12345678",     // só minúscula e número (2 tipos)
            "Password123!",         // forte na forma, mas é senha comum
            "Qwerty12345",          // forte na forma, mas é senha comum
            "Admin12345",            // forte na forma, mas é senha comum
            "Senha@12345",          // forte na forma, mas é senha comum (variação em PT-BR)
            "Ab1!Ab1!Ab1!Ab1!Ab1!Ab1!Ab1!Ab1!Ab1!Ab1!Ab1!Ab1!Ab1!Ab1!Ab1!Ab1!Ab1!Ab1!Ab1!Ab1!"
                    // 80 caracteres: mesmo com os 4 tipos, passa do limite de 72
    })
    void senhasFracasDevemSerRejeitadas(String senha) {
        assertFalse(validador.validate(new SenhaHolder(senha)).isEmpty(),
                "Esperava rejeitar: " + senha);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "Abacaxi#2025",
            "Melancia$777",
            "Uva&Manga123",
            "Pera_Kiwi99!",
            "Figo*Tangerina1"
    })
    void senhasFortesDevemSerAceitas(String senha) {
        assertTrue(validador.validate(new SenhaHolder(senha)).isEmpty(),
                "Esperava aceitar: " + senha);
    }
}
