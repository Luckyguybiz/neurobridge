@AGENTS.md

# NeuroBridge — project context (frontend dashboard)

BaaS-платформа для биокомпьютинга. Frontend (этот repo). Backend в `~/neurobridge-api`. 10 world-class модулей, 132 endpoint, launch-ready.

## ⚡ ПЕРЕД любой работой — прочитай vault:

1. `/Users/lucky/vault/Биокомпьютинг/Биокомпьютинг.md` — overview (если есть)
2. `/Users/lucky/vault/Биокомпьютинг/Recent Decisions.md` — последние решения
3. `/Users/lucky/vault/Биокомпьютинг/Open Questions.md` — что висит без ответа
4. Свежий `Сессия [дата] — context for next.md` (auto-инжектится через SessionStart hook)

## ⚡ В КОНЦЕ сессии:

1. Обнови `Recent Decisions.md` (новые сверху, с датой)
2. Обнови `Open Questions.md` (закрытые → "Закрыто", новые сверху)
3. Создай `Сессия [сегодня] — context for next.md` в `~/vault/Биокомпьютинг/`. Прошлый → `Архив сессий/`
4. Обнови auto-memory `~/.claude/projects/-Users-lucky/memory/project_neurobridge.md`

## Vault структура

```
~/vault/Биокомпьютинг/
├─ Биокомпьютинг.md             ← главный overview
├─ People.md                     ← команда + credentials
├─ Recent Decisions.md           ← новые сверху
├─ Open Questions.md             ← открытые вопросы
├─ KPI.md                        ← целевые метрики
├─ Сессия [дата] — context for next.md
├─ Master Guides/                ← стабильные доки
├─ Архив планов/
└─ Архив сессий/
```

## Известные особенности

- World-class rewrite изменил API форматы — frontend handle и старые, и новые (см. memory `feedback_api_format_compat.md`)
- Dashboard нужен per-card loading state, debug panel, log export (см. memory `feedback_neurobridge_ux.md`)

## Backend repo

`~/neurobridge-api` — отдельный repo, тот же vault folder.
