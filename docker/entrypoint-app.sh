#!/bin/sh
cd /var/www/html || exit 1

if [ ! -f vendor/autoload.php ]; then
    echo "[docker/app] vendor missing - running composer install..."
    composer install --no-interaction --prefer-dist || exit 1
fi

echo "[docker/app] Running migrations..."
php artisan migrate --force || exit 1

exec env PHP_CLI_SERVER_WORKERS=4 php artisan serve --host=0.0.0.0 --port=8000 --no-reload
