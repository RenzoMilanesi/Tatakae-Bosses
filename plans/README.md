# Plans — Reloj de Respawns

Auditoría `deep` sobre `index.html` + `apps-script.gs`. Commit base: `15fcb28`.

| # | Plan | Estado | Depende de |
|---|------|--------|------------|
| 001 | Mostrar errores reales del backend en vez de "Conectado" | DONE | — |
| 002 | Robustecer el guardado/lectura de `lastDeathAt` en Sheets | DONE | — |
| 003 | Proteger las escrituras del Web App con un secreto compartido | DONE | — |

Hallazgo #4 (duplicación `apiCall`/`fetchAll`) no tenía plan propio, pero
se resolvió como efecto colateral de implementar 001: ambas funciones ahora
comparten `handleResponse()`.

Orden de ejecución: 002 antes que nada (cambia el formato de datos), 001 y 003 son independientes entre sí.
