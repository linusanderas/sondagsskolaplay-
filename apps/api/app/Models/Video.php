<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Video extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'episode_number',
        'description',
        'participants',
        'vimeo_id',
        'status',
        'is_preview',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_preview' => 'boolean',
            'episode_number' => 'integer',
        ];
    }

    public function collections(): BelongsToMany
    {
        return $this->belongsToMany(Collection::class)
            ->withPivot('sort_order')
            ->withTimestamps();
    }

    public function accessGrants(): MorphMany
    {
        return $this->morphMany(AccessGrant::class, 'grantable');
    }
}
