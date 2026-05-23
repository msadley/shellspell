package com.msadley.shellspell.service;

import com.msadley.shellspell.model.Spell;
import com.msadley.shellspell.repository.SpellRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final SpellRepository spellRepository;

    public DataInitializer(SpellRepository spellRepository) {
        this.spellRepository = spellRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (spellRepository.count() == 0) {
            List<Spell> defaultSpells = Arrays.asList(
                    Spell.builder().name("Fireball").damageAmount(25).build(),
                    Spell.builder().name("Frostbolt").damageAmount(15).build(),
                    Spell.builder().name("Thunderstrike").damageAmount(35).build(),
                    Spell.builder().name("Shadowburn").damageAmount(20).build(),
                    Spell.builder().name("Earthquake").damageAmount(40).build()
            );
            spellRepository.saveAll(defaultSpells);
            System.out.println("Default spells populated in database.");
        }
    }
}
