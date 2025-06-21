<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\BootcampController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\MentorController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\ToolController;
use App\Http\Controllers\User\CourseController as UserCourseController;
use App\Http\Controllers\User\BootcampController as UserBootcampController;
use App\Http\Controllers\User\WebinarController as UserWebinarController;
use App\Http\Controllers\User\HomeController;
use App\Http\Controllers\WebinarController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/course', [UserCourseController::class, 'index'])->name('course.index');
Route::get('/course/{course:slug}', [UserCourseController::class, 'detail'])->name('course.detail');
Route::get('/course/{course:slug}/checkout', [UserCourseController::class, 'showCheckout'])->name('course.checkout');
Route::get('/bootcamp', [UserBootcampController::class, 'index'])->name('bootcamp.index');
Route::get('/bootcamp/{bootcamp:slug}', [UserBootcampController::class, 'detail'])->name('bootcamp.detail');
Route::get('/webinar', [UserWebinarController::class, 'index'])->name('webinar.index');
Route::get('/webinar/{webinar:slug}', [UserWebinarController::class, 'detail'])->name('webinar.detail');

Route::get('/course/checkout/success', [UserCourseController::class, 'showCheckoutSuccess'])->name('course.checkout.success');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::middleware(['role:admin'])->group(function () {
        Route::redirect('admin', 'admin/dashboard');
        Route::get('admin/dashboard', [AdminController::class, 'index'])->name('dashboard');
        Route::resource('admin/categories', CategoryController::class);
        Route::resource('admin/mentors', MentorController::class);
        Route::resource('admin/tools', ToolController::class);
        Route::post('/admin/tools/{id}', [ToolController::class, 'update'])->name('tools.update');
        Route::resource('admin/courses', CourseController::class);
        Route::post('/admin/courses/{course}/publish', [CourseController::class, 'publish'])->name('courses.publish');
        Route::post('/admin/courses/{course}/archive', [CourseController::class, 'archive'])->name('courses.archive');
        Route::post('/admin/courses/{course}/duplicate', [CourseController::class, 'duplicate'])->name('courses.duplicate');
        Route::get('/admin/courses/{course}/{quiz}', [QuizController::class, 'show'])->name('quizzes.show');
        Route::post('/admin/questions', [QuestionController::class, 'store'])->name('questions.store');
        Route::put('/admin/questions/{question}', [QuestionController::class, 'update'])->name('questions.update');
        Route::delete('/admin/questions/{question}', [QuestionController::class, 'destroy'])->name('questions.destroy');
        Route::resource('admin/webinars', WebinarController::class);
        Route::post('/admin/webinars/{webinar}/publish', [WebinarController::class, 'publish'])->name('webinars.publish');
        Route::post('/admin/webinars/{webinar}/archive', [WebinarController::class, 'archive'])->name('webinars.archive');
        Route::post('/admin/webinars/{webinar}/duplicate', [WebinarController::class, 'duplicate'])->name('webinars.duplicate');
        Route::resource('admin/bootcamps', BootcampController::class);
        Route::post('/admin/bootcamps/{bootcamp}/publish', [BootcampController::class, 'publish'])->name('bootcamps.publish');
        Route::post('/admin/bootcamps/{bootcamp}/archive', [BootcampController::class, 'archive'])->name('bootcamps.archive');
        Route::post('/admin/bootcamps/{bootcamp}/duplicate', [BootcampController::class, 'duplicate'])->name('bootcamps.duplicate');
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
