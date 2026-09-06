import { NextRequest, NextResponse } from "next/server";

// ========================================
// MAPEO DE SERVIDORES A LINKS DIRECTOS
// ========================================
const SERVIDORES: Record<string, (id: string) => string> = {
  // vimeos.net
  'vimeos.net': (id) => {
    // Extraer el ID del link de vimeos
    return `https://vimeos.net/embed-${id}.html`;
  },
  // goodstream.one
  'goodstream.one': (id) => {
    return `https://goodstream.one/embed-${id}`;
  },
  // voe.sx
  'voe.sx': (id) => {
    return `https://voe.sx/embed-${id}`;
  },
  // doodstream.com
  'doodstream.com': (id) => {
    return `https://doodstream.com/embed-${id}`;
  },
  // videoapp.zip
  'videoapp.zip': (id) => {
    return `https://videoapp.zip/embed-${id}`;
  },
  // StreamWish
  'streamwish.com': (id) => {
    return `https://streamwish.com/embed-${id}`;
  },
  // Vidhide
  'vidhide.com': (id) => {
    return `https://vidhide.com/embed-${id}`;
  },
  // LuluStream
  'lulustream.com': (id) => {
    return `https://lulustream.com/embed-${id}`;
  },
};

// ========================================
// FUNCIÓN PRINCIPAL
// ========================================
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL requerida" }, { status: 400 });
  }

  try {
    const resultado = await limpiarLink(url);
    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al limpiar el link" }, { status: 500 });
  }
}

// ========================================
// LIMPIAR LINK PRINCIPAL
// ========================================
async function limpiarLink(url: string) {
  try {
    // ========================================
    // PASO 1: IDENTIFICAR EL SERVIDOR
    // ========================================
    const servidor = identificarServidor(url);
    const id = extraerID(url);

    console.log(`🔍 Servidor detectado: ${servidor || 'desconocido'}`);
    console.log(`🔍 ID extraído: ${id || 'no encontrado'}`);

    // ========================================
    // PASO 2: SI ES UN SERVIDOR CONOCIDO, GENERAR LINK LIMPIO
    // ========================================
    if (servidor && id && SERVIDORES[servidor]) {
      const linkLimpio = SERVIDORES[servidor](id);
      console.log(`✅ Link limpio generado: ${linkLimpio}`);
      
      return {
        original: url,
        servidor,
        id,
        link_directo: linkLimpio,
        mensaje: `✅ Link limpio generado para ${servidor}`,
      };
    }

    // ========================================
    // PASO 3: SI NO ES UN SERVIDOR CONOCIDO, INTENTAR SCRAPEAR
    // ========================================
    const scrapedLink = await scrapearLink(url);
    if (scrapedLink) {
      return {
        original: url,
        link_directo: scrapedLink,
        mensaje: "✅ Link extraído del HTML",
      };
    }

    // ========================================
    // PASO 4: SI NADA FUNCIONA, DEVOLVER EL LINK ORIGINAL
    // ========================================
    return {
      original: url,
      link_directo: url,
      mensaje: "⚠️ No se pudo limpiar el link, usando el original",
    };

  } catch (error) {
    console.error("Error al limpiar link:", error);
    return {
      original: url,
      link_directo: null,
      mensaje: "❌ Error al procesar",
    };
  }
}

// ========================================
// FUNCIÓN: IDENTIFICAR SERVIDOR
// ========================================
function identificarServidor(url: string): string | null {
  if (!url) return null;
  const servidores = Object.keys(SERVIDORES);
  for (const servidor of servidores) {
    if (url.includes(servidor)) {
      return servidor;
    }
  }
  return null;
}

// ========================================
// FUNCIÓN: EXTRAER ID DEL LINK
// ========================================
function extraerID(url: string): string | null {
  if (!url) return null;

  // Patrones comunes de IDs en estos servidores
  const patrones = [
    /embed-([a-zA-Z0-9]+)/i,      // embed-8epeo5kvvb7e
    /\/v\/([a-zA-Z0-9]+)/i,       // /v/abc123
    /\/e\/([a-zA-Z0-9]+)/i,       // /e/abc123
    /\/d\/([a-zA-Z0-9]+)/i,       // /d/abc123
    /\/([a-zA-Z0-9]{10,})/i,      // IDs largos
    /id=([a-zA-Z0-9]+)/i,         // id=abc123
    /r=([a-zA-Z0-9]+)/i,          // r=abc123
  ];

  for (const patron of patrones) {
    const match = url.match(patron);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Si no encuentra, intentar con el último segmento de la URL
  const segments = url.split('/');
  const lastSegment = segments[segments.length - 1];
  if (lastSegment && lastSegment.length > 5) {
    const clean = lastSegment.replace(/\.html$/, '').replace(/\.php$/, '');
    if (clean) return clean;
  }

  return null;
}

// ========================================
// FUNCIÓN: SCRAPEAR LINK (FALLBACK)
// ========================================
async function scrapearLink(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    if (!res.ok) return null;

    const html = await res.text();

    // Buscar links de video en el HTML
    const patrones = [
      /<iframe[^>]*src=["']([^"']*)["'][^>]*>/gi,
      /<video[^>]*src=["']([^"']*)["'][^>]*>/gi,
      /<source[^>]*src=["']([^"']*)["'][^>]*>/gi,
      /file\s*:\s*["']([^"']*)["']/gi,
      /url\s*:\s*["']([^"']*)["']/gi,
      /src\s*:\s*["']([^"']*)["']/gi,
    ];

    for (const patron of patrones) {
      const regex = new RegExp(patron, 'gi');
      let match;
      while ((match = regex.exec(html)) !== null) {
        const link = match[1];
        if (link && 
            !link.includes('data:') && 
            !link.includes('javascript:') &&
            !link.includes('google') &&
            !link.includes('facebook') &&
            !link.includes('twitter')) {
          return link;
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error al scrapear:", error);
    return null;
  }
}
