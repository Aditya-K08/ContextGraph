# Context Graph System

An interactive 2D force-directed graph visualization of SAP Order-to-Cash (O2C) data, integrated with a natural language AI agent. This system allows you to explore complex business entities and their relationships, while querying the underlying database using plain English.

## 🚀 Features

*   **Interactive Force-Directed Graph**: Visualizes relationships between Customers, Orders, Products, Deliveries, Invoices, Payments, Plants, and more.
*   **Natural Language Database Querying**: Built-in AI Agent (powered by LangChain & Google Gemini) translates English questions into SQL, executes them against the database, and provides insightful answers.
*   **Dynamic Node Highlighting**: The graph automatically pans, zooms, and highlights specific nodes referenced by the AI Agent in its answers.
*   **Deep Data Inspection**: Clicking on any node reveals the complete, raw SAP JSON data associated with that entity in a clean, structured grid format.
*   **Transparent AI Operations**: The chat interface displays the exact SQL queries generated and executed by the AI, providing transparency into its thought process.
*   **Modern 'Glassmorphism' UI**: A sleek, ultra-minimalist frontend built with Tailwind CSS.

## 🛠️ Technology Stack

**Frontend:**
*   React 18 + TypeScript + Vite
*   Tailwind CSS (for styling and glassmorphism effects)
*   `react-force-graph-2d` (for canvas-based graph rendering)
*   Lucide React (for iconography)
*   Axios

**Backend:**
*   Python 3.10+
*   FastAPI + Uvicorn
*   SQLAlchemy + SQLite
*   LangChain + `langchain-google-genai` (Gemini 1.5 Flash)

## 📦 Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   Python (3.8+)
*   A Google Gemini API Key

### 1. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    # Windows:
    .\venv\Scripts\activate
    # macOS/Linux:
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Set up environment variables:
    *   Create a `.env` file in the `backend` directory.
    *   Add your Gemini API key:
        ```env
        GOOGLE_API_KEY="your_api_key_here"
        ```
5.  Seed the database:
    *   The `sap-o2c-data` folder must contain the source JSONL dataset.
    *   Run the ingestion script to parse the JSON and populate the SQLite database:
        ```bash
        python ingest.py
        ```
6.  Start the FastAPI server:
    ```bash
    uvicorn main:app --reload
    ```
    *The API will be available at `http://localhost:8000`*

### 2. Frontend Setup

1.  Open a new terminal window and navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite development server:
    ```bash
    npm run dev
    ```
    *The app will be available at `http://localhost:5173`*

## 💡 Usage

*   **Explore**: Scroll to zoom in/out, click and drag to pan around the graph space. Hover over nodes to see their labels, or click them to open the Node Inspector modal.
*   **Ask Questions**: Open the right sidebar and ask the agent questions like:
    *   *"What is the total amount of invoice 9400635958?"*
    *   *"Show me all products ordered by customer Alice Corporation."*
    *   *"Which delivery contains product Widget A?"*

---
*Built as a proof-of-concept for unified business context intelligence.*
 