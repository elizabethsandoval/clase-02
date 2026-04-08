from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.servicios import router as servicios_router
from routes.auth import router as auth_router
from routes.mascotas import router as mascotas_router

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(servicios_router)
app.include_router(auth_router)
app.include_router(mascotas_router)

@app.get("/")
def saludar():
    return {"mensaje": "¡Hola! Bienvenido a mi API"}

@app.get("/bienvenido/{nombre}")
def saludar_persona(nombre: str):
    return {"mensaje": f"Hola {nombre}, ¡qué bueno verte por aquí!"}
