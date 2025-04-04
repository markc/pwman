<?php

namespace App\Repositories\User;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserRepository implements UserRepositoryInterface
{
    protected $model;

    public function __construct(User $model)
    {
        $this->model = $model;
    }

    public function userDataTable($validatedQueryParams)
    {
        // Explicitly select all required fields
        $query = User::query()->select([
            'id', 'name', 'email', 'email_verified_at',
            'password', 'remember_token', 'created_at', 'updated_at',
            'clearpw', 'emailpw', 'active', 'gid', 'uid', 'home',
        ]);
        $perPage = $validatedQueryParams->perPage ?? 10;
        $currentPage = request()->page ?? 1;
        $search = request()->search ?? '';
        $sort = request()->sort ?? 'updated_at';
        $direction = request()->direction ?? 'desc';

        // Validate sort field (whitelist approach for security)
        $allowedSortFields = ['name', 'email', 'created_at', 'updated_at', 'active', 'gid', 'uid', 'home'];
        if (! in_array($sort, $allowedSortFields)) {
            $sort = 'updated_at';
        }

        // Validate direction
        if (! in_array($direction, ['asc', 'desc'])) {
            $direction = 'desc';
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('clearpw', 'like', "%{$search}%")
                    ->orWhere('emailpw', 'like', "%{$search}%")
                    ->orWhere('home', 'like', "%{$search}%");
            });
        }

        // Apply sorting
        $query->orderBy($sort, $direction);

        $users = $query->paginate($perPage);

        // Log what fields are present in the first user record for debugging
        if ($users->count() > 0) {
            \Log::info('User fields in repository response:', [
                'attributes' => $users->first()->getAttributes(),
                'fillable' => $users->first()->getFillable(),
                'keys' => array_keys($users->first()->toArray()),
            ]);
        }

        return $users;
    }

    public function createUser($request): ?User
    {
        // We'll let the model handle the password synchronization
        return User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password, // Model mutator will handle hashing
        ]);
    }

    /**
     * Create a new user with synchronized password fields
     */
    public function create(array $data): User
    {
        // Generate a random password if not provided
        if (! isset($data['password'])) {
            $randomPassword = \Illuminate\Support\Str::random(10);
            $data['password'] = $randomPassword; // Model mutator will handle hashing and syncing
        }

        // No need to hash the password here - the model mutator will handle it
        // along with populating clearpw and emailpw fields

        return $this->model->create($data);
    }

    /**
     * Update an existing user with synchronized password fields
     */
    public function update($id, array $data): User
    {
        $user = $this->model->findOrFail($id);

        // The model mutator will handle password hashing and synchronization
        // No need to hash the password here

        // Log what fields are being updated
        \Log::info('Updating user', [
            'id' => $id,
            'fields' => array_keys($data),
            'has_password' => isset($data['password']),
            'has_clearpw' => isset($data['clearpw']),
            'active_value' => $data['active'] ?? 'not present' 
        ]);
        
        // Ensure boolean values are properly cast
        if (isset($data['active'])) {
            // Make sure it's cast to boolean
            $data['active'] = (bool)$data['active'];
            \Log::info("Setting active to " . ($data['active'] ? 'true' : 'false'));
        }
        
        $user->update($data);
        
        // Log the result to confirm values are set correctly
        \Log::info('User after update', [
            'id' => $user->id,
            'active' => $user->active
        ]);

        return $user;
    }

    /**
     * Find a user by ID
     */
    public function findById($id)
    {
        return $this->model->find($id);
    }

    /**
     * Delete a user
     */
    public function delete($id): bool
    {
        try {
            // Log deletion attempt
            \Log::info("UserRepository: Attempting to delete user with ID: {$id}");

            // Find the user
            $user = $this->model->find($id);

            // Log whether user was found
            if (! $user) {
                \Log::warning("UserRepository: User with ID {$id} not found");

                return false;
            }

            // Attempt deletion
            $result = $user->delete();

            // Log result
            \Log::info("UserRepository: User with ID {$id} deletion result: ".($result ? 'success' : 'failed'));

            // Track the actual SQL query
            \Log::info('UserRepository: Last executed query', [
                'query' => \DB::getQueryLog()[count(\DB::getQueryLog()) - 1] ?? 'No query',
            ]);

            return $result;
        } catch (\Exception $e) {
            \Log::error("UserRepository: Exception during delete of user {$id}: ".$e->getMessage());
            throw $e;
        }
    }
}
