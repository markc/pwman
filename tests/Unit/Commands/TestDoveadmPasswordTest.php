<?php

use App\Console\Commands\TestDoveadmPassword;

test('test doveadm password command executes successfully', function () {
    // Mock the shell_exec function to return a valid hash
    $this->mock('function.shell_exec', function () {
        return '{SHA512-CRYPT}$6$rounds=5000$abcdefghijklmnop$qrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz';
    });

    $command = $this->app->make(TestDoveadmPassword::class);

    $this->artisan('test:doveadm-password', ['password' => 'test123'])
        ->expectsOutput('Testing password hashing for: test123')
        ->expectsOutput('✅ Hash generated successfully with correct format')
        ->assertExitCode(0);
})->group('shell');

test('test doveadm password command with actual shell execution', function () {
    // This test will actually execute the shell command
    // It will be skipped in GitHub CI due to the 'shell' group

    $command = $this->app->make(TestDoveadmPassword::class);

    $this->artisan('test:doveadm-password', ['password' => 'test123'])
        ->expectsOutput('Testing password hashing for: test123')
        ->assertExitCode(0);
})->group('shell');
