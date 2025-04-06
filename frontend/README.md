# frontend

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
## Setup Instructions

### Backend

1.  **Navigate to the Backend Directory:**

    ```bash
    cd backend
    ```

2.  **Install Dependencies:**

    ```bash
    npm install
    ```

3.  **Create `.env` File:**
    Create a `.env` file in the `backend` directory and add your Binance API key and secret:

    ```
    BINANCE_API_KEY=your_binance_api_key
    BINANCE_API_SECRET=your_binance_api_secret
    ```
    You can also set the default trading pair:
    ```
    BINANCE_TRADING_PAIR=BTCUSDT
    ```
    And the port:
    ```
    PORT=8080
    ```

4.  **Start the Backend Server:**

    ```bash
    node server.js
    ```

### Frontend

1.  **Navigate to the Frontend Directory:**

    ```bash
    cd ../frontend
    ```

2.  **Install Dependencies:**

    ```bash
    npm install
    ```

3.  **Start the Frontend Development Server:**

    ```bash
    npm run dev
    ```

## Running the Application

1.  **Start the Backend:** Follow the backend setup instructions to start the Node.js server.
2.  **Start the Frontend:** Follow the frontend setup instructions to start the Vue.js development server.
3.  **Open in Browser:** Open your web browser and go to the URL provided by the frontend development server (usually `http://localhost:5173`).

## Testing

### Backend

1.  **Navigate to the Backend Directory:**

    ```bash
    cd backend
    ```

2.  **Run Tests:**

    ```bash
    npm test
    ```

### Frontend

1.  **Navigate to the Frontend Directory:**

    ```bash
    cd ../frontend
    ```

2.  **Run Tests:**

    ```bash
    npm run test:unit
    ```

## Code Style and Documentation

*   **Consistent Styling:** The project uses a consistent, sober, and modern design across all components.
*   **Centralized CSS:** Common styles are centralized in `src/assets/styles/main.css` using CSS variables and utility classes.
* **Documentation**: The code is documented using JSDoc.

## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

## License

MIT

npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
