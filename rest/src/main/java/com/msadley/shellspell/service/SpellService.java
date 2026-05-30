package com.msadley.shellspell.service;

import com.msadley.shellspell.dto.CreateSpellRequest;
import com.msadley.shellspell.dto.SpellResponse;
import com.msadley.shellspell.exception.BadRequestException;
import com.msadley.shellspell.exception.ResourceNotFoundException;
import com.msadley.shellspell.model.Spell;
import com.msadley.shellspell.repository.CastSpellRepository;
import com.msadley.shellspell.repository.SpellRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SpellService {

    private final SpellRepository spellRepository;
    private final CastSpellRepository castSpellRepository;

    public SpellService(SpellRepository spellRepository, CastSpellRepository castSpellRepository) {
        this.spellRepository = spellRepository;
        this.castSpellRepository = castSpellRepository;
    }

    @Transactional(readOnly = true)
    public List<SpellResponse> getAllSpells() {
        return spellRepository.findAll().stream()
                .map(s -> new SpellResponse(s.getId(), s.getName(), s.getDamageAmount(), s.getCategory()))
                .toList();
    }

    @Transactional
    public SpellResponse createSpell(CreateSpellRequest request) {
        String nameTrimmed = request.name().trim();
        String catLower = request.category().trim().toLowerCase();
        
        if (!List.of("arcano", "runico", "etereo", "primal", "umbral").contains(catLower)) {
            throw new BadRequestException("Category must be one of: arcano, runico, etereo, primal, umbral");
        }

        if (spellRepository.existsByNameIgnoreCase(nameTrimmed)) {
            throw new BadRequestException("A spell with name '" + nameTrimmed + "' already exists!");
        }

        Spell spell = Spell.builder()
                .name(nameTrimmed)
                .damageAmount(request.damageAmount())
                .category(catLower)
                .build();

        Spell savedSpell = spellRepository.save(spell);
        return new SpellResponse(
                savedSpell.getId(),
                savedSpell.getName(),
                savedSpell.getDamageAmount(),
                savedSpell.getCategory()
        );
    }

    @Transactional
    public List<SpellResponse> createSpellsBatch(List<CreateSpellRequest> requests) {
        return requests.stream()
                .map(this::createSpell)
                .toList();
    }

    @Transactional
    public void deleteSpell(Long id) {
        Spell spell = spellRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Spell not found with id: " + id));

        castSpellRepository.deleteBySpell(spell);
        spellRepository.delete(spell);
    }
}
