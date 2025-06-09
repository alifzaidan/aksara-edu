<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\BootcampController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\MentorController;
use App\Http\Controllers\ToolController;
use App\Http\Controllers\WebinarController;
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
        Route::resource('admin/tools', ToolController::class);
        Route::post('/admin/tools/{id}', [ToolController::class, 'update'])->name('tools.update');
        Route::resource('admin/courses', CourseController::class);
        Route::resource('admin/webinars', WebinarController::class);
        Route::post('/admin/webinars/{webinar}/publish', [WebinarController::class, 'publish'])->name('webinars.publish');
        Route::post('/admin/webinars/{webinar}/archive', [WebinarController::class, 'archive'])->name('webinars.archive');
        Route::post('/admin/webinars/{webinar}/duplicate', [WebinarController::class, 'duplicate'])->name('webinars.duplicate');
        Route::resource('admin/bootcamps', BootcampController::class);
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
