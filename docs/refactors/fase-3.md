# Fases 3–8 — UX restante (sesión continua)

Luis pidió ejecutar 1–8 seguidas. El detalle de la 1 y la 2 está en `fase-1.md` y `fase-2.md`. Aquí el cierre de 3–8.

## ANTES

Panel plano, paths en revisiones, listas sin manija ni duplicar, imágenes solo desde el panel, Quill con underline/h2/h3, publish sin alt ni mínimo de listas.

## DESPUÉS

- **3:** `inspectorRootSchema` ordena Inicio según `sections`. Sitio reordenado splash → cabecera → aviso → pie. Copy sin «campo». Ayuda `?`.
- **4:** lista «Cambios sin publicar», errores `{field,message}` clicables, contadores cerca de `maxLength`.
- **5:** CDK solo en inspector, duplicar, toast Eliminado—Deshacer, mínimo 1 (cliente + PHP).
- **6:** drop sobre `cmsImage`, aviso <800 px, alt o «es decorativa» (`decorativeImagePaths`, `schemaVersion` 3). Sin recorte.
- **7:** toolbar negrita/cursiva/enlace/lista/h2; pegado sin color/fuente; sanitize alinea h1→p, h3→h2, sin h3.
- **8:** no ocultar todas las secciones; no listas vacías; rich no deja h1.

## CÓMO PROBARLO

1. Inicio: el panel sigue el orden de secciones de la home. Ningún path a la vista.
2. Editar titular: aparece en «Cambios sin publicar»; clic lleva al hueco.
3. Reordenar testimonio con la manija; quitar uno y Deshacer en 5 s; no se puede dejar 0.
4. Arrastrar un JPG sobre el banner en Editar. Publicar sin alt (y sin decorativa) → error clicable.
5. Pegar desde Word en términos: sin color. No hay H1 en la toolbar.
6. Ocultar todas las secciones de Inicio → se impide.

## Anti-humo a/b/c/d

- **(a)** GET público sin sesión sigue leyendo publicado.
- **(b)** `schemaVersion` 3 añade `decorativeImagePaths: []` al leer/guardar; el resto del JSON se conserva.
- **(c)** PUT guarda el documento entero migrado, no borra claves viejas.
- **(d)** CDK solo en `cms-inspector` (chunk admin). Quill sigue en import dinámico.
