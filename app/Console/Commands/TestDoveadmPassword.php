<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class TestDoveadmPassword extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:doveadm-password {password? : The password to hash}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test the doveadm password hashing functionality';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Get the password from the argument or ask for it
        $password = $this->argument('password') ?: $this->secret('Enter a password to hash');

        // Show the password that will be hashed
        $this->info('Testing password hashing for: '.$password);

        // Attempt to run the doveadm command
        try {
            // Escape the password to prevent shell injection
            $escapedPassword = escapeshellarg($password);

            // Use doveadm to generate a SHA512-CRYPT hash
            $command = "/usr/bin/doveadm pw -s SHA512-CRYPT -p {$escapedPassword}";

            $this->info('Executing command: '.preg_replace('/pw -s SHA512-CRYPT -p .*$/', 'pw -s SHA512-CRYPT -p [MASKED]', $command));

            $emailPassword = shell_exec($command);

            // Trim any whitespace
            $emailPassword = trim($emailPassword);

            // Display the result
            $this->info('Generated hash:');
            $this->line($emailPassword);

            // Verify the hash format
            if (strpos($emailPassword, '{SHA512-CRYPT}') === 0) {
                $this->info('✅ Hash generated successfully with correct format');
            } else {
                $this->error('❌ Hash does not have the expected format');
            }
        } catch (\Exception $e) {
            $this->error('Failed to generate hash: '.$e->getMessage());

            return 1;
        }

        // Try the php password_hash function for comparison
        $phpHash = password_hash($password, PASSWORD_BCRYPT);
        $this->info("For comparison, PHP's password_hash() produces:");
        $this->line($phpHash);

        return 0;
    }
}
