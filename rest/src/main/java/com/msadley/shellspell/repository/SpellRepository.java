package com.msadley.shellspell.repository;

import com.msadley.shellspell.model.Spell;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SpellRepository extends JpaRepository<Spell, Long> {
    Optional<Spell> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
}
