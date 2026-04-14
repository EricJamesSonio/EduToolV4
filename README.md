# EduTool

EduTool is a **multi-tenant SaaS school management system** built to handle flexible academic structures across different types of institutions.

## Overview

EduTool is designed around a **platform → organization → user** model:

- **Platform Owner**
  - Manages the overall system
  - Creates accounts for school **Admins**

- **Admin**
  - Manages a specific school (organization portal)
  - Creates and manages:
    - Educators
    - Students
  - Controls the academic structure and setup

- **Educators**
  - Handle classes, subjects, and grading

- **Students**
  - Enrolled into programs, levels, and classes

Each organization runs in its own **scoped portal**, meaning all data, users, and configurations are isolated per school.

---

## Academic Management

EduTool allows admins to fully customize their academic structure:

### Programs
Supports different types of programs such as:
- College
- Elementary
- Senior High School (SHS)
- Tech-Voc
- Or any custom program

### Levels
Programs can define their own levels:
- Grade 1, Grade 2, etc.
- 1st Year, 2nd Year, etc.

### Structure
Admins can manage:
- Sections
- Classes
- Subjects

---

## Grading System

EduTool includes a flexible and reusable grading system:

- **Grading Schemes**
  - Configurable templates
  - Reusable across programs and levels

- **Grading Scales**
  - Define how scores convert to grades
  - Reusable globally

- **Grade Locks**
  - Can be applied per school year or context
  - Used to finalize and control grade editing

---

## Reusable Templates

To reduce repetitive setup, EduTool provides reusable components:

- Grading schemes (global templates)
- Grading scales
- Calendar templates

---

## Organization Data Seeder

EduTool includes an **organization seeder** feature that allows admins to quickly set up a school by selecting predefined options.

This can automatically generate:
- Programs
- Levels
- Basic academic structure

This makes setup **fast, consistent, and easy**.

---

## Key Highlights

- Multi-tenant SaaS architecture
- Scoped organization-based portals
- Flexible academic structure (programs, levels, classes)
- Reusable grading and calendar systems
- Configurable grade locking
- Fast setup using data seeder

---

## Summary

EduTool is built to be a **flexible and scalable foundation** for schools, allowing administrators to freely model their academic system while keeping everything structured and manageable.