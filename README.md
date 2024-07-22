# Naologic Selection Project

This project was developed for the Naologic selection process. Follow the steps below to run the project:

## Prerequisites

1. **Docker**: Ensure you have Docker installed on your machine. It is used to create the MongoDB server.
2. **Node.js**: This project was created using Node.js 20.15.1 LTS. It has not been tested in other versions.
3. **OpenAI API Key**: You must have an OpenAI API Key.

## Configuration

1. Rename the `.env.example` file to `.env` and replace the variables as necessary.
2. Load the CSV file and place it in the `public` folder.

## Running the Project

1. Run Docker:

```bash
docker-compose up --build
```

2. Install dependencies:
```bash
npm install
```

3. Start the project:

```bash
npm run start:dev
```

This will create a cron job that will run once per night.

## Testing the Script

If you want to test the script manually, execute the following command via `curl`:

```bash
curl -X GET http://localhost:8080/etl > /dev/null
```

Have fun!