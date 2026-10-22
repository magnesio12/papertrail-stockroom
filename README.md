# La Superpapelería · Inventario

Panel de inventario para la tienda: control de stock, alertas de artículos que se acaban, entradas de proveedor, ventas e historial de movimientos.

Es una aplicación **solo de demostración**: funciona íntegramente en el navegador, sin servidor y sin base de datos. Todo lo que registres se guarda en el almacenamiento local (`localStorage`) del dispositivo.

## Cómo arrancar el proyecto

Con Node.js y npm instalados:

```sh
npm i
npm run dev
```

La aplicación queda en `http://localhost:8080`. No necesita ninguna clave de API ni configuración adicional.

## Dónde está cada cosa

| Ruta | Qué contiene |
| --- | --- |
| `src/routes/index.tsx` | Toda la interfaz: login, lista de stock, formulario de entrada/salida, alta de producto e historial. Es la única página de la app. |
| `src/lib/inventory.ts` | Lógica de inventario: tipos de datos, datos de ejemplo, clave de acceso, guardado en `localStorage` y reglas de stock (la función `isLow`). |
| `src/routes/__root.tsx` | Estructura común de la página (título, fuentes, pantallas de error). |
| `src/styles.css` | Colores, tipografías y estilos del tema. |

## Acceso

La pantalla de entrada pide una clave de demostración:

- **Clave:** `papeleria2026`
- Con «Recordar en este dispositivo» marcado se guarda en `localStorage`; si no, en `sessionStorage` y se cierra al apagar la pestaña.
- «Salir» en la cabecera borra la sesión. **Cambia la clave antes de un uso real** en `src/lib/inventory.ts` (constante `ACCESS_KEY`).

## Funcionalidades simuladas

No hay funcionalidades reales de correo, pagos ni WhatsApp: la app no las incluye, y ninguna pantalla promete enviarlas. Lo que se simula:

- **Acceso:** no hay usuarios ni contraseñas de verdad; una única clave compartida guarda una marca en el navegador. Cualquiera que conozca la clave entra, y no hay recuperación de clave.
- **Datos:** no hay base de datos ni servidor. Todo vive en `localStorage`, así que los datos existen solo en ese navegador y dispositivo (no se comparten entre móvil y ordenador, ni entre navegadores).
- **Historial:** se guardan como máximo los últimos 200 movimientos.
- **Eliminación de productos:** al borrar manualmente las claves de `localStorage` (ver abajo) desaparecen también los movimientos asociados.

## Datos de ejemplo y cómo reiniciarlos

Al abrir por primera vez, la app precarga **18 productos de ejemplo** (cuadernos, bolígrafos, mochilas, etc.) con stocks y umbrales de alerta inventados. Cualquier cambio que hagas se guarda y se conserva al recargar.

Para volver al estado inicial (borrar todo lo registrado y recargar los datos de ejemplo), borra las claves de la app en el almacenamiento del navegador:

1. Abre las herramientas de desarrollador (F12) → pestaña **Application** (Chrome/Edge) o **Storage** (Firefox) → **Local Storage** → `http://localhost:8080` (o tu dominio).
2. Elimina estas claves:
   - `superpapeleria.products`
   - `superpapeleria.movements`
   - `superpapeleria.session`
3. Recarga la página.

Atajo equivalente: en la consola del navegador escribe `localStorage.clear(); location.reload()` (esto también cierra la sesión; vuelve a entrar con la clave).

## Pantallas

Las cuatro pestañas del pie de pantalla están conectadas y funcionando:

- **Stock** — lista con buscador, filtro por categoría, contador de artículos por reponer (táctalo para ver solo las alertas) y botones de entrada/venta por producto.
- **Entrada/Salida** — registra entradas de proveedor o ventas, con validación de cantidad y aviso si la venta supera el stock.
- **Nuevo** — da de alta un producto (nombre, categoría, stock inicial, umbral y proveedor, todos validados).
- **Historial** — lista de movimientos con fecha, nota y cantidad.

## Desarrollo

Proyecto creado con [Lovable](https://lovable.dev): describe cambios en el editor de Lovable o edita el código y haz push; se sincroniza con tu repositorio. Construido con TanStack Start, TypeScript, React y Tailwind CSS.
