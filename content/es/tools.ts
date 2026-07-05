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
  "split-pdf": {
    name: "Dividir PDF",
    description: "Extrae páginas de un PDF o divídelo en archivos separados, gratis y en tu navegador. Sin subir nada, sin registro.",
    keywords: ["dividir pdf", "separar pdf", "extraer páginas de pdf", "sacar páginas de un pdf"],
    answer: "Para dividir un PDF, cárgalo, elige las páginas o el rango que quieres extraer y descarga el resultado. Todo ocurre en tu navegador; el documento nunca se sube.",
    intro: "Dividir PDF te permite extraer páginas concretas de un PDF o separarlo en varios archivos. Se ejecuta por completo en tu navegador, así que tu documento nunca sale de tu dispositivo.",
    steps: ["Elige un archivo PDF.", "Indica las páginas o el rango a extraer.", "Descarga el PDF resultante."],
    faqs: [
      { q: "¿Se sube mi PDF?", a: "No. La división se realiza en tu navegador; el archivo nunca se sube." },
      { q: "¿Puedo extraer varias páginas?", a: "Sí, indica las páginas o el rango que necesites antes de descargar." },
    ],
  },
  "pdf-to-text": {
    name: "PDF a texto",
    description: "Extrae el texto de un PDF y cópialo o descárgalo, gratis y en tu navegador. Sin subir archivos.",
    keywords: ["pdf a texto", "extraer texto de pdf", "copiar texto de pdf", "sacar texto de un pdf"],
    answer: "Para extraer el texto de un PDF, cárgalo y la herramienta lee el texto de sus páginas para que lo copies o descargues. Todo ocurre en tu navegador.",
    intro: "PDF a texto extrae el contenido textual de un PDF para que puedas copiarlo o guardarlo. Funciona en tu navegador, así que el documento nunca se sube.",
    steps: ["Elige un archivo PDF.", "Espera a que se extraiga el texto.", "Copia o descarga el texto."],
    faqs: [
      { q: "¿Funciona con PDF escaneados?", a: "Extrae el texto real incrustado. Para páginas escaneadas (imágenes), usa Imagen a texto (OCR)." },
      { q: "¿Se sube mi PDF?", a: "No. La extracción ocurre en tu navegador." },
    ],
  },
  "image-to-text": {
    name: "Imagen a texto (OCR)",
    description: "Extrae texto de una imagen o captura con OCR, gratis y en tu navegador. Copia o descarga el texto: sin subir nada.",
    keywords: ["imagen a texto", "ocr", "extraer texto de imagen", "texto desde captura", "leer texto de foto"],
    answer: "Para sacar el texto de una imagen, cárgala y el OCR la analiza en tu dispositivo para darte el texto, que puedes copiar o descargar. Nada se sube.",
    intro: "Imagen a texto usa reconocimiento óptico de caracteres (OCR) en tu navegador para extraer el texto de capturas, recibos o documentos escaneados. Todo ocurre en tu dispositivo.",
    steps: ["Elige una imagen.", "Espera a que el OCR lea el texto.", "Copia o descarga el resultado."],
    faqs: [
      { q: "¿Sube mi imagen?", a: "No. El OCR se ejecuta en tu navegador con Tesseract compilado a WebAssembly." },
      { q: "¿Qué idiomas funcionan?", a: "Funciona mejor con texto impreso y claro; la escritura a mano y los escaneos de baja calidad dan resultados variables." },
    ],
  },
  "crop-image": {
    name: "Recortar imagen",
    description: "Recorta cualquier imagen a la zona que quieras arrastrando una selección, gratis y en tu navegador. Descarga el resultado al instante.",
    keywords: ["recortar imagen", "recortar foto", "cortar imagen", "recortar jpg"],
    answer: "Para recortar una imagen, cárgala, arrastra un recuadro sobre la zona que quieres conservar y descárgala. Todo ocurre en tu navegador.",
    intro: "Recortar imagen te deja marcar una zona de tu foto y quedarte solo con ella. Ideal para quitar bordes o encuadrar. Funciona en tu navegador.",
    steps: ["Elige una imagen.", "Arrastra sobre la vista previa para marcar el recorte.", "Descarga la imagen recortada."],
    faqs: [
      { q: "¿Se sube la imagen?", a: "No. El recorte se hace localmente con el Canvas del navegador." },
      { q: "¿En qué formato se descarga?", a: "La imagen recortada se descarga como PNG." },
    ],
  },
  "jpg-to-png": {
    name: "Convertidor de imágenes (JPG / PNG / WebP)",
    description: "Convierte imágenes entre JPG, PNG y WebP gratis y al instante, en tu navegador. Sin subir nada: elige un formato y descarga.",
    keywords: ["convertir imagen", "jpg a png", "png a jpg", "webp a jpg", "cambiar formato de imagen"],
    answer: "Para convertir una imagen, cárgala, elige el formato de salida (PNG, JPG o WebP) y descárgala. También puedes convertir varias a la vez. Todo ocurre en tu navegador.",
    intro: "Este convertidor cambia el formato de una imagen entre JPG, PNG y WebP. Elige el formato y descarga, o selecciona varias imágenes para convertirlas todas a la vez en un .zip. Funciona por completo en tu navegador.",
    steps: ["Elige una o varias imágenes.", "Selecciona el formato de salida (PNG, JPG o WebP).", "Descarga la imagen, o «Descargar todo» en un .zip."],
    faqs: [
      { q: "¿Qué conversiones admite?", a: "Cualquier dirección entre JPG, PNG y WebP, por ejemplo WebP a JPG o PNG a WebP." },
      { q: "¿Se suben mis archivos?", a: "No. Todo se convierte localmente en tu navegador." },
    ],
  },
  "word-counter": {
    name: "Contador de palabras",
    description: "Cuenta palabras, caracteres, frases y párrafos al instante mientras escribes, gratis y en tu navegador. Nada se sube.",
    keywords: ["contador de palabras", "contar palabras", "conteo de caracteres", "cuántas palabras"],
    answer: "Para contar palabras, pega o escribe tu texto y verás en tiempo real el número de palabras, caracteres, frases y párrafos. Todo ocurre en tu navegador.",
    intro: "Contador de palabras muestra en tiempo real las palabras, caracteres, frases y párrafos de tu texto mientras escribes. Útil para ensayos, publicaciones y límites de caracteres. Funciona en tu navegador.",
    steps: ["Pega o escribe tu texto.", "Consulta las cifras que se actualizan al instante.", "Copia el texto si lo necesitas."],
    faqs: [
      { q: "¿Hay límite de longitud?", a: "No. El conteo se hace localmente, así que incluso documentos largos se procesan al instante." },
      { q: "¿Se guarda mi texto?", a: "No, el texto nunca sale de tu dispositivo." },
    ],
  },
  "qr-code-generator": {
    name: "Generador de códigos QR",
    description: "Crea un código QR para una URL, texto o wifi gratis y en tu navegador. Descárgalo en alta resolución: sin subir nada, sin marca de agua.",
    keywords: ["código qr", "generar qr", "crear código qr", "generador de qr"],
    answer: "Para crear un código QR, escribe la URL o el texto y descárgalo como imagen. Se genera en tu navegador, sin marca de agua y sin subir nada.",
    intro: "Generador de códigos QR crea un QR a partir de una URL o texto que puedes descargar y usar donde quieras. Se genera por completo en tu navegador.",
    steps: ["Escribe la URL o el texto.", "Ajusta el tamaño si quieres.", "Descarga el código QR."],
    faqs: [
      { q: "¿Caduca el código QR?", a: "No. Es un QR estático que apunta a tu contenido y no caduca." },
      { q: "¿Hay marca de agua?", a: "No. La imagen descargada está limpia." },
    ],
  },
  "password-generator": {
    name: "Generador de contraseñas",
    description: "Crea contraseñas seguras y aleatorias con opciones de longitud y símbolos, gratis y en tu navegador. Nada se sube.",
    keywords: ["generar contraseña", "contraseña segura", "contraseña aleatoria", "generador de contraseñas"],
    answer: "Para generar una contraseña segura, elige la longitud y los tipos de caracteres y cópiala. Se crea en tu navegador con un generador aleatorio criptográfico; nunca se envía a ningún sitio.",
    intro: "Generador de contraseñas crea contraseñas fuertes y aleatorias con la longitud y los caracteres que elijas. Usa la API criptográfica del navegador, así que la contraseña nunca sale de tu dispositivo.",
    steps: ["Elige la longitud y los tipos de caracteres.", "Genera la contraseña.", "Cópiala con un clic."],
    faqs: [
      { q: "¿Son realmente aleatorias?", a: "Sí. Se generan con la API Web Crypto del navegador, no con un aleatorio predecible." },
      { q: "¿Se guarda mi contraseña?", a: "No. Se crea localmente y nunca se envía ni almacena." },
    ],
  },
  "percentage-calculator": {
    name: "Calculadora de porcentajes",
    description: "Calcula porcentajes al instante: X% de Y, qué porcentaje es X de Y, y variación porcentual. Gratis y en tu navegador.",
    keywords: ["calculadora de porcentajes", "calcular porcentaje", "porcentaje de un número", "variación porcentual"],
    answer: "Para calcular un porcentaje, elige el tipo de cálculo, introduce los números y verás el resultado al instante. Todo ocurre en tu navegador.",
    intro: "Calculadora de porcentajes resuelve los cálculos habituales: el X% de un número, qué porcentaje representa un número de otro, y el cambio porcentual entre dos valores. Al instante y en tu navegador.",
    steps: ["Elige el tipo de cálculo.", "Introduce los dos números.", "Lee el resultado al instante."],
    faqs: [
      { q: "¿Puedo calcular la variación porcentual?", a: "Sí, elige el modo «variación %» e introduce el valor inicial y el final." },
      { q: "¿Se guardan mis datos?", a: "No. El cálculo se hace al instante en tu navegador." },
    ],
  },
  "bmi-calculator": {
    name: "Calculadora de IMC",
    description: "Calcula tu índice de masa corporal (IMC) en unidades métricas o imperiales, gratis y en tu navegador. Nada se sube.",
    keywords: ["calculadora de imc", "índice de masa corporal", "calcular imc", "imc peso altura"],
    answer: "Para calcular tu IMC, introduce tu altura y tu peso (métrico o imperial) y verás tu IMC y su categoría. Todo ocurre en tu navegador.",
    intro: "Calculadora de IMC estima tu índice de masa corporal a partir de tu altura y peso, y muestra la categoría correspondiente. Funciona en tu navegador; tus datos no se suben.",
    steps: ["Elige unidades (métrico o imperial).", "Introduce tu altura y peso.", "Consulta tu IMC y su categoría."],
    faqs: [
      { q: "¿Es un diagnóstico médico?", a: "No. El IMC es un indicador general y no sustituye la valoración de un profesional de la salud." },
      { q: "¿Se guardan mis datos?", a: "No. El cálculo se hace al instante en tu navegador." },
    ],
  },
  "gst-calculator": {
    name: "Calculadora de IVA / impuestos",
    description: "Añade o quita IVA o impuestos de un importe con cualquier tasa, gratis y en tu navegador. Al instante, nada se sube.",
    keywords: ["calculadora de iva", "calcular impuesto", "añadir iva", "quitar iva", "gst"],
    answer: "Para calcular el IVA, introduce el importe y la tasa y elige si quieres añadir o quitar el impuesto; verás el neto, el impuesto y el total. Todo ocurre en tu navegador.",
    intro: "Calculadora de IVA/impuestos suma o resta el impuesto de un importe con la tasa que indiques, mostrando el neto, el impuesto y el total. Al instante y en tu navegador.",
    steps: ["Introduce el importe y la tasa.", "Elige añadir o quitar impuesto.", "Consulta el neto, el impuesto y el total."],
    faqs: [
      { q: "¿Puedo quitar el impuesto de un total?", a: "Sí, elige el modo «quitar» para obtener el importe neto a partir del total con impuesto." },
      { q: "¿Se guardan mis datos?", a: "No. El cálculo se hace al instante en tu navegador." },
    ],
  },
  "compress-video": {
    name: "Comprimir vídeo",
    description: "Comprime vídeos MP4 y otros formatos para reducir su tamaño, gratis y en tu navegador. Sin subir nada, sin marca de agua.",
    keywords: ["comprimir video", "comprimir vídeo", "reducir tamaño de video", "hacer video más pequeño", "comprimir mp4"],
    answer: "Para comprimir un vídeo, elige una calidad (y opcionalmente escálalo a 720p) y la herramienta lo recodifica a MP4 H.264 más pequeño. Se ejecuta en tu navegador con ffmpeg.wasm, así que el vídeo nunca se sube.",
    intro: "Comprimir vídeo reduce el tamaño de archivos MP4, MOV, WebM y otros recodificándolos a H.264 eficiente, con una calidad ajustable y una reducción opcional a 720p. Funciona en tu navegador con ffmpeg.wasm, sin subir nada y sin marca de agua. La codificación en el navegador es de un solo hilo, así que los archivos grandes pueden tardar.",
    steps: ["Elige un archivo de vídeo.", "Selecciona una calidad y, si quieres, escálalo a 720p.", "Pulsa Comprimir y descarga el MP4 más pequeño."],
    faqs: [
      { q: "¿Por qué tarda con archivos grandes?", a: "La codificación de vídeo en el navegador es de un solo hilo, así que un vídeo largo o pesado puede tardar. Un clip más corto o una resolución menor es más rápido." },
      { q: "¿Se sube mi vídeo?", a: "No. La compresión ocurre por completo en tu navegador; solo se descarga una vez el motor de vídeo." },
    ],
  },
  "mp4-to-mp3": {
    name: "MP4 a MP3",
    description: "Extrae el audio de un vídeo y guárdalo como MP3, gratis y en tu navegador. Elige la calidad: sin subir nada.",
    keywords: ["mp4 a mp3", "video a mp3", "extraer audio de video", "convertir video a mp3"],
    answer: "Para extraer el audio de un vídeo, cárgalo, elige la calidad del MP3 y descárgalo. Se ejecuta en tu navegador con ffmpeg.wasm, así que el vídeo nunca se sube.",
    intro: "MP4 a MP3 extrae la pista de audio de un vídeo y la guarda como MP3 con la calidad que elijas. Funciona en tu navegador con ffmpeg.wasm; nada se sube.",
    steps: ["Elige un archivo de vídeo.", "Elige la calidad del MP3.", "Extrae y descarga el MP3."],
    faqs: [
      { q: "¿Se sube mi vídeo?", a: "No. La extracción ocurre en tu navegador; solo se descarga una vez el motor." },
      { q: "¿Qué calidad debo elegir?", a: "192 kbps es un buen valor por defecto; 320 kbps da la mejor calidad y 128 kbps el archivo más pequeño." },
    ],
  },
};
