<?php
declare(strict_types=1);

function send_mail(string $to, string $subject, string $html, string $toName = ''): bool
{
    $host = cfg('SMTP_HOST');
    if ($host === '') {
        return false;
    }

    $autoload = __DIR__ . '/vendor/autoload.php';
    if (!is_file($autoload)) {
        return false;
    }
    require_once $autoload;

    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = $host;
        $mail->SMTPAuth = cfg('SMTP_USER') !== '';
        $mail->Username = cfg('SMTP_USER');
        $mail->Password = cfg('SMTP_PASSWORD');
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port = (int) cfg('SMTP_PORT', '465');
        $mail->CharSet = 'UTF-8';
        $mail->setFrom(cfg('SMTP_FROM', 'noreply@localhost'), cfg('SMTP_FROM_NAME', 'Matt Innova'));
        $mail->addAddress($to, $toName);
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $html;
        $mail->send();
        return true;
    } catch (Throwable) {
        return false;
    }
}
