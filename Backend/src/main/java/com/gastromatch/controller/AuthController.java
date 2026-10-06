package com.gastromatch.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gastromatch.dto.CadastroUsuarioRequest;
import com.gastromatch.dto.UsuarioResponse;
import com.gastromatch.service.UsuarioService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {

	//importanto e utilizando o service do usuário
    private final UsuarioService usuarioService;

    //referenciando que esse controller utiliza do service
    public AuthController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    // Sem @Valid as anotações do DTO seriam ignoradas.
    @PostMapping("/cadastro")
    public ResponseEntity<UsuarioResponse> cadastrar(@Valid @RequestBody CadastroUsuarioRequest request) {
        UsuarioResponse response = usuarioService.cadastrar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
//    
//    Por que uma classe separada, e não só organização? Há uma razão técnica:
//    O BCryptPasswordEncoder é uma classe de biblioteca. Não dá para anotá-la com @Service ou @Component, então o Spring não sabe criá-la sozinho.
//    @Bean dentro de @Configuration ensina o Spring a criar e guardar um objeto no contêiner. Esse objeto é então injetado onde for pedido.
//    Se o service fizesse new BCryptPasswordEncoder(), ficaria preso a uma instância própria, e o AuthService do login teria de criar outra. Com o bean, há uma só, e trocar o algoritmo depois é mudar uma linha.