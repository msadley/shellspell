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

        if (spellRepository.count() == 0) {
            List<Spell> defaultSpells = List.of(
                Spell.builder().name("Projeção Astral").damageAmount(15).category("arcano").build(),
                Spell.builder().name("Míssil Mágico").damageAmount(20).category("arcano").build(),
                Spell.builder().name("Explosão Arcana").damageAmount(30).category("arcano").build(),
                Spell.builder().name("Distorção Temporal").damageAmount(25).category("arcano").build(),

                Spell.builder().name("Runa Explosiva").damageAmount(35).category("runico").build(),
                Spell.builder().name("Escudo Rúnico").damageAmount(10).category("runico").build(),
                Spell.builder().name("Sobrecarga de Mana").damageAmount(40).category("runico").build(),
                Spell.builder().name("Marca da Tempestade").damageAmount(30).category("runico").build(),

                Spell.builder().name("Lança de Luz").damageAmount(25).category("etereo").build(),
                Spell.builder().name("Raio Estelar").damageAmount(35).category("etereo").build(),
                Spell.builder().name("Impacto Espacial").damageAmount(30).category("etereo").build(),
                Spell.builder().name("Pulsar Cósmico").damageAmount(45).category("etereo").build(),

                Spell.builder().name("Bola de Fogo").damageAmount(30).category("primal").build(),
                Spell.builder().name("Fogo de Artifício").damageAmount(20).category("primal").build(),
                Spell.builder().name("Tempestade de Raios").damageAmount(40).category("primal").build(),
                Spell.builder().name("Terremoto").damageAmount(35).category("primal").build(),

                Spell.builder().name("Dreno de Vida").damageAmount(25).category("umbral").build(),
                Spell.builder().name("Seta Sombria").damageAmount(20).category("umbral").build(),
                Spell.builder().name("Chama Negra").damageAmount(35).category("umbral").build(),
                Spell.builder().name("Pesadelo").damageAmount(30).category("umbral").build(),

                // Spells dos Arquivos (VFS)
                Spell.builder().name("Umbra Flagellum").damageAmount(15).category("umbral").build(),
                Spell.builder().name("Noctis Morsus").damageAmount(20).category("umbral").build(),
                Spell.builder().name("Caligo Tenebrarum").damageAmount(20).category("umbral").build(),
                Spell.builder().name("Inanis Sectum").damageAmount(40).category("umbral").build(),
                Spell.builder().name("Chaos Involucrum").damageAmount(50).category("arcano").build(),
                Spell.builder().name("Carcer Angularis").damageAmount(15).category("runico").build(),
                Spell.builder().name("Sigillum Ponderis").damageAmount(15).category("runico").build(),
                Spell.builder().name("Glyphos Dementiae").damageAmount(20).category("runico").build(),
                Spell.builder().name("Maledictio Scripta").damageAmount(35).category("runico").build(),
                Spell.builder().name("Stigma Ignotum").damageAmount(50).category("runico").build(),
                Spell.builder().name("Sporae Profundae").damageAmount(30).category("primal").build(),
                Spell.builder().name("Visceralis Diruptio").damageAmount(25).category("primal").build(),
                Spell.builder().name("Ossea Eruptio").damageAmount(25).category("primal").build(),
                Spell.builder().name("Spiritus Gelidus").damageAmount(15).category("etereo").build(),
                Spell.builder().name("Spectra Ululatus").damageAmount(20).category("etereo").build(),
                Spell.builder().name("Corpus Evanesco").damageAmount(35).category("etereo").build(),
                Spell.builder().name("Umbra Astralis").damageAmount(45).category("etereo").build(),
                Spell.builder().name("Stella Cadens").damageAmount(20).category("etereo").build(),
                Spell.builder().name("Ignis Coloris").damageAmount(20).category("primal").build(),
                Spell.builder().name("Lumen Abyssale").damageAmount(30).category("arcano").build(),
                Spell.builder().name("Arcana Mutatio").damageAmount(55).category("arcano").build()
            );
            spellRepository.saveAll(defaultSpells);
            System.out.println("Default spells catalog seeded (" + defaultSpells.size() + " spells).");
        }
    }
}
