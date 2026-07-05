import type { Tool } from "@/lib/tools";

// Spanish tool prose (machine-translated, pending human spot-check). Pilot set;
// any tool not listed here falls back to English via the resolver. Only
// translatable fields are overridden — slug/category/status/flags stay structural.
export const ES_TOOLS: Record<string, Partial<Tool>> = {
  "compress-pdf": {
    name: "Comprimir PDF",
    description:
      "Reduce el tamaño de un PDF gratis, directamente en tu navegador. Calidad ajustable y sin subir archivos: tu documento nunca sale de tu dispositivo.",
    keywords: ["comprimir pdf", "reducir tamaño pdf", "achicar pdf", "hacer pdf más pequeño", "compresor de pdf"],
    answer:
      "Para comprimir un PDF, elige una calidad (o un tamaño objetivo) y la herramienta vuelve a renderizar las páginas para reducir el peso. Todo ocurre en tu navegador, así que el archivo nunca se sube.",
    intro:
      "Comprimir PDF reduce el peso de un PDF volviendo a renderizar sus páginas con una calidad ajustable, ideal para adjuntar por correo o subir a formularios. Selecciona varios PDF para comprimirlos de una vez y descargarlos juntos en un .zip. Todo funciona en tu navegador, así que tus archivos nunca se suben.",
    steps: ["Elige uno o varios archivos PDF.", "Ajusta los deslizadores de calidad y resolución.", "Pulsa Comprimir y descarga el PDF más pequeño, o «Descargar todo» en un .zip."],
    faqs: [
      { q: "¿Cómo funciona la compresión?", a: "Cada página se vuelve a renderizar como una imagen comprimida y se reconstruye el PDF. Funciona muy bien con PDF escaneados o con muchas imágenes." },
      { q: "¿El texto seguirá siendo seleccionable?", a: "No: como las páginas se rasterizan, el texto pasa a formar parte de la imagen. Usa PDF a texto antes si necesitas el texto." },
      { q: "¿Se sube mi PDF?", a: "No, la compresión ocurre por completo en tu navegador." },
    ],
  },
  "merge-pdf": {
    name: "Unir PDF",
    description:
      "Combina varios PDF en un solo archivo gratis, en tu navegador. Reordena las páginas y descarga: sin subir archivos, sin registro.",
    keywords: ["unir pdf", "combinar pdf", "juntar pdf", "fusionar pdf", "unir documentos"],
    answer:
      "Para unir archivos PDF, añádelos, ordénalos como quieras y descarga el PDF combinado. Todo ocurre en tu navegador, así que tus documentos nunca se suben.",
    intro:
      "Unir PDF combina varios PDF en un único documento. Añade los archivos, reordénalos y descarga el resultado. Funciona por completo en tu navegador, así que nada se sube.",
    steps: ["Añade dos o más archivos PDF.", "Arrástralos para ordenarlos.", "Pulsa «Unir» y descarga el PDF combinado."],
    faqs: [
      { q: "¿Se suben mis archivos?", a: "No. La unión se realiza en tu navegador; los PDF nunca salen de tu dispositivo." },
      { q: "¿Puedo cambiar el orden?", a: "Sí, reordena los archivos antes de unirlos para fijar el orden de las páginas." },
    ],
  },
  "jpg-to-pdf": {
    name: "JPG a PDF",
    description:
      "Convierte imágenes JPG y PNG en un PDF gratis, en tu navegador. Ordena las fotos y descarga: sin subir nada, sin marca de agua.",
    keywords: ["jpg a pdf", "imagen a pdf", "fotos a pdf", "convertir jpg a pdf", "png a pdf"],
    answer:
      "Para convertir imágenes en PDF, añádelas, ordénalas y descarga el PDF. Todo ocurre en tu navegador, así que tus fotos nunca se suben.",
    intro:
      "JPG a PDF combina tus imágenes (JPG, PNG, WebP y más) en un único PDF, en el orden que elijas. Ideal para enviar fotos o escaneos como un solo documento. Funciona en tu navegador, sin subir nada.",
    steps: ["Añade tus imágenes.", "Arrástralas para ordenarlas.", "Pulsa «Crear PDF» y descárgalo."],
    faqs: [
      { q: "¿Qué formatos admite?", a: "Cualquier imagen que tu navegador pueda abrir: JPG, PNG, WebP y más." },
      { q: "¿Se suben mis fotos?", a: "No. El PDF se crea por completo en tu navegador." },
    ],
  },
  "compress-image": {
    name: "Comprimir imagen",
    description:
      "Comprime imágenes JPG y PNG para reducir su tamaño con un control de calidad — gratis, privado y en tu navegador. Comprime una o muchas a la vez.",
    keywords: ["comprimir imagen", "comprimir jpg", "reducir tamaño de imagen", "compresor de imágenes", "comprimir varias imágenes"],
    answer:
      "Para comprimir una imagen, ajusta la calidad (o fija un tamaño objetivo) y descarga la versión más ligera. Todo ocurre en tu navegador, así que la imagen nunca se sube.",
    intro:
      "Comprimir imagen reduce el peso de tus fotos con una calidad JPEG ajustable, ideal para webs más rápidas y adjuntos de correo. Selecciona varias imágenes para comprimirlas todas a la vez y descargarlas en un .zip. Todo ocurre localmente: nada se sube.",
    steps: ["Elige una o varias imágenes.", "Ajusta el deslizador de calidad.", "Descarga una imagen, o «Descargar todo» en un .zip para un lote."],
    faqs: [
      { q: "¿Cuánto se reducirá mi imagen?", a: "Normalmente entre un 40 % y un 80 %, según la calidad elegida y la foto original." },
      { q: "¿Puedo comprimir muchas a la vez?", a: "Sí. Selecciona varias imágenes y se comprimen en lote, cada una con su ahorro; descárgalas por separado o todas en un .zip." },
      { q: "¿Es privado?", a: "Sí. La compresión ocurre en tu navegador; tus imágenes nunca se suben." },
    ],
  },
  "resize-image": {
    name: "Redimensionar imagen",
    description:
      "Redimensiona cualquier imagen (JPG, PNG, WebP) a dimensiones exactas en píxeles, gratis. Funciona en tu navegador: sin subir nada.",
    keywords: ["redimensionar imagen", "cambiar tamaño de imagen", "redimensionar foto", "redimensionar jpg", "escalar imagen"],
    answer:
      "Para redimensionar una imagen, indica un ancho o alto nuevo y descarga el resultado. Todo ocurre en tu navegador, así que la imagen nunca se sube.",
    intro:
      "Redimensionar imagen escala cualquier foto al ancho y alto exactos que necesites, perfecto para redes sociales, avatares y miniaturas. Añade varias imágenes para ajustarlas todas a un mismo tamaño (respetando su proporción) y descargarlas en un .zip. Funciona localmente en tu navegador.",
    steps: ["Elige una o varias imágenes.", "Indica las nuevas dimensiones (o un ancho/alto máximo para un lote).", "Descarga la imagen, o «Descargar todo» en un .zip."],
    faqs: [
      { q: "¿Perderá calidad al redimensionar?", a: "Reducir mantiene la nitidez. Ampliar por encima del tamaño original puede verse borroso, como en cualquier redimensionador." },
      { q: "¿Se sube mi foto?", a: "No. El redimensionado usa la API Canvas del navegador; la imagen nunca sale de tu dispositivo." },
    ],
  },
  "background-remover": {
    name: "Quitar fondo",
    description:
      "Quita el fondo de una imagen automáticamente con IA, gratis y en tu navegador. Descarga un PNG transparente: sin subir nada, sin marca de agua.",
    keywords: ["quitar fondo", "eliminar fondo", "fondo transparente", "borrar fondo de imagen", "recortar fondo"],
    answer:
      "Para quitar el fondo de una foto, súbela y un modelo de IA que corre en tu dispositivo separa el sujeto del fondo y entrega un PNG transparente. La imagen nunca se sube.",
    intro:
      "Quitar fondo elimina el fondo de una foto con un modelo de IA que se ejecuta íntegramente en tu navegador mediante WebAssembly. Obtienes un PNG con fondo transparente, a plena resolución y sin marca de agua. Tu imagen nunca se sube.",
    steps: ["Elige una imagen.", "Espera a que la IA separe el sujeto del fondo.", "Descarga el PNG transparente."],
    faqs: [
      { q: "¿Se ejecuta en un servidor?", a: "No. El modelo de IA corre en tu dispositivo mediante WebAssembly, así que la imagen nunca sale de tu navegador." },
      { q: "¿Hay marca de agua?", a: "No. El PNG resultante es limpio y a resolución completa." },
    ],
  },
};
