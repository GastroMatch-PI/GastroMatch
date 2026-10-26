package com.gastromatch.dto;

import jakarta.validation.constraints.NotBlank;

/** Usado no /auth/refresh e no /auth/logout. */
public record RefreshTokenRequest(
        @NotBlank(message = "refreshToken é obrigatório")
        String refreshToken
) {
    @Override
    public String toString() {
        return "RefreshTokenRequest[refreshToken=***]";
    }
}
