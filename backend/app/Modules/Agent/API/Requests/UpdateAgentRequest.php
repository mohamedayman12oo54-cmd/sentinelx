<?php

namespace App\Modules\Agent\API\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateAgentRequest extends FormRequest
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
            'name' => ['sometimes', 'string', 'min:1', 'max:255'],
            'framework' => ['sometimes', 'string', 'min:1', 'max:100'],
            'framework_version' => ['sometimes', 'nullable', 'string', 'max:50'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            // Immutable via this endpoint — status only changes via Archive,
            // organization_id is never client-supplied. See 03-lifecycle.md §3.
            'organization_id' => ['prohibited'],
            'status' => ['prohibited'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $mutableFields = ['name', 'framework', 'framework_version', 'description'];

            if (empty(array_intersect($mutableFields, array_keys($this->mutableInput())))) {
                $validator->errors()->add('_', 'At least one field must be provided.');
            }
        });
    }

    /**
     * `validated()` cannot be called before validation finishes — this
     * reads the raw input instead, restricted to the fields we care about.
     *
     * @return array<string, mixed>
     */
    private function mutableInput(): array
    {
        return $this->only(['name', 'framework', 'framework_version', 'description']);
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
