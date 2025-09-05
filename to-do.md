# FileBrowser – план улучшений (сервер, безопасность, структура)

## 1) Критические исправления (в первую очередь)
- [TODO] Безопасность путей: переписать `safeJoinRoot()` с использованием `fs.realpath()` и проверкой через `path.relative()` (не должно начинаться с `..`). Текущая реализация проста и не учитывает симлинки (`src/server/paths.ts`).
- [TODO] Блокировка симлинков: при листинге — помечать/скрывать; при чтении/скачивании — проверять `realpath` и принадлежность ROOT.
- [TODO] Защита от удаления корня: в `/api/fs/delete` и `/api/fs/rename` запретить операции, если путь указывает на корень (`/` → `ROOT`). Сейчас потенциально можно удалить/переместить `ROOT`.
- [ЧАСТИЧНО] Загрузка файлов:
  - [TODO] Санация имени файла (basename без разделителей и `..`). Сейчас сохраняем оригинальное имя, только добавляем уникальные суффиксы (`src/server/upload.ts`).
  - [СДЕЛАНО] Фильтр `ALLOWED_TYPES` по расширению в `fileFilter` (`isAllowedType`, `src/server/lib/fsSafe.ts`).
  - [ЧАСТИЧНО] Лимиты: есть префлайт по `Content-Length` (`preUploadLimitCheck`), но нет `multer` `limits.fileSize` и лимита числа файлов. Нужно подхватывать актуальный `MAX_UPLOAD_MB`.
- [ЧАСТИЧНО] Предпросмотр: изображения стримятся как есть; для текстов сейчас читаем целиком. Нужно ограничить размер (например, 1–2 МБ) и возвращать `truncated: true` при обрезке.

## 2) Укрепление API и конфигурации
- [TODO] Аутентификация: минимум X-API-Key из env; далее — JWT/ингресс auth.
- [TODO] Скрыть чувствительные данные: не возвращать абсолютный `root` на проде (`GET /api/config` сейчас возвращает путь).
- [TODO] Заголовки безопасности: `helmet`, `app.disable('x-powered-by')`, `app.set('trust proxy', true)` за прокси.
- [TODO] Rate limiting на мутирующие операции (удаление/загрузка/запись/переименование).
- [ЧАСТИЧНО] Логирование: уже есть `X-Request-Id` и debug-доступ-логи + `logAction` (`src/server/middleware/logger.ts`, `src/server/log.ts`). Нужно добавить корректный IP за прокси (`x-forwarded-for`), уровни и унификацию полей.
- [СДЕЛАНО] Централизованный обработчик ошибок с единым форматом (`src/server/middleware/errorHandler.ts`).
- [TODO] Валидация входных данных через Zod (body/query/params) на всех эндпойнтах.
- [TODO] CORS-политика (явный allow-list доменов админки/медиа, методы/заголовки).
- [ЧАСТИЧНО] Host/Proxy осведомлённость: есть `hostGate` для `adminDomain/mediaDomain`. Нужно документировать и включить `trust proxy`.

## 3) Рефакторинг структуры
- [СДЕЛАНО] Разнесены маршруты: `routes/configRoutes.ts`, `routes/fsRoutes.ts`, `routes/files.ts`.
- [СДЕЛАНО] `lib/settings.ts` для persist настроек; `log.ts` и `middleware/logger.ts` для логов.
- [ЧАСТИЧНО] `lib/fsSafe.ts`: есть `isAllowedType`, нужно добавить `sanitizeFilename`, `safeJoin`/`safeJoinRoot` с `realpath`-проверкой (сейчас в `paths.ts`).
- [СДЕЛАНО] Централизованный обработчик ошибок подключён глобально.
- [TODO] Валидация через Zod (см. раздел 2).

## 4) Тесты (Vitest)
- [TODO] Path traversal: префикс (root vs root_bad), `..` и абсолюты.
- [TODO] Симлинки: попытки эскейпа за ROOT.
- [TODO] Запрет удаления "/" и переименования корня.
- [TODO] Загрузка: лимит размера, фильтр типов, санация имен.
- [TODO] Предпросмотр: обрезка больших файлов, корректные статусы/типы.
- [TODO] Хосты/домен: тесты `hostGate` (admin/media/unknown), `X-Forwarded-Host` при включённом trust proxy.
- [TODO] Кэширование и отдача: 304/ETag/Last-Modified/Content-Length/Range для `/files/*`.
- [СЕЙЧАС] Есть базовые smoke-тесты API (`tests/server/basic.test.ts`).

## 5) Клиент
- [ЧАСТИЧНО] Унификация ошибок: сервер уже возвращает `{ error: { code, message, details } }`. Клиент (`src/client/services/apiClient.ts`) частично парсит ошибки, но нужно привести обработку к единому формату и отображению нотификаций.
- [TODO] Поддержка auth (заголовок/токен) в `apiClient` при включении на сервере.

## 6) Кэширование, листинг и журналирование (производительность/UX)
- [TODO] `/files/*`: добавить `Content-Length`, поддержать диапазоны `Range/If-Range (206)`; параметризовать `Cache-Control (max-age)` через конфиг.
- [TODO] `/api/fs/list`: постраничный вывод (page, limit) и сортировка (name|mtime|size, asc|desc).
- [ЧАСТИЧНО] `ignoreNames`: сейчас `['.settings.json']` + можно менять через `/api/config`. Расширить дефолт: `.git`, `.DS_Store`, `Thumbs.db` и др.
- [ЧАСТИЧНО] Логи: есть `logAction` и access-логи; добавить ip/x-forwarded-for и унифицированную схему (`action, entity, targetType, bytes`).

## 7) DevOps/операции
- [ЧАСТИЧНО] CI: базовый workflow есть; довести до линт+тесты+build+docker, ввести пороги падения.
- [СДЕЛАНО] Semantic Release настроен (`package.json`, обновляет `helm/Chart.yaml`).
- [ЧАСТИЧНО] Контейнер: запуск от non-root уже реализован (`Dockerfile`). Добавить `HEALTHCHECK`, рассмотреть `readOnlyRootFilesystem` и дополнительные ограничения.

## 8) Порядок внедрения (итерации)
1. [КРИТИЧНО] Safe paths + симлинки + запрет удаления/переименования корня.
2. [КРИТИЧНО] Загрузка: лимиты (`multer.limits`), санация имен, лимит числа файлов; оставить фильтр типов.
3. [БЕЗОПАСНОСТЬ] Валидация (Zod) + базовый auth (X-API-Key) + security headers + `trust proxy` + доработка `hostGate`.
4. [UX/ПРОИЗВОДИТЕЛЬНОСТЬ] Предпросмотр (ограничение размера, truncated), `/files` кэширование и `Range/Content-Length`; листинг: пагинация/сортировка.
5. [СТРУКТУРА] Дополнить `fsSafe` (`sanitizeFilename`, `safeJoin` с `realpath`), обновить места использования.
6. [ТЕСТЫ] Расширить покрытие (paths, симлинки, root-protect, загрузка, предпросмотр, кэширование, hostGate/trust proxy).
7. [ОПЕРАЦИИ] Rate limiting, расширение `ignoreNames` по умолчанию, унификация логов с ip.
8. [DEVOPS] Полировка CI и контейнера (HEALTHCHECK, политики), релизы.