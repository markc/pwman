<?php

use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('user-list', function () {
        return Inertia::render('users/index');
    })->name('users.list');

    // User API endpoints - Using API middleware for proper response handling
    Route::prefix('api')->group(function () {
        Route::get('users', [UserController::class, 'userDataTable'])->name('users.datatable');
        Route::post('users', [UserController::class, 'store'])->name('users.store');
        Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
        Route::post('users/batch-delete', [UserController::class, 'batchDestroy'])->name('users.batch-destroy');
    });

    Route::get('phpinfo', function () {
        return dd(phpinfo());
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
