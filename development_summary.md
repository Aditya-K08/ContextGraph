# Context Graph System - Development Summary

This document summarizes the development process and tool integration for the **Context Graph System**, a platform designed to visualize complex relational data (like SAP O2C) as an interactive graph with natural language querying capabilities.

---

## 🛠️ Tool Integration & Technology Stack

The project builds upon a multi-layered architecture focused on data clarity and user-driven insights:

- **Backend (Python)**:
  - **FastAPI**: Provides a high-performance REST API for data retrieval and integration sessions.
  - **SQLAlchemy (SQLite)**: Manages consistent relational mapping for schema-dense datasets (Customers, Orders, Deliveries, etc.).
  - **LangChain & LLM Agent**: Translates natural language questions into precise SQL queries, bridging the gap between non-technical users and raw data.
- **Frontend (React + Vite)**:
  - **Force-Graph**: Handles the high-speed rendering of complex relationships as interactive nodes and links.
  - **Tailwind CSS**: Ensures a premium, "glassmorphism" aesthetic with a responsive layout.
  - **TypeScript**: Maintains type safety across the visualization logic and API data models.

---

## 🔄 Core Workflows

### 1. Interactive Graph Visualization
The system maps relational records to nodes and foreign-key relationships to links. 
- **Dynamic Centering**: Clicking a node centers it in view and zooms in, allowing users to drill down into specifics.
- **Highlighting**: When querying specific entities (e.g., a SAP ID), the system identifies the matching node and focuses the graph on it.

### 2. Natural Language to SQL Pipeline
The chat interface leverages metadata-driven prompting to generate SQL. 
- **Schema Awareness**: The system is aware of table columns (e.g., `sap_id`, `accounting_doc`, `total_amount`) to ensure accurate queries.
- **Response Mapping**: The LLM provides both the direct answer and the underlying SQL, ensuring transparency.

---

## 🛠️ Debugging & Iterative Refinement

The development followed a "user-first" iterative approach:

1. **UI De-cluttering**: Removed generic icons (avatar, search) and rotation controls that distracted from the core data visualization.
2. **Data-Rich Modals**: We transitioned from a basic node view to a comprehensive property display that surfaces *all* underlying database attributes, empowering the user with full context.
3. **API Stability**: Implemented robust environment variable handling and automated database initialization (seeding) to ensure the system starts reliably across different environments.
4. **Transparent Logic**: Built the "SQL View" directly into the UI, making it clear how human questions are translated into data operations.

---

## 💡 High-Quality Prompting Strategies

To further refine the system's behavior, use these structured prompt patterns:

### System & Behavior Prompts
*These are best used for setting the persona or refining logical rules.*
- **Context-Aware Querying**: *"You are an expert data analyst for SAP Order-to-Cash systems. When a user asks about an 'ID', prioritize searching the `sap_id` and `accounting_doc` columns. Ensure the SQL you generate is compatible with SQLite and uses JOINs only where necessary for clarity."*
- **Formatting Guidance**: *"Always include the `target_id` in your JSON response if the user mentions a specific order number or document ID. This allows the frontend to auto-highlight the relevant graph node."*

### User Query Prompts
*Direct questions that yield highly relevant results.*
- **Analytical**: *"What is the total revenue generated from customers in New York for the first quarter of 2025?"*
- **Trace-Focused**: *"Show me the delivery status and invoice amount for SAP ID ORDER_789."*
- **Relationship-Driven**: *"List all products that have been delivered to Alice Corporation but haven't been invoiced yet."*

---

## ✅ Final Note
The **Context Graph System** is now a stable, developer-ready foundation for navigating complex data models. Future expansions can include real-time SAP integration or predictive node clustering for anomaly detection.
