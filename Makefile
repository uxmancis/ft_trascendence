# **************************************************************************** #
#                                   CONFIG                                     #
# **************************************************************************** #

NAME        := ft_transcendence
COMPOSE     := docker compose
COMPOSE_YML := docker-compose.yml

# Colores (42-style)
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RED    := \033[0;31m
RESET  := \033[0m

# **************************************************************************** #
#                                   TARGETS                                    #
# **************************************************************************** #

.PHONY: all up down build rebuild logs ps clean fclean re

all: up

## 🟢 Arranca el proyecto
up:
	@echo "$(GREEN)▶ Starting $(NAME)...$(RESET)"
	@$(COMPOSE) -f $(COMPOSE_YML) up -d --build

## 🔵 Para contenedores (sin borrar nada)
down:
	@echo "$(YELLOW)▶ Stopping containers...$(RESET)"
	@$(COMPOSE) -f $(COMPOSE_YML) down

## 🔨 Build de imágenes
build:
	@echo "$(GREEN)▶ Building images...$(RESET)"
	@$(COMPOSE) -f $(COMPOSE_YML) build

## ♻️ Rebuild completo (sin cache)
rebuild:
	@echo "$(YELLOW)▶ Rebuilding images (no cache)...$(RESET)"
	@$(COMPOSE) -f $(COMPOSE_YML) build --no-cache

## 📜 Logs en vivo
logs:
	@$(COMPOSE) -f $(COMPOSE_YML) logs -f

## 📊 Estado de contenedores
ps:
	@$(COMPOSE) -f $(COMPOSE_YML) ps

## 🧹 Limpia contenedores (mantiene volúmenes)
clean:
	@echo "$(RED)▶ Removing containers...$(RESET)"
	@$(COMPOSE) -f $(COMPOSE_YML) down --remove-orphans

## 💣 Limpieza total (¡borra volúmenes!)
fclean:
	@echo "$(RED)▶ Full cleanup (containers + volumes)...$(RESET)"
	@$(COMPOSE) -f $(COMPOSE_YML) down -v --remove-orphans
	@docker system prune -f

## 🔁 Rebuild total
re: fclean up

## 🆘 Ayuda
help:
	@echo "$(GREEN)Available targets:$(RESET)"
	@echo "  make up        → Build & start containers"
	@echo "  make down      → Stop containers"
	@echo "  make build     → Build images"
	@echo "  make rebuild   → Build without cache"
	@echo "  make logs      → Follow logs"
	@echo "  make ps        → Show containers"
	@echo "  make clean     → Stop & remove containers"
	@echo "  make fclean    → Remove containers + volumes"
	@echo "  make re        → Full rebuild"
