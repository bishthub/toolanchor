import type { Category, CategoryId } from "@/lib/tools";

// Brazilian Portuguese category prose (machine-translated, pending human
// spot-check). Only translatable fields are overridden; structure comes from
// lib/tools.ts.
export const PT_CATEGORIES: Partial<Record<CategoryId, Partial<Category>>> = {
  pdf: {
    name: "Ferramentas PDF",
    blurb: "Junte, divida, gire e converta PDFs — no seu navegador, sem enviar arquivos.",
    intro:
      "Estas ferramentas PDF resolvem as tarefas do dia a dia com documentos: juntar arquivos, extrair páginas, corrigir a orientação, reduzir o tamanho e converter de e para imagens e texto. Ao contrário da maioria dos serviços online de PDF, tudo roda localmente no seu navegador, então seus documentos nunca são enviados a um servidor. Isso as torna rápidas e seguras para arquivos sensíveis como contratos e extratos.",
    faqs: [
      { q: "Meus PDFs são enviados a um servidor?", a: "Não. Cada ferramenta PDF processa o arquivo inteiramente no seu navegador — o documento nunca sai do seu dispositivo." },
      { q: "Existe limite de tamanho ou de uso diário?", a: "Não há limites artificiais: você depende apenas da memória disponível do seu dispositivo." },
      { q: "Preciso instalar algo ou criar conta?", a: "Não. As ferramentas funcionam em qualquer navegador moderno, sem instalação e sem cadastro." },
    ],
  },
  image: {
    name: "Ferramentas de imagem",
    blurb: "Redimensione, recorte, comprima e converta imagens. Nada sai do seu dispositivo.",
    intro:
      "De redimensionar e recortar a remover fundo, comprimir, converter formatos e apagar metadados, estas ferramentas cobrem as tarefas mais comuns com fotos. Comprimir, converter, redimensionar e limpar metadados aceitam vários arquivos de uma vez. Usam a API Canvas do navegador e, para remover o fundo, um modelo de IA que roda no seu dispositivo via WebAssembly — suas imagens são processadas localmente, em resolução total e sem marca d'água.",
    faqs: [
      { q: "Minhas imagens são enviadas?", a: "Não. Todo o processamento acontece no seu navegador; as imagens nunca saem do seu dispositivo." },
      { q: "Tem marca d'água ou limites?", a: "Não. Sem marca d'água, sem limites artificiais e em resolução completa." },
    ],
  },
  media: {
    name: "Ferramentas de áudio e vídeo",
    blurb: "Comprima, converta e corte vídeo e áudio, direto no seu navegador.",
    faqs: [
      { q: "Meus vídeos são enviados?", a: "Não — o processamento usa FFmpeg compilado para WebAssembly e roda localmente no navegador." },
      { q: "Por que a primeira execução demora mais?", a: "O motor FFmpeg (~32 MB) é baixado uma única vez no primeiro uso e depois fica em cache." },
    ],
  },
  text: {
    name: "Ferramentas de texto",
    blurb: "Conte, converta, limpe e analise texto — instantâneo e privado.",
    faqs: [
      { q: "Meu texto é enviado a algum servidor?", a: "Não — toda a análise e conversão acontece no seu navegador." },
      { q: "Existe limite de tamanho?", a: "Não. Textos longos funcionam normalmente, limitados apenas pela memória do dispositivo." },
    ],
  },
  developer: {
    name: "Ferramentas para desenvolvedores",
    blurb: "Formate, converta, decodifique e teste — JSON, regex, JWT e mais.",
    faqs: [
      { q: "Meu código ou dados são enviados?", a: "Não — formatação, conversão e decodificação rodam inteiramente no navegador, seguro até para dados com tokens." },
    ],
  },
  calculator: {
    name: "Calculadoras",
    blurb: "Porcentagem, juros, datas, saúde e finanças — respostas na hora.",
    faqs: [
      { q: "Os cálculos são precisos?", a: "As calculadoras usam as fórmulas padrão de cada área (juros compostos, IMC, datas). Para decisões financeiras ou de saúde importantes, confirme com um profissional." },
      { q: "Meus dados são salvos?", a: "Não — os cálculos rodam no navegador e nada é enviado ou armazenado." },
    ],
  },
};
