# Musician Gym

Musician Gym es una aplicación web de práctica musical para entrenar oído, voz y ritmo desde un mismo lugar. Está pensada para sesiones repetitivas: contexto tonal claro, pocos controles a la vista, audio inmediato y preferencias que se conservan en el navegador.

**Aplicación:** [musician-gym.vercel.app](https://musician-gym.vercel.app/)

## Áreas de práctica

### Oído

- Reconocimiento funcional dentro de una tonalidad, no como intervalos aislados.
- Cifrado por solfeo fijo (`do–re–mi`), letras (`C–D–E`) o grados (`1–2–3`).
- Escalas mayor, menor natural, menor armónica y modos griegos en las 12 tónicas.
- Tres registros y tres rangos de ejercicio: tetracordio inferior, tetracordio superior y octava completa.
- Timbres de piano y guitarra modelada.
- Modo manual o automático, con respuesta visual y voz opcionales. En cifrado por grados, la voz dice solamente el número para no interrumpir el ritmo de práctica.
- Mapeo de teclado y compatibilidad con controles HID o gamepads para practicar sin tocar la pantalla.

### Voz

- Escalas de cinco notas, arpegios, octava y escala completa.
- Rutina guiada de seis bloques basada en el calentamiento de DREKXEL, con sus tempos y pausas específicos.
- Recorrido ascendente y descendente por tonalidades.
- Selección de registro vocal, cantidad de tonalidades y tempo.
- Comparte el mismo componente de contexto musical que el entrenamiento auditivo.

### Ritmo

- Patrones configurables por compás, subdivisión, densidad, síncopas y dificultad.
- Acentos, cuenta previa y reproducción precisa con Web Audio.
- Asignación de voces a manos, pies o guitarra.
- Generación de variantes y persistencia del último patrón.

### Rehabilitación auditiva

Incluye una herramienta experimental de audio con filtro notch para tinnitus tonal. La frecuencia se ajusta con una referencia y los archivos elegidos se procesan localmente en el navegador; no se suben a un servidor. La propia interfaz explica la evidencia limitada, el uso seguro y las situaciones en las que conviene consultar a un profesional.

No es un dispositivo médico ni reemplaza una evaluación clínica.

## Uso

1. Abrí la [aplicación](https://musician-gym.vercel.app/) y elegí un área desde la navegación lateral.
2. Definí tonalidad, escala o modo y registro cuando corresponda.
3. Ajustá sólo las opciones necesarias para esa sesión y empezá a practicar.

La interfaz está disponible en español e inglés, tiene temas claro y oscuro y puede instalarse como PWA. Los ajustes, estadísticas y patrones recientes se guardan en `localStorage`.

## Desarrollo local

Requiere Node.js 22.22.2 o superior.

```bash
git clone https://github.com/MartinAlcalde/musician-gym.git
cd musician-gym
npm ci
npm run dev
```

Comprobación completa:

```bash
npm run check
```

También se pueden ejecutar por separado:

```bash
npm run lint
npm test
npm run build
```

## Tecnología y publicación

- React 19 y Vite 8.
- Tone.js para reproducción, scheduling y síntesis de audio.
- Vitest y Testing Library para pruebas.
- PWA con caché offline después de la primera carga correcta.
- Producción alojada en el proyecto personal de Vercel `musician-gym`.

Los cambios en `main` pasan lint, pruebas y build en GitHub Actions. La publicación de producción corresponde a Vercel.

## Licencia

[MIT](LICENSE)
