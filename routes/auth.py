from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# Lista temporal que simula una base de datos
usuarios_db = []

class Credenciales(BaseModel):
    correo: str
    contraseña: str

@router.post("/register")
def register(credenciales: Credenciales):
    usuarios_db.append({
        "correo": credenciales.correo,
        "contraseña": credenciales.contraseña
    })
    return {
        "mensaje": "¡Registro exitoso!",
        "datos": {
            "correo": credenciales.correo,
            "contraseña": credenciales.contraseña
        }
    }

@router.post("/login")
def login(credenciales: Credenciales):
    usuario = next((u for u in usuarios_db if u["correo"] == credenciales.correo and u["contraseña"] == credenciales.contraseña), None)
    
    if usuario:
        return {
            "mensaje": "¡Login exitoso!",
            "datos": {
                "correo": credenciales.correo
            }
        }
    else:
        return {
            "mensaje": "Credenciales inválidas",
            "datos": None
        }
