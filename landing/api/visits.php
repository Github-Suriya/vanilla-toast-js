<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$visitsFile = __DIR__ . '/../visits.json';
$visits = [];

if (file_exists($visitsFile)) {
    $content = file_get_contents($visitsFile);
    $visits = json_decode($content, true);
    if (!is_array($visits)) {
        $visits = [];
    }
}

echo json_encode($visits);
