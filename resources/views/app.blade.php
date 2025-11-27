<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class([
    'scroll-smooth',
    'dark' => ($appearance ?? 'system') == 'dark',
])>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    {{-- <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests"> --}}

    {{-- Inline script to detect system dark mode preference and apply it immediately --}}
    <script>
        (function() {
            const appearance = '{{ $appearance ?? 'system' }}';

            if (appearance === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                if (prefersDark) {
                    document.documentElement.classList.add('dark');
                }
            }
        })();
    </script>

    {{-- Inline style to set the HTML background color based on our theme in app.css --}}
    <style>
        html {
            background-color: oklch(1 0 0);
        }

        html.dark {
            background-color: oklch(0.145 0 0);
        }
    </style>

    <title inertia>{{ config('app.name', 'Aksademy') }}</title>

    <meta name="description"
        content="Aksademy adalah platform edukasi digital yang menyediakan layanan pembelajaran mulai dari kelas online, webinar, dan bootcamp.">
    <meta name="keywords"
        content="Aksademy, platform edukasi, pembelajaran online, kelas online, webinar, bootcamp, pengembangan keterampilan, kursus digital">
    <meta name="author" content="Aksara Teknologi Mandiri">
    <meta name="robots" content="index, follow">

    <meta property="og:title" content="Aksademy">
    <meta property="og:description"
        content="Aksademy adalah platform edukasi digital yang menyediakan layanan pembelajaran mulai dari kelas online, webinar, dan bootcamp.">
    <meta property="og:image" content="{{ asset('assets/images/logo-square.png') }}">
    <meta property="og:url" content="{{ url()->current() }}">
    <meta property="og:type" content="website">

    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

    @routes
    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    @inertiaHead
</head>

<body class="font-sans antialiased">
    @inertia
</body>

</html>
