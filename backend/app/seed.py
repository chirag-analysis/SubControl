"""Seed realistic production demo data for SubControl."""

import uuid
from datetime import date, timedelta
from decimal import Decimal

from .database import Base, SessionLocal, engine
from .models.category import Category
from .models.payment import PaymentHistory
from .models.subscription import Subscription
from .services.savings_service import detect_savings_opportunities


def seed_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if data already exists
    if db.query(Subscription).first():
        print("Database already contains subscriptions. Skipping seeding.")
        db.close()
        return

    print("Seeding categories...")
    categories = [
        Category(
            name="Engineering & Infrastructure",
            description="Cloud providers, developer tools, and hosting services",
            budget_limit=Decimal("15000.00"),
        ),
        Category(
            name="Productivity & Collaboration",
            description="Team communication, workspace, and office suites",
            budget_limit=Decimal("8000.00"),
        ),
        Category(
            name="Design & Creative",
            description="UI/UX design tools and graphic assets",
            budget_limit=Decimal("4000.00"),
        ),
        Category(
            name="Sales & Marketing",
            description="CRM, email automation, analytics, and advertising tools",
            budget_limit=Decimal("12000.00"),
        ),
        Category(
            name="Security & Compliance",
            description="Identity management, monitoring, and audit compliance",
            budget_limit=Decimal("6000.00"),
        ),
    ]
    db.add_all(categories)
    db.commit()

    cat_map = {c.name: c.id for c in categories}

    print("Seeding subscriptions...")
    today = date.today()

    demo_subs = [
        {
            "name": "AWS Cloud Infrastructure",
            "vendor": "Amazon Web Services",
            "description": "Production and staging Kubernetes clusters and RDS databases",
            "category_id": cat_map["Engineering & Infrastructure"],
            "cost_per_cycle": Decimal("4250.00"),
            "billing_cycle": "monthly",
            "status": "active",
            "start_date": today - timedelta(days=365),
            "next_renewal_date": today + timedelta(days=12),
            "owner": "Sarah Chen (DevOps)",
            "license_count": None,
            "used_licenses": None,
            "payment_method": "credit_card",
            "notes": "Enterprise discount tier applied. Reviewing spot instance reservations.",
        },
        {
            "name": "GitHub Enterprise",
            "vendor": "GitHub, Inc.",
            "description": "Source control, GitHub Actions runners, and CodeQL security",
            "category_id": cat_map["Engineering & Infrastructure"],
            "cost_per_cycle": Decimal("1050.00"),
            "billing_cycle": "monthly",
            "status": "active",
            "start_date": today - timedelta(days=240),
            "next_renewal_date": today + timedelta(days=22),
            "owner": "Marcus Vance (VP Eng)",
            "license_count": 50,
            "used_licenses": 28,  # Triggers unused_licenses rule (< 70% of 50 = 56% util)
            "payment_method": "invoice",
            "notes": "22 seats unused following Q3 team restructuring.",
        },
        {
            "name": "Datadog APM & Logs",
            "vendor": "Datadog",
            "description": "Infrastructure monitoring, APM tracing, synthetic tests",
            "category_id": cat_map["Engineering & Infrastructure"],
            "cost_per_cycle": Decimal("7200.00"),
            "billing_cycle": "annual",
            "status": "active",
            "start_date": today - timedelta(days=320),
            "next_renewal_date": today + timedelta(days=45),  # High-cost renewal within 60 days
            "owner": "Sarah Chen (DevOps)",
            "license_count": None,
            "used_licenses": None,
            "payment_method": "wire",
            "notes": "Contract renewal approaching. Annual spend > $5,000.",
        },
        {
            "name": "Slack Business+",
            "vendor": "Salesforce / Slack",
            "description": "Company-wide asynchronous communication and workflow builder",
            "category_id": cat_map["Productivity & Collaboration"],
            "cost_per_cycle": Decimal("1875.00"),
            "billing_cycle": "monthly",  # Monthly billing > $1,200/yr -> Triggers annual_switch rule
            "status": "active",
            "start_date": today - timedelta(days=180),
            "next_renewal_date": today + timedelta(days=18),
            "owner": "Elena Rostova (People Ops)",
            "license_count": 125,
            "used_licenses": 120,
            "payment_method": "credit_card",
            "notes": "Currently billed monthly. Switching to annual saves 17%.",
        },
        {
            "name": "Google Workspace Enterprise",
            "vendor": "Google",
            "description": "Corporate email, Google Drive storage, Meet video conferencing",
            "category_id": cat_map["Productivity & Collaboration"],
            "cost_per_cycle": Decimal("2250.00"),
            "billing_cycle": "monthly",
            "status": "active",
            "start_date": today - timedelta(days=400),
            "next_renewal_date": today + timedelta(days=5),  # Urgent renewal (<=7 days)
            "owner": "IT Support",
            "license_count": 125,
            "used_licenses": 118,
            "payment_method": "invoice",
            "notes": "Standard plan with 5TB pooled storage per user.",
        },
        {
            "name": "Notion Team",
            "vendor": "Notion Labs",
            "description": "Company wiki, product roadmaps, and documentation",
            "category_id": cat_map["Productivity & Collaboration"],
            "cost_per_cycle": Decimal("960.00"),
            "billing_cycle": "monthly",
            "status": "active",
            "start_date": today - timedelta(days=150),
            "next_renewal_date": today + timedelta(days=26),
            "owner": "Elena Rostova (People Ops)",
            "license_count": 80,
            "used_licenses": 45,  # Unused licenses (< 70% of 80 = 56% util)
            "payment_method": "credit_card",
            "notes": "Cross-functional knowledge base.",
        },
        {
            "name": "Figma Enterprise",
            "vendor": "Figma",
            "description": "Product UI design, design system tokens, FigJam boards",
            "category_id": cat_map["Design & Creative"],
            "cost_per_cycle": Decimal("900.00"),
            "billing_cycle": "monthly",
            "status": "active",
            "start_date": today - timedelta(days=200),
            "next_renewal_date": today + timedelta(days=14),
            "owner": "Alex Rivera (Design Lead)",
            "license_count": 18,
            "used_licenses": 16,
            "payment_method": "credit_card",
            "notes": "Core design team seats.",
        },
        {
            "name": "Canva Teams",
            "vendor": "Canva",
            "description": "Marketing graphics and quick social templates",
            "category_id": cat_map["Design & Creative"],  # Duplicate tool in Design & Creative
            "cost_per_cycle": Decimal("300.00"),
            "billing_cycle": "monthly",
            "status": "active",
            "start_date": today - timedelta(days=90),
            "next_renewal_date": today + timedelta(days=20),
            "owner": "Lisa Park (Marketing)",
            "license_count": 10,
            "used_licenses": 8,
            "payment_method": "credit_card",
            "notes": "Marketing used this before Figma was rolled out across teams.",
        },
        {
            "name": "Salesforce Sales Cloud",
            "vendor": "Salesforce",
            "description": "Lead management, sales pipeline, deal forecasting",
            "category_id": cat_map["Sales & Marketing"],
            "cost_per_cycle": Decimal("18000.00"),
            "billing_cycle": "annual",
            "status": "active",
            "start_date": today - timedelta(days=300),
            "next_renewal_date": today + timedelta(days=65),
            "owner": "David Miller (VP Sales)",
            "license_count": 15,
            "used_licenses": 15,
            "payment_method": "wire",
            "notes": "Enterprise contract with custom billing terms.",
        },
        {
            "name": "HubSpot Marketing Hub",
            "vendor": "HubSpot",
            "description": "Inbound marketing, email sequences, CRM sync",
            "category_id": cat_map["Sales & Marketing"],  # Duplicate tool candidate
            "cost_per_cycle": Decimal("800.00"),
            "billing_cycle": "monthly",
            "status": "active",
            "start_date": today - timedelta(days=120),
            "next_renewal_date": today + timedelta(days=8),
            "owner": "Lisa Park (Marketing)",
            "license_count": 5,
            "used_licenses": 4,
            "payment_method": "credit_card",
            "notes": "Assessing overlap with Salesforce Marketing Cloud.",
        },
    ]

    subs = []
    for d in demo_subs:
        s = Subscription(**d)
        subs.append(s)
        db.add(s)

    db.commit()
    for s in subs:
        db.refresh(s)

    print("Seeding payment history...")
    for s in subs:
        # Create 2 past payments for each
        for months_ago in [2, 1]:
            p_date = today - timedelta(days=months_ago * 30)
            payment = PaymentHistory(
                subscription_id=s.id,
                amount=s.cost_per_cycle,
                currency=s.currency,
                payment_date=p_date,
                status="completed",
                invoice_reference=f"INV-{str(s.id)[:6].upper()}-{months_ago}",
            )
            db.add(payment)

    db.commit()

    print("Running initial deterministic savings detection...")
    new_opps = detect_savings_opportunities(db)
    print(f"Detected {len(new_opps)} savings opportunities automatically.")

    db.close()
    print("Database seeding completed successfully!")


if __name__ == "__main__":
    seed_data()
