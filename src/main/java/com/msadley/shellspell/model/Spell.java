package com.msadley.shellspell.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "spells")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Spell {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    @Column(name = "damage_amount", nullable = false)
    private int damageAmount;
}
