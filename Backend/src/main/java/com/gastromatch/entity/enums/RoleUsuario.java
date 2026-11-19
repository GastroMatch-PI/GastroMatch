package com.gastromatch.entity.enums;

/**
 * Autoridade da conta no Spring Security (B17/B35), diferente de RoleProfissional
 * (chef/nutricionista/restaurante, que é sobre o perfil profissional). Os nomes batem com
 * o ENUM no SQL: mudar um exige mudar o outro.
 */
public enum RoleUsuario {
    USER, ADMIN
}
