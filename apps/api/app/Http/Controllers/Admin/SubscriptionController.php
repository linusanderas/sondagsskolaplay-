<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SubscriptionController extends Controller
{
    public const STATUSES = [
        'pending',
        'active',
        'past_due',
        'paused',
        'ended',
        'cancelled',
    ];

    public function index(Request $request)
    {
        $query = Subscription::query()
            ->with(['organization', 'plan'])
            ->latest();

        if ($request->filled('organization_id')) {
            $query->where('organization_id', $request->integer('organization_id'));
        }

        return response()->json($query->paginate(50));
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);

        $subscription = Subscription::create($data);

        return response()->json(
            $subscription->load(['organization', 'plan']),
            201
        );
    }

    public function update(Request $request, Subscription $subscription)
    {
        $subscription->update($this->validated($request, updating: true));

        return response()->json(
            $subscription->fresh()->load(['organization', 'plan'])
        );
    }

    public function destroy(Subscription $subscription)
    {
        $subscription->delete();

        return response()->json(null, 204);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, bool $updating = false): array
    {
        $required = $updating ? 'sometimes' : 'required';

        return $request->validate([
            'organization_id' => [$required, 'exists:organizations,id'],
            'plan_id' => [$required, 'exists:plans,id'],
            'status' => [$required, Rule::in(self::STATUSES)],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'notes' => ['nullable', 'string'],
        ]);
    }
}
