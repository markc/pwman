<?php

namespace App\Exceptions;

use Exception;

class CustomException extends Exception
{
    protected $code = 400;
    protected $message = 'An error occurred.';

    public function __construct($message = null, $code = null)
    {
        if ($message) {
            $this->message = $message;
        }
        if ($code) {
            $this->code = $code;
        }
        parent::__construct($this->message, $this->code);
    }

    public function render()
    {
        return response()->json([
            'status' => $this->getCode(),
            'message' => $this->getMessage(),
        ], $this->getCode());
    }
}
