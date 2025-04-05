<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'clearpw',
        'emailpw',
        'active',
        'gid',
        'uid',
        'home',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be visible in arrays.
     *
     * @var array<int, string>
     */
    protected $visible = [
        'id',
        'name',
        'email',
        'email_verified_at',
        'created_at',
        'updated_at',
        'clearpw',
        'emailpw',
        'active',
        'gid',
        'uid',
        'home',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'active' => 'boolean',
        ];
    }

    /**
     * Set the user's password and keep all password fields in sync.
     *
     * @param  string  $value
     * @return void
     */
    public function setPasswordAttribute($value)
    {
        // Don't hash again if password is already hashed
        if (isset($this->attributes['password']) && $value === $this->attributes['password']) {
            return;
        }

        // Hash the password using Bcrypt
        $this->attributes['password'] = Hash::make($value);

        // Store the cleartext password for reference
        $this->attributes['clearpw'] = $value;

        // Generate Dovecot compatible password hash
        $this->generateEmailPassword($value);
    }

    /**
     * Set the clear text password attribute.
     *
     * @param  string  $value
     * @return void
     */
    public function setClearpwAttribute($value)
    {
        // Store the cleartext password
        $this->attributes['clearpw'] = $value;

        // Always update other password fields when clearpw is changed
        // Update the hashed password for web authentication
        $this->password = $value; // Use the setter to ensure proper hashing

        // Generate Dovecot compatible password hash
        $this->generateEmailPassword($value);

        // Log the synchronization for debugging
        Log::info('Password synchronization triggered', [
            'user_id' => $this->attributes['id'] ?? 'new user',
            'clearpw_updated' => true,
            'password_updated' => true,
            'emailpw_updated' => true,
        ]);
    }

    /**
     * Generate a Dovecot-compatible password hash using doveadm.
     *
     * @param  string  $clearPassword
     * @return void
     */
    protected function generateEmailPassword($clearPassword)
    {
        if (empty($clearPassword)) {
            $this->attributes['emailpw'] = null;

            return;
        }

        try {
            // Escape the password to prevent shell injection
            $escapedPassword = escapeshellarg($clearPassword);

            // Use doveadm to generate a SHA512-CRYPT hash
            $command = "/usr/bin/doveadm pw -s SHA512-CRYPT -p {$escapedPassword}";
            $emailPassword = shell_exec($command);

            // Trim any whitespace and store the result
            $this->attributes['emailpw'] = trim($emailPassword);

            // Log success without exposing the actual password
            $email = isset($this->attributes['email']) ? $this->attributes['email'] : 'new user';
            Log::info("Generated Dovecot password hash for user: {$email}");
        } catch (\Exception $e) {
            // Log error but continue
            Log::error('Failed to generate emailpw: '.$e->getMessage());

            // Set emailpw to null in case of failure
            $this->attributes['emailpw'] = null;
        }
    }
}
