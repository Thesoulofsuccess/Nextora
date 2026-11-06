<?php
/**
 * Serves the business profile only to visitors who completed the form
 * (api/lead.php sets the session flag). Everyone else is sent to the form.
 */
declare(strict_types=1);

session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => !empty($_SERVER['HTTPS']), 'httponly' => true, 'samesite' => 'Lax']);
session_start();

if (empty($_SESSION['profile_ok'])) {
    header('Location: ./#profile', true, 302);
    exit;
}

$file = __DIR__ . '/private/Nextora-Business-Profile-2026.pdf';
if (!is_file($file)) {
    http_response_code(404);
    echo 'The business profile is not available right now. Please email info@nextoratechnologies.com.';
    exit;
}

header('Content-Type: application/pdf');
header('Content-Disposition: attachment; filename="Nextora-Business-Profile-2026.pdf"');
header('Content-Length: ' . (string) filesize($file));
header('X-Content-Type-Options: nosniff');
header('Cache-Control: private, no-store');
readfile($file);
