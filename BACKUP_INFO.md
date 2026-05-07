# HufCamPro — Quick Reference

Stand: 05.05.2026

## Live URL
https://hufcampro.de

## Pfade
| Was | Wo |
|-----|-----|
| Quellcode | `/root/hufcampro/src` |
| Build (lokal, nicht live) | `/root/hufcampro/dist` |
| **Live-Verzeichnis (nginx)** | `/var/www/hufcampro/dist` |
| Deploy-Skript | `/root/hufcampro/deploy.sh` |
| rembg API | `/root/hufcampro-rembg/main.py` |
| Nginx Config | `/etc/nginx/sites-available/hufcampro.de` |
| PM2 Logs | `pm2 logs hufcampro-rembg` |

## Ein-Befehl Deploy
```bash
cd /root/hufcampro && bash deploy.sh
```

`deploy.sh` baut **und** rsynct nach `/var/www/hufcampro/dist`. Ein blosses `npm run build` ist **nicht** ausreichend, weil nginx aus `/var/www/hufcampro/dist` ausliefert. Auch `systemctl reload nginx` allein bringt nichts, solange das Live-Verzeichnis nicht aktualisiert wurde.

## Komponenten
| Datei | Funktion |
|-------|----------|
| `src/pages/Landing.tsx` | Landingpage |
| `src/pages/HufCamApp.tsx` | App-Shell mit Tabs |
| `src/pages/Legal.tsx` | Datenschutz + Impressum |
| `src/components/hufcam/HufCamPro.tsx` | Kern-Kamera-Logik |
| `src/components/hufcam/GuideOverlay.tsx` | Aufnahme-Anleitung SVG |
| `src/components/hufcam/CameraGuideOverlay.tsx` | Live-Hilfslinien über Kamera |
| `src/components/hufcam/HistoryView.tsx` | Sitzungs-Verlauf |
| `src/components/hufcam/CompareView.tsx` | Vorher/Nachher Vergleich |
| `src/components/ReviewSection.tsx` | Erfahrungsberichte |
| `src/lib/db.ts` | IndexedDB Wrapper |

## Supabase
Projekt: `xeikdhzwzuqrqztwqlgz` (assaon)
Tabelle: `hufcampro_reviews`
Review freischalten: `approved = true` setzen im Dashboard

## Kontakt / Entwickler
Pascal Schmid · pascalschmid.com · hufiapp.de
