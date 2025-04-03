<?php

namespace App\Repositories\User;

interface UserRepositoryInterface
{
    public function userDataTable($request);

    public function createUser($request);

    // CRUD operations
    public function create(array $data);

    public function update($id, array $data);

    public function delete($id);

    public function findById($id);
}
