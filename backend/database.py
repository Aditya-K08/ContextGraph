from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, Date
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import date, timedelta
import random

Base = declarative_base()

class Customer(Base):
    __tablename__ = 'customers'
    id = Column(Integer, primary_key=True, index=True)
    sap_id = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    location = Column(String)
    
class Product(Base):
    __tablename__ = 'products'
    id = Column(Integer, primary_key=True, index=True)
    sap_id = Column(String, unique=True, index=True)
    name = Column(String)
    category = Column(String)
    price = Column(Float)

class Address(Base):
    __tablename__ = 'addresses'
    id = Column(Integer, primary_key=True, index=True)
    sap_id = Column(String, unique=True, index=True)
    street = Column(String)
    city = Column(String)
    postal_code = Column(String)

class Order(Base):
    __tablename__ = 'orders'
    id = Column(Integer, primary_key=True, index=True)
    sap_id = Column(String, unique=True, index=True)
    customer_id = Column(Integer, ForeignKey('customers.id'))
    address_id = Column(Integer, ForeignKey('addresses.id'))
    order_date = Column(Date)
    total_amount = Column(Float)
    currency = Column(String)
    
    customer = relationship("Customer")
    address = relationship("Address")

class OrderItem(Base):
    __tablename__ = 'order_items'
    id = Column(Integer, primary_key=True, index=True)
    sap_id = Column(String, unique=True, index=True) # salesOrder + salesOrderItem
    order_id = Column(Integer, ForeignKey('orders.id'))
    product_id = Column(Integer, ForeignKey('products.id'))
    quantity = Column(Float)
    unit_price = Column(Float)

    order = relationship("Order", backref="items")
    product = relationship("Product")

class Delivery(Base):
    __tablename__ = 'deliveries'
    id = Column(Integer, primary_key=True, index=True)
    sap_id = Column(String, unique=True, index=True)
    order_id = Column(Integer, ForeignKey('orders.id'))
    status = Column(String)
    delivery_date = Column(Date)
    shipping_point = Column(String)

    order = relationship("Order", backref="deliveries")

class Invoice(Base):
    __tablename__ = 'invoices'
    id = Column(Integer, primary_key=True, index=True)
    sap_id = Column(String, unique=True, index=True)
    order_id = Column(Integer, ForeignKey('orders.id'))
    delivery_id = Column(Integer, ForeignKey('deliveries.id'))
    accounting_doc = Column(String, index=True)
    amount = Column(Float)
    currency = Column(String)
    status = Column(String)
    issue_date = Column(Date)

    order = relationship("Order", backref="invoices")
    delivery = relationship("Delivery", backref="invoices")

class Payment(Base):
    __tablename__ = 'payments'
    id = Column(Integer, primary_key=True, index=True)
    sap_id = Column(String, unique=True, index=True) # accountingDocument + accountingDocumentItem
    invoice_id = Column(Integer, ForeignKey('invoices.id'))
    amount = Column(Float)
    currency = Column(String)
    payment_date = Column(Date)
    method = Column(String)
    
    invoice = relationship("Invoice", backref="payments")

class Plant(Base):
    __tablename__ = 'plants'
    id = Column(Integer, primary_key=True, index=True)
    sap_id = Column(String, unique=True, index=True)
    name = Column(String)

class StorageLocation(Base):
    __tablename__ = 'storage_locations'
    id = Column(Integer, primary_key=True, index=True)
    sap_id = Column(String, unique=True, index=True)
    name = Column(String)
    plant_id = Column(Integer, ForeignKey('plants.id'))

class ScheduleLine(Base):
    __tablename__ = 'schedule_lines'
    id = Column(Integer, primary_key=True, index=True)
    sap_id = Column(String, unique=True, index=True) # salesOrder + salesOrderItem + scheduleLine
    order_item_id = Column(Integer, ForeignKey('order_items.id'))
    delivery_date = Column(Date)
    order_quantity = Column(Float)
    confirmed_quantity = Column(Float)

class CustomerCompany(Base):
    __tablename__ = 'customer_companies'
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey('customers.id'))
    company_code = Column(String)

class CustomerSalesArea(Base):
    __tablename__ = 'customer_sales_areas'
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey('customers.id'))
    sales_org = Column(String)
    dist_channel = Column(String)
    division = Column(String)

class ProductPlant(Base):
    __tablename__ = 'product_plants'
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey('products.id'))
    plant_id = Column(Integer, ForeignKey('plants.id'))

class JournalEntryItem(Base):
    __tablename__ = 'journal_entry_items'
    id = Column(Integer, primary_key=True, index=True)
    sap_id = Column(String, unique=True, index=True) # accountingDocument + item
    invoice_id = Column(Integer, ForeignKey('invoices.id'))
    amount = Column(Float)
    account = Column(String)

engine = create_engine('sqlite:///./context_graph.db')
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
    
def seed_data():
    db = SessionLocal()
    # Check if empty
    if db.query(Customer).first():
        db.close()
        return

    # Create Customers
    customers = [
        Customer(name="Alice Corporation", location="New York"),
        Customer(name="Bob Industries", location="San Francisco"),
        Customer(name="Charlie LLC", location="London"),
        Customer(name="Dave Enterprises", location="Berlin")
    ]
    db.add_all(customers)
    
    # Create Addresses
    addresses = [
        Address(street="123 Alpha St", city="New York", postal_code="10001"),
        Address(street="456 Beta Ave", city="San Francisco", postal_code="94105"),
        Address(street="789 Gamma Rd", city="London", postal_code="EC1A 1BB"),
        Address(street="101 Delta Blvd", city="Berlin", postal_code="10115")
    ]
    db.add_all(addresses)
    
    # Create Products
    products = [
        Product(name="Widget A", category="Hardware", price=10.50),
        Product(name="Widget B", category="Hardware", price=15.00),
        Product(name="Software License C", category="Software", price=299.99),
        Product(name="Consulting Hours", category="Service", price=150.00)
    ]
    db.add_all(products)
    
    db.commit()

    # Create Orders with items, deliveries, invoices, and payments
    base_date = date(2025, 1, 1)
    for i in range(1, 16):  # 15 orders
        c_idx = random.randint(0, 3)
        cust = customers[c_idx]
        addr = addresses[c_idx]
        
        o_date = base_date + timedelta(days=random.randint(0, 100))
        
        # Determine items
        num_items = random.randint(1, 3)
        total_amount = 0
        items_objs = []
        for _ in range(num_items):
            prod = random.choice(products)
            qty = random.randint(1, 5)
            total_amount += prod.price * qty
            items_objs.append(OrderItem(product_id=prod.id, quantity=qty, unit_price=prod.price))
            
        order = Order(customer_id=cust.id, address_id=addr.id, order_date=o_date, total_amount=total_amount)
        db.add(order)
        db.commit() # commit to get order id
        
        for item in items_objs:
            item.order_id = order.id
            db.add(item)
            
        # Delivery flow
        # ~80% delivered, ~20% pending
        has_delivery = random.random() > 0.2
        if has_delivery:
            del_date = o_date + timedelta(days=random.randint(1, 5))
            delivery = Delivery(order_id=order.id, status=random.choice(["Delivered", "In Transit"]), delivery_date=del_date)
            db.add(delivery)
            
        # Invoice flow
        # ~90% invoiced
        has_invoice = random.random() > 0.1
        inv = None
        if has_invoice:
            inv_date = o_date + timedelta(days=random.randint(0, 3))
            inv = Invoice(order_id=order.id, amount=total_amount, status="Issued", issue_date=inv_date)
            db.add(inv)
            db.commit()
            
            # Payment flow
            # ~70% paid if invoiced
            if random.random() > 0.3:
                pay_date = inv_date + timedelta(days=random.randint(1, 30))
                payment = Payment(invoice_id=inv.id, amount=total_amount, payment_date=pay_date, method=random.choice(["Credit Card", "Bank Transfer", "Check"]))
                db.add(payment)
                inv.status = "Paid"

        db.commit()
    db.close()

if __name__ == "__main__":
    init_db()
    seed_data()
    print("Database initialized and planted dummy data if empty.")
