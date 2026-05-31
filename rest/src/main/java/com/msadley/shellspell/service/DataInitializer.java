package com.msadley.shellspell.service;

import com.msadley.shellspell.model.Spell;
import com.msadley.shellspell.model.User;
import com.msadley.shellspell.model.UserRole;
import com.msadley.shellspell.repository.SpellRepository;
import com.msadley.shellspell.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final SpellRepository spellRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(SpellRepository spellRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.spellRepository = spellRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .id(java.util.UUID.randomUUID().toString())
                    .username("admin")
                    .password(passwordEncoder.encode("admin"))
                    .role(UserRole.ADMIN)
                    .build();
            userRepository.save(admin);
            System.out.println("Default admin user created.");
        }
    }
}
