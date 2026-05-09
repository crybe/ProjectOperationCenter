# Antigravity DevHub Projektstruktur - KI Clean

**Host:** server
**Pfad:** /app
**Erstellt:** 2026-05-07 15:07:01

```text
[4.0K]  .
├── [4.0K]  Berichte
│   ├── [3.1K]  2026-05-07_Dashboard-Konsolidierung.md
│   └── [2.8K]  abschlussbericht_pigeon_hardening.md
├── [4.0K]  Ki-Overview
│   └── [2.0K]  Serverstand.md
├── [4.0K]  Server_Struktur_Log
│   └── [2.8K]  server_structure.md
├── [4.0K]  blueprints
│   ├── [4.0K]  api
│   │   ├── [ 72K]  __init__.py
│   │   ├── [1.5K]  grow_api.py
│   │   ├── [2.6K]  sentinel_api.py
│   │   ├── [2.0K]  storage_api.py
│   │   └── [3.6K]  system_api.py
│   ├── [   0]  __init__.py
│   ├── [5.7K]  api_sentinel.py
│   ├── [1.1K]  auth.py
│   ├── [ 13K]  board.py
│   ├── [7.7K]  chat_log.py
│   ├── [ 13K]  dashboard.py
│   ├── [2.6K]  design.py
│   ├── [3.0K]  extended_stats.py
│   ├── [4.7K]  files.py
│   ├── [4.2K]  git_log.py
│   ├── [2.2K]  grow_archive.py
│   ├── [ 558]  info.md
│   ├── [1.6K]  react_ui.py
│   └── [5.2K]  vps.py
├── [4.0K]  config
├── [4.0K]  core
│   ├── [4.0K]  services
│   │   ├── [   0]  __init__.py
│   │   ├── [5.2K]  grow_service.py
│   │   ├── [3.7K]  storage_service.py
│   │   └── [3.4K]  system_service.py
│   ├── [4.0K]  tools
│   │   ├── [8.5K]  chatgpt_logger.py
│   │   ├── [1.5K]  devhub_ctrl.py
│   │   └── [ 510]  fix_func.py
│   ├── [   0]  __init__.py
│   ├── [4.5K]  ai_agent.py
│   ├── [3.3K]  automation.py
│   ├── [1.8K]  config.py
│   ├── [2.3K]  constants.py
│   ├── [2.7K]  dashboard_widgets.py
│   ├── [ 116]  db.py
│   ├── [1.0K]  errors.py
│   ├── [2.8K]  event_system.py
│   ├── [2.9K]  extensions.py
│   ├── [4.5K]  grow_logic.py
│   ├── [ 437]  info.md
│   ├── [3.9K]  intelligence_engine.py
│   ├── [2.5K]  migrate.py
│   ├── [4.5K]  models.py
│   ├── [2.6K]  supervisor.py
│   ├── [9.3K]  ui_config.py
│   └── [ 16K]  utils.py
├── [4.0K]  data
│   ├── [4.0K]  codex
│   ├── [ 11K]  chat_log.json
│   ├── [  80]  live_session.json
│   ├── [   2]  notes.json
│   └── [9.6K]  system_memory.json
├── [4.0K]  docker-services
│   ├── [4.0K]  grafana
│   │   ├── [4.0K]  provisioning
│   │   │   ├── [4.0K]  dashboards
│   │   │   │   ├── [ 232]  dashboard.yml
│   │   │   │   ├── [ 52K]  pihole.json
│   │   │   │   ├── [309K]  rpi5-main.json
│   │   │   │   ├── [229K]  rpi5-main.json.bak2
│   │   │   │   └── [243K]  rpi5-main.json.bak3
│   │   │   └── [4.0K]  datasources
│   │   ├── [4.0K]  public_img
│   │   │   ├── [4.0K]  grows
│   │   │   │   ├── [4.0K]  ghost-train-haze
│   │   │   │   ├── [4.0K]  northern-lights-1
│   │   │   │   ├── [4.0K]  northern-lights-2
│   │   │   │   ├── [4.0K]  shaman
│   │   │   │   └── [4.0K]  white-widow
│   │   │   └── [1.4K]  cannabis.svg
│   │   ├── [ 82K]  dashboard_backup_20260328_005223.json
│   │   ├── [5.1K]  docker-compose.yml
│   │   ├── [ 519]  loki-config.yaml
│   │   ├── [ 11K]  pihole_exporter.py
│   │   ├── [ 602]  prometheus.yml
│   │   ├── [ 863]  promtail-config.yaml
│   │   └── [4.9K]  update_grow.sh
│   ├── [4.0K]  monitoring
│   │   └── [ 683]  docker-compose.yml
│   ├── [4.0K]  n8n
│   │   ├── [4.0K]  db_data
│   │   ├── [4.0K]  n8n_data
│   │   │   ├── [4.0K]  nodes
│   │   │   │   └── [  72]  package.json
│   │   │   ├── [4.0K]  storage
│   │   │   │   └── [4.0K]  chat-hub
│   │   │   ├── [5.3K]  1FcN15J735GsTMm9.json
│   │   │   ├── [5.2K]  8LFwS0I4Zq1f5pFD.json
│   │   │   ├── [7.0K]  HUB_Grow_Management_FIXED.json
│   │   │   ├── [3.4K]  Master_Mail_Labeller.json
│   │   │   ├── [5.2K]  Nk6EMxhBEJWTRBqI.json
│   │   │   ├── [711K]  all_workflows.json
│   │   │   ├── [1.4K]  backup_fa54qTF2uMAfKsYI.json
│   │   │   ├── [8.3K]  backup_iBqKHWLjlfKu1ntQ.json
│   │   │   ├── [5.0K]  cHIRoLeIPZ9hx0WI.json
│   │   │   ├── [  56]  config
│   │   │   ├── [   0]  crash.journal
│   │   │   ├── [5.2K]  il34VFg3xxVYozbD.json
│   │   │   ├── [7.0K]  rechnung_final.json
│   │   │   ├── [ 399]  server_tool_ed25519
│   │   │   └── [  94]  server_tool_ed25519.pub
│   │   ├── [4.0K]  scripts
│   │   │   └── [ 667]  backup_n8n_postgres.sh
│   │   ├── [4.0K]  workflow_backups
│   │   │   ├── [4.0K]  cleanup_2026-05-02
│   │   │   │   ├── [ 31K]  backup_04lcV2MUimf2sGON.json
│   │   │   │   ├── [ 35K]  backup_73b5a0bf-a921-4130-bc1d-393bd68d6d5c.json
│   │   │   │   ├── [ 12K]  backup_8aa5d275-7ebe-4e4f-80d4-5292922174d6.json
│   │   │   │   ├── [5.3K]  backup_BNzYFEJUpO8O6XjC.json
│   │   │   │   ├── [4.3K]  backup_ObTgawbhg2XzSkfx.json
│   │   │   │   ├── [ 22K]  backup_WOQkTDxhii4b6yZA.json
│   │   │   │   ├── [1.4K]  backup_fa54qTF2uMAfKsYI.json
│   │   │   │   ├── [8.3K]  backup_iBqKHWLjlfKu1ntQ.json
│   │   │   │   ├── [5.1K]  backup_zA4Ul7cZZkskG55o.json
│   │   │   │   └── [172K]  backup_zlI1oEv5nqyHKGfo.json
│   │   │   ├── [ 11K]  Telegram_AI_Chatbot_V3_FINAL.json
│   │   │   ├── [5.4K]  admin_media_polling_2026-04-14.json
│   │   │   ├── [ 37K]  broken_workflows_backup_2026-04-14.json
│   │   │   └── [ 44K]  workflows_2026-04-14.json
│   │   ├── [ 12K]  Nd8oXG7tWLYYrzUa.backup.2026-04-14.json
│   │   ├── [2.3K]  docker-compose.yml
│   │   └── [ 74M]  n8n_dump.backup
│   └── [ 237]  info.md
├── [4.0K]  docs
│   ├── [4.0K]  intelligence
│   │   ├── [1.2K]  AGENTS.md
│   │   └── [2.1K]  PIGEON_INTELLIGENCE.md
│   ├── [2.4K]  ARCHITECTURE.md
│   ├── [2.2K]  CLAUDE.md
│   ├── [2.2K]  GUIDELINES.md
│   ├── [ 165]  INCIDENTS.md
│   ├── [2.3K]  MOBILE.md
│   ├── [2.3K]  Mobile.md
│   ├── [ 267]  OPERATIONS.md
│   ├── [ 425]  PROMPTS.md
│   ├── [4.7K]  Status.md
│   ├── [4.0K]  Umgesetzt.md
│   ├── [ 339]  feed.md
│   └── [1.9K]  hardening_plan.md
├── [4.0K]  frontend
│   ├── [4.0K]  public
│   │   ├── [9.3K]  favicon.svg
│   │   └── [4.9K]  icons.svg
│   ├── [4.0K]  src
│   │   ├── [4.0K]  Intelligence-worker
│   │   │   ├── [ 27K]  IntelligenceCenter.tsx
│   │   │   ├── [ 24K]  IntelligenceFeed.tsx
│   │   │   ├── [4.2K]  SentinelStatus.tsx
│   │   │   └── [5.2K]  SystemMemory.tsx
│   │   ├── [4.0K]  assets
│   │   │   ├── [4.0K]  react.svg
│   │   │   └── [8.5K]  vite.svg
│   │   ├── [4.0K]  components
│   │   │   ├── [ 12K]  ArchiveTab.tsx
│   │   │   ├── [2.5K]  AuditLogViewer.tsx
│   │   │   ├── [1.6K]  CyberLogs.tsx
│   │   │   ├── [ 17K]  GrowArchive.tsx
│   │   │   ├── [ 10K]  GrowboxHUD.tsx
│   │   │   ├── [ 11K]  ServerHUD.tsx
│   │   │   ├── [ 12K]  ThreatMap.tsx
│   │   │   ├── [2.4K]  Toast.tsx
│   │   │   ├── [1.3K]  UpdateBanner.tsx
│   │   │   └── [ 19K]  ui.tsx
│   │   ├── [4.0K]  hooks
│   │   │   └── [ 668]  useApi.ts
│   │   ├── [4.0K]  mobile
│   │   │   ├── [4.7K]  MobileApp.tsx
│   │   │   ├── [2.4K]  MobileDashboards.tsx
│   │   │   ├── [5.3K]  MobileServices.tsx
│   │   │   ├── [4.3K]  MobileSettings.tsx
│   │   │   ├── [6.7K]  MobileStatus.tsx
│   │   │   ├── [4.5K]  MobileWorkflows.tsx
│   │   │   └── [2.9K]  PinLock.tsx
│   │   ├── [4.0K]  pages
│   │   │   ├── [ 27K]  Board.tsx
│   │   │   ├── [ 21K]  BotMonitor.tsx
│   │   │   ├── [5.9K]  CVEReport.tsx
│   │   │   ├── [3.6K]  CipherStream.tsx
│   │   │   ├── [ 14K]  Cmd.tsx
│   │   │   ├── [4.9K]  Codex.tsx
│   │   │   ├── [3.2K]  DarkPool.tsx
│   │   │   ├── [ 35K]  DevHubDashboard.tsx
│   │   │   ├── [ 37K]  Growbox.tsx
│   │   │   ├── [9.9K]  Login.tsx
│   │   │   ├── [ 15K]  NetWatch.tsx
│   │   │   ├── [5.2K]  NexusHub.tsx
│   │   │   ├── [ 18K]  Notes.tsx
│   │   │   ├── [5.1K]  OsintHub.tsx
│   │   │   ├── [ 24K]  PigeonLog.tsx
│   │   │   ├── [ 16K]  Sentinel.tsx
│   │   │   ├── [ 13K]  Services.tsx
│   │   │   ├── [9.0K]  StorageMatrix.tsx
│   │   │   ├── [ 12K]  SystemMap.tsx
│   │   │   └── [ 20K]  VPanel.tsx
│   │   ├── [2.8K]  App.css
│   │   ├── [4.1K]  App.tsx
│   │   ├── [ 40K]  Layout.tsx
│   │   ├── [ 23K]  index.css
│   │   └── [ 230]  main.tsx
│   ├── [ 253]  .gitignore
│   ├── [2.4K]  README.md
│   ├── [ 591]  eslint.config.js
│   ├── [ 365]  index.html
│   ├── [ 289]  info.md
│   ├── [264K]  package-lock.json
│   ├── [ 966]  package.json
│   ├── [  91]  postcss.config.js
│   ├── [ 262]  tailwind.config.js
│   ├── [ 644]  tsconfig.app.json
│   ├── [ 119]  tsconfig.json
│   ├── [ 591]  tsconfig.node.json
│   └── [1.6K]  vite.config.ts
├── [4.0K]  intelligence_worker
│   ├── [ 36K]  ai.py
│   ├── [2.8K]  ai_logic.py
│   ├── [3.0K]  memory_logic.py
│   └── [ 14K]  pigeon_engine.py
├── [4.0K]  rules
│   ├── [4.0K]  arch
│   │   ├── [ 947]  architecture.md
│   │   ├── [3.2K]  integration.md
│   │   ├── [1.9K]  layer_enforcement.md
│   │   └── [1.9K]  nexus_core.md
│   ├── [4.0K]  design
│   │   └── [1.2K]  cashy_os_design.md
│   ├── [4.0K]  dev
│   │   ├── [1.7K]  code-commit.md
│   │   ├── [2.1K]  frontend.md
│   │   ├── [2.8K]  refactor.md
│   │   ├── [1.9K]  reporting.md
│   │   ├── [1.1K]  security.md
│   │   └── [3.2K]  styling.md
│   ├── [4.0K]  ops
│   │   ├── [3.5K]  audit.md
│   │   ├── [1.8K]  backup.md
│   │   ├── [2.1K]  deploy-workflow.md
│   │   ├── [2.4K]  server_status.md
│   │   ├── [3.7K]  sicherheits.md
│   │   └── [1.2K]  structure_logging.md
│   ├── [4.0K]  projects
│   │   └── [1.4K]  pigeon_protocol.md
│   └── [2.0K]  index.md
├── [4.0K]  scripts
│   ├── [4.0K]  automation
│   │   ├── [2.1K]  cyber_maintenance.py
│   │   └── [4.6K]  git_watcher.py
│   ├── [4.0K]  devops
│   │   ├── [ 297]  backup_devhub.sh
│   │   ├── [2.0K]  deploy.sh
│   │   ├── [ 269]  healthcheck.sh
│   │   ├── [ 654]  pull.sh
│   │   ├── [ 936]  rebuild.sh
│   │   ├── [ 132]  restart_devhub.sh
│   │   └── [3.3K]  watchdog.py
│   ├── [4.0K]  maintenance
│   │   └── [1001]  watchdog.sh
│   └── [ 233]  info.md
├── [4.0K]  src
│   └── [4.0K]  pages
├── [4.0K]  static
│   ├── [4.0K]  assets
│   ├── [ 128]  custom.css
│   ├── [ 239]  info.md
│   ├── [1.0M]  pigeon_base64.txt
│   ├── [ 82K]  style.css
│   ├── [ 333]  theme-vars.css
│   └── [ 12K]  theme.css
├── [4.0K]  templates
│   ├── [4.0K]  widgets
│   │   └── [4.0K]  dashboard
│   │       ├── [ 324]  activity.html
│   │       ├── [1.0K]  growbox.html
│   │       ├── [ 958]  host_status.html
│   │       ├── [1.4K]  notes.html
│   │       ├── [ 711]  pipeline.html
│   │       └── [1.1K]  project_spotlight.html
│   ├── [2.2K]  _project_topbar.html
│   ├── [9.3K]  activity.html
│   ├── [4.1K]  admin.html
│   ├── [3.5K]  ai_review.html
│   ├── [2.1K]  analytics.html
│   ├── [8.4K]  base.html
│   ├── [ 31K]  board.html
│   ├── [ 21K]  chat_log.html
│   ├── [6.8K]  chat_log_compare.html
│   ├── [ 23K]  chat_log_detail.html
│   ├── [3.6K]  chat_log_new.html
│   ├── [ 26K]  dashboard.html
│   ├── [7.7K]  design.html
│   ├── [ 10K]  files.html
│   ├── [ 29K]  grow.html
│   ├── [ 13K]  grow_log.html
│   ├── [2.2K]  index.html
│   ├── [ 211]  info.md
│   ├── [ 15K]  inventory.html
│   ├── [ 21K]  login.html
│   ├── [ 16K]  notes.html
│   ├── [6.1K]  project.html
│   ├── [3.1K]  project_form.html
│   ├── [ 11K]  review.html
│   ├── [1.4K]  search.html
│   ├── [5.0K]  security.html
│   ├── [7.8K]  services.html
│   ├── [7.3K]  shortcuts.html
│   ├── [1.2K]  system_design.html
│   ├── [2.5K]  system_extensions.html
│   ├── [5.1K]  usage.html
│   ├── [ 11K]  vpanel.html
│   └── [2.8K]  vpanel_verify.html
├── [ 120]  .gitignore
├── [ 324]  .pre-commit-config.yaml
├── [ 912]  Dockerfile
├── [1.5K]  README.md
├── [6.5K]  app.py
├── [ 613]  docker-compose.yml
├── [  70]  requirements.txt
├── [ 149]  struktur-devhub-clean.md
└── [ 77K]  struktur-devhub.md

63 directories, 267 files
```
