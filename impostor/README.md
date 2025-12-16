# Impostor (sin internet)

Juego simple para pasar el celular: todos ven la misma palabra excepto un jugador que ve **IMPOSTOR**.

## Correr local

> Nota: el Service Worker (modo offline) funciona mejor en `http://localhost` o en hosting HTTPS (GitHub Pages).

### Opción A (Python)
```bash
python -m http.server 5173
```
Abre: http://localhost:5173

### Opción B (Node)
```bash
npx serve .
```

## GitHub Pages

1. Sube estos archivos a un repo.
2. En **Settings → Pages** selecciona `main` + `/ (root)`.
3. Abre la URL una vez. Luego podrás jugar sin internet (modo avión) porque se cachea.

## Cambiar palabras

Edita el arreglo `WORDS` dentro de `app.js`.
