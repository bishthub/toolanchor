"use client";

// ─────────────────────────────────────────────────────────────────────────
// Maps a tool slug → its interactive client component.
// To wire up a new tool: build its component in this folder, then add one
// line to the map below. The slug must match the entry in lib/tools.ts.
// Components are lazy-loaded so each tool's JS only ships on its own page.
// ─────────────────────────────────────────────────────────────────────────

import dynamic from "next/dynamic";

// Props every tool component may receive. Tools that take a file can read
// `initialFiles` to auto-load an attachment handed over by the Tool Assistant.
// `preset` carries pre-configured values (from /tools/<tool>/<preset> pages);
// tools that support presets merge it with URL query params via lib/preset.
export interface ToolProps { initialFiles?: File[]; preset?: Record<string, string> }

const loading = () => <p style={{ color: "var(--muted)" }}>Loading tool…</p>;

const CompressPdf = dynamic(() => import("./CompressPdf"), { loading });
const MergePdf = dynamic(() => import("./MergePdf"), { loading });
const SplitPdf = dynamic(() => import("./SplitPdf"), { loading });
const RotatePdf = dynamic(() => import("./RotatePdf"), { loading });
const JpgToPdf = dynamic(() => import("./JpgToPdf"), { loading });

const ResizeImage = dynamic(() => import("./ResizeImage"), { loading });
const CompressImage = dynamic(() => import("./CompressImage"), { loading });
const CropImage = dynamic(() => import("./CropImage"), { loading });
const ImageConverter = dynamic(() => import("./ImageConverter"), { loading });

const WordCounter = dynamic(() => import("./WordCounter"), { loading });
const CaseConverter = dynamic(() => import("./CaseConverter"), { loading });

const UuidGenerator = dynamic(() => import("./UuidGenerator"), { loading });
const Base64Tool = dynamic(() => import("./Base64Tool"), { loading });
const JsonFormatter = dynamic(() => import("./JsonFormatter"), { loading });

const AgeCalculator = dynamic(() => import("./AgeCalculator"), { loading });
const PercentageCalculator = dynamic(() => import("./PercentageCalculator"), { loading });

// Batch 2
const BmiCalculator = dynamic(() => import("./BmiCalculator"), { loading });
const LoanEmiCalculator = dynamic(() => import("./LoanEmiCalculator"), { loading });
const DateDifferenceCalculator = dynamic(() => import("./DateDifferenceCalculator"), { loading });
const TipCalculator = dynamic(() => import("./TipCalculator"), { loading });
const DiscountCalculator = dynamic(() => import("./DiscountCalculator"), { loading });
const QrCodeGenerator = dynamic(() => import("./QrCodeGenerator"), { loading });
const PasswordGenerator = dynamic(() => import("./PasswordGenerator"), { loading });
const NumberBaseConverter = dynamic(() => import("./NumberBaseConverter"), { loading });
const ColorConverter = dynamic(() => import("./ColorConverter"), { loading });
const UnixTimestampConverter = dynamic(() => import("./UnixTimestampConverter"), { loading });
const LoremIpsumGenerator = dynamic(() => import("./LoremIpsumGenerator"), { loading });
const TextToSpeech = dynamic(() => import("./TextToSpeech"), { loading });

// Batch 3
const SlugGenerator = dynamic(() => import("./SlugGenerator"), { loading });
const RemoveLineBreaks = dynamic(() => import("./RemoveLineBreaks"), { loading });
const FindAndReplace = dynamic(() => import("./FindAndReplace"), { loading });
const ReverseText = dynamic(() => import("./ReverseText"), { loading });
const HashGenerator = dynamic(() => import("./HashGenerator"), { loading });
const JwtDecoder = dynamic(() => import("./JwtDecoder"), { loading });
const UrlEncoder = dynamic(() => import("./UrlEncoder"), { loading });
const HtmlEncoder = dynamic(() => import("./HtmlEncoder"), { loading });
const ImageToBase64 = dynamic(() => import("./ImageToBase64"), { loading });
const FlipImage = dynamic(() => import("./FlipImage"), { loading });
const GpaCalculator = dynamic(() => import("./GpaCalculator"), { loading });
const CompoundInterestCalculator = dynamic(() => import("./CompoundInterestCalculator"), { loading });
const AverageCalculator = dynamic(() => import("./AverageCalculator"), { loading });

// Batch 4
const JsonToCsv = dynamic(() => import("./JsonToCsv"), { loading });
const CsvToJson = dynamic(() => import("./CsvToJson"), { loading });
const TextDiff = dynamic(() => import("./TextDiff"), { loading });
const BinaryTextConverter = dynamic(() => import("./BinaryTextConverter"), { loading });
const RomanNumeralConverter = dynamic(() => import("./RomanNumeralConverter"), { loading });
const RandomNumberGenerator = dynamic(() => import("./RandomNumberGenerator"), { loading });
const WordFrequencyCounter = dynamic(() => import("./WordFrequencyCounter"), { loading });
const SortTextLines = dynamic(() => import("./SortTextLines"), { loading });
const MarkdownPreview = dynamic(() => import("./MarkdownPreview"), { loading });
const GstCalculator = dynamic(() => import("./GstCalculator"), { loading });
const TimeDurationCalculator = dynamic(() => import("./TimeDurationCalculator"), { loading });
const TemperatureConverter = dynamic(() => import("./TemperatureConverter"), { loading });

// Batch 5 — heavier, library-backed (client-only)
const PdfToImages = dynamic(() => import("./PdfToImages"), { loading });
const PdfToText = dynamic(() => import("./PdfToText"), { loading });
const ImageToText = dynamic(() => import("./ImageToText"), { loading });
const BackgroundRemover = dynamic(() => import("./BackgroundRemover"), { loading });

// Batch 6
const FancyTextGenerator = dynamic(() => import("./FancyTextGenerator"), { loading });
const NumberToWords = dynamic(() => import("./NumberToWords"), { loading });
const CaesarCipher = dynamic(() => import("./CaesarCipher"), { loading });
const WhitespaceRemover = dynamic(() => import("./WhitespaceRemover"), { loading });
const RepeatText = dynamic(() => import("./RepeatText"), { loading });
const OnlineNotepad = dynamic(() => import("./OnlineNotepad"), { loading });
const HttpStatusCodes = dynamic(() => import("./HttpStatusCodes"), { loading });
const MimeTypeLookup = dynamic(() => import("./MimeTypeLookup"), { loading });
const CssGradientGenerator = dynamic(() => import("./CssGradientGenerator"), { loading });
const BoxShadowGenerator = dynamic(() => import("./BoxShadowGenerator"), { loading });
const CronExplainer = dynamic(() => import("./CronExplainer"), { loading });
const JsonToYaml = dynamic(() => import("./JsonToYaml"), { loading });
const RegexTester = dynamic(() => import("./RegexTester"), { loading });
const BarcodeGenerator = dynamic(() => import("./BarcodeGenerator"), { loading });
const FaviconGenerator = dynamic(() => import("./FaviconGenerator"), { loading });
const WatermarkImage = dynamic(() => import("./WatermarkImage"), { loading });
const ImageColorPicker = dynamic(() => import("./ImageColorPicker"), { loading });
const MemeGenerator = dynamic(() => import("./MemeGenerator"), { loading });
const AspectRatioCalculator = dynamic(() => import("./AspectRatioCalculator"), { loading });
const CalorieCalculator = dynamic(() => import("./CalorieCalculator"), { loading });
const UnitConverter = dynamic(() => import("./UnitConverter"), { loading });
const AddSubtractDays = dynamic(() => import("./AddSubtractDays"), { loading });
const MarkupCalculator = dynamic(() => import("./MarkupCalculator"), { loading });
const SalaryToHourly = dynamic(() => import("./SalaryToHourly"), { loading });
const DiceRoller = dynamic(() => import("./DiceRoller"), { loading });
const StopwatchTimer = dynamic(() => import("./StopwatchTimer"), { loading });

// Batch 7 — AI & metadata
const AiContentDetector = dynamic(() => import("./AiContentDetector"), { loading });
const AiImageChecker = dynamic(() => import("./AiImageChecker"), { loading });
const ImageMetadataViewer = dynamic(() => import("./ImageMetadataViewer"), { loading });
const ImageMetadataRemover = dynamic(() => import("./ImageMetadataRemover"), { loading });

// Batch 8 — trending additions (2026)
const PdfPageNumbers = dynamic(() => import("./PdfPageNumbers"), { loading });
const WatermarkPdf = dynamic(() => import("./WatermarkPdf"), { loading });
const OrganizePdf = dynamic(() => import("./OrganizePdf"), { loading });
const SipCalculator = dynamic(() => import("./SipCalculator"), { loading });
const FdCalculator = dynamic(() => import("./FdCalculator"), { loading });
const CurlConverter = dynamic(() => import("./CurlConverter"), { loading });
const JsonToTypescript = dynamic(() => import("./JsonToTypescript"), { loading });

// Batch 9 — Video & Audio (ffmpeg.wasm) + photo/signature
const Mp4ToMp3 = dynamic(() => import("./Mp4ToMp3"), { loading });
const VideoToGif = dynamic(() => import("./VideoToGif"), { loading });
const TrimVideo = dynamic(() => import("./TrimVideo"), { loading });
const PassportPhotoMaker = dynamic(() => import("./PassportPhotoMaker"), { loading });

// Batch 10 — media + PDF gaps
const CompressVideo = dynamic(() => import("./CompressVideo"), { loading });
const MuteVideo = dynamic(() => import("./MuteVideo"), { loading });
const AudioConverter = dynamic(() => import("./AudioConverter"), { loading });
const TrimAudio = dynamic(() => import("./TrimAudio"), { loading });
const DeletePdfPages = dynamic(() => import("./DeletePdfPages"), { loading });
const VoiceRecorder = dynamic(() => import("./VoiceRecorder"), { loading });
const ScreenRecorder = dynamic(() => import("./ScreenRecorder"), { loading });
const SignPdf = dynamic(() => import("./SignPdf"), { loading });

// Batch 11 — generators + image (wave 2)
const SvgToPng = dynamic(() => import("./SvgToPng"), { loading });
const ScreenshotBeautifier = dynamic(() => import("./ScreenshotBeautifier"), { loading });
const CollageMaker = dynamic(() => import("./CollageMaker"), { loading });
const CodeToImage = dynamic(() => import("./CodeToImage"), { loading });
const ProtectPdf = dynamic(() => import("./ProtectPdf"), { loading });
const UnlockPdf = dynamic(() => import("./UnlockPdf"), { loading });
const ImageUpscaler = dynamic(() => import("./ImageUpscaler"), { loading });
const EmailSignatureGenerator = dynamic(() => import("./EmailSignatureGenerator"), { loading });
const InvoiceGenerator = dynamic(() => import("./InvoiceGenerator"), { loading });
const SignatureGenerator = dynamic(() => import("./SignatureGenerator"), { loading });

// Image-format landing pages reuse the ImageConverter engine with a preset
// target format (users can still switch). HEIC needs the on-demand decoder.
function HeicToJpg(p: ToolProps) { return <ImageConverter {...p} heic defaultFormat="jpeg" slug="heic-to-jpg" />; }
function WebpToJpg(p: ToolProps) { return <ImageConverter {...p} defaultFormat="jpeg" slug="webp-to-jpg" />; }
function JpgToWebp(p: ToolProps) { return <ImageConverter {...p} defaultFormat="webp" slug="jpg-to-webp" />; }
function PngToWebp(p: ToolProps) { return <ImageConverter {...p} defaultFormat="webp" slug="png-to-webp" />; }
function AvifToJpg(p: ToolProps) { return <ImageConverter {...p} defaultFormat="jpeg" slug="avif-to-jpg" />; }

const REGISTRY: Record<string, React.ComponentType<ToolProps>> = {
  "compress-pdf": CompressPdf,
  "merge-pdf": MergePdf,
  "split-pdf": SplitPdf,
  "rotate-pdf": RotatePdf,
  "jpg-to-pdf": JpgToPdf,
  "resize-image": ResizeImage,
  "compress-image": CompressImage,
  "crop-image": CropImage,
  "jpg-to-png": ImageConverter,
  "word-counter": WordCounter,
  "case-converter": CaseConverter,
  "uuid-generator": UuidGenerator,
  "base64": Base64Tool,
  "json-formatter": JsonFormatter,
  "age-calculator": AgeCalculator,
  "percentage-calculator": PercentageCalculator,
  "bmi-calculator": BmiCalculator,
  "loan-emi-calculator": LoanEmiCalculator,
  "date-difference-calculator": DateDifferenceCalculator,
  "tip-calculator": TipCalculator,
  "discount-calculator": DiscountCalculator,
  "qr-code-generator": QrCodeGenerator,
  "password-generator": PasswordGenerator,
  "number-base-converter": NumberBaseConverter,
  "color-converter": ColorConverter,
  "unix-timestamp-converter": UnixTimestampConverter,
  "lorem-ipsum-generator": LoremIpsumGenerator,
  "text-to-speech": TextToSpeech,
  "slug-generator": SlugGenerator,
  "remove-line-breaks": RemoveLineBreaks,
  "find-and-replace": FindAndReplace,
  "reverse-text": ReverseText,
  "hash-generator": HashGenerator,
  "jwt-decoder": JwtDecoder,
  "url-encoder": UrlEncoder,
  "html-encoder": HtmlEncoder,
  "image-to-base64": ImageToBase64,
  "flip-image": FlipImage,
  "gpa-calculator": GpaCalculator,
  "compound-interest-calculator": CompoundInterestCalculator,
  "average-calculator": AverageCalculator,
  "json-to-csv": JsonToCsv,
  "csv-to-json": CsvToJson,
  "text-diff": TextDiff,
  "binary-text-converter": BinaryTextConverter,
  "roman-numeral-converter": RomanNumeralConverter,
  "random-number-generator": RandomNumberGenerator,
  "word-frequency-counter": WordFrequencyCounter,
  "sort-text-lines": SortTextLines,
  "markdown-preview": MarkdownPreview,
  "gst-calculator": GstCalculator,
  "time-duration-calculator": TimeDurationCalculator,
  "temperature-converter": TemperatureConverter,
  "pdf-to-images": PdfToImages,
  "pdf-to-text": PdfToText,
  "image-to-text": ImageToText,
  "background-remover": BackgroundRemover,
  "fancy-text-generator": FancyTextGenerator,
  "number-to-words": NumberToWords,
  "caesar-cipher": CaesarCipher,
  "whitespace-remover": WhitespaceRemover,
  "repeat-text": RepeatText,
  "online-notepad": OnlineNotepad,
  "http-status-codes": HttpStatusCodes,
  "mime-type-lookup": MimeTypeLookup,
  "css-gradient-generator": CssGradientGenerator,
  "box-shadow-generator": BoxShadowGenerator,
  "cron-explainer": CronExplainer,
  "json-to-yaml": JsonToYaml,
  "regex-tester": RegexTester,
  "barcode-generator": BarcodeGenerator,
  "favicon-generator": FaviconGenerator,
  "watermark-image": WatermarkImage,
  "image-color-picker": ImageColorPicker,
  "meme-generator": MemeGenerator,
  "aspect-ratio-calculator": AspectRatioCalculator,
  "calorie-calculator": CalorieCalculator,
  "unit-converter": UnitConverter,
  "add-subtract-days": AddSubtractDays,
  "markup-calculator": MarkupCalculator,
  "salary-to-hourly": SalaryToHourly,
  "dice-roller": DiceRoller,
  "stopwatch-timer": StopwatchTimer,
  "ai-content-detector": AiContentDetector,
  "ai-image-checker": AiImageChecker,
  "image-metadata-viewer": ImageMetadataViewer,
  "image-metadata-remover": ImageMetadataRemover,
  // Batch 8 — trending additions (2026)
  "heic-to-jpg": HeicToJpg,
  "webp-to-jpg": WebpToJpg,
  "jpg-to-webp": JpgToWebp,
  "png-to-webp": PngToWebp,
  "avif-to-jpg": AvifToJpg,
  "pdf-page-numbers": PdfPageNumbers,
  "watermark-pdf": WatermarkPdf,
  "organize-pdf": OrganizePdf,
  "sip-calculator": SipCalculator,
  "fd-calculator": FdCalculator,
  "curl-converter": CurlConverter,
  "json-to-typescript": JsonToTypescript,
  // Batch 9 — Video & Audio + photo/signature
  "mp4-to-mp3": Mp4ToMp3,
  "video-to-gif": VideoToGif,
  "trim-video": TrimVideo,
  "passport-photo-maker": PassportPhotoMaker,
  "signature-generator": SignatureGenerator,
  "compress-video": CompressVideo,
  "mute-video": MuteVideo,
  "audio-converter": AudioConverter,
  "trim-audio": TrimAudio,
  "delete-pdf-pages": DeletePdfPages,
  "voice-recorder": VoiceRecorder,
  "screen-recorder": ScreenRecorder,
  "sign-pdf": SignPdf,
  "svg-to-png": SvgToPng,
  "screenshot-beautifier": ScreenshotBeautifier,
  "collage-maker": CollageMaker,
  "code-to-image": CodeToImage,
  "email-signature-generator": EmailSignatureGenerator,
  "invoice-generator": InvoiceGenerator,
  "protect-pdf": ProtectPdf,
  "unlock-pdf": UnlockPdf,
  "image-upscaler": ImageUpscaler,
};

export default function ToolRunner({
  slug,
  initialFiles,
  preset,
}: {
  slug: string;
  initialFiles?: File[];
  preset?: Record<string, string>;
}) {
  const Component = REGISTRY[slug];
  if (!Component) {
    return <p style={{ color: "var(--muted)" }}>This tool is coming soon.</p>;
  }
  return <Component initialFiles={initialFiles} preset={preset} />;
}
