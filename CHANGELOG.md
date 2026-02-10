# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [1.1.0] - 2025-02-10

### Added
- 12-dimension quality scoring system with real analyzers
- Comprehensive test suite: 4,350+ tests across 171 test files
- Test coverage for 19 previously untested modules (cost-estimator, convergence-analyzer, context-enhancer, git-simple, skill-enhancer, diff-preview, provider-bridge, hooks, code-analyzer, git-enhanced, smart-suggestions, coordinator, progress, recovery, build-verifier, import-analyzer, simple-agent, agent-coordinator, fix-generator, test-analyzer, onboarding-v2)
- Multi-agent coordination with weighted scoring and tool-use
- Interactive onboarding with multi-provider support (Anthropic, OpenAI, Google, LM Studio)
- REPL with image attachment, diff preview, and smart suggestions
- Budget tracking and cost estimation for LLM operations
- Convergence analyzer for quality iteration loops
- Build verifier with real compilation and lint checks
- Import analyzer with circular dependency detection
- Recovery system with automatic LLM provider fallback cycling
- IMPROVEMENT_RESULTS.md documenting v1.1.0 audit and improvements

### Changed
- Test coverage increased from ~55% to 80%+ across all metrics
- Quality thresholds raised to 80% (lines, functions, branches, statements)
- Removed all excluded files from vitest.config.ts coverage exclusion list
- Enhanced README with badges and demo
- Connected Orchestrator with real Phase Executors
- Improved CLI commands (plan, status, build, resume, config)
- Multi-agent planning uses deterministic task IDs and normalized dependencies
- REPL initializes multi-agent provider bridge automatically
- Code review overall score recalculated after applying real coverage

### Fixed
- Recovery system now correctly classifies "overloaded" and "capacity" as LLM errors
- Cost estimator partial model matching uses longest-match-first ordering
- Smart suggestions empty catch block detection uses `endsWith()` for accuracy
- Test failure analyzer stack trace parsing with separate regex patterns for Node.js and simple formats
- Test failure analyzer root cause categorization ordering (syntax before type)
- Import analyzer circular dependency detection with .js→.ts extension mapping
- Onboarding LM Studio tests properly mock fetch to prevent real network calls
- All 9 lint warnings resolved (unused variables, self-assignments, regex patterns)
- Phase executor exports (Converge, Orchestrate, Complete, Output)
- CLI command exports and registrations
- TypeScript compilation errors in persistence.ts
- Re-export conflicts in phases/index.ts
- Agent coordinator preserves task metadata through dependency levels
- Avoid false build-failure issues when correctness analysis is unavailable
- OAuth callback server cleanup and test reliability improvements

---

## [1.0.2] - 2025-01-XX

### Fixed
- Package renamed to @corbat-tech/coco
- Version read dynamically from package.json

---

## [1.0.1] - 2025-01-XX

### Fixed
- Quality scoring and iteration improvements

---

## [1.0.0] - 2025-01-XX

### Added
- Initial stable release
- All core COCO methodology features

---

## [0.1.0] - 2024-XX-XX

### Added

#### Core Features
- **COCO Methodology**: Four-phase development approach
  - **CONVERGE**: Requirements discovery with interactive Q&A
  - **ORCHESTRATE**: Architecture planning with ADR generation
  - **COMPLETE**: Code generation with iterative quality improvement
  - **OUTPUT**: CI/CD and deployment artifact generation

#### CLI Commands
- `coco init [path]` - Initialize a new project
- `coco plan` - Run discovery and architecture planning
- `coco build` - Execute tasks with quality iteration
- `coco status` - Show current progress and metrics
- `coco resume` - Resume from last checkpoint
- `coco config` - Manage configuration settings

#### Quality System
- Multi-dimensional quality scoring (11 dimensions)
- Configurable thresholds (default: 85/100 minimum)
- Convergence detection algorithm
- Automatic iteration until quality targets met
- Quality dimensions:
  - Correctness (15%)
  - Completeness (10%)
  - Robustness (10%)
  - Readability (10%)
  - Maintainability (10%)
  - Complexity (8%)
  - Duplication (7%)
  - Test Coverage (10%)
  - Test Quality (5%)
  - Security (8%)
  - Documentation (4%)
  - Style (3%)

#### Persistence & Recovery
- Automatic checkpointing every 5 minutes
- Recovery from any interruption
- Version history for all tasks
- Rollback capability

#### LLM Integration
- Anthropic Claude provider (claude-sonnet-4-20250514)
- Tool use support
- Streaming responses
- Context management

#### Tools
- File operations (read, write, edit, glob)
- Bash command execution
- Git operations (status, commit, push, etc.)
- Test runner integration (vitest, jest, mocha)
- Quality analysis (linting, complexity)

#### Documentation
- Architecture documentation with C4 diagrams
- Architecture Decision Records (ADRs)
- Comprehensive README
- Contributing guidelines

### Technical Details

- **Runtime**: Node.js 22+
- **Language**: TypeScript 5.7+ with strict mode
- **Modules**: ESM only (no CommonJS)
- **CLI Framework**: Commander.js 13
- **Validation**: Zod 3.24
- **Testing**: Vitest 3
- **Linting**: oxlint
- **Formatting**: oxfmt

### Known Limitations

- Requires Anthropic API key (no local models yet)
- Node.js 22+ required (may limit some users)
- Single LLM provider (Anthropic only)

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 1.1.0 | 2025-02-10 | Pre-release quality improvements, 80%+ coverage, 12-dimension scoring |
| 1.0.2 | 2025-01 | Package rename, dynamic version |
| 1.0.1 | 2025-01 | Quality scoring improvements |
| 1.0.0 | 2025-01 | Initial stable release |
| 0.1.0 | TBD | Initial pre-release |

---

## Upgrade Guide

### Upgrading to 0.1.0

This is the initial release. No upgrade steps required.

Future versions will include upgrade guides here.

---

## Links

- [GitHub Repository](https://github.com/corbat/corbat-coco)
- [Documentation](https://github.com/corbat/corbat-coco/tree/main/docs)
- [Issues](https://github.com/corbat/corbat-coco/issues)

[Unreleased]: https://github.com/corbat-tech/corbat-coco/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/corbat-tech/corbat-coco/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/corbat-tech/corbat-coco/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/corbat-tech/corbat-coco/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/corbat-tech/corbat-coco/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/corbat-tech/corbat-coco/releases/tag/v0.1.0
