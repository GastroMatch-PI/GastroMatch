package com.gastromatch.dto;

/**
 * Resposta de login e refresh: tokens + dados públicos do usuário.
 * expiresIn é a validade do accessToken em segundos.
 */
public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,
        UsuarioResponse usuario
) {
    @Override
    public String toString() {
        return "AuthResponse[usuario=" + usuario + ", tokens=***]";
    }
}
