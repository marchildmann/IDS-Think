<?php
/**
 * E-commerce Order Generator
 * Generates 500 sample orders and saves them to a JSON file
 */

// Sample data arrays
$products = [
    ['id' => 'PROD001', 'name' => 'Wireless Headphones', 'price' => 79.99],
    ['id' => 'PROD002', 'name' => 'Smart Watch', 'price' => 249.99],
    ['id' => 'PROD003', 'name' => 'Laptop Stand', 'price' => 34.99],
    ['id' => 'PROD004', 'name' => 'USB-C Cable', 'price' => 12.99],
    ['id' => 'PROD005', 'name' => 'Mechanical Keyboard', 'price' => 129.99],
    ['id' => 'PROD006', 'name' => 'Wireless Mouse', 'price' => 39.99],
    ['id' => 'PROD007', 'name' => 'External SSD 1TB', 'price' => 89.99],
    ['id' => 'PROD008', 'name' => 'Phone Case', 'price' => 19.99],
    ['id' => 'PROD009', 'name' => 'Screen Protector', 'price' => 9.99],
    ['id' => 'PROD010', 'name' => 'Portable Charger', 'price' => 44.99],
    ['id' => 'PROD011', 'name' => 'Bluetooth Speaker', 'price' => 59.99],
    ['id' => 'PROD012', 'name' => 'Webcam HD', 'price' => 69.99],
    ['id' => 'PROD013', 'name' => 'Desk Lamp', 'price' => 29.99],
    ['id' => 'PROD014', 'name' => 'Monitor 27"', 'price' => 299.99],
    ['id' => 'PROD015', 'name' => 'Gaming Chair', 'price' => 199.99],
];

$customers = [
    ['name' => 'John Smith', 'email' => 'john.smith@email.com', 'country' => 'USA'],
    ['name' => 'Emma Johnson', 'email' => 'emma.j@email.com', 'country' => 'Canada'],
    ['name' => 'Michael Brown', 'email' => 'mbrown@email.com', 'country' => 'UK'],
    ['name' => 'Sarah Davis', 'email' => 'sarah.d@email.com', 'country' => 'Australia'],
    ['name' => 'David Wilson', 'email' => 'd.wilson@email.com', 'country' => 'USA'],
    ['name' => 'Lisa Anderson', 'email' => 'lisa.a@email.com', 'country' => 'Germany'],
    ['name' => 'James Taylor', 'email' => 'jtaylor@email.com', 'country' => 'France'],
    ['name' => 'Maria Garcia', 'email' => 'maria.g@email.com', 'country' => 'Spain'],
    ['name' => 'Robert Martinez', 'email' => 'robert.m@email.com', 'country' => 'USA'],
    ['name' => 'Jennifer Lee', 'email' => 'jlee@email.com', 'country' => 'Canada'],
];

$statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
$paymentMethods = ['credit_card', 'paypal', 'debit_card', 'bank_transfer', 'apple_pay', 'google_pay'];

$orders = [];

// Generate 500 orders
for ($i = 1; $i <= 500; $i++) {
    $customer = $customers[array_rand($customers)];
    $status = $statuses[array_rand($statuses)];
    $paymentMethod = $paymentMethods[array_rand($paymentMethods)];
    
    // Generate random number of items (1-5)
    $numItems = rand(1, 5);
    $items = [];
    $subtotal = 0;
    
    for ($j = 0; $j < $numItems; $j++) {
        $product = $products[array_rand($products)];
        $quantity = rand(1, 3);
        $itemTotal = $product['price'] * $quantity;
        
        $items[] = [
            'product_id' => $product['id'],
            'product_name' => $product['name'],
            'quantity' => $quantity,
            'unit_price' => $product['price'],
            'total' => round($itemTotal, 2)
        ];
        
        $subtotal += $itemTotal;
    }
    
    // Calculate tax and shipping
    $tax = round($subtotal * 0.08, 2); // 8% tax
    $shipping = $subtotal > 100 ? 0 : 9.99; // Free shipping over $100
    $total = round($subtotal + $tax + $shipping, 2);
    
    // Generate random date within last 90 days
    $timestamp = time() - rand(0, 90 * 24 * 60 * 60);
    $orderDate = date('Y-m-d H:i:s', $timestamp);
    
    $orders[] = [
        'order_id' => 'ORD' . str_pad($i, 6, '0', STR_PAD_LEFT),
        'order_date' => $orderDate,
        'customer' => [
            'name' => $customer['name'],
            'email' => $customer['email'],
            'country' => $customer['country']
        ],
        'items' => $items,
        'subtotal' => round($subtotal, 2),
        'tax' => $tax,
        'shipping' => $shipping,
        'total' => $total,
        'payment_method' => $paymentMethod,
        'status' => $status,
        'tracking_number' => $status === 'shipped' || $status === 'delivered' ? 
            'TRK' . strtoupper(bin2hex(random_bytes(6))) : null
    ];
}

// Save to JSON file
$filename = 'ecommerce_orders.json';
$jsonData = json_encode([
    'generated_at' => date('Y-m-d H:i:s'),
    'total_orders' => count($orders),
    'orders' => $orders
], JSON_PRETTY_PRINT);

file_put_contents($filename, $jsonData);

echo "Successfully generated {$filename}\n";
echo "Total orders: " . count($orders) . "\n";
echo "File size: " . number_format(filesize($filename) / 1024, 2) . " KB\n";
?>