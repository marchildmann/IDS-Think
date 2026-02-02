<?php
/**
 * IoT Vending Machine Data Generator
 * Generates 500 sample vending machine sensor readings and saves them to a JSON file
 */

// Vending machine locations
$locations = [
    ['id' => 'VM001', 'name' => 'Building A - Floor 1', 'zone' => 'North Campus', 'lat' => 40.7128, 'lon' => -74.0060],
    ['id' => 'VM002', 'name' => 'Building B - Floor 2', 'zone' => 'North Campus', 'lat' => 40.7130, 'lon' => -74.0055],
    ['id' => 'VM003', 'name' => 'Building C - Lobby', 'zone' => 'South Campus', 'lat' => 40.7125, 'lon' => -74.0070],
    ['id' => 'VM004', 'name' => 'Student Center', 'zone' => 'Central Campus', 'lat' => 40.7135, 'lon' => -74.0065],
    ['id' => 'VM005', 'name' => 'Library - Floor 3', 'zone' => 'Central Campus', 'lat' => 40.7132, 'lon' => -74.0058],
    ['id' => 'VM006', 'name' => 'Gym Entrance', 'zone' => 'Sports Complex', 'lat' => 40.7140, 'lon' => -74.0075],
    ['id' => 'VM007', 'name' => 'Cafeteria Hall', 'zone' => 'South Campus', 'lat' => 40.7122, 'lon' => -74.0062],
    ['id' => 'VM008', 'name' => 'Parking Garage Level 1', 'zone' => 'North Campus', 'lat' => 40.7138, 'lon' => -74.0080],
];

// Product slots in vending machines
$productSlots = [
    ['slot' => 'A1', 'product' => 'Coca Cola', 'capacity' => 12],
    ['slot' => 'A2', 'product' => 'Pepsi', 'capacity' => 12],
    ['slot' => 'A3', 'product' => 'Sprite', 'capacity' => 12],
    ['slot' => 'A4', 'product' => 'Water', 'capacity' => 15],
    ['slot' => 'B1', 'product' => 'Orange Juice', 'capacity' => 10],
    ['slot' => 'B2', 'product' => 'Iced Tea', 'capacity' => 10],
    ['slot' => 'B3', 'product' => 'Energy Drink', 'capacity' => 8],
    ['slot' => 'C1', 'product' => 'Chips', 'capacity' => 10],
    ['slot' => 'C2', 'product' => 'Cookies', 'capacity' => 10],
    ['slot' => 'C3', 'product' => 'Chocolate Bar', 'capacity' => 12],
    ['slot' => 'C4', 'product' => 'Candy', 'capacity' => 15],
    ['slot' => 'D1', 'product' => 'Protein Bar', 'capacity' => 8],
    ['slot' => 'D2', 'product' => 'Granola Bar', 'capacity' => 10],
];

$deviceStatuses = ['online', 'online', 'online', 'online', 'online', 'maintenance', 'error'];
$errorCodes = [null, null, null, null, null, 'E001', 'E002', 'E003', 'W001'];

$machineData = [];

// Generate 500 readings (multiple readings per machine over time)
for ($i = 1; $i <= 500; $i++) {
    $location = $locations[array_rand($locations)];
    $deviceStatus = $deviceStatuses[array_rand($deviceStatuses)];
    
    // Generate inventory for this reading
    $inventory = [];
    foreach ($productSlots as $slot) {
        $currentStock = rand(0, $slot['capacity']);
        $inventory[] = [
            'slot' => $slot['slot'],
            'product' => $slot['product'],
            'current_stock' => $currentStock,
            'capacity' => $slot['capacity'],
            'stock_percentage' => round(($currentStock / $slot['capacity']) * 100, 1),
            'needs_refill' => $currentStock <= 2
        ];
    }
    
    // Generate timestamp within last 7 days
    $timestamp = time() - rand(0, 7 * 24 * 60 * 60);
    $readingTime = date('Y-m-d H:i:s', $timestamp);
    
    // Environmental sensors
    $temperature = round(rand(180, 240) / 10, 1); // 18.0°C to 24.0°C
    $humidity = rand(30, 60); // 30% to 60%
    
    // Power and performance metrics
    $powerVoltage = round(rand(2200, 2400) / 10, 1); // 220V to 240V
    $powerCurrent = round(rand(15, 35) / 10, 2); // 1.5A to 3.5A
    $powerConsumption = round($powerVoltage * $powerCurrent, 2);
    
    // Sales metrics
    $salesLast24h = rand(0, 50);
    $revenue24h = round($salesLast24h * rand(15, 35) / 10, 2);
    
    // Determine if there's an error
    $errorCode = $errorCodes[array_rand($errorCodes)];
    $errorMessage = null;
    
    if ($errorCode) {
        $errors = [
            'E001' => 'Coin mechanism jammed',
            'E002' => 'Temperature out of range',
            'E003' => 'Payment system offline',
            'W001' => 'Low refrigerant warning'
        ];
        $errorMessage = $errors[$errorCode] ?? 'Unknown error';
    }
    
    // Door sensor
    $doorOpen = rand(0, 100) < 5; // 5% chance door is open
    $lastServiceDate = date('Y-m-d', strtotime('-' . rand(1, 90) . ' days'));
    
    $machineData[] = [
        'reading_id' => 'RD' . str_pad($i, 6, '0', STR_PAD_LEFT),
        'timestamp' => $readingTime,
        'machine' => [
            'id' => $location['id'],
            'name' => $location['name'],
            'zone' => $location['zone'],
            'location' => [
                'latitude' => $location['lat'],
                'longitude' => $location['lon']
            ]
        ],
        'device_status' => $deviceStatus,
        'environmental' => [
            'temperature_celsius' => $temperature,
            'humidity_percent' => $humidity,
            'door_open' => $doorOpen
        ],
        'power' => [
            'voltage' => $powerVoltage,
            'current_amps' => $powerCurrent,
            'power_watts' => $powerConsumption,
            'uptime_hours' => rand(1, 720)
        ],
        'inventory' => $inventory,
        'sales' => [
            'transactions_24h' => $salesLast24h,
            'revenue_24h' => $revenue24h,
            'total_transactions' => rand(1000, 5000),
            'total_revenue' => round(rand(15000, 75000) / 100, 2)
        ],
        'maintenance' => [
            'last_service' => $lastServiceDate,
            'error_code' => $errorCode,
            'error_message' => $errorMessage,
            'service_required' => $deviceStatus === 'maintenance' || $deviceStatus === 'error'
        ],
        'connectivity' => [
            'signal_strength' => rand(60, 100),
            'last_ping' => date('Y-m-d H:i:s', $timestamp - rand(0, 300)),
            'firmware_version' => '2.' . rand(0, 5) . '.' . rand(0, 20)
        ]
    ];
}

// Save to JSON file
$filename = 'iot_vending_machines.json';
$jsonData = json_encode([
    'generated_at' => date('Y-m-d H:i:s'),
    'total_readings' => count($machineData),
    'machines_monitored' => count($locations),
    'data' => $machineData
], JSON_PRETTY_PRINT);

file_put_contents($filename, $jsonData);

echo "Successfully generated {$filename}\n";
echo "Total readings: " . count($machineData) . "\n";
echo "Machines monitored: " . count($locations) . "\n";
echo "File size: " . number_format(filesize($filename) / 1024, 2) . " KB\n";
?>