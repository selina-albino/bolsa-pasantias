# CampusJob — Bolsa de Pasantías y Trabajos para Estudiantes

Sitio web hecho con HTML, CSS y JavaScript, con Firebase como backend (Authentication, Firestore y Hosting, plan gratuito Spark).
Proyecto de Programación en Internet, UCATEC. Integrantes: Selina Albino Roque y Ariana Aguilar Otalora.

## Estado por módulo

| Módulo | RF | Responsable | Estado |
| --- | --- | --- | --- |
| Registro, inicio de sesión y roles | RF01 | Selina | Hecho |
| Publicar oferta | RF02 | Selina | Hecho |
| Editar / cerrar oferta | RF03 | Selina | Hecho |
| Listado, buscador y filtros | RF04 | Ariana | Hecho en la portada (frase con filtros + búsqueda por texto) |
| Detalle de oferta | RF05 | Ariana | Versión base hecha |
| Postular con CV (PDF hasta 700 KB, guardado en Firestore) | RF06 | Selina | Hecho |
| Perfil y estado de postulaciones | RF07 | Ariana | Pendiente (`estudiante/postulaciones.html`) |
| Contacto por WhatsApp | RF08 | Selina | Hecho (estudiante → empresa y empresa → estudiante) |
| Postulantes de una oferta: ver CV y cambiar estado | RF06/RF07 | Selina | Hecho (`empresa/postulantes.html`) |
| Panel de administración | RF09 | Ariana | Pendiente (`admin/empresas.html`) |

## Estructura

```
firebase.json            configuración de Hosting y Firestore
firestore.rules          reglas de seguridad de la base de datos (RNF01)
firestore.indexes.json   índices de las consultas
public/
  index.html             listado de ofertas abiertas
  login.html             inicio de sesión y recuperar contraseña
  registro.html          registro de estudiante o empresa
  oferta.html            detalle de oferta y postulación con CV
  empresa/panel.html     ofertas de la empresa (ver, editar, cerrar)
  empresa/oferta.html    formulario para publicar o editar
  empresa/postulantes.html  postulantes de una oferta: CV, estado y WhatsApp
  estudiante/            postulaciones del estudiante (Ariana)
  admin/                 validación de empresas (Ariana)
  css/estilos.css        estilos base, responsive
  js/firebase-config.js  claves del proyecto de Firebase
  js/datos.js            carreras, tipos, modalidades, estados
  js/auth.js             autenticación y roles
  js/ofertas.js          publicar, editar, cerrar, listar
  js/postulaciones.js    postular con CV, listar postulantes, cambiar estado
  js/ui.js               cabecera, mensajes, utilidades
  js/paginas/            el código de cada página
```

## Modelo de datos (Firestore)

- `usuarios/{uid}`: nombre, correo, rol (`estudiante` | `empresa` | `admin`), whatsapp.
  Estudiante: carrera, semestre. Empresa: nit, rubro, descripcion, estadoValidacion (`pendiente` | `aprobada` | `rechazada`), motivoRechazo.
- `ofertas/{id}`: titulo, descripcion, requisitos, carreras[], tipo, modalidad, ubicacion, horario, fechaLimite, estado (`abierta` | `cerrada`), empresaId, empresaNombre, empresaWhatsapp, creadaEn.
- `postulaciones/{ofertaId}_{estudianteId}`: ofertaId, ofertaTitulo, empresaId, estudianteId, datos del estudiante, cvNombre, estado (`Enviada` | `Vista` | `Entrevista` | `Aceptada` | `Rechazada`), fecha, historial[].
- `cvs/{ofertaId}_{estudianteId}`: el PDF como texto base64 (`contenido`), nombre, ofertaId, empresaId, estudianteId. Se usa Firestore porque Storage exige el plan Blaze.

## Puesta en marcha

### 1. Crear el proyecto (en la consola de Firebase, console.firebase.google.com)

1. **Agregar proyecto** → nombre, por ejemplo `bolsa-pasantias-ucatec`. Google Analytics se puede desactivar.
2. **Authentication** → Comenzar → Método de acceso → habilitar **Correo electrónico/contraseña**.
3. **Firestore Database** → Crear base de datos → ubicación `us-central1` → modo producción.
4. **Configuración del proyecto** (engranaje) → Tus apps → icono `</>` (Web) → registrar la app → copiar el objeto `firebaseConfig` y pegarlo en `public/js/firebase-config.js`.

### 2. Instalar Firebase CLI y publicar (en la terminal de la computadora)

```bash
npm install -g firebase-tools
firebase login
firebase use --add            # elegir el proyecto creado
firebase deploy               # sube el sitio, las reglas y los índices
```

Para probar en la computadora antes de publicar:

```bash
firebase serve                # abre http://localhost:5000
```

> El sitio usa módulos de JavaScript, así que no funciona abriendo el HTML con doble clic: hay que usar `firebase serve`, la extensión Live Server de VS Code, o la versión publicada.

### 3. Crear el administrador y aprobar empresas (en la consola de Firebase)

Mientras no exista el panel de administración:

1. Registrar una cuenta desde `registro.html` (como estudiante).
2. En **Firestore** → colección `usuarios` → abrir su documento → cambiar `rol` a `admin`.
3. Para aprobar una empresa: abrir su documento en `usuarios` → cambiar `estadoValidacion` a `aprobada`.

### 4. Datos de prueba sugeridos

- 1 administrador, 2 empresas (una aprobada y una pendiente), 2 estudiantes de carreras distintas.
- 4 a 6 ofertas mezclando tipo (pasantía o trabajo) y modalidad (presencial, remoto o híbrido).

## Trabajo en equipo con Git

```bash
git checkout -b selina/postulaciones   # una rama por módulo
git add . && git commit -m "Postular con CV"
git push -u origin selina/postulaciones   # luego Pull Request a main
```
