<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Collection extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
    ];

    public function videos(): BelongsToMany
    {
        return $this->belongsToMany(Video::class)
            ->withPivot('sort_order')
            ->withTimestamps();
    }

    public function accessGrants(): MorphMany
    {
        return $this->morphMany(AccessGrant::class, 'grantable');
    }
}
