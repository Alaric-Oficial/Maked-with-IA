import json
import csv
import os
from string import Template
from autods.models import ResumenAnalisis


HTML_TPL = Template("""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auto-DS · Productos Mas Vendidos</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f0f1a; color: #e0e0e0; line-height: 1.6; padding: 2rem;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        header {
            background: linear-gradient(135deg, #1a1a3e 0%, #16213e 50%, #0a1628 100%);
            border: 1px solid #2a2a5a; padding: 2.5rem; border-radius: 16px; margin-bottom: 2rem;
        }
        header h1 { font-size: 2rem; color: #fff; }
        header p { color: #888; }
        .stats-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem; margin-bottom: 2rem;
        }
        .stat-card {
            background: #1a1a3e; border: 1px solid #2a2a5a; padding: 1.5rem;
            border-radius: 12px;
        }
        .stat-card .label { font-size: 0.8rem; text-transform: uppercase; color: #666; }
        .stat-card .value { font-size: 1.6rem; font-weight: 700; color: #00d4aa; }
        table {
            width: 100%; background: #1a1a3e; border-radius: 12px; overflow: hidden;
            border: 1px solid #2a2a5a; margin-bottom: 2rem;
        }
        th { background: #0a1628; color: #00d4aa; padding: 1rem; text-align: left;
               font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; }
        td { padding: 0.85rem 1rem; border-bottom: 1px solid #2a2a5a; }
        tr:hover { background: #252550; }
        .rank { font-weight: 700; color: #00d4aa; }
        .badge {
            display: inline-block; padding: 0.25rem 0.75rem; border-radius: 20px;
            font-size: 0.75rem; font-weight: 600;
        }
        .badge.gold { background: #ffd70022; color: #ffd700; border: 1px solid #ffd70055; }
        .badge.silver { background: #c0c0c022; color: #c0c0c0; border: 1px solid #c0c0c055; }
        .badge.bronze { background: #cd7f3222; color: #cd7f32; border: 1px solid #cd7f3255; }
        footer { text-align: center; color: #444; padding: 2rem; font-size: 0.85rem; }
        h2 { font-size: 1.3rem; margin-bottom: 1rem; color: #00d4aa;
              padding-bottom: 0.5rem; border-bottom: 2px solid #00d4aa44; }
        .precio { color: #00d4aa; font-weight: 600; }
        .rating { color: #ffd700; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Auto-DS · Top Productos Mas Vendidos</h1>
            <p>Fuente: $fuente_datos | $fecha_analisis</p>
        </header>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="label">Productos analizados</div>
                <div class="value">$total_productos</div>
            </div>
            <div class="stat-card">
                <div class="label">Ventas totales</div>
                <div class="value">$ventas_totales</div>
            </div>
            <div class="stat-card">
                <div class="label">Precio promedio</div>
                <div class="value">$precio_promedio</div>
            </div>
            <div class="stat-card">
                <div class="label">Rating promedio</div>
                <div class="value">$rating_promedio</div>
            </div>
            <div class="stat-card">
                <div class="label">Mas vendido</div>
                <div class="value" style="font-size:1rem">$producto_mas_vendido</div>
            </div>
            <div class="stat-card">
                <div class="label">Categoria lider</div>
                <div class="value" style="font-size:1rem">$categoria_mas_vendida</div>
            </div>
        </div>

        <h2>Top 30 Productos Mas Vendidos en AliExpress</h2>
        <table>
            <thead>
                <tr><th>#</th><th>Producto</th><th>Categoria</th><th>Precio</th><th>Ventas</th><th>Rating</th></tr>
            </thead>
            <tbody>
                $tabla_productos
            </tbody>
        </table>

        <h2>Rendimiento por Categoria</h2>
        <table>
            <thead>
                <tr><th>#</th><th>Categoria</th><th>Productos</th><th>Ventas totales</th><th>Ingresos est.</th></tr>
            </thead>
            <tbody>
                $tabla_categorias
            </tbody>
        </table>

        <h2>Distribucion de Precios</h2>
        <table>
            <thead><tr><th>Rango</th><th>Productos</th></tr></thead>
            <tbody>
                $tabla_precios
            </tbody>
        </table>

        <footer>Auto-DS v$version · $fecha_analisis</footer>
    </div>
</body>
</html>""")


def _render_fila_producto(p: dict) -> str:
    badge = ""
    r = p["ranking"]
    if r == 1:
        badge = ' class="badge gold"'
    elif r == 2:
        badge = ' class="badge silver"'
    elif r == 3:
        badge = ' class="badge bronze"'
    rank_html = f'<span{badge}>#{r}</span>' if badge else f'#{r}'
    stars = "★" * int(round(p["rating"])) if p["rating"] else ""
    return (
        f"<tr>"
        f"<td class='rank'>{rank_html}</td>"
        f"<td><strong>{p['titulo'][:60]}</strong></td>"
        f"<td>{p['categoria']}</td>"
        f"<td class='precio'>{p['precio']}€</td>"
        f"<td>{p['ventas']:,}</td>"
        f"<td class='rating'>{stars}</td>"
        f"</tr>"
    )


def generar_html(reporte: ResumenAnalisis, ruta_salida: str):
    filas_prod = "\n".join(_render_fila_producto(p) for p in reporte.top_productos)
    filas_cat = "".join(
        f"<tr><td class='rank'>#{c['ranking']}</td>"
        f"<td><strong>{c['categoria']}</strong></td>"
        f"<td>{c['productos']}</td>"
        f"<td>{c['ventas']:,}</td>"
        f"<td class='precio'>{c['ingresos_estimados']:,.2f}€</td></tr>"
        for c in reporte.top_categorias
    )
    filas_precios = "".join(
        f"<tr><td>{rango}</td><td>{count}</td></tr>"
        for rango, count in reporte.distribucion_precios.items()
    )

    def fmt_ventas(v):
        if v >= 1_000_000:
            return f"{v/1_000_000:.1f}M"
        if v >= 1_000:
            return f"{v/1_000:.1f}K"
        return str(v)

    html = HTML_TPL.substitute(
        fuente_datos=reporte.fuente_datos,
        fecha_analisis=reporte.fecha_analisis,
        total_productos=reporte.total_productos,
        ventas_totales=fmt_ventas(reporte.ventas_totales),
        precio_promedio=f"{reporte.precio_promedio}€",
        rating_promedio=f"{reporte.rating_promedio} ⭐",
        producto_mas_vendido=reporte.producto_mas_vendido or "N/A",
        categoria_mas_vendida=reporte.categoria_mas_vendida or "N/A",
        tabla_productos=filas_prod,
        tabla_categorias=filas_cat,
        tabla_precios=filas_precios,
        version="1.0.0",
    )
    with open(ruta_salida, "w", encoding="utf-8") as f:
        f.write(html)


def generar_json(reporte: ResumenAnalisis, ruta_salida: str):
    datos = {
        "metadata": {
            "herramienta": "Auto-DS",
            "version": "1.0.0",
            "fecha": reporte.fecha_analisis,
        },
        "resumen": {
            "total_productos": reporte.total_productos,
            "total_categorias": reporte.total_categorias,
            "ventas_totales": reporte.ventas_totales,
            "precio_promedio": reporte.precio_promedio,
            "precio_minimo": reporte.precio_minimo,
            "precio_maximo": reporte.precio_maximo,
            "rating_promedio": reporte.rating_promedio,
            "producto_mas_vendido": reporte.producto_mas_vendido,
            "categoria_mas_vendida": reporte.categoria_mas_vendida,
        },
        "top_productos": reporte.top_productos,
        "top_categorias": reporte.top_categorias,
        "distribucion_precios": reporte.distribucion_precios,
    }
    with open(ruta_salida, "w", encoding="utf-8") as f:
        json.dump(datos, f, indent=2, ensure_ascii=False)


def generar_csv(reporte: ResumenAnalisis, ruta_salida: str):
    with open(ruta_salida, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(
            ["Ranking", "Producto", "Categoria", "Precio", "Ventas", "Rating", "URL"]
        )
        for p in reporte.top_productos:
            w.writerow(
                [
                    p["ranking"],
                    p["titulo"],
                    p["categoria"],
                    p["precio"],
                    p["ventas"],
                    p["rating"],
                    p["url"],
                ]
            )


def generar_reporte(reporte: ResumenAnalisis, formato: str, ruta_salida: str):
    os.makedirs(os.path.dirname(ruta_salida) or ".", exist_ok=True)
    if formato == "html":
        generar_html(reporte, ruta_salida)
    elif formato == "json":
        generar_json(reporte, ruta_salida)
    elif formato == "csv":
        generar_csv(reporte, ruta_salida)
    else:
        raise ValueError(f"Formato no soportado: {formato}")
