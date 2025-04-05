<?php

namespace App\Http\Controllers;

use App\Exceptions\CustomException;
use App\Repositories\User\UserRepositoryInterface;
use App\Services\DataTableParamsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class UserController extends Controller
{
    protected $repo;

    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->repo = $userRepository;
    }
    
    /**
     * Get a specific user by ID.
     */
    public function show(Request $request, $id): JsonResponse
    {
        try {
            $user = $this->repo->findById($id);
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => $user,
            ]);
        } catch (\Throwable $th) {
            defer(fn () => Log::error('UserController show error: '.$th->getMessage(), [
                'message' => $th->getMessage(),
                'file' => $th->getFile(),
                'line' => $th->getLine(),
            ]));
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving the user',
                'error' => $th->getMessage()
            ], 500);
        }
    }

    public function userDataTable(Request $request): JsonResponse
    {
        try {
            $validatedQueryParams = new DataTableParamsService($request);

            $users = $this->repo->userDataTable($validatedQueryParams);

            // Log the response data structure
            if ($users->count() > 0) {
                \Log::info('User Data in API Response:', [
                    'fields' => array_keys($users->first()->toArray()),
                    'sample' => $users->first()->toArray(),
                ]);
            }

            return response()->json($users, 200);
        } catch (CustomException $ce) {
            return $ce->render();
        } catch (\Throwable $th) {
            defer(fn () => Log::error('UserController error: '.$th->getMessage(), [
                'message' => $th->getMessage(),
                'file' => $th->getFile(),
                'line' => $th->getLine(),
            ]));

            return response()->json([
                'status' => 500,
                'message' => 'An unexpected error occurred.',
                'debug' => $th->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'sometimes|string|min:8',
                'clearpw' => 'nullable|string|max:127',
                'emailpw' => 'nullable|string|max:127',
                'active' => 'sometimes|boolean',
                'gid' => 'sometimes|integer|min:0',
                'uid' => 'sometimes|integer|min:0',
                'home' => 'nullable|string|max:127',
            ]);

            $user = $this->repo->create($validated);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'User created successfully',
                    'data' => $user,
                ], 200);
            }

            return redirect()->back()->with('success', 'User created successfully');
        } catch (\Illuminate\Validation\ValidationException $ve) {
            throw $ve;
        } catch (\Throwable $th) {
            defer(fn () => Log::error('UserController store error: '.$th->getMessage(), [
                'message' => $th->getMessage(),
                'file' => $th->getFile(),
                'line' => $th->getLine(),
            ]));

            if ($request->header('X-Inertia')) {
                return back()->withErrors([
                    'error' => 'An unexpected error occurred: '.$th->getMessage(),
                ]);
            } else if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'An unexpected error occurred.',
                    'error' => $th->getMessage(),
                ], 500);
            }

            return redirect()->back()->withErrors([
                'error' => 'An unexpected error occurred: '.$th->getMessage(),
            ]);
        }
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, $id)
    {
        // Log raw request for debugging network errors
        Log::info('Raw update request received', [
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'content_type' => $request->header('Content-Type'),
            'accept' => $request->header('Accept'),
            'user_agent' => $request->header('User-Agent'),
            'is_ajax' => $request->ajax(),
            'is_json' => $request->isJson(),
            'raw_content' => $request->getContent(),
        ]);
        try {
            // Log incoming request data for debugging
            Log::info('UserController update request', [
                'id' => $id,
                'request_data' => $request->all(),
                'request_content' => $request->getContent(),
                'request_headers' => $request->headers->all(),
                'is_active_update' => $request->has('active'),
                'is_name_update' => $request->has('name'),
                'is_email_update' => $request->has('email'),
                'is_clearpw_update' => $request->has('clearpw'),
                'field_values' => [
                    'name' => $request->input('name'),
                    'email' => $request->input('email'),
                    'clearpw' => $request->input('clearpw'),
                    'active' => $request->input('active')
                ]
            ]);
            
            // Different validation for update - email unique except current user
            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|string|email|max:255|unique:users,email,'.$id,
                'password' => 'sometimes|string|min:8',
                'clearpw' => 'nullable|string|max:127',
                'emailpw' => 'nullable|string|max:127',
                'active' => 'sometimes|boolean',
                'gid' => 'sometimes|integer|min:0',
                'uid' => 'sometimes|integer|min:0',
                'home' => 'nullable|string|max:127',
            ]);
            
            // For boolean values coming in as strings, convert them
            if (isset($validated['active']) && is_string($validated['active'])) {
                $validated['active'] = filter_var($validated['active'], FILTER_VALIDATE_BOOLEAN);
                Log::info('Converted active string to boolean', ['value' => $validated['active']]);
            }
            
            // Log validated data
            Log::info('UserController update validated data', [
                'validated_data' => $validated
            ]);

            $user = $this->repo->update($id, $validated);

            // Always return JSON for API requests
            if ($request->wantsJson() || $request->isJson() || $request->ajax() || $request->header('Accept') == 'application/json') {
                return response()->json([
                    'success' => true,
                    'message' => 'User updated successfully',
                    'data' => $user,
                ], 200);
            }

            return redirect()->back()->with('success', 'User updated successfully');
        } catch (\Illuminate\Validation\ValidationException $ve) {
            throw $ve;
        } catch (\Throwable $th) {
            defer(fn () => Log::error('UserController update error: '.$th->getMessage(), [
                'message' => $th->getMessage(),
                'file' => $th->getFile(),
                'line' => $th->getLine(),
            ]));

            if ($request->header('X-Inertia')) {
                return back()->withErrors([
                    'error' => 'An unexpected error occurred: '.$th->getMessage(),
                ]);
            } else if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'An unexpected error occurred.',
                    'error' => $th->getMessage(),
                ], 500);
            }

            return redirect()->back()->withErrors([
                'error' => 'An unexpected error occurred: '.$th->getMessage(),
            ]);
        }
    }

    /**
     * Remove the specified user.
     */
    public function destroy(Request $request, $id)
    {
        try {
            // Check if user exists before trying to delete
            $user = $this->repo->findById($id);

            if (! $user) {
                if ($request->wantsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => "User with ID {$id} not found",
                    ], 404);
                }

                return redirect()->back()->withErrors([
                    'error' => "User with ID {$id} not found",
                ]);
            }

            $result = $this->repo->delete($id);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'User deleted successfully',
                ], 200);
            }

            return redirect()->back()->with('success', 'User deleted successfully');
        } catch (\Throwable $th) {
            defer(fn () => Log::error('UserController destroy error: '.$th->getMessage(), [
                'message' => $th->getMessage(),
                'file' => $th->getFile(),
                'line' => $th->getLine(),
            ]));

            if ($request->header('X-Inertia')) {
                return back()->withErrors([
                    'error' => 'An unexpected error occurred: '.$th->getMessage(),
                ]);
            } else if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'An unexpected error occurred.',
                    'error' => $th->getMessage(),
                ], 500);
            }

            return redirect()->back()->withErrors([
                'error' => 'An unexpected error occurred: '.$th->getMessage(),
            ]);
        }
    }

    /**
     * Remove multiple users at once.
     */
    public function batchDestroy(Request $request)
    {
        try {
            // Parse JSON input directly
            $content = $request->getContent();
            $data = json_decode($content, true);
            $ids = $data['ids'] ?? [];

            // Convert string IDs to integers if needed
            $ids = array_map(function ($id) {
                return is_numeric($id) ? (int) $id : $id;
            }, $ids);

            // Enable query logging to see all database operations
            \DB::enableQueryLog();

            // Log the incoming request data for debugging
            Log::info('BatchDestroy request data', [
                'raw_content' => $content,
                'parsed_json' => $data,
                'ids_extracted' => $ids,
                'request_input' => $request->input('ids'),
                'request_all' => $request->all(),
                'content_type' => $request->header('Content-Type'),
                'is_ajax' => $request->ajax() ? 'yes' : 'no',
            ]);

            if (empty($ids)) {
                if ($request->wantsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid request: ids array is required',
                    ], 400);
                }

                return redirect()->back()->withErrors([
                    'error' => 'Invalid request: ids array is required',
                ]);
            }

            $deletedCount = 0;
            $errors = [];

            // Process each deletion individually
            foreach ($ids as $id) {
                try {
                    // Log before deletion attempt
                    Log::info("Attempting to delete user with ID: {$id}");

                    // Use the repository to delete the user
                    $result = $this->repo->delete($id);

                    // Log result
                    Log::info("Delete result for user {$id}: ".($result ? 'success' : 'failed'));

                    if ($result) {
                        $deletedCount++;
                    } else {
                        $errors[] = "User with ID {$id} not found or could not be deleted";
                    }
                } catch (\Throwable $th) {
                    $errors[] = "Error deleting user {$id}: ".$th->getMessage();
                    Log::error("Error in batch delete for user {$id}: ".$th->getMessage());
                }
            }

            // Get query log
            $queryLog = \DB::getQueryLog();

            // Log the query information
            Log::info('Database queries executed:', [
                'queries' => $queryLog,
                'count' => count($queryLog),
            ]);

            // Prepare the response data
            $responseData = [
                'success' => $deletedCount > 0,
                'deleted' => $deletedCount,
                'failed' => count($ids) - $deletedCount,
                'message' => $deletedCount > 0
                    ? "{$deletedCount} users deleted successfully"
                    : 'No users were deleted',
                'errors' => $errors,
                'debug_queries' => $queryLog, // Include queries for debugging
            ];

            // Log the response data
            Log::info('BatchDestroy response data', $responseData);

            // Return the appropriate response based on the request type
            if ($request->header('X-Inertia')) {
                // For Inertia requests, use Inertia response
                return \Inertia\Inertia::render('users/index', [
                    'flash' => [
                        'success' => $deletedCount > 0,
                        'message' => $responseData['message'],
                        'data' => $responseData,
                    ],
                ]);
            } elseif ($request->wantsJson()) {
                // For API requests
                return response()->json($responseData, $deletedCount > 0 ? 200 : 422);
            }

            // For regular web requests
            return redirect()->back()->with([
                'success' => $deletedCount > 0,
                'message' => $responseData['message'],
                'data' => $responseData,
            ]);

        } catch (\Throwable $th) {
            Log::error('UserController batchDestroy error: '.$th->getMessage(), [
                'message' => $th->getMessage(),
                'file' => $th->getFile(),
                'line' => $th->getLine(),
            ]);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'An unexpected error occurred during batch delete',
                    'error' => $th->getMessage(),
                ], 500);
            }

            return redirect()->back()->withErrors([
                'error' => 'An unexpected error occurred: '.$th->getMessage(),
            ]);
        }
    }
}
