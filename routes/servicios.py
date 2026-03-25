from fastapi import APIRouter

router = APIRouter()

servicios_db = [
    {"nombre": "consulta", "precio": 50},
    {"nombre": "baño", "precio": 60},
    {"nombre": "corte", "precio": 100}
]

@router.get("/servicios")
def listar_servicios():
    return {
        "servicios": servicios_db
    }

@router.post("/agregar-servicio")
def agregar_servicio(nuevo: dict):
    servicios_db.append(nuevo)
    return {
        "mensaje": "¡Servicio guardado!",
        "datos": nuevo
    }
