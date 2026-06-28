# Auto-DS

> **Automatiza el análisis de los productos más vendidos de AliExpress por categorías.**

Auto-DS es una herramienta CLI y librería Python que obtiene los productos más vendidos de AliExpress (con categorías reales), los analiza y genera reportes profesionales. Si AliExpress bloquea el acceso, usa datos simulados realistas para demostrar toda la funcionalidad.

---

## Características

- **Scraping de AliExpress** — 8 categorías reales con productos y ventas
- **Fallback inteligente** — Si AliExpress bloquea, usa datos simulados realistas (120 productos, 8 categorías)
- **Categorías reales** — Electrónica, Ropa, Hogar, Belleza, Deportes, Automotriz, Juguetes, Mascotas
- **Reportes profesionales** — HTML (oscuro/moderno), JSON, CSV
- **Rankings** — Top 30 productos más vendidos
- **Análisis por categoría** — Ventas totales, ingresos estimados, distribución de precios
- **CLI intuitiva** — Un solo comando para todo el análisis
- **Sin dependencias pesadas** — Solo requests, beautifulsoup4 y lxml

---

## Instalación

```bash
git clone https://github.com/Alaric-Oficial/auto-ds.git
cd auto-ds
pip install .
```

---

## Uso

```bash
# Análisis completo (intenta AliExpress, fallback a simulación)
autods run

# Solo datos simulados (rápido, sin conexión a AliExpress)
autods run --modo simulado

# Guardar reporte
autods run -o ./reportes -f html

# Guardar HTML y JSON
autods run -o ./reportes -f html --html ./reportes

# Ignorar caché y forzar scraping
autods run --no-cache

# Alias cortos
autods a
autods a --modo simulado -o ./reportes
```

---

## Categorías incluidas

| Categoría | Productos | IDs AliExpress |
|-----------|-----------|----------------|
| Electrónica | 15 | 200003482 |
| Ropa y Accesorios | 15 | 200003485 |
| Hogar y Jardín | 15 | 200003486 |
| Belleza y Salud | 15 | 200003487 |
| Deportes y Entretenimiento | 15 | 200003488 |
| Automotriz | 15 | 200003489 |
| Juguetes y Pasatiempos | 15 | 200003490 |
| Mascotas | 15 | 200003491 |

---

## Estructura del proyecto

```
auto-ds/
├── autods/
│   ├── __init__.py       # Versión y metadata
│   ├── __main__.py       # Entry point
│   ├── cli.py            # Interfaz de línea de comandos
│   ├── scraper.py        # Scraping de AliExpress + datos simulados
│   ├── analizador.py     # Motor de análisis y rankings
│   ├── models.py         # Data models (Producto, ResumenAnalisis)
│   └── reporter.py       # Generación de reportes (HTML/JSON/CSV)
├── setup.py
├── requirements.txt
└── README.md
```

---

## Salida de ejemplo

```
════════════════════════════════════════════════╗
║              Auto-DS  v1.0.0                  ║
║  Productos más vendidos de AliExpress         ║
╚════════════════════════════════════════════════╝

  Fuente:        AliExpress (datos simulados)
  Productos:     120 en 8 categorías
  Ventas totales: 10,386,000
  Más vendido:   Toalla Deporte Microfibra
  Categoría líder: Ropa y Accesorios

  TOP 10 PRODUCTOS MÁS VENDIDOS
  #1  Toalla Deporte Microfibra              320,000   4.99€
  #2  Funda Móvil Silicona                   310,000   2.99€
  #3  Gorra Baseball Ajustable               280,000   4.99€
  ...
```

---

## Licencia

MIT
