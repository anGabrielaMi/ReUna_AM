import { defineConfig } from '@playwright/test';

/**
 * Pruebas de aceptación automatizadas (Playwright).
 *
 * Antes de correrlas:
 *   1. Backend:  python manage.py seed_demo   y   python manage.py runserver
 *   2. Frontend: ionic serve   (o npm start)
 * Correr:        npx playwright test
 * Ver informe:   npx playwright show-report
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  workers: 1,               // una prueba a la vez: comparten los mismos datos de prueba
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:8100',
    viewport: { width: 1280, height: 720 },
    // Evidencia: video de cada prueba, capturas y "trace" paso a paso
    video: { mode: 'on', size: { width: 1280, height: 720 } },
    screenshot: 'on',
    trace: 'on',
    // Cámara lenta: pausa entre cada acción para que el video se alcance a seguir
    launchOptions: { slowMo: Number(process.env['E2E_SLOWMO'] ?? 600) },
  },
});
