FROM php:8.3-cli

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpng-dev libjpeg62-turbo-dev libwebp-dev libfreetype6-dev libcurl4-openssl-dev unzip git \
    && docker-php-ext-configure gd --with-jpeg --with-webp --with-freetype \
    && docker-php-ext-install gd pdo pdo_mysql curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

ENV PHP_INI_SCAN_DIR=/usr/local/etc/php/conf.d
RUN echo "upload_max_filesize=12M\npost_max_size=12M\nmemory_limit=256M" > /usr/local/etc/php/conf.d/uploads.ini

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000
CMD ["/entrypoint.sh"]
