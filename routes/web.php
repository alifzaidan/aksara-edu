<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\MentorController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::middleware(['role:admin'])->group(function () {
        Route::redirect('admin', 'admin/dashboard');
        Route::get('admin/dashboard', [AdminController::class, 'index'])->name('dashboard');
        Route::resource('admin/categories', CategoryController::class);
        Route::resource('admin/mentors', MentorController::class);
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
