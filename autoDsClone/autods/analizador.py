from collections import defaultdict
from datetime import datetime
from statistics import mean
from autods.models import Producto, ResumenAnalisis


def analizar(productos: list[Producto]) -> ResumenAnalisis:
    if not productos:
        return ResumenAnalisis()

    total = len(productos)
    precios = [p.precio for p in productos if p.precio > 0]
    ventas_totales = sum(p.ventas for p in productos)
    ratings = [p.rating for p in productos if p.rating > 0]

    precio_prom = round(mean(precios), 2) if precios else 0.0
    precio_min = round(min(precios), 2) if precios else 0.0
    precio_max = round(max(precios), 2) if precios else 0.0
    rating_prom = round(mean(ratings), 2) if ratings else 0.0

    # Ranking por ventas
    ranking = sorted(productos, key=lambda p: p.ventas, reverse=True)

    # Agrupar por categoría
    por_categoria = defaultdict(lambda: {"ventas": 0, "productos": 0, "ingresos": 0.0})
    for p in productos:
        por_categoria[p.categoria]["ventas"] += p.ventas
        por_categoria[p.categoria]["productos"] += 1
        por_categoria[p.categoria]["ingresos"] += p.precio * p.ventas

    top_categorias = sorted(
        por_categoria.items(), key=lambda x: x[1]["ventas"], reverse=True
    )

    # Distribución de precios
    rangos = [
        ("0-10€", 0, 10),
        ("10-25€", 10, 25),
        ("25-50€", 25, 50),
        ("50-100€", 50, 100),
        ("100€+", 100, float("inf")),
    ]
    distribucion = {}
    for label, lo, hi in rangos:
        count = sum(1 for p in productos if lo <= p.precio < hi)
        distribucion[label] = count

    top_prods = []
    for i, p in enumerate(ranking[:30], 1):
        top_prods.append(
            {
                "ranking": i,
                "titulo": p.titulo,
                "precio": p.precio,
                "moneda": p.moneda,
                "ventas": p.ventas,
                "rating": p.rating,
                "categoria": p.categoria,
                "url": p.url,
            }
        )

    top_cats = []
    for i, (cat, datos) in enumerate(top_categorias, 1):
        top_cats.append(
            {
                "ranking": i,
                "categoria": cat,
                "ventas": datos["ventas"],
                "productos": datos["productos"],
                "ingresos_estimados": round(datos["ingresos"], 2),
            }
        )

    return ResumenAnalisis(
        total_productos=total,
        total_categorias=len(por_categoria),
        total_ventas=ventas_totales,
        precio_promedio=precio_prom,
        precio_minimo=precio_min,
        precio_maximo=precio_max,
        rating_promedio=rating_prom,
        producto_mas_vendido=ranking[0].titulo if ranking else "",
        producto_mas_caro=max(productos, key=lambda p: p.precio).titulo if productos else "",
        producto_mejor_rating=max(productos, key=lambda p: p.rating).titulo if productos else "",
        categoria_mas_vendida=top_categorias[0][0] if top_categorias else "",
        categoria_mayor_ingreso=max(top_categorias, key=lambda x: x[1]["ingresos"])[0]
        if top_categorias
        else "",
        ventas_totales=ventas_totales,
        top_productos=top_prods,
        top_categorias=top_cats,
        distribucion_precios=distribucion,
        fecha_analisis=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        fuente_datos="AliExpress (datos simulados)" if productos and productos[0].ventas else "AliExpress",
    )
