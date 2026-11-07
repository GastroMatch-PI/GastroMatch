package com.gastromatch.dto;

import com.gastromatch.entity.Usuario;
import com.gastromatch.entity.enums.RoleUsuario;

/**
 * Dados devolvidos ao cliente. Não tem password: é isso que impede o hash
 * de sair na resposta. Sem anotações de validação, porque é saída.
 */
public record UsuarioResponse(
        Integer id,
        String email,
        String username,
        String capa,
        RoleUsuario role
) {
    // Conversão centralizada: usada pelo UsuarioService e pelo AuthService.
    public static UsuarioResponse de(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getId(), usuario.getEmail(), usuario.getUsername(), usuario.getCapa(), usuario.getRole());
    }
}
