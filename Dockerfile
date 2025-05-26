# S? d?ng PHP 8.3 v?i Alpine Linux
FROM php:8.3-fpm-alpine

# Cài d?t các thu vi?n h? th?ng c?n thi?t
RUN apk add --no-cache \
    oniguruma-dev libpng-dev libjpeg-turbo-dev freetype-dev libzip-dev icu-dev \
    zip unzip git curl bash shadow libxml2-dev supervisor

# Cài đặt Node.js và npm
RUN apk add --no-cache nodejs npm

# Cài d?t các extensions PHP
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install intl pdo pdo_mysql mbstring exif pcntl bcmath gd zip calendar

# Cài d?t Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Thi?t l?p thu m?c làm vi?c
WORKDIR /var/www

# Copy toàn b? mã ngu?n vào container
COPY . .


# Copy file Composer tru?c d? t?n d?ng cache Docker
# COPY composer.json composer.lock ./
RUN composer update && composer update barryvdh/laravel-debugbar
# RUN composer install --no-ansi --no-dev --no-interaction --no-scripts --optimize-autoloader
RUN composer install

# Cài đặt các dependency của Node.js
RUN npm install

# Chạy build cho frontend
RUN npm run dev

# Sao chép file .env
COPY .env .env

# T?o khóa ?ng d?ng Laravel
# RUN php artisan key:generate
RUN php artisan cms:publish:assets

RUN php artisan view:cache

# Thi?t l?p quy?n cho thu m?c storage và bootstrap/cache
RUN chmod -R 775 storage bootstrap/cache platform/plugins \
    && chown -R www-data:www-data storage bootstrap/cache platform

# T?o thu m?c cho supervisor logs
RUN mkdir -p /var/log/supervisor

# C?u h?nh supervisor
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Entrypoint script
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
#testttttttttt
# Ch?y entrypoint script khi container kh?i d?ng
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]