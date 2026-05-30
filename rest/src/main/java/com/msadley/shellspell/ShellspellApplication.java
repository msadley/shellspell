package com.msadley.shellspell;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ShellspellApplication {

	public static void main(String[] args) {
		SpringApplication.run(ShellspellApplication.class, args);
	}

}
