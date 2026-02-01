<p align="center">
  <img src="docs/assets/logo.svg" alt="Corbat-Coco Logo" width="200" />
</p>

<h1 align="center">Corbat-Coco</h1>

<p align="center">
  <strong>Autonomous Coding Agent with Self-Review, Quality Convergence, and Production-Ready Output</strong>
</p>

<p align="center">
  <a href="https://github.com/corbat/corbat-coco/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/corbat/corbat-coco/ci.yml?branch=main&label=CI" alt="CI Status" /></a>
  <a href="https://codecov.io/gh/corbat/corbat-coco"><img src="https://img.shields.io/codecov/c/github/corbat/corbat-coco?label=coverage" alt="Coverage" /></a>
  <a href="https://www.npmjs.com/package/corbat-coco"><img src="https://img.shields.io/npm/v/corbat-coco.svg" alt="npm version" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen" alt="Node.js Version" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.7+-blue.svg" alt="TypeScript" /></a>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#the-coco-methodology">Methodology</a> •
  <a href="#examples">Examples</a> •
  <a href="#documentation">Docs</a>
</p>

---

## What is Corbat-Coco?

Corbat-Coco is an **autonomous coding agent** that transforms natural language requirements into production-ready code. Unlike other AI coding tools, it **iteratively improves code until it meets senior-level quality standards**.

```
"Every line of code must be worthy of a senior engineer's signature."
```

### Why Corbat-Coco?

| Feature | Cursor/Copilot | Claude Code | **Corbat-Coco** |
|---------|:--------------:|:-----------:|:---------------:|
| Generate code | ✅ | ✅ | ✅ |
| Self-review loops | ❌ | ❌ | ✅ |
| Quality scoring | ❌ | ❌ | ✅ (11 dimensions) |
| Architecture planning | Basic | Basic | ✅ Full ADR system |
| Progress persistence | ❌ | Session | ✅ Checkpoints |
| Production deployment | ❌ | ❌ | ✅ CI/CD generation |

---

## Quick Start

### Installation

```bash
# Using npm
npm install -g corbat-coco

# Using pnpm (recommended)
pnpm add -g corbat-coco

# Verify installation
coco --version
```

### TL;DR (3 commands)

```bash
coco init my-project    # Initialize & describe what you want
coco plan               # Generate architecture & backlog
coco build              # Build with quality iteration
```

### Example Session

```bash
$ coco init my-api

🚀 Welcome to Corbat-Coco!

? What would you like to build?
> A REST API for task management with user authentication

? Tech stack preferences?
> TypeScript, Express, PostgreSQL, JWT auth

📋 Specification generated!

$ coco plan

📐 Designing architecture...
✓ ADR-001: Express.js framework
✓ ADR-002: JWT authentication
✓ ADR-003: PostgreSQL with Prisma

📝 Backlog: 2 epics, 8 stories, 24 tasks

$ coco build

🔨 Building Sprint 0...

Task 1/6: User entity ✓ (3 iterations, score: 92/100)
Task 2/6: Auth service ✓ (4 iterations, score: 89/100)
...

📊 Sprint Complete!
├─ Average quality: 90/100
├─ Test coverage: 87%
└─ Security issues: 0
```

### Example Session: Working on Existing Projects

For day-to-day development work on existing projects, use `coco task` to execute specific tasks:

```bash
$ cd my-existing-backend
$ coco task

? Describe your task (paste from Jira, GitHub issue, etc.):
> ## JIRA-1234: Add GET endpoint for user orders
>
> **Story Points:** 5
> **Acceptance Criteria:**
> - Create GET /api/v1/users/{userId}/orders endpoint
> - Return paginated list of orders (default: 20 items)
> - Support query params: status, fromDate, toDate, page, size
> - Include order items in response
> - Return 404 if user not found
> - Add unit tests (>80% coverage)
> - Update OpenAPI spec

🔍 Analyzing codebase...
✓ Detected: Java 17 + Spring Boot 3.2
✓ Found: OrderRepository, UserRepository, existing /api/v1/* structure
✓ Style: Following existing patterns in UserController.java

📋 Task breakdown:
1. Create OrderController with GET endpoint
2. Create OrderService with business logic
3. Create OrderDTO and OrderPageDTO
4. Add validation and error handling
5. Write unit tests for Service layer
6. Write integration tests for Controller
7. Update OpenAPI documentation

? Proceed with implementation? (Y/n) Y

🔨 Executing task...

Step 1/7: OrderController ✓ (2 iterations, score: 94/100)
  → Created: src/main/java/com/example/controller/OrderController.java
  → Follows existing controller patterns

Step 2/7: OrderService ✓ (3 iterations, score: 91/100)
  → Created: src/main/java/com/example/service/OrderService.java
  → Using existing OrderRepository

Step 3/7: DTOs ✓ (1 iteration, score: 96/100)
  → Created: OrderDTO.java, OrderPageDTO.java, OrderFilterDTO.java

Step 4/7: Error handling ✓ (2 iterations, score: 93/100)
  → Added: UserNotFoundException handling
  → Updated: GlobalExceptionHandler.java

Step 5/7: Unit tests ✓ (2 iterations, score: 89/100)
  → Created: OrderServiceTest.java (12 tests)
  → Coverage: 94%

Step 6/7: Integration tests ✓ (3 iterations, score: 88/100)
  → Created: OrderControllerIntegrationTest.java (8 tests)

Step 7/7: OpenAPI ✓ (1 iteration, score: 97/100)
  → Updated: openapi.yaml with new endpoint schema

📊 Task Complete!
├─ Files created: 6
├─ Files modified: 2
├─ Tests added: 20 (all passing)
├─ Coverage: 92%
├─ Average quality: 92/100
└─ Time: 12 minutes

? Create commit? (Y/n) Y
✓ Committed: feat(orders): add GET endpoint for user orders [JIRA-1234]

? Push to remote? (Y/n) Y
✓ Pushed to origin/feature/JIRA-1234-user-orders
```

**Pro tips for existing projects:**
- Coco automatically detects your tech stack and coding patterns
- Paste your Jira/GitHub issue directly - it parses acceptance criteria
- Use `coco task --dry-run` to preview without changes
- Use `coco task --no-commit` to skip auto-commit

---

## Features

### 🔄 Iterative Quality Improvement

Code is automatically reviewed and improved until it meets quality standards:

```
Generate → Test → Review → Improve → Repeat until excellent
```

### 📊 Multi-Dimensional Quality Scoring

11 dimensions measured on every iteration:

| Dimension | Weight | Description |
|-----------|:------:|-------------|
| Correctness | 15% | Tests pass, logic correct |
| Completeness | 10% | All requirements met |
| Robustness | 10% | Edge cases handled |
| Readability | 10% | Code clarity |
| Maintainability | 10% | Easy to modify |
| Complexity | 8% | Cyclomatic complexity |
| Duplication | 7% | DRY score |
| Test Coverage | 10% | Line/branch coverage |
| Test Quality | 5% | Test meaningfulness |
| Security | 8% | No vulnerabilities |
| Documentation | 4% | Doc coverage |
| Style | 3% | Linting compliance |

### 💾 Checkpoint & Recovery

Never lose progress:

- Automatic checkpoints every 5 minutes
- Resume from any interruption
- Full version history per task
- Rollback capability

### 🏗️ Architecture Documentation

Generated automatically:

- Architecture Decision Records (ADRs)
- System diagrams (C4 model)
- Backlog with epics, stories, tasks
- Sprint planning

### 🚀 Production Ready

Outputs ready for deployment:

- Dockerfile & docker-compose.yml
- GitHub Actions workflows
- README & API documentation
- Deployment guides

---

## The COCO Methodology

Four phases from idea to deployment:

```
┌──────────┐    ┌────────────┐    ┌──────────┐    ┌────────┐
│ CONVERGE │ →  │ ORCHESTRATE│ →  │ COMPLETE │ →  │ OUTPUT │
└──────────┘    └────────────┘    └──────────┘    └────────┘
     │               │                 │              │
 Understand      Plan &            Execute &      Deploy &
 Requirements    Design            Iterate        Document
```

| Phase | Purpose | Output |
|-------|---------|--------|
| **Converge** | Understand requirements through Q&A | Specification document |
| **Orchestrate** | Design architecture, create plan | ADRs, Backlog, Standards |
| **Complete** | Build with quality iteration | Quality code + tests |
| **Output** | Prepare for production | CI/CD, Docs, Deployment |

---

## Commands

```bash
# New projects
coco init [path]              # Initialize new project
coco plan                     # Run discovery and planning
coco build                    # Execute tasks with quality iteration
coco build --sprint=N         # Build specific sprint

# Existing projects (day-to-day workflow)
coco task                     # Execute a single task (Jira, GitHub issue, etc.)
coco task --dry-run           # Preview changes without applying
coco task --no-commit         # Skip auto-commit after task

# Utilities
coco status                   # Show current progress
coco status --verbose         # Detailed status
coco resume                   # Resume from checkpoint
coco config set <key> <value> # Configure settings
coco config get <key>         # Get configuration value
```

---

## Configuration

Configuration is stored in `.coco/config.json`:

```json
{
  "project": {
    "name": "my-project",
    "version": "0.1.0"
  },
  "provider": {
    "type": "anthropic",
    "model": "claude-sonnet-4-20250514"
  },
  "quality": {
    "minScore": 85,
    "minCoverage": 80,
    "maxIterations": 10,
    "convergenceThreshold": 2
  },
  "persistence": {
    "checkpointInterval": 300000,
    "maxCheckpoints": 50
  }
}
```

### Quality Thresholds

| Setting | Default | Description |
|---------|:-------:|-------------|
| `minScore` | 85 | Minimum quality score (0-100) |
| `minCoverage` | 80 | Minimum test coverage (%) |
| `maxIterations` | 10 | Max iterations per task |
| `convergenceThreshold` | 2 | Score delta to consider converged |

---

## Examples

See the [examples/](examples/) directory for complete examples:

| Example | Description | Time |
|---------|-------------|:----:|
| [REST API (TypeScript)](examples/01-rest-api-typescript/) | Task management API with auth | ~30 min |
| [CLI Tool](examples/02-cli-tool/) | Image processing CLI | ~25 min |
| [Spring Boot (Java)](examples/03-java-spring-boot/) | Order management microservice | ~40 min |

---

## Requirements

- **Node.js**: 22.0.0 or higher
- **Anthropic API Key**: For Claude models
- **Git**: For version control features

### Environment Variables

```bash
export ANTHROPIC_API_KEY="sk-ant-..."  # Required
export COCO_CONFIG_PATH="..."          # Optional: custom config path
```

---

## Documentation

### Guides
- [Quick Start Guide](docs/guides/QUICK_START.md) - Get started in 5 minutes
- [Configuration Guide](docs/guides/CONFIGURATION.md) - Complete configuration reference
- [Tutorial](docs/guides/AGENT_EVALUATION_AND_TUTORIAL.md) - Detailed tutorial with examples
- [Troubleshooting](docs/guides/TROUBLESHOOTING.md) - Common issues and solutions

### Technical
- [API Reference](docs/API.md) - Use Corbat-Coco as a library
- [Architecture](docs/architecture/ARCHITECTURE.md) - System design & C4 diagrams
- [ADRs](docs/architecture/adrs/) - Architecture Decision Records
- [Production Readiness](docs/PRODUCTION_READINESS_ASSESSMENT.md) - Assessment & roadmap

---

## Development

```bash
# Clone the repository
git clone https://github.com/corbat/corbat-coco.git
cd corbat-coco

# Install dependencies
pnpm install

# Run in development
pnpm dev --help

# Run tests
pnpm test

# Run all checks
pnpm check  # typecheck + lint + test

# Build
pnpm build
```

---

## Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) first.

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Write tests (80% coverage minimum)
4. Run checks (`pnpm check`)
5. Commit with conventional commits
6. Open a Pull Request

---

## Troubleshooting

### "API key not found"

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### "Quality score not improving"

- Check the quality report for specific issues
- Review suggestions in `.coco/versions/task-XXX/`
- Consider adjusting `maxIterations`

### "Checkpoint recovery failed"

```bash
coco resume --from-checkpoint=<id>
# Or start fresh:
coco build --restart
```

For more help, see [Issues](https://github.com/corbat/corbat-coco/issues).

---

## Roadmap

- [ ] OpenAI provider support
- [ ] Local model support (Ollama)
- [ ] VS Code extension
- [ ] Web dashboard
- [ ] Team collaboration features

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built with ❤️ by Corbat</strong>
</p>

<p align="center">
  <a href="https://github.com/corbat/corbat-coco">GitHub</a> •
  <a href="https://github.com/corbat/corbat-coco/issues">Issues</a> •
  <a href="CHANGELOG.md">Changelog</a>
</p>
