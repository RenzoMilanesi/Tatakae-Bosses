// Pegar este código en script.google.com (Extensiones > Apps Script desde tu Google Sheet)
// Crea automáticamente la hoja "Bosses" con los encabezados si no existe.

var SHEET_NAME = "Bosses";
var HEADERS = ["id", "name", "minHours", "maxHours", "lastDeathAt", "lastBy", "notes"];

// Cambiá esto por tu propio secreto antes de compartir la URL con tus
// amigos. Se manda en cada escritura (agregar/editar/borrar) para que
// alguien que encuentre la URL sin este valor no pueda tocar tus datos.
var SHARED_SECRET = "CAMBIAR_ESTO";

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange("E:E").setNumberFormat("@"); // lastDeathAt como texto plano, nunca fecha
  } else if (sheet.getLastColumn() < HEADERS.length) {
    // hoja creada con una versión anterior (sin la columna "notes")
    sheet.getRange(1, sheet.getLastColumn() + 1, 1, HEADERS.length - sheet.getLastColumn())
      .setValues([HEADERS.slice(sheet.getLastColumn())]);
  }
  return sheet;
}

function isoOrNull_(v) {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function readAll_() {
  var sheet = getSheet_();
  var values = sheet.getDataRange().getValues();
  var rows = values.slice(1); // sin encabezado
  return rows
    .filter(function (r) { return r[0]; }) // con id
    .map(function (r) {
      return {
        id: String(r[0]),
        name: String(r[1] || ""),
        minHours: Number(r[2]) || 6,
        maxHours: Number(r[3]) || 7,
        lastDeathAt: isoOrNull_(r[4]),
        lastBy: r[5] ? String(r[5]) : null,
        notes: r[6] ? String(r[6]) : ""
      };
    });
}

function findRowIndexById_(sheet, id) {
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) return i + 1; // fila 1-indexed
  }
  return -1;
}

function doGet(e) {
  return jsonOut_({ ok: true, bosses: readAll_() });
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut_({ ok: false, error: "bad_json" });
  }

  if (body.secret !== SHARED_SECRET) {
    return jsonOut_({ ok: false, error: "unauthorized" });
  }

  var sheet = getSheet_();
  var action = body.action;

  if (action === "add") {
    var id = Utilities.getUuid();
    sheet.appendRow([
      id,
      body.name || "Boss sin nombre",
      Number(body.minHours) || 6,
      Number(body.maxHours) || 7,
      "",
      "",
      body.notes || ""
    ]);
  } else if (action === "update") {
    var row = findRowIndexById_(sheet, body.id);
    if (row > 0) {
      if (body.name !== undefined) sheet.getRange(row, 2).setValue(body.name);
      if (body.minHours !== undefined) sheet.getRange(row, 3).setValue(Number(body.minHours));
      if (body.maxHours !== undefined) sheet.getRange(row, 4).setValue(Number(body.maxHours));
      if (body.lastDeathAt !== undefined) sheet.getRange(row, 5).setValue(body.lastDeathAt || "");
      if (body.lastBy !== undefined) sheet.getRange(row, 6).setValue(body.lastBy || "");
      if (body.notes !== undefined) sheet.getRange(row, 7).setValue(body.notes || "");
    }
  } else if (action === "delete") {
    var rowDel = findRowIndexById_(sheet, body.id);
    if (rowDel > 0) sheet.deleteRow(rowDel);
  }

  return jsonOut_({ ok: true, bosses: readAll_() });
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
