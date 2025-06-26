<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AffiliateController;
use App\Http\Controllers\BootcampController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\MentorController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\ToolController;
use App\Http\Controllers\User\CourseController as UserCourseController;
use App\Http\Controllers\User\BootcampController as UserBootcampController;
use App\Http\Controllers\User\WebinarController as UserWebinarController;
use App\Http\Controllers\User\HomeController;
use App\Http\Controllers\User\ProfileController;
use App\Http\Controllers\WebinarController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/course', [UserCourseController::class, 'index'])->name('course.index');
Route::get('/course/{course:slug}', [UserCourseController::class, 'detail'])->name('course.detail');
Route::get('/bootcamp', [UserBootcampController::class, 'index'])->name('bootcamp.index');
Route::get('/bootcamp/{bootcamp:slug}', [UserBootcampController::class, 'detail'])->name('bootcamp.detail');
Route::get('/webinar', [UserWebinarController::class, 'index'])->name('webinar.index');
Route::get('/webinar/{webinar:slug}', [UserWebinarController::class, 'detail'])->name('webinar.detail');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/course/{course:slug}/checkout', [UserCourseController::class, 'showCheckout'])->name('course.checkout');
    Route::get('/bootcamp/{bootcamp:slug}/register', [UserBootcampController::class, 'showRegister'])->name('bootcamp.register');
    Route::get('/webinar/{webinar:slug}/register', [UserWebinarController::class, 'showRegister'])->name('webinar.register');

    Route::get('/course/checkout/success', [UserCourseController::class, 'showCheckoutSuccess'])->name('course.checkout.success');
    Route::get('/bootcamp/register/success', [UserBootcampController::class, 'showRegisterSuccess'])->name('bootcamp.register.success');
    Route::get('/webinar/register/success', [UserWebinarController::class, 'showRegisterSuccess'])->name('webinar.register.success');

    Route::post('/invoice', [InvoiceController::class, 'store'])->name('invoice.store');
    Route::get('/invoice/{id}', [InvoiceController::class, 'show'])->name('invoice.show');

    Route::redirect('profile', 'profile/dashboard');
    Route::get('/profile/dashboard', [ProfileController::class, 'index'])->name('profile.index');
    Route::get('/profile/my-courses', [ProfileController::class, 'showMyCourses'])->name('profile.courses');
    Route::get('/profile/my-courses/{course}', [ProfileController::class, 'detailMyCourse'])->name('profile.course.detail');
    Route::get('/profile/my-bootcamps', [ProfileController::class, 'showMyBootcamps'])->name('profile.bootcamps');
    Route::get('/profile/my-bootcamps/{bootcamp}', [ProfileController::class, 'detailMyBootcamp'])->name('profile.bootcamp.detail');
    Route::get('/profile/my-webinars', [ProfileController::class, 'showMyWebinars'])->name('profile.webinars');
    Route::get('/profile/my-webinars/{webinar}', [ProfileController::class, 'detailMyWebinar'])->name('profile.webinar.detail');
    Route::get('/profile/transactions', [ProfileController::class, 'showTransactions'])->name('profile.transactions');
});

Route::middleware(['auth', 'verified', 'role:admin|mentor|affiliate'])->prefix('admin')->group(function () {
    Route::redirect('/', 'admin/dashboard');
    Route::get('dashboard', [AdminController::class, 'index'])->name('dashboard');

    Route::middleware(['role:admin|mentor'])->group(function () {
        Route::resource('categories', CategoryController::class);
        Route::resource('tools', ToolController::class);
        Route::post('/tools/{id}', [ToolController::class, 'update'])->name('tools.update');

        Route::resource('courses', CourseController::class);
        Route::post('/courses/{course}/publish', [CourseController::class, 'publish'])->name('courses.publish');
        Route::post('/courses/{course}/archive', [CourseController::class, 'archive'])->name('courses.archive');
        Route::post('/courses/{course}/duplicate', [CourseController::class, 'duplicate'])->name('courses.duplicate');
        Route::get('/courses/{course}/{quiz}', [QuizController::class, 'show'])->name('quizzes.show');
        Route::post('/questions', [QuestionController::class, 'store'])->name('questions.store');
        Route::put('/questions/{question}', [QuestionController::class, 'update'])->name('questions.update');
        Route::delete('/questions/{question}', [QuestionController::class, 'destroy'])->name('questions.destroy');

        Route::resource('bootcamps', BootcampController::class);
        Route::post('/bootcamps/{bootcamp}/publish', [BootcampController::class, 'publish'])->name('bootcamps.publish');
        Route::post('/bootcamps/{bootcamp}/archive', [BootcampController::class, 'archive'])->name('bootcamps.archive');
        Route::post('/bootcamps/{bootcamp}/duplicate', [BootcampController::class, 'duplicate'])->name('bootcamps.duplicate');

        Route::resource('webinars', WebinarController::class);
        Route::post('/webinars/{webinar}/publish', [WebinarController::class, 'publish'])->name('webinars.publish');
        Route::post('/webinars/{webinar}/archive', [WebinarController::class, 'archive'])->name('webinars.archive');
        Route::post('/webinars/{webinar}/duplicate', [WebinarController::class, 'duplicate'])->name('webinars.duplicate');
    });

    Route::middleware(['role:admin'])->group(function () {
        Route::resource('mentors', MentorController::class);
        Route::resource('affiliates', AffiliateController::class);
        Route::post('affiliates/{affiliate}/toggle-status', [AffiliateController::class, 'toggleStatus'])->name('affiliates.toggleStatus');
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
