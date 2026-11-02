<?php

namespace Tests\Feature;

use App\Models\Collection;
use App\Models\Organization;
use App\Models\Plan;
use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAuthFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_manage_org_subscription_and_grants(): void
    {
        $admin = User::factory()->admin()->create([
            'email' => 'admin@sondagsskolaplay.local',
        ]);

        $plan = Plan::query()->create([
            'name' => 'Resurspaket',
            'slug' => 'resource',
            'access_type' => 'resource',
            'is_active' => true,
        ]);

        $video = Video::query()->create([
            'title' => 'Avsnitt 1',
            'episode_number' => 1,
            'status' => 'published',
            'is_preview' => false,
        ]);

        $collection = Collection::query()->create([
            'name' => 'Paket',
            'slug' => 'paket',
        ]);
        $collection->videos()->attach($video->id, ['sort_order' => 0]);

        $this->actingAs($admin)
            ->postJson('/api/admin/organizations', [
                'name' => 'Bankeryd Pingst',
                'contact_email' => 'bankeryd@example.com',
            ])
            ->assertCreated();

        $org = Organization::query()->firstOrFail();

        $this->actingAs($admin)
            ->postJson('/api/admin/users', [
                'name' => 'Kontakt',
                'email' => 'kontakt@example.com',
                'password' => 'password123',
                'organization_id' => $org->id,
                'organization_role' => 'owner',
            ])
            ->assertCreated();

        $this->actingAs($admin)
            ->postJson('/api/admin/subscriptions', [
                'organization_id' => $org->id,
                'plan_id' => $plan->id,
                'status' => 'active',
                'notes' => 'Faktura skickad manuellt',
            ])
            ->assertCreated()
            ->assertJsonPath('status', 'active');

        $this->actingAs($admin)
            ->postJson('/api/admin/access-grants', [
                'organization_id' => $org->id,
                'grantable_type' => 'collection',
                'grantable_id' => $collection->id,
            ])
            ->assertCreated();

        $this->actingAs($admin)
            ->getJson("/api/admin/organizations/{$org->id}")
            ->assertOk()
            ->assertJsonPath('name', 'Bankeryd Pingst')
            ->assertJsonCount(1, 'users')
            ->assertJsonCount(1, 'subscriptions')
            ->assertJsonCount(1, 'access_grants');
    }
}
