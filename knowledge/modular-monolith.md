# Modular Monolith Architecture

A modular monolith is an application deployed as a single unit while maintaining clear internal module boundaries.

## Advantages

- Simpler deployment than a distributed microservices system.
- Functionality can be organized into independent business modules.
- In-process communication avoids network calls between modules.
- Transactions across modules can be simpler to manage.

## Disadvantages

- Poor module boundaries can lead to tightly coupled code.
- The entire application is commonly deployed as one unit.
- Individual modules generally cannot scale independently.

## When to use it

Choose a modular monolith when a product is evolving, the team is relatively small, and operational simplicity is important. Enforce module boundaries so the system can evolve without unnecessary coupling.

## When to consider microservices

Consider extracting services when specific business capabilities need independent deployment or scaling, and the organization can manage distributed systems complexity.
