# 001 — Mostrar errores reales del backend

Commit base: `15fcb28`.

## Problema

En `index.html`, `apiCall()` (POST) y `fetchAll()` (GET) ambos hacen:

```js
.then(function(data){
  if (data && data.bosses) { bosses = data.bosses; render(); }
  dbStatusEl.textContent = "Conectado — se actualiza solo cada " + (POLL_MS/1000) + "s.";
})
```

La línea de estado se pisa con "Conectado" pase lo que pase, incluso cuando
`data.ok === false` (por ejemplo `apps-script.gs` devuelve
`{ok:false, error:"bad_json"}` si el POST llega mal formado). El usuario
nunca se entera de que una acción falló silenciosamente.

## Fix

En ambas funciones, chequear `data.ok` antes de asumir éxito:

```js
.then(function(data){
  if (data && data.ok && data.bosses) {
    bosses = data.bosses;
    render();
    dbStatusEl.textContent = "Conectado — se actualiza solo cada " + (POLL_MS/1000) + "s.";
  } else {
    dbStatusEl.textContent = "El servidor devolvió un error" + (data && data.error ? " (" + data.error + ")" : "") + ". Reintentá.";
  }
})
```

## Alcance

Solo `index.html`, funciones `apiCall` y `fetchAll`. No tocar `apps-script.gs`.

## Verificación

- Abrir la página con una URL de Apps Script inválida a propósito → el pie
  de página debe mostrar un mensaje de error, no "Conectado".
- Con la URL real, agregar un boss y confirmar que sigue funcionando y
  mostrando "Conectado".
