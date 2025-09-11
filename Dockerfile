# Используем официальный Node.js образ
FROM node:22-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install --legacy-peer-deps

# Копируем исходный код
COPY . .

# Открываем порт 3000
EXPOSE 3000

# Команда для запуска в режиме разработки
CMD ["npm", "run", "dev"]
