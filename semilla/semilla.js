// Carga datos de prueba en el proyecto de Firebase de CampusJob.
//
// Crea estudiantes, empresas, ofertas, postulaciones y un CV en PDF para cada estudiante.
// Todo lo que crea queda marcado con "semilla: true", así se puede borrar después.
//
// Uso (en la terminal, dentro de la carpeta semilla):
//   npm install          una sola vez
//   npm run prueba       muestra qué se va a crear, sin tocar Firebase
//   npm run cargar       crea los datos
//   npm run borrar       borra solo los datos de prueba (no toca las cuentas reales)
//
// Necesita la clave de la cuenta de servicio en semilla/clave-firebase.json
// (Consola de Firebase > Configuración del proyecto > Cuentas de servicio > Generar nueva clave privada).
// Esa clave NO se sube a GitHub (está en .gitignore).

import { readFileSync, existsSync } from "node:fs";
import PDFDocument from "pdfkit";

// ===================== Configuración =====================

// Contraseña de todas las cuentas de prueba.
const PASSWORD = "Campus2026";

// Número de WhatsApp para TODAS las cuentas de prueba, con código de país (ej. "59171234567").
// Pon el tuyo o el de Ariana para probar el botón sin escribirle a desconocidos.
// Si lo dejas vacío, las cuentas de prueba no muestran botón de WhatsApp.
const NUMERO_PRUEBA = "59179417954";

const CANT_ESTUDIANTES = 50;

// ===================== Datos base =====================

const CARRERAS = [
  "Ingeniería de Sistemas",
  "Ingeniería Comercial",
  "Ingeniería Industrial",
  "Ingeniería Civil",
  "Administración de Empresas",
  "Contaduría Pública",
  "Derecho",
  "Arquitectura",
  "Diseño Gráfico",
  "Psicología",
];

const NOMBRES = [
  "Valeria", "Camila", "Daniela", "Lucía", "Mariana", "Sofía", "Fernanda", "Gabriela", "Andrea", "Paola",
  "Nicole", "Carla", "Jimena", "Alejandra", "Natalia", "Micaela", "Rocío", "Brenda", "Wara", "Killa",
  "Diego", "Mateo", "Sebastián", "Rodrigo", "Andrés", "Luis", "Carlos", "Joaquín", "Gonzalo", "Marco",
  "Bruno", "Adrián", "Fabián", "Javier", "Mauricio", "Nicolás", "Álvaro", "Iván", "Renán", "Ariel",
];

const APELLIDOS = [
  "Mamani", "Quispe", "Rojas", "Vargas", "Flores", "Gutiérrez", "Fernández", "Choque", "Mendoza", "Torrez",
  "Salazar", "Arce", "Villarroel", "Rocha", "Montaño", "Claros", "Zurita", "Camacho", "Peredo", "Heredia",
  "Soria", "Céspedes", "Antezana", "Orellana", "Guzmán", "Saavedra", "Terrazas", "Ugarte", "Vidal", "Zambrana",
];

const ZONAS = [
  "Zona Norte, Cochabamba", "Cala Cala, Cochabamba", "Queru Queru, Cochabamba", "Centro, Cochabamba",
  "Zona Sur, Cochabamba", "Sarco, Cochabamba", "Tiquipaya", "Quillacollo", "Sacaba", "América Oeste, Cochabamba",
];

const HORARIOS = [
  "Lunes a viernes, 8:30 a 12:30",
  "Lunes a viernes, 14:30 a 18:30",
  "Lunes a viernes, 9:00 a 13:00",
  "Lunes a viernes, 8:00 a 16:00",
  "Martes a sábado, 9:00 a 13:00",
  "Horario flexible, 20 horas por semana",
  "Lunes, miércoles y viernes, 9:00 a 17:00",
];

// Puestos: qué se hace y qué se pide. Las carreras indican a quién va dirigida la oferta.
const PUESTOS = {
  "Pasante de desarrollo web": {
    carreras: ["Ingeniería de Sistemas"],
    tareas: "Apoyarás en el desarrollo y mantenimiento de sitios web con HTML, CSS y JavaScript, y en la corrección de errores reportados por clientes.",
    requisitos: "- Conocimientos de HTML, CSS y JavaScript\n- Manejo básico de Git\n- Ganas de aprender frameworks como React o Vue",
  },
  "Desarrollador frontend junior": {
    carreras: ["Ingeniería de Sistemas"],
    tareas: "Construirás interfaces para nuestras aplicaciones web a partir de diseños en Figma, cuidando que funcionen bien en celular.",
    requisitos: "- JavaScript y CSS responsive\n- Experiencia con algún framework (React, Vue o Angular)\n- Disponibilidad de medio tiempo",
  },
  "Soporte técnico TI": {
    carreras: ["Ingeniería de Sistemas"],
    tareas: "Atenderás solicitudes de soporte de los usuarios internos, instalarás equipos y software, y documentarás las incidencias.",
    requisitos: "- Conocimientos de Windows y redes básicas\n- Buena comunicación\n- Desde 5.º semestre",
  },
  "Pasante de QA y pruebas": {
    carreras: ["Ingeniería de Sistemas"],
    tareas: "Diseñarás y ejecutarás casos de prueba para aplicaciones web y móviles, y reportarás errores al equipo de desarrollo.",
    requisitos: "- Atención al detalle\n- Conocimientos básicos de bases de datos\n- Deseable: experiencia con herramientas de pruebas",
  },
  "Administrador de redes junior": {
    carreras: ["Ingeniería de Sistemas"],
    tareas: "Apoyarás en la configuración y monitoreo de la red, servidores y respaldos de la empresa.",
    requisitos: "- Conocimientos de redes (TCP/IP, routers, switches)\n- Linux básico\n- Deseable: certificación CCNA en curso",
  },
  "Pasante de diseño gráfico": {
    carreras: ["Diseño Gráfico"],
    tareas: "Diseñarás piezas para redes sociales, afiches y material impreso para nuestros clientes.",
    requisitos: "- Manejo de Adobe Photoshop e Illustrator\n- Portafolio con trabajos propios\n- Creatividad y cumplimiento de plazos",
  },
  "Diseñador de redes sociales": {
    carreras: ["Diseño Gráfico", "Ingeniería Comercial"],
    tareas: "Crearás el contenido visual semanal de las cuentas de la empresa y propondrás ideas para campañas.",
    requisitos: "- Photoshop, Illustrator o Canva\n- Conocimiento de Instagram, Facebook y TikTok\n- Deseable: edición de video corto",
  },
  "Ilustrador digital": {
    carreras: ["Diseño Gráfico"],
    tareas: "Realizarás ilustraciones para empaques, campañas y material educativo.",
    requisitos: "- Ilustración digital (Procreate o Illustrator)\n- Portafolio\n- Desde 6.º semestre",
  },
  "Pasante de branding": {
    carreras: ["Diseño Gráfico", "Ingeniería Comercial"],
    tareas: "Participarás en la creación de identidades visuales: logotipos, paletas y manuales de marca.",
    requisitos: "- Illustrator avanzado\n- Nociones de tipografía y color\n- Trabajo en equipo",
  },
  "Pasante de ingeniería civil": {
    carreras: ["Ingeniería Civil"],
    tareas: "Apoyarás en el seguimiento de obras, cómputos métricos y control de avance.",
    requisitos: "- AutoCAD y Excel\n- Desde 7.º semestre\n- Disponibilidad para ir a obra",
  },
  "Asistente de obra": {
    carreras: ["Ingeniería Civil", "Arquitectura"],
    tareas: "Acompañarás al residente de obra en el control de materiales, personal y calidad.",
    requisitos: "- Lectura de planos\n- Excel intermedio\n- Responsabilidad y puntualidad",
  },
  "Dibujante técnico (AutoCAD)": {
    carreras: ["Ingeniería Civil", "Arquitectura"],
    tareas: "Elaborarás planos arquitectónicos y estructurales a partir de bocetos y levantamientos.",
    requisitos: "- AutoCAD avanzado\n- Deseable: Revit\n- Prolijidad en la presentación",
  },
  "Pasante de arquitectura": {
    carreras: ["Arquitectura"],
    tareas: "Participarás en el diseño de proyectos de vivienda: anteproyecto, planos y renders.",
    requisitos: "- AutoCAD y SketchUp\n- Deseable: Lumion o V-Ray\n- Desde 6.º semestre",
  },
  "Modelador 3D": {
    carreras: ["Arquitectura", "Diseño Gráfico"],
    tareas: "Modelarás y renderizarás proyectos para presentaciones a clientes.",
    requisitos: "- SketchUp, Revit o Blender\n- Portafolio de renders\n- Manejo de tiempos de entrega",
  },
  "Pasante de control de calidad": {
    carreras: ["Ingeniería Industrial"],
    tareas: "Realizarás controles en la línea de producción y registrarás los resultados en planillas de calidad.",
    requisitos: "- Conocimientos de control estadístico de procesos\n- Excel\n- Disponibilidad en turno mañana",
  },
  "Asistente de producción": {
    carreras: ["Ingeniería Industrial", "Ingeniería Comercial"],
    tareas: "Apoyarás en la planificación de la producción diaria y el control de inventarios de insumos.",
    requisitos: "- Excel intermedio\n- Organización\n- Desde 6.º semestre",
  },
  "Pasante de mejora de procesos": {
    carreras: ["Ingeniería Industrial"],
    tareas: "Levantarás procesos, medirás tiempos y propondrás mejoras con herramientas Lean.",
    requisitos: "- Conocimiento de diagramas de flujo y 5S\n- Excel\n- Capacidad de análisis",
  },
  "Asistente de logística": {
    carreras: ["Ingeniería Industrial", "Ingeniería Comercial", "Administración de Empresas"],
    tareas: "Coordinarás despachos, rutas de entrega y el registro de inventario en el sistema.",
    requisitos: "- Excel\n- Buena organización\n- Deseable: licencia de conducir",
  },
  "Pasante contable": {
    carreras: ["Contaduría Pública"],
    tareas: "Apoyarás en el registro de comprobantes, conciliaciones bancarias y preparación de estados financieros.",
    requisitos: "- Contabilidad general\n- Excel\n- Desde 5.º semestre",
  },
  "Auxiliar de impuestos": {
    carreras: ["Contaduría Pública"],
    tareas: "Prepararás declaraciones de IVA e IT, y llevarás el libro de compras y ventas de clientes.",
    requisitos: "- Conocimiento de normativa tributaria boliviana\n- Manejo del sistema del SIN\n- Desde 7.º semestre",
  },
  "Asistente administrativo": {
    carreras: ["Administración de Empresas", "Ingeniería Comercial"],
    tareas: "Apoyarás en compras, archivo, atención a proveedores y reportes para gerencia.",
    requisitos: "- Paquete Office\n- Redacción clara\n- Proactividad",
  },
  "Pasante de finanzas": {
    carreras: ["Administración de Empresas", "Contaduría Pública", "Ingeniería Comercial"],
    tareas: "Elaborarás flujos de caja, análisis de costos y presentaciones para clientes.",
    requisitos: "- Matemática financiera\n- Excel avanzado\n- Desde 6.º semestre",
  },
  "Pasante de derecho civil": {
    carreras: ["Derecho"],
    tareas: "Apoyarás en la redacción de memoriales, seguimiento de procesos y atención a clientes.",
    requisitos: "- Desde 7.º semestre\n- Buena redacción\n- Disponibilidad para ir a juzgados",
  },
  "Asistente legal": {
    carreras: ["Derecho"],
    tareas: "Revisarás contratos, organizarás expedientes y prepararás documentos para trámites.",
    requisitos: "- Conocimientos de derecho comercial y civil\n- Office\n- Discreción",
  },
  "Procurador junior": {
    carreras: ["Derecho"],
    tareas: "Realizarás el seguimiento de expedientes en juzgados y entidades públicas.",
    requisitos: "- Desde 6.º semestre\n- Responsabilidad\n- Disponibilidad de mañana",
  },
  "Pasante de psicología organizacional": {
    carreras: ["Psicología"],
    tareas: "Participarás en procesos de selección, evaluación de clima laboral y talleres para el personal.",
    requisitos: "- Desde 7.º semestre\n- Conocimiento de pruebas psicométricas\n- Habilidades de comunicación",
  },
  "Asistente de evaluación psicológica": {
    carreras: ["Psicología"],
    tareas: "Apoyarás en la aplicación y calificación de pruebas, y en la preparación de informes.",
    requisitos: "- Desde 8.º semestre\n- Ética profesional\n- Organización",
  },
  "Pasante de recursos humanos": {
    carreras: ["Psicología", "Administración de Empresas"],
    tareas: "Apoyarás en reclutamiento, inducción de personal nuevo y archivo de legajos.",
    requisitos: "- Office\n- Buena comunicación\n- Desde 6.º semestre",
  },
  "Asistente de reclutamiento": {
    carreras: ["Psicología", "Administración de Empresas"],
    tareas: "Publicarás ofertas, filtrarás CV y coordinarás entrevistas.",
    requisitos: "- Organización\n- Manejo de redes sociales\n- Trato amable",
  },
  "Ejecutivo de ventas junior": {
    carreras: ["Ingeniería Comercial", "Administración de Empresas"],
    tareas: "Visitarás clientes, presentarás productos y darás seguimiento a cotizaciones.",
    requisitos: "- Facilidad de palabra\n- Orientación a metas\n- Deseable: movilidad propia",
  },
  "Pasante de marketing digital": {
    carreras: ["Ingeniería Comercial", "Diseño Gráfico", "Administración de Empresas"],
    tareas: "Apoyarás en campañas pagadas en redes sociales, calendario de publicaciones y reportes de resultados.",
    requisitos: "- Conocimiento de Meta Ads\n- Redacción creativa\n- Deseable: Canva",
  },
  "Pasante de atención al cliente": {
    carreras: ["Ingeniería Comercial", "Administración de Empresas", "Psicología"],
    tareas: "Atenderás consultas por WhatsApp y teléfono, y registrarás reclamos y sugerencias.",
    requisitos: "- Buena comunicación escrita\n- Paciencia\n- Manejo de computadora",
  },
  "Encargado de redes sociales": {
    carreras: ["Diseño Gráfico", "Ingeniería Comercial"],
    tareas: "Gestionarás las cuentas de la empresa: fotos de productos, publicaciones y respuesta a mensajes.",
    requisitos: "- Fotografía con celular\n- Canva o Photoshop\n- Creatividad",
  },
  "Tutor de programación": {
    carreras: ["Ingeniería de Sistemas"],
    tareas: "Acompañarás a estudiantes de colegio en cursos de programación con Python y Scratch.",
    requisitos: "- Python básico\n- Paciencia y facilidad para explicar\n- Disponibilidad los sábados",
  },
  "Pasante de contenido educativo": {
    carreras: ["Psicología", "Diseño Gráfico", "Ingeniería de Sistemas"],
    tareas: "Prepararás materiales y guías para cursos virtuales.",
    requisitos: "- Buena redacción\n- Manejo de Google Workspace\n- Deseable: edición de video",
  },
};

// Empresas inventadas para la demostración.
const EMPRESAS = [
  { nombre: "Andes Software Lab", rubro: "Tecnología", descripcion: "Desarrollo de software a medida para empresas de la región.", puestos: ["Pasante de desarrollo web", "Desarrollador frontend junior", "Soporte técnico TI"] },
  { nombre: "Nube Valluna", rubro: "Tecnología", descripcion: "Servicios de hosting, redes y soporte informático.", puestos: ["Pasante de QA y pruebas", "Administrador de redes junior"] },
  { nombre: "Estudio Pixel Kolla", rubro: "Diseño y publicidad", descripcion: "Estudio de diseño gráfico y comunicación visual.", puestos: ["Pasante de diseño gráfico", "Diseñador de redes sociales", "Ilustrador digital"] },
  { nombre: "Taller Creativo Tunari", rubro: "Publicidad", descripcion: "Agencia de branding para emprendimientos.", puestos: ["Pasante de branding", "Pasante de marketing digital"] },
  { nombre: "Constructora Cerro Verde", rubro: "Construcción", descripcion: "Construcción de viviendas y edificios.", puestos: ["Pasante de ingeniería civil", "Asistente de obra", "Dibujante técnico (AutoCAD)"] },
  { nombre: "Habitat Valle Arquitectos", rubro: "Arquitectura", descripcion: "Diseño arquitectónico y de interiores.", puestos: ["Pasante de arquitectura", "Modelador 3D"] },
  { nombre: "Lácteos Pampa Alta", rubro: "Industria alimentaria", descripcion: "Producción de lácteos y derivados.", puestos: ["Pasante de control de calidad", "Asistente de producción"] },
  { nombre: "Molinos del Valle Alto", rubro: "Industria", descripcion: "Producción de harinas y alimentos balanceados.", puestos: ["Pasante de mejora de procesos", "Asistente de logística"] },
  { nombre: "Rojas & Vargas Contadores", rubro: "Servicios contables", descripcion: "Contabilidad e impuestos para pymes.", puestos: ["Pasante contable", "Auxiliar de impuestos"] },
  { nombre: "Finanzas Claras Consultores", rubro: "Consultoría", descripcion: "Asesoría financiera y administrativa.", puestos: ["Pasante de finanzas", "Asistente administrativo"] },
  { nombre: "Estudio Jurídico Mendoza Arce", rubro: "Servicios legales", descripcion: "Asesoría legal civil, familiar y comercial.", puestos: ["Pasante de derecho civil", "Asistente legal"] },
  { nombre: "Defensa Legal Integral", rubro: "Servicios legales", descripcion: "Patrocinio en procesos civiles y laborales.", puestos: ["Procurador junior"] },
  { nombre: "Centro Psicológico Equilibrio", rubro: "Salud mental", descripcion: "Atención psicológica y evaluación.", puestos: ["Asistente de evaluación psicológica", "Pasante de psicología organizacional"] },
  { nombre: "Talento Humano Consultora", rubro: "Recursos humanos", descripcion: "Selección de personal y capacitación.", puestos: ["Pasante de recursos humanos", "Asistente de reclutamiento"] },
  { nombre: "Mercado Express Valle", rubro: "Comercio", descripcion: "Distribución de productos de consumo masivo.", puestos: ["Ejecutivo de ventas junior", "Pasante de marketing digital"] },
  { nombre: "Rutas del Valle Logística", rubro: "Transporte y logística", descripcion: "Transporte de carga y distribución urbana.", puestos: ["Asistente de logística", "Pasante de atención al cliente"] },
  { nombre: "Café Kollasuyo", rubro: "Gastronomía", descripcion: "Cafetería y tostaduría de café boliviano.", puestos: ["Encargado de redes sociales", "Asistente administrativo"] },
  { nombre: "EduTec Valle", rubro: "Educación", descripcion: "Cursos de tecnología para niños y jóvenes.", puestos: ["Tutor de programación", "Pasante de contenido educativo"] },
  { nombre: "Agro Sacaba Orgánico", rubro: "Agroindustria", descripcion: "Producción y venta de hortalizas orgánicas.", puestos: [], estado: "pendiente" },
  { nombre: "Empleos Rápidos Ya", rubro: "Servicios", descripcion: "Intermediación laboral.", puestos: [], estado: "rechazada", motivo: "No se pudo verificar el NIT de la empresa." },
];

// Habilidades para el CV según la carrera.
const HABILIDADES = {
  "Ingeniería de Sistemas": ["HTML, CSS y JavaScript", "Python y SQL", "Git y GitHub", "Redes básicas"],
  "Ingeniería Comercial": ["Investigación de mercados", "Excel intermedio", "Marketing digital", "Atención al cliente"],
  "Ingeniería Industrial": ["Control de calidad", "Excel avanzado", "Lean y 5S", "Gestión de inventarios"],
  "Ingeniería Civil": ["AutoCAD", "Cómputos métricos", "Excel", "Lectura de planos"],
  "Administración de Empresas": ["Paquete Office", "Planificación", "Gestión de proveedores", "Redacción de informes"],
  "Contaduría Pública": ["Contabilidad general", "Normativa tributaria", "Excel", "Conciliaciones bancarias"],
  Derecho: ["Redacción jurídica", "Derecho civil y comercial", "Investigación legal", "Office"],
  Arquitectura: ["AutoCAD y SketchUp", "Renders con Lumion", "Maquetas", "Dibujo a mano alzada"],
  "Diseño Gráfico": ["Photoshop e Illustrator", "Figma", "Fotografía", "Identidad visual"],
  Psicología: ["Pruebas psicométricas", "Entrevista", "Talleres grupales", "Redacción de informes"],
};

// ===================== Utilidades =====================

// Números al azar pero siempre iguales en cada ejecución.
let semillaAzar = 20261122;
function azar() {
  semillaAzar = (semillaAzar * 1103515245 + 12345) % 2147483648;
  return semillaAzar / 2147483648;
}
const entre = (min, max) => Math.floor(azar() * (max - min + 1)) + min;
const elegir = (lista) => lista[Math.floor(azar() * lista.length)];

function sinTildes(texto) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function fechaISO(diasDesdeHoy) {
  const d = new Date();
  d.setDate(d.getDate() + diasDesdeHoy);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function haceDias(dias, horas = 0) {
  return new Date(Date.now() - dias * 86400000 - horas * 3600000);
}

// CV en PDF de una página, devuelto como "data:application/pdf;base64,..."
function crearCV(e) {
  return new Promise((resolve) => {
    const pdf = new PDFDocument({ size: "LETTER", margin: 50, info: { Title: `CV - ${e.nombre}` } });
    const partes = [];
    pdf.on("data", (p) => partes.push(p));
    pdf.on("end", () => resolve("data:application/pdf;base64," + Buffer.concat(partes).toString("base64")));

    pdf.rect(0, 0, pdf.page.width, 110).fill("#2B3BD6");
    pdf.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(24).text(e.nombre, 50, 35);
    pdf.font("Helvetica").fontSize(12).text(`Estudiante de ${e.carrera} · ${e.semestre}.º semestre`, 50, 68);
    pdf.text(`${e.correo} · Cochabamba, Bolivia`, 50, 84);

    const seccion = (titulo) => {
      pdf.moveDown(1.2).fillColor("#2B3BD6").font("Helvetica-Bold").fontSize(13).text(titulo.toUpperCase());
      pdf.moveDown(0.3).fillColor("#161A3D").font("Helvetica").fontSize(11);
    };

    pdf.y = 135;
    seccion("Perfil");
    pdf.text(`Estudiante de ${e.carrera} con interés en adquirir experiencia práctica. Responsable, con facilidad para trabajar en equipo y aprender herramientas nuevas.`);
    seccion("Formación");
    pdf.font("Helvetica-Bold").text(`Licenciatura en ${e.carrera}`).font("Helvetica").text(`Universidad, ${e.semestre}.º semestre (en curso)`);
    seccion("Habilidades");
    for (const h of HABILIDADES[e.carrera]) pdf.text(`- ${h}`);
    seccion("Proyectos académicos");
    pdf.text(`- Proyecto integrador de ${e.carrera}, en equipo de cuatro personas.`);
    pdf.text("- Participación en feria universitaria de proyectos.");
    seccion("Idiomas");
    pdf.text("- Español: nativo").text(`- Inglés: ${elegir(["básico", "intermedio", "intermedio", "avanzado"])}`);
    pdf.fillColor("#4A5070").fontSize(8).text("CV de prueba generado para el proyecto CampusJob.", 50, 720);
    pdf.end();
  });
}

// ===================== Generar los datos =====================

function generarEmpresas() {
  return EMPRESAS.map((emp, i) => ({
    ...emp,
    correo: `${sinTildes(emp.nombre).slice(0, 18)}@empresa.campusjob.test`,
    nit: String(1000000000 + entre(10000000, 899999999)),
    estadoValidacion: emp.estado || "aprobada",
    motivoRechazo: emp.motivo || "",
    creadoEn: haceDias(30 - i),
  }));
}

function generarEstudiantes() {
  const usados = new Set();
  const lista = [];
  for (let i = 0; i < CANT_ESTUDIANTES; i++) {
    let nombre, ap1, ap2, clave;
    do {
      nombre = elegir(NOMBRES);
      ap1 = elegir(APELLIDOS);
      ap2 = elegir(APELLIDOS);
      clave = `${nombre}${ap1}`;
    } while (usados.has(clave) || ap1 === ap2);
    usados.add(clave);
    const carrera = CARRERAS[i % CARRERAS.length];
    lista.push({
      nombre: `${nombre} ${ap1} ${ap2}`,
      correo: `${sinTildes(nombre)}.${sinTildes(ap1)}@estudiante.campusjob.test`,
      carrera,
      semestre: entre(5, 10),
      creadoEn: haceDias(entre(5, 28), entre(0, 23)),
    });
  }
  return lista;
}

function generarOfertas(empresas) {
  const ofertas = [];
  for (const emp of empresas) {
    if (emp.estadoValidacion !== "aprobada") continue;
    for (const titulo of emp.puestos) {
      const p = PUESTOS[titulo];
      const tipo = titulo.startsWith("Pasante") || titulo.startsWith("Tutor") ? "Pasantía" : elegir(["Trabajo", "Trabajo", "Pasantía"]);
      const creadaHace = entre(1, 25);
      // Unas pocas ofertas viejas quedan cerradas para que se vea ese estado.
      const cerrada = creadaHace > 20 && azar() < 0.6;
      ofertas.push({
        titulo,
        descripcion: `${p.tareas} Formarás parte del equipo de ${emp.nombre}, ${emp.descripcion.toLowerCase()}`,
        requisitos: p.requisitos,
        carreras: p.carreras,
        tipo,
        modalidad: elegir(["Presencial", "Presencial", "Híbrido", "Remoto"]),
        ubicacion: elegir(ZONAS),
        horario: elegir(HORARIOS),
        fechaLimite: cerrada ? fechaISO(-entre(1, 4)) : fechaISO(entre(2, 30)),
        estado: cerrada ? "cerrada" : "abierta",
        empresaCorreo: emp.correo,
        empresaNombre: emp.nombre,
        creadaEn: haceDias(creadaHace, entre(0, 10)),
      });
    }
  }
  return ofertas;
}

const ESTADOS = ["Enviada", "Vista", "Entrevista", "Aceptada", "Rechazada"];
const CAMINOS = {
  Enviada: ["Enviada"],
  Vista: ["Enviada", "Vista"],
  Entrevista: ["Enviada", "Vista", "Entrevista"],
  Aceptada: ["Enviada", "Vista", "Entrevista", "Aceptada"],
  Rechazada: ["Enviada", "Vista", "Rechazada"],
};

function generarPostulaciones(estudiantes, ofertas) {
  const lista = [];
  for (const est of estudiantes) {
    // Primero ofertas de su carrera; si no hay suficientes, cualquiera.
    const afines = ofertas.filter((o) => o.carreras.includes(est.carrera));
    const cantidad = Math.min(afines.length, entre(1, 4));
    const elegidas = new Set();
    while (elegidas.size < cantidad) elegidas.add(elegir(afines));
    for (const o of elegidas) {
      const dias = Math.max(0, Math.floor((Date.now() - o.creadaEn.getTime()) / 86400000) - entre(0, 3));
      const estado = o.estado === "cerrada" ? elegir(["Aceptada", "Rechazada", "Entrevista"]) : elegir([...ESTADOS, "Enviada", "Vista"]);
      const historial = CAMINOS[estado].map((e, k) => ({ estado: e, fecha: haceDias(Math.max(0, dias - k * 2), 12 - k) }));
      lista.push({ est, oferta: o, estado, fecha: historial[0].fecha, historial });
    }
  }
  return lista;
}

const empresas = generarEmpresas();
const estudiantes = generarEstudiantes();
const ofertas = generarOfertas(empresas);
const postulaciones = generarPostulaciones(estudiantes, ofertas);

// ===================== Modo prueba =====================

if (process.argv.includes("--prueba")) {
  console.log(`Empresas: ${empresas.length} (${empresas.filter((e) => e.estadoValidacion === "aprobada").length} aprobadas)`);
  console.log(`Estudiantes: ${estudiantes.length}`);
  console.log(`Ofertas: ${ofertas.length} (${ofertas.filter((o) => o.estado === "abierta").length} abiertas)`);
  console.log(`Postulaciones: ${postulaciones.length}`);
  const cv = await crearCV(estudiantes[0]);
  console.log(`Tamaño de un CV: ${Math.round(cv.length / 1024)} KB en base64`);
  console.log("\nEjemplos:");
  console.log(empresas.slice(0, 3).map((e) => `  ${e.nombre} <${e.correo}>`).join("\n"));
  console.log(estudiantes.slice(0, 3).map((e) => `  ${e.nombre} <${e.correo}> ${e.carrera}`).join("\n"));
  process.exit(0);
}

// ===================== Conexión con Firebase =====================

const RUTA_CLAVE = new URL("./clave-firebase.json", import.meta.url);
if (!existsSync(RUTA_CLAVE)) {
  console.error("Falta semilla/clave-firebase.json. Descárgala en Consola de Firebase > Configuración del proyecto > Cuentas de servicio.");
  process.exit(1);
}

const { initializeApp, cert } = await import("firebase-admin/app");
const { getAuth } = await import("firebase-admin/auth");
const { getFirestore, Timestamp, FieldValue } = await import("firebase-admin/firestore");

initializeApp({ credential: cert(JSON.parse(readFileSync(RUTA_CLAVE, "utf8"))) });
const auth = getAuth();
const db = getFirestore();
const ts = (fecha) => Timestamp.fromDate(fecha);

// Crea la cuenta de Authentication, o reutiliza la que ya existe con ese correo.
async function cuenta(correo, nombre) {
  try {
    return (await auth.getUserByEmail(correo)).uid;
  } catch {
    return (await auth.createUser({ email: correo, password: PASSWORD, displayName: nombre })).uid;
  }
}

// Escribe en lotes de 400 operaciones (el máximo de Firestore es 500).
async function escribir(operaciones) {
  for (let i = 0; i < operaciones.length; i += 400) {
    const lote = db.batch();
    for (const [ref, datos] of operaciones.slice(i, i + 400)) lote.set(ref, datos);
    await lote.commit();
  }
}

async function borrar() {
  let total = 0;
  for (const col of ["cvs", "postulaciones", "ofertas", "usuarios"]) {
    const snap = await db.collection(col).where("semilla", "==", true).get();
    for (let i = 0; i < snap.docs.length; i += 400) {
      const lote = db.batch();
      snap.docs.slice(i, i + 400).forEach((d) => lote.delete(d.ref));
      await lote.commit();
    }
    if (col === "usuarios") {
      const uids = snap.docs.map((d) => d.id);
      for (let i = 0; i < uids.length; i += 1000) await auth.deleteUsers(uids.slice(i, i + 1000));
    }
    console.log(`  ${col}: ${snap.size} borrados`);
    total += snap.size;
  }
  console.log(`Listo. Se borraron ${total} documentos de prueba.`);
}

async function cargar() {
  console.log("Creando cuentas de empresas...");
  for (const emp of empresas) emp.uid = await cuenta(emp.correo, emp.nombre);

  console.log("Creando cuentas de estudiantes...");
  for (const est of estudiantes) est.uid = await cuenta(est.correo, est.nombre);

  const ops = [];

  for (const emp of empresas) {
    ops.push([db.doc(`usuarios/${emp.uid}`), {
      rol: "empresa", correo: emp.correo, nombre: emp.nombre, whatsapp: NUMERO_PRUEBA,
      nit: emp.nit, rubro: emp.rubro, descripcion: emp.descripcion,
      estadoValidacion: emp.estadoValidacion, motivoRechazo: emp.motivoRechazo,
      creadoEn: ts(emp.creadoEn), semilla: true,
    }]);
  }

  for (const est of estudiantes) {
    ops.push([db.doc(`usuarios/${est.uid}`), {
      rol: "estudiante", correo: est.correo, nombre: est.nombre, whatsapp: NUMERO_PRUEBA,
      carrera: est.carrera, semestre: est.semestre, creadoEn: ts(est.creadoEn), semilla: true,
    }]);
  }

  const porCorreo = Object.fromEntries(empresas.map((e) => [e.correo, e]));
  for (const o of ofertas) {
    const ref = db.collection("ofertas").doc();
    o.id = ref.id;
    const { empresaCorreo, creadaEn, ...datos } = o;
    ops.push([ref, {
      ...datos,
      empresaId: porCorreo[empresaCorreo].uid,
      empresaWhatsapp: NUMERO_PRUEBA,
      creadaEn: ts(creadaEn),
      actualizadaEn: ts(creadaEn),
      semilla: true,
    }]);
  }

  console.log("Generando CV en PDF...");
  const cvs = new Map();
  for (const est of estudiantes) cvs.set(est.uid, await crearCV(est));

  for (const p of postulaciones) {
    const empresaId = porCorreo[p.oferta.empresaCorreo].uid;
    const id = `${p.oferta.id}_${p.est.uid}`;
    const cvNombre = `CV_${p.est.nombre.replaceAll(" ", "_")}.pdf`;
    ops.push([db.doc(`postulaciones/${id}`), {
      ofertaId: p.oferta.id, ofertaTitulo: p.oferta.titulo,
      empresaId, empresaNombre: p.oferta.empresaNombre, empresaWhatsapp: NUMERO_PRUEBA,
      estudianteId: p.est.uid, estudianteNombre: p.est.nombre, estudianteCorreo: p.est.correo,
      estudianteCarrera: p.est.carrera, estudianteSemestre: p.est.semestre, estudianteWhatsapp: NUMERO_PRUEBA,
      cvNombre, estado: p.estado, fecha: ts(p.fecha),
      historial: p.historial.map((h) => ({ estado: h.estado, fecha: ts(h.fecha) })),
      actualizadoEn: ts(p.historial.at(-1).fecha),
      semilla: true,
    }]);
    ops.push([db.doc(`cvs/${id}`), {
      ofertaId: p.oferta.id, empresaId, estudianteId: p.est.uid,
      nombre: cvNombre, contenido: cvs.get(p.est.uid), subidoEn: ts(p.fecha), semilla: true,
    }]);
  }

  console.log("Guardando en Firestore...");
  await escribir(ops);

  console.log(`\nListo:
  ${empresas.length} empresas, ${estudiantes.length} estudiantes,
  ${ofertas.length} ofertas, ${postulaciones.length} postulaciones con CV.
Contraseña de todas las cuentas de prueba: ${PASSWORD}
Ejemplo de empresa:    ${empresas[0].correo}
Ejemplo de estudiante: ${estudiantes[0].correo}
La lista completa está en cuentas-de-prueba.txt`);
}

if (process.argv.includes("--borrar")) {
  await borrar();
} else {
  await cargar();
  const { writeFileSync } = await import("node:fs");
  const lineas = [
    `Contraseña de todas las cuentas: ${PASSWORD}`, "",
    "EMPRESAS", ...empresas.map((e) => `${e.correo}\t${e.nombre}\t${e.estadoValidacion}`), "",
    "ESTUDIANTES", ...estudiantes.map((e) => `${e.correo}\t${e.nombre}\t${e.carrera}`),
  ];
  writeFileSync(new URL("./cuentas-de-prueba.txt", import.meta.url), lineas.join("\n"));
}
process.exit(0);
