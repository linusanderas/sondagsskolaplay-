<?php

namespace Database\Seeders;

use App\Models\AccessGrant;
use App\Models\Collection;
use App\Models\Organization;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Models\Video;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@sondagsskolaplay.local'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]
        );

        $fullPlan = Plan::query()->updateOrCreate(
            ['slug' => 'full'],
            [
                'name' => 'Årsprenumeration (alla program)',
                'access_type' => 'full',
                'price_ore' => 750_00,
                'billing_period' => 'monthly',
                'description' => 'Tillgång till alla publicerade program. Manuell faktura.',
                'is_active' => true,
            ]
        );

        $resourcePlan = Plan::query()->updateOrCreate(
            ['slug' => 'resource'],
            [
                'name' => 'Resurspaket',
                'access_type' => 'resource',
                'price_ore' => 4250_00,
                'billing_period' => 'yearly',
                'description' => 'Tillgång till urval via AccessGrant / Collection. Manuell faktura.',
                'is_active' => true,
            ]
        );

        $videos = collect([
            ['title' => 'Avsnitt 1', 'episode_number' => 1, 'vimeo_id' => 'demo-1', 'is_preview' => true],
            ['title' => 'Avsnitt 2', 'episode_number' => 2, 'vimeo_id' => 'demo-2', 'is_preview' => false],
            ['title' => 'Avsnitt 3', 'episode_number' => 3, 'vimeo_id' => 'demo-3', 'is_preview' => false],
            ['title' => 'Provavsnitt 16', 'episode_number' => 16, 'vimeo_id' => '252012700', 'is_preview' => true],
            ['title' => 'Provavsnitt 17', 'episode_number' => 17, 'vimeo_id' => '253013275', 'is_preview' => true],
        ])->map(function (array $attrs) {
            return Video::query()->updateOrCreate(
                ['episode_number' => $attrs['episode_number']],
                [
                    'title' => $attrs['title'],
                    'vimeo_id' => $attrs['vimeo_id'],
                    'status' => 'published',
                    'is_preview' => $attrs['is_preview'],
                    'description' => 'Seedad demovideo för admin-MVP.',
                ]
            );
        });

        $collection = Collection::query()->updateOrCreate(
            ['slug' => 'resurspaket-1-3'],
            [
                'name' => 'Resurspaket 1–3',
                'description' => 'Exempelcollection för AccessGrant.',
            ]
        );

        $collection->videos()->sync(
            $videos->take(3)->values()->mapWithKeys(
                fn (Video $video, int $index) => [$video->id => ['sort_order' => $index]]
            )->all()
        );

        $orgFull = Organization::query()->updateOrCreate(
            ['name' => 'Exempelförsamling Full'],
            [
                'contact_email' => 'full@example.local',
                'internal_notes' => 'Demoorg med full plan (active).',
            ]
        );

        $orgResource = Organization::query()->updateOrCreate(
            ['name' => 'Exempelförsamling Resurs'],
            [
                'contact_email' => 'resurs@example.local',
                'internal_notes' => 'Demoorg med resurspaket + AccessGrant.',
            ]
        );

        $customer = User::query()->updateOrCreate(
            ['email' => 'kund@sondagsskolaplay.local'],
            [
                'name' => 'Kundkontakt',
                'password' => Hash::make('password'),
                'role' => 'customer',
            ]
        );

        $orgFull->users()->syncWithoutDetaching([
            $customer->id => ['role' => 'owner'],
        ]);

        Subscription::query()->updateOrCreate(
            [
                'organization_id' => $orgFull->id,
                'plan_id' => $fullPlan->id,
            ],
            [
                'status' => 'active',
                'starts_at' => now()->subMonth(),
                'ends_at' => now()->addYear(),
                'notes' => 'Faktura skickad manuellt (demo).',
            ]
        );

        Subscription::query()->updateOrCreate(
            [
                'organization_id' => $orgResource->id,
                'plan_id' => $resourcePlan->id,
            ],
            [
                'status' => 'active',
                'starts_at' => now()->subMonth(),
                'ends_at' => now()->addYear(),
                'notes' => 'Resurspaket — tillgång via AccessGrant.',
            ]
        );

        AccessGrant::query()->firstOrCreate(
            [
                'organization_id' => $orgResource->id,
                'grantable_type' => Collection::class,
                'grantable_id' => $collection->id,
            ],
            ['notes' => 'Tilldelad collection Resurspaket 1–3']
        );

        AccessGrant::query()->firstOrCreate(
            [
                'organization_id' => $orgResource->id,
                'grantable_type' => Video::class,
                'grantable_id' => $videos->last()->id,
            ],
            ['notes' => 'Extra enstaka video']
        );

        // Keep $admin referenced for clarity in seed output.
        unset($admin);
    }
}
