export type Pelicula = {
  id: string;
  titulo: string;
  anio: number;
  genero: string;
  sinopsis: string;
  caratula: string;
  link_directo: string;
  fuente: "manual" | "auto";
  destacada?: boolean;
  creado_en: string;
};

export type Favorito = {
  id: string;
  usuario_id: string;
  pelicula_id: string;
  creado_en: string;
};

export type Historial = {
  id: string;
  usuario_id: string;
  pelicula_id: string;
  visto_en: string;
};

export const CARATULA_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%23222222'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='20' fill='%23808080' text-anchor='middle' dy='.3em'%3ESin imagen%3C/text%3E%3C/svg%3E";
