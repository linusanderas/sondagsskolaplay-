<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminOrganizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_list_organizations(): void
    {
        $this->getJson('/api/admin/organizations')->assertUnauthorized();
    }

    public function test_customer_cannot_list_organizations(): void
    {
        $user = User::factory()->create(['role' => 'customer']);

        $this->actingAs($user)
            ->getJson('/api/admin/organizations')
            ->assertForbidden();
    }

    public function test_admin_can_create_and_list_organizations(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->postJson('/api/admin/organizations', [
                'name' => 'Testförsamling',
                'contact_email' => 'test@example.com',
            ])
            ->assertCreated()
            ->assertJsonPath('name', 'Testförsamling');

        $this->actingAs($admin)
            ->getJson('/api/admin/organizations')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Testförsamling']);

        $this->assertDatabaseHas('organizations', ['name' => 'Testförsamling']);
        $this->assertInstanceOf(Organization::class, Organization::query()->first());
    }
}
