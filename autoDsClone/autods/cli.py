import argparse
import sys
import os

from autods import __version__
from autods.scraper import obtener_productos, generar_datos_simulados
from autods.analizador import analizar
from autods.reporter import generar_reporte


def print_banner():
    print()
    print("  ╔════════════════════════════════════════════════╗")
    print("  ║              Auto-DS  v1.0.0                  ║")
    print("  ║  Productos más vendidos de AliExpress         ║")
    print("  ╚════════════════════════════════════════════════╝")
    print()


def print_resumen(r):
    print(f"  Fuente:        {r.fuente_datos}")
    print(f"  Productos:     {r.total_productos} en {r.total_categorias} categorías")
    print(f"  Ventas totales: {r.ventas_totales:,}")
    print(f"  Precio promedio: {r.precio_promedio}€ ({r.precio_minimo}€ - {r.precio_maximo}€)")
    print(f"  Rating promedio: {r.rating_promedio} ⭐")
    print(f"  Más vendido:   {r.producto_mas_vendido}")
    print(f"  Categoría líder: {r.categoria_mas_vendida}")
    print()

    if r.top_productos:
        print("  TOP 10 PRODUCTOS MÁS VENDIDOS")
        print(f"  {'#':<4} {'Producto':<50} {'Ventas':<12} {'Precio':<10} {'Cat':<20}")
        print(f"  {'─'*4} {'─'*50} {'─'*12} {'─'*10} {'─'*20}")
        for p in r.top_productos[:10]:
            print(f"  #{p['ranking']:<2} {p['titulo'][:48]:<50} "
                  f"{p['ventas']:<12,} {p['precio']:<10.2f} {p['categoria'][:18]:<20}")

    if r.top_categorias:
        print()
        print("  TOP CATEGORÍAS")
        print(f"  {'#':<4} {'Categoría':<25} {'Ventas':<12} {'Ingresos est.':<16} {'Prods':<6}")
        print(f"  {'─'*4} {'─'*25} {'─'*12} {'─'*16} {'─'*6}")
        for c in r.top_categorias:
            print(f"  #{c['ranking']:<2} {c['categoria'][:23]:<25} "
                  f"{c['ventas']:<12,} {c['ingresos_estimados']:<16,.2f} {c['productos']:<6}")

    print()


def comando_analizar(args):
    print_banner()

    if args.modo == "simulado":
        print("  [→] Generando datos simulados...")
        productos = generar_datos_simulados()
        fuente = "Simulación"
    else:
        print("  [→] Obteniendo productos desde AliExpress...")
        productos = obtener_productos(usar_cache=not args.no_cache)
        fuente = "AliExpress (con fallback a simulación)"

    if not productos:
        print("  [✗] No se pudieron obtener productos.")
        sys.exit(1)

    print(f"  [→] Analizando {len(productos)} productos...")
    reporte = analizar(productos)

    print_resumen(reporte)

    if args.output:
        fmt = args.format
        os.makedirs(args.output, exist_ok=True)
        ruta = os.path.join(args.output, f"reporte_autods.{fmt}")
        generar_reporte(reporte, fmt, ruta)
        print(f"  [✓] Reporte guardado: {ruta}")

    if args.html:
        os.makedirs(args.html, exist_ok=True)
        ruta = os.path.join(args.html, "reporte_autods.html")
        generar_reporte(reporte, "html", ruta)
        print(f"  [✓] HTML guardado: {ruta}")

    print()
    print("  [✓] Análisis completado.")
    print()


def main():
    parser = argparse.ArgumentParser(
        prog="autods",
        description="Auto-DS: Analiza los productos más vendidos de AliExpress por categorías.",
    )
    parser.add_argument("--version", action="version", version=f"Auto-DS v{__version__}")

    sub = parser.add_subparsers(dest="comando")

    p = sub.add_parser("run", aliases=["r", "analizar", "a"],
                       help="Analiza productos más vendidos de AliExpress")
    p.add_argument("--modo", choices=["real", "simulado"], default="real",
                   help="'real' intenta scrapear AliExpress, 'simulado' usa datos de ejemplo")
    p.add_argument("--output", "-o", help="Directorio para guardar reporte")
    p.add_argument("--format", "-f", choices=["json", "csv", "html"], default="html",
                   help="Formato del reporte")
    p.add_argument("--html", help="Directorio para guardar reporte HTML (extra)")
    p.add_argument("--no-cache", action="store_true",
                   help="Ignorar caché y forzar scraping")

    args = parser.parse_args()

    if args.comando in ("run", "r", "analizar", "a"):
        comando_analizar(args)
    else:
        parser.print_help()
        print()
        print("  Ejemplos:")
        print("    autods run                    # Scraping real (con fallback)")
        print("    autods run --modo simulado    # Solo datos simulados")
        print("    autods run -o ./reportes -f html")
        print("    autods a --html ./reportes")
        print()


if __name__ == "__main__":
    main()
