# bcryptServer

A microservice that expose a bcrypt API server, to separate computational expensive hashing from nodejs application.

This package includes both a **server** component (bcryptServer) and a **client** library (bcryptClient) for easy integration.

## Server

### Starting the Server

```bash
# Build the TypeScript code
npm run build

# Start the server with default configuration
npm start

# Or start with a custom configuration file
npm start -- -c /path/to/config.json
# or
npm start -- --config /path/to/config.json
```

### Configuration

The server can be configured using a JSON configuration file. By default, it uses these settings:

```json
{
  "minWorkers": 2,        // Minimum number of worker processes (default: half of CPU cores)
  "maxWorkers": 4,        // Maximum number of worker processes (default: number of CPU cores)
  "rounds": 12,           // Default bcrypt rounds
  "logpath": "./log",     // Directory for log files
  "ip": "127.0.0.1",      // IP address to bind
  "port": 8001,           // Port to listen on
  "certificate": null,    // Path to SSL certificate file
  "certificateKey": null  // Path to SSL certificate key file
}
```

Create a custom configuration file and pass it with the `-c` or `--config` option to override any of these defaults.

### API Endpoints

#### HASH
POST `/hash`

Must receive, in json format, a field named `data` that will be hashed and a field named `rounds` with the number of the salting rounds.

It return a json containg a result field with the hash or an error field contain the text description of the error.

Example request:
```json
{
  "data": "password123",
  "rounds": 12
}
```

Example response:
```json
{
  "result": "$2b$12$..."
}
```

#### COMPARE
POST `/compare`

Must receive, in json format, a field named `data` with the data to be hashed and a field named 'hash' with the existing hash.

It return a json containg a boolean result field or an error field contain the text description of the error.

Example request:
```json
{
  "data": "password123",
  "hash": "$2b$12$..."
}
```

Example response:
```json
{
  "result": true
}
```

### HTTPS Configuration
To enable HTTPS, configure the `certificate` and `certificateKey` paths in your configuration file:

```json
{
  "certificate": "/path/to/cert.pem",
  "certificateKey": "/path/to/key.pem"
}
```

### Logging and Signals

- Logs are written to `{logpath}/bcryptServer.log`
- Send SIGHUP signal to reload SSL certificates and reopen log files without restarting

## Client

The package includes a TypeScript/JavaScript client library that provides:
- Easy integration with the bcrypt server
- Automatic fallback to local bcrypt computation if the server is unavailable
- Connection pooling and optimized performance
- TypeScript support

### Installation

```bash
npm install bcryptserver
```

### Client Usage

```typescript
import { bcryptClient } from 'bcryptserver';

// Initialize the client with default settings
const client = new bcryptClient('http://localhost:8001');

// Or with custom configuration
const client = new bcryptClient(
	'http://localhost:8001',  // Server URL
	undefined,                // CA certificate (for HTTPS)
	-1,                      // Max local workers (auto-detect)
	12                       // Default rounds
);

// Hash a password
const hashResult = await client.hash('myPassword', 12);
if (hashResult.result) {
	console.log('Hash:', hashResult.result);
} else {
	console.error('Error:', hashResult.error);
}

// Compare a password
const compareResult = await client.compare('myPassword', hashResult.result);
if (compareResult.result !== undefined) {
	console.log('Match:', compareResult.result);
} else {
	console.error('Error:', compareResult.error);
}

// Clean up when done
await client.destroy();
```

### Client Configuration

The bcryptClient constructor accepts the following parameters:

- `baseUrl` (string): The URL of the bcrypt server
- `cacert` (Buffer, optional): CA certificate for HTTPS connections
- `maxConcurrencyFallback` (number, default: -1): Maximum worker threads for local fallback
    - `-1`: Auto-detect (uses 1/4 of CPU cores, minimum 1)
    - `0`: Disable fallback completely
    - `> 0`: Use specified number of workers
- `rounds` (number, default: 12): Default number of salt rounds

### Fallback Mechanism

The client includes an automatic fallback mechanism:
- If the server is unavailable or returns an error, the client will automatically compute the hash locally
- This ensures your application remains functional even if the bcrypt server is down
- Local computation uses worker threads to avoid blocking the main thread
- Set `maxConcurrencyFallback` to 0 to disable this feature

### Error Handling

Both hash and compare methods return an object with either:
- `result`: The successful result (string for hash, boolean for compare)
- `error`: An error message if the operation failed

Always check for the presence of `error` before using `result`.

---

Inspired by BaaS (https://auth0.engineering/bcrypt-as-a-service-9e71707bda47) but with less dependencies.