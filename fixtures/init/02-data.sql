-- Insert sample data for testing

-- Insert categories
INSERT INTO categories (name, description, parent_id) VALUES
('Electronics', 'Electronic devices and gadgets', NULL),
('Computers', 'Desktop and laptop computers', 1),
('Smartphones', 'Mobile phones and accessories', 1),
('Clothing', 'Apparel and fashion items', NULL),
('Men''s Clothing', 'Clothing for men', 4),
('Women''s Clothing', 'Clothing for women', 4),
('Books', 'Books and literature', NULL),
('Fiction', 'Fiction books', 7),
('Non-Fiction', 'Non-fiction books', 7);

-- Insert users
INSERT INTO users (email, username, first_name, last_name, password_hash, is_active) VALUES
('john.doe@example.com', 'johndoe', 'John', 'Doe', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLTuJqUOdQGVFT6', TRUE),
('jane.smith@example.com', 'janesmith', 'Jane', 'Smith', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLTuJqUOdQGVFT6', TRUE),
('bob.wilson@example.com', 'bobwilson', 'Bob', 'Wilson', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLTuJqUOdQGVFT6', TRUE),
('alice.brown@example.com', 'alicebrown', 'Alice', 'Brown', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLTuJqUOdQGVFT6', FALSE),
('mike.johnson@example.com', 'mikejohnson', 'Mike', 'Johnson', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLTuJqUOdQGVFT6', TRUE);

-- Insert products
INSERT INTO products (name, description, price, stock_quantity, category_id, sku, is_featured) VALUES
('Gaming Laptop', 'High-performance gaming laptop with RTX 4070', 1299.99, 15, 2, 'LAPTOP-GAMING-001', TRUE),
('iPhone 15 Pro', 'Latest iPhone with Pro camera system', 999.99, 50, 3, 'IPHONE-15-PRO', TRUE),
('MacBook Air M2', 'Apple MacBook Air with M2 chip', 1199.99, 25, 2, 'MACBOOK-AIR-M2', TRUE),
('Samsung Galaxy S24', 'Android smartphone with advanced features', 799.99, 40, 3, 'GALAXY-S24', FALSE),
('Dell XPS 13', 'Ultra-portable laptop for professionals', 899.99, 20, 2, 'DELL-XPS-13', FALSE),
('Men''s Cotton T-Shirt', 'Comfortable cotton t-shirt', 19.99, 100, 5, 'TSHIRT-MEN-001', FALSE),
('Women''s Summer Dress', 'Elegant summer dress', 49.99, 75, 6, 'DRESS-WOMEN-001', TRUE),
('Programming Book: Clean Code', 'Essential book for software developers', 29.99, 200, 9, 'BOOK-CLEAN-CODE', FALSE),
('Fiction Novel: The Great Adventure', 'Exciting adventure novel', 14.99, 150, 8, 'BOOK-ADVENTURE', FALSE),
('Wireless Headphones', 'Premium wireless headphones with noise cancellation', 199.99, 60, 1, 'HEADPHONES-WL-001', TRUE);

-- Insert orders
INSERT INTO orders (user_id, order_number, status, total_amount, shipping_address, billing_address) VALUES
(1, 'ORD-2024-001', 'delivered', 1319.98, '123 Main St, New York, NY 10001', '123 Main St, New York, NY 10001'),
(2, 'ORD-2024-002', 'shipped', 999.99, '456 Oak Ave, Los Angeles, CA 90210', '456 Oak Ave, Los Angeles, CA 90210'),
(3, 'ORD-2024-003', 'pending', 69.98, '789 Pine Rd, Chicago, IL 60601', '789 Pine Rd, Chicago, IL 60601'),
(1, 'ORD-2024-004', 'processing', 1199.99, '123 Main St, New York, NY 10001', '123 Main St, New York, NY 10001'),
(5, 'ORD-2024-005', 'delivered', 44.98, '321 Elm St, Houston, TX 77001', '321 Elm St, Houston, TX 77001');

-- Insert order items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES
(1, 1, 1, 1299.99, 1299.99),
(1, 6, 1, 19.99, 19.99),
(2, 2, 1, 999.99, 999.99),
(3, 6, 1, 19.99, 19.99),
(3, 7, 1, 49.99, 49.99),
(4, 3, 1, 1199.99, 1199.99),
(5, 8, 1, 29.99, 29.99),
(5, 9, 1, 14.99, 14.99);

-- Insert user sessions
INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at) VALUES
(1, 'sess_abc123def456', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() + INTERVAL '7 days'),
(2, 'sess_xyz789uvw012', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', NOW() + INTERVAL '7 days'),
(3, 'sess_mno345pqr678', '192.168.1.102', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', NOW() + INTERVAL '7 days');

-- Insert product reviews
INSERT INTO product_reviews (product_id, user_id, rating, title, comment, is_verified_purchase) VALUES
(1, 1, 5, 'Excellent gaming laptop!', 'This laptop handles all the latest games at high settings. Very satisfied with the purchase.', TRUE),
(1, 3, 4, 'Great performance', 'Really good for gaming and work. Battery life could be better.', FALSE),
(2, 2, 5, 'Love my new iPhone', 'The camera quality is amazing and the performance is smooth.', TRUE),
(3, 1, 5, 'Perfect for work', 'Lightweight and powerful. Perfect for my development work.', TRUE),
(6, 3, 4, 'Good quality shirt', 'Nice material and fit. Would recommend.', TRUE),
(7, 5, 5, 'Beautiful dress', 'Perfect for summer events. Great quality and style.', TRUE),
(8, 5, 5, 'Must-read for developers', 'This book changed how I write code. Highly recommended.', TRUE),
(10, 2, 4, 'Good headphones', 'Sound quality is great, but could be more comfortable for long sessions.', FALSE); 