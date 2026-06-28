import random
import time
import re
import json

import requests

from autods.models import Producto


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    "DNT": "1",
    "Connection": "keep-alive",
}

CATEGORIAS = [
    ("200003482", "Electrónica"),
    ("200003485", "Ropa y Accesorios"),
    ("200003486", "Hogar y Jardín"),
    ("200003487", "Belleza y Salud"),
    ("200003488", "Deportes y Entretenimiento"),
    ("200003489", "Automotriz"),
    ("200003490", "Juguetes y Pasatiempos"),
    ("200003491", "Mascotas"),
]


def _extraer_productos_json(html: str) -> list[dict]:
    productos = []
    start = html.find('"itemList":{"content":[')
    if start == -1:
        return productos

    start += len('"itemList":{"content":[')
    depth = 0
    end = start
    for i in range(start, len(html)):
        if html[i] == "[":
            depth += 1
        elif html[i] == "]":
            if depth == 0:
                end = i
                break
            depth -= 1

    items = []
    depth = 0
    current = ""
    for ch in html[start:end]:
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
        current += ch
        if depth == 0 and current.strip():
            if current.strip().startswith("{"):
                items.append(current.strip())
            current = ""

    for item_str in items:
        try:
            item = json.loads(item_str)
        except json.JSONDecodeError:
            continue

        pid = item.get("productId") or item.get("redirectedId")
        if not pid:
            continue

        title_data = item.get("title", {}) or {}
        titulo = (
            title_data.get("displayTitle", "")
            if isinstance(title_data, dict)
            else ""
        )

        prices = item.get("prices", {}) or {}
        sale = prices.get("salePrice", {}) or {}
        precio = sale.get("minPrice", 0.0) if isinstance(sale, dict) else 0.0
        moneda = sale.get("currencyCode", "EUR") if isinstance(sale, dict) else "EUR"

        trade = item.get("trade", {}) or {}
        trade_desc = trade.get("tradeDesc", "") if isinstance(trade, dict) else ""

        ventas = 0
        if trade_desc:
            nums = re.findall(r"[\d.]+", trade_desc.replace(".", ""))
            if nums:
                ventas = int(nums[0])

        rating = 0.0
        if "evaluation" in item:
            ev = item["evaluation"]
            if isinstance(ev, dict):
                rating = float(ev.get("feedbackScore", 0) or 0)

        img_url = ""
        image = item.get("image", {}) or {}
        if isinstance(image, dict):
            img_url = image.get("imgUrl", "")

        productos.append(
            {
                "titulo": titulo,
                "precio": precio,
                "moneda": moneda,
                "ventas": ventas,
                "rating": rating,
                "imagen": img_url,
                "url": f"https://www.aliexpress.com/item/{pid}.html",
            }
        )

    return productos


def scrape_categoria(cat_id: str, cat_nombre: str, pagina: int = 1) -> list[dict]:
    url = f"https://www.aliexpress.com/category/{cat_id}/{cat_nombre.lower()}.html?page={pagina}"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        if resp.status_code != 200:
            return []
        productos = _extraer_productos_json(resp.text)
        for p in productos:
            p["categoria"] = cat_nombre
        return productos
    except Exception:
        return []


def generar_datos_simulados() -> list[Producto]:
    random.seed(42)
    datos = {
        "Electrónica": [
            ("Auriculares Bluetooth TWS 5.3", 12.99, 85000, 4.6),
            ("Cargador USB-C Rápido 65W", 18.50, 120000, 4.7),
            ("Smartwatch Deportivo IP68", 25.99, 95000, 4.4),
            ("Cable USB-C 2M Reforzado", 3.99, 200000, 4.5),
            ("Power Bank 30000mAh", 22.99, 78000, 4.6),
            ("Soporte Móvil Coche", 8.99, 150000, 4.3),
            ("Adaptador Bluetooth FM", 14.50, 67000, 4.2),
            ("Funda Móvil Silicona", 2.99, 310000, 4.4),
            ("Webcam HD 1080p", 21.99, 45000, 4.5),
            ("Altavoz Portátil Bluetooth", 19.99, 89000, 4.6),
            ("Ratón Inalámbrico Ergonómico", 11.99, 110000, 4.5),
            ("Teclado Mecánico RGB 60%", 32.99, 56000, 4.7),
            ("Hub USB-C 7 en 1", 28.99, 43000, 4.5),
            ("Lámpara LED Escritorio USB", 15.99, 92000, 4.3),
            ("Ventilador USB Portátil", 9.99, 180000, 4.2),
        ],
        "Ropa y Accesorios": [
            ("Camiseta Algodón Hombre Oversize", 9.99, 145000, 4.3),
            ("Vestido Verano Floral Mujer", 14.99, 98000, 4.4),
            ("Chaqueta Impermeable Hombre", 28.99, 67000, 4.5),
            ("Zapatillas Running Mujer", 35.99, 54000, 4.3),
            ("Bufanda Invierno Larga", 5.99, 210000, 4.2),
            ("Gorra Baseball Ajustable", 4.99, 280000, 4.1),
            ("Calcetines Algodón Pack 6", 7.99, 190000, 4.4),
            ("Cinturón Cuero Hombre", 12.99, 87000, 4.5),
            ("Mochila Viaje 40L Impermeable", 24.99, 76000, 4.6),
            ("Gafas Sol Polarizadas", 8.99, 160000, 4.2),
            ("Reloj Hombre Acero", 19.99, 93000, 4.3),
            ("Pantalón Cargo Hombre", 22.99, 65000, 4.4),
            ("Bolso Tote Mujer Cuero", 17.99, 81000, 4.5),
            ("Sombrero Playa Paja", 6.99, 120000, 4.1),
            ("Pijama Algodón Mujer", 13.99, 72000, 4.6),
        ],
        "Hogar y Jardín": [
            ("Robot Aspirador Inteligente", 89.99, 45000, 4.5),
            ("Organizador Escritorio Bambú", 14.99, 78000, 4.3),
            ("Cuchillo Chef Acero 8 Pulgadas", 11.99, 93000, 4.6),
            ("Sábanas Microfibra 300H", 21.99, 67000, 4.4),
            ("Maceta Autorriego 6 Piezas", 18.99, 34000, 4.2),
            ("Lámpara Noche LED 3D", 12.99, 120000, 4.5),
            ("Almohada Viscoelástica", 16.99, 89000, 4.3),
            ("Toalla Microfibra Viaje", 5.99, 250000, 4.4),
            ("Cortina Opaca 2 Paneles", 15.99, 56000, 4.5),
            ("Set Tupperware 10 Piezas", 19.99, 78000, 4.2),
            ("Estantería Flotante 3 Niveles", 14.99, 45000, 4.3),
            ("Tapete Yoga 6mm", 11.99, 92000, 4.5),
            ("Difusor Aromaterapia Ultrasónico", 13.99, 67000, 4.4),
            ("Cerradura Inteligente Digital", 32.99, 28000, 4.3),
            ("Fregona Giratoria 360", 9.99, 140000, 4.1),
        ],
        "Belleza y Salud": [
            ("Cepillo Alisador Eléctrico", 23.99, 56000, 4.3),
            ("Set Maquillaje 24 Colores", 14.99, 89000, 4.2),
            ("Masajeador Facial LED", 19.99, 45000, 4.5),
            ("Cortapelos Profesional", 27.99, 67000, 4.4),
            ("Espejo LED Maquillaje 10x", 18.99, 78000, 4.3),
            ("Depiladora Eléctrica IPL", 59.99, 34000, 4.6),
            ("Cepillo Dientes Eléctrico Sónico", 21.99, 92000, 4.5),
            ("Rasuradora Hombre 5 Cuchillas", 15.99, 110000, 4.3),
            ("Pack Mascarillas Facial 50uds", 7.99, 200000, 4.1),
            ("Aceite Corporal Coco 500ml", 8.99, 150000, 4.4),
            ("Perfume Hombre 100ml", 12.99, 130000, 4.2),
            ("Crema Antiarrugas Retinol", 16.99, 67000, 4.5),
            ("Plancha Alisadora Profesional", 34.99, 45000, 4.4),
            ("Secador Pelo 1800W Iónico", 25.99, 56000, 4.3),
            ("Set Cepillos Maquillaje 12uds", 9.99, 98000, 4.2),
        ],
        "Deportes y Entretenimiento": [
            ("Bandas Resistencia Fitness 5uds", 9.99, 120000, 4.4),
            ("Esterilla Yoga Plegable 183cm", 14.99, 78000, 4.5),
            ("Cuerda Saltar Ajustable", 5.99, 190000, 4.3),
            ("Pesas Ajustables 20kg", 45.99, 34000, 4.6),
            ("Rodillera Deportiva Ajustable", 11.99, 89000, 4.4),
            ("Mochila Hidratación Running 2L", 18.99, 45000, 4.3),
            ("Guantes Gimnasio Transpirables", 7.99, 110000, 4.2),
            ("Botella Agua Deporte 1000ml", 6.99, 250000, 4.5),
            ("Toalla Deporte Microfibra", 4.99, 320000, 4.1),
            ("Faja Lumbar Levantamiento", 15.99, 56000, 4.5),
            ("Tobillera Peso 1kg Par", 12.99, 43000, 4.3),
            ("Cinta Resistencia Yoga 8uds", 7.99, 67000, 4.4),
            ("Balón Pilates 65cm", 16.99, 34000, 4.2),
            ("Trampolín Plegable Adulto", 39.99, 21000, 4.3),
            ("Rodillo Espuma Yoga 45cm", 13.99, 56000, 4.5),
        ],
        "Automotriz": [
            ("Purificador Aire Coche", 18.99, 45000, 4.3),
            ("Soporte Coche Magnético", 7.99, 180000, 4.2),
            ("Cargador Coche USB 3.0 48W", 12.99, 120000, 4.5),
            ("Luces LED Interior Coche RGB", 9.99, 89000, 4.4),
            ("Organizador Maletero Plegable", 21.99, 56000, 4.3),
            ("Cubreasientos Coche Universales", 28.99, 34000, 4.1),
            ("Limpiabrisas Recargable", 14.99, 67000, 4.2),
            ("Volante Coche Deportivo Cuero", 35.99, 21000, 4.5),
            ("Cámara Marcha Atrás Inalámbrica", 42.99, 28000, 4.4),
            ("Medidor Presión Neumáticos Digital", 6.99, 150000, 4.3),
            ("Alfombrillas Coche 4 Piezas", 18.99, 45000, 4.2),
            ("Lavacoches Portátil 12V", 31.99, 23000, 4.4),
            ("Extintor Coche 1kg", 14.99, 56000, 4.5),
            ("Gato Hidráulico 2 Toneladas", 29.99, 18000, 4.3),
            ("Kit Limpieza Coche 15 Piezas", 16.99, 78000, 4.2),
        ],
        "Juguetes y Pasatiempos": [
            ("Set Construcción Bloques 1000uds", 19.99, 67000, 4.5),
            ("Puzzle 3D Torre Eiffel", 11.99, 45000, 4.3),
            ("Drone Plegable 4K Cámara", 59.99, 34000, 4.4),
            ("Coche RC Eléctrico 4x4", 25.99, 56000, 4.2),
            ("Muñeca Bebé Interactiva", 22.99, 38000, 4.3),
            ("Set Plastilina 36 Colores", 14.99, 89000, 4.1),
            ("Robot Programable Educativo", 34.99, 12000, 4.6),
            ("Juego Mesa Familiar Viaje", 16.99, 45000, 4.4),
            ("Lanzador Dardos Ventosa", 9.99, 110000, 4.2),
            ("Kit Ciencia Volcán", 12.99, 34000, 4.5),
            ("Pista Coches Eléctrica 2m", 29.99, 23000, 4.3),
            ("Telescopio Astronómico 70mm", 49.99, 15000, 4.4),
            ("Cometa Gigante 2m", 8.99, 56000, 4.1),
            ("Set Magia 50 Trucos", 15.99, 28000, 4.5),
            ("Slime Kit 20 Sobres", 11.99, 67000, 4.2),
        ],
        "Mascotas": [
            ("Cama Perro Grande Ortopédica", 25.99, 45000, 4.5),
            ("Juguete Perro Soga Nudo 3uds", 5.99, 120000, 4.3),
            ("Rascador Gato Torre 160cm", 35.99, 34000, 4.4),
            ("Collar Perro LED Recargable", 12.99, 56000, 4.2),
            ("Comedero Gato Cerámica", 8.99, 78000, 4.5),
            ("Transportín Mascotas Plegable", 21.99, 34000, 4.3),
            ("Cepillo Pelo Perro/Gato", 6.99, 110000, 4.4),
            ("Fuente Agua Gato 2L", 18.99, 45000, 4.6),
            ("Arnés Perro Ajustable Reflejante", 9.99, 89000, 4.3),
            ("Cortaúñas Mascotas Profesional", 7.99, 67000, 4.2),
            ("Juguete Gato Caña Plumas", 4.99, 150000, 4.1),
            ("Cama Gato Igloo Suave", 16.99, 28000, 4.4),
            ("Bebedero Viaje Portátil", 5.99, 45000, 4.3),
            ("Limpia Patas Perro Silicona", 8.99, 34000, 4.2),
            ("Premios Perro 500g", 7.99, 92000, 4.5),
        ],
    }

    productos = []
    for categoria, items in datos.items():
        for titulo, precio, ventas, rating in items:
            productos.append(
                Producto(
                    titulo=titulo,
                    precio=precio,
                    moneda="EUR",
                    ventas=ventas,
                    rating=rating,
                    categoria=categoria,
                    url=f"https://es.aliexpress.com/item/100500{random.randint(100000000, 999999999)}.html",
                )
            )
    return productos


def obtener_productos(usar_cache: bool = True) -> list[Producto]:
    """Obtiene productos desde AliExpress o usa datos simulados."""
    import os
    import json as json_mod

    cache_dir = os.path.expanduser("~/.cache/autods")
    cache_file = os.path.join(cache_dir, "productos.json")

    if usar_cache and os.path.exists(cache_file):
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                data = json_mod.load(f)
            productos = [Producto(**p) for p in data]
            return productos
        except Exception:
            pass

    productos_reales = []
    for cat_id, cat_nombre in CATEGORIAS:
        prods = scrape_categoria(cat_id, cat_nombre, 1)
        if prods:
            for p in prods:
                ventas = p.get("ventas", 0) or 0
                productos_reales.append(
                    Producto(
                        titulo=p.get("titulo", "Producto")[:100],
                        precio=float(p.get("precio", 0) or 0),
                        moneda=p.get("moneda", "EUR"),
                        ventas=int(ventas),
                        rating=float(p.get("rating", 0) or 0),
                        categoria=p.get("categoria", cat_nombre),
                        url=p.get("url", ""),
                        imagen=p.get("imagen", ""),
                    )
                )
        time.sleep(0.5)

    if productos_reales:
        os.makedirs(cache_dir, exist_ok=True)
        with open(cache_file, "w", encoding="utf-8") as f:
            json_mod.dump(
                [p.__dict__ for p in productos_reales], f, ensure_ascii=False
            )
        return productos_reales

    return generar_datos_simulados()
