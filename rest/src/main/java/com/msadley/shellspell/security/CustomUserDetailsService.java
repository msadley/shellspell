package com.msadley.shellspell.security;

import com.msadley.shellspell.model.User;
import com.msadley.shellspell.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String usernameOrId) throws UsernameNotFoundException {
        // Try finding by ID first (covers UUID strings and matricula numbers)
        Optional<User> userOpt = userRepository.findById(usernameOrId);
        if (userOpt.isPresent()) {
            return new CustomUserDetails(userOpt.get());
        }
        // Fallback to finding by username (useful during login when username is entered)
        User user = userRepository.findByUsername(usernameOrId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username or id: " + usernameOrId));
        return new CustomUserDetails(user);
    }
}
