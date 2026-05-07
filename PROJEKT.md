# HufCamPro — Projektdokumentation

## Überblick
- Was ist HufCamPro: Eine kostenlose Web-App zur professionellen Fotodokumentation von Pferdehufen, primär für Hufpfleger, Hufschmiede und Tierärzte, aber auch für Pferdebesitzer.
- URL: https://hufcampro.de
- Entwickelt von: Pascal Schmid · hufiapp.de
- Status: Live / Kostenlos / Kein Login

## Tech Stack
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS + Framer Motion
- PWA: Workbox (offline-fähig, installierbar)
- Lokaler Speicher: IndexedDB via idb-Library
- PDF Export: jspdf
- Hintergrund-Entfernung: rembg (FastAPI, Python, Port 8791)
- Reviews: Supabase (assaon Projekt)
- Hosting: VPS Hostinger KVM4 (187.77.78.109, Ubuntu 24.04)
- Webserver: Nginx + Let's Encrypt SSL

## Projektstruktur
*   `src/App.tsx`: Haupt-Router-Komponente, definiert die Routen (`/`, `/app`, `/legal`).
*   `src/main.tsx`: Einstiegspunkt der React-Anwendung, rendert die `App`-Komponente in den DOM.
*   `src/index.css`: Globale Stylesheet-Datei mit Tailwind-Direktiven.
*   `src/pages/Landing.tsx`: Startseite mit App-Features, PWA-Installationsprompt und Review-Sektion.
*   `src/pages/HufCamApp.tsx`: Hauptanwendungs-Shell mit Tabs-Navigation (Kamera, Verlauf, Vergleich).
*   `src/pages/Legal.tsx`: Rechtliche Seite mit Datenschutz, Bildrechten, Nutzungsbedingungen und Impressum.
*   `src/components/ReviewSection.tsx`: Komponente zur Anzeige und Einreichung von Erfahrungsberichten via Supabase.
*   `src/components/hufcam/HufCamPro.tsx`: Die zentrale, komplexe Hauptkomponente für Kamera-Zugriff, Foto-Capture, State-Management und Collage-Generierung.
*   `src/components/hufcam/GuideOverlay.tsx`: Zeigt initiale SVG-Anleitungen (Schattenumrisse) und einen Countdown pro Huf-Perspektive.
*   `src/components/hufcam/CameraGuideOverlay.tsx`: Zeichnet Live-Hilfslinien (z.B. Fadenkreuz, T-Guide) direkt über das Kamerabild basierend auf der Perspektive.
*   `src/components/hufcam/HistoryView.tsx`: Zeigt vergangene, in IndexedDB gespeicherte Sitzungen an.
*   `src/components/hufcam/CompareView.tsx`: Erlaubt den direkten Vorher-/Nachher-Vergleich von zwei ausgewählten Sitzungen.
*   `src/components/hufcam/types.ts`: Zentrale Typdefinitionen für das HufCam-Feature (z.B. Perspektiven, Huf-Daten).
*   `src/hooks/useDeviceOrientation.tsx`: Custom Hook zum Auslesen der Gyroskop-Sensordaten (Neigungswinkel) für Kamera-Warnungen.
*   `src/lib/db.ts`: Wrapper-Logik für den Zugriff auf die lokale IndexedDB zur Speicherung des Verlaufs.
*   `src/lib/supabase.ts`: Supabase-Client-Konfiguration für das Review-System.
*   `src/lib/utils.ts`: Hilfsfunktionen (z.B. `cn` für Tailwind-Klassen).

## VPS Konfiguration
- Projektpfad: `/root/hufcampro`
- Build Output: `/root/hufcampro/dist`
- Nginx Config: `/etc/nginx/sites-available/hufcampro.de`
- rembg Service: `/root/hufcampro-rembg/main.py` (PM2: `hufcampro-rembg`, Port 8791)
- SSL: Let's Encrypt, läuft bis 02.08.2026, auto-renew aktiv

## PM2 Services (relevant für HufCamPro)
- `hufcampro-rembg`: `python3 -m uvicorn main:app --host 127.0.0.1 --port 8791`

## Nginx Endpunkte
- `/` → `/root/hufcampro/dist` (statische React App)
- `/api/remove-bg` → proxy `127.0.0.1:8791/remove-bg` (POST only)

## Features (aktueller Stand)
- **Live-Kamera mit Guides**: Gerätekamera mit Hilfslinien und Gyroskop-Warnung ("Kamera gerade halten").
- **Guide-Overlays**: SVG-Anleitungen und Countdown vor der ersten Aufnahme pro Perspektive.
- **Ampelsystem (Belichtung)**: Echtzeit-Analyse der Helligkeit über das Videobild (Canvas), visuelles Feedback und Taschenlampen-Aktivierung bei zu dunklen Bedingungen.
- **Bild-Upload**: Alternative zur Live-Kamera: Fotos können aus der Galerie hochgeladen werden.
- **KI-Hintergrundentfernung**: Optionales Freistellen der Hufe nach der Aufnahme (via lokaler Python rembg API).
- **Auto-Collage**: Generierung einer gebrandeten (eigenes Wasserzeichen möglich) Zusammenstellung aller Fotos eines Hufes, mit Datum, Pferdenamen und Abstands-Hinweisen.
- **PDF-Export**: Exportfunktion der erstellten Collagen als A4 PDF.
- **Offline & Local-First**: Alle Daten werden in IndexedDB gespeichert, Web-App ist als PWA installierbar und offline nutzbar.
- **Community Reviews**: Eigenes Erfahrungsberichte-System (lesen/schreiben) angebunden an Supabase ohne Login-Hürde.
- **Native Sharing**: Nutzung der Web Share API zum Teilen von Collagen oder der App selbst.

## Supabase
- Projekt: `xeikdhzwzuqrqztwqlgz` (assaon.com)
- Tabelle: `hufcampro_reviews` (approved-System, manuell freischalten)
- RLS: Lesen nur `approved=true`, Schreiben `public`

## Update / Deploy Workflow

**Korrekter Live-Deploy:**
```bash
cd /root/hufcampro
bash deploy.sh
```

`deploy.sh` macht zwei Dinge:
1. `npm run build` (schreibt nach `/root/hufcampro/dist`)
2. `rsync -a --delete dist/ /var/www/hufcampro/dist/`

**Wichtig — typische Falle:**
- nginx liefert die Live-Site aus `/var/www/hufcampro/dist`, **nicht** aus `/root/hufcampro/dist`.
- `npm run build` allein baut nur lokal nach `/root/hufcampro/dist` und schaltet **nichts** live.
- `systemctl reload nginx` allein reicht ebenfalls nicht — nginx liest weiterhin den alten Stand aus `/var/www/hufcampro/dist`, solange dorthin nicht gerysncet wurde.
- Faustregel: **Immer `bash deploy.sh` benutzen**, sonst sieht der User auf hufcampro.de den alten Stand.

Nach dem Deploy aktualisiert der Service-Worker den Client beim nächsten Aufruf automatisch (`registerType: 'autoUpdate'`). Auf installierten PWAs muss die App ggf. einmal komplett geschlossen und neu geöffnet werden, damit der neue Stand sichtbar wird.

## rembg neu starten (falls nötig)
```bash
pm2 delete hufcampro-rembg
cd /root/hufcampro-rembg
pm2 start "python3 -m uvicorn main:app --host 127.0.0.1 --port 8791" --name hufcampro-rembg
pm2 save
```

## Reviews freischalten
Supabase Dashboard → Tabelle `hufcampro_reviews` → `approved` auf `true` setzen

## Bekannte Eigenheiten
- **Live-Analyse (Ampel)**: Die Helligkeitsanalyse nutzt ein verstecktes Canvas, auf das via `requestAnimationFrame` Frames des Videos gezeichnet werden (`getImageData`). Kann auf sehr alten Geräten performance-intensiv sein.
- **Gyroskop (`useDeviceOrientation`)**: Benötigt unter iOS eine explizite Nutzerinteraktion (`requestPermission`), die beim Start des Kamera-Assistenten im `ai`-Modus ausgelöst wird.
- **Collage Generation**: Passiert client-seitig auf einem Canvas. Das Herunterladen nutzt `toDataURL('image/jpeg')`.
- **Hintergrundentfernung**: Einziger Endpunkt, der einen Server benötigt (lokaler Python-Service). Wenn der Service offline ist, schlägt der API-Call in der App einfach fehl (Fehlerbehandlung fängt es ab).
- **State in `HufCamPro.tsx`**: Die Komponente ist sehr groß und verwaltet viel komplexen State (Fotos als verschachtelte Map). Bei zukünftigen Erweiterungen könnte ein Refactoring in Context oder Zustand sinnvoll sein.

## Roadmap / Ideen (offen)
- Ghost Overlay (Referenzfoto über Live-Kamera)
- Profi/Laien Modus
- Direktvergleich Vorher/Nachher in der App
- Integration in HufiApp (Pferd-Profil verknüpfen)

## Zusammenhang PASSAON Ökosystem
- HufCamPro ist kostenloses Standalone-Tool
- Funnel → hufiapp.de (HufiApp / HufManager)
- Gleicher VPS wie HufManager, assaon, Mr. EquiBot
- Supabase assaon Projekt (`xeikdhzwzuqrqztwqlgz`) für Reviews
- Domain registriert via All-Inkl, DNS A-Record → 187.77.78.109
