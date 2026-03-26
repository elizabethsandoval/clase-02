from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# Lista temporal que simula una base de datos de mascotas
mascotas_db = []

# Lista de referencia de precios de servicios
servicios_precios = {
    "consulta": 50,
    "baño": 60,
    "corte": 100
}

class RegistroMascota(BaseModel):
    correo: str
    nombre_mascota: str
    tipo_servicio: str
    fecha: str

@router.post("/registrar-mascota")
def registrar_mascota(datos: RegistroMascota):
    mascota = {
        "correo": datos.correo,
        "nombre_mascota": datos.nombre_mascota,
        "tipo_servicio": datos.tipo_servicio,
        "fecha": datos.fecha,
        "precio": servicios_precios.get(datos.tipo_servicio, 0)
    }
    mascotas_db.append(mascota)
    return {
        "mensaje": "¡Mascota registrada exitosamente!",
        "datos": mascota
    }

@router.get("/mascotas/{correo}")
def listar_mascotas(correo: str):
    mascotas_usuario = [m for m in mascotas_db if m["correo"] == correo]
    
    if not mascotas_usuario:
        return {
            "correo": correo,
            "mascotas": [],
            "total_registros": 0
        }
    
    return {
        "correo": correo,
        "mascotas": mascotas_usuario,
        "total_registros": len(mascotas_usuario)
    }

@router.get("/reporte/{correo}")
def reporte_usuario(correo: str):
    mascotas_usuario = [m for m in mascotas_db if m["correo"] == correo]
    
    if not mascotas_usuario:
        return {
            "correo": correo,
            "total_servicios": 0,
            "servicios_registrados": [],
            "gasto_total": 0
        }
    
    # Contar servicios
    total_servicios = len(mascotas_usuario)
    
    # Listar servicios y calcular gasto total
    servicios_list = []
    gasto_total = 0
    
    for mascota in mascotas_usuario:
        servicio = {
            "nombre_mascota": mascota["nombre_mascota"],
            "tipo_servicio": mascota["tipo_servicio"],
            "fecha": mascota["fecha"],
            "precio": mascota["precio"]
        }
        servicios_list.append(servicio)
        gasto_total += mascota["precio"]
    
    return {
        "correo": correo,
        "total_servicios": total_servicios,
        "servicios_registrados": servicios_list,
        "gasto_total": gasto_total
    }
