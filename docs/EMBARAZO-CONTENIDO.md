# Embarazo y posparto: contenido para revisar

Todo el texto de salud de esta parte es un **borrador**. Lo tiene que revisar una obstetra o una partera **antes de publicar** en las tiendas. La versión de prueba sí puede llevarlo, porque no es pública.

El contenido está en `src/embarazo.ts`.

## 1. Tamaño por semana (`SIZES`)

Medidas aproximadas, de la semana 8 a la 40, en cm y gramos.
- Hasta la semana 19 se mide de la cabeza a la cadera.
- Desde la semana 20, de la cabeza a los pies.
- Por ese cambio de medida, la longitud salta entre la 19 y la 20. El peso siempre crece.

## 2. Frutas (`FRUITS`)

Una cada 4 semanas:

| Semana | Fruta |
|---|---|
| 8 | frambuesa |
| 12 | lima |
| 16 | palta |
| 20 | banana |
| 24 | choclo |
| 28 | berenjena |
| 32 | zapallo anco |
| 36 | melón |
| 40 | sandía chica |

## 3. "Esta semana" (`WEEK_TEXTS`)

Diez textos cortos, uno por etapa (desde la semana 0, 8, 12, 16 … 40). Son en tono tranquilo y sin consejos médicos.

## 4. Controles sugeridos (`DEFAULT_CONTROLS`)

| Trimestre | Controles |
|---|---|
| 1.º | Primera consulta · Análisis de sangre y orina · Ecografía de la semana 11 a 14 |
| 2.º | Ecografía de la semana 20 a 24 · Prueba de glucosa (semana 24 a 28) |
| 3.º | Análisis del tercer trimestre · Estudio de la semana 35 a 37 · Monitoreo |

La usuaria los puede tachar, borrar y agregar los suyos.

## 5. Cuándo consultar (`CONSULT_SIGNS`)

- Sangrado
- Dolor fuerte en la panza
- Fiebre
- Pérdida de líquido
- Dolor de cabeza fuerte o visión borrosa
- Vómitos que no te dejan tomar líquido
- Menos movimientos (desde la semana 28)

## 6. Aviso por síntoma repetido (`repeatText`)

Aparece cuando un síntoma se anota 5 días seguidos.
- Para náuseas menciona la dificultad para comer o tomar líquido.
- Para el resto, sugiere comentarlo en el control.

## 7. Posparto y pausa

| Pantalla | Texto |
|---|---|
| Posparto | Control posparto (cerca del día 40) · Anotar cómo estás de ánimo |
| Pausa | "Tomate el tiempo que necesites" y la hoja "Hablar ayuda" (`src/app/Gestacion.tsx`) |
