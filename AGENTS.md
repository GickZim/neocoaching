# NeoCoaching AI Development Guide

## Project Overview

NeoCoaching is a premium online fitness coaching platform.

The system consists of:

- Public Marketing Website
- Client Portal
- Admin Dashboard
- Check-In System
- Progress Tracking System
- Workout Management
- Nutrition Management

## Tech Stack

Frontend:

- Next.js 15
- TypeScript
- TailwindCSS
- ShadCN UI
- Framer Motion

Backend:

- Next.js Route Handlers
- Prisma ORM
- PostgreSQL

Authentication:

- Clerk

Storage:

- Cloudinary

Payments:

- Stripe

## Development Principles

- Use TypeScript strictly.
- Avoid using `any`.
- Use Server Components by default.
- Use Client Components only when necessary.
- Keep components small and reusable.
- Follow mobile-first responsive design.
- Use semantic HTML.
- Maintain accessibility standards.

## Folder Structure

src/

app/
components/
sections/
lib/
hooks/
services/
types/
utils/

## UI Guidelines

Theme:

- Black (#000000)
- Gold (#D4AF37)
- Red Accent (#E10600)

Design Style:

- Premium
- Luxury
- High-end fitness brand
- Minimalistic
- Fast loading

## Homepage Structure

1. Hero Section
2. Transformations
3. Neo Method
4. Programs
5. About Neo
6. Testimonials
7. FAQ
8. Application Form
9. Footer

## Coding Rules

- Use TailwindCSS for styling.
- Use ShadCN components where appropriate.
- Use Framer Motion for animations.
- Prefer composition over large components.
- Create reusable UI components.
- Keep files under 300 lines where practical.

## Naming Conventions

Components:
PascalCase

Hooks:
useCamelCase

Files:
kebab-case.tsx

Types:
PascalCase

## Goal

Build the highest-quality fitness coaching platform possible with a focus on user experience, conversions, scalability, and maintainability.
