// Listas fijas que usan los formularios y los filtros.
// Ajustar las carreras a las que tenga la universidad.

export const CARRERAS = [
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

export const TIPOS = ["Pasantía", "Trabajo"];

export const MODALIDADES = ["Presencial", "Remoto", "Híbrido"];

export const ESTADOS_POSTULACION = ["Enviada", "Vista", "Entrevista", "Aceptada", "Rechazada"];

export const ROLES = {
  ESTUDIANTE: "estudiante",
  EMPRESA: "empresa",
  ADMIN: "admin",
};

export const VALIDACION = {
  PENDIENTE: "pendiente",
  APROBADA: "aprobada",
  RECHAZADA: "rechazada",
};

export const ESTADO_OFERTA = {
  ABIERTA: "abierta",
  CERRADA: "cerrada",
};

// Áreas para explorar ofertas en la portada. Una oferta pertenece a un área
// si está dirigida a alguna de sus carreras.
export const AREAS = [
  { id: "tecnologia", nombre: "Tecnología", carreras: ["Ingeniería de Sistemas"] },
  { id: "diseno", nombre: "Diseño y comunicación", carreras: ["Diseño Gráfico"] },
  { id: "negocios", nombre: "Negocios y marketing", carreras: ["Ingeniería Comercial", "Administración de Empresas"] },
  { id: "finanzas", nombre: "Finanzas y contabilidad", carreras: ["Contaduría Pública"] },
  { id: "construccion", nombre: "Construcción y arquitectura", carreras: ["Ingeniería Civil", "Arquitectura"] },
  { id: "industria", nombre: "Industria y logística", carreras: ["Ingeniería Industrial"] },
  { id: "legal", nombre: "Legal", carreras: ["Derecho"] },
  { id: "personas", nombre: "Psicología y RR. HH.", carreras: ["Psicología"] },
];
