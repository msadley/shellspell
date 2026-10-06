# ShellSpell Makefile
DOCKER_COMPOSE ?= docker compose

COMPOSE_DEV_FILES := -f docker-compose.yml -f docker-compose.dev.yml
COMPOSE_PROD_FILES := -f docker-compose.yml

COMPOSE_DEV := $(DOCKER_COMPOSE) $(COMPOSE_DEV_FILES)
COMPOSE_PROD := $(DOCKER_COMPOSE) $(COMPOSE_PROD_FILES)

.PHONY: help dev prod down logs ps clean

.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  dev           Spin up containers in development mode (hot-reload enabled)"
	@echo "  prod          Spin up containers in production mode"
	@echo "  down          Stop and remove containers"
	@echo "  logs          Follow logs from containers"
	@echo "  ps            Display status of containers"
	@echo "  clean         Stop containers and remove volumes"

dev: ## Spin up containers in development mode
	$(COMPOSE_DEV) up -d --build
	@echo ""
	@echo "Development containers are running:"
	@echo "  - Frontend: http://localhost:3000"
	@echo "  - Backend:  http://localhost:8080"
	@echo "  - Database: localhost:5432"

prod: ## Spin up containers in production mode
	$(COMPOSE_PROD) up -d --build
	@echo ""
	@echo "Production containers are running:"
	@echo "  - Frontend: http://localhost:80 (or https://localhost:443)"
	@echo "  - Backend:  http://localhost:8080"
	@echo "  - Database: localhost:5432"

down: ## Stop and remove containers
	$(COMPOSE_DEV) down --remove-orphans
	@echo ""
	@echo "Containers stopped and removed."

logs: ## Follow container logs
	$(COMPOSE_DEV) logs -f

ps: ## Check status of containers
	$(COMPOSE_DEV) ps

clean: ## Stop containers and remove volumes
	$(COMPOSE_DEV) down -v --remove-orphans
	@echo ""
	@echo "Containers and volumes removed."
