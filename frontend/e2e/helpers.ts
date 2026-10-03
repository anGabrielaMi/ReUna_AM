import { APIRequestContext, Page, expect } from '@playwright/test';

export const API_URL = process.env['E2E_API_URL'] ?? 'http://127.0.0.1:8000/api';
export const CLAVE_DEMO = 'demo12345';   // la crea "python manage.py seed_demo"

/**
 * Muestra un letrero sobre la app (queda grabado en el video) y espera
 * para que alcance a leerse. Úsalo para anunciar cada criterio y cada resultado.
 */
export async function rotulo(page: Page, texto: string, ms = 2200) {
  await page.evaluate((t) => {
    let el = document.getElementById('e2e-rotulo');
    if (!el) {
      el = document.createElement('div');
      el.id = 'e2e-rotulo';
      Object.assign(el.style, {
        position: 'fixed', left: '50%', bottom: '28px', transform: 'translateX(-50%)',
        zIndex: '2147483647', background: 'rgba(17, 24, 39, 0.92)', color: '#fff',
        padding: '14px 22px', borderRadius: '12px', maxWidth: '85%', textAlign: 'center',
        font: '600 18px system-ui, -apple-system, Segoe UI, sans-serif', lineHeight: '1.4',
        boxShadow: '0 8px 24px rgba(0,0,0,.35)', pointerEvents: 'none', whiteSpace: 'pre-line',
      });
      document.body.appendChild(el);
    }
    el.textContent = t;
  }, texto);
  await page.waitForTimeout(ms);
}

/** Inicia sesión desde la pantalla de login y espera llegar a Home. */
export async function iniciarSesion(page: Page, usuario: string, clave = CLAVE_DEMO) {
  await page.goto('/login');
  await page.locator('ion-input[name="username"] input').fill(usuario);
  await page.locator('ion-input[name="password"] input').fill(clave);
  await page.locator('ion-button[type="submit"]').click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.locator('.sesion')).toContainText(usuario);
}

/** Cierra sesión desde el menú lateral. */
export async function cerrarSesion(page: Page) {
  await page.locator('ion-menu ion-item', { hasText: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/home$/);
}

/** Encabezado de autenticación Basic para llamar a la API directamente. */
export function authBasic(usuario: string, clave = CLAVE_DEMO) {
  return { Authorization: 'Basic ' + Buffer.from(`${usuario}:${clave}`).toString('base64') };
}

/** Busca el id de una comunidad por su nombre (vía API). */
export async function idComunidad(request: APIRequestContext, nombre: string, usuario: string) {
  const r = await request.get(`${API_URL}/comunidades/`, { headers: authBasic(usuario) });
  expect(r.ok()).toBeTruthy();
  const lista: { id: number; nombre: string }[] = await r.json();
  const c = lista.find(x => x.nombre === nombre);
  expect(c, `No existe la comunidad "${nombre}" (¿corriste seed_demo?)`).toBeTruthy();
  return c!.id;
}

/** Elige una opción de un ion-select con interfaz popover. */
export async function elegirEnSelect(page: Page, nameSelect: string, opcion: string) {
  await page.locator(`ion-select[name="${nameSelect}"]`).click();
  await page.locator('ion-popover').getByText(opcion, { exact: true }).click();
  await expect(page.locator('ion-popover')).toHaveCount(0);
}
