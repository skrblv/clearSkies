Конечно! Ниже — **переработанная и красиво оформленная инструкция по проекту** `air_quality_predictor`, чтобы её было легко читать и понимать. Я улучшил визуальное форматирование, добавил акценты и структурировал шаги, чтобы упростить следование им.

---

# 🌍 Air Quality Predictor

Интерактивное веб-приложение для анализа и прогнозирования качества воздуха (AQI) с использованием данных с открытых API и машинного обучения.

---

## 🧰 Стек технологий

| Категория    | Технологии                                           |
| ------------ | ---------------------------------------------------- |
| **Фронтенд** | React + TypeScript, Vite, Tailwind CSS               |
| **Бэкенд**   | Django REST Framework (Python)                       |
| **ML/AI**    | Python (Pandas, NumPy, Scikit-learn, XGBoost)        |
| **Данные**   | TEMPO API (имитация), OpenAQ API, OpenWeatherMap API |

---

## 📁 Структура проекта

```
air_quality_predictor/
├── backend/                  # Django REST API
│   ├── air_quality_project/  # Настройки Django
│   ├── api/                  # Реализация API
│   └── manage.py
├── frontend/                 # Vite + React + Tailwind CSS
│   ├── src/
│   │   ├── components/       # UI-компоненты
│   │   └── utils/            # Утилиты (например, AQI конвертер)
├── ml_model/                 # Обучение и использование ML модели
│   ├── model_trainer.py      # Скрипт обучения
│   ├── model_inference.py    # Использование модели
│   └── trained_aqi_model.pkl # Сохранённая модель
└── README.md                 # Этот файл
```

---

## 🚀 Как запустить проект

### 🔧 Требования

* Python 3.8+
* Node.js (с npm, yarn или pnpm)
* Git

---

### 1. 📦 Клонирование репозитория

```bash
git clone <URL_ВАШЕГО_РЕПОЗИТОРИЯ>
cd air_quality_predictor
```

---

### 2. 🛠 Настройка Бэкенда (Django)

#### 2.1 Перейти в директорию

```bash
cd backend
```

#### 2.2 Создать и активировать виртуальное окружение

```bash
python -m venv venv
# Linux/macOS:
source venv/bin/activate
# Windows:
.\venv\Scripts\activate
```

#### 2.3 Установить зависимости

```bash
pip install -r requirements.txt
```

> 💡 Если `requirements.txt` отсутствует:

```bash
pip freeze > requirements.txt
```

#### 2.4 Настроить переменные окружения

Создайте файл `.env` в `backend/air_quality_project/`:

```
OPENWEATHER_API_KEY=ВАШ_КЛЮЧ
OPENAQ_API_KEY=ВАШ_КЛЮЧ
TEMPO_API_KEY=ВАШ_КЛЮЧ
DJANGO_SECRET_KEY=ВАШ_СЕКРЕТНЫЙ_КЛЮЧ
DEBUG=True
```

> 🔐 Для генерации секретного ключа:

```python
import random, string
print("".join(random.choices(string.ascii_letters + string.digits + string.punctuation, k=50)))
```

Убедитесь, что в `settings.py` используются значения из `.env`:

```python
from decouple import config

SECRET_KEY = config('DJANGO_SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
OPENWEATHER_API_KEY = config('OPENWEATHER_API_KEY')
OPENAQ_API_KEY = config('OPENAQ_API_KEY', default='')
TEMPO_API_KEY = config('TEMPO_API_KEY', default='')
```

#### 2.5 Применить миграции

```bash
python manage.py makemigrations
python manage.py migrate
```

#### 2.6 Запустить сервер

```bash
python manage.py runserver
```

> 🌐 Бэкенд будет доступен по адресу: `http://localhost:8000/`

---

### 3. 🧠 Настройка ML-модели

#### 3.1 Перейти в директорию

```bash
cd ../ml_model
```

#### 3.2 Создать и активировать виртуальное окружение

```bash
python -m venv venv_ml
# Linux/macOS:
source venv_ml/bin/activate
# Windows:
.\venv_ml\Scripts\activate
```

#### 3.3 Установить зависимости

```bash
pip install -r requirements_ml.txt
```

> 💡 Если `requirements_ml.txt` отсутствует:

```bash
pip freeze > requirements_ml.txt
```

#### 3.4 Обучить модель

```bash
python model_trainer.py
```

> ✅ После этого появится файл `trained_aqi_model.pkl`.

#### 3.5 (По желанию) Деактивировать окружение

```bash
deactivate
```

---

### 4. 🎨 Настройка Фронтенда

#### 4.1 Перейти в директорию

```bash
cd ../frontend
```

#### 4.2 Установить зависимости

```bash
npm install
# или yarn install
# или pnpm install
```

#### 4.3 Настроить `.env`

Создайте файл `.env` в `frontend/`:

```
VITE_API_BASE_URL=http://localhost:8000
```

#### 4.4 Запустить Vite

```bash
npm run dev
# или yarn dev
# или pnpm dev
```

> 🌐 Фронтенд будет доступен по адресу: `http://localhost:5173/`

---

## 🧪 Как пользоваться приложением

1. Перейдите в браузере на `http://localhost:5173/`
2. Введите координаты (например, `55.75` и `37.61` — Москва)
3. Нажмите **"Get Data"**
4. Вы увидите:

   * **Текущий AQI (PM2.5)** с OpenAQ
   * **Текущую погоду** с OpenWeatherMap
   * **Прогноз AQI** на 24 и 48 часов от ML-модели
5. Раздел **Data Transparency** покажет:

   * Статус получения данных
   * Сравнение данных с TEMPO (заглушка)

---

## 📈 Потенциальные улучшения

* ✅ **Интеграция с TEMPO API** (реальные спутниковые данные от NASA)
* 🧠 **Прокачка ML-модели:** больше признаков, более мощные алгоритмы
* 🗺️ **Интерактивная карта** (например, с Leaflet/Mapbox)
* 🔐 **Аутентификация/авторизация** пользователей
* 🔔 **Push-уведомления** при плохом AQI
* 🧰 **Кэширование API-ответов**
* 🔄 **CI/CD** для автоматического развертывания

---

Если хочешь, могу подготовить Markdown-версию этого оформления или сделать PDF-документ для удобной печати и распространения.
