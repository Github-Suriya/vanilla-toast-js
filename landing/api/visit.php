<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $visit = json_decode($input, true);

    if (!$visit || !isset($visit['ip'])) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid visit data"]);
        exit;
    }

    // Resolve client IP from headers if local/missing
    if ($visit['ip'] === '127.0.0.1' || $visit['ip'] === '::1') {
        $visit['ip'] = $_SERVER['REMOTE_ADDR'] ?? $visit['ip'];
    }

    $visitsFile = __DIR__ . '/../visits.json'; // Store visits.json in the parent folder (root of dist)
    $visits = [];

    if (file_exists($visitsFile)) {
        $content = file_get_contents($visitsFile);
        $visits = json_decode($content, true);
        if (!is_array($visits)) {
            $visits = [];
        }
    }

    array_unshift($visits, $visit);

    // Limit to 1000 items
    if (count($visits) > 1000) {
        $visits = array_slice($visits, 0, 1000);
    }

    file_put_contents($visitsFile, json_encode($visits, JSON_PRETTY_PRINT));
    echo json_encode(["success" => true]);
    exit;
}

http_response_code(405);
echo json_encode(["error" => "Method not allowed"]);
