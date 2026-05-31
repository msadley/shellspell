package com.msadley.shellspell.service;

import com.msadley.shellspell.dto.ChangePasswordRequest;
import com.msadley.shellspell.exception.BadRequestException;
import com.msadley.shellspell.model.User;
import com.msadley.shellspell.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void changePassword(User user, ChangePasswordRequest request) {
        User dbUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (!passwordEncoder.matches(request.currentPassword(), dbUser.getPassword())) {
            throw new BadRequestException("Current password does not match");
        }

        dbUser.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(dbUser);
    }
}
