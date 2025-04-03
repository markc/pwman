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
        $query = User::query();
        $perPage = $validatedQueryParams->perPage ?? 10;
        $currentPage = request()->page ?? 1;
        $search = request()->search ?? '';
        $sort = request()->sort ?? 'updated_at';
        $direction = request()->direction ?? 'desc';

        // Validate sort field (whitelist approach for security)
        $allowedSortFields = ['name', 'email', 'created_at', 'updated_at'];
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
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Apply sorting
        $query->orderBy($sort, $direction);

        $users = $query->paginate($perPage);

        return $users;
    }

    public function createUser($request): ?User
    {
        return User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);
    }

    /**
     * Create a new user
     */
    public function create(array $data): User
    {
        // Generate a random password if not provided
        if (! isset($data['password'])) {
            $data['password'] = Hash::make(\Illuminate\Support\Str::random(10));
        } else {
            $data['password'] = Hash::make($data['password']);
        }

        return $this->model->create($data);
    }

    /**
     * Update an existing user
     */
    public function update($id, array $data): User
    {
        $user = $this->model->findOrFail($id);

        // Only hash password if it's provided
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

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
