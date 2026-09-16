# Fase 2 — Modo Ver / Editar + cromo de estado

## ANTES

`enable()` dejaba `editMode` siempre true: outlines en el preview. Dos botones primarios. Estado en banners sueltos. Copy con «campo».

## DESPUÉS

- Toggle Ver / Editar en la barra. Ver quita outlines (las directivas ya respetan `editMode`) y atenúa el panel.
- Chip permanente Guardado / Guardando… / Cambios sin publicar.
- Publicar es el único botón primario, con confirmación en español y recuento de cambios. Guardar borrador es secundario.
- Sin la palabra «campo» en la barra.

Descartado: plegar el panel en Ver (se atenúa; sigue visible para orientarse).

## CÓMO PROBARLO

1. Abrir Inicio: se lee Ver vs Editar sin tooltip.
2. Ver: clic en el H1 no marca el preview.
3. El chip de estado se ve con el panel abajo del fold.
4. Publicar pide confirmación; Guardar borrador no es azul primario.

## Anti-humo a/b/c/d

- **(a)** `editMode` sigue false fuera del editor.
- **(b)(c)** Sin cambios de JSON.
- **(d)** Sin Quill/CDK nuevos en home.
