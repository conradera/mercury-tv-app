export function downloadJSON(value: unknown, name: string) {
  download(JSON.stringify(value, null, 2), name, "application/json");
}
export function download(text: string, name: string, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportCSV(rows: Record<string, unknown>[], name: string) {
  if (!rows.length) return;
  const fields = Object.keys(rows[0]).filter(
    (k) => !Array.isArray(rows[0][k]) && typeof rows[0][k] !== "object",
  );
  const cell = (v: unknown) =>
    '"' +
    String(v ?? "")
      .replace(/^[=+@-]/, "'$&")
      .replace(/"/g, '""') +
    '"';
  download(
    [
      fields.map(cell).join(","),
      ...rows.map((r) => fields.map((f) => cell(r[f])).join(",")),
    ].join("\r\n"),
    name,
  );
}
