package com.gastromatch.security;

import org.springframework.security.config.Customizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.DefaultSecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;
/*
 * Por que uma classe separada de configuração?
 * O BCryptPasswordEncoder é uma classe de biblioteca: não dá para anotá-la com
 * @Service/@Component. O @Bean dentro de @Configuration ensina o Spring a criar
 * e guardar o objeto no contêiner, que o injeta onde for pedido. Assim há uma
 * única instância e trocar o algoritmo depois é mudar uma linha.
 */
@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DefaultSecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwtAuthFilter) throws Exception {
        http
            // CSRF protege sessões em cookie. Como usamos JWT no header, não se aplica.
            .csrf(AbstractHttpConfigurer::disable)
            // Usa o bean corsConfigurationSource do CorsConfig.
            .cors(Customizer.withDefaults())
            // Sem sessão no servidor: cada requisição se autentica pelo token.
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() // preflight do CORS
                .requestMatchers("/auth/**").permitAll()
                // O perfil da própria conta exige login. Fica ANTES das rotas públicas
                // "/chefs/*" etc., senão "/chefs/me" seria tratado como o perfil de um chef.
                .requestMatchers(HttpMethod.GET, "/chefs/me", "/nutricionistas/me", "/restaurantes/me").authenticated()
                // Leitura pública: só GET e só estas rotas. Escrever exige login.
                .requestMatchers(HttpMethod.GET, "/receitas", "/receitas/*", "/receitas/*/comentarios", "/ingredientes").permitAll()
                // Diretório de profissionais e restaurantes (e o mapa).
                .requestMatchers(HttpMethod.GET, "/chefs", "/chefs/*", "/nutricionistas", "/nutricionistas/*",
                        "/restaurantes", "/restaurantes/*").permitAll()
                // Ver uma imagem é público (o envio, POST /imagens, exige login).
                .requestMatchers(HttpMethod.GET, "/imagens/*").permitAll()
                // Health check do host (só o /health está exposto, ver application.properties).
                .requestMatchers(HttpMethod.GET, "/actuator/health").permitAll()
                // Swagger: só existe quando habilitado (profile dev); em produção dá 404.
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                .anyRequest().authenticated())
            // Sem isso o padrão seria 403 para quem não enviou token. O correto é 401.
            .exceptionHandling(e -> e.authenticationEntryPoint((req, res, ex) -> {
                res.setStatus(401);
                res.setContentType("application/json");
                res.setCharacterEncoding("UTF-8");
                res.getWriter().write("{\"status\":401,\"mensagem\":\"Não autenticado\"}");
            }))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
