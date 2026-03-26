# BlocManage Backend

Backend REST API pentru platforma B2B/B2C de property management si marketplace.

## Stack

- Node.js + Express
- PostgreSQL + Prisma ORM
- JWT pentru autentificare
- bcryptjs pentru hash-ul parolelor
- zod pentru validarea request-urilor

## Pornire rapida

1. Copiaza `.env.example` in `.env` si completeaza valorile reale.
2. Instaleaza dependintele cu `npm install`.
3. Genereaza clientul Prisma cu `npm run prisma:generate`.
4. Ruleaza migrarile cu `npm run prisma:migrate:dev`.
5. Porneste serverul cu `npm run dev`.

## Structura

- `src/routes` defineste endpoint-urile API
- `src/controllers` transforma request-urile in apeluri service
- `src/services` contine logica de business si accesul Prisma
- `src/middlewares` contine auth, RBAC, validare si error handling
- `src/validations` defineste schemele zod pentru fiecare endpoint

## Autentificare

API-ul accepta JWT atat prin header-ul `Authorization: Bearer <token>`, cat si prin cookie-ul HTTP-only configurat prin `AUTH_COOKIE_NAME`.

## Endpoint-uri principale

- `/api/v1/auth`
- `/api/v1/requests`
- `/api/v1/invoices`
- `/api/v1/contracts`
- `/api/v1/reviews`
- `/api/v1/hoa`

## Observatii

- Schema Prisma ramane in `backend/schema.prisma`; scripturile Prisma sunt configurate explicit pentru acest path.
- Review-urile pot fi adaugate doar dupa finalizarea unei cereri.
- Tenant-ii pot fi aprobati doar de HOA-ul din care fac parte.