<?php

namespace App\Modules\Agent\API\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreAgentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:1', 'max:255'],
            'framework' => ['required', 'string', 'min:1', 'max:100'],
            'framework_version' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string', 'max:2000'],
            // organization_id and status are never accepted from the request
            // body — always server-derived. Rejected outright (422), never
            // silently stripped. See 03-lifecycle.md §2 and 06-api-contract.md §4.
            'organization_id' => ['prohibited'],
            'status' => ['prohibited'],
        ];
    }

    /**
     * Matches the platform-wide nested error envelope
     * (docs/09-api-reference/07-ERROR_CODES.md), not Laravel's default
     * validation error shape.
     */
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'error' => [
                'code' => 'VALIDATION_ERROR',
                'message' => 'The given data was invalid.',
                'details' => $validator->errors()->toArray(),
            ],
        ], 422));
    }
}
