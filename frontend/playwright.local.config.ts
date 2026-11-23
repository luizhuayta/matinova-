import base from './playwright.config';

// Config temporal local: usa el Chrome del sistema en vez del
// chromium empaquetado de Playwright (evita la descarga ~170MB).
export default {
  ...base,
  use: {
    ...(base as { use: Record<string, unknown> }).use,
    launchOptions: {
      executablePath: '/usr/bin/google-chrome-stable',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  },
};
