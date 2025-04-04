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
        Route::get('users/{user}', [UserController::class, 'show'])->name('users.show');
        Route::post('users', [UserController::class, 'store'])->name('users.store');
        Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
        Route::post('users/batch-delete', [UserController::class, 'batchDestroy'])->name('users.batch-destroy');
    });

    // Test route for password synchronization
    Route::get('test-password-sync', function () {
        $user = \App\Models\User::find(1); // Get first user

        if (! $user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        // Generate a random password for testing
        $newPassword = \Illuminate\Support\Str::random(10);

        // Track original values
        $originalPassword = $user->password;
        $originalClearPw = $user->clearpw;
        $originalEmailPw = $user->emailpw;

        // Update the password
        $user->update(['password' => $newPassword]);

        // Reload the user to get fresh data
        $user->refresh();

        // Return the information (without showing the actual hashed password contents)
        return response()->json([
            'original' => [
                'password_changed' => $originalPassword !== $user->password,
                'clearpw_before' => $originalClearPw,
                'emailpw_before' => $originalEmailPw,
            ],
            'current' => [
                'clearpw' => $user->clearpw,
                'password_is_hashed' => \Illuminate\Support\Str::startsWith($user->password, '$2y$'),
                'emailpw_changed' => $originalEmailPw !== $user->emailpw,
                'emailpw_format' => $user->emailpw ? substr($user->emailpw, 0, 10).'...' : null,
            ],
            'success' => $user->clearpw === $newPassword && $user->emailpw !== $originalEmailPw,
            'timestamp' => now()->toDateTimeString(),
        ]);
    })->name('test-password-sync');

    Route::get('phpinfo', function () {
        return dd(phpinfo());
    });
    
    // Test route for direct field updates
    Route::get('test-field-update/{id}/{field}/{value}', function ($id, $field, $value) {
        \Log::info("Direct field update requested", [
            'id' => $id,
            'field' => $field,
            'value' => $value
        ]);
        
        try {
            // Only allow certain fields to be updated
            if (!in_array($field, ['name', 'email', 'clearpw'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Field cannot be updated directly'
                ], 400);
            }
            
            $user = \App\Models\User::findOrFail($id);
            $oldValue = $user->$field;
            
            // Update the field using the proper setter methods to ensure accessors are triggered
            if ($field === 'clearpw') {
                // Use the explicit setter method so all password fields are synchronized
                $user->setClearpwAttribute($value);
            } else {
                // For other fields, direct assignment is fine
                $user->$field = $value;
            }
            
            // Save the changes
            $user->save();
            
            \Log::info("Direct field update completed", [
                'id' => $id,
                'field' => $field,
                'old_value' => $oldValue,
                'new_value' => $value,
                'user_after' => $user->toArray()
            ]);
            
            return response()->json([
                'success' => true,
                'message' => ucfirst($field) . ' updated successfully',
                'before' => $oldValue,
                'after' => $user->$field,
                // Include additional fields if clearpw was updated to verify synchronization
                'synced_fields' => $field === 'clearpw' ? [
                    'clearpw' => $user->clearpw,
                    'emailpw_updated' => $user->emailpw !== null,
                    'emailpw_format' => $user->emailpw ? substr($user->emailpw, 0, 10).'...' : null,
                ] : null
            ]);
        } catch (\Exception $e) {
            \Log::error("Direct field update failed", [
                'id' => $id,
                'field' => $field,
                'value' => $value,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Update failed: ' . $e->getMessage()
            ], 500);
        }
    })->name('test-field-update');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
