<?php
declare(strict_types=1);

function send_mail(string $to, string $subject, string $html, string $toName = ''): bool
{
    $host = trim(cfg('SMTP_HOST'));
    if ($host === '') {
        mail_log('SMTP_HOST vacío; no se envió a ' . $to);
        return false;
    }

    $autoload = __DIR__ . '/vendor/autoload.php';
    if (!is_file($autoload)) {
        mail_log('Falta vendor/autoload.php (Composer / PHPMailer)');
        return false;
    }
    require_once $autoload;

    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    try {
        $enc = strtolower(trim(cfg('SMTP_ENCRYPTION', 'ssl')));
        $portDefault = match ($enc) {
            'tls', 'starttls' => '587',
            'none', 'off', '' => '25',
            default => '465',
        };
        $port = (int) cfg('SMTP_PORT', $portDefault);
        $mail->isSMTP();
        $mail->Host = $host;
        $mail->SMTPAuth = cfg('SMTP_USER') !== '';
        $mail->Username = cfg('SMTP_USER');
        $mail->Password = cfg('SMTP_PASSWORD');
        $mail->Port = $port > 0 ? $port : (int) $portDefault;
        if ($enc === 'tls' || $enc === 'starttls') {
            $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        } elseif ($enc === 'none' || $enc === 'off') {
            $mail->SMTPSecure = '';
            $mail->SMTPAutoTLS = false;
        } else {
            $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
        }
        $mail->CharSet = 'UTF-8';
        $mail->setFrom(cfg('SMTP_FROM', 'noreply@localhost'), cfg('SMTP_FROM_NAME', 'Matt Innova'));
        $mail->addAddress($to, $toName);
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $html;
        $mail->send();
        return true;
    } catch (Throwable $e) {
        mail_log('Fallo al enviar a ' . $to . ': ' . $e->getMessage());
        return false;
    }
}

function mail_log(string $message): void
{
    $line = '[' . date('c') . '] ' . $message;
    error_log('[mail] ' . $message);
    $dir = __DIR__ . '/tmp';
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
    if (is_dir($dir) && is_writable($dir)) {
        @file_put_contents($dir . '/mail.log', $line . "\n", FILE_APPEND | LOCK_EX);
    }
}
