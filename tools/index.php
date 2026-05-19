<?php
/**
 * Manual E-Wallet Provider Endpoint (Pitucode)
 *
 * Example:
 *   /tools/index.php?ewallet_code=dana&account_number=087841903677
 *   /tools/index.php?code=dana&number=087841903677
 */

const PITUCODE_BASE_URL = 'https://api.pitucode.com/cek-name-e-wallet-id-v2';
const PITUCODE_DEFAULT_KEY = 'dadd4f27220b';
const DEFAULT_TIMEOUT_MS = 15000;

function json_response(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function read_input_payload(): array
{
    $raw = file_get_contents('php://input');
    if (($raw === false || trim($raw) === '') && PHP_SAPI === 'cli') {
        $raw = stream_get_contents(STDIN);
    }

    $json = [];
    if ($raw !== false && trim($raw) !== '') {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            $json = $decoded;
        }
    }

    return array_merge($_GET ?: [], $_POST ?: [], $json);
}

function normalize_code(string $code): string
{
    $code = strtolower(trim($code));
    $code = preg_replace('/^wallet_/', '', $code);
    if ($code === 'gopay_user') return 'gopay';
    if ($code === 'wallet_shopeepay') return 'shopeepay';
    return $code;
}

function normalize_number(string $number): string
{
    return preg_replace('/[^0-9]/', '', $number);
}

function extract_result_name($payload): string
{
    if (!is_array($payload)) return '';

    $candidates = [
        $payload['result']['name'] ?? null,
        $payload['result']['nama'] ?? null,
        $payload['result']['account_name'] ?? null,
        $payload['result']['customer_name'] ?? null,
        $payload['result-name'] ?? null,
        $payload['result_name'] ?? null,
        $payload['name'] ?? null,
        $payload['nama'] ?? null,
        $payload['account_name'] ?? null,
        $payload['customer_name'] ?? null,
        $payload['data']['name'] ?? null,
        $payload['data']['nama'] ?? null,
        $payload['data']['account_name'] ?? null,
        $payload['data']['customer_name'] ?? null,
    ];

    foreach ($candidates as $value) {
        $name = trim((string)$value);
        if ($name !== '') return $name;
    }

    return '';
}

$input = read_input_payload();
$code = normalize_code((string)($input['ewallet'] ?? $input['ewallet_code'] ?? $input['code'] ?? $input['service'] ?? ''));
$number = normalize_number((string)($input['nomor'] ?? $input['number'] ?? $input['phone_number'] ?? $input['account_number'] ?? $input['user_id'] ?? ''));
$timeoutMs = max(1000, min(30000, (int)($input['timeout_ms'] ?? DEFAULT_TIMEOUT_MS)));
$debug = in_array(strtolower((string)($input['debug'] ?? '')), ['1', 'true', 'yes'], true);

if ($code === '' || $number === '') {
    json_response([
        'ok' => false,
        'status' => 'failed',
        'message' => 'Parameter ewallet/code dan nomor/number wajib diisi.',
        'data' => [
            'ewallet_code' => $code ?: null,
            'account_number' => $number ?: null,
            'account_name' => null,
            'customer_name' => null
        ]
    ], 400);
}

$apiKey = trim((string)(getenv('PITUCODE_EWALLET_API_KEY') ?: PITUCODE_DEFAULT_KEY));
$url = PITUCODE_BASE_URL . '?' . http_build_query([
    'ewallet' => $code,
    'nomor' => $number
]);

$startedAt = microtime(true);
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT_MS, $timeoutMs);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) ManualEwallet/1.0',
    'x-api-key: ' . $apiKey
]);

$rawBody = curl_exec($ch);
$curlErrno = curl_errno($ch);
$curlError = curl_error($ch);
$httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$elapsedMs = (int)round((microtime(true) - $startedAt) * 1000);

if ($curlErrno) {
    json_response([
        'ok' => false,
        'status' => 'failed',
        'message' => $curlErrno === CURLE_OPERATION_TIMEDOUT ? 'Timeout menghubungi Pitucode.' : 'Gagal menghubungi Pitucode.',
        'number' => $number,
        'name' => null,
        'latency_ms' => $elapsedMs,
        'formatted' => "{$number}||{$elapsedMs}|false",
        'data' => [
            'ewallet_code' => $code,
            'account_number' => $number,
            'account_name' => null,
            'customer_name' => null
        ],
        'debug' => $debug ? ['curl_error' => $curlError, 'curl_errno' => $curlErrno] : null
    ], 200);
}

$payload = json_decode((string)$rawBody, true);
$name = extract_result_name($payload);
$isOk = ($httpStatus >= 200 && $httpStatus < 300 && $name !== '');

json_response([
    'ok' => $isOk,
    'status' => $isOk ? 'success' : 'failed',
    'message' => $isOk ? 'Validasi ewallet berhasil.' : 'Nomor tidak ditemukan atau response Pitucode tidak valid.',
    'number' => $number,
    'name' => $isOk ? $name : null,
    'latency_ms' => $elapsedMs,
    'formatted' => $number . '|' . ($isOk ? $name : '') . '|' . $elapsedMs . '|' . ($isOk ? 'true' : 'false'),
    'data' => [
        'ewallet_code' => $code,
        'account_number' => $number,
        'account_name' => $isOk ? $name : null,
        'customer_name' => $isOk ? $name : null
    ],
    'raw' => $debug ? $payload : null,
    'debug' => $debug ? [
        'http_status' => $httpStatus,
        'url' => PITUCODE_BASE_URL . '?ewallet=' . $code . '&nomor=' . $number,
        'body_snippet' => substr((string)$rawBody, 0, 500)
    ] : null
], 200);
