from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Producto:
    titulo: str
    precio: float = 0.0
    moneda: str = "EUR"
    ventas: int = 0
    rating: float = 0.0
    categoria: str = "General"
    tienda: str = ""
    url: str = ""
    imagen: str = ""


@dataclass
class ResumenAnalisis:
    total_productos: int = 0
    total_categorias: int = 0
    total_ventas: int = 0
    precio_promedio: float = 0.0
    precio_minimo: float = 0.0
    precio_maximo: float = 0.0
    rating_promedio: float = 0.0
    producto_mas_vendido: str = ""
    producto_mas_caro: str = ""
    producto_mejor_rating: str = ""
    categoria_mas_vendida: str = ""
    categoria_mayor_ingreso: str = ""
    ventas_totales: int = 0
    top_productos: list = field(default_factory=list)
    top_categorias: list = field(default_factory=list)
    distribucion_precios: dict = field(default_factory=dict)
    fecha_analisis: str = ""
    fuente_datos: str = ""
