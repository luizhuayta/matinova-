# Contratos CMS

Copia rastreable de `docs/contratos-cms.md` (esa carpeta puede estar gitignored).

Ver `API/tests/fixtures/contracts.json` y `API/tests/fixtures/blocks.catalog.json`.

Regenerar: `php API/tests/export-contracts.php`
Comprobar: `php API/tests/export-contracts.php --check`
Suite: `./tools/check-contracts.sh`

Campos prohibidos de renombrar: `blocks[]`, `version`, `locale`, `mailSent`, `ticket`, `reply`, `links`, campos planos de `sitio` (`nav`, `footer`, `whatsappNumber`, `chatbotMode`, `show*`, `logo`).

`APP_SCHEMA_VERSION` (DDL) ≠ `CMS_SCHEMA_VERSION` (JSON). `cms_studio_sitewide_migrate` es opt-in (`APP_MIGRATE_CONTENT=1`). Schema 11 reescribe fotos pesadas a WebP. Schema 12 rellena `splashImages` y `splashLabel` si faltan.
