#!/usr/bin/env bash
# Completa los perfiles de los 10 artistas seed creados en K8s.
# Agrega avatar, coverPhoto, telefono, portfolio, certificaciones y disponibilidad.
#
# Uso:
#   bash scripts/seed-complete-profiles.sh
#   GATEWAY=http://localhost bash scripts/seed-complete-profiles.sh
set -euo pipefail

GATEWAY="${GATEWAY:-https://backend.piums.io}"
AUTH_URL="$GATEWAY/api"
ARTISTS_URL="$GATEWAY/api"
PASS="Seed1234!"

# Artistas seed — email|artist_id
ARTISTS=(
  "seed_artist01@piums.com|435c1194-7899-4f7c-a36d-abfde97005d4"
  "seed_artist02@piums.com|2ae08f8a-40bd-4822-8f4b-d6c3787a94e3"
  "seed_artist03@piums.com|6b8dea1e-48f5-44d7-bb75-d64e09b20482"
  "seed_artist04@piums.com|7378ecb2-61de-4672-9ebd-77f639946679"
  "seed_artist05@piums.com|ce0a6560-84d0-41aa-a8a2-0d0cda55bb08"
  "seed_artist06@piums.com|002e5f4c-81e0-467f-8337-a4b089c6a7f6"
  "seed_artist07@piums.com|bf051e68-b459-4965-a4ef-9aaad1bf911a"
  "seed_artist08@piums.com|93669e74-344c-49da-aa1c-a309f3d721c2"
  "seed_artist09@piums.com|412cd169-b165-4faf-a410-dcec3c721aba"
  "seed_artist10@piums.com|ac646a7e-a09b-4deb-b4f1-463f8deb0dd9"
)

login() {
  local email="$1"
  local res
  res=$(curl -sf -X POST "$AUTH_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$PASS\"}" 2>/dev/null)
  echo "$res" | jq -r '.token // .data.token // empty'
}

put_profile() {
  local token="$1" id="$2" payload="$3"
  local res
  res=$(curl -sf -X PUT "$ARTISTS_URL/artists/$id" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $token" \
    -d "$payload" 2>/dev/null)
  echo "$res" | jq -r '.id // "ok"'
}

add_portfolio() {
  local token="$1" id="$2" payload="$3"
  curl -sf -X POST "$ARTISTS_URL/artists/$id/portfolio" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $token" \
    -d "$payload" -o /dev/null 2>/dev/null && echo "ok" || echo "err"
}

add_cert() {
  local token="$1" id="$2" payload="$3"
  curl -sf -X POST "$ARTISTS_URL/artists/$id/certifications" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $token" \
    -d "$payload" -o /dev/null 2>/dev/null && echo "ok" || echo "err"
}

set_availability() {
  local token="$1" id="$2" payload="$3"
  curl -sf -X PUT "$ARTISTS_URL/artists/$id/availability" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $token" \
    -d "$payload" -o /dev/null 2>/dev/null && echo "ok" || echo "err"
}

# Disponibilidad: días de lunes-viernes 09:00-20:00
AVAIL_LUNES_VIERNES='[
  {"dayOfWeek":"LUNES",   "startTime":"09:00","endTime":"20:00"},
  {"dayOfWeek":"MARTES",  "startTime":"09:00","endTime":"20:00"},
  {"dayOfWeek":"MIERCOLES","startTime":"09:00","endTime":"20:00"},
  {"dayOfWeek":"JUEVES",  "startTime":"09:00","endTime":"20:00"},
  {"dayOfWeek":"VIERNES", "startTime":"09:00","endTime":"21:00"}
]'

# Disponibilidad: fines de semana 08:00-22:00
AVAIL_FINDE='[
  {"dayOfWeek":"VIERNES", "startTime":"14:00","endTime":"23:00"},
  {"dayOfWeek":"SABADO",  "startTime":"08:00","endTime":"23:00"},
  {"dayOfWeek":"DOMINGO", "startTime":"08:00","endTime":"22:00"}
]'

# Disponibilidad full (aplica para animadores/creadores)
AVAIL_FULL='[
  {"dayOfWeek":"LUNES",    "startTime":"09:00","endTime":"21:00"},
  {"dayOfWeek":"MARTES",   "startTime":"09:00","endTime":"21:00"},
  {"dayOfWeek":"MIERCOLES","startTime":"09:00","endTime":"21:00"},
  {"dayOfWeek":"JUEVES",   "startTime":"09:00","endTime":"21:00"},
  {"dayOfWeek":"VIERNES",  "startTime":"09:00","endTime":"22:00"},
  {"dayOfWeek":"SABADO",   "startTime":"08:00","endTime":"23:00"},
  {"dayOfWeek":"DOMINGO",  "startTime":"08:00","endTime":"20:00"}
]'

echo "Completando perfiles de 10 artistas seed en $GATEWAY"
echo "======================================================"

# ─── 01 Luis Méndez Band (MUSICO) ───────────────────────────────────────────
idx=0
email="${ARTISTS[$idx]%%|*}"
id="${ARTISTS[$idx]##*|}"
echo ""
echo "[01] Luis Méndez Band ($id)"
TOKEN=$(login "$email")
put_profile "$TOKEN" "$id" '{
  "avatar":     "https://picsum.photos/seed/lmband1/400/400",
  "coverPhoto": "https://picsum.photos/seed/lmband2/1200/400",
  "telefono":   "+502 5512-3401",
  "website":    "https://luismendezband.com"
}' > /dev/null
echo "  perfil base OK"

add_portfolio "$TOKEN" "$id" '{
  "title":        "Concierto Xela 2024",
  "description":  "Presentación en vivo en el Teatro Municipal de Quetzaltenango.",
  "type":         "image",
  "url":          "https://picsum.photos/seed/lm11/800/600",
  "thumbnailUrl": "https://picsum.photos/seed/lm11/400/300",
  "category":     "Concierto",
  "tags":         ["banda","en vivo","Guatemala"],
  "isFeatured":   true,
  "order":        0
}' > /dev/null

add_portfolio "$TOKEN" "$id" '{
  "title":        "Boda en Antigua",
  "description":  "Música en vivo para ceremonia y recepción.",
  "type":         "image",
  "url":          "https://picsum.photos/seed/lm12/800/600",
  "thumbnailUrl": "https://picsum.photos/seed/lm12/400/300",
  "category":     "Boda",
  "tags":         ["boda","ceremonia","Antigua"],
  "isFeatured":   true,
  "order":        1
}' > /dev/null

add_portfolio "$TOKEN" "$id" '{
  "title":        "Festival Independencia",
  "description":  "Participación en festival nacional de música guatemalteca.",
  "type":         "image",
  "url":          "https://picsum.photos/seed/lm13/800/600",
  "thumbnailUrl": "https://picsum.photos/seed/lm13/400/300",
  "category":     "Festival",
  "tags":         ["festival","independencia"],
  "isFeatured":   false,
  "order":        2
}' > /dev/null
echo "  portfolio OK"

add_cert "$TOKEN" "$id" '{"title":"Músico Profesional Certificado","issuer":"Conservatorio Nacional de Música de Guatemala","description":"Certificación en teoría y práctica musical avanzada.","issuedAt":"2019-06-15T00:00:00Z"}' > /dev/null
add_cert "$TOKEN" "$id" '{"title":"Producción Musical Digital","issuer":"Berklee Online","description":"Curso de producción y mezcla de audio profesional.","issuedAt":"2022-03-01T00:00:00Z"}' > /dev/null
echo "  certificaciones OK"

set_availability "$TOKEN" "$id" "$AVAIL_FULL" > /dev/null
echo "  disponibilidad OK"

# ─── 02 Rena Violin (MUSICO) ─────────────────────────────────────────────────
idx=1
email="${ARTISTS[$idx]%%|*}"
id="${ARTISTS[$idx]##*|}"
echo ""
echo "[02] Rena Violin ($id)"
TOKEN=$(login "$email")
put_profile "$TOKEN" "$id" '{
  "avatar":     "https://picsum.photos/seed/renavl1/400/400",
  "coverPhoto": "https://picsum.photos/seed/renavl2/1200/400",
  "telefono":   "+502 4423-7802"
}' > /dev/null
echo "  perfil base OK"

add_portfolio "$TOKEN" "$id" '{
  "title":        "Recital Clásico 2023",
  "description":  "Violín solista en concierto de música clásica europea.",
  "type":         "image",
  "url":          "https://picsum.photos/seed/rv11/800/600",
  "thumbnailUrl": "https://picsum.photos/seed/rv11/400/300",
  "category":     "Recital",
  "tags":         ["violín","clásico","solista"],
  "isFeatured":   true,
  "order":        0
}' > /dev/null

add_portfolio "$TOKEN" "$id" '{
  "title":        "Ceremonia Bodas Nueve Años",
  "description":  "Interpretación de piezas románticas para ceremonia religiosa.",
  "type":         "image",
  "url":          "https://picsum.photos/seed/rv12/800/600",
  "thumbnailUrl": "https://picsum.photos/seed/rv12/400/300",
  "category":     "Boda",
  "tags":         ["boda","violín","romántico"],
  "isFeatured":   true,
  "order":        1
}' > /dev/null
echo "  portfolio OK"

add_cert "$TOKEN" "$id" '{"title":"Licenciatura en Instrumento — Violín","issuer":"Universidad del Valle de Guatemala","description":"Graduada con distinción en interpretación de violín clásico.","issuedAt":"2018-11-20T00:00:00Z"}' > /dev/null
add_cert "$TOKEN" "$id" '{"title":"Curso Internacional de Música de Cámara","issuer":"Academia Superior de Música de Viena","description":"Programa intensivo de verano en música de cámara.","issuedAt":"2021-08-10T00:00:00Z"}' > /dev/null
echo "  certificaciones OK"

set_availability "$TOKEN" "$id" "$AVAIL_LUNES_VIERNES" > /dev/null
echo "  disponibilidad OK"

# ─── 03 Rob Photography (FOTOGRAFO) ─────────────────────────────────────────
idx=2
email="${ARTISTS[$idx]%%|*}"
id="${ARTISTS[$idx]##*|}"
echo ""
echo "[03] Rob Photography ($id)"
TOKEN=$(login "$email")
put_profile "$TOKEN" "$id" '{
  "avatar":     "https://picsum.photos/seed/robpho1/400/400",
  "coverPhoto": "https://picsum.photos/seed/robpho2/1200/400",
  "telefono":   "+502 3301-5503",
  "instagram":  "@robphotography.gt"
}' > /dev/null
echo "  perfil base OK"

add_portfolio "$TOKEN" "$id" '{
  "title":        "Sesión Quinceañera Rosa",
  "description":  "Fotografía artística para quinceañera con locaciones en Antigua Guatemala.",
  "type":         "image",
  "url":          "https://picsum.photos/seed/rp11/800/600",
  "thumbnailUrl": "https://picsum.photos/seed/rp11/400/300",
  "category":     "Quinceañera",
  "tags":         ["quinceañera","Antigua","editorial"],
  "isFeatured":   true,
  "order":        0
}' > /dev/null

add_portfolio "$TOKEN" "$id" '{
  "title":        "Boda Lago Atitlán",
  "description":  "Cobertura completa de boda frente al lago, desde el amanecer hasta la recepción.",
  "type":         "image",
  "url":          "https://picsum.photos/seed/rp12/800/600",
  "thumbnailUrl": "https://picsum.photos/seed/rp12/400/300",
  "category":     "Boda",
  "tags":         ["boda","Atitlán","lago"],
  "isFeatured":   true,
  "order":        1
}' > /dev/null

add_portfolio "$TOKEN" "$id" '{
  "title":        "Fotografía Comercial Restaurante",
  "description":  "Sesión de fotografía de gastronomía y ambiente para cadena de restaurantes.",
  "type":         "image",
  "url":          "https://picsum.photos/seed/rp13/800/600",
  "thumbnailUrl": "https://picsum.photos/seed/rp13/400/300",
  "category":     "Comercial",
  "tags":         ["comercial","gastronomía","producto"],
  "isFeatured":   false,
  "order":        2
}' > /dev/null
echo "  portfolio OK"

add_cert "$TOKEN" "$id" '{"title":"Fotógrafo Certificado — Adobe","issuer":"Adobe Systems","description":"Certificación oficial en Adobe Lightroom y Photoshop para fotografía profesional.","issuedAt":"2020-05-01T00:00:00Z"}' > /dev/null
add_cert "$TOKEN" "$id" '{"title":"Fotografía de Bodas Profesional","issuer":"Wedding Photojournalist Association","description":"Miembro certificado WPJA con formación en fotoperiodismo de bodas.","issuedAt":"2023-02-14T00:00:00Z"}' > /dev/null
echo "  certificaciones OK"

set_availability "$TOKEN" "$id" "$AVAIL_FINDE" > /dev/null
echo "  disponibilidad OK"

# ─── 04 Sofía Ruiz Foto (FOTOGRAFO) ──────────────────────────────────────────
idx=3
email="${ARTISTS[$idx]%%|*}"
id="${ARTISTS[$idx]##*|}"
echo ""
echo "[04] Sofía Ruiz Foto ($id)"
TOKEN=$(login "$email")
put_profile "$TOKEN" "$id" '{
  "avatar":     "https://picsum.photos/seed/sofru1/400/400",
  "coverPhoto": "https://picsum.photos/seed/sofru2/1200/400",
  "telefono":   "+502 5687-9904"
}' > /dev/null
echo "  perfil base OK"

add_portfolio "$TOKEN" "$id" '{
  "title":        "Retrato Newborn",
  "description":  "Sesión de fotografía newborn en estudio con props y luz natural.",
  "type":         "image",
  "url":          "https://picsum.photos/seed/sf11/800/600",
  "thumbnailUrl": "https://picsum.photos/seed/sf11/400/300",
  "category":     "Familia",
  "tags":         ["newborn","bebé","estudio"],
  "isFeatured":   true,
  "order":        0
}' > /dev/null

add_portfolio "$TOKEN" "$id" '{
  "title":        "Editorial Moda Guatemala",
  "description":  "Campaña editorial para diseñadora local guatemalteca — colección primavera.",
  "type":         "image",
  "url":          "https://picsum.photos/seed/sf12/800/600",
  "thumbnailUrl": "https://picsum.photos/seed/sf12/400/300",
  "category":     "Moda",
  "tags":         ["moda","editorial","diseño"],
  "isFeatured":   true,
  "order":        1
}' > /dev/null
echo "  portfolio OK"

add_cert "$TOKEN" "$id" '{"title":"Certificación en Fotografía Digital","issuer":"New York Institute of Photography","description":"Programa completo de fotografía profesional digital.","issuedAt":"2021-09-01T00:00:00Z"}' > /dev/null
echo "  certificaciones OK"

set_availability "$TOKEN" "$id" "$AVAIL_FINDE" > /dev/null
echo "  disponibilidad OK"

# ─── 05 Andrea Lima Films (VIDEOGRAFO) ───────────────────────────────────────
idx=4
email="${ARTISTS[$idx]%%|*}"
id="${ARTISTS[$idx]##*|}"
echo ""
echo "[05] Andrea Lima Films ($id)"
TOKEN=$(login "$email")
put_profile "$TOKEN" "$id" '{
  "avatar":     "https://picsum.photos/seed/anlima1/400/400",
  "coverPhoto": "https://picsum.photos/seed/anlima2/1200/400",
  "telefono":   "+502 3345-6605",
  "website":    "https://andrealima.films"
}' > /dev/null
echo "  perfil base OK"

add_portfolio "$TOKEN" "$id" '{
  "title":        "Trailer Boda Civil Antigua",
  "description":  "Video cinematográfico de 3 minutos de boda íntima en Antigua Guatemala.",
  "type":         "video",
  "url":          "https://picsum.photos/seed/al11/800/450",
  "thumbnailUrl": "https://picsum.photos/seed/al11t/400/225",
  "category":     "Boda",
  "tags":         ["boda","cinematic","Antigua"],
  "isFeatured":   true,
  "order":        0
}' > /dev/null

add_portfolio "$TOKEN" "$id" '{
  "title":        "Documental Empresa Familiar",
  "description":  "Mini-documental de 8 minutos sobre empresa familiar guatemalteca de 3 generaciones.",
  "type":         "video",
  "url":          "https://picsum.photos/seed/al12/800/450",
  "thumbnailUrl": "https://picsum.photos/seed/al12t/400/225",
  "category":     "Corporativo",
  "tags":         ["corporativo","documental","empresa"],
  "isFeatured":   true,
  "order":        1
}' > /dev/null

add_portfolio "$TOKEN" "$id" '{
  "title":        "Teaser XV Años Valéria",
  "description":  "Video artístico para quinceañera con drones y steady-cam.",
  "type":         "video",
  "url":          "https://picsum.photos/seed/al13/800/450",
  "thumbnailUrl": "https://picsum.photos/seed/al13t/400/225",
  "category":     "Quinceañera",
  "tags":         ["quinceañera","drone","artístico"],
  "isFeatured":   false,
  "order":        2
}' > /dev/null
echo "  portfolio OK"

add_cert "$TOKEN" "$id" '{"title":"Certificación DJI — Drone Operator","issuer":"DJI Enterprise","description":"Operación certificada de drones para producción audiovisual.","issuedAt":"2022-04-20T00:00:00Z"}' > /dev/null
add_cert "$TOKEN" "$id" '{"title":"Producción Audiovisual Profesional","issuer":"Full Sail University Online","description":"Especialización en producción y postproducción de video.","issuedAt":"2020-12-01T00:00:00Z"}' > /dev/null
echo "  certificaciones OK"

set_availability "$TOKEN" "$id" "$AVAIL_FINDE" > /dev/null
echo "  disponibilidad OK"

# ─── 06 Diego Campos Cine (VIDEOGRAFO) ───────────────────────────────────────
idx=5
email="${ARTISTS[$idx]%%|*}"
id="${ARTISTS[$idx]##*|}"
echo ""
echo "[06] Diego Campos Cine ($id)"
TOKEN=$(login "$email")
put_profile "$TOKEN" "$id" '{
  "avatar":     "https://picsum.photos/seed/dcam1/400/400",
  "coverPhoto": "https://picsum.photos/seed/dcam2/1200/400",
  "telefono":   "+502 4478-2206"
}' > /dev/null
echo "  perfil base OK"

add_portfolio "$TOKEN" "$id" '{
  "title":        "Spot Publicitario Cerveza Local",
  "description":  "Producción completa de spot de 30 segundos para marca guatemalteca.",
  "type":         "video",
  "url":          "https://picsum.photos/seed/dc11/800/450",
  "thumbnailUrl": "https://picsum.photos/seed/dc11t/400/225",
  "category":     "Publicidad",
  "tags":         ["publicidad","spot","marca"],
  "isFeatured":   true,
  "order":        0
}' > /dev/null

add_portfolio "$TOKEN" "$id" '{
  "title":        "Cortometraje Doblada",
  "description":  "Cortometraje ganador en Festival de Cine Guatemala 2023.",
  "type":         "video",
  "url":          "https://picsum.photos/seed/dc12/800/450",
  "thumbnailUrl": "https://picsum.photos/seed/dc12t/400/225",
  "category":     "Ficción",
  "tags":         ["cortometraje","festival","ficción"],
  "isFeatured":   true,
  "order":        1
}' > /dev/null
echo "  portfolio OK"

add_cert "$TOKEN" "$id" '{"title":"Dirección Cinematográfica","issuer":"Centro de Formación Cinematográfica — México","description":"Programa de dirección y fotografía cinematográfica.","issuedAt":"2019-07-15T00:00:00Z"}' > /dev/null
echo "  certificaciones OK"

set_availability "$TOKEN" "$id" "$AVAIL_LUNES_VIERNES" > /dev/null
echo "  disponibilidad OK"

# ─── 07 Carlos Vega MC (ANIMADOR) ────────────────────────────────────────────
idx=6
email="${ARTISTS[$idx]%%|*}"
id="${ARTISTS[$idx]##*|}"
echo ""
echo "[07] Carlos Vega MC ($id)"
TOKEN=$(login "$email")
put_profile "$TOKEN" "$id" '{
  "avatar":     "https://picsum.photos/seed/cvmc1/400/400",
  "coverPhoto": "https://picsum.photos/seed/cvmc2/1200/400",
  "telefono":   "+502 5590-1107",
  "instagram":  "@carlosvegamc"
}' > /dev/null
echo "  perfil base OK"

add_portfolio "$TOKEN" "$id" '{
  "title":        "Boda 300 personas — Salón Real",
  "description":  "Animación y MC para boda de gran formato con juegos, sorteos y pista de baile.",
  "type":         "image",
  "url":          "https://picsum.photos/seed/cv11/800/600",
  "thumbnailUrl": "https://picsum.photos/seed/cv11/400/300",
  "category":     "Boda",
  "tags":         ["boda","MC","animación","gran formato"],
  "isFeatured":   true,
  "order":        0
}' > /dev/null

add_portfolio "$TOKEN" "$id" '{
  "title":        "Fiesta Empresarial Fin de Año",
  "description":  "Conducción de evento corporativo con dinámica de integración y premiaciones.",
  "type":         "image",
  "url":          "https://picsum.photos/seed/cv12/800/600",
  "thumbnailUrl": "https://picsum.photos/seed/cv12/400/300",
  "category":     "Corporativo",
  "tags":         ["corporativo","empresa","fin de año"],
  "isFeatured":   true,
  "order":        1
}' > /dev/null

add_portfolio "$TOKEN" "$id" '{
  "title":        "Festival Infantil Municipalidad",
  "description":  "Animación de festival público con 500+ niños, juegos y shows.",
  "type":         "image",
  "url":          "https://picsum.photos/seed/cv13/800/600",
  "thumbnailUrl": "https://picsum.photos/seed/cv13/400/300",
  "category":     "Infantil",
  "tags":         ["infantil","festival","comunidad"],
  "isFeatured":   false,
  "order":        2
}' > /dev/null
echo "  portfolio OK"

add_cert "$TOKEN" "$id" '{"title":"Animador y Conductor de Eventos Certificado","issuer":"Escuela Internacional de Eventos — Colombia","description":"Formación profesional en conducción y animación de eventos sociales y corporativos.","issuedAt":"2020-08-01T00:00:00Z"}' > /dev/null
echo "  certificaciones OK"

set_availability "$TOKEN" "$id" "$AVAIL_FULL" > /dev/null
echo "  disponibilidad OK"

# ─── 08 Paola Shows (ANIMADOR) ───────────────────────────────────────────────
idx=7
email="${ARTISTS[$idx]%%|*}"
id="${ARTISTS[$idx]##*|}"
echo ""
echo "[08] Paola Shows ($id)"
TOKEN=$(login "$email")
put_profile "$TOKEN" "$id" '{
  "avatar":     "https://picsum.photos/seed/paosh1/400/400",
  "coverPhoto": "https://picsum.photos/seed/paosh2/1200/400",
  "telefono":   "+502 4412-8808"
}' > /dev/null
echo "  perfil base OK"

add_portfolio "$TOKEN" "$id" '{
  "title":        "Show Magia Infantil",
  "description":  "Espectáculo de magia y globoflexia para fiesta de cumpleaños temática.",
  "type":         "image",
  "url":          "https://picsum.photos/seed/ps11/800/600",
  "thumbnailUrl": "https://picsum.photos/seed/ps11/400/300",
  "category":     "Infantil",
  "tags":         ["magia","niños","cumpleaños"],
  "isFeatured":   true,
  "order":        0
}' > /dev/null

add_portfolio "$TOKEN" "$id" '{
  "title":        "Animación Quince Años",
  "description":  "Conducción de quinceañero con juegos interactivos y dinamización de pista.",
  "type":         "image",
  "url":          "https://picsum.photos/seed/ps12/800/600",
  "thumbnailUrl": "https://picsum.photos/seed/ps12/400/300",
  "category":     "Quinceañera",
  "tags":         ["quinceañera","animación","baile"],
  "isFeatured":   true,
  "order":        1
}' > /dev/null
echo "  portfolio OK"

add_cert "$TOKEN" "$id" '{"title":"Animadora Sociocultural","issuer":"Universidad Mariano Gálvez de Guatemala","description":"Técnico en animación sociocultural y recreación.","issuedAt":"2022-06-01T00:00:00Z"}' > /dev/null
echo "  certificaciones OK"

set_availability "$TOKEN" "$id" "$AVAIL_FINDE" > /dev/null
echo "  disponibilidad OK"

# ─── 09 Mariana Creates (CREADOR_CONTENIDO) ──────────────────────────────────
idx=8
email="${ARTISTS[$idx]%%|*}"
id="${ARTISTS[$idx]##*|}"
echo ""
echo "[09] Mariana Creates ($id)"
TOKEN=$(login "$email")
put_profile "$TOKEN" "$id" '{
  "avatar":     "https://picsum.photos/seed/mrcre1/400/400",
  "coverPhoto": "https://picsum.photos/seed/mrcre2/1200/400",
  "telefono":   "+502 5534-7709",
  "instagram":  "@marianacreates"
}' > /dev/null
echo "  perfil base OK"

add_portfolio "$TOKEN" "$id" '{
  "title":        "Campaña Restaurante Orgánico",
  "description":  "Contenido para Instagram y TikTok — 12 posts + 6 reels para restaurante vegano.",
  "type":         "image",
  "url":          "https://picsum.photos/seed/mc11/800/600",
  "thumbnailUrl": "https://picsum.photos/seed/mc11/400/300",
  "category":     "Gastronomía",
  "tags":         ["instagram","reels","gastronomía","orgánico"],
  "isFeatured":   true,
  "order":        0
}' > /dev/null

add_portfolio "$TOKEN" "$id" '{
  "title":        "Lanzamiento Producto Skincare",
  "description":  "Unboxing y review en video formato corto para marca de skincare guatemalteca.",
  "type":         "video",
  "url":          "https://picsum.photos/seed/mc12/800/450",
  "thumbnailUrl": "https://picsum.photos/seed/mc12t/400/225",
  "category":     "Belleza",
  "tags":         ["skincare","unboxing","tiktok","producto"],
  "isFeatured":   true,
  "order":        1
}' > /dev/null

add_portfolio "$TOKEN" "$id" '{
  "title":        "Serie Viajando por Guatemala",
  "description":  "Serie de 8 reels mostrando destinos turísticos guatemaltecos para agencia de viajes.",
  "type":         "video",
  "url":          "https://picsum.photos/seed/mc13/800/450",
  "thumbnailUrl": "https://picsum.photos/seed/mc13t/400/225",
  "category":     "Turismo",
  "tags":         ["turismo","reels","Guatemala","viaje"],
  "isFeatured":   false,
  "order":        2
}' > /dev/null
echo "  portfolio OK"

add_cert "$TOKEN" "$id" '{"title":"Meta Certified Digital Marketing Associate","issuer":"Meta","description":"Certificación oficial Meta en marketing digital y manejo de anuncios.","issuedAt":"2023-01-15T00:00:00Z"}' > /dev/null
add_cert "$TOKEN" "$id" '{"title":"Content Creator Certification","issuer":"HubSpot Academy","description":"Certificación en estrategia de contenido y growth.","issuedAt":"2022-10-05T00:00:00Z"}' > /dev/null
echo "  certificaciones OK"

set_availability "$TOKEN" "$id" "$AVAIL_LUNES_VIERNES" > /dev/null
echo "  disponibilidad OK"

# ─── 10 Javier Tech Creator (CREADOR_CONTENIDO) ──────────────────────────────
idx=9
email="${ARTISTS[$idx]%%|*}"
id="${ARTISTS[$idx]##*|}"
echo ""
echo "[10] Javier Tech Creator ($id)"
TOKEN=$(login "$email")
put_profile "$TOKEN" "$id" '{
  "avatar":     "https://picsum.photos/seed/jtech1/400/400",
  "coverPhoto": "https://picsum.photos/seed/jtech2/1200/400",
  "telefono":   "+502 3398-5510",
  "website":    "https://javiertech.gt"
}' > /dev/null
echo "  perfil base OK"

add_portfolio "$TOKEN" "$id" '{
  "title":        "Review Smartphone Mercado GT",
  "description":  "Video review técnico de celulares de gama media disponibles en Guatemala.",
  "type":         "video",
  "url":          "https://picsum.photos/seed/jt11/800/450",
  "thumbnailUrl": "https://picsum.photos/seed/jt11t/400/225",
  "category":     "Tecnología",
  "tags":         ["tech","review","smartphone","YouTube"],
  "isFeatured":   true,
  "order":        0
}' > /dev/null

add_portfolio "$TOKEN" "$id" '{
  "title":        "Tutorial Automatización con IA",
  "description":  "Serie educativa de 5 videos sobre automatización de procesos con herramientas IA para PyMES.",
  "type":         "video",
  "url":          "https://picsum.photos/seed/jt12/800/450",
  "thumbnailUrl": "https://picsum.photos/seed/jt12t/400/225",
  "category":     "Educativo",
  "tags":         ["IA","automatización","tutorial","PyMES"],
  "isFeatured":   true,
  "order":        1
}' > /dev/null

add_portfolio "$TOKEN" "$id" '{
  "title":        "Campaña LinkedIn B2B SaaS",
  "description":  "Contenido editorial y video testimonial para empresa SaaS guatemalteca.",
  "type":         "image",
  "url":          "https://picsum.photos/seed/jt13/800/600",
  "thumbnailUrl": "https://picsum.photos/seed/jt13/400/300",
  "category":     "B2B",
  "tags":         ["linkedin","B2B","SaaS","corporativo"],
  "isFeatured":   false,
  "order":        2
}' > /dev/null
echo "  portfolio OK"

add_cert "$TOKEN" "$id" '{"title":"Google Digital Marketing & E-commerce Certificate","issuer":"Google","description":"Certificado profesional de marketing digital y e-commerce.","issuedAt":"2023-05-20T00:00:00Z"}' > /dev/null
add_cert "$TOKEN" "$id" '{"title":"YouTube Creator Academy","issuer":"YouTube","description":"Programa oficial de formación para creadores de contenido.","issuedAt":"2021-11-01T00:00:00Z"}' > /dev/null
echo "  certificaciones OK"

set_availability "$TOKEN" "$id" "$AVAIL_LUNES_VIERNES" > /dev/null
echo "  disponibilidad OK"

# ─── Reindexar ────────────────────────────────────────────────────────────────
echo ""
echo "Disparando reindexado..."
curl -sf -X POST "$ARTISTS_URL/search/index/bulk" \
  -H "Content-Type: application/json" \
  -H "x-internal-secret: ${INTERNAL_SECRET:-dev_internal_secret_piums}" \
  -d '{"type":"all"}' 2>/dev/null | jq -r '"Reindex: artists=\(.indexed.artists) services=\(.indexed.services) errors=\(.errors)"' || echo "  reindex disparado (respuesta no JSON)"

echo ""
echo "======================================================"
echo "Perfiles completados."
