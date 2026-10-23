# Microservices Architecture

Microservices architecture structures a system as multiple independently deployable services organized around business capabilities.

## Advantages

- Services can be deployed independently.
- Individual services can scale according to their workloads.
- Teams can own separate services and release them independently.
- Different technologies may be used where justified.

## Disadvantages

- Network communication introduces latency and failure modes.
- Distributed transactions and data consistency become more difficult.
- Monitoring, deployment, and incident response require more infrastructure.
- Service boundaries and API contracts require careful design.

## When to use it

Consider microservices when business capabilities have clear boundaries, independent deployment is valuable, and the engineering organization has the operational maturity to manage distributed systems.

## When not to use it

Avoid introducing microservices solely because they are popular. For a small team or an early-stage product, a modular monolith may be easier and cheaper to operate.
