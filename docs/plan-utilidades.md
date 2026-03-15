# Plan: Reporte de Utilidades en Reportes

## Objetivo

Agregar en **Reportes** un nuevo cuadro **Utilidades** que, al entrar, muestre:
- **Ventas del mes** (automático: de inicio a fin de mes)
- **Gastos del mes** (manuales): desglose con campos editables
- **Total que queda** (utilidad neta = ventas − gastos)

---

## Fuentes de datos

| Dato | Origen | Notas |
|------|--------|--------|
| Ventas del mes | Automático | Suma de `salesHistory` donde `createdAt` esté entre inicio y fin del mes seleccionado |
| Inversión materia prima | Manual | Lo que se gastó en comprar materia prima en el mes |
| Compras en productos | Manual | Lo que se compró en productos para revender |
| Nómina | Manual | Sueldos del mes |
| Renta | Manual | Renta del local |
| Otros gastos | Manual | Lista de conceptos con monto (ej. luz, internet, otros) |

Todo lo que no sea “ventas” se guarda manualmente por el usuario y se persiste en Firestore para ese mes.

---

## Modelo de datos (Firestore)

**Colección:** `utilidades` (o `monthlyExpenses`)

**Documento por usuario y mes:** `{userId}_{YYYY-MM}`  
Ejemplo: `abc123_2026-03`

**Campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| userId | string | Dueño del registro (multi-tenant) |
| yearMonth | string | "YYYY-MM" (ej. "2026-03") |
| materiaPrima | number | Inversión en materia prima en el mes |
| comprasProductos | number | Compras de productos en el mes |
| nomina | number | Nómina del mes |
| renta | number | Renta del mes |
| otrosGastos | array | `[{ concepto: string, monto: number }]` (ej. Luz, Internet) |
| createdAt | timestamp | Primera vez que se crea |
| updatedAt | timestamp | Última actualización |

- **Ventas del mes** no se guardan en este documento: se calculan siempre con una query a `salesHistory` para el rango del mes.

---

## Flujo de la pantalla

1. Usuario entra a **Reportes** y toca el nuevo cuadro **Utilidades**.
2. Se abre **/reportes/utilidades**.
3. Selector **Mes / Año** (por defecto: mes actual).
4. **Sección Ingresos**
   - Bloque “Ventas del mes” con el total calculado (inicio de mes → fin de mes) desde `salesHistory`.
5. **Sección Gastos**
   - Inversión en materia prima (input número).
   - Compras en productos (input número).
   - Nómina (input número).
   - Renta (input número).
   - Otros gastos: lista de filas “Concepto” + “Monto” con botón “Agregar otro”.
6. Al guardar (botón “Guardar gastos” o guardado por campo), se actualiza el documento en `utilidades` para ese `userId` y `yearMonth`.
7. **Desglose**
   - Total ventas (del paso 4).
   - Lista de gastos con sus montos.
   - Total gastos (suma de todos).
   - **Utilidad neta** = Total ventas − Total gastos (lo que “queda”).

---

## Archivos a crear o modificar

### 1. Reportes – Nuevo cuadro

**Archivo:** `src/app/reportes/page.tsx`

- Añadir una entrada en el array de cards (ej. `reportCards`):
  - `href: "/reportes/utilidades"`
  - `label: "Utilidades"`
  - `desc: "Ventas, gastos y utilidad del mes"`
  - `Icon: DollarSign` (o similar)
  - `color: "teal"` o "violet"
- Añadir el estilo correspondiente en el mapa de colores si hace falta.

### 2. Server Actions para utilidades

**Crear:** `src/lib/actions/utilidades.ts` (o añadir en `reports.ts`)

- **getVentasDelMes(yearMonth: string)**  
  - Calcular inicio y fin del mes a partir de `yearMonth` ("YYYY-MM").  
  - Query a `salesHistory` por `userId` y filtrar por `createdAt` en ese rango.  
  - Devolver `{ success, data: { totalVentas: number } }`.

- **getUtilidadesMes(yearMonth: string)**  
  - Leer documento `utilidades/{userId}_{yearMonth}`.  
  - Devolver los gastos guardados (materiaPrima, comprasProductos, nomina, renta, otrosGastos).

- **saveUtilidadesMes(yearMonth: string, data: { materiaPrima, comprasProductos, nomina, renta, otrosGastos })**  
  - Hacer `set` con `merge: true` en `utilidades/{userId}_{yearMonth}`.  
  - Incluir `userId`, `yearMonth`, `updatedAt` y los campos recibidos.

### 3. Página Utilidades

**Crear:** `src/app/reportes/utilidades/page.tsx`

- Layout tipo “reporte”: header con título “Utilidades” y botón/link volver a Reportes.
- Selector mes/año (dropdowns o input month).
- Llamar a `getVentasDelMes` y `getUtilidadesMes` al cargar y al cambiar mes.
- **Bloque Ingresos**
  - Card o sección “Ventas del mes” con el total (formato moneda).
- **Bloque Gastos**
  - Inputs para: Inversión materia prima, Compras productos, Nómina, Renta.
  - Lista de “Otros gastos” (concepto + monto) con opción de agregar/quitar filas.
  - Botón “Guardar gastos” que llame a `saveUtilidadesMes`.
- **Bloque Desglose / Resumen**
  - Total ventas.
  - Lista de todos los gastos con nombre y monto.
  - Total gastos.
  - **Utilidad neta** (Total ventas − Total gastos) destacada (número grande, color según positivo/negativo).

Todo con el mismo estilo que el resto de reportes (cards, bordes, tipografía).

---

## Orden sugerido de implementación

1. **Actions:** En `src/lib/actions/reports.ts` (o nuevo `utilidades.ts`):  
   - `getVentasDelMes(yearMonth)`,  
   - `getUtilidadesMes(yearMonth)`,  
   - `saveUtilidadesMes(yearMonth, data)`.
2. **Página:** Crear `src/app/reportes/utilidades/page.tsx` con selector de mes, bloques Ingresos, Gastos y Desglose.
3. **Reportes:** En `src/app/reportes/page.tsx` agregar la card “Utilidades” que enlace a `/reportes/utilidades`.

---

## Consideraciones

- **Zona horaria:** Usar la misma que el resto (America/Merida) para “inicio/fin de mes” al filtrar ventas.
- **Sin datos:** Si no hay ventas en el mes, mostrar 0. Si no hay documento de gastos, mostrar formulario vacío y permitir guardar.
- **Otros gastos:** Permite flexibilidad (luz, internet, etc.) sin tocar código; el usuario agrega conceptos y montos.
- Opcional: permitir “Personalizado” (rango de fechas) además del mes completo; en una segunda fase se puede reutilizar la misma lógica de rango que en Ventas.
