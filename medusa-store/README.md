# MedusaJS Currency Conversion API

This project implements a currency conversion API endpoint for MedusaJS v2.

## Features

- **Endpoint**: `GET /currency/convert`
- **External API**: Uses `open.er-api.com` for exchange rates.
- **Caching**: In-memory caching of rates for 1 hour.
- **Validation**: Validates `amount`, `from`, and `to` parameters.
- **Dockerized**: Includes `docker-compose.yml` for easy setup with PostgreSQL and Medusa.

## Setup & Running

### Prerequisites
- Docker and Docker Compose

### Steps
1. **Start the project**:
   ```bash
   docker-compose up -d --build
   ```
   This will start PostgreSQL and the Medusa server (in development mode).

2. **Run Migrations** (First time only):
   ```bash
   docker-compose exec medusa npx medusa db:migrate
   ```
   *Note: The `medusa` service must be running.*

3. **Access the API**:
   The server runs on `http://localhost:9000`.

## API Usage

### Convert Currency

**Request:**
```http
GET /currency/convert?amount=100&from=USD&to=EUR
```

**Parameters:**
- `amount` (required): The amount to convert (number, non-negative).
- `from` (required): Source currency code (3 letters, e.g., USD).
- `to` (required): Target currency code (3 letters, e.g., EUR).

**Response (Success):**
```json
{
  "from": "USD",
  "to": "EUR",
  "amount": 100,
  "rate": 0.85,
  "convertedAmount": 85,
  "cached": true
}
```

**Response (Error - Invalid Parameters):**
```json
{
  "message": "Invalid parameters",
  "errors": [
    {
      "code": "custom",
      "message": "Amount must be a non-negative number",
      "path": ["amount"]
    }
  ]
}
```

## Implementation Details

- **Route Location**: `src/api/currency/convert/route.ts`
  - *Note*: The route is placed at `/currency/convert` instead of `/store/currency/convert` to allow public access without requiring a Publishable API Key (which is enforced by default on `/store` routes in Medusa v2).
- **Caching**: Implemented using a simple `Map` with a timestamp check. TTL is set to 1 hour.
- **Validation**: Uses `zod` library.
