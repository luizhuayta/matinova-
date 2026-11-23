#!/usr/bin/env python3
"""Respaldo privado de fuentes + entrega cPanel + guía (sin publicar secretos)."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import zipfile

ROOT = Path(__file__).resolve().parent.parent
OMIT_DIRS = {
    'node_modules', 'vendor', 'dist', 'dist-upload', '.angular', '.cache',
    '.git', '.openchamber', '.cursor', '.kilo', '.impeccable', '__pycache__',
    'tmp', 'coverage', 'playwright-report', 'test-results', 'blob-report',
}
ROOT_FILES = [
    '.gitignore', '.hintrc', 'README.md', 'docker-compose.yml', 'api.php',
    'DOCUMENTACION-RESPALDO.md', 'INFORME-MEJORAS.md',
]


def project_files():
    for name in ROOT_FILES:
        path = ROOT / name
        if path.is_file():
            yield path
    for name in ['API', 'cms', 'deploy', 'docs', 'frontend', 'tools']:
        for current, dirs, files in os.walk(ROOT / name):
            dirs[:] = sorted(d for d in dirs if d not in OMIT_DIRS)
            for filename in sorted(files):
                path = Path(current) / filename
                if path.suffix in {'.zip', '.log', '.pyc', '.phar'}:
                    continue
                if path.is_file():
                    yield path


def verify_cpanel(path):
    with zipfile.ZipFile(path) as archive:
        names = set(archive.namelist())
        required = {
            'index.html', '.htaccess', 'api.php', 'api/index.php', 'api/.htaccess',
            'api/health.php', 'api/Http/Router.php', 'api/vendor/autoload.php',
        }
        if not required <= names:
            raise RuntimeError('El ZIP cPanel no tiene estructura raíz válida.')
        if any(Path(name).name == '.env' for name in names):
            raise RuntimeError('El ZIP cPanel no debe contener .env.')
        if archive.read('api/Http/Router.php') != (ROOT / 'API/Http/Router.php').read_bytes():
            raise RuntimeError('El router del ZIP cPanel no coincide con la fuente.')
        manifest = json.loads(archive.read('ngsw.json'))
        for name, expected in manifest['hashTable'].items():
            if hashlib.sha1(archive.read(name.lstrip('/'))).hexdigest() != expected:
                raise RuntimeError('Hash ngsw incorrecto: ' + name)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', default='respaldos/2026-10-09')
    args = parser.parse_args()
    target = (ROOT / args.out).resolve()
    target.mkdir(parents=True, exist_ok=True)
    os.chmod(target, 0o700)
    cpanel = ROOT / 'mattinnova-cpanel-completo.zip'
    verify_cpanel(cpanel)
    private_zip = target / 'mattinnova-proyecto-privado.zip'
    files = list(project_files())
    if ROOT / 'API/.env' not in files:
        raise RuntimeError('Falta API/.env local; no se puede generar el respaldo privado completo.')
    with zipfile.ZipFile(private_zip, 'w', zipfile.ZIP_DEFLATED) as archive:
        for path in files:
            archive.write(path, path.relative_to(ROOT).as_posix())
    os.chmod(private_zip, 0o600)
    shutil.copy2(cpanel, target / cpanel.name)
    shutil.copy2(ROOT / 'DOCUMENTACION-RESPALDO.md', target / 'DOCUMENTACION-RESPALDO.md')
    for name in [private_zip.name, cpanel.name, 'DOCUMENTACION-RESPALDO.md']:
        path = target / name
        print(f'{path.relative_to(ROOT)} — {path.stat().st_size:,} bytes')
    print('Respaldo privado con .env. No subir ese ZIP a GitHub ni a public_html.')
    print('No incluye base de datos de producción ni uploads que solo existan en el hosting.')


if __name__ == '__main__':
    main()
