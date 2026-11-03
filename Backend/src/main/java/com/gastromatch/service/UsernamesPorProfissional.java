package com.gastromatch.service;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import com.gastromatch.entity.Usuario;
import com.gastromatch.repository.UsuarioRepository;

/** Busca, de uma vez só, o username da conta ligada a cada perfil profissional. */
final class UsernamesPorProfissional {

    private UsernamesPorProfissional() {
    }

    /** idProfissional -> username. Perfis sem conta (ex.: dados de exemplo) ficam de fora. */
    static Map<Integer, String> buscar(UsuarioRepository usuarioRepository, Collection<Integer> idsProfissional) {
        Map<Integer, String> usernames = new HashMap<>();
        if (!idsProfissional.isEmpty()) {
            for (Usuario u : usuarioRepository.findByIdProfissionalIn(idsProfissional)) {
                usernames.put(u.getIdProfissional(), u.getUsername());
            }
        }
        return usernames;
    }
}
