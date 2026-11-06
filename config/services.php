<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],
    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI'),
    ],
    'github' => [
        'client_id' => env('GITHUB_CLIENT_ID'),
        'client_secret' => env('GITHUB_CLIENT_SECRET'),
        'redirect' => env('GITHUB_REDIRECT_URI'),
    ],

    'wablas' => [
        'domain' => env('DOMAIN_SERVER_WABLAS'),
        'token'  => env('SECURITY_TOKEN_WABLAS_AI', env('SECURITY_TOKEN_WABLAS')),
        'secret' => env('SECRET_KEY_WABLAS_AI', env('SECRET_KEY_WABLAS')),
    ],

    'messara' => [
        'domain'                => env('MESSARA_DOMAIN_SERVER', env('DOMAIN_SERVER_MESSARA', 'https://messara.aksarateknologi.co.id')),
        'api_key'               => env('MESSARA_API_KEY', env('API_KEY_MESSARA')),
        'secret_key'            => env('MESSARA_SECRET_KEY', env('SECRET_KEY_MESSARA')),
        'invoice_template_name' => env('WA_INVOICE_TEMPLATE_NAME', 'invoice_pembayaran_berhasil'),
        'use_template'          => env('WA_USE_TEMPLATE', true),
    ],

    'evolution' => [
        'url' => env('EVOLUTION_API_URL'),
        'key' => env('EVOLUTION_API_KEY'),
        'instance' => env('EVOLUTION_INSTANCE', 'sekolah-pajak'),
    ],

    'default_wa_gateway' => env('DEFAULT_WA_GATEWAY', 'messara'),

    'openai' => [
        'key' => env('OPENAI_API_KEY'),
        'model' => env('OPENAI_MODEL', 'gpt-3.5-turbo'),
    ],

    'doku' => [
        'client_id'  => env('DOKU_CLIENT_ID'),
        'secret_key' => env('DOKU_SECRET_KEY'),
        'sandbox'    => env('DOKU_SANDBOX', true),
    ],

];
