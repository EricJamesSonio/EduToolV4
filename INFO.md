# EduTool — Technology Stack Document v1.0

## 1. Overview

This document defines the official technology stack for **EduTool**, a multi-tenant academic management platform designed for schools. The selected technologies prioritize scalability, maintainability, developer productivity, and real-time capabilities required by the system architecture described in the EduTool planning document.

The stack follows a **modern SaaS architecture** with clear separation between frontend, backend, database, and infrastructure layers.

---

# 2. Core Technology Stack

## 2.1 Programming Language

Primary Language: **TypeScript**

TypeScript is used across the entire system to ensure type safety, maintainable code, and shared types between the frontend and backend.

Benefits:

- Strong typing for large-scale systems

- Reduced runtime errors

- Shared models between API and UI

- Excellent tooling and ecosystem

---

# 3. Frontend Architecture

## 3.1 Frontend Framework

Framework: **Next.js**

Next.js is the primary frontend framework used to build the EduTool user interface for Admins, Educators, and Students.

Key Features Used:

- App Router architecture

- Server Components

- Client Components

- Built-in routing

- Middleware for authentication

- Optimized production builds

Benefits:

- Fast performance

- Structured routing system

- Built-in optimization

- Excellent integration with React ecosystem

---

## 3.2 UI Library

Library: **React**

React is used as the core UI library within the Next.js framework.

Responsibilities:

- Component-based UI

- Interactive dashboards

- Assessment interfaces

- Meeting rooms

- Dynamic forms

---

## 3.3 Styling System

Primary Styling Framework: **Tailwind CSS**

Tailwind CSS provides utility-based styling for rapid UI development and consistent design.

Benefits:

- Fast development

- Consistent spacing and layout

- No large CSS files

- Easily customizable design system

---

## 3.4 Frontend State Management

Primary Tools:

- React Context

- Server Actions

- TanStack Query (React Query)

Responsibilities:

- API data fetching

- cache management

- background data updates

- mutation handling

---

# 4. Backend Architecture

## 4.1 Backend Framework

Framework: **NestJS**

NestJS is the backend framework used to implement the EduTool API and core system services.

Architecture Style:

- Modular architecture

- Dependency injection

- Service-oriented modules

Major Backend Modules:

- Authentication

- Organization Management

- Admin Management

- Student Management

- Educator Management

- Subject Management

- Class Management

- Lesson Management

- Assessment System

- Attendance Management

- Grade System

- Meeting System

- Notification System

- Audit Logs

- Analytics

Benefits:

- Enterprise architecture

- TypeScript-native framework

- Clean module structure

- Built-in dependency injection

- Strong ecosystem

---

## 4.2 API Design

API Type: **REST API**

The backend exposes REST endpoints consumed by the Next.js frontend.

API Responsibilities:

- authentication

- student management

- class management

- assessment operations

- grading

- meeting control

- notification handling

---

# 5. Database Layer

## 5.1 Database Engine

Database: **PostgreSQL**

PostgreSQL is the primary relational database used to store all EduTool data.

Reasons for Selection:

- Strong relational capabilities

- ACID compliance

- reliable transactions

- powerful indexing

- scalability for large datasets

Data Stored Includes:

- organizations

- students

- educators

- sections

- subjects

- classes

- enrollments

- lessons

- assessments

- submissions

- grades

- attendance records

- meetings

- audit logs

---

## 5.2 ORM (Object Relational Mapper)

ORM: **Prisma**

Prisma provides database access and schema management.

Responsibilities:

- schema modeling

- database migrations

- type-safe queries

- relationship mapping

Benefits:

- strong TypeScript support

- auto-generated types

- simplified database queries

- safer data operations

---

# 6. Real-Time Systems

## 6.1 Real-Time Communication

Technology: **Socket.IO**

Socket.IO is used for real-time communication between the server and connected clients.

Use Cases:

- live meeting rooms

- real-time notifications

- live attendance updates

- assessment status updates

---

# 7. Background Job Processing

## 7.1 Job Queue

Queue System: **BullMQ**

BullMQ handles asynchronous background tasks.

Example Jobs:

- AI assessment generation

- concept extraction

- scheduled notifications

- automated cleanup tasks

---

## 7.2 Queue Storage

Queue Backend: **Redis**

Redis is used to power BullMQ job queues and caching.

Responsibilities:

- background job storage

- caching layer

- temporary data storage

- real-time state coordination

---

# 8. Video Meeting System

EduTool includes a built-in video meeting system for educators and students.

Primary Technology: **WebRTC**

Capabilities:

- real-time video communication

- audio streaming

- screen sharing

- peer-to-peer connections

Optional Media Server (for scaling):

- mediasoup

---

# 9. Authentication System

Authentication Method:

- Email + Password login

- Credentials generated by Admin

- Session-based authentication using secure cookies

Security Components:

- JWT tokens

- HTTP-only cookies

- role-based access guards

- password hashing

Password Hashing Algorithm:

- bcrypt

---

# 10. File Storage

Storage System:

- Cloud Object Storage

Example Providers:

- AWS S3

- DigitalOcean Spaces

Use Cases:

- document attachments

- generated exports

- future media uploads

---

# 11. Export Generation

Export Formats:

- PDF

- CSV

Libraries Used:

- PDF generation library for class cards

- CSV generator for data exports

---

# 12. Deployment Infrastructure

## 12.1 Containerization

Container Platform: **Docker**

Docker is used to package the application and its dependencies.

Benefits:

- reproducible environments

- simplified deployment

- easier scaling

---

## 12.2 Hosting Infrastructure

Possible Hosting Platforms:

Cloud Providers:

- AWS

- DigitalOcean

- Google Cloud

Components Hosted:

- API server

- frontend server

- database

- Redis

- background workers

---

# 13. Version Control

Version Control System: **Git**

Repository Hosting Options:

- GitHub

- GitLab

---

# 14. Development Tools

Code Editor:

- Visual Studio Code

Package Manager:

- npm or pnpm

Code Quality Tools:

- ESLint

- Prettier

---

# 15. System Architecture Summary

Frontend

- Next.js

- React

- Tailwind CSS

- TypeScript

Backend

- NestJS

- REST API

- TypeScript

Database

- PostgreSQL

- Prisma ORM

Real-Time

- Socket.IO

Background Jobs

- BullMQ

- Redis

Meetings

- WebRTC

- mediasoup (optional)

Infrastructure

- Docker

- Cloud hosting

---

# 16. Future Technology Extensions

Potential future integrations may include:

- AI-assisted grading

- advanced analytics pipelines

- real-time collaborative learning tools

- mobile application clients

- offline learning capabilities

These features can be integrated into the current architecture without major structural changes.

---

EduTools

Technology Stack Document v1.0
