# Test Database Fixtures

This directory contains PostgreSQL database fixtures for testing the PostgreSQL schema tool.

## Database Structure

The test database includes the following tables:

### Core Tables
- **users** - User accounts with authentication info
- **categories** - Product categories with hierarchical structure  
- **products** - Product catalog with pricing and inventory
- **orders** - Customer orders with status tracking
- **order_items** - Individual items within orders
- **user_sessions** - Active user sessions with tokens
- **product_reviews** - Customer reviews and ratings

### Sample Data
- 5 test users with various statuses
- 9 product categories (Electronics, Clothing, Books, etc.)
- 10 products across different categories
- 5 orders in different statuses (pending, processing, shipped, delivered)
- 8 order items linking products to orders
- 3 active user sessions
- 8 product reviews with ratings and comments

## Data Types Demonstrated

The schema includes various PostgreSQL data types:
- `SERIAL` - Auto-incrementing integers
- `VARCHAR(n)` - Variable length strings
- `TEXT` - Unlimited text
- `DECIMAL(p,s)` - Precise decimal numbers
- `INTEGER` - Standard integers
- `BOOLEAN` - True/false values
- `TIMESTAMP WITH TIME ZONE` - Timezone-aware timestamps
- `UUID` - Universally unique identifiers
- `INET` - IP addresses

## Foreign Key Relationships

The schema demonstrates various relationship patterns:
- One-to-many (users → orders, categories → products)
- Many-to-many through junction tables (orders ↔ products via order_items)
- Self-referencing (categories parent_id)
- Cascading deletes (order_items, user_sessions, product_reviews)

## Indexes

Performance indexes are created on:
- Primary lookup fields (email, username, sku)
- Foreign key fields (user_id, product_id, category_id)
- Status and filtering fields (order status, session tokens)

This provides a realistic test environment for the PostgreSQL schema tool. 