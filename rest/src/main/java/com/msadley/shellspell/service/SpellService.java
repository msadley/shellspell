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
        if (requests == null || requests.isEmpty()) {
            return List.of();
        }

        List<String> inputNames = requests.stream().map(r -> r.name().trim()).toList();
        List<String> lowerInputNames = inputNames.stream().map(String::toLowerCase).toList();

        // 1. Check for duplicates within the batch request itself
        long distinctCount = lowerInputNames.stream().distinct().count();
        if (distinctCount < lowerInputNames.size()) {
            throw new BadRequestException("Duplicate spell names found within the batch request itself");
        }

        // 2. Check for duplicates in the database in a single query
        List<Spell> existingSpells = spellRepository.findByNamesIgnoreCase(lowerInputNames);
        if (!existingSpells.isEmpty()) {
            List<String> duplicateNames = existingSpells.stream().map(Spell::getName).toList();
            throw new BadRequestException("Spells already exist: " + String.join(", ", duplicateNames));
        }

        // 3. Map and batch validate categories
        List<Spell> spellsToSave = requests.stream()
                .map(req -> {
                    String catLower = req.category().trim().toLowerCase();
                    if (!List.of("arcano", "runico", "etereo", "primal", "umbral").contains(catLower)) {
                        throw new BadRequestException("Category must be one of: arcano, runico, etereo, primal, umbral");
                    }
                    return Spell.builder()
                            .name(req.name().trim())
                            .damageAmount(req.damageAmount())
                            .category(catLower)
                            .build();
                })
                .toList();

        // 4. Batch insert
        List<Spell> savedSpells = spellRepository.saveAll(spellsToSave);
        return savedSpells.stream()
                .map(s -> new SpellResponse(s.getId(), s.getName(), s.getDamageAmount(), s.getCategory()))
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
