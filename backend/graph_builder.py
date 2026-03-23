from sqlalchemy.orm import Session
from database import (
    Customer, Product, Address, Order, OrderItem, Delivery, Invoice, Payment,
    Plant, StorageLocation, ScheduleLine, ProductPlant, JournalEntryItem,
    CustomerCompany, CustomerSalesArea
)

def build_graph_data(db: Session):
    nodes = []
    links = []
    
    # helper for adding nodes and edges to avoid duplicates if required
    node_ids = set()
    
    def add_node(n_id, n_label, n_group, properties):
        str_id = str(n_id)
        if str_id not in node_ids:
            nodes.append({
                "id": str_id,
                "label": n_label,
                "group": n_group,
                "properties": properties
            })
            node_ids.add(str_id)
            
    def add_edge(source, target, label):
        links.append({
            "source": str(source),
            "target": str(target),
            "label": label
        })

    # Fetch all data and build relationships
    # 1. Customers
    for c in db.query(Customer).all():
        add_node(f"C_{c.id}", f"{c.name} ({c.sap_id})", "Customer", {"sap_id": c.sap_id, "location": c.location})
        
    # 2. Addresses
    for a in db.query(Address).all():
        add_node(f"A_{a.id}", f"Addr {a.sap_id}", "Address", {"street": a.street, "city": a.city, "postal_code": a.postal_code})

    # 3. Products
    for p in db.query(Product).all():
        add_node(f"P_{p.id}", f"{p.name} ({p.sap_id})", "Product", {"sap_id": p.sap_id, "category": p.category, "price": p.price})

    # 4. Orders
    for o in db.query(Order).all():
        o_node_id = f"O_{o.id}"
        add_node(o_node_id, f"Order {o.sap_id}", "Order", {"sap_id": o.sap_id, "date": str(o.order_date), "amount": o.total_amount, "currency": o.currency})
        # Customer -> Order
        if o.customer_id:
            add_edge(f"C_{o.customer_id}", o_node_id, "PLACED")
        # Order -> Address
        if o.address_id:
            add_edge(o_node_id, f"A_{o.address_id}", "DELIVERS_TO")
        
    # 5. OrderItems
    for oi in db.query(OrderItem).all():
        oi_node_id = f"OI_{oi.id}"
        add_node(oi_node_id, f"Item {oi.sap_id} (Qty: {oi.quantity})", "OrderItem", {"sap_id": oi.sap_id, "quantity": oi.quantity, "unit_price": oi.unit_price})
        # Order -> OrderItem
        if oi.order_id:
            add_edge(f"O_{oi.order_id}", oi_node_id, "CONTAINS")
        # OrderItem -> Product
        if oi.product_id:
            add_edge(oi_node_id, f"P_{oi.product_id}", "IS_PRODUCT")

    # 6. Deliveries
    for d in db.query(Delivery).all():
        d_node_id = f"D_{d.id}"
        add_node(d_node_id, f"Delivery {d.sap_id} ({d.status})", "Delivery", {"sap_id": d.sap_id, "status": d.status, "date": str(d.delivery_date), "shipping_point": d.shipping_point})
        # Order -> Delivery
        if d.order_id:
            add_edge(f"O_{d.order_id}", d_node_id, "HAS_DELIVERY")

    # 7. Invoices
    for i in db.query(Invoice).all():
        i_node_id = f"I_{i.id}"
        add_node(i_node_id, f"Invoice {i.sap_id} ({i.status})", "Invoice", {
            "sap_id": i.sap_id, 
            "accounting_doc": i.accounting_doc,
            "amount": i.amount, 
            "currency": i.currency,
            "date": str(i.issue_date)
        })
        # Order -> Invoice
        if i.order_id:
            add_edge(f"O_{i.order_id}", i_node_id, "BILLED_BY")
        # Delivery -> Invoice
        if i.delivery_id:
            add_edge(f"D_{i.delivery_id}", i_node_id, "SOURCE_DELIVERY")
        
    # 8. Payments
    for p in db.query(Payment).all():
        p_node_id = f"PAY_{p.id}"
        add_node(p_node_id, f"Payment {p.sap_id}", "Payment", {"sap_id": p.sap_id, "amount": p.amount, "currency": p.currency, "date": str(p.payment_date), "method": p.method})
        # Invoice -> Payment
        if p.invoice_id:
            add_edge(f"I_{p.invoice_id}", p_node_id, "PAID_BY")

    # 9. Extended Entities: Plants, StorageLocations, ScheduleLines
    
    for pl in db.query(Plant).all():
        add_node(f"PLANT_{pl.id}", f"Plant {pl.sap_id}", "Plant", {"name": pl.name})

    for sl in db.query(StorageLocation).all():
        sl_id = f"SL_{sl.id}"
        add_node(sl_id, f"Loc {sl.sap_id}", "StorageLocation", {"name": sl.name})
        if sl.plant_id:
            add_edge(f"PLANT_{sl.plant_id}", sl_id, "HOSTS")

    for sl_line in db.query(ScheduleLine).all():
        sl_line_id = f"SLINE_{sl_line.id}"
        add_node(sl_line_id, f"Sched {sl_line.sap_id}", "ScheduleLine", {"qty": sl_line.order_quantity, "confirmed": sl_line.confirmed_quantity, "date": str(sl_line.delivery_date)})
        if sl_line.order_item_id:
            add_edge(f"OI_{sl_line.order_item_id}", sl_line_id, "SCHEDULED")

    for pp in db.query(ProductPlant).all():
        add_edge(f"P_{pp.product_id}", f"PLANT_{pp.plant_id}", "PRODUCED_AT")

    for ji in db.query(JournalEntryItem).all():
        ji_id = f"JI_{ji.id}"
        add_node(ji_id, f"JE {ji.sap_id}", "JournalEntryItem", {"account": ji.account, "amount": ji.amount})
        if ji.invoice_id:
            add_edge(f"I_{ji.invoice_id}", ji_id, "POSTS_TO")

    return {
        "nodes": nodes,
        "links": links
    }
