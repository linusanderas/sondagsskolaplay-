<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AccessGrant;
use App\Models\Collection;
use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AccessGrantController extends Controller
{
    public function index(Request $request)
    {
        $query = AccessGrant::query()
            ->with(['organization', 'grantable'])
            ->latest();

        if ($request->filled('organization_id')) {
            $query->where('organization_id', $request->integer('organization_id'));
        }

        return response()->json($query->paginate(100));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'organization_id' => ['required', 'exists:organizations,id'],
            'grantable_type' => ['required', Rule::in(['video', 'collection'])],
            'grantable_id' => ['required', 'integer'],
            'notes' => ['nullable', 'string'],
        ]);

        $modelClass = $this->resolveGrantableClass($data['grantable_type']);

        if (! $modelClass::query()->whereKey($data['grantable_id'])->exists()) {
            throw ValidationException::withMessages([
                'grantable_id' => ['Vald video eller collection finns inte.'],
            ]);
        }

        $grant = AccessGrant::create([
            'organization_id' => $data['organization_id'],
            'grantable_type' => $modelClass,
            'grantable_id' => $data['grantable_id'],
            'notes' => $data['notes'] ?? null,
        ]);

        return response()->json(
            $grant->load(['organization', 'grantable']),
            201
        );
    }

    public function destroy(AccessGrant $accessGrant)
    {
        $accessGrant->delete();

        return response()->json(null, 204);
    }

    /**
     * @return class-string
     */
    private function resolveGrantableClass(string $type): string
    {
        return match ($type) {
            'video' => Video::class,
            'collection' => Collection::class,
        };
    }
}
