package com.msadley.shellspell.security;

import com.msadley.shellspell.model.User;
import com.msadley.shellspell.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String usernameOrId) throws UsernameNotFoundException {
        try {
            UUID id = UUID.fromString(usernameOrId);
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + id));
            return new CustomUserDetails(user);
        } catch (IllegalArgumentException e) {
            User user = userRepository.findByUsername(usernameOrId)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + usernameOrId));
            return new CustomUserDetails(user);
        }
    }
}
