import json
import os
from datetime import datetime
from sqlalchemy.orm import Session
from database import (
    SessionLocal, init_db, Customer, Product, Address, Order, OrderItem, 
    Delivery, Invoice, Payment, Plant, StorageLocation, ScheduleLine, 
    CustomerCompany, CustomerSalesArea, ProductPlant, JournalEntryItem,
    engine, Base
)

DATA_DIR = "sap-o2c-data"

def parse_date(date_str):
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str.replace('Z', '+00:00')).date()
    except Exception:
        return None

def clear_db():
    print("Clearing existing data...")
    Base.metadata.drop_all(bind=engine)
    init_db()

def ingest_jsonl(file_path, entity_class, mapping_func):
    db = SessionLocal()
    count = 0
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                data = json.loads(line)
                obj = mapping_func(data)
                if obj:
                    db.add(obj)
                    count += 1
                if count % 100 == 0:
                    db.commit()
        db.commit()
    except Exception as e:
        print(f"Error ingesting {file_path}: {e}")
        db.rollback()
    finally:
        db.close()
    return count

def map_customer(data):
    return Customer(
        sap_id=data.get('businessPartner'),
        name=data.get('businessPartnerName'),
        location="",
        raw_data=json.dumps(data)
    )

def map_product(data):
    return Product(
        sap_id=data.get('product'),
        name=data.get('productType'), 
        category=data.get('productGroup'),
        price=0.0,
        raw_data=json.dumps(data)
    )

def map_order(data):
    db = SessionLocal()
    customer = db.query(Customer).filter(Customer.sap_id == data.get('soldToParty')).first()
    db.close()
    if not customer:
        return None
        
    return Order(
        sap_id=data.get('salesOrder'),
        customer_id=customer.id,
        order_date=parse_date(data.get('creationDate')),
        total_amount=float(data.get('totalNetAmount', 0)),
        currency=data.get('transactionCurrency'),
        raw_data=json.dumps(data)
    )

def map_order_item(data):
    db = SessionLocal()
    order = db.query(Order).filter(Order.sap_id == data.get('salesOrder')).first()
    product = db.query(Product).filter(Product.sap_id == data.get('material')).first()
    db.close()
    
    if not order or not product:
        return None
        
    sap_id = f"{data.get('salesOrder')}_{data.get('salesOrderItem')}"
    return OrderItem(
        sap_id=sap_id,
        order_id=order.id,
        product_id=product.id,
        quantity=float(data.get('requestedQuantity', 0)),
        unit_price=float(data.get('netAmount', 0)) / float(data.get('requestedQuantity')) if float(data.get('requestedQuantity', 0)) > 0 else 0,
        raw_data=json.dumps(data)
    )

def map_delivery(data):
    db = SessionLocal()
    db.close()
    return Delivery(
        sap_id=data.get('deliveryDocument'),
        status=data.get('overallGoodsMovementStatus'),
        delivery_date=parse_date(data.get('creationDate')),
        shipping_point=data.get('shippingPoint'),
        raw_data=json.dumps(data)
    )

def map_invoice(data):
    return Invoice(
        sap_id=data.get('billingDocument'),
        accounting_doc=data.get('accountingDocument'),
        amount=float(data.get('totalNetAmount', 0)),
        currency=data.get('transactionCurrency'),
        status="Cancelled" if data.get('billingDocumentIsCancelled') else "Issued",
        issue_date=parse_date(data.get('billingDocumentDate')),
        raw_data=json.dumps(data)
    )

def map_payment(data):
    db = SessionLocal()
    invoice = db.query(Invoice).filter(Invoice.accounting_doc == data.get('accountingDocument')).first()
    db.close()
    
    if not invoice:
        return None
        
    sap_id = f"{data.get('accountingDocument')}_{data.get('accountingDocumentItem')}"
    return Payment(
        sap_id=sap_id,
        invoice_id=invoice.id,
        amount=float(data.get('amountInTransactionCurrency', 0)),
        currency=data.get('transactionCurrency'),
        payment_date=parse_date(data.get('clearingDate')),
        method="Bank Transfer",
        raw_data=json.dumps(data)
    )

def map_plant(data):
    return Plant(
        sap_id=data.get('plant'),
        name=data.get('plantName') or data.get('plant'),
        raw_data=json.dumps(data)
    )

def map_storage_location(data):
    db = SessionLocal()
    plant = db.query(Plant).filter(Plant.sap_id == data.get('plant')).first()
    db.close()
    return StorageLocation(
        sap_id=f"{data.get('plant')}_{data.get('storageLocation')}",
        name=data.get('storageLocationName') or data.get('storageLocation'),
        plant_id=plant.id if plant else None,
        raw_data=json.dumps(data)
    )

def map_schedule_line(data):
    db = SessionLocal()
    item_sap_id = f"{data.get('salesOrder')}_{data.get('salesOrderItem')}"
    item = db.query(OrderItem).filter(OrderItem.sap_id == item_sap_id).first()
    db.close()
    if not item: return None
    return ScheduleLine(
        sap_id=f"{item_sap_id}_{data.get('scheduleLine')}",
        order_item_id=item.id,
        delivery_date=parse_date(data.get('requestedDeliveryDate')),
        order_quantity=float(data.get('orderQuantity', 0)),
        confirmed_quantity=float(data.get('confrimedQtyInOrderQtyUnit', 0)),
        raw_data=json.dumps(data)
    )

from database import CustomerCompany, CustomerSalesArea

def map_cust_company(data):
    db = SessionLocal()
    cust = db.query(Customer).filter(Customer.sap_id == data.get('customer')).first()
    db.close()
    if not cust: return None
    return CustomerCompany(
        customer_id=cust.id, 
        company_code=data.get('companyCode'),
        raw_data=json.dumps(data)
    )

def map_cust_sales(data):
    db = SessionLocal()
    cust = db.query(Customer).filter(Customer.sap_id == data.get('customer')).first()
    db.close()
    if not cust: return None
    return CustomerSalesArea(
        customer_id=cust.id,
        sales_org=data.get('salesOrganization'),
        dist_channel=data.get('distributionChannel'),
        division=data.get('division'),
        raw_data=json.dumps(data)
    )

def map_product_plant(data):
    db = SessionLocal()
    product = db.query(Product).filter(Product.sap_id == data.get('product')).first()
    plant = db.query(Plant).filter(Plant.sap_id == data.get('plant')).first()
    db.close()
    if not product or not plant: return None
    return ProductPlant(
        product_id=product.id, 
        plant_id=plant.id,
        raw_data=json.dumps(data)
    )

def map_journal_item(data):
    db = SessionLocal()
    invoice = db.query(Invoice).filter(Invoice.accounting_doc == data.get('accountingDocument')).first()
    db.close()
    if not invoice: return None
    sap_id = f"{data.get('accountingDocument')}_{data.get('accountingDocumentItem')}"
    return JournalEntryItem(
        sap_id=sap_id,
        invoice_id=invoice.id,
        amount=float(data.get('amountInTransactionCurrency', 0)),
        account=data.get('glAccount'),
        raw_data=json.dumps(data)
    )

def map_billing_cancellation(data):
    db = SessionLocal()
    invoice = db.query(Invoice).filter(Invoice.sap_id == data.get('billingDocument')).first()
    if invoice:
        invoice.status = "Cancelled"
        db.commit()
    db.close()
    return None

def main():
    clear_db()
    
    entities = [
        ("business_partners", Customer, map_customer),
        ("products", Product, map_product),
        ("plants", Plant, map_plant),
        ("product_storage_locations", StorageLocation, map_storage_location),
        ("sales_order_headers", Order, map_order),
        ("sales_order_items", OrderItem, map_order_item),
        ("sales_order_schedule_lines", ScheduleLine, map_schedule_line),
        ("outbound_delivery_headers", Delivery, map_delivery),
        ("billing_document_headers", Invoice, map_invoice),
        ("payments_accounts_receivable", Payment, map_payment),
        ("customer_company_assignments", CustomerCompany, map_cust_company),
        ("customer_sales_area_assignments", CustomerSalesArea, map_cust_sales),
        ("product_plants", ProductPlant, map_product_plant),
        ("journal_entry_items_accounts_receivable", JournalEntryItem, map_journal_item),
        ("billing_document_cancellations", None, map_billing_cancellation)
    ]
    
    for folder, cls, mapper in entities:
        folder_path = os.path.join(DATA_DIR, folder)
        if not os.path.exists(folder_path):
            print(f"Skipping {folder}, path not found.")
            continue
            
        print(f"Ingesting {folder}...")
        total_ingested = 0
        for file in os.listdir(folder_path):
            if file.endswith(".jsonl"):
                total_ingested += ingest_jsonl(os.path.join(folder_path, file), cls, mapper)
        print(f"Done. Ingested {total_ingested} {cls.__name__ if cls else folder} records.")

    print("Post-processing links...")
    db = SessionLocal()
    
    delivery_items_folder = os.path.join(DATA_DIR, "outbound_delivery_items")
    for file in os.listdir(delivery_items_folder):
        if file.endswith(".jsonl"):
            with open(os.path.join(delivery_items_folder, file), 'r', encoding='utf-8') as f:
                for line in f:
                    data = json.loads(line)
                    delivery = db.query(Delivery).filter(Delivery.sap_id == data.get('deliveryDocument')).first()
                    order = db.query(Order).filter(Order.sap_id == data.get('referenceSdDocument')).first()
                    if delivery and order:
                        delivery.order_id = order.id
            db.commit()

    billing_items_folder = os.path.join(DATA_DIR, "billing_document_items")
    for file in os.listdir(billing_items_folder):
        if file.endswith(".jsonl"):
            with open(os.path.join(billing_items_folder, file), 'r', encoding='utf-8') as f:
                for line in f:
                    data = json.loads(line)
                    invoice = db.query(Invoice).filter(Invoice.sap_id == data.get('billingDocument')).first()
    
                    delivery = db.query(Delivery).filter(Delivery.sap_id == data.get('referenceSdDocument')).first()
                    if invoice and delivery:
                        invoice.delivery_id = delivery.id
                        invoice.order_id = delivery.order_id
            db.commit()
            
    prod_desc_folder = os.path.join(DATA_DIR, "product_descriptions")
    for file in os.listdir(prod_desc_folder):
        if file.endswith(".jsonl"):
            with open(os.path.join(prod_desc_folder, file), 'r', encoding='utf-8') as f:
                for line in f:
                    data = json.loads(line)
                    product = db.query(Product).filter(Product.sap_id == data.get('product')).first()
                    if product:
                        product.name = data.get('productDescription')
            db.commit()

    addr_folder = os.path.join(DATA_DIR, "business_partner_addresses")
    for file in os.listdir(addr_folder):
        if file.endswith(".jsonl"):
            with open(os.path.join(addr_folder, file), 'r', encoding='utf-8') as f:
                for line in f:
                    data = json.loads(line)
                    customer = db.query(Customer).filter(Customer.sap_id == data.get('businessPartner')).first()
                    if customer:
                        customer.location = f"{data.get('cityName')}, {data.get('country')}"
            db.commit()

    db.close()
    print("Ingestion complete.")

if __name__ == "__main__":
    main()
