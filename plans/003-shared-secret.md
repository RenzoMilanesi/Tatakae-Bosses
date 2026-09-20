# 003 — Proteger las escrituras del Web App con un secreto compartido

Commit base: `15fcb28`.

## Problema

`apps-script.gs` está deployado como "Aplicación web", ejecutar como el
dueño, acceso "Cualquier usuario" — es la única forma de que los amigos
sin cuenta de Google puedan escribir. Pero eso significa que **cualquiera**
que consiga esa URL (capturada de pantalla, pegada sin querer en un chat
público, etc.) puede borrar o editar todo el Sheet sin ninguna otra
barrera.

## Fix

Agregar un secreto compartido simple:

**`apps-script.gs`** — al principio del archivo:

```js
var SHARED_SECRET = "CAMBIAR_ESTO"; // el usuario lo reemplaza por el suyo
```

En `doPost`, antes de procesar la acción:

```js
if (body.secret !== SHARED_SECRET) {
  return jsonOut_({ ok: false, error: "unauthorized" });
}
```

`doGet` se deja sin cambios (solo lectura, no hace falta protegerlo — así
la página puede mostrar el estado sin pedir el secreto todavía).

**`index.html`** — guardar el secreto junto a la URL en el mismo cartel de
configuración inicial (nuevo campo `apiSecretInput` + `localStorage` key
`respawn-tracker-api-secret`), e incluirlo en el `payload` de cada
`apiCall`:

```js
apiCall({ action: "add", ..., secret: API_SECRET })
```

Centralizar esto agregando `secret: API_SECRET` dentro de `apiCall()`
mismo (no en cada callsite), para no tener que tocar los ~7 lugares que
llaman `apiCall`.

## Alcance

- `apps-script.gs`: agregar `SHARED_SECRET` y el chequeo en `doPost`.
- `index.html`: nuevo input de secreto en `#configBox`, nueva key de
  `localStorage`, inyectar `secret` dentro de `apiCall()`.
- No tocar `doGet` ni la lógica de renderizado.

## Verificación

1. Pegar el código actualizado, elegir un secreto propio (no dejar el
   placeholder), nueva versión del deploy.
2. Abrir la página, cargar URL + el secreto elegido → una acción (agregar
   boss) debe funcionar.
3. Probar a mano con un secreto incorrecto (`curl -X POST ... -d
   '{"action":"add","name":"x","secret":"malo"}'`) → debe devolver
   `{"ok":false,"error":"unauthorized"}` y NO debe aparecer el boss en el
   Sheet.

## Nota para el usuario

Este secreto viaja en texto plano dentro del `body` del POST (HTTPS lo
cifra en tránsito, pero no es un token con expiración ni hashing). Es
suficiente para frenar el caso "alguien encontró la URL sin querer", no
para blindarlo contra un atacante que ya inspeccionó el tráfico de un
usuario legítimo. Si eso preocupa, el siguiente paso sería un token por
persona en vez de uno compartido — fuera de alcance de este plan.
