<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OrganizationController extends Controller
{
    public function index(Request $request)
    {
        $query = Organization::query()
            ->withCount(['users', 'subscriptions', 'accessGrants'])
            ->orderBy('name');

        if ($search = $request->string('q')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('contact_email', 'like', "%{$search}%")
                    ->orWhere('organization_number', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate(50));
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);

        $organization = Organization::create($data);

        return response()->json($organization, 201);
    }

    public function show(Organization $organization)
    {
        $organization->load([
            'users',
            'subscriptions.plan',
            'accessGrants.grantable',
        ]);

        return response()->json($organization);
    }

    public function update(Request $request, Organization $organization)
    {
        $organization->update($this->validated($request));

        return response()->json($organization->fresh());
    }

    public function destroy(Organization $organization)
    {
        $organization->delete();

        return response()->json(null, 204);
    }

    public function attachUser(Request $request, Organization $organization)
    {
        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'role' => ['nullable', Rule::in(['owner', 'member'])],
        ]);

        $organization->users()->syncWithoutDetaching([
            $data['user_id'] => ['role' => $data['role'] ?? 'member'],
        ]);

        return response()->json(
            $organization->fresh()->load('users')
        );
    }

    public function detachUser(Organization $organization, User $user)
    {
        $organization->users()->detach($user->id);

        return response()->json(
            $organization->fresh()->load('users')
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'organization_number' => ['nullable', 'string', 'max:64'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:64'],
            'invoice_address' => ['nullable', 'string'],
            'internal_notes' => ['nullable', 'string'],
        ]);
    }
}
