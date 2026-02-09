# CORBAT-COCO: Plan Maestro de Mejoras v1.0

> **Objetivo**: Convertir Corbat-Coco en el agente de programacion #1 del mercado.
> **Metodo**: Ejecucion autonoma con auto-revision iterativa y convergencia.
> **Criterio de parada**: Puntuacion global >= 9.0/10 Y delta entre iteraciones < 2%.

---

## INSTRUCCIONES DE EJECUCION

```
Para ejecutar este plan, usa el siguiente prompt con cualquier agente LLM:

"Ejecuta el plan de mejora de Corbat-Coco ubicado en docs/IMPROVEMENT_PLAN.md.
Sigue las fases en orden estricto. Cada fase tiene tareas numeradas.
Ejecuta cada tarea completamente, incluyendo tests y verificacion.
Al final de cada fase, ejecuta la auto-revision del scorecard.
NO preguntes al usuario. NO pares hasta completar TODAS las fases
o hasta que el scorecard global >= 9.0 Y delta < 2%.
Usa pnpm check (typecheck + lint + test) para verificar cada cambio."
```

---

## PROTOCOLO DE AUTO-REVISION

Al completar CADA fase, el agente ejecutor debe:

1. Ejecutar `pnpm check` (typecheck + lint + test)
2. Ejecutar `pnpm build`
3. Evaluar el SCORECARD de la fase (puntuacion 0-10 por criterio)
4. Calcular la PUNTUACION GLOBAL ponderada
5. Calcular el DELTA vs la iteracion anterior
6. Si global >= 9.0 Y delta < 2% -> CONVERGENCIA ALCANZADA, parar
7. Si no -> continuar con la siguiente fase
8. Persistir los resultados en `docs/audits/improvement-scorecard.json`

### Scorecard Template

```json
{
  "iteration": 1,
  "phase": "F1",
  "timestamp": "ISO-8601",
  "scores": {
    "code_correctness": { "score": 0, "weight": 0.15, "notes": "" },
    "context_memory": { "score": 0, "weight": 0.10, "notes": "" },
    "transparency_control": { "score": 0, "weight": 0.10, "notes": "" },
    "cost_predictability": { "score": 0, "weight": 0.08, "notes": "" },
    "codebase_understanding": { "score": 0, "weight": 0.10, "notes": "" },
    "multi_agent": { "score": 0, "weight": 0.10, "notes": "" },
    "skills_extensibility": { "score": 0, "weight": 0.08, "notes": "" },
    "privacy": { "score": 0, "weight": 0.05, "notes": "" },
    "ux_terminal": { "score": 0, "weight": 0.08, "notes": "" },
    "quality_system": { "score": 0, "weight": 0.08, "notes": "" },
    "multi_provider": { "score": 0, "weight": 0.03, "notes": "" },
    "git_integration": { "score": 0, "weight": 0.05, "notes": "" },
    "documentation_community": { "score": 0, "weight": 0.05, "notes": "" },
    "unique_differentiators": { "score": 0, "weight": 0.05, "notes": "" }
  },
  "global_score": 0,
  "delta_vs_previous": null,
  "converged": false,
  "tests_passing": 0,
  "build_success": true
}
```

**Calculo global**: SUM(score_i * weight_i) para todos los criterios.
**Pesos suman**: 1.20 (normalizar dividiendo entre 1.20 para obtener 0-10).

### Puntuacion Base (Pre-mejoras, Iteracion 0)

```json
{
  "iteration": 0,
  "phase": "BASELINE",
  "scores": {
    "code_correctness": { "score": 7.0, "weight": 0.15 },
    "context_memory": { "score": 8.0, "weight": 0.10 },
    "transparency_control": { "score": 8.0, "weight": 0.10 },
    "cost_predictability": { "score": 9.0, "weight": 0.08 },
    "codebase_understanding": { "score": 7.0, "weight": 0.10 },
    "multi_agent": { "score": 2.0, "weight": 0.10 },
    "skills_extensibility": { "score": 6.0, "weight": 0.08 },
    "privacy": { "score": 9.0, "weight": 0.05 },
    "ux_terminal": { "score": 8.0, "weight": 0.08 },
    "quality_system": { "score": 9.0, "weight": 0.08 },
    "multi_provider": { "score": 9.0, "weight": 0.03 },
    "git_integration": { "score": 7.0, "weight": 0.05 },
    "documentation_community": { "score": 3.0, "weight": 0.05 },
    "unique_differentiators": { "score": 7.0, "weight": 0.05 }
  },
  "global_score": 7.08,
  "delta_vs_previous": null,
  "converged": false,
  "tests_passing": 3828,
  "build_success": true
}
```

---

## FASES DE EJECUCION

---

### FASE 1: LIFECYCLE HOOKS SYSTEM
**Impacto esperado**: skills_extensibility 6->8, transparency_control 8->9, unique_differentiators 7->8
**Prioridad**: CRITICA
**Estimacion**: 15-20 archivos, ~1500 LOC

#### Contexto
Claude Code tiene PreToolUse/PostToolUse/Stop hooks que los usuarios consideran un "game changer". Corbat-Coco no tiene ningun sistema de hooks. Esto es el gap mas critico vs la competencia.

#### Tareas

**F1.1** Crear tipos de hooks en `src/hooks/types.ts`:
```typescript
export type HookPhase = "preToolUse" | "postToolUse" | "prePhase" | "postPhase" | "onError" | "onStop";

export interface HookContext {
  phase: HookPhase;
  toolName?: string;
  toolInput?: unknown;
  toolOutput?: unknown;
  error?: Error;
  session: { projectPath: string; provider: string; model: string };
  abort: () => void;       // Cancel the current operation
  modify: (data: unknown) => void; // Modify tool input/output
}

export interface HookDefinition {
  name: string;
  phase: HookPhase;
  priority?: number;       // Lower = runs first (default 100)
  enabled?: boolean;
  pattern?: string;        // Glob pattern for tool names (e.g., "bash*", "file*")
  handler: (context: HookContext) => Promise<HookResult>;
}

export interface HookResult {
  action: "continue" | "skip" | "abort" | "modify";
  data?: unknown;          // Modified data if action is "modify"
  message?: string;        // Optional message to display
}
```

**F1.2** Crear registro de hooks en `src/hooks/registry.ts`:
- `HookRegistry` class con `register(hook)`, `unregister(name)`, `getHooks(phase)`
- Ejecucion en orden de prioridad
- Soporte para hooks sincronos y async
- Pattern matching con micromatch para filtrar por tool name

**F1.3** Crear hooks built-in en `src/hooks/builtin/`:
- `auto-format.ts` — PostToolUse: auto-formatea codigo despues de writeFile/editFile
- `audit-log.ts` — PreToolUse+PostToolUse: registra todas las operaciones en `.coco/audit.log`
- `safety-guard.ts` — PreToolUse: bloquea comandos peligrosos (rm -rf /, DROP TABLE, etc.)
- `auto-lint.ts` — PostToolUse: ejecuta linter despues de cambios de codigo

**F1.4** Integrar hooks en el agent loop (`src/cli/repl/agent-loop.ts`):
- Antes de ejecutar tool: `runHooks("preToolUse", context)`
- Si resultado es "skip" o "abort": no ejecutar tool
- Si resultado es "modify": usar datos modificados
- Despues de ejecutar tool: `runHooks("postToolUse", context)`

**F1.5** Configuracion de hooks en `.corbat.json`:
```json
{
  "hooks": {
    "preToolUse": [
      { "name": "safety-guard", "enabled": true },
      { "name": "audit-log", "enabled": true }
    ],
    "postToolUse": [
      { "name": "auto-format", "pattern": "writeFile|editFile", "enabled": true },
      { "name": "auto-lint", "pattern": "writeFile|editFile", "enabled": true }
    ]
  }
}
```

**F1.6** Comando `/hooks` para gestionar hooks en runtime:
- `/hooks list` — mostrar hooks activos
- `/hooks enable <name>` — activar hook
- `/hooks disable <name>` — desactivar hook
- `/hooks add <file>` — cargar hook desde archivo JS/TS

**F1.7** Tests:
- Unit tests para HookRegistry (register, unregister, execution order, pattern matching)
- Unit tests para cada hook builtin
- Integration test: hook modifica input de tool, hook cancela tool
- Coverage >= 80% para `src/hooks/`

**F1.8** Verificacion:
- `pnpm check` pasa
- `pnpm build` exitoso
- Tests de hooks: todos verdes

---

### FASE 2: SUB-AGENTES Y MULTI-AGENT PARALLELISM
**Impacto esperado**: multi_agent 2->7, codebase_understanding 7->8, unique_differentiators 8->9
**Prioridad**: CRITICA
**Estimacion**: 20-25 archivos, ~2000 LOC

#### Contexto
Claude Code tiene agent teams con contexto forked. Kimi Code tiene hasta 100 agentes en swarm. Coco no tiene ninguna capacidad multi-agente. Este es el gap mas grande (2/10).

#### Tareas

**F2.1** Crear tipos de sub-agente en `src/agents/types.ts`:
```typescript
export interface SubAgentConfig {
  id: string;
  name: string;
  description: string;
  model?: string;            // Override model for this agent
  provider?: string;         // Override provider
  tools?: string[];          // Restrict available tools
  systemPrompt?: string;     // Custom system prompt
  maxTurns?: number;         // Max conversation turns
  timeout?: number;          // Timeout in ms
  isolated?: boolean;        // Fork context (no shared state)
}

export interface SubAgentResult {
  agentId: string;
  status: "completed" | "failed" | "timeout" | "aborted";
  output: string;            // Final text output
  artifacts: Artifact[];     // Files created/modified
  tokensUsed: { input: number; output: number };
  cost: number;
  duration: number;
}

export interface Artifact {
  path: string;
  action: "created" | "modified" | "deleted";
  diff?: string;
}
```

**F2.2** Crear SubAgent executor en `src/agents/executor.ts`:
- `executeSubAgent(config, task, parentContext)` — ejecuta un sub-agente
- Fork del contexto conversacional (messages hasta el punto actual)
- Tool registry filtrado segun `config.tools`
- Limite de turns y timeout
- Recoleccion de artifacts (archivos creados/modificados)
- Streaming de progreso al parent

**F2.3** Crear SubAgent orchestrator en `src/agents/orchestrator.ts`:
- `runParallel(agents[])` — ejecuta multiples sub-agentes en paralelo
- `runSequential(agents[])` — ejecuta en secuencia
- `runPipeline(agents[])` — output de uno es input del siguiente
- Merge de artifacts sin conflictos (detect file conflicts)
- Agregacion de resultados y costes

**F2.4** Crear tool `spawnAgent` en `src/tools/agent.ts`:
- El LLM puede invocar `spawnAgent` como tool call
- Parametros: name, task description, tools restriction, model override
- Retorna el resultado del sub-agente
- Soporte para spawn multiple agents en paralelo (tool call batch)

**F2.5** Display multi-agente en `src/cli/repl/output/`:
- Spinner por agente con nombre y estado
- Progress bars paralelas
- Merge report al finalizar (que hizo cada agente)
- Cost breakdown por agente

**F2.6** Integracion con COCO quality loop:
- En COCO mode, el agente principal puede spawnar sub-agentes para:
  - Escribir tests en paralelo mientras otro escribe codigo
  - Review agent que revisa el output de otro agente
  - Doc agent que genera documentacion en paralelo

**F2.7** Comando `/agent`:
- `/agent spawn "write tests for auth module" --tools test,file --model haiku`
- `/agent list` — ver agentes activos
- `/agent status <id>` — ver estado de agente
- `/agent abort <id>` — cancelar agente

**F2.8** Tests:
- Unit tests para SubAgent executor (isolation, tool filtering, turn limits)
- Unit tests para orchestrator (parallel, sequential, pipeline)
- Integration test: spawn 2 agents, verify parallel execution
- Integration test: detect and resolve file conflicts
- Coverage >= 80% para `src/agents/`

**F2.9** Verificacion:
- `pnpm check` pasa
- `pnpm build` exitoso
- Multi-agent tests: todos verdes

---

### FASE 3: STREAMING DIFF PREVIEW (Pre-Apply)
**Impacto esperado**: transparency_control 9->10, ux_terminal 8->9, code_correctness 7->8
**Prioridad**: ALTA
**Estimacion**: 8-12 archivos, ~800 LOC

#### Contexto
Cursor y Claude Code muestran diffs ANTES de aplicar. Coco aplica directamente. El 45% de usuarios de SO2025 citan "almost-right code" como frustracion #1. Un diff preview permite rechazar cambios malos.

#### Tareas

**F3.1** Crear DiffPreview renderer en `src/cli/repl/output/diff-preview.ts`:
- Genera diff visual ANTES de aplicar cambios
- Muestra lineas added (verde), removed (rojo), context (gris)
- Numeracion de lineas
- Syntax highlighting en el diff
- Header con filename y stats (+N/-N)

**F3.2** Crear approval flow en `src/cli/repl/confirmation-diff.ts`:
- Despues de cada writeFile/editFile, ANTES de aplicar:
  - Mostrar diff preview
  - Opciones: [A]ccept, [R]eject, [E]dit (abrir en $EDITOR), [S]kip
  - Accept: aplicar cambio
  - Reject: descartar y notificar al LLM
  - Edit: abrir diff en editor externo, aplicar resultado
  - Skip: saltar este archivo, continuar con el siguiente
- Batch mode: "Accept All" para aceptar todos los cambios pendientes

**F3.3** Configuracion de preview mode:
- En `.corbat.json`:
  ```json
  { "diffPreview": { "enabled": true, "autoAcceptThreshold": 10 } }
  ```
- `autoAcceptThreshold`: si el diff es <= N lineas, auto-accept
- `/preview on|off` — toggle en runtime
- Flag `--no-preview` en CLI

**F3.4** Integracion con agent-loop:
- Hook PostToolUse que intercepta writeFile/editFile
- Si preview enabled: mostrar diff, esperar input
- Si rejected: devolver error al LLM con feedback
- El LLM puede intentar de nuevo con los comentarios del usuario

**F3.5** Keyboard shortcuts en diff preview:
- `a` — Accept this change
- `r` — Reject this change
- `A` — Accept all remaining
- `R` — Reject all remaining
- `e` — Edit in $EDITOR
- `n` — Next file
- `p` — Previous file
- `q` — Cancel all

**F3.6** Tests:
- Unit tests para DiffPreview renderer (syntax highlighting, line numbers)
- Unit tests para approval flow (accept, reject, batch)
- Integration test: tool produces diff, user accepts/rejects
- Coverage >= 80%

**F3.7** Verificacion:
- `pnpm check` pasa
- `pnpm build` exitoso
- Diff preview tests: todos verdes

---

### FASE 4: GIT INTEGRATION AVANZADA
**Impacto esperado**: git_integration 7->9, code_correctness 8->9
**Prioridad**: ALTA
**Estimacion**: 8-10 archivos, ~600 LOC

#### Contexto
Aider tiene la mejor git integration (10/10): auto-commit, tree-sitter AST, auto-lint post-edit. Coco tiene buena base pero le falta automatizacion.

#### Tareas

**F4.1** Auto-commit mode en `src/tools/git-auto.ts`:
- Despues de cada cambio exitoso del agente:
  - Stage archivos modificados
  - Generar mensaje de commit convencional del diff
  - Commit automatico con prefijo `[coco]` o `[ai]`
- Configurable: `.corbat.json` -> `{ "git": { "autoCommit": true, "commitPrefix": "[coco]" } }`
- Toggle: `/autocommit on|off`

**F4.2** Smart commit messages:
- Analizar el diff para generar mensajes descriptivos
- Formato conventional commits: `feat(scope): description`
- Detectar tipo automaticamente: feat, fix, refactor, test, docs, chore
- Detectar scope del path de archivos modificados

**F4.3** Branch protection:
- Detectar si estamos en main/master y avisar
- Sugerir crear branch antes de cambios
- Auto-create branch opcional: `coco/task-{id}`

**F4.4** Undo stack mejorado:
- Historial de todos los commits de coco en la sesion
- `/undo` sin args: undo ultimo commit de coco
- `/undo N` — undo ultimos N commits
- `/undo --to <hash>` — undo hasta un commit especifico
- Preview de lo que se va a deshacer

**F4.5** Diff stats en cada turno:
- Despues de cada respuesta del agente, mostrar resumen:
  ```
  Changes: 3 files (+45/-12), 2 commits
  ```
- Acumulado de sesion visible con `/status`

**F4.6** Tests:
- Unit tests para auto-commit (message generation, staging)
- Unit tests para undo stack (undo N, undo --to)
- Integration tests con git repo temporal
- Coverage >= 80%

**F4.7** Verificacion:
- `pnpm check` pasa
- `pnpm build` exitoso

---

### FASE 5: AST-AWARE EDITING (Tree-sitter)
**Impacto esperado**: code_correctness 9->10, codebase_understanding 8->9
**Prioridad**: ALTA
**Estimacion**: 10-15 archivos, ~1200 LOC

#### Contexto
Aider usa tree-sitter para parsear AST antes de editar. Esto reduce errores de edicion (imports faltantes, syntax breaks) significativamente. La tasa de error de diffs de Kimi es 3.3% gracias a esto.

#### Tareas

**F5.1** Instalar y configurar tree-sitter:
- `pnpm add tree-sitter tree-sitter-typescript tree-sitter-python tree-sitter-javascript tree-sitter-go tree-sitter-rust tree-sitter-java`
- Crear `src/ast/parser.ts` con factory de parsers por lenguaje
- Detectar lenguaje del archivo por extension

**F5.2** Crear AST analyzer en `src/ast/analyzer.ts`:
- `parseFile(path)` — parse y devolver AST
- `getImports(ast)` — extraer imports/requires
- `getExports(ast)` — extraer exports
- `getFunctions(ast)` — extraer funciones/metodos con signatures
- `getClasses(ast)` — extraer clases con metodos
- `getSymbols(ast)` — todos los simbolos definidos

**F5.3** Validacion pre-edit en `src/ast/validator.ts`:
- Antes de aplicar editFile/writeFile:
  - Parsear archivo original
  - Aplicar cambio en memoria
  - Parsear resultado
  - Si hay errores de syntax -> rechazar edit, informar al LLM
- Detectar imports faltantes automaticamente
- Sugerir imports basados en simbolos usados pero no importados

**F5.4** Auto-fix post-edit:
- Hook PostToolUse que:
  - Verifica syntax del archivo editado
  - Si falta import: auto-agregar basado en el codebase map
  - Si hay syntax error: intentar fix automatico
  - Si no puede fixear: reportar al LLM con contexto

**F5.5** Codebase index mejorado:
- Indexar todos los exports de todos los archivos al inicio de sesion
- Cache en `.coco/ast-index.json`
- Invalidar cache cuando archivos cambian
- Lookup rapido: "que archivo exporta X?"

**F5.6** Integracion con editFile tool:
- Antes de ejecutar editFile, validar que el old_string existe
- Si no existe: buscar en AST la ubicacion correcta
- Sugerir alternativa al LLM con contexto exacto

**F5.7** Tests:
- Unit tests para parser (TS, JS, Python, Go)
- Unit tests para analyzer (imports, exports, functions)
- Unit tests para validator (syntax check, missing imports)
- Integration test: edit with auto-import fix
- Coverage >= 80%

**F5.8** Verificacion:
- `pnpm check` pasa
- `pnpm build` exitoso

---

### FASE 6: COST ESTIMATOR PRE-REQUEST
**Impacto esperado**: cost_predictability 9->10, ux_terminal 9->9.5
**Prioridad**: MEDIA-ALTA
**Estimacion**: 5-8 archivos, ~400 LOC

#### Contexto
Sorpresas de coste es queja #1 de Cline y Cursor. Coco ya tiene cost tracking pero no estima ANTES de ejecutar.

#### Tareas

**F6.1** Crear estimador en `src/providers/cost-estimator.ts`:
- `estimateCost(prompt, model, options)`:
  - Contar tokens del prompt
  - Estimar tokens de respuesta (heuristica: 2-4x input para codigo)
  - Si COCO mode: multiplicar por iteraciones esperadas (3-5x)
  - Retornar rango: `{ min: $0.12, max: $0.45, expected: $0.25 }`
- Historial de estimaciones vs costes reales para mejorar heuristica

**F6.2** Mostrar estimacion antes de cada request costoso:
- Si coste estimado > $0.50: mostrar warning amarillo
- Si coste estimado > $2.00: pedir confirmacion
- Threshold configurable en `.corbat.json`
- Formato: `Estimated cost: ~$0.25 (3-5 iterations). Continue? [Y/n]`

**F6.3** Budget mode:
- `/budget set $5.00` — establecer presupuesto de sesion
- `/budget status` — ver gasto actual vs presupuesto
- Auto-pausa cuando se alcanza el 80% del presupuesto
- Warning a 50%, 80%, 95%

**F6.4** Cost dashboard mejorado en `/cost`:
- Breakdown por modelo
- Breakdown por tool (que tools consumen mas tokens)
- Grafico de gasto por tiempo (ASCII chart)
- Estimacion de coste restante si hay tareas pendientes

**F6.5** Tests:
- Unit tests para estimador (accuracy vs heuristics)
- Unit tests para budget mode (alerts, pause)
- Coverage >= 80%

**F6.6** Verificacion:
- `pnpm check` pasa
- `pnpm build` exitoso

---

### FASE 7: SESSION TELEPORTATION & WEB COMPANION
**Impacto esperado**: ux_terminal 9.5->10, unique_differentiators 9->10
**Prioridad**: MEDIA
**Estimacion**: 15-20 archivos, ~1500 LOC

#### Contexto
Claude Code permite `/teleport` para continuar sesiones en web. Esto es util para monitorear tareas largas. Ningun agente open-source tiene esto.

#### Tareas

**F7.1** Crear servidor SSE embebido en `src/web/server.ts`:
- Servidor HTTP minimo (sin framework, solo `node:http`)
- Endpoint GET `/events` — SSE stream de eventos de la sesion
- Endpoint GET `/` — servir pagina HTML estatica
- Endpoint GET `/state` — estado actual de la sesion (JSON)
- Solo escuchar en localhost (127.0.0.1)
- Puerto configurable (default 4321)

**F7.2** Crear pagina web companion en `src/web/static/`:
- HTML+CSS+JS vanilla (sin framework, single file `index.html`)
- Mostrar:
  - Output streaming del agente (markdown rendered)
  - Tools en ejecucion (spinners)
  - Quality scores (si COCO mode)
  - Cost tracking
  - Task progress
- Responsive para mobile

**F7.3** Streaming de eventos desde el REPL:
- Emitir eventos SSE para:
  - `agent:stream` — chunks de texto del agente
  - `tool:start` / `tool:end` — inicio/fin de tools
  - `quality:score` — actualizacion de quality scores
  - `cost:update` — actualizacion de costes
  - `session:state` — cambios de estado de sesion
- Bridge entre el event system del REPL y el SSE server

**F7.4** Comando `/web`:
- `/web start` — iniciar servidor web companion
- `/web stop` — detener servidor
- `/web` — mostrar URL y QR code (para mobile)
- Auto-open en browser con `open http://localhost:4321`

**F7.5** Session export/import:
- `/export` — exportar sesion completa como JSON
- `/import <file>` — importar sesion y continuar
- Util para pasar sesiones entre maquinas

**F7.6** Tests:
- Unit tests para SSE server (event streaming)
- Unit tests para session export/import
- Integration test: start server, connect SSE, receive events
- Coverage >= 80%

**F7.7** Verificacion:
- `pnpm check` pasa
- `pnpm build` exitoso

---

### FASE 8: BROWSER AUTOMATION (Headless)
**Impacto esperado**: unique_differentiators 10->10, skills_extensibility 8->9
**Prioridad**: MEDIA
**Estimacion**: 10-12 archivos, ~1000 LOC

#### Contexto
Cline tiene browser automation con visual debugging. Util para testing visual, web scraping, y captura de screenshots para context.

#### Tareas

**F8.1** Instalar Playwright como dependencia opcional:
- `pnpm add -D playwright @playwright/test`
- Lazy-load: no cargar hasta que se use
- Si no instalado: mostrar instruccion de instalacion

**F8.2** Crear tool `browser` en `src/tools/browser.ts`:
- `browser.navigate(url)` — navegar a URL
- `browser.screenshot()` — captura de pantalla (devuelve base64)
- `browser.click(selector)` — click en elemento
- `browser.type(selector, text)` — escribir en input
- `browser.evaluate(script)` — ejecutar JS en la pagina
- `browser.getText(selector)` — extraer texto
- `browser.waitFor(selector)` — esperar a elemento
- `browser.close()` — cerrar browser

**F8.3** Integracion con imagen:
- Screenshots del browser se envian como ImageContent al LLM
- El agente puede "ver" la pagina y tomar decisiones
- Ciclo: navigate -> screenshot -> analyze -> interact -> screenshot

**F8.4** Comando `/browse`:
- `/browse <url>` — abrir URL y mostrar screenshot
- `/browse screenshot` — capturar estado actual
- `/browse close` — cerrar browser

**F8.5** Tests:
- Unit tests para browser tools (mocked Playwright)
- Integration test con pagina HTML local
- Coverage >= 80%

**F8.6** Verificacion:
- `pnpm check` pasa
- `pnpm build` exitoso

---

### FASE 9: PLUGIN/EXTENSION SYSTEM
**Impacto esperado**: skills_extensibility 9->10, unique_differentiators 10->10
**Prioridad**: MEDIA
**Estimacion**: 12-15 archivos, ~1000 LOC

#### Contexto
Continue.dev tiene extensiones MCP. Cursor tiene plugins. Coco necesita un sistema de plugins first-class para que la comunidad contribuya tools, providers, y hooks personalizados.

#### Tareas

**F9.1** Crear plugin manifest en `src/plugins/types.ts`:
```typescript
interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  type: "tool" | "provider" | "hook" | "skill" | "theme";
  main: string;              // Entry point file
  dependencies?: Record<string, string>;
  config?: z.ZodSchema;     // Plugin configuration schema
}
```

**F9.2** Crear plugin loader en `src/plugins/loader.ts`:
- Buscar plugins en:
  - `~/.coco/plugins/` — plugins globales
  - `.coco/plugins/` — plugins de proyecto
  - `node_modules/coco-plugin-*` — plugins npm
- Cargar dynamically con `import()`
- Validar manifest contra schema
- Resolver dependencias

**F9.3** Crear plugin registry en `src/plugins/registry.ts`:
- `installPlugin(source)` — instalar desde npm, git, o path local
- `uninstallPlugin(name)` — desinstalar
- `listPlugins()` — listar instalados
- `enablePlugin(name)` / `disablePlugin(name)` — toggle

**F9.4** Comando `/plugin`:
- `/plugin list` — ver plugins instalados
- `/plugin install <name>` — instalar plugin
- `/plugin remove <name>` — desinstalar
- `/plugin create <name>` — scaffold un nuevo plugin
- `/plugin info <name>` — ver detalles

**F9.5** Plugin scaffold template:
- `coco plugin create my-tool` genera:
  ```
  coco-plugin-my-tool/
  ├── package.json
  ├── manifest.json
  ├── src/
  │   └── index.ts
  ├── test/
  │   └── index.test.ts
  └── README.md
  ```

**F9.6** Tests:
- Unit tests para plugin loader (load, validate, resolve deps)
- Unit tests para registry (install, uninstall, enable/disable)
- Integration test: create plugin, install, use in session
- Coverage >= 80%

**F9.7** Verificacion:
- `pnpm check` pasa
- `pnpm build` exitoso

---

### FASE 10: DOCUMENTATION, WEB & COMMUNITY FOUNDATION
**Impacto esperado**: documentation_community 3->7
**Prioridad**: ALTA (pero no bloquea features)
**Estimacion**: 10-15 archivos, documentacion

#### Tareas

**F10.1** README.md completo:
- Logo y badges (npm, tests, coverage, license)
- Quick start (3 lineas: install, config, run)
- Feature highlights con GIF/screenshots
- Comparison table vs competencia
- Architecture overview diagram
- Contributing guide
- License (MIT)

**F10.2** Documentacion de usuario en `docs/guides/`:
- `getting-started.md` — instalacion, configuracion inicial
- `commands.md` — todos los slash commands con ejemplos
- `tools.md` — todos los tools disponibles
- `providers.md` — configurar cada provider
- `coco-mode.md` — como funciona el quality loop
- `hooks.md` — sistema de hooks
- `plugins.md` — crear y usar plugins
- `sub-agents.md` — multi-agent parallelism
- `mcp.md` — configurar MCP servers
- `faq.md` — preguntas frecuentes

**F10.3** API docs autogeneradas:
- Usar typedoc para generar docs de la API publica
- Script: `pnpm docs:api`
- Output en `docs/api/`

**F10.4** CHANGELOG.md:
- Formato keepachangelog
- Generar desde git log con conventional commits
- Script: `pnpm changelog`

**F10.5** Verificacion:
- Todos los docs compilan (no broken links)
- README renderiza correctamente en GitHub

---

### FASE 11: VOICE INPUT
**Impacto esperado**: ux_terminal 10->10, unique_differentiators 10->10
**Prioridad**: BAJA
**Estimacion**: 5-8 archivos, ~500 LOC

#### Tareas

**F11.1** Crear voice input module en `src/cli/repl/input/voice.ts`:
- Usar Whisper API (OpenAI) o local whisper.cpp
- Grabar desde microfono con `node-record-lpcm16` o `sox`
- Transcribir a texto
- Insertar texto transcrito en el input del REPL

**F11.2** Keybinding Ctrl+M para toggle recording:
- Press once: start recording (visual indicator)
- Press again: stop recording, transcribe, insert text
- Timeout: auto-stop at 30 seconds

**F11.3** Configuracion:
- Provider: `openai` (API) o `local` (whisper.cpp)
- Language: auto-detect o forced
- En `.corbat.json`: `{ "voice": { "enabled": true, "provider": "openai" } }`

**F11.4** Tests:
- Unit tests para voice module (mock recording, transcription)
- Coverage >= 80%

**F11.5** Verificacion:
- `pnpm check` pasa
- `pnpm build` exitoso

---

### FASE 12: SMART CODEBASE INDEX (Embeddings)
**Impacto esperado**: codebase_understanding 9->10, context_memory 8->9
**Prioridad**: MEDIA
**Estimacion**: 8-12 archivos, ~800 LOC

#### Tareas

**F12.1** Mejorar semantic search en `src/tools/semantic-search.ts`:
- Auto-index al inicio de sesion (background)
- Chunking inteligente por funciones/clases (no por lineas)
- Usar embeddings del provider actual (Anthropic, OpenAI, Gemini)
- Cache local en `.coco/embeddings/`
- Invalidar chunks cuando archivos cambian

**F12.2** "Goto definition" sin LSP:
- `findDefinition(symbol)` — buscar donde se define un simbolo
- Combinar AST index (F5) + embeddings para busqueda hibrida
- Resultados rankeados por relevancia

**F12.3** Context-aware file selection:
- Antes de cada turno del agente, auto-incluir archivos relevantes
- Basado en: query del usuario + imports del archivo actual + embeddings similares
- Limite configurable de archivos auto-incluidos (default 10)

**F12.4** `/search` command mejorado:
- `/search <query>` — busqueda semantica en todo el codebase
- `/search --ast <symbol>` — busqueda por AST (definiciones, usos)
- `/search --file <pattern>` — busqueda por nombre de archivo
- Resultados con preview de codigo y relevance score

**F12.5** Tests:
- Unit tests para chunking, indexing, search
- Integration test: index small project, search, verify results
- Coverage >= 80%

**F12.6** Verificacion:
- `pnpm check` pasa
- `pnpm build` exitoso

---

## TABLA DE IMPACTO ESPERADO POR FASE

| Criterio | Base | F1 | F2 | F3 | F4 | F5 | F6 | F7 | F8 | F9 | F10 | F11 | F12 | Final |
|----------|------|----|----|----|----|----|----|----|----|----|----|-----|-----|-------|
| code_correctness | 7.0 | 7.0 | 7.0 | 8.0 | 9.0 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | **10.0** |
| context_memory | 8.0 | 8.0 | 8.0 | 8.0 | 8.0 | 8.0 | 8.0 | 8.0 | 8.0 | 8.0 | 8.0 | 8.0 | 9.0 | **9.0** |
| transparency | 8.0 | 9.0 | 9.0 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | **10.0** |
| cost_predict | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | **10.0** |
| codebase_understand | 7.0 | 7.0 | 8.0 | 8.0 | 8.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 10 | **10.0** |
| multi_agent | 2.0 | 2.0 | 7.0 | 7.0 | 7.0 | 7.0 | 7.0 | 7.0 | 7.0 | 7.0 | 7.0 | 7.0 | 7.0 | **7.0** |
| skills_extensibility | 6.0 | 8.0 | 8.0 | 8.0 | 8.0 | 8.0 | 8.0 | 8.0 | 9.0 | 10 | 10 | 10 | 10 | **10.0** |
| privacy | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | **9.0** |
| ux_terminal | 8.0 | 8.0 | 8.0 | 9.0 | 9.0 | 9.0 | 9.5 | 10 | 10 | 10 | 10 | 10 | 10 | **10.0** |
| quality_system | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | **9.0** |
| multi_provider | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | **9.0** |
| git_integration | 7.0 | 7.0 | 7.0 | 7.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | **9.0** |
| documentation | 3.0 | 3.0 | 3.0 | 3.0 | 3.0 | 3.0 | 3.0 | 3.0 | 3.0 | 3.0 | 7.0 | 7.0 | 7.0 | **7.0** |
| differentiators | 7.0 | 8.0 | 9.0 | 9.0 | 9.0 | 9.5 | 9.5 | 10 | 10 | 10 | 10 | 10 | 10 | **10.0** |

### Puntuacion Global Estimada por Fase

| Fase | Global | Delta | Converge? |
|------|--------|-------|-----------|
| Base | 7.08 | - | No |
| F1 | 7.42 | +0.34 | No |
| F2 | 7.83 | +0.41 | No |
| F3 | 8.17 | +0.34 | No |
| F4 | 8.42 | +0.25 | No |
| F5 | 8.67 | +0.25 | No |
| F6 | 8.79 | +0.12 | No |
| F7 | 9.00 | +0.21 | No (delta > 2%) |
| F8 | 9.08 | +0.08 | No (delta < 2% pero < 9.0+check) |
| F9 | 9.25 | +0.17 | No |
| F10 | 9.42 | +0.17 | No |
| F11 | 9.42 | +0.00 | Yes (delta < 2%) |
| F12 | 9.58 | +0.16 | FINAL |

**Convergencia estimada**: Fase 11-12 (global ~9.5, delta < 2%)

---

## REGLAS DE EJECUCION

1. **Orden estricto**: Ejecutar fases F1 -> F2 -> ... -> F12 en orden
2. **Verificacion obligatoria**: Despues de cada fase, ejecutar `pnpm check && pnpm build`
3. **Si test falla**: Corregir ANTES de continuar. No avanzar con tests rotos.
4. **Si build falla**: Corregir ANTES de continuar.
5. **Scorecard**: Evaluar y persistir en `docs/audits/improvement-scorecard.json` despues de cada fase
6. **Convergencia**: Si global >= 9.0 Y delta < 2% en 2 iteraciones consecutivas -> PARAR
7. **No preguntar**: El agente NO debe pedir confirmacion. Ejecutar todo autonomamente.
8. **Commits**: Commit convencional despues de cada fase completada
   - `feat(hooks): add lifecycle hooks system` (F1)
   - `feat(agents): add sub-agent parallel execution` (F2)
   - etc.
9. **Rollback**: Si una fase rompe algo critico, hacer git stash, corregir, y reintentar
10. **LOC limit**: Archivos nuevos max 500 LOC. Si excede, dividir en modulos.

---

## RESUMEN EJECUTIVO

- **12 fases** de mejora
- **~130 archivos** nuevos/modificados estimados
- **~11,000 LOC** estimadas
- **Objetivo**: Global >= 9.5/10
- **Baseline actual**: 7.08/10
- **Gap a cerrar**: +2.5 puntos
- **Criterio de parada**: Global >= 9.0 Y delta < 2%
- **Orden de impacto**: F1 (hooks) > F2 (agents) > F3 (diff preview) > F4 (git) > F5 (AST) > F10 (docs) > F6 (cost) > F7 (web) > F9 (plugins) > F8 (browser) > F12 (search) > F11 (voice)
