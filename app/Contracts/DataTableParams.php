<?php

namespace App\Contracts;

interface DataTableParams
{
    public function getPage(): ?int;

    public function getPerPage(): ?int;
}
