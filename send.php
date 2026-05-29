<?php

declare(strict_types=1);

const RECIPIENT = 'info@hotel-chekhov.ru'; // ← замените на нужный адрес
const SUBJECT   = 'Новая заявка на бронирование — Бутик-отель «Чехов»';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// Only POST allowed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
  exit;
}

// Read and decode JSON body (fetch sends JSON)
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

// Fallback to regular POST fields (form submit without JS)
if (!is_array($data)) {
  $data = $_POST;
}

// Sanitise helpers
function str_clean(mixed $v): string
{
  return trim(strip_tags((string)($v ?? '')));
}

$name    = str_clean($data['name']    ?? '');
$phone   = str_clean($data['phone']   ?? '');
$comment = str_clean($data['comment'] ?? '');
$consent = !empty($data['consent']);

// Validate
$errors = [];
if ($name === '') {
  $errors[] = 'Укажите имя';
}
if ($phone === '' || mb_strlen(preg_replace('/\D/', '', $phone)) < 10) {
  $errors[] = 'Укажите корректный номер телефона';
}
if (!$consent) {
  $errors[] = 'Необходимо согласие на обработку данных';
}

if ($errors) {
  http_response_code(422);
  echo json_encode(['ok' => false, 'errors' => $errors]);
  exit;
}

// Build message
$date = date('d.m.Y H:i');
$ip   = $_SERVER['REMOTE_ADDR'] ?? '—';

$body  = "Новая заявка на бронирование\n";
$body .= str_repeat('─', 40) . "\n";
$body .= "Имя:      {$name}\n";
$body .= "Телефон:  {$phone}\n";
if ($comment !== '') {
  $body .= "Комментарий:\n{$comment}\n";
}
$body .= str_repeat('─', 40) . "\n";
$body .= "Дата:     {$date}\n";

$headers  = "From: no-reply@hotel-chekhov.ru\r\n";
$headers .= "Reply-To: no-reply@hotel-chekhov.ru\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "X-Mailer: PHP/" . PHP_VERSION . "\r\n";

$subject  = '=?UTF-8?B?' . base64_encode(SUBJECT) . '?=';
$sent     = mail(RECIPIENT, $subject, $body, $headers);

if ($sent) {
  echo json_encode(['ok' => true, 'message' => 'Заявка отправлена']);
} else {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Не удалось отправить письмо. Попробуйте позже.']);
}
