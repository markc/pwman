<?php

namespace App\Http\Controllers;

use App\Exceptions\CustomException;
use App\Repositories\User\UserRepositoryInterface;
use App\Services\DataTableParamsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    protected $repo;

    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->repo = $userRepository;
    }

    public function userDataTable(Request $request): JsonResponse
    {
        try {
            $validatedQueryParams = new DataTableParamsService($request);

            $users = $this->repo->userDataTable($validatedQueryParams);

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

            if ($request->wantsJson()) {
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
        try {
            // Different validation for update - email unique except current user
            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|string|email|max:255|unique:users,email,'.$id,
                'password' => 'sometimes|string|min:8',
            ]);

            $user = $this->repo->update($id, $validated);

            if ($request->wantsJson()) {
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

            if ($request->wantsJson()) {
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

            if ($request->wantsJson()) {
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
                'is_ajax' => $request->ajax() ? 'yes' : 'no'
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
                'count' => count($queryLog)
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
