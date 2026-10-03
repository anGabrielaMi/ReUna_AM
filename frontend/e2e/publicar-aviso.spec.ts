import { test, expect } from '@playwright/test';
import { API_URL, authBasic, elegirEnSelect, idComunidad, iniciarSesion, rotulo } from './helpers';

/**
 * Historia: Publicar aviso (líder)
 * Datos: python manage.py seed_demo
 *   demo_lider  -> líder de Demo Los Aromos
 *   demo_multi  -> líder de Demo Los Aromos y Demo El Roble
 *   demo_colab  -> colaborador de Demo Los Aromos
 *   demo_roble  -> colaborador de Demo El Roble
 */

// Las pruebas van en orden: la 2 y la 3 revisan el aviso que publica la 1
test.describe.configure({ mode: 'serial' });

// Sufijo con la hora para que cada corrida cree un aviso distinto (ej: "[Demo] Reunión de vecinos 14:32:05")
const hora = () => new Date().toLocaleTimeString('es-CL', { hour12: false });
const TITULO = `[Demo] Reunión de vecinos ${hora()}`;
const CONTENIDO = 'Nos reunimos el sábado a las 11:00 en la sede.\nTraer propuestas para el huerto.';

test('Criterios 3, 4 y 5: el líder publica eligiendo la categoría y se asocia a su comunidad', async ({ page }) => {
  await iniciarSesion(page, 'demo_lider');
  await rotulo(page, 'Historia: Publicar aviso\nIngresa demo_lider (líder de Demo Los Aromos)');

  await page.goto('/avisos');
  await rotulo(page, 'El líder ve el botón "Publicar aviso"');
  await page.locator('ion-button', { hasText: 'Publicar aviso' }).click();
  await expect(page).toHaveURL(/\/avisos\/nuevo$/);

  await expect(page.locator('.comunidad-fija')).toContainText('Demo Los Aromos');
  await rotulo(page, 'Criterio 5: es líder de una sola comunidad,\nel aviso se asocia automáticamente a Demo Los Aromos');

  await rotulo(page, 'Criterio 4: el líder selecciona la categoría', 1500);
  await elegirEnSelect(page, 'categoria', 'Reunión');
  await page.locator('ion-input[name="titulo"] input').fill(TITULO);
  await page.locator('ion-textarea[name="contenido"] textarea').fill(CONTENIDO);
  await page.locator('form ion-button[type="submit"]').click();

  await expect(page).toHaveURL(/\/avisos$/);
  const tarjeta = page.locator('ion-card', { hasText: TITULO });
  await expect(tarjeta).toBeVisible();
  await expect(tarjeta).toContainText('Reunión');
  await expect(tarjeta).toContainText('Demo Los Aromos');
  await tarjeta.scrollIntoViewIfNeeded();
  await rotulo(page, 'Criterio 3: el aviso aparece en la lista de avisos de la comunidad ✔', 3000);
});

test('Criterio 1: el aviso muestra título, contenido y fecha de publicación', async ({ page }) => {
  await iniciarSesion(page, 'demo_lider');
  await page.goto('/avisos');
  await page.locator('ion-card', { hasText: TITULO }).click();

  await expect(page.locator('article.aviso h1')).toHaveText(TITULO);
  await expect(page.locator('article.aviso .contenido')).toContainText('Traer propuestas para el huerto');
  await expect(page.locator('article.aviso .fecha').first()).toContainText(/Publicado\s+por demo_lider\s+el \d{2}-\d{2}-\d{4}/);
  await rotulo(page, 'Criterio 1: el aviso muestra título, contenido y fecha de publicación ✔', 3000);
});

test('Criterio 2: el aviso es visible para los colaboradores de la comunidad (y no para otras)', async ({ page }) => {
  await iniciarSesion(page, 'demo_colab');
  await rotulo(page, 'Ingresa demo_colab (colaborador de Demo Los Aromos)');
  await page.goto('/avisos');
  await expect(page.locator('ion-card', { hasText: TITULO })).toBeVisible();
  await rotulo(page, 'Criterio 2: el colaborador de la comunidad ve el aviso ✔', 2500);

  // Contraprueba: alguien de otra comunidad no lo ve
  await page.locator('ion-menu ion-item', { hasText: 'Cerrar sesión' }).click();
  await iniciarSesion(page, 'demo_roble');
  await rotulo(page, 'Contraprueba: ingresa demo_roble (de otra comunidad)');
  await page.goto('/avisos');
  await expect(page.locator('ion-card').first()).toBeVisible();
  await expect(page.locator('ion-card', { hasText: TITULO })).toHaveCount(0);
  await rotulo(page, 'Un usuario de otra comunidad NO ve el aviso ✔', 2500);
});

test('Criterio 5: si el líder lo es de varias comunidades, elige a cuál va el aviso', async ({ page }) => {
  const titulo = `[Demo] Feria de El Roble ${hora()}`;
  await iniciarSesion(page, 'demo_multi');
  await rotulo(page, 'Ingresa demo_multi (líder de Demo Los Aromos y Demo El Roble)');

  await page.goto('/avisos/nuevo');
  await expect(page.locator('ion-select[name="comunidad"]')).toBeVisible();
  await rotulo(page, 'Criterio 5: como es líder de varias, aparece el selector de comunidad');
  await elegirEnSelect(page, 'comunidad', 'Demo El Roble');
  await elegirEnSelect(page, 'categoria', 'Evento');
  await page.locator('ion-input[name="titulo"] input').fill(titulo);
  await page.locator('ion-textarea[name="contenido"] textarea').fill('Feria de intercambio el domingo.');
  await page.locator('form ion-button[type="submit"]').click();

  await expect(page).toHaveURL(/\/avisos$/);
  const tarjeta = page.locator('ion-card', { hasText: titulo });
  await expect(tarjeta).toContainText('Demo El Roble');
  await tarjeta.scrollIntoViewIfNeeded();
  await rotulo(page, 'El aviso quedó en la comunidad elegida (Demo El Roble) ✔', 3000);
});

test('Criterio 6: un líder no puede publicar en una comunidad donde no es líder', async ({ page, request }) => {
  await iniciarSesion(page, 'demo_lider');
  await rotulo(page, 'demo_lider es líder SOLO de Demo Los Aromos.\nIntenta publicar en Demo El Roble llamando directo a la API');

  const idRoble = await idComunidad(request, 'Demo El Roble', 'demo_multi');
  const r = await request.post(`${API_URL}/avisos/`, {
    headers: authBasic('demo_lider'),
    data: { titulo: '[Demo] Intento indebido', contenido: 'x', categoria: 'general', comunidad: idRoble },
  });
  const cuerpo = await r.json();
  expect(r.status()).toBe(403);
  await rotulo(page, `Criterio 6: la API responde ${r.status()}\n"${cuerpo.detail}" ✔`, 3500);
});

test('Criterio 7: un colaborador no puede publicar', async ({ page, request }) => {
  await iniciarSesion(page, 'demo_colab');
  await page.goto('/avisos');
  await expect(page.locator('ion-card').first()).toBeVisible();
  await expect(page.locator('ion-button', { hasText: 'Publicar aviso' })).toHaveCount(0);
  await rotulo(page, 'Criterio 7: el colaborador NO ve el botón "Publicar aviso" ✔', 2500);

  await page.goto('/avisos/nuevo');
  await expect(page.locator('.mensaje-info')).toContainText('Solo los líderes');
  await rotulo(page, 'Si escribe la dirección del formulario, la app no se lo permite ✔', 2500);

  const idAromos = await idComunidad(request, 'Demo Los Aromos', 'demo_colab');
  const r = await request.post(`${API_URL}/avisos/`, {
    headers: authBasic('demo_colab'),
    data: { titulo: '[Demo] Intento de colaborador', contenido: 'x', categoria: 'general', comunidad: idAromos },
  });
  const cuerpo = await r.json();
  expect(r.status()).toBe(403);
  await rotulo(page, `Y si llama directo a la API: ${r.status()}\n"${cuerpo.detail}" ✔`, 3500);
});
