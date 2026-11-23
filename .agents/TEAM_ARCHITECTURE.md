# Autonomous Six-Agent Software Engineering Team Architecture

## Overview
This repository contains a full-lifecycle autonomous software engineering department configured directly within Antigravity's native custom-agent architecture (`.agents/agents/`). 

The team is orchestrated by the **CTO / Main Orchestrator** and consists of six specialized agents:

1. **Senior Software Engineer** (`senior-engineer.md`) — Technical Architect & Lead Implementer
2. **QA Engineer** (`qa-engineer.md`) — Test Automation & Quality Assurance Specialist
3. **Security Engineer** (`security-engineer.md`) — Application Security Architect
4. **Performance Engineer** (`performance-engineer.md`) — Performance & Scalability Engineer
5. **UI/UX Engineer** (`ui-ux-engineer.md`) — Senior Product Designer & Frontend UX Engineer
6. **Product Manager** (`product-manager.md`) — Senior Technical Product Manager & Strategist

---

## Organizational Hierarchy & Reporting Structure

```
                     CTO / MAIN ORCHESTRATOR
                                |
        +-----------------------+-----------------------+
        |                       |                       |
 Product Manager         Senior Engineer          UI/UX Engineer
 (Value & Scope)       (Architecture & Code)   (Design & Polish)
        |                       |                       |
        +-----------------------+-----------------------+
                                |
        +-----------------------+-----------------------+
        |                       |                       |
   QA Engineer          Security Engineer     Performance Engineer
(Verification & Tests)  (Hardening & Audit)   (Profiling & Speed)
```

The **CTO / Main Orchestrator** maintains ultimate accountability for:
- Task decomposition and delegation across the six agents.
- Conflict resolution between competing trade-offs (e.g. performance vs. feature complexity).
- Final code review, verification, and deployment approval.

---

## 10-Step Autonomous Engineering Lifecycle

Every engineering initiative, feature, or major refactor follows this disciplined 10-step workflow:

```
[Step 1: Product Definition] -> Product Manager (PRD, User Stories, Acceptance Criteria)
             ↓
[Step 2: Architecture Design] -> Senior Engineer (Technical Design, State Models, APIs)
             ↓
[Step 3: UX & Interface Review] -> UI/UX Engineer (Ergonomics, Responsive Layouts, Accessibility)
             ↓
[Step 4: Pre-Code Security Audit] -> Security Engineer (Threat Modeling, Boundary Checks)
             ↓
[Step 5: Implementation] -> Senior Engineer & UI/UX Engineer (Code, Components, Styles)
             ↓
[Step 6: Empirical Quality Assurance] -> QA Engineer (Automated Tests, Regression Suite, Cross-Device)
             ↓
[Step 7: Performance Profiling] -> Performance Engineer (Vitals, Latency, Memory, Bundle Analysis)
             ↓
[Step 8: Post-Code Security Review] -> Security Engineer (Secrets Audit, Static Analysis, CVE Check)
             ↓
[Step 9: Product Acceptance Sign-Off] -> Product Manager (Acceptance Criteria Verification)
             ↓
[Step 10: Final CTO Sign-Off & Ship] -> CTO (Synthesis, Deliverable Packaging, Deployment)
```

---

## Agent Roster & Responsibility Matrix

| Agent | Scope | Primary Tools | Application Code Permissions |
| :--- | :--- | :--- | :--- |
| **Product Manager** | Requirements, User Stories, Feature Backlog, Roadmap, Commercial Viability | `read_file`, `search_web` | Read-only |
| **Senior Engineer** | System Architecture, Data Flow, Feature Implementation, Bug Fixing, TypeScript | `read_file`, `edit_file`, `write_file`, `run_command`, `manage_task`, `search_web` | Read-Write (Full) |
| **UI/UX Engineer** | Design System, Responsiveness, Mobile Touch, Micro-Interactions, WCAG a11y | `read_file`, `edit_file`, `write_file`, `run_command`, `manage_task`, `search_web` | Read-Write (Frontend/CSS) |
| **QA Engineer** | Unit/E2E Tests, Boundary Verification, Defect Reproduction, Regression Suites | `read_file`, `edit_file`, `write_file`, `run_command`, `manage_task`, `search_web` | Test Files & Harness Only |
| **Security Engineer** | Threat Modeling, Auth/Authz, Injection/XSS, Secrets Audit, CVEs | `read_file`, `run_command`, `search_web` | Read-only (Audit & Guidelines) |
| **Performance Engineer** | Core Web Vitals, API Latency, Bundle Tree Shaking, Memory & Canvas Profiling | `read_file`, `edit_file`, `write_file`, `run_command`, `manage_task`, `search_web` | Read-Write (Optimization/Config) |

---

## Antigravity Discovery & Invocation

These agent files reside in `.agents/agents/` at the repository root and are automatically discovered by Antigravity's workspace configuration engine.

### Invoking Agents
Agents can be invoked programmatically via Antigravity's `invoke_subagent` tool or delegated to during multi-agent workflows:

```typescript
// Example: Invoking the Senior Engineer
invoke_subagent({
  TypeName: "senior-engineer",
  Role: "Technical Architect",
  Prompt: "Analyze the audio state management in CreateSpotModal and design a modular hook."
});

// Example: Invoking the QA Engineer
invoke_subagent({
  TypeName: "qa-engineer",
  Role: "QA Specialist",
  Prompt: "Execute regression tests for the live preview canvas and bottom-sheet drawers across 375px and 1280px viewports."
});
```
