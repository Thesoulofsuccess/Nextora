<?php
/**
 * Nextora Technologies — lead handler
 * Receives the contact form and the business-profile form (JSON POST),
 * emails the lead to the team, appends it to private/leads.csv and,
 * for profile requests, unlocks download.php for this browser session.
 *
 * Hostinger: PHP 8.x. mail() works on Hostinger hosting; for best
 * deliverability set FROM_EMAIL to a mailbox that exists on your domain
 * (create it in hPanel → Emails), e.g. website@nextoratechnologies.com.
 */
declare(strict_types=1);
date_default_timezone_set('Asia/Kolkata');

const TO_EMAIL   = 'info@nextoratechnologies.com';
const FROM_EMAIL = 'website@nextoratechnologies.com';
const FROM_NAME  = 'Nextora Website';

session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => !empty($_SERVER['HTTPS']), 'httponly' => true, 'samesite' => 'Lax']);
session_start();

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function respond(int $code, array $body): void {
    http_response_code($code);
    echo json_encode($body);
    exit;
}
function fail(string $msg, int $code = 422): void { respond($code, ['ok' => false, 'error' => $msg]); }
function clean($v, int $max = 200): string {
    $v = is_string($v) ? $v : '';
    $v = strip_tags($v);
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '';
    return trim(mb_substr($v, 0, $max));
}
function csv_safe(string $v): string {
    // Prevent spreadsheet formula injection
    return preg_match('/^[=+\-@\t\r]/', $v) ? "'" . $v : $v;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') fail('Method not allowed.', 405);

// Same-origin check (blocks other sites posting to this endpoint)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host   = strtolower(preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''));
$oHost  = strtolower((string) parse_url($origin, PHP_URL_HOST));
$bare   = fn(string $h): string => preg_replace('/^www\./', '', $h);
if ($origin !== '' && $bare($oHost) !== $bare($host)) fail('Forbidden.', 403);

$raw  = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data)) $data = $_POST;

// Honeypot: bots fill the hidden "website" field. Pretend success.
if (!empty($data['website'])) respond(200, ['ok' => true]);

// Gentle rate limit per session
$now = time();
if (isset($_SESSION['last_lead']) && ($now - (int)$_SESSION['last_lead']) < 8) fail('Please wait a moment and try again.', 429);

$type    = (($data['type'] ?? '') === 'profile') ? 'profile' : 'contact';
$name    = clean($data['name'] ?? '', 120);
$email   = clean($data['email'] ?? '', 160);
$company = clean($data['company'] ?? '', 160);
$topic   = clean($data['topic'] ?? '', 80);
$message = clean($data['message'] ?? '', 2000);

if ($name === '') fail('Please enter your name.');
if ($type === 'profile' && !filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Please enter a valid work email.');
if ($type === 'contact' && $email === '') fail('Please enter your work email or phone number.');
foreach ([$name, $email, $company, $topic] as $v) {
    if (preg_match('/[\r\n]/', $v)) fail('Invalid input.');
}

$isEmail = (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
$when    = date('Y-m-d H:i:s');
$ip      = $_SERVER['REMOTE_ADDR'] ?? '';

$subject = $type === 'profile'
    ? 'Business profile downloaded: ' . $name . ($company !== '' ? ' (' . $company . ')' : '')
    : 'Website enquiry: ' . $name . ($topic !== '' ? ' — ' . $topic : '');

$lines = [
    $type === 'profile' ? 'Someone requested the 2026 business profile.' : 'New enquiry from the website.',
    '',
    'Name:    ' . $name,
    ($isEmail ? 'Email:   ' : 'Contact: ') . $email,
];
if ($company !== '') $lines[] = 'Company: ' . $company;
if ($topic !== '')   $lines[] = 'Topic:   ' . $topic;
if ($message !== '') { $lines[] = ''; $lines[] = 'Message:'; $lines[] = $message; }
$lines[] = '';
$lines[] = 'Received: ' . $when . ' · IP ' . $ip;

$headers  = 'From: ' . FROM_NAME . ' <' . FROM_EMAIL . ">\r\n";
if ($isEmail) $headers .= 'Reply-To: ' . $email . "\r\n";
$headers .= "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n";

$sent = @mail(TO_EMAIL, '=?UTF-8?B?' . base64_encode($subject) . '?=', implode("\n", $lines), $headers, '-f' . FROM_EMAIL);

// Keep a copy of every lead, even if email delivery fails.
$dir = dirname(__DIR__) . '/private';
$file = $dir . '/leads.csv';
if (is_dir($dir) && is_writable($dir)) {
    $new = !file_exists($file);
    if ($fh = @fopen($file, 'a')) {
        if (flock($fh, LOCK_EX)) {
            if ($new) fputcsv($fh, ['received', 'type', 'name', 'email_or_phone', 'company', 'topic', 'message', 'ip', 'emailed']);
            fputcsv($fh, array_map('csv_safe', [$when, $type, $name, $email, $company, $topic, str_replace(["\r", "\n"], ' ', $message), $ip, $sent ? 'yes' : 'no']));
            flock($fh, LOCK_UN);
        }
        fclose($fh);
    }
}

$_SESSION['last_lead'] = $now;

if ($type === 'profile') {
    $_SESSION['profile_ok'] = true;
    respond(200, ['ok' => true, 'download' => 'download.php']);
}
respond(200, ['ok' => true]);
