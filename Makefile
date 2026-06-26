# Optional convenience wrapper around docker compose. Every target maps to a
# plain `docker compose` command (shown in the README) so Make is never
# required to run this project.

.DEFAULT_GOAL := help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

up: ## Build and start the database + backend
	docker compose up --build

down: ## Stop and remove containers (keeps the database volume)
	docker compose down

reset: ## Stop and remove containers AND the database volume
	docker compose down -v

logs: ## Tail backend logs
	docker compose logs -f backend

seed: ## Re-run the seed against the running database
	docker compose exec backend npx prisma db seed

migrate: ## Apply migrations against the running database
	docker compose exec backend npx prisma migrate deploy

test: ## Run the backend test suite (requires a local Postgres test DB)
	cd backend && npm test
