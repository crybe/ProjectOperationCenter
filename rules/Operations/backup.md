# Nexus Backup Management (Restic + Rclone)

Diese Regel beschreibt, wie das automatisierte Backup-System verwaltet, manuell angestoßen und im Notfall wiederhergestellt wird.

## 🚀 Backup manuell starten
Um ein sofortiges Backup außerhalb des Zeitplans (täglich 03:30) auszuführen:

```bash
sudo systemctl start nexus-restic-backup.service
```

## 📊 Status & Überwachung

### Laufende Backups beobachten
```bash
# Live-Logverfolgung des aktuellen Tages
tail -f /var/log/nexus-backup/backup-$(date +%Y-%m-%d).log
```

### Letzte Snapshots anzeigen
```bash
sudo restic -r rclone:gdrive:nexus-repo --password-file /root/.config/restic/password snapshots
```

### Timer-Status prüfen
```bash
systemctl list-timers nexus-restic-backup.timer
```

## 📂 Wiederherstellung (Restore)

### Alles (Latest) wiederherstellen
```bash
sudo mkdir -p /tmp/restore-test
sudo restic -r rclone:gdrive:nexus-repo --password-file /root/.config/restic/password restore latest --target /tmp/restore-test
```

### Einzelne Dateien suchen
```bash
sudo restic -r rclone:gdrive:nexus-repo --password-file /root/.config/restic/password ls latest
```

## ⚙️ Konfigurationspfade
- **Backup-Script:** `/usr/local/bin/nexus-restic-backup.sh`
- **Exclude-Liste:** `/etc/restic/excludes.txt`
- **Passwort:** `/root/.config/restic/password`
- **Cloud-Backend:** `rclone:gdrive:nexus-repo` (Isoliert auf `/Server_Storage`)

## ⚠️ Wichtige Regeln
1. **Passwort-Schutz**: Das restic-Passwort niemals im Klartext in Logs oder Git-Repositories posten.
2. **Performance**: Das Backup läuft mit niedriger Priorität (`nice`/`ionice`), um den Raspberry Pi 5 nicht zu überlasten.
3. **Integrität**: Einmal im Monat sollte ein `restic check` ausgeführt werden, um die Konsistenz der Daten in der Cloud zu prüfen.

---
*Erstellt am 2026-05-06 von Antigravity (Nexus Command Hub Backup Automation)*
