# Курсовая по вебу 3 курс 5 семестр

Проект: Учебный калькулятор и визуализатор алгоритмов дискретной математики и сетей

### Кратко:

- Веб-приложение для пошаговой визуализации алгоритмов (графы, кратчайшие пути, транспортные задачи, базовая
  NN-propagation)
- Алгоритмы выполняются на клиенте; фронт формирует протокол шагов (`steps[]`), воспроизводит/объясняет шаги, анимирует и даёт перемотку
- Бэкенд — минимальный Node.js-сервис для логина и хранения графов (и при необходимости вспомогательных функций)

### Что планируется

- **Графы**: BFS, DFS, Дейкстра, минимальный остов ...
- **Транспортные задачи**: метод минимальной стоимости ...
- **Нейросети**: визуализация распространения сигнала в маленькой MLP (без обучения) ...

### Набросок архитектуры

- **frontend/** — Next.js + React + Tailwind + Pixi.js + Graphology (Canvas/WebGL; редактор графов, анимации, степпер) + Redux
  Toolkit; вычисление алгоритмов и симуляция шагов в Web Worker.
- **backend/** — Node.js (auth + хранение графов, минимальная БД/API).

### Технический минимум

- Сборка: Next.js Turbopack
- Стейт-менеджер: Redux Toolkit
- Компонентная библиотека: MUI
- Web API: **Canvas/WebGL**; плюс **Web Worker** для вычислений на клиенте
- Тесты: Jest + React Testing Library; e2e: Playwright; coverage ≥ 80% (цель для CI)

### Технические решения

Детальные технические решения и архитектурные решения вынесены
в [ADR (Architecture Decision Records)](./docs/adr/README.md).

### Деплой

Подробные инструкции по деплою приложения доступны в [DEPLOY.md](./docs/DEPLOY.md).

**Быстрый старт:**

```bash
# Только Next.js (порт 3000)
docker-compose up -d

# С Nginx (порт 80)
docker-compose -f docker-compose.nginx.yml up -d
```

**Автоматический деплой (CI/CD):**

Настроен автоматический деплой через GitHub Actions. При push в ветку `main` автоматически запускается деплой на сервер.

Подробная инструкция по настройке: [CI_CD.md](./docs/CI_CD.md)

### Backend Developer Quickstart

- **Требования**
  - Node.js 20+, Docker Desktop (для Compose), Git.

- **Запуск**
  - Запустить PostgreSQL: `docker compose up -d postgres`
  - Запустить приложение: `npm install && npm run dev`

- **Тесты**
  - `npm test`

- **Полезные эндпоинты**
  - Health check: `http://localhost:3000/health`
  - API docs (если будут подключены): `http://localhost:3000/docs`

  ## Полезные команды

Установка pre-commit на локальный проект(после установки всех зависимостей):

```bash
$ cd <root_dir>/
$ pre-commit install
> pre-commit installed at .git/hooks/pre-commit
```

Запуск проверок вручную:

```shell
$ pre-commit
```

Установка гитхуков репозитория на проверку описания коммитов и наименования веток:

```shell
$ git config --local core.hooksPath .githooks/
```
