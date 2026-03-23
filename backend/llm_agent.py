import os
from langchain_community.utilities import SQLDatabase
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_classic.chains import create_sql_query_chain
from langchain_community.tools import QuerySQLDatabaseTool
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

load_dotenv()

# We need a system message strictly restricting to the dataset only string.
GUARDRAIL_PROMPT = """You are an AI assistant for a business context graph system. 
You answer questions ONLY related to the provided database which includes Orders, Deliveries, Invoices, Payments, Customers, Products, Plants, Storage Locations, and Schedule Lines.

SCHEMA CONTEXT:
- 'sap_id' is the primary business identifier for all entities (e.g., '91150187').
- 'Journal' or 'Journal Entry' usually refers to 'Invoice.accounting_doc' or 'JournalEntryItem'.
- 'Plant' refers to the 'plants' table.
- 'Storage Location' refers to 'storage_locations'.
- 'Schedule Line' refers to 'schedule_lines'.
- To find an Invoice for a particular Delivery, join 'invoices' on 'delivery_id'.

If the user's query asks about general knowledge, creative writing, or unrelated topics, you must reject it with exactly:
"This system is designed to answer questions related to the provided dataset only."

Question: {question}
SQL Query: {query}
SQL Result: {result}
Answer:"""

QUERY_PROMPT_TEMPLATE = """You are a SQLite expert. Given an input question, create a syntactically correct SQLite query to run.
Unless the user specifies in his question a specific number of examples to obtain, query for at most 5 results using the LIMIT clause as per SQLite.
You can order the results to return the most informative data in the database.
Never query for all columns from a table. You must query only the columns that are needed to answer the question.
Wrap each column name in double quotes (") to denote them as identifiers.
Pay attention to use only the column names you can see in the tables below. Be careful not to query for columns that do not exist.
Also, pay attention to which column is in which table.

Terminology:
- 'Journal' -> invoices.accounting_doc or journal_entry_items
- 'Plant' -> plants.sap_id
- 'Loc' or 'Location' -> storage_locations.sap_id
- 'Schedule' -> schedule_lines.sap_id
- 'SAP ID' -> Use the 'sap_id' column of the relevant table.
- Search for IDs as STRINGS (e.g., sap_id = '91150187').
- Output ONLY the SQL query. No markdown formatting, no code blocks.

Only use the following tables:
{table_info}

Question: {input}
Top K: {top_k}"""

class ContextLLMAgent:
    def __init__(self, db_uri: str = "sqlite:///./context_graph.db"):
        self.db = SQLDatabase.from_uri(db_uri)
        # Using a default or checking for key
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("WARNING: GOOGLE_API_KEY environment variable not set. LLM queries will fail.")
        
        self.llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)
        self.execute_query = QuerySQLDatabaseTool(db=self.db)
        
        # 1. Chain to write query
        query_prompt = PromptTemplate.from_template(QUERY_PROMPT_TEMPLATE)
        self.write_query = create_sql_query_chain(self.llm, self.db, prompt=query_prompt)
        
        # 2. Chain to formulate answer based on results and guardrails
        self.answer_prompt = PromptTemplate.from_template(GUARDRAIL_PROMPT)

        
        # Combine all to form complete execution chain
        self.chain = (
            RunnablePassthrough.assign(query=self.write_query).assign(
                result=lambda x: self.execute_query.invoke(x["query"])
            )
            | self.answer_prompt
            | self.llm
            | StrOutputParser()
        )

    def clean_sql(self, sql: str) -> str:
        """Strip markdown code blocks and whitespace."""
        # Simple cleanup
        s = sql.strip()
        if s.startswith("```sql"):
            s = s[6:]
        if s.startswith("```"):
            s = s[3:]
        if s.endswith("```"):
            s = s[:-3]
        return s.strip()

    def query(self, question: str) -> dict:
        try:
            # First get the generated SQL
            generated_sql = self.write_query.invoke({"question": question})
            cleaned_sql = self.clean_sql(generated_sql)
            
            # Simple pre-check heuristic
            lower_q = question.lower()
            if any(word in lower_q for word in ["poem", "recipe", "joke", "president", "weather", "capital of"]):
                return {
                    "answer": "This system is designed to answer questions related to the provided dataset only.",
                    "sql": "",
                    "target_id": None
                }

            if "SELECT" not in cleaned_sql.upper():
                  return {
                    "answer": "This system is designed to answer questions related to the provided dataset only.",
                    "sql": "",
                    "target_id": None
                }

            # Manually execute the flow to ensure we use cleaned_sql
            sql_result = self.execute_query.invoke(cleaned_sql)
            
            # Final answer chain
            final_answer = (
                self.answer_prompt 
                | self.llm 
                | StrOutputParser()
            ).invoke({
                "question": question,
                "query": cleaned_sql,
                "result": sql_result
            })

            # Attempt to extract an ID for the frontend to highlight
            # We look for common SAP ID patterns in the result or answer
            import re
            ids = re.findall(r'\b\d{6,10}(?:_\d+)?\b', str(sql_result) + " " + final_answer)
            target_id = ids[0] if ids else None

            return {
                "answer": final_answer,
                "sql": cleaned_sql,
                "target_id": target_id
            }
        except Exception as e:
            return {
                "answer": f"Error fulfilling request. {str(e)}",
                "sql": "",
                "target_id": None
            }
