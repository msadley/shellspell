package com.msadley.shellspell.controller;

import com.msadley.shellspell.dto.ChangePasswordRequest;
import com.msadley.shellspell.dto.UserResponse;
import com.msadley.shellspell.model.User;
import com.msadley.shellspell.security.CustomUserDetails;
import com.msadley.shellspell.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userDetails.getUser();
        UserResponse response = new UserResponse(user.getId(), user.getUsername(), user.getRole());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/me/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        
        userService.changePassword(userDetails.getUser(), request);
        return ResponseEntity.noContent().build();
    }
}
