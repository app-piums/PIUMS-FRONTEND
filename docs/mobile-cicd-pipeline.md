# CI/CD Pipeline — Apps Móviles Piums

Fecha de redacción: 2026-06-02  
Repos involucrados: `app-piums/piums-Android-artist`, `app-piums/piums-Android-client`, `app-piums/piums-ios-artist`, `app-piums/piums-ios-client`

---

## Resumen del flujo

```
push a main
    └── CI: lint + build + tests
         └── (si OK) build release firmado
              └── subida automática a Play Store Internal / TestFlight
                       └── aprobación manual → producción
```

Los usuarios reciben la actualización cuando se promueve manualmente desde el panel de cada tienda. La automatización cubre todo hasta que el build está listo para revisar — la promoción a producción siempre requiere un humano.

---

## Pre-requisitos (hacer una sola vez)

### Android

**1. Keystore de firma**

Cada app necesita un keystore `.jks`. Si aún no existen, generarlos:

```bash
# Para la app artista
keytool -genkey -v \
  -keystore piums-artist-release.jks \
  -alias piums-artist \
  -keyalg RSA -keysize 2048 -validity 10000

# Para la app cliente
keytool -genkey -v \
  -keystore piums-client-release.jks \
  -alias piums-client \
  -keyalg RSA -keysize 2048 -validity 10000
```

Guardar los archivos `.jks` en un lugar seguro (no commitear al repo).
Convertir a base64 para el secret de GitHub:

```bash
base64 -i piums-artist-release.jks | pbcopy   # copia al clipboard
```

**2. Google Play API — Service Account**

Para que GitHub Actions suba a Play Store sin login manual:

1. Google Play Console → Setup → API access → Link to Google Cloud project
2. Google Cloud Console → IAM → Service Accounts → Crear cuenta → descargar JSON
3. En Play Console, dar permiso "Release manager" a esa service account
4. Convertir el JSON a base64: `base64 -i service-account.json | pbcopy`

**3. Apps registradas en Play Console**

Las apps deben existir en Play Console con al menos un APK/AAB subido manualmente (la primera vez siempre es manual). Después de eso, la API puede subir actualizaciones.

- `piums.artist` → app artista
- `piums.cliente.android` → app cliente

---

### iOS

**1. Cambiar Bundle IDs (pendiente)**

Los Bundle IDs actuales son `com.local.*` y no son válidos para App Store. Cambiarlos en Xcode antes de la primera subida:

| App | Bundle ID actual | Bundle ID propuesto |
|---|---|---|
| Artista | `com.local.piumsartist` | `io.piums.artist` |
| Cliente | `com.local.piumscliente` | `io.piums.cliente` |

Registrarlos en [developer.apple.com](https://developer.apple.com) → Identifiers → App IDs.

**2. Certificados y provisioning profiles**

La forma más simple para CI es usar **App Store Connect API key** (no requiere sesión de Apple ID):

1. App Store Connect → Users and Access → Integrations → App Store Connect API
2. Crear key con rol "App Manager" → descargar el `.p8`
3. Anotar el Key ID y Issuer ID

Alternativamente, exportar el certificado de distribución desde Keychain como `.p12` + la provisioning profile como `.mobileprovision` y encodearlos en base64.

**3. Apps registradas en App Store Connect**

Crear las apps en App Store Connect antes del primer pipeline:

- App artista con Bundle ID `io.piums.artist`
- App cliente con Bundle ID `io.piums.cliente`

---

## Secrets requeridos en GitHub

Configurar en cada repo (`Settings → Secrets and variables → Actions`):

### Repos Android

| Secret | Contenido |
|---|---|
| `KEYSTORE_BASE64` | Keystore `.jks` en base64 |
| `KEYSTORE_PASSWORD` | Password del keystore |
| `KEY_ALIAS` | Alias de la key (`piums-artist` o `piums-client`) |
| `KEY_PASSWORD` | Password de la key |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | JSON de service account en base64 |

### Repos iOS

| Secret | Contenido |
|---|---|
| `APP_STORE_CONNECT_API_KEY_ID` | Key ID del API key |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID |
| `APP_STORE_CONNECT_API_KEY_BASE64` | Archivo `.p8` en base64 |
| `CERTIFICATE_P12_BASE64` | Certificado de distribución en base64 |
| `CERTIFICATE_PASSWORD` | Password del `.p12` |
| `PROVISIONING_PROFILE_BASE64` | Provisioning profile en base64 |

---

## Pipeline Android

Crear el archivo `.github/workflows/ci-cd.yml` en cada repo Android. La diferencia entre artista y cliente es el `applicationId` y el alias del keystore.

```yaml
name: Android CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      deploy_track:
        description: 'Play Store track to deploy to'
        required: false
        default: 'internal'
        type: choice
        options: [internal, alpha, beta, production]

jobs:
  # ─────────────────────────────────────────────
  # 1. Build y tests
  # ─────────────────────────────────────────────
  build:
    name: Build & Test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v3

      - name: Run lint
        run: ./gradlew lint

      - name: Run unit tests
        run: ./gradlew test

      - name: Build debug APK (PR check)
        if: github.event_name == 'pull_request'
        run: ./gradlew assembleDebug

  # ─────────────────────────────────────────────
  # 2. Build release firmado y subida a Play Store
  # ─────────────────────────────────────────────
  deploy:
    name: Build Release & Deploy
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'push' || github.event_name == 'workflow_dispatch'

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v3

      # Restaurar keystore desde secret
      - name: Decode keystore
        run: |
          echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 --decode > app/release.jks

      # Bump versionCode automático basado en run number
      # Garantiza que cada build en CI tenga un versionCode único y creciente
      - name: Bump versionCode
        run: |
          sed -i "s/versionCode = [0-9]*/versionCode = ${{ github.run_number }}/" app/build.gradle.kts

      - name: Build release AAB
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
        run: |
          ./gradlew bundleRelease \
            -Pandroid.injected.signing.store.file=app/release.jks \
            -Pandroid.injected.signing.store.password=$KEYSTORE_PASSWORD \
            -Pandroid.injected.signing.key.alias=$KEY_ALIAS \
            -Pandroid.injected.signing.key.password=$KEY_PASSWORD

      - name: Decode Google Play service account
        run: |
          echo "${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON }}" | base64 --decode > service-account.json

      - name: Upload to Play Store
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJson: service-account.json
          packageName: piums.artist            # cambiar a piums.cliente.android en el otro repo
          releaseFiles: app/build/outputs/bundle/release/*.aab
          track: ${{ github.event.inputs.deploy_track || 'internal' }}
          status: completed

      - name: Cleanup secrets
        if: always()
        run: rm -f app/release.jks service-account.json
```

### Como funciona el versionCode

Se usa `github.run_number` como versionCode — es un número que GitHub incrementa automáticamente en cada run. Esto garantiza que nunca haya conflicto con Play Store sin tener que editarlo manualmente. El `versionName` visible para el usuario (ej. "1.2.0") se sigue manejando en `build.gradle.kts`.

### Deploy a producción

El workflow por defecto sube a `internal` (solo testers internos). Para promover:

- **Desde Play Console:** Internal → Alpha → Beta → Production (manual, con rollout gradual)
- **Con workflow_dispatch:** Ejecutar el workflow manualmente eligiendo `production` como track (requiere que el build ya haya sido revisado en internal)

---

## Pipeline iOS

Crear `.github/workflows/ci-cd.yml` en cada repo iOS. Requiere un runner macOS porque Xcode solo corre en Mac.

```yaml
name: iOS CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      submit_review:
        description: 'Enviar a revisión de App Store después de subir a TestFlight'
        required: false
        default: false
        type: boolean

jobs:
  # ─────────────────────────────────────────────
  # 1. Build y tests
  # ─────────────────────────────────────────────
  build:
    name: Build & Test
    runs-on: macos-15

    steps:
      - uses: actions/checkout@v4

      - name: Select Xcode version
        run: sudo xcode-select -s /Applications/Xcode_16.app

      - name: Run unit tests
        run: |
          xcodebuild test \
            -project PiumsArtist.xcodeproj \
            -scheme PiumsArtist \
            -destination 'platform=iOS Simulator,name=iPhone 16,OS=latest' \
            -resultBundlePath TestResults.xcresult \
            CODE_SIGNING_ALLOWED=NO
        # Cambiar PiumsArtist por PiumsCliente en el repo de cliente

  # ─────────────────────────────────────────────
  # 2. Archive y subida a TestFlight
  # ─────────────────────────────────────────────
  deploy:
    name: Archive & Upload to TestFlight
    runs-on: macos-15
    needs: build
    if: github.event_name == 'push' || github.event_name == 'workflow_dispatch'

    steps:
      - uses: actions/checkout@v4

      - name: Select Xcode version
        run: sudo xcode-select -s /Applications/Xcode_16.app

      # Instalar certificado en el keychain temporal del runner
      - name: Install certificate
        run: |
          echo "${{ secrets.CERTIFICATE_P12_BASE64 }}" | base64 --decode > certificate.p12
          security create-keychain -p "" build.keychain
          security default-keychain -s build.keychain
          security unlock-keychain -p "" build.keychain
          security import certificate.p12 -k build.keychain \
            -P "${{ secrets.CERTIFICATE_PASSWORD }}" \
            -T /usr/bin/codesign
          security set-key-partition-list -S apple-tool:,apple: -s -k "" build.keychain

      # Instalar provisioning profile
      - name: Install provisioning profile
        run: |
          echo "${{ secrets.PROVISIONING_PROFILE_BASE64 }}" | base64 --decode > profile.mobileprovision
          mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles
          cp profile.mobileprovision ~/Library/MobileDevice/Provisioning\ Profiles/

      # Bump build number con run_number (mismo criterio que Android)
      - name: Bump build number
        run: |
          agvtool new-version -all ${{ github.run_number }}

      # Archive
      - name: Archive
        run: |
          xcodebuild archive \
            -project PiumsArtist.xcodeproj \
            -scheme PiumsArtist \
            -configuration Release \
            -archivePath build/PiumsArtist.xcarchive \
            CODE_SIGN_STYLE=Manual \
            DEVELOPMENT_TEAM=LDB55TCA53

      # Export IPA
      - name: Export IPA
        run: |
          cat > ExportOptions.plist << EOF
          <?xml version="1.0" encoding="UTF-8"?>
          <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
          <plist version="1.0">
          <dict>
            <key>method</key>
            <string>app-store</string>
            <key>teamID</key>
            <string>LDB55TCA53</string>
            <key>uploadSymbols</key>
            <true/>
          </dict>
          </plist>
          EOF

          xcodebuild -exportArchive \
            -archivePath build/PiumsArtist.xcarchive \
            -exportPath build/export \
            -exportOptionsPlist ExportOptions.plist

      # Subir a TestFlight via App Store Connect API
      - name: Upload to TestFlight
        env:
          API_KEY_ID: ${{ secrets.APP_STORE_CONNECT_API_KEY_ID }}
          ISSUER_ID: ${{ secrets.APP_STORE_CONNECT_ISSUER_ID }}
        run: |
          echo "${{ secrets.APP_STORE_CONNECT_API_KEY_BASE64 }}" | base64 --decode > AuthKey_${API_KEY_ID}.p8

          xcrun altool --upload-app \
            --type ios \
            --file build/export/PiumsArtist.ipa \
            --apiKey $API_KEY_ID \
            --apiIssuer $ISSUER_ID

          # Alternativa moderna (Xcode 15+):
          # xcrun notarytool submit build/export/PiumsArtist.ipa ...

      - name: Cleanup secrets
        if: always()
        run: |
          rm -f certificate.p12 profile.mobileprovision AuthKey_*.p8
          security delete-keychain build.keychain || true
```

### Como funciona el build number en iOS

Igual que Android, se usa `github.run_number` con `agvtool` para que cada build subido a TestFlight tenga un número único. Apple rechaza builds con el mismo build number dentro de la misma versión.

### Revisión y publicación

TestFlight recibe el build automáticamente. Desde ahí:

1. **Testers internos** (App Store Connect Users): disponible en minutos, sin revisión de Apple
2. **Testers externos**: requiere revisión beta de Apple (1-2 días la primera vez, luego sin revisión)
3. **App Store**: crear nueva versión en App Store Connect, adjuntar el build de TestFlight, enviar a revisión (1-3 días)

---

## Estrategia de ramas y tracks

La misma lógica que piums-platform, adaptada a mobile:

| Evento | Resultado |
|---|---|
| PR abierto | Lint + tests + build debug (sin deploy) |
| Push a `main` | Build release → Internal Testing (Play) / TestFlight interno |
| `workflow_dispatch` con track=beta | Subida directa a beta |
| `workflow_dispatch` con track=production | Subida directa a producción (solo si ya fue probado) |

---

## Costo de runners

- **Android** corre en `ubuntu-latest` → gratis con GitHub Free/Pro (2000 min/mes)
- **iOS** corre en `macos-15` → consume 10x los minutos de Linux en el plan gratuito

Con el plan gratuito de GitHub (2000 min, macOS = 10x), efectivamente tienes ~200 minutos de macOS por mes. Un build de iOS tarda ~10-15 min, así que son ~15-20 builds gratis al mes por repo.

Opciones para aumentar:
- GitHub Teams ($4/user/mes) incluye 3000 min
- Usar un Mac mini como self-hosted runner (costo único, builds ilimitados)

---

## Checklist de implementación

### Antes de empezar
- [ ] Cambiar Bundle IDs de `com.local.*` a `io.piums.*` en ambas apps iOS
- [ ] Registrar los nuevos Bundle IDs en Apple Developer Portal
- [ ] Crear las apps en App Store Connect (artista y cliente)
- [ ] Crear las apps en Google Play Console (artista y cliente) con la primera subida manual
- [ ] Generar keystores Android y guardarlos en lugar seguro
- [ ] Generar certificado de distribución iOS y provisioning profiles
- [ ] Crear service account de Google Play API

### Por repo (repetir en los 4 repos)
- [ ] Crear `.github/workflows/ci-cd.yml` con el workflow correspondiente
- [ ] Configurar todos los secrets en `Settings → Secrets and variables → Actions`
- [ ] Hacer push a `main` y verificar que el primer run completa sin errores
- [ ] Confirmar que el build aparece en Play Console internal / TestFlight

### Opcional pero recomendado
- [ ] Configurar Slack webhook para notificaciones de deploy (los TODOs ya están en los workflows de piums-platform)
- [ ] Self-hosted Mac runner para no consumir minutos de macOS en GitHub
- [ ] Fastlane como capa de abstracción sobre los comandos de Xcode/Gradle (simplifica el mantenimiento del YAML)
