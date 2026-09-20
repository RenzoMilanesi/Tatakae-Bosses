# 002 — Robustecer el guardado/lectura de `lastDeathAt`

Commit base: `15fcb28`.

## Problema

`index.html` manda `lastDeathAt` como string ISO (`date.toISOString()`).
`apps-script.gs` lo escribe tal cual con `setValue()`. Si la columna del
Sheet queda con formato "Automático" (el default), Google Sheets puede
interpretar ese string como una fecha real y guardarla como un objeto
`Date` internamente en vez de como texto plano. Al leerlo de vuelta en
`readAll_()`:

```js
lastDeathAt: r[4] ? String(r[4]) : null,
```

`String(unaDate)` devuelve el formato regional del servidor de Apps Script
(ej. `"Sun Sep 20 2026 14:30:00 GMT+0000 (Coordinated Universal Time)"`),
no el ISO original. La mayoría de los navegadores lo siguen pudiendo
parsear con `new Date(...)`, pero es frágil y depende del locale — no hay
garantía de que sea siempre así.

## Fix

En `apps-script.gs`, forzar el formato de la columna E ("lastDeathAt") a
texto plano al crear la hoja, y convertir explícitamente a ISO si Sheets
igual devuelve un objeto `Date`:

```js
function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange("E:E").setNumberFormat("@"); // columna lastDeathAt como texto
  } else if (sheet.getLastColumn() < HEADERS.length) {
    sheet.getRange(1, sheet.getLastColumn() + 1, 1, HEADERS.length - sheet.getLastColumn())
      .setValues([HEADERS.slice(sheet.getLastColumn())]);
  }
  return sheet;
}
```

Y en `readAll_()`, convertir explícitamente si igual llega un `Date`:

```js
function isoOrNull_(v) {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}
...
lastDeathAt: isoOrNull_(r[4]),
```

## Alcance

Solo `apps-script.gs`: `getSheet_()` y `readAll_()`. No tocar `index.html`
(ya espera un string ISO, que es justo lo que esto garantiza).

## Verificación

1. Pegar el código actualizado en el editor de Apps Script, nueva versión
   del deploy.
2. Si ya existe una hoja vieja con la columna E en formato fecha, seleccionar
   la columna E → Formato → Número → Texto sin formato (una vez, a mano;
   el fix solo protege hojas nuevas).
3. Anotar una muerte desde la página y confirmar en el Sheet que la celda
   de `lastDeathAt` se ve como texto ISO (`2026-09-20T14:30:00.000Z`), no
   como una fecha con formato regional.
4. Recargar la página y confirmar que la ventana de respawn se sigue
   calculando bien.
