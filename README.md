Самый лучший сайт!:
Проект реализует систему аутентификации с JWT токенами.

Состав проекта:
Backend: C# ASP.NET Core Web API
Frontend: React.js + Node.js с nginx
База данных: SQLite
Контейнеризация: Docker + Docker Compose

Тестовые учетные данные:
Логин: root
Пароль: root

Запуск проекта:
1.Скачать и установить Docker Desktop
2.Распаковать архив проекта
3.Открыть терминал в корневой папке проекта

Выполнить команду:
docker-compose up --build
Открыть в браузере: http://localhost:3000
Использовать тестовые данные: login: root, password: root

# Запуск всех сервисов
docker-compose up --build
# Или в фоновом режиме
docker-compose up -d --build

Остановка проекта:
# Остановка с удалением контейнеров
docker-compose down
# Остановка с удалением контейнеров и образов
docker-compose down --rmi all

Доступ к сервисам
После запуска доступны:
Frontend: http://localhost:3000
Backend API: http://localhost:7223
Swagger документация: http://localhost:7223/swagger
