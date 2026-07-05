import type { Category, CategoryId } from "@/lib/tools";

// Spanish category prose (machine-translated, pending human spot-check).
// Only translatable fields are overridden; structure comes from lib/tools.ts.
export const ES_CATEGORIES: Partial<Record<CategoryId, Partial<Category>>> = {
  pdf: {
    name: "Herramientas PDF",
    blurb: "Une, divide, gira y convierte PDF — en tu navegador, sin subir archivos.",
    intro:
      "Estas herramientas PDF resuelven las tareas cotidianas con documentos: combinar archivos, extraer páginas, corregir la orientación, reducir el tamaño y convertir desde y hacia imágenes y texto. A diferencia de la mayoría de servicios en línea, todo funciona localmente en tu navegador, así que tus documentos nunca se suben a un servidor. Eso las hace rápidas y seguras para archivos delicados como contratos y estados de cuenta.",
    faqs: [
      { q: "¿Se suben mis PDF a un servidor?", a: "No. Cada herramienta PDF procesa el archivo por completo en tu navegador, así que el documento nunca sale de tu dispositivo." },
      { q: "¿Hay un límite de tamaño o diario?", a: "No hay límites artificiales: solo dependes de la memoria disponible de tu dispositivo." },
      { q: "¿Necesito instalar algo o registrarme?", a: "No. Las herramientas funcionan en cualquier navegador moderno, sin instalación y sin cuenta." },
    ],
  },
  image: {
    name: "Herramientas de imagen",
    blurb: "Redimensiona, recorta, comprime y convierte imágenes. Nada sale de tu dispositivo.",
    intro:
      "Desde redimensionar y recortar hasta quitar el fondo, comprimir, convertir formatos y borrar metadatos, estas herramientas cubren las tareas habituales con fotos. Comprimir, convertir, redimensionar y limpiar metadatos admiten lotes completos a la vez. Usan la API Canvas del navegador y, para quitar el fondo, un modelo de IA que corre en tu dispositivo mediante WebAssembly, así que tus imágenes se procesan localmente y nunca se suben, a plena resolución y sin marca de agua.",
    faqs: [
      { q: "¿Se suben mis imágenes?", a: "No. Todo el procesamiento ocurre en tu navegador; las imágenes nunca salen de tu dispositivo." },
      { q: "¿Hay marca de agua o límites?", a: "No. Sin marcas de agua, sin límites artificiales y a resolución completa." },
    ],
  },
  media: {
    name: "Herramientas de audio y vídeo",
    blurb: "Comprime, convierte y recorta vídeo y audio, directamente en tu navegador.",
    faqs: [
      { q: "¿Se suben mis archivos?", a: "No. El vídeo y el audio se procesan en tu navegador con ffmpeg.wasm; solo se descarga una vez el motor de procesamiento." },
    ],
  },
  text: {
    name: "Herramientas de texto",
    blurb: "Cuenta, transforma, limpia y da formato a texto al instante.",
    faqs: [
      { q: "¿Se guarda o sube mi texto?", a: "No. El procesamiento de texto ocurre localmente en tu navegador." },
    ],
  },
  developer: {
    name: "Herramientas para desarrolladores",
    blurb: "Formatea JSON, codifica, convierte y genera — rápido y en tu navegador.",
    faqs: [
      { q: "¿Se suben mis datos?", a: "No. Estas utilidades funcionan localmente en tu navegador." },
    ],
  },
  calculator: {
    name: "Calculadoras",
    blurb: "Finanzas, salud, fechas y matemáticas del día a día — al instante.",
    faqs: [
      { q: "¿Se guardan mis datos?", a: "No. Los cálculos se hacen al instante en tu navegador y nada se sube." },
    ],
  },
};
