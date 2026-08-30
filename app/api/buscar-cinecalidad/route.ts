import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

export async function GET(req: NextRequest) {
  const nombre = req.nextUrl.searchParams.get("nombre");

  if (!nombre) {
    return NextResponse.json({ error: "Nombre de película requerido" }, { status: 400 });
  }

  try {
    // Buscar en Cinecalidad
    const searchUrl = `https://cinecalidad.gg/?s=${encodeURIComponent(nombre)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // Buscar el primer resultado
    const primeraPelicula = $(".movie-item").first();

    if (!primeraPelicula.length) {
      return NextResponse.json({ error: "No se encontró la película" }, { status: 404 });
    }

    const titulo = primeraPelicula.find(".movie-title").text().trim();
    const anio = primeraPelicula.find(".movie-year").text().trim();
    const genero = primeraPelicula.find(".movie-genre").text().trim();
    const sinopsis = primeraPelicula.find(".movie-synopsis").text().trim();
    const caratula = primeraPelicula.find("img").attr("src") || "";
    const link = primeraPelicula.find("a").attr("href") || "";

    if (!titulo) {
      return NextResponse.json({ error: "No se encontró la película" }, { status: 404 });
    }

    // Link directo (sin anuncios) - intentar obtener el link de descarga directa
    let linkDirecto = "";
    if (link) {
      try {
        const detailRes = await axios.get(`https://cinecalidad.gg${link}`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          },
          timeout: 10000,
        });
        const detail$ = cheerio.load(detailRes.data);

        // Buscar link de descarga directa (sin anuncios)
        const downloadLink = detail$(".download-link a, .btn-download a, .player a").first();
        if (downloadLink.length) {
          linkDirecto = downloadLink.attr("href") || "";
        }

        // Si no hay link directo, usar el link de la página de detalle
        if (!linkDirecto) {
          linkDirecto = `https://cinecalidad.gg${link}`;
        }
      } catch (err) {
        // Si falla, usar el link de la página
        linkDirecto = `https://cinecalidad.gg${link}`;
      }
    }

    const pelicula = {
      titulo,
      anio,
      genero,
      sinopsis,
      caratula,
      link_directo: linkDirecto,
      fuente: "cinecalidad",
    };

    return NextResponse.json({ pelicula });

  } catch (error) {
    console.error("Error al buscar:", error);
    return NextResponse.json({ error: "Error al buscar la película" }, { status: 500 });
  }
}
